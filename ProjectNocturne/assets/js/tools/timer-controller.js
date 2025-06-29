import { getTranslation } from '../general/translations-controller.js';
import { PREMIUM_FEATURES, activateModule, getCurrentActiveOverlay, allowCardMovement } from '../general/main.js';
import { prepareTimerForEdit, prepareCountToDateForEdit } from './menu-interactions.js';
import { playSound, stopSound, generateSoundList, initializeSortable } from './general-tools.js';

// --- ESTADO Y CONSTANTES ---
const TIMERS_STORAGE_KEY = 'user-timers';
const DEFAULT_TIMERS_STORAGE_KEY = 'default-timers-order';
let userTimers = [];
let defaultTimersState = [];
let activeTimers = new Map();
let pinnedTimerId = null;

const DEFAULT_TIMERS = [
    { id: 'default-timer-1', title: 'Pomodoro (25 min)', type: 'countdown', initialDuration: 1500000, remaining: 1500000, endAction: 'restart', sound: 'gentle-chime', isRunning: false, isPinned: false },
    { id: 'default-timer-2', title: 'Descanso Corto (5 min)', type: 'countdown', initialDuration: 300000, remaining: 300000, endAction: 'stop', sound: 'peaceful-tone', isRunning: false, isPinned: false },
    { id: 'default-timer-3', title: 'Ejercicio (1 min)', type: 'countdown', initialDuration: 60000, remaining: 60000, endAction: 'restart', sound: 'digital-alarm', isRunning: false, isPinned: false }
];

export function getTimersCount() {
    return userTimers.length;
}

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    initializeTimerController();
});

function initializeTimerController() {
    loadAndRestoreTimers();
    renderAllTimerCards();
    setupGlobalEventListeners();
    updateMainDisplay();
    initializeSortableGrids();
    updateMainControlsState();
    updatePinnedStatesInUI();
    updateTimerCounts();
    
    const soundListContainer = document.querySelector('.menu-timer-sound .menu-list');
    generateSoundList(soundListContainer, (soundId) => {
        const selectedSoundSpan = document.querySelector('#timer-selected-sound');
        if (selectedSoundSpan) {
            const soundName = getTranslation(soundId, 'sounds');
            selectedSoundSpan.textContent = soundName;
        }
    });

    document.addEventListener('customSoundUploaded', () => {
        const soundListContainer = document.querySelector('.menu-timer-sound .menu-list');
        generateSoundList(soundListContainer, (soundId, soundName) => {
            const selectedSoundSpan = document.querySelector('#timer-selected-sound');
            if (selectedSoundSpan) {
                selectedSoundSpan.textContent = soundName;
            }
        });
    });

    console.log('✅ Inicialización de timer completada.');
}

// --- LÓGICA DE DATOS ---

function loadAndRestoreTimers() {
    // Cargar temporizadores de usuario
    const storedUserTimers = localStorage.getItem(TIMERS_STORAGE_KEY);
    if (storedUserTimers) {
        try {
            userTimers = JSON.parse(storedUserTimers);
        } catch (e) {
            userTimers = [];
        }
    }

    // Cargar y sincronizar temporizadores predeterminados
    const storedDefaultTimers = localStorage.getItem(DEFAULT_TIMERS_STORAGE_KEY);
    if (storedDefaultTimers) {
        try {
            defaultTimersState = JSON.parse(storedDefaultTimers);
            const defaultIds = new Set(defaultTimersState.map(t => t.id));
            DEFAULT_TIMERS.forEach(defaultTimer => {
                if (!defaultIds.has(defaultTimer.id)) {
                    defaultTimersState.push({ ...defaultTimer });
                }
            });
        } catch (e) {
            defaultTimersState = JSON.parse(JSON.stringify(DEFAULT_TIMERS));
        }
    } else {
        defaultTimersState = JSON.parse(JSON.stringify(DEFAULT_TIMERS));
    }

    const allTimers = [...userTimers, ...defaultTimersState];
    const now = Date.now();

    allTimers.forEach(timer => {
        if (timer.isRunning) {
            if (timer.type === 'countdown') {
                const elapsedSinceLastSave = now - (timer.lastSaveTime || now);
                const newRemaining = Math.max(0, timer.remaining - elapsedSinceLastSave);
                timer.remaining = newRemaining;
                if (newRemaining > 0) {
                    startCountdownTimer(timer);
                } else {
                    timer.isRunning = false;
                }
            } else if (timer.type === 'count_to_date') {
                timer.remaining = new Date(timer.targetDate).getTime() - now;
                if (timer.remaining > 0) {
                    startCountToDateTimer(timer);
                } else {
                    timer.remaining = 0;
                    timer.isRunning = false;
                }
            }
        }
    });

    let pinnedTimer = allTimers.find(t => t.isPinned);
    if (!pinnedTimer && allTimers.length > 0) {
        pinnedTimer = allTimers[0];
        pinnedTimer.isPinned = true;
    }
    pinnedTimerId = pinnedTimer ? pinnedTimer.id : null;
    allTimers.forEach(t => t.isPinned = (t.id === pinnedTimerId));

    saveTimersToStorage();
    saveDefaultTimersOrder();
}


function saveTimersToStorage() {
    const now = Date.now();
    userTimers.forEach(timer => {
        if (timer.isRunning) {
            timer.lastSaveTime = now;
        }
    });
    localStorage.setItem(TIMERS_STORAGE_KEY, JSON.stringify(userTimers));
}

function saveDefaultTimersOrder() {
    const now = Date.now();
    defaultTimersState.forEach(timer => {
        if (timer.isRunning) {
            timer.lastSaveTime = now;
        }
    });
    localStorage.setItem(DEFAULT_TIMERS_STORAGE_KEY, JSON.stringify(defaultTimersState));
}

function findTimerById(timerId) {
    return userTimers.find(t => t.id === timerId) || defaultTimersState.find(t => t.id === timerId);
}

// --- LÓGICA DEL TEMPORIZADOR ---

function startTimer(timerId) {
    const timer = findTimerById(timerId);
    if (!timer || timer.isRunning) return;

    if (timer.type === 'count_to_date') {
        if (timer.remaining <= 0) return;
        startCountToDateTimer(timer);
    } else {
        if (timer.remaining <= 0) return;
        startCountdownTimer(timer);
    }
    
    updateTimerCardControls(timerId);
    updateMainControlsState();
    if (timer.type === 'user') saveTimersToStorage(); else saveDefaultTimersOrder();
}

function startCountdownTimer(timer) {
    timer.isRunning = true;
    const interval = setInterval(() => {
        timer.remaining -= 1000;
        updateCardDisplay(timer.id);
        if (timer.id === pinnedTimerId) updateMainDisplay();
        
        if (Math.floor(timer.remaining / 1000) % 2 === 0) {
            if (timer.type === 'user') saveTimersToStorage(); else saveDefaultTimersOrder();
        }
        
        if (timer.remaining < 1000) {
            handleTimerEnd(timer.id);
        }
    }, 1000);
    activeTimers.set(timer.id, interval);
}

function startCountToDateTimer(timer) {
    timer.isRunning = true;
    const interval = setInterval(() => {
        timer.remaining = new Date(timer.targetDate).getTime() - Date.now();
        updateCardDisplay(timer.id);
        if (timer.id === pinnedTimerId) updateMainDisplay();
        
        if (timer.remaining <= 0) {
            clearInterval(interval);
            activeTimers.delete(timer.id);
            timer.isRunning = false;
            if (timer.type === 'user') saveTimersToStorage(); else saveDefaultTimersOrder();
        }
    }, 1000);
    activeTimers.set(timer.id, interval);
}


function pauseTimer(timerId) {
    const timer = findTimerById(timerId);
    if (!timer || !timer.isRunning) return;
    
    timer.isRunning = false;
    clearInterval(activeTimers.get(timerId));
    activeTimers.delete(timerId);
    
    if (timer.type === 'user') saveTimersToStorage(); else saveDefaultTimersOrder();
    updateTimerCardControls(timerId);
    updateMainControlsState();
}

function resetTimer(timerId) {
    const timer = findTimerById(timerId);
    if (!timer) return;
    
    pauseTimer(timerId);
    
    if(timer.type !== 'count_to_date') {
        timer.remaining = timer.initialDuration;
    }
    timer.isRunning = false;
    
    updateCardDisplay(timerId);
    if (timer.id === pinnedTimerId) {
        updateMainDisplay();
    }
    
    if (timer.type === 'user') saveTimersToStorage(); else saveDefaultTimersOrder();
    updateTimerCardControls(timerId);
    updateMainControlsState();
}


// --- FUNCIONES DE UI Y MANEJO DE EVENTOS ---

function initializeSortableGrids() {
    if (!allowCardMovement) return;

    initializeSortable('.timers-grid-container[data-timer-grid="user"]', {
        animation: 150,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        onEnd: function() {
            const grid = document.querySelector('.timers-grid-container[data-timer-grid="user"]');
            const newOrder = Array.from(grid.querySelectorAll('.timer-card')).map(card => card.id);
            userTimers.sort((a, b) => newOrder.indexOf(a.id) - newOrder.indexOf(b.id));
            saveTimersToStorage();
        }
    });

    initializeSortable('.timers-grid-container[data-timer-grid="default"]', {
        animation: 150,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        onEnd: function() {
            const grid = document.querySelector('.timers-grid-container[data-timer-grid="default"]');
            const newOrder = Array.from(grid.querySelectorAll('.timer-card')).map(card => card.id);
            defaultTimersState.sort((a, b) => newOrder.indexOf(a.id) - newOrder.indexOf(b.id));
            saveDefaultTimersOrder();
        }
    });
}


export function addTimerAndRender(timerData) {
    const isCountToDate = timerData.type === 'count_to_date';

    const newTimer = {
        id: `timer-${Date.now()}`,
        title: timerData.title,
        type: timerData.type,
        isRunning: false,
        isPinned: false,
    };

    if (isCountToDate) {
        newTimer.targetDate = timerData.targetDate;
        newTimer.remaining = new Date(timerData.targetDate).getTime() - Date.now();
    } else {
        newTimer.initialDuration = timerData.duration;
        newTimer.remaining = timerData.duration;
        newTimer.endAction = timerData.endAction;
        newTimer.sound = timerData.sound;
    }

    userTimers.push(newTimer);

    if ((userTimers.length + defaultTimersState.length) === 1 || ![...userTimers, ...defaultTimersState].some(t => t.isPinned)) {
        newTimer.isPinned = true;
        pinnedTimerId = newTimer.id;
    }

    saveTimersToStorage();
    renderAllTimerCards();
    updateMainDisplay();
    updateMainControlsState();
    updateTimerCounts();

    if (isCountToDate) {
        startTimer(newTimer.id);
    }
}

export function updateTimer(timerId, newData) {
    const timerIndex = userTimers.findIndex(t => t.id === timerId);
    const defaultTimerIndex = defaultTimersState.findIndex(t => t.id === timerId);

    if (timerIndex === -1 && defaultTimerIndex === -1) return;

    if (activeTimers.has(timerId)) {
        clearInterval(activeTimers.get(timerId));
        activeTimers.delete(timerId);
    }
    
    const isUserTimer = timerIndex !== -1;
    const targetArray = isUserTimer ? userTimers : defaultTimersState;
    const index = isUserTimer ? timerIndex : defaultTimerIndex;
    const oldTimer = targetArray[index];

    if (newData.type === 'count_to_date') {
        targetArray[index] = {
            ...oldTimer,
            title: newData.title,
            targetDate: newData.targetDate,
            remaining: new Date(newData.targetDate).getTime() - Date.now(),
            isRunning: false
        };
        startTimer(timerId);
    } else {
        targetArray[index] = {
            ...oldTimer,
            title: newData.title,
            initialDuration: newData.duration,
            remaining: newData.duration,
            endAction: newData.endAction,
            sound: newData.sound,
            isRunning: false
        };
    }
    
    if (isUserTimer) saveTimersToStorage(); else saveDefaultTimersOrder();
    renderAllTimerCards();
    updateMainDisplay();
    updateMainControlsState();
}


function renderAllTimerCards() {
    const userContainer = document.querySelector('.timers-grid-container[data-timer-grid="user"]');
    const defaultContainer = document.querySelector('.timers-grid-container[data-timer-grid="default"]');
    if (!userContainer || !defaultContainer) return;
    
    userContainer.innerHTML = '';
    defaultContainer.innerHTML = '';
    
    userTimers.forEach(timer => {
        const card = createTimerCard(timer);
        userContainer.appendChild(card);
    });

    defaultTimersState.forEach(timer => {
        const card = createTimerCard(timer);
        defaultContainer.appendChild(card);
    });
    
    setTimeout(() => {
        updatePinnedStatesInUI();
    }, 50);
}

function createTimerCard(timer) {
    const card = document.createElement('div');
    card.className = 'timer-card';
    card.id = timer.id;
    card.dataset.id = timer.id;
    if (!timer.isRunning && timer.remaining <= 0) {
        card.classList.add('timer-finished');
    }

    const isCountdown = timer.type === 'countdown';
    const playPauseAction = timer.isRunning ? 'pause-card-timer' : 'start-card-timer';
    const playPauseIcon = timer.isRunning ? 'pause' : 'play_arrow';
    const playPauseTextKey = timer.isRunning ? 'pause' : 'play';

    card.innerHTML = `
        <div class="card-header">
            <div class="card-location-details">
                <span class="location-text" title="${timer.title}">${timer.title}</span>
            </div>
        </div>
        <div class="card-body">
            <span class="clock-time">${formatTime(timer.remaining, timer.type)}</span>
        </div>
        <div class="card-options-container">
             <button class="dismiss-timer-btn" data-action="dismiss-timer">
                <span data-translate="dismiss" data-translate-category="alarms">${getTranslation('dismiss', 'alarms')}</span>
            </button>
        </div>
        <div class="card-buttons-container">
             <button class="card-pin-btn" data-action="pin-timer" data-translate="pin_timer" data-translate-category="tooltips" data-translate-target="tooltip">
                <span class="material-symbols-rounded">push_pin</span>
            </button>
            <div class="card-options-btn-wrapper">
                 <button class="card-options-btn" data-action="toggle-timer-options" data-translate="options" data-translate-category="tooltips" data-translate-target="tooltip">
                    <span class="material-symbols-rounded">more_horiz</span>
                </button>
                <div class="card-options-menu" style="display: none;">
                    ${isCountdown ? `
                    <div class="menu-link" data-action="${playPauseAction}">
                        <div class="menu-link-icon"><span class="material-symbols-rounded">${playPauseIcon}</span></div>
                        <div class="menu-link-text"><span data-translate="${playPauseTextKey}" data-translate-category="tooltips">${getTranslation(playPauseTextKey, 'tooltips')}</span></div>
                    </div>
                    <div class="menu-link" data-action="reset-card-timer">
                        <div class="menu-link-icon"><span class="material-symbols-rounded">refresh</span></div>
                        <div class="menu-link-text"><span data-translate="reset" data-translate-category="tooltips">${getTranslation('reset', 'tooltips')}</span></div>
                    </div>
                    ` : ''}
                    <div class="menu-link" data-action="edit-timer">
                        <div class="menu-link-icon"><span class="material-symbols-rounded">edit</span></div>
                        <div class="menu-link-text"><span data-translate="edit_timer" data-translate-category="timer">${getTranslation('edit_timer', 'timer')}</span></div>
                    </div>
                    <div class="menu-link" data-action="delete-timer">
                        <div class="menu-link-icon"><span class="material-symbols-rounded">delete</span></div>
                        <div class="menu-link-text"><span data-translate="delete_timer" data-translate-category="timer">${getTranslation('delete_timer', 'timer')}</span></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    return card;
}

function updateMainDisplay() {
    const mainDisplay = document.querySelector('.tool-timer span');
    if (!mainDisplay) return;

    const pinnedTimer = findTimerById(pinnedTimerId);
    if (pinnedTimer) {
        mainDisplay.textContent = formatTime(pinnedTimer.remaining, pinnedTimer.type);
    } else {
        mainDisplay.textContent = formatTime(0, 'countdown');
    }
}

function updateMainControlsState() {
    const section = document.querySelector('.section-timer');
    if (!section) return;

    const startBtn = section.querySelector('[data-action="start-pinned-timer"]');
    const pauseBtn = section.querySelector('[data-action="pause-pinned-timer"]');
    const resetBtn = section.querySelector('[data-action="reset-pinned-timer"]');
    const buttons = [startBtn, pauseBtn, resetBtn];

    const hasTimers = (userTimers.length + defaultTimersState.length) > 0;
    const pinnedTimer = findTimerById(pinnedTimerId);
    const isPinnedCountToDate = pinnedTimer && pinnedTimer.type === 'count_to_date';

    if (!hasTimers || isPinnedCountToDate) {
        buttons.forEach(btn => btn?.classList.add('disabled-interactive'));
    } else {
        buttons.forEach(btn => btn?.classList.remove('disabled-interactive'));
        startBtn?.classList.toggle('disabled-interactive', pinnedTimer?.isRunning);
        pauseBtn?.classList.toggle('disabled-interactive', !pinnedTimer?.isRunning);
    }
}


function updateCardDisplay(timerId) {
    const card = document.getElementById(timerId);
    if (!card) return;
    const timer = findTimerById(timerId);
    if (!timer) return;

    const timeElement = card.querySelector('.clock-time');
    if (timeElement) {
        timeElement.textContent = formatTime(timer.remaining, timer.type);
    }
    card.classList.toggle('timer-finished', !timer.isRunning && timer.remaining <= 0);
}

function updateTimerCardControls(timerId) {
    const card = document.getElementById(timerId);
    if (!card) return;

    const timer = findTimerById(timerId);
    if (!timer || timer.type !== 'countdown') return;

    const playPauseLink = card.querySelector('[data-action="start-card-timer"], [data-action="pause-card-timer"]');
    if (!playPauseLink) return;

    const icon = playPauseLink.querySelector('.menu-link-icon span');
    const text = playPauseLink.querySelector('.menu-link-text span');

    if (timer.isRunning) {
        playPauseLink.dataset.action = 'pause-card-timer';
        icon.textContent = 'pause';
        text.dataset.translate = 'pause';
        text.textContent = getTranslation('pause', 'tooltips');
    } else {
        playPauseLink.dataset.action = 'start-card-timer';
        icon.textContent = 'play_arrow';
        text.dataset.translate = 'play';
        text.textContent = getTranslation('play', 'tooltips');
    }
}

function updatePinnedStatesInUI() {
    const allTimers = [...userTimers, ...defaultTimersState];
    if (!pinnedTimerId && allTimers.length > 0) {
        const firstTimer = allTimers[0];
        pinnedTimerId = firstTimer.id;
        firstTimer.isPinned = true;
        if (firstTimer.type === 'user') saveTimersToStorage(); else saveDefaultTimersOrder();
    }

    document.querySelectorAll('.timer-card').forEach(card => {
        const pinBtn = card.querySelector('.card-pin-btn');
        if (pinBtn) {
            pinBtn.classList.toggle('active', card.id === pinnedTimerId);
        }
    });
}

function formatTime(ms, type = 'countdown') {
    if (ms <= 0) {
        return type === 'count_to_date' ? getTranslation('event_finished', 'timer') || "¡Evento finalizado!" : "00:00:00";
    }

    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    
    if (type === 'count_to_date') {
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600).toString().padStart(2, '0');
        const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
        const seconds = (totalSeconds % 60).toString().padStart(2, '0');
        if (days > 0) {
            return `${days}d ${hours}h ${minutes}m ${seconds}s`;
        }
        return `${hours}:${minutes}:${seconds}`;
    } else {
        const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
        const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
        const seconds = (totalSeconds % 60).toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }
}

function handleTimerEnd(timerId) {
    const timer = findTimerById(timerId);
    if (!timer || timer.type === 'count_to_date') return;
    
    timer.isRunning = false;
    if (activeTimers.has(timerId)) {
        clearInterval(activeTimers.get(timerId));
        activeTimers.delete(timerId);
    }
    timer.remaining = 0;

    updateCardDisplay(timerId);
    if (timer.id === pinnedTimerId) updateMainDisplay();
    updateTimerCardControls(timerId);
    updateMainControlsState();
    if (timer.type === 'user') saveTimersToStorage(); else saveDefaultTimersOrder();

    if (timer.endAction === 'restart') {
        playSound(timer.sound);
        setTimeout(() => {
            stopSound();
            resetTimer(timerId);
            startTimer(timerId);
        }, 3000);

    } else {
        playSound(timer.sound);
        const card = document.getElementById(timerId);
        card?.querySelector('.card-options-container')?.classList.add('active');
    }
}

function toggleTimersSection(type) {
    const grid = document.querySelector(`.timers-grid-container[data-timer-grid="${type}"]`);
    if (!grid) return;
    const container = grid.closest('.timers-container');
    if (!container) return;
    const btn = container.querySelector('.collapse-timers-btn');
    grid.classList.toggle('active');
    btn.classList.toggle('expanded');
}

function updateTimerCounts() {
    const userTimersCount = userTimers.length;
    const defaultTimersCount = defaultTimersState.length;

    const userCountBadge = document.querySelector('.timer-count-badge[data-count-for="user"]');
    const defaultCountBadge = document.querySelector('.timer-count-badge[data-count-for="default"]');

    if (userCountBadge) userCountBadge.textContent = userTimersCount;
    if (defaultCountBadge) defaultCountBadge.textContent = defaultTimersCount;
    
    const userContainer = document.querySelector('.timers-container[data-container="user"]');
    const defaultContainer = document.querySelector('.timers-container[data-container="default"]');

    if(userContainer) userContainer.style.display = userTimersCount > 0 ? 'flex' : 'none';
    if(defaultContainer) defaultContainer.style.display = defaultTimersCount > 0 ? 'flex' : 'none';
}


function setupGlobalEventListeners() {
    const section = document.querySelector('.section-timer');
    if (!section) return;

    section.querySelector('[data-action="start-pinned-timer"]').addEventListener('click', () => {
        if (pinnedTimerId) startTimer(pinnedTimerId);
    });
    section.querySelector('[data-action="pause-pinned-timer"]').addEventListener('click', () => {
        if (pinnedTimerId) pauseTimer(pinnedTimerId);
    });
     section.querySelector('[data-action="reset-pinned-timer"]').addEventListener('click', () => {
        if (pinnedTimerId) resetTimer(pinnedTimerId);
    });

    const listWrapper = section.querySelector('.timers-list-wrapper');
    listWrapper.addEventListener('click', (e) => {
        const target = e.target.closest('[data-action]');
        if (!target) return;

        const card = target.closest('.timer-card');
        if (!card) return;
        
        const timerId = card.dataset.id;
        const action = target.dataset.action;

        switch(action) {
            case 'pin-timer': handlePinTimer(timerId); break;
            case 'toggle-timer-options': e.stopPropagation(); toggleOptionsMenu(target); break;
            case 'start-card-timer': startTimer(timerId); closeMenu(target); break;
            case 'pause-card-timer': pauseTimer(timerId); closeMenu(target); break;
            case 'reset-card-timer': resetTimer(timerId); closeMenu(target); break;
            case 'edit-timer': handleEditTimer(timerId); break;
            case 'delete-timer': handleDeleteTimer(timerId); break;
            case 'dismiss-timer': dismissTimer(timerId); break;
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.card-options-btn-wrapper')) {
            document.querySelectorAll('.card-options-menu').forEach(menu => menu.style.display = 'none');
        }
    });

    window.timerManager = {
        toggleTimersSection
    };
}


function closeMenu(target) {
    const menu = target.closest('.card-options-menu');
    if (menu) menu.style.display = 'none';
}

function handlePinTimer(timerId) {
    if (pinnedTimerId === timerId) return;
    
    const allTimers = [...userTimers, ...defaultTimersState];
    allTimers.forEach(t => t.isPinned = (t.id === timerId));
    pinnedTimerId = timerId;

    updatePinnedStatesInUI();
    updateMainDisplay();
    updateMainControlsState();
    saveTimersToStorage();
    saveDefaultTimersOrder();
}


function toggleOptionsMenu(optionsBtn) {
    const menu = optionsBtn.parentElement.querySelector('.card-options-menu');
    const isHidden = menu.style.display === 'none' || menu.style.display === '';
    document.querySelectorAll('.card-options-menu').forEach(m => m.style.display = 'none');
    if (isHidden) menu.style.display = 'flex';
}

function handleEditTimer(timerId) {
    const timerData = findTimerById(timerId);
    if (timerData) {
        if (timerData.type === 'count_to_date') {
            prepareCountToDateForEdit(timerData);
        } else {
            prepareTimerForEdit(timerData);
        }
        if (getCurrentActiveOverlay() !== 'menuTimer') {
            activateModule('toggleMenuTimer');
        }
    }
}

function handleDeleteTimer(timerId) {
    if (!confirm(getTranslation('delete_timer_confirm', 'timer') || '¿Estás seguro de que quieres eliminar este temporizador?')) return;

    if (activeTimers.has(timerId)) {
        clearInterval(activeTimers.get(timerId));
        activeTimers.delete(timerId);
    }
    
    const userIndex = userTimers.findIndex(t => t.id === timerId);
    if(userIndex !== -1) {
        userTimers.splice(userIndex, 1);
        saveTimersToStorage();
    }

    const defaultIndex = defaultTimersState.findIndex(t => t.id === timerId);
    if(defaultIndex !== -1){
        defaultTimersState.splice(defaultIndex, 1);
        saveDefaultTimersOrder();
    }
    
    if (pinnedTimerId === timerId) {
        const allTimers = [...userTimers, ...defaultTimersState];
        pinnedTimerId = allTimers.length > 0 ? allTimers[0].id : null;
        if (pinnedTimerId) {
             const newPinnedTimer = findTimerById(pinnedTimerId);
             if(newPinnedTimer) newPinnedTimer.isPinned = true;
             if (newPinnedTimer.type === 'user') saveTimersToStorage(); else saveDefaultTimersOrder();
        }
    }
    
    renderAllTimerCards();
    updateMainDisplay();
    updateMainControlsState();
    updateTimerCounts();
}


function dismissTimer(timerId) {
    stopSound();
    const card = document.getElementById(timerId);
    if (card) {
        const optionsContainer = card.querySelector('.card-options-container');
        if (optionsContainer) {
            optionsContainer.classList.remove('active');
        }
    }
    const timer = findTimerById(timerId);
    if (timer && timer.endAction === 'stop') {
        resetTimer(timerId);
    }
}

export { initializeTimerController };