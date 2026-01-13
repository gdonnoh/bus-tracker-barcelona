// Logica principale dell'applicazione

let currentStopCode = null;
let refreshTimeout = null; // Timeout per l'auto-refresh

// Elementi DOM
const findNearestBtn = document.getElementById('findNearestBtn');
const searchByCodeBtn = document.getElementById('searchByCodeBtn');
const stopCodeInput = document.getElementById('stopCodeInput');
const locationStatus = document.getElementById('locationStatus');
const stopInfo = document.getElementById('stopInfo');
const arrivalsSection = document.getElementById('arrivalsSection');
const arrivalsList = document.getElementById('arrivalsList');
const loadingArrivals = document.getElementById('loadingArrivals');
const errorMessage = document.getElementById('errorMessage');

// Event listeners
findNearestBtn.addEventListener('click', findNearestStop);
searchByCodeBtn.addEventListener('click', searchByStopCode);
stopCodeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchByStopCode();
    }
});

/**
 * Trova la fermata più vicina usando la geolocalizzazione
 */
async function findNearestStop() {
    findNearestBtn.disabled = true;
    showStatus('Richiesta posizione...', 'info');

    if (!navigator.geolocation) {
        showError('La geolocalizzazione non è supportata dal tuo browser');
        findNearestBtn.disabled = false;
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            showStatus(`Posizione trovata: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, 'info');
            
            try {
                // Nota: L'API TMB potrebbe non avere un endpoint diretto per fermate vicine
                // In questo caso, potresti dover usare un database locale o un'altra API
                // Per ora, mostriamo un messaggio e permettiamo la ricerca manuale
                
                // Esempio: coordinate di Barcellona centro
                // lat: 41.3851, lon: 2.1734
                
                showStatus('Ricerca fermate vicine...', 'info');
                
                // Ottieni tutti gli arrivi combinati (bus + metro) ordinati per tempo
                const allArrivals = await getAllNearbyArrivals(latitude, longitude, 2000);
                
                console.log('Arrivi combinati trovati:', allArrivals);
                
                if (allArrivals.length > 0) {
                    // Mostra i primi 3 arrivi più vicini
                    const topArrivals = allArrivals.slice(0, 3);
                    displayCombinedArrivals(topArrivals);
                } else {
                    // Nessuna fermata trovata
                    showStatus(`Nessuna fermata trovata entro 2km. Posizione: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}. Usa la ricerca manuale con un codice fermata.`, 'info');
                    console.warn('Nessuna fermata trovata. Coordinate:', latitude, longitude);
                }
            } catch (error) {
                console.error('Errore nella ricerca:', error);
                showError(`Errore: ${error.message}. Prova a cercare manualmente per codice fermata.`);
            } finally {
                findNearestBtn.disabled = false;
            }
        },
        (error) => {
            console.error('Errore geolocalizzazione:', error);
            let errorMsg = 'Errore nel trovare la posizione. ';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMsg += 'Permesso negato. Abilita la geolocalizzazione nel browser.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMsg += 'Posizione non disponibile.';
                    break;
                case error.TIMEOUT:
                    errorMsg += 'Timeout nella richiesta.';
                    break;
            }
            showError(errorMsg);
            findNearestBtn.disabled = false;
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

/**
 * Cerca una fermata per codice
 */
async function searchByStopCode() {
    const code = stopCodeInput.value.trim();
    
    if (!code) {
        showError('Inserisci un codice fermata');
        return;
    }

    searchByCodeBtn.disabled = true;
    hideError();
    
    try {
        // Prima prova a ottenere gli arrivi direttamente
        // Se la fermata esiste, mostriamo le informazioni
        await loadArrivals(code);
        
        // Mostra informazioni base sulla fermata
        displayStopInfo({
            code: code,
            name: `Fermata ${code}`,
            distance: null
        });
        
        stopCodeInput.value = '';
    } catch (error) {
        console.error('Errore nella ricerca:', error);
        showError(`Fermata non trovata o errore: ${error.message}`);
    } finally {
        searchByCodeBtn.disabled = false;
    }
}

/**
 * Carica e mostra gli arrivi per una fermata
 */
async function loadArrivals(stopCode) {
    currentStopCode = stopCode;
    arrivalsSection.classList.remove('hidden');
    arrivalsList.innerHTML = '';
    loadingArrivals.classList.remove('hidden');
    hideError();

    try {
        const data = await getStopArrivals(stopCode);
        
        loadingArrivals.classList.add('hidden');
        
        // Debug: log della risposta API
        console.log('Risposta API:', data);
        
        // Gestisci la struttura reale dell'API TMB
        if (data.status === 'success' && data.data && data.data.ibus && data.data.ibus.length > 0) {
            const arrivals = data.data.ibus;
            displayArrivals(arrivals);
        } else if (data.data && data.data.ibus && data.data.ibus.length > 0) {
            // Fallback per struttura alternativa
            const arrivals = data.data.ibus;
            displayArrivals(arrivals);
        } else {
            arrivalsList.innerHTML = '<div class="no-arrivals">Nessun arrivo previsto al momento</div>';
        }
    } catch (error) {
        loadingArrivals.classList.add('hidden');
        showError(`Errore nel caricamento arrivi: ${error.message}`);
    } finally {
        loadArrivals.loading = false;
    }
}

/**
 * Mostra arrivi combinati (bus + metro) nella UI
 */
function displayCombinedArrivals(arrivals) {
    arrivalsSection.classList.remove('hidden');
    arrivalsList.innerHTML = '';
    loadingArrivals.classList.add('hidden');
    hideError();
    
    if (!arrivals || arrivals.length === 0) {
        arrivalsList.innerHTML = '<div class="no-arrivals">Nessun arrivo previsto al momento</div>';
        return;
    }
    
    arrivals.forEach(arrival => {
        const item = document.createElement('div');
        item.className = 'arrival-item';
        
        const minutes = arrival['t-in-min'] !== undefined ? arrival['t-in-min'] : Math.floor((arrival['t-in-s'] || 0) / 60);
        const seconds = arrival['t-in-s'] || 0;
        
        let timeText = '';
        let timeClass = '';
        
        if (arrival['text-ca'] === 'imminent' || (minutes === 0 && seconds <= 60)) {
            timeText = seconds > 0 ? `${seconds}s` : 'Arrivo';
            timeClass = 'now';
        } else if (minutes <= 3) {
            timeText = `${minutes}min`;
            timeClass = 'soon';
        } else {
            timeText = `${minutes}min`;
        }
        
        const typeIcon = arrival.type === 'metro' ? '🚇' : '🚌';
        const lineText = `${typeIcon} ${arrival.line || 'N/A'}`;
        
        item.innerHTML = `
            <div class="bus-line">${lineText}</div>
            <div class="bus-destination">${arrival.destination || 'Destinazione sconosciuta'}</div>
            <div class="bus-time ${timeClass}">${timeText}</div>
        `;
        
        arrivalsList.appendChild(item);
    });
}

/**
 * Mostra gli arrivi nella UI
 */
function displayArrivals(arrivals) {
    arrivalsList.innerHTML = '';
    
    if (!arrivals || arrivals.length === 0) {
        arrivalsList.innerHTML = '<div class="no-arrivals">Nessun arrivo previsto al momento</div>';
        return;
    }

    // Ordina per tempo di arrivo (usa t-in-min, fallback a t-in-s)
    const sortedArrivals = [...arrivals]
        .sort((a, b) => {
            const timeA = a['t-in-min'] !== undefined ? a['t-in-min'] : (a['t-in-s'] || 999);
            const timeB = b['t-in-min'] !== undefined ? b['t-in-min'] : (b['t-in-s'] || 999);
            return timeA - timeB;
        })
        .slice(0, 10); // Mostra solo i primi 10

    sortedArrivals.forEach(arrival => {
        const item = document.createElement('div');
        item.className = 'arrival-item';
        
        // Usa t-in-min se disponibile, altrimenti calcola da t-in-s
        const minutes = arrival['t-in-min'] !== undefined 
            ? arrival['t-in-min'] 
            : Math.floor((arrival['t-in-s'] || 0) / 60);
        const seconds = arrival['t-in-s'] || 0;
        
        // Determina la classe CSS in base al tempo
        let timeClass = '';
        if (minutes === 0 && seconds <= 60) {
            timeClass = 'now';
        } else if (minutes <= 3) {
            timeClass = 'soon';
        }
        
        // Formatta il tempo di arrivo
        let timeText = '';
        if (arrival['text-ca'] === 'imminent' || (minutes === 0 && seconds <= 60)) {
            timeText = seconds > 0 ? `${seconds}s` : 'Arrivo';
        } else {
            timeText = formatArrivalTime(minutes);
        }
        
        item.innerHTML = `
            <div class="bus-line">${arrival.line || 'N/A'}</div>
            <div class="bus-destination">${arrival.destination || 'Destinazione sconosciuta'}</div>
            <div class="bus-time ${timeClass}">${timeText}</div>
        `;
        
        arrivalsList.appendChild(item);
    });

    // Auto-refresh ogni 60 secondi (evita chiamate troppo frequenti)
    // Cancella eventuali timeout precedenti per evitare accumulo
    if (refreshTimeout) {
        clearTimeout(refreshTimeout);
    }
    refreshTimeout = setTimeout(() => {
        if (currentStopCode === stopCode) {
            loadArrivals(currentStopCode);
        }
    }, 60000); // 60 secondi invece di 30
}

/**
 * Mostra le informazioni della fermata
 */
function displayStopInfo(stop) {
    stopInfo.classList.remove('hidden');
    const stopName = stop.name || `Fermata ${stop.code}`;
    document.getElementById('stopName').textContent = stopName;
    
    // Mostra tipo di fermata (Bus o Metro)
    let stopTypeText = '';
    if (stop.type === 'metro') {
        stopTypeText = '🚇 Metro';
        if (stop.lines && stop.lines.length > 0) {
            stopTypeText += ` - Linee: ${stop.lines.join(', ')}`;
        }
    } else {
        stopTypeText = '🚌 Bus';
    }
    
    document.getElementById('stopCode').textContent = `${stopTypeText} - Codice: ${stop.code || stop.stopId}`;
    
    if (stop.distance !== null && stop.distance !== undefined) {
        const distanceText = stop.distance < 1000 
            ? `${Math.round(stop.distance)} metri`
            : `${(stop.distance / 1000).toFixed(2)} km`;
        document.getElementById('stopDistance').textContent = `Distanza: ${distanceText}`;
    } else {
        document.getElementById('stopDistance').textContent = '';
    }
}

/**
 * Mostra un messaggio di stato
 */
function showStatus(message, type = 'info') {
    locationStatus.textContent = message;
    locationStatus.className = `status-message ${type}`;
    locationStatus.classList.remove('hidden');
}

/**
 * Mostra un errore
 */
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
}

/**
 * Nasconde il messaggio di errore
 */
function hideError() {
    errorMessage.classList.add('hidden');
}

// Verifica configurazione all'avvio (dopo che tutti gli script sono caricati)
window.addEventListener('DOMContentLoaded', () => {
    // Aspetta un attimo per assicurarsi che tutti gli script siano caricati
    setTimeout(() => {
        if (typeof TMB_CONFIG === 'undefined') {
            showError('⚠️ File config.js non trovato. Copia config.example.js come config.js e inserisci le tue credenziali API TMB.');
        } else if (TMB_CONFIG.APP_ID === 'YOUR_APP_ID' || TMB_CONFIG.APP_KEY === 'YOUR_APP_KEY') {
            // Mostra solo un warning, non un errore bloccante
            console.warn('⚠️ Configura le credenziali API TMB in config.js o config.production.js per utilizzare l\'applicazione');
            // Non mostrare errore se siamo su Vercel (potrebbe essere ancora in caricamento)
            if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                // Su produzione, aspetta un po' di più prima di mostrare l'errore
                setTimeout(() => {
                    if (TMB_CONFIG.APP_ID === 'YOUR_APP_ID' || TMB_CONFIG.APP_KEY === 'YOUR_APP_KEY') {
                        showError('⚠️ Credenziali API TMB non configurate correttamente');
                    }
                }, 1000);
            } else {
                showError('⚠️ Configura le credenziali API TMB in config.js per utilizzare l\'applicazione');
            }
        }
    }, 100);
});
