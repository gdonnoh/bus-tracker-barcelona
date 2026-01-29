#include <ESP32-HUB75-MatrixPanel-I2S-DMA.h>
#include <Adafruit_GFX.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "matrix-config.h"  // File di configurazione

// ========== VARIABILI GLOBALI ==========
MatrixPanel_I2S_DMA *dma_display = nullptr;
unsigned long lastUpdate = 0;

// ========== SETUP ==========
void setup() {
  Serial.begin(115200);

  // Aspetta fino a 5 secondi che il Serial Monitor si colleghi
  unsigned long start = millis();
  while (!Serial && millis() - start < 5000) {
    delay(10);
  }

  Serial.println("=== Bus Tracker Matrix Portal S3 ===");

  // Inizializza display
  initDisplay();

  // Connetti al WiFi
  connectWiFi();

  // Mostra messaggio iniziale
  showMessage("CONNECTING...", dma_display->color444(0, 15, 15));
  delay(1000);
}

// ========== LOOP ==========
void loop() {
  // Aggiorna i dati ogni UPDATE_INTERVAL (da matrix-config.h)
  if (millis() - lastUpdate >= UPDATE_INTERVAL || lastUpdate == 0) {
    updateBusData();
    lastUpdate = millis();
  }

  delay(100);
}

// ========== INIZIALIZZA DISPLAY ==========
void initDisplay() {
  Serial.println("Inizializzazione display...");

  HUB75_I2S_CFG mxconfig(
    PANEL_RES_X,  // Da matrix-config.h
    PANEL_RES_Y,  // Da matrix-config.h
    PANEL_CHAIN   // Da matrix-config.h
  );

  dma_display = new MatrixPanel_I2S_DMA(mxconfig);

  if (!dma_display->begin()) {
    Serial.println("ERRORE: DMA init FAILED");
    showMessage("ERROR", dma_display->color444(15, 0, 0));
    while(1) delay(1000); // Blocca se il display non funziona
  } else {
    Serial.println("Display inizializzato OK");
    dma_display->clearScreen();
  }
}

// ========== CONNETTI AL WIFI ==========
void connectWiFi() {
  Serial.print("Connessione a WiFi: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.print("WiFi connesso! IP: ");
    Serial.println(WiFi.localIP());
    showMessage("WIFI OK", dma_display->color444(0, 15, 0));
    delay(1000);
  } else {
    Serial.println();
    Serial.println("ERRORE: Connessione WiFi fallita!");
    showMessage("WIFI ERR", dma_display->color444(15, 0, 0));
    delay(2000);
  }
}

// ========== AGGIORNA DATI BUS ==========
void updateBusData() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi non connesso, riconnessione...");
    connectWiFi();
    return;
  }

  Serial.println("Aggiornamento dati bus...");
  Serial.print("Fermata: ");
  Serial.println(STOP_CODE);
  showMessage("LOADING...", dma_display->color444(0, 15, 15));

  HTTPClient http;
  String url = String(TMB_API_BASE) + "/ibus/stops/" + String(STOP_CODE);
  url += "?app_id=" + String(TMB_APP_ID);
  url += "&app_key=" + String(TMB_APP_KEY);

  http.begin(url);
  http.setTimeout(10000); // Timeout 10 secondi

  int httpCode = http.GET();

  if (httpCode == HTTP_CODE_OK) {
    String payload = http.getString();
    Serial.println("Risposta API ricevuta");
    parseAndDisplayBusData(payload);
  } else {
    Serial.print("Errore HTTP: ");
    Serial.println(httpCode);
    showMessage("API ERR", dma_display->color444(15, 0, 0));
  }

  http.end();
}

// ========== PARSE E MOSTRA DATI BUS ==========
void parseAndDisplayBusData(String json) {
  DynamicJsonDocument doc(4096);
  DeserializationError error = deserializeJson(doc, json);

  if (error) {
    Serial.print("Errore parsing JSON: ");
    Serial.println(error.c_str());
    showMessage("PARSE ERR", dma_display->color444(15, 0, 0));
    return;
  }

  // Estrai gli arrivi
  JsonArray ibus = doc["data"]["ibus"];
  
  if (!ibus || ibus.size() == 0) {
    Serial.println("Nessun arrivo trovato");
    showMessage("NO BUS", dma_display->color444(8, 8, 8));
    return;
  }

  // Ordina per tempo (più vicino prima)
  struct Arrival {
    String line;
    String destination;
    int minutes;
    int seconds;
  };

  Arrival arrivals[3];
  int arrivalCount = 0;

  for (JsonObject item : ibus) {
    if (arrivalCount >= 3) break;

    int minutes = item["t-in-min"] | 999;
    int seconds = item["t-in-s"] | 0;

    arrivals[arrivalCount].line = item["line"] | "N/A";
    arrivals[arrivalCount].destination = item["destination"] | "N/A";
    arrivals[arrivalCount].minutes = minutes;
    arrivals[arrivalCount].seconds = seconds;
    arrivalCount++;
  }

  // Ordina per tempo
  for (int i = 0; i < arrivalCount - 1; i++) {
    for (int j = i + 1; j < arrivalCount; j++) {
      int timeI = arrivals[i].minutes * 60 + arrivals[i].seconds;
      int timeJ = arrivals[j].minutes * 60 + arrivals[j].seconds;
      if (timeI > timeJ) {
        Arrival temp = arrivals[i];
        arrivals[i] = arrivals[j];
        arrivals[j] = temp;
      }
    }
  }

  // Mostra sul display
  displayArrivals(arrivals, arrivalCount);
}

// ========== MOSTRA ARRIVI SUL DISPLAY ==========
void displayArrivals(Arrival* arrivals, int count) {
  dma_display->clearScreen();

  if (count == 0) {
    showMessage("NO BUS", dma_display->color444(8, 8, 8));
    return;
  }

  // Mostra fino a 3 arrivi
  int toShow = min(count, 3);
  int startY = 2;
  int lineHeight = 10;

  for (int i = 0; i < toShow; i++) {
    int yPos = startY + (i * lineHeight);

    // Linea bus (magenta)
    String lineText = arrivals[i].line;
    lineText.toUpperCase();
    drawTextSmall(lineText, 0, yPos, dma_display->color444(15, 0, 15));

    // Tempo (verde/giallo/rosso in base alla vicinanza)
    uint16_t timeColor;
    String timeText;
    
    if (arrivals[i].minutes == 0 && arrivals[i].seconds <= 60) {
      timeText = String(arrivals[i].seconds) + "S";
      timeColor = dma_display->color444(15, 0, 0); // Rosso
    } else if (arrivals[i].minutes <= 3) {
      timeText = String(arrivals[i].minutes) + "MIN";
      timeColor = dma_display->color444(15, 10, 0); // Arancione
    } else {
      timeText = String(arrivals[i].minutes) + "MIN";
      timeColor = dma_display->color444(0, 15, 0); // Verde
    }

    // Tempo a destra
    int timeX = 64 - (timeText.length() * 4) - 2;
    drawTextSmall(timeText, timeX, yPos, timeColor);

    // Destinazione al centro (troncata se troppo lunga)
    String dest = arrivals[i].destination;
    dest.toUpperCase();
    if (dest.length() > 12) {
      dest = dest.substring(0, 12);
    }
    int destX = 20;
    drawTextSmall(dest, destX, yPos, dma_display->color444(15, 15, 15));
  }
}

// ========== FUNZIONI DI DISPLAY ==========
void showMessage(String text, uint16_t color) {
  dma_display->clearScreen();
  text.toUpperCase();
  int x = (64 - (text.length() * 6)) / 2;
  drawText(text, x, 13, color);
}

void drawText(String text, int x, int y, uint16_t color) {
  dma_display->setCursor(x, y);
  dma_display->setTextColor(color);
  dma_display->setTextSize(1);
  dma_display->print(text);
}

void drawTextSmall(String text, int x, int y, uint16_t color) {
  dma_display->setCursor(x, y);
  dma_display->setTextColor(color);
  dma_display->setTextSize(1);
  dma_display->print(text);
}
