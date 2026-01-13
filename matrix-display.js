// Logica per il display matrice LED

let currentStopCode = null;
let demoInterval = null;
let matrixCanvas, ctx;

// Scala di ingrandimento per visualizzazione (ogni pixel del canvas viene ingrandito)
const PIXEL_SCALE = 12; // 12x per vedere meglio i pixel

// Inizializza il canvas quando il DOM è pronto
function initCanvas() {
    matrixCanvas = document.getElementById('matrixCanvas');
    ctx = matrixCanvas.getContext('2d');
    
    // Imposta la dimensione visualizzata del canvas
    matrixCanvas.style.width = (matrixCanvas.width * PIXEL_SCALE) + 'px';
    matrixCanvas.style.height = (matrixCanvas.height * PIXEL_SCALE) + 'px';
    matrixCanvas.style.imageRendering = 'pixelated';
    matrixCanvas.style.imageRendering = 'crisp-edges';
    
    // Pulisci il canvas iniziale
    clearCanvas();
}

// Elementi DOM (saranno inizializzati quando il DOM è pronto)
let testStopCode, testBtn, demoBtn, stopDemoBtn;

// Inizializza event listeners
function initEventListeners() {
    testStopCode = document.getElementById('testStopCode');
    testBtn = document.getElementById('testBtn');
    demoBtn = document.getElementById('demoBtn');
    stopDemoBtn = document.getElementById('stopDemoBtn');
    
    testBtn.addEventListener('click', () => {
        const code = testStopCode.value.trim();
        if (code) {
            loadMatrixDisplay(code);
        }
    });

    demoBtn.addEventListener('click', startDemo);
    stopDemoBtn.addEventListener('click', stopDemo);
}

// Dati demo per test senza API
const demoData = [
    {
        stopCode: '3258',
        stopName: 'Fermata 3258',
        arrivals: [
            { line: 'V25', destination: 'Horta', minutes: 0, seconds: 31, text: 'imminent' },
            { line: 'V25', destination: 'Plaça Catalunya', minutes: 5, seconds: 0, text: '5 min' },
            { line: 'H12', destination: 'Gràcia', minutes: 8, seconds: 0, text: '8 min' }
        ]
    },
    {
        stopCode: '3259',
        stopName: 'Fermata 3259',
        arrivals: [
            { line: 'N4', destination: 'Barceloneta', minutes: 2, seconds: 0, text: '2 min' },
            { line: 'N4', destination: 'Poblenou', minutes: 15, seconds: 0, text: '15 min' }
        ]
    }
];

let demoIndex = 0;

/**
 * Carica e mostra i dati sul display matrice
 */
async function loadMatrixDisplay(stopCode) {
    if (!ctx) return;
    currentStopCode = stopCode;
    clearCanvas();
    drawText(ctx, 'LOADING...', 40, 16, '#00ffff', false);

    try {
        const data = await getStopArrivals(stopCode);
        console.log('Risposta API:', data);

        if (data.status === 'success' && data.data && data.data.ibus && data.data.ibus.length > 0) {
            const arrivals = data.data.ibus;
            renderMatrixDisplay(stopCode, arrivals);
        } else if (data.data && data.data.ibus && data.data.ibus.length > 0) {
            const arrivals = data.data.ibus;
            renderMatrixDisplay(stopCode, arrivals);
        } else {
            renderNoArrivals(stopCode);
        }
    } catch (error) {
        console.error('Errore:', error);
        clearCanvas();
        drawText(ctx, 'ERROR', 50, 16, '#ff0000', false);
    }
}

/**
 * Pulisce il canvas
 */
function clearCanvas() {
    if (!ctx || !matrixCanvas) return;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
}


/**
 * Renderizza il display matrice con gli arrivi - VERSIONE ULTRA SEMPLICE
 */
function renderMatrixDisplay(stopCode, arrivals) {
    if (!ctx) return;
    clearCanvas();
    
    // Ordina arrivi per tempo - mostra solo il primo
    const sortedArrivals = [...arrivals]
        .sort((a, b) => {
            const timeA = a['t-in-min'] !== undefined ? a['t-in-min'] : (a['t-in-s'] || 999);
            const timeB = b['t-in-min'] !== undefined ? b['t-in-min'] : (b['t-in-s'] || 999);
            return timeA - timeB;
        })
        .slice(0, 1);

    if (sortedArrivals.length === 0) {
        // Nessun arrivo
        drawText(ctx, 'NO BUS', 40, 13, '#888888', false);
    } else {
        const arrival = sortedArrivals[0];
        const minutes = arrival['t-in-min'] !== undefined ? arrival['t-in-min'] : Math.floor((arrival['t-in-s'] || 0) / 60);
        const seconds = arrival['t-in-s'] || 0;
        
        let timeValue = 0;
        let timeColor = '#00ff00';
        
        if (arrival['text-ca'] === 'imminent' || (minutes === 0 && seconds <= 60)) {
            timeValue = seconds > 0 ? seconds : 0;
            timeColor = '#ff0000';
        } else if (minutes <= 3) {
            timeValue = minutes;
            timeColor = '#ffaa00';
        } else {
            timeValue = minutes;
        }

        // Linea bus sopra
        const lineText = (arrival.line || 'N/A').toUpperCase();
        const lineX = Math.floor((128 - (lineText.length * 6)) / 2);
        drawText(ctx, lineText, lineX, 4, '#ff00ff', false);
        
        // Numero al centro (font normale)
        const timeText = timeValue.toString();
        const timeX = Math.floor((128 - (timeText.length * 6)) / 2);
        drawText(ctx, timeText, timeX, 14, timeColor, false);
    }

    // Auto-refresh ogni 60 secondi (evita chiamate troppo frequenti)
    // Cancella eventuali timeout precedenti per evitare accumulo
    if (window.matrixRefreshTimeout) {
        clearTimeout(window.matrixRefreshTimeout);
    }
    window.matrixRefreshTimeout = setTimeout(() => {
        if (currentStopCode === stopCode) {
            loadMatrixDisplay(stopCode);
        }
    }, 60000); // 60 secondi invece di 30
}

/**
 * Mostra messaggio "nessun arrivo" - VERSIONE MINIMALISTA
 */
function renderNoArrivals(stopCode) {
    if (!ctx) return;
    clearCanvas();
    
    const noArrText = 'NO BUS';
    const noArrX = Math.floor((128 - (noArrText.length * 6)) / 2);
    drawText(ctx, noArrText, noArrX, 13, '#888888', false);
}

/**
 * Avvia demo automatica
 */
function startDemo() {
    stopDemo();
    demoIndex = 0;
    
    function showNextDemo() {
        const demo = demoData[demoIndex % demoData.length];
        renderDemoDisplay(demo);
        demoIndex++;
    }
    
    showNextDemo();
    demoInterval = setInterval(showNextDemo, 5000); // Cambia ogni 5 secondi
}

/**
 * Ferma la demo
 */
function stopDemo() {
    if (demoInterval) {
        clearInterval(demoInterval);
        demoInterval = null;
    }
}

/**
 * Renderizza dati demo sul display - VERSIONE ULTRA SEMPLICE
 */
function renderDemoDisplay(demo) {
    if (!ctx) return;
    clearCanvas();
    
    const arrival = demo.arrivals[0];
    if (!arrival) return;
    
    let timeValue = 0;
    let timeColor = '#00ff00';
    
    if (arrival.text === 'imminent' || (arrival.minutes === 0 && arrival.seconds <= 60)) {
        timeValue = arrival.seconds > 0 ? arrival.seconds : 0;
        timeColor = '#ff0000';
    } else if (arrival.minutes <= 3) {
        timeValue = arrival.minutes;
        timeColor = '#ffaa00';
    } else {
        timeValue = arrival.minutes;
    }
    
    // Linea bus sopra
    const lineText = arrival.line.toUpperCase();
    const lineX = Math.floor((128 - (lineText.length * 6)) / 2);
    drawText(ctx, lineText, lineX, 4, '#ff00ff', false);
    
    // Numero al centro (font normale)
    const timeText = timeValue.toString();
    const timeX = Math.floor((128 - (timeText.length * 6)) / 2);
    drawText(ctx, timeText, timeX, 14, timeColor, false);
}

// Inizializza con demo se disponibile
window.addEventListener('DOMContentLoaded', () => {
    // Inizializza canvas e event listeners
    initCanvas();
    initEventListeners();
    
    // Mostra demo iniziale
    renderDemoDisplay(demoData[0]);
    
    // Verifica credenziali
    if (typeof TMB_CONFIG === 'undefined') {
        console.warn('⚠️ File config.js non trovato. Copia config.example.js come config.js e inserisci le tue credenziali API TMB.');
    } else if (TMB_CONFIG.APP_ID === 'YOUR_APP_ID' || TMB_CONFIG.APP_KEY === 'YOUR_APP_KEY') {
        console.warn('⚠️ Configura le credenziali API per testare con dati reali');
    }
});
