// Funzioni per interagire con l'API TMB i-bus

/**
 * Ottiene i tempi di arrivo per una fermata specifica
 * @param {string} stopCode - Codice della fermata (es: "3258")
 * @returns {Promise<Object>} Dati degli arrivi
 */
async function getStopArrivals(stopCode) {
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
 * Cerca fermate vicine usando le coordinate geografiche
 * Nota: L'API TMB potrebbe richiedere un endpoint diverso per la ricerca per coordinate
 * Questo è un esempio che potrebbe dover essere adattato
 * @param {number} lat - Latitudine
 * @param {number} lon - Longitudine
 * @param {number} radius - Raggio di ricerca in metri (default: 500)
 * @returns {Promise<Object>} Lista di fermate vicine
 */
async function findNearbyStops(lat, lon, radius = 500) {
    // Nota: Questo endpoint potrebbe variare - controlla la documentazione TMB
    // Per ora usiamo un approccio alternativo: ottenere tutte le fermate e filtrare
    // In produzione, dovresti usare un endpoint specifico se disponibile
    
    const url = `${TMB_CONFIG.API_BASE_URL}/ibus/stops`;
    const params = new URLSearchParams({
        app_id: TMB_CONFIG.APP_ID,
        app_key: TMB_CONFIG.APP_KEY
    });

    try {
        const response = await fetch(`${url}?${params}`);
        
        if (!response.ok) {
            throw new Error(`Errore API: ${response.status}`);
        }

        const data = await response.json();
        
        // Filtra le fermate per distanza
        if (data.data && data.data.ibus) {
            const stops = data.data.ibus;
            const nearbyStops = stops
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

            return {
                data: {
                    stops: nearbyStops
                }
            };
        }

        return data;
    } catch (error) {
        console.error('Errore nella ricerca fermate:', error);
        throw error;
    }
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
