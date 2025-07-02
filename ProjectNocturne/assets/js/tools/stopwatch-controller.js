// /assets/js/tools/stopwatch-controller.js

import { getTranslation } from '../general/translations-controller.js';
import { PREMIUM_FEATURES } from '../general/main.js';
import { showDynamicIslandNotification } from '../general/dynamic-island-controller.js';
import { updateEverythingWidgets } from './everything-controller.js';

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

    if (stopwatchState.isRunning) {
        stopwatchState.elapsedTime = Date.now() - stopwatchState.startTime;
        startStopwatch(true);
    } else {
        updateDisplay();
    }

    if (stopwatchState.laps.length > 0) {
        lapsTableBody.innerHTML = '';
        stopwatchState.laps.forEach(renderLap);
        sectionBottom.classList.remove('disabled'); // Corrected line
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
    const currentTime = stopwatchState.isRunning ? (Date.now() - stopwatchState.startTime) : stopwatchState.elapsedTime;
    displayElement.textContent = formatTime(currentTime);
}

function startStopwatch(isReload = false) {
    if (stopwatchState.isRunning && !isReload) return;

    stopwatchState.isRunning = true;

    if (!isReload) {
        stopwatchState.startTime = Date.now() - stopwatchState.elapsedTime;
    }

    clearInterval(stopwatchState.timerInterval);
    stopwatchState.timerInterval = setInterval(updateDisplay, 10);
    updateButtonStates();
    saveState();
    if (!isReload) {
        updateEverythingWidgets();
    }
}

function stopStopwatch() {
    if (!stopwatchState.isRunning) return;

    stopwatchState.isRunning = false;
    stopwatchState.elapsedTime = Date.now() - stopwatchState.startTime;
    clearInterval(stopwatchState.timerInterval);
    updateButtonStates();
    saveState();
    updateEverythingWidgets();
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
    sectionBottom.classList.add('disabled'); // Corrected line
    updateButtonStates();
    saveState();
    updateEverythingWidgets();
}

function recordLap() {
    if (!stopwatchState.isRunning) return;

    const lapLimit = PREMIUM_FEATURES ? 1000 : 100;

    if (stopwatchState.lapNumber >= lapLimit) {
        if (PREMIUM_FEATURES) {
            console.warn(`Premium lap limit (${lapLimit}) reached.`);
            updateButtonStates();
            return;
        } else {
            showDynamicIslandNotification('system', 'premium_required', 'limit_reached_generic', 'notifications', {
                type: getTranslation('stopwatch', 'tooltips'),
                limit: lapLimit
            });
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
    sectionBottom.classList.remove('disabled'); // Corrected line
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

function getStopwatchDetails() {
    const state = stopwatchState;
    const time = formatTime(state.isRunning ? (Date.now() - state.startTime) : state.elapsedTime);
    const statusKey = state.isRunning ? 'running' : 'paused';
    const statusText = getTranslation(statusKey, 'stopwatch');

    if (state.elapsedTime === 0 && !state.isRunning) {
        return getTranslation('paused', 'stopwatch') + ' en 00:00:00.00';
    }

    return `${statusText} en ${time}`;
}

// <-- INICIO DE CAMBIOS -->
/**
 * Devuelve si el cronómetro está actualmente en funcionamiento.
 * @returns {boolean}
 */
function isStopwatchRunning() {
    return stopwatchState.isRunning;
}

window.stopwatchController = {
    getStopwatchDetails,
    isStopwatchRunning // Exportamos la nueva función
};
// <-- FIN DE CAMBIOS -->

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

    loadState();
}