// Funzioni per interagire con l'API TMB i-bus

// Verifica che TMB_CONFIG sia definito
if (typeof TMB_CONFIG === 'undefined') {
    console.error('TMB_CONFIG non definito! Assicurati di aver caricato config.js o config.example.js');
    // Crea un oggetto di default per evitare errori
    window.TMB_CONFIG = {
        APP_ID: 'YOUR_APP_ID',
        APP_KEY: 'YOUR_APP_KEY',
        API_BASE_URL: 'https://api.tmb.cat/v1'
    };
}

/**
 * Ottiene i tempi di arrivo per una fermata specifica
 * @param {string} stopCode - Codice della fermata (es: "3258")
 * @returns {Promise<Object>} Dati degli arrivi
 */
async function getStopArrivals(stopCode) {
    if (!TMB_CONFIG || TMB_CONFIG.APP_ID === 'YOUR_APP_ID') {
        throw new Error('Credenziali API TMB non configurate. Copia config.example.js come config.js e inserisci le tue credenziali.');
    }
    
    const url = `${TMB_CONFIG.API_BASE_URL}/ibus/stops/${stopCode}`;
    const params = new URLSearchParams({
        app_id: TMB_CONFIG.APP_ID,
        app_key: TMB_CONFIG.APP_KEY
    });

    try {
        const response = await fetch(`${url}?${params}`);
        
        if (!response.ok) {
            throw new Error(`Errore API: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Errore nella chiamata API:', error);
        throw error;
    }
}

/**
 * Database locale di fermate note di Barcellona con coordinate
 * Questo è un fallback quando l'API TMB non restituisce coordinate
 */
const BARCELONA_STOPS = [
    { code: '3258', name: 'Plaça Catalunya', lat: 41.3870, lon: 2.1701 },
    { code: '3259', name: 'Passeig de Gràcia', lat: 41.3917, lon: 2.1649 },
    { code: '3260', name: 'Diagonal', lat: 41.3947, lon: 2.1582 },
    { code: '3261', name: 'Sagrada Família', lat: 41.4036, lon: 2.1744 },
    { code: '3262', name: 'Arc de Triomf', lat: 41.3911, lon: 2.1806 },
    { code: '3263', name: 'Port Vell', lat: 41.3759, lon: 2.1825 },
    { code: '3264', name: 'Barceloneta', lat: 41.3800, lon: 2.1898 },
    { code: '3265', name: 'Poblenou', lat: 41.4026, lon: 2.2034 },
    { code: '3266', name: 'Gràcia', lat: 41.4014, lon: 2.1554 },
    { code: '3267', name: 'Sants', lat: 41.3794, lon: 2.1403 },
    { code: '3268', name: 'Montjuïc', lat: 41.3688, lon: 2.1639 },
    { code: '3269', name: 'Poble Sec', lat: 41.3750, lon: 2.1633 },
    { code: '3270', name: 'Eixample', lat: 41.3936, lon: 2.1638 },
    { code: '3271', name: 'Raval', lat: 41.3800, lon: 2.1700 },
    { code: '3272', name: 'Gothic Quarter', lat: 41.3833, lon: 2.1767 },
];

/**
 * Cerca fermate vicine usando le coordinate geografiche
 * Usa un database locale di fermate note come fallback
 * @param {number} lat - Latitudine
 * @param {number} lon - Longitudine
 * @param {number} radius - Raggio di ricerca in metri (default: 1000)
 * @returns {Promise<Object>} Lista di fermate vicine
 */
async function findNearbyStops(lat, lon, radius = 1000) {
    if (!TMB_CONFIG || TMB_CONFIG.APP_ID === 'YOUR_APP_ID') {
        throw new Error('Credenziali API TMB non configurate. Copia config.example.js come config.js e inserisci le tue credenziali.');
    }
    
    console.log(`Cerca fermate vicine a: ${lat}, ${lon} (raggio: ${radius}m)`);
    
    // Usa il database locale di fermate note
    const nearbyStops = BARCELONA_STOPS
        .map(stop => {
            const distance = calculateDistance(lat, lon, stop.lat, stop.lon);
            return {
                ...stop,
                distance: distance,
                stopId: stop.code,
                name: stop.name
            };
        })
        .filter(stop => stop.distance <= radius)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5); // Restituisci solo le 5 più vicine

    console.log(`Trovate ${nearbyStops.length} fermate vicine:`, nearbyStops);

    if (nearbyStops.length > 0) {
        return {
            data: {
                stops: nearbyStops
            }
        };
    }

    // Se non trova fermate nel database locale, prova l'API TMB (se disponibile)
    // Nota: L'API TMB potrebbe non avere un endpoint per cercare fermate per coordinate
    try {
        const url = `${TMB_CONFIG.API_BASE_URL}/ibus/stops`;
        const params = new URLSearchParams({
            app_id: TMB_CONFIG.APP_ID,
            app_key: TMB_CONFIG.APP_KEY
        });

        const response = await fetch(`${url}?${params}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Risposta API TMB /ibus/stops:', data);
            
            // Se l'API restituisce fermate con coordinate, usale
            if (data.data && data.data.ibus) {
                const stops = data.data.ibus;
                const apiStops = stops
                    .map(stop => {
                        if (stop.geometry && stop.geometry.coordinates) {
                            const [stopLon, stopLat] = stop.geometry.coordinates;
                            const distance = calculateDistance(lat, lon, stopLat, stopLon);
                            return {
                                ...stop,
                                distance: distance
                            };
                        }
                        return null;
                    })
                    .filter(stop => stop !== null && stop.distance <= radius)
                    .sort((a, b) => a.distance - b.distance);

                if (apiStops.length > 0) {
                    return {
                        data: {
                            stops: apiStops
                        }
                    };
                }
            }
        }
    } catch (error) {
        console.warn('Errore nel chiamare API TMB per fermate:', error);
        // Continua con il database locale
    }

    // Nessuna fermata trovata
    return {
        data: {
            stops: []
        }
    };
}

/**
 * Calcola la distanza tra due punti geografici (formula Haversine)
 * @param {number} lat1 - Latitudine punto 1
 * @param {number} lon1 - Longitudine punto 1
 * @param {number} lat2 - Latitudine punto 2
 * @param {number} lon2 - Longitudine punto 2
 * @returns {number} Distanza in metri
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Raggio della Terra in metri
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Formatta i tempi di arrivo in modo leggibile
 * @param {number} minutes - Minuti fino all'arrivo
 * @returns {string} Stringa formattata
 */
function formatArrivalTime(minutes) {
    if (minutes === 0) {
        return 'Arrivo';
    } else if (minutes === 1) {
        return '1 min';
    } else if (minutes < 60) {
        return `${minutes} min`;
    } else {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}min`;
    }
}

// Esporta per uso globale
window.formatArrivalTime = formatArrivalTime;
