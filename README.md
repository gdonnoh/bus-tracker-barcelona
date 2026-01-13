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

#### Opzione A: Sviluppo Locale

1. Copia il file di esempio: `cp config.example.js config.js`
2. Apri `config.js` e inserisci le tue credenziali:

```javascript
const TMB_CONFIG = {
    APP_ID: 'il_tuo_app_id',
    APP_KEY: 'la_tua_app_key',
    API_BASE_URL: 'https://api.tmb.cat/v1'
};
```

**Nota:** Il file `config.js` è nel `.gitignore` per sicurezza - non committare mai le tue credenziali in sviluppo locale!

#### Opzione B: Deploy su Vercel

Per deployare su Vercel, hai due opzioni:

**Opzione 1: Creare config.js direttamente nel repository (più semplice)**
1. Crea `config.js` con le tue credenziali
2. **Rimuovi** `config.js` da `.gitignore` temporaneamente
3. Committa e pusha `config.js`
4. Deploy su Vercel
5. **Nota:** Le credenziali saranno pubbliche nel repository

**Opzione 2: Usare Environment Variables su Vercel (consigliato)**
1. Vai su [Vercel Dashboard](https://vercel.com/dashboard)
2. Seleziona il tuo progetto
3. Vai su **Settings** → **Environment Variables**
4. Aggiungi:
   - `TMB_APP_ID` = il tuo APP_ID
   - `TMB_APP_KEY` = il tuo APP_KEY
5. Crea un file `api/config.js` che legge le variabili d'ambiente (vedi esempio sotto)

**⚠️ IMPORTANTE:** Per un'app client-side statica, le credenziali API saranno visibili nel codice sorgente del browser. Se questo è un problema, considera di creare un backend API proxy.

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
