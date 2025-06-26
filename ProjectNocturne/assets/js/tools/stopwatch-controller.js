// /assets/js/tools/stopwatch-controller.js

import { getTranslation } from '../general/translations-controller.js';
import { PREMIUM_FEATURES } from '../general/main.js';

const stopwatchState = {
    isRunning: false,
    startTime: 0,
    elapsedTime: 0,
    lapNumber: 0,
    laps: [],
    timerInterval: null
};

// Elementos del DOM
let displayElement, startBtn, stopBtn, lapBtn, resetBtn, lapsTableBody, sectionBottom;

/**
 * Guarda el estado actual del cronómetro en el localStorage.
 */
function saveState() {
    const stateToSave = {
        isRunning: stopwatchState.isRunning,
        startTime: stopwatchState.startTime,
        elapsedTime: stopwatchState.elapsedTime,
        laps: stopwatchState.laps,
        lapNumber: stopwatchState.lapNumber
    };
    localStorage.setItem('stopwatchState', JSON.stringify(stateToSave));
}

/**
 * Carga el estado del cronómetro desde el localStorage.
 */
function loadState() {
    const savedState = localStorage.getItem('stopwatchState');
    if (!savedState) return;

    const parsedState = JSON.parse(savedState);
    stopwatchState.laps = parsedState.laps || [];
    stopwatchState.lapNumber = parsedState.lapNumber || 0;
    stopwatchState.startTime = parsedState.startTime || 0;
    stopwatchState.elapsedTime = parsedState.elapsedTime || 0;
    stopwatchState.isRunning = parsedState.isRunning || false;

    // Si el cronómetro estaba corriendo, se recalcula el tiempo transcurrido hasta ahora.
    if (stopwatchState.isRunning) {
        stopwatchState.elapsedTime = Date.now() - stopwatchState.startTime;
        startStopwatch(true); // Inicia el intervalo sin resetear el tiempo de inicio.
    } else {
        updateDisplay(); // Si estaba pausado, solo muestra el tiempo guardado.
    }

    // Renderiza las vueltas guardadas
    if (stopwatchState.laps.length > 0) {
        lapsTableBody.innerHTML = '';
        stopwatchState.laps.forEach(renderLap);
        sectionBottom.style.display = 'block';
    }

    updateButtonStates();
}


function formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    const ms = Math.floor((milliseconds % 1000) / 10).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}.${ms}`;
}

function updateDisplay() {
    // Si está corriendo, calcula el tiempo desde el inicio. Si no, usa el tiempo transcurrido guardado.
    const currentTime = stopwatchState.isRunning ? (Date.now() - stopwatchState.startTime) : stopwatchState.elapsedTime;
    displayElement.textContent = formatTime(currentTime);
}

function startStopwatch(isReload = false) {
    if (stopwatchState.isRunning && !isReload) return;
    
    stopwatchState.isRunning = true;
    
    // Si no es una recarga, calcula el tiempo de inicio basado en el tiempo ya transcurrido.
    if (!isReload) {
        stopwatchState.startTime = Date.now() - stopwatchState.elapsedTime;
    }
    
    clearInterval(stopwatchState.timerInterval); // Limpia cualquier intervalo previo.
    stopwatchState.timerInterval = setInterval(updateDisplay, 10);
    updateButtonStates();
    saveState();
}

function stopStopwatch() {
    if (!stopwatchState.isRunning) return;
    
    stopwatchState.isRunning = false;
    // Al detener, calcula y guarda el tiempo exacto transcurrido.
    stopwatchState.elapsedTime = Date.now() - stopwatchState.startTime;
    clearInterval(stopwatchState.timerInterval);
    updateButtonStates();
    saveState();
}

function resetStopwatch() {
    stopwatchState.isRunning = false;
    clearInterval(stopwatchState.timerInterval);
    
    stopwatchState.elapsedTime = 0;
    stopwatchState.startTime = 0;
    stopwatchState.lapNumber = 0;
    stopwatchState.laps = [];
    
    updateDisplay();
    lapsTableBody.innerHTML = '';
    sectionBottom.style.display = 'none';
    updateButtonStates();
    saveState(); // Guarda el estado reseteado.
}

function recordLap() {
    if (!stopwatchState.isRunning) return;

    const lapLimit = PREMIUM_FEATURES ? 1000 : 100;

    if (stopwatchState.lapNumber >= lapLimit) {
        // Si es premium, simplemente bloquea y no hace nada más.
        if (PREMIUM_FEATURES) {
            console.warn(`Límite de vueltas premium (${lapLimit}) alcanzado.`);
            updateButtonStates(); // Llama para asegurar que el botón se deshabilite.
            return; 
        } else {
            // Si es free, muestra una alerta pero no bloquea el botón aquí.
            alert(`Has alcanzado el límite de ${lapLimit} vueltas para la versión gratuita.`);
            return;
        }
    }

    const lapTime = Date.now() - stopwatchState.startTime;
    const previousLapTime = stopwatchState.laps.length > 0 ? stopwatchState.laps[stopwatchState.laps.length - 1].totalTime : 0;
    const lapDuration = lapTime - previousLapTime;
    stopwatchState.lapNumber++;

    const lapData = {
        lap: stopwatchState.lapNumber,
        time: lapDuration,
        totalTime: lapTime
    };
    stopwatchState.laps.push(lapData);

    renderLap(lapData);
    sectionBottom.style.display = 'block';
    saveState();
    updateButtonStates(); 
}

function renderLap(lapData) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${lapData.lap}</td>
        <td>${formatTime(lapData.time)}</td>
        <td>${formatTime(lapData.totalTime)}</td>
    `;
    lapsTableBody.prepend(row);
}

function updateButtonStates() {
    const hasTime = stopwatchState.elapsedTime > 0;
    let isLapDisabled = !stopwatchState.isRunning;

    // Solo para premium, deshabilita el botón si se alcanza el límite.
    if (PREMIUM_FEATURES) {
        const lapLimit = 1000;
        if (stopwatchState.lapNumber >= lapLimit) {
            isLapDisabled = true;
        }
    }
    
    startBtn.classList.toggle('disabled-interactive', stopwatchState.isRunning);
    stopBtn.classList.toggle('disabled-interactive', !stopwatchState.isRunning);
    lapBtn.classList.toggle('disabled-interactive', isLapDisabled);
    resetBtn.classList.toggle('disabled-interactive', stopwatchState.isRunning || !hasTime);
}

export function initializeStopwatch() {
    const stopwatchSection = document.querySelector('.section-stopwatch');
    if (!stopwatchSection) return;

    displayElement = stopwatchSection.querySelector('.tool-stopwatch span');
    startBtn = stopwatchSection.querySelector('[data-action="start"]');
    stopBtn = stopwatchSection.querySelector('[data-action="stop"]');
    lapBtn = stopwatchSection.querySelector('[data-action="lap"]');
    resetBtn = stopwatchSection.querySelector('[data-action="reset"]');
    lapsTableBody = stopwatchSection.querySelector('.laps-table tbody');
    sectionBottom = stopwatchSection.querySelector('.section-bottom');
    
    startBtn.addEventListener('click', () => startStopwatch(false));
    stopBtn.addEventListener('click', stopStopwatch);
    lapBtn.addEventListener('click', recordLap);
    resetBtn.addEventListener('click', resetStopwatch);

    // Carga el estado guardado al inicializar.
    loadState();
}