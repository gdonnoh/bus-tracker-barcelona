// File di esempio per la configurazione API TMB
// Copia questo file come config.js e inserisci le tue credenziali reali

// Definisci TMB_CONFIG solo se non è già stato definito (da config.production.js o config.js)
if (typeof TMB_CONFIG === 'undefined') {
    window.TMB_CONFIG = {
        APP_ID: 'YOUR_APP_ID',  // Sostituisci con il tuo APP_ID da developer.tmb.cat
        APP_KEY: 'YOUR_APP_KEY', // Sostituisci con il tuo APP_KEY da developer.tmb.cat
        API_BASE_URL: 'https://api.tmb.cat/v1'
    };
}

// Verifica che le credenziali siano state configurate (solo dopo che tutti gli script sono caricati)
// Questo controllo viene fatto in app.js dopo il DOMContentLoaded
