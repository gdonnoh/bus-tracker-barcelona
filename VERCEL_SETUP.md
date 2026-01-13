# Setup Vercel - Credenziali API TMB

## Metodo Consigliato: Environment Variables

### 1. Configura le variabili d'ambiente su Vercel

1. Vai su [Vercel Dashboard](https://vercel.com/dashboard)
2. Seleziona il tuo progetto `bus-tracker-barcelona`
3. Vai su **Settings** → **Environment Variables**
4. Aggiungi queste variabili:
   - **Name:** `TMB_APP_ID` → **Value:** `2b5ddbf2`
   - **Name:** `TMB_APP_KEY` → **Value:** `75654cf8bac70ba190b5da1591b76ba2`
5. Seleziona gli ambienti: **Production**, **Preview**, **Development**
6. Clicca **Save**

### 2. Crea un endpoint API per esporre le credenziali (Sicuro)

Crea un file `api/config.js`:

```javascript
export default function handler(req, res) {
  // Restituisci solo le credenziali necessarie per il client
  res.json({
    APP_ID: process.env.TMB_APP_ID,
    APP_KEY: process.env.TMB_APP_KEY,
    API_BASE_URL: 'https://api.tmb.cat/v1'
  });
}
```

Poi modifica `config.example.js` per fare una chiamata a questo endpoint.

### 3. Metodo Alternativo: config.js nel repository (Più semplice ma meno sicuro)

Se preferisci una soluzione più semplice:

1. Crea `config.js` con le tue credenziali:
```javascript
const TMB_CONFIG = {
    APP_ID: '2b5ddbf2',
    APP_KEY: '75654cf8bac70ba190b5da1591b76ba2',
    API_BASE_URL: 'https://api.tmb.cat/v1'
};
```

2. **Rimuovi temporaneamente** `config.js` da `.gitignore`:
```bash
# Commenta o rimuovi questa riga da .gitignore:
# config.js
```

3. Committa e pusha:
```bash
git add config.js
git commit -m "Add config.js for Vercel deployment"
git push
```

4. Deploy su Vercel

**⚠️ ATTENZIONE:** Con questo metodo, le credenziali API saranno visibili pubblicamente nel repository GitHub. Se questo è un problema, usa il Metodo 1 con Environment Variables.

## Verifica il Deploy

Dopo il deploy, verifica che l'applicazione funzioni correttamente:
- Apri l'URL di Vercel
- Prova a cercare una fermata (es: 3258)
- Controlla la console del browser per eventuali errori

## Note Importanti

- Le credenziali API TMB sono pubbliche per design (vengono usate lato client)
- L'API TMB ha rate limits, quindi non è un problema di sicurezza critico
- Se vuoi maggiore sicurezza, crea un backend API proxy che nasconde le credenziali
