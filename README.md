# Bus Tracker Barcelona 🚌

Applicazione web per tracciare gli autobus TMB a Barcellona. Mostra la fermata più vicina e i tempi di arrivo dei prossimi autobus.

## Caratteristiche

- 📍 **Trova fermata più vicina**: Usa la geolocalizzazione per trovare la fermata TMB più vicina
- ⏱️ **Tempi di arrivo in tempo reale**: Mostra quando arriveranno i prossimi autobus
- 🔍 **Ricerca manuale**: Cerca una fermata specifica inserendo il codice
- 🔄 **Auto-refresh**: Aggiorna automaticamente i tempi ogni 30 secondi
- 📱 **Design responsive**: Funziona su desktop, tablet e mobile

## Setup

### 1. Ottieni le credenziali API TMB

1. Visita [developer.tmb.cat](https://developer.tmb.cat/)
2. Crea un account
3. Registra una nuova applicazione
4. Ottieni `APP_ID` e `APP_KEY`

### 2. Configura le credenziali

1. Copia il file di esempio: `cp config.example.js config.js`
2. Apri `config.js` e inserisci le tue credenziali:

```javascript
const TMB_CONFIG = {
    APP_ID: 'il_tuo_app_id',
    APP_KEY: 'la_tua_app_key',
    API_BASE_URL: 'https://api.tmb.cat/v1'
};
```

**Nota:** Il file `config.js` è nel `.gitignore` per sicurezza - non committare mai le tue credenziali!

### 3. Avvia l'applicazione

Apri semplicemente `index.html` in un browser moderno oppure usa un server locale:

```bash
# Con Python 3
python -m http.server 8000

# Con Node.js (se hai http-server installato)
npx http-server

# Poi apri nel browser
# http://localhost:8000
```

## Utilizzo

1. **Trova fermata più vicina**: Clicca sul pulsante "Trova Fermata Più Vicina" e consenti l'accesso alla geolocalizzazione
2. **Ricerca manuale**: Inserisci il codice di una fermata (es: 3258) e clicca "Cerca"
3. Visualizza i prossimi arrivi degli autobus con i relativi tempi

## Struttura del Progetto

```
bus tracker/
├── index.html          # Struttura HTML principale
├── styles.css          # Stili CSS
├── app.js              # Logica principale dell'applicazione
├── tmb-api.js          # Funzioni per chiamare l'API TMB
├── config.example.js   # Template per configurazione (committabile)
├── config.js           # Configurazione credenziali API (NON committare!)
├── example-test.html   # Esempi e documentazione API
├── .gitignore          # File da ignorare nel git
└── README.md           # Questo file
```

## API TMB i-bus

L'applicazione utilizza l'API TMB i-bus per ottenere:
- Informazioni sulle fermate
- Tempi di arrivo in tempo reale

Documentazione: [TMB API Documentation](https://developer.tmb.cat/api-docs/v1/ibus)

## Note

- L'applicazione richiede una connessione internet attiva per funzionare
- La geolocalizzazione richiede il permesso dell'utente
- Per la geolocalizzazione in produzione, serve HTTPS (per test locali va bene anche HTTP)
- I dati sono forniti da TMB e potrebbero avere limitazioni o rate limits
- Consulta `example-test.html` per esempi di chiamate API e test

## Esempi di Codice Fermata

Alcuni esempi di codici fermata a Barcellona:
- 3258 (esempio comune)
- Cerca altri codici sulla mappa TMB o usando l'app ufficiale

## Sviluppi Futuri

- [ ] Cache delle fermate per ridurre chiamate API
- [ ] Supporto per più lingue (italiano, spagnolo, inglese)
- [ ] Mappa interattiva delle fermate
- [ ] Notifiche per arrivi imminenti
- [ ] Filtro per linea di autobus

## Licenza

Questo progetto è fornito come esempio. Assicurati di rispettare i termini di utilizzo dell'API TMB.
