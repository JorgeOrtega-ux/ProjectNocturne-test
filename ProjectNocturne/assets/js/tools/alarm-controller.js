// /assets/js/tools/alarm-controller.js
import { use24HourFormat, PREMIUM_FEATURES, activateModule, getCurrentActiveOverlay, allowCardMovement } from '../general/main.js';
import { prepareAlarmForEdit } from './menu-interactions.js';

const ALARMS_STORAGE_KEY = 'user-alarms';
const DEFAULT_ALARMS_STORAGE_KEY = 'default-alarms-order'; // Nueva clave para el orden de alarmas predeterminadas
const ALARM_SOUND_PATTERNS = {
    'classic-beep': { frequencies: [800], beepDuration: 150, pauseDuration: 150, type: 'square' },
    'gentle-chime': { frequencies: [523.25, 659.25, 783.99], beepDuration: 300, pauseDuration: 500, type: 'sine' },
    'digital-alarm': { frequencies: [1200, 800], beepDuration: 100, pauseDuration: 100, type: 'square' },
    'peaceful-tone': { frequencies: [440, 554.37, 659.25], beepDuration: 400, pauseDuration: 600, type: 'sine' },
    'urgent-beep': { frequencies: [1600, 1600], beepDuration: 80, pauseDuration: 80, type: 'sawtooth' }
};

const DEFAULT_ALARMS = [
    { id: 'default-1', title: 'Limpiar cuarto', hour: 10, minute: 0, sound: 'gentle-chime', enabled: false, type: 'default' },
    { id: 'default-2', title: 'Hacer ejercicio', hour: 18, minute: 0, sound: 'digital-alarm', enabled: false, type: 'default' },
    { id: 'default-3', title: 'Leer un libro', hour: 21, minute: 0, sound: 'peaceful-tone', enabled: false, type: 'default' }
];

let clockInterval = null;
let userAlarms = [];
let defaultAlarmsState = [];
let activeAlarmTimers = new Map();
let isPlayingSound = false;
let audioContext = null;
let activeSoundSource = null;

function initializeAudioContext() {
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API no está disponible:', e);
            return false;
        }
    }
    return true;
}

function playAlarmSound(soundType = 'classic-beep') {
    if (isPlayingSound || !initializeAudioContext()) return;
    stopAlarmSound();
    isPlayingSound = true;
    const pattern = ALARM_SOUND_PATTERNS[soundType] || ALARM_SOUND_PATTERNS['classic-beep'];
    let freqIndex = 0;
    const playBeep = () => {
        if (!isPlayingSound) return;
        const freq = pattern.frequencies[freqIndex % pattern.frequencies.length];
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.type = pattern.type;
        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + (pattern.beepDuration / 1000));
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + (pattern.beepDuration / 1000));
        freqIndex++;
    };
    playBeep();
    const intervalId = setInterval(playBeep, pattern.beepDuration + pattern.pauseDuration);
    activeSoundSource = { intervalId: intervalId };
}

function stopAlarmSound() {
    if (activeSoundSource && activeSoundSource.intervalId) {
        clearInterval(activeSoundSource.intervalId);
    }
    activeSoundSource = null;
    isPlayingSound = false;
}

function updateAlarmCounts() {
    const userAlarmsCount = userAlarms.length;
    const defaultAlarmsCount = defaultAlarmsState.length;

    const userCountBadge = document.querySelector('.alarm-count-badge[data-count-for="user"]');
    const defaultCountBadge = document.querySelector('.alarm-count-badge[data-count-for="default"]');

    if (userCountBadge) userCountBadge.textContent = userAlarmsCount;
    if (defaultCountBadge) defaultCountBadge.textContent = defaultAlarmsCount;

    const userContainer = document.querySelector('.alarms-container[data-container="user"]');
    const defaultContainer = document.querySelector('.alarms-container[data-container="default"]');

    if (userContainer) userContainer.style.display = userAlarmsCount > 0 ? 'flex' : 'none';
    if (defaultContainer) defaultContainer.style.display = defaultAlarmsCount > 0 ? 'flex' : 'none';
}

function createAlarm(title, hour, minute, sound) {
    const alarmLimit = PREMIUM_FEATURES ? 100 : 10;
    if (userAlarms.length >= alarmLimit) {
        const limitMessage = getTranslation('alarm_limit_reached', 'alarms').replace('{limit}', alarmLimit);
        alert(limitMessage);
        return false;
    }
    const alarm = {
        id: `alarm-${Date.now()}`,
        title,
        hour,
        minute,
        sound,
        enabled: true,
        type: 'user',
        created: new Date().toISOString()
    };
    userAlarms.push(alarm);
    saveAlarmsToStorage();
    createAlarmCard(alarm);
    scheduleAlarm(alarm);
    updateAlarmCounts();
    return true;
}

function createAlarmCard(alarm) {
    const grid = document.querySelector(`.alarms-grid[data-alarm-grid="${alarm.type}"]`);
    if (!grid) return;

    const cardHTML = `
        <div class="alarm-card ${!alarm.enabled ? 'alarm-disabled' : ''}" id="${alarm.id}" data-id="${alarm.id}" data-type="${alarm.type}">
            <div class="card-header">
                <div class="card-alarm-details">
                    <span class="alarm-title" title="${alarm.title}">${alarm.title}</span>
                    <span class="alarm-time">${formatTime(alarm.hour, alarm.minute)}</span>
                </div>
            </div>
            <div class="card-footer">
                <div class="alarm-info">
                    <span class="alarm-sound-name">${getTranslation(alarm.sound, 'sounds')}</span>
                </div>
            </div>
            <div class="card-options-container">
                <button class="dismiss-alarm-btn" data-action="dismiss-alarm">
                    <span data-translate="dismiss" data-translate-category="alarms">Dismiss</span>
                </button>
            </div>
            <div class="card-menu-container disabled">
                <div class="card-menu-btn-wrapper">
                    <button class="card-menu-btn" data-action="toggle-alarm-menu"
                            data-translate="options"
                            data-translate-category="world_clock_options"
                            data-translate-target="tooltip">
                        <span class="material-symbols-rounded">more_horiz</span>
                    </button>
                    <div class="card-dropdown-menu disabled body-title">
                        <div class="menu-link" data-action="toggle-alarm">
                            <div class="menu-link-icon"><span class="material-symbols-rounded">${alarm.enabled ? 'toggle_on' : 'toggle_off'}</span></div>
                            <div class="menu-link-text"><span data-translate="${alarm.enabled ? 'deactivate_alarm' : 'activate_alarm'}" data-translate-category="alarms">${alarm.enabled ? 'Deactivate Alarm' : 'Activate Alarm'}</span></div>
                        </div>
                        <div class="menu-link" data-action="test-alarm">
                            <div class="menu-link-icon"><span class="material-symbols-rounded">volume_up</span></div>
                            <div class="menu-link-text"><span data-translate="test_alarm" data-translate-category="alarms">Test Alarm</span></div>
                        </div>
                        <div class="menu-link" data-action="edit-alarm">
                            <div class="menu-link-icon"><span class="material-symbols-rounded">edit</span></div>
                            <div class="menu-link-text"><span data-translate="edit_alarm" data-translate-category="alarms">Edit Alarm</span></div>
                        </div>
                        <div class="menu-link" data-action="delete-alarm">
                            <div class="menu-link-icon"><span class="material-symbols-rounded">delete</span></div>
                            <div class="menu-link-text"><span data-translate="delete_alarm" data-translate-category="alarms">Delete Alarm</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    grid.insertAdjacentHTML('beforeend', cardHTML);
    const newCard = document.getElementById(alarm.id);
    if (newCard) {
        addCardEventListeners(newCard);
    }
}

function addCardEventListeners(card) {
    const menuContainer = card.querySelector('.card-menu-container');
    card.addEventListener('mouseenter', () => {
        menuContainer?.classList.add('active');
        menuContainer?.classList.remove('disabled');
    });
    card.addEventListener('mouseleave', () => {
        const dropdown = menuContainer?.querySelector('.card-dropdown-menu');
        if (dropdown?.classList.contains('disabled')) {
            menuContainer?.classList.remove('active');
            menuContainer?.classList.add('disabled');
        }
    });
    const dismissButton = card.querySelector('[data-action="dismiss-alarm"]');
    if(dismissButton) {
        dismissButton.addEventListener('click', () => dismissAlarm(card.id));
    }
}

function scheduleAlarm(alarm) {
    if (!alarm.enabled) return;
    const now = new Date();
    const alarmTime = new Date();
    alarmTime.setHours(alarm.hour, alarm.minute, 0, 0);
    if (alarmTime <= now) {
        alarmTime.setDate(alarmTime.getDate() + 1);
    }
    const timeUntilAlarm = alarmTime.getTime() - now.getTime();
    if (activeAlarmTimers.has(alarm.id)) {
        clearTimeout(activeAlarmTimers.get(alarm.id));
    }
    const timerId = setTimeout(() => {
        triggerAlarm(alarm);
        activeAlarmTimers.delete(alarm.id);
    }, timeUntilAlarm);
    activeAlarmTimers.set(alarm.id, timerId);
}

function triggerAlarm(alarm) {
    playAlarmSound(alarm.sound);
    const alarmCard = document.getElementById(alarm.id);
    if (alarmCard) {
        const optionsContainer = alarmCard.querySelector('.card-options-container');
        if (optionsContainer) {
            optionsContainer.classList.add('active');
        }
    }
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`Alarma: ${alarm.title}`, { body: `${formatTime(alarm.hour, alarm.minute)}`, icon: '/favicon.ico' });
    }
    scheduleAlarm(alarm);
}

function dismissAlarm(alarmId) {
    stopAlarmSound();
    const alarmCard = document.getElementById(alarmId);
    if (alarmCard) {
        const optionsContainer = alarmCard.querySelector('.card-options-container');
        if (optionsContainer) {
            optionsContainer.classList.remove('active');
        }
    }
    const alarm = findAlarmById(alarmId);
    if (alarm && alarm.enabled) {
        toggleAlarm(alarmId);
    }
}

function findAlarmById(alarmId) {
    return userAlarms.find(a => a.id === alarmId) || defaultAlarmsState.find(a => a.id === alarmId);
}

function toggleAlarm(alarmId) {
    const alarm = findAlarmById(alarmId);
    if (!alarm) return;
    alarm.enabled = !alarm.enabled;
    if (alarm.type === 'user') {
        saveAlarmsToStorage();
    } else if (alarm.type === 'default') {
        // Guardar el orden de las alarmas predeterminadas cuando se modifica una
        saveDefaultAlarmsOrder();
    }
    if (alarm.enabled) {
        scheduleAlarm(alarm);
    } else {
        if (activeAlarmTimers.has(alarmId)) {
            clearTimeout(activeAlarmTimers.get(alarmId));
            activeAlarmTimers.delete(alarmId);
        }
    }
    updateAlarmCardVisuals(alarm);
}

function deleteAlarm(alarmId) {
    const alarm = findAlarmById(alarmId);
    if (!alarm) return;

    if (activeAlarmTimers.has(alarmId)) {
        clearTimeout(activeAlarmTimers.get(alarmId));
        activeAlarmTimers.delete(alarmId);
    }

    if (alarm.type === 'user') {
        userAlarms = userAlarms.filter(a => a.id !== alarmId);
        saveAlarmsToStorage();
    } else {
        defaultAlarmsState = defaultAlarmsState.filter(a => a.id !== alarmId);
        saveDefaultAlarmsOrder();
    }

    const alarmCard = document.getElementById(alarmId);
    if (alarmCard) {
        alarmCard.remove();
    }
    updateAlarmCounts();
}

function updateAlarm(alarmId, newData) {
    const alarm = findAlarmById(alarmId);
    if (!alarm) return;

    Object.assign(alarm, newData);

    if (alarm.type === 'user') {
        saveAlarmsToStorage();
    } else if (alarm.type === 'default') {
        saveDefaultAlarmsOrder();
    }

    if (activeAlarmTimers.has(alarmId)) {
        clearTimeout(activeAlarmTimers.get(alarmId));
        activeAlarmTimers.delete(alarmId);
    }

    if (alarm.enabled) {
        scheduleAlarm(alarm);
    }

    updateAlarmCardVisuals(alarm);
}

function updateAlarmCardVisuals(alarm) {
    const card = document.getElementById(alarm.id);
    if (!card) return;
    const title = card.querySelector('.alarm-title');
    const time = card.querySelector('.alarm-time');
    const sound = card.querySelector('.alarm-sound-name');
    const toggleLink = card.querySelector('[data-action="toggle-alarm"]');
    const toggleIcon = toggleLink?.querySelector('.material-symbols-rounded');
    const toggleText = toggleLink?.querySelector('.menu-link-text span');

    if (title) title.textContent = alarm.title;
    if (time) time.textContent = formatTime(alarm.hour, alarm.minute);
    if (sound) sound.textContent = getTranslation(alarm.sound, 'sounds');

    if (toggleIcon) toggleIcon.textContent = alarm.enabled ? 'toggle_on' : 'toggle_off';
    if (toggleText) {
        const key = alarm.enabled ? 'deactivate_alarm' : 'activate_alarm';
        toggleText.setAttribute('data-translate', key);
        toggleText.textContent = getTranslation(key, 'alarms');
    }

    card.classList.toggle('alarm-disabled', !alarm.enabled);
}

function saveAlarmsToStorage() {
    localStorage.setItem(ALARMS_STORAGE_KEY, JSON.stringify(userAlarms));
}

// Nueva función para guardar el orden de las alarmas predeterminadas
function saveDefaultAlarmsOrder() {
    localStorage.setItem(DEFAULT_ALARMS_STORAGE_KEY, JSON.stringify(defaultAlarmsState));
}

// Nueva función para cargar el orden de las alarmas predeterminadas
function loadDefaultAlarmsOrder() {
    const stored = localStorage.getItem(DEFAULT_ALARMS_STORAGE_KEY);
    if (stored) {
        try {
            defaultAlarmsState = JSON.parse(stored);
            // Verificar que todas las alarmas por defecto estén presentes
            const defaultIds = new Set(defaultAlarmsState.map(alarm => alarm.id));
            const originalIds = new Set(DEFAULT_ALARMS.map(alarm => alarm.id));
            
            // Si faltan alarmas por defecto, agregar las que faltan
            DEFAULT_ALARMS.forEach(defaultAlarm => {
                if (!defaultIds.has(defaultAlarm.id)) {
                    defaultAlarmsState.push({...defaultAlarm});
                }
            });
        } catch (error) {
            console.warn('Error loading default alarms order:', error);
            // Si hay error, usar el orden por defecto
            defaultAlarmsState = JSON.parse(JSON.stringify(DEFAULT_ALARMS));
        }
    } else {
        // Si no hay orden guardado, usar el orden por defecto
        defaultAlarmsState = JSON.parse(JSON.stringify(DEFAULT_ALARMS));
    }
}

function loadAlarmsFromStorage() {
    const stored = localStorage.getItem(ALARMS_STORAGE_KEY);
    if (stored) {
        userAlarms = JSON.parse(stored);
    }
    userAlarms.forEach(alarm => {
        alarm.type = 'user';
        createAlarmCard(alarm);
        if (alarm.enabled) scheduleAlarm(alarm);
    });
}

function loadDefaultAlarms() {
    // Cargar el orden guardado de las alarmas predeterminadas
    loadDefaultAlarmsOrder();
    
    defaultAlarmsState.forEach(alarm => {
        createAlarmCard(alarm);
        if (alarm.enabled) scheduleAlarm(alarm);
    });
}

function formatTime(hour, minute) {
    if (use24HourFormat) {
        return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }
    const ampm = hour >= 12 ? 'PM' : 'AM';
    let h12 = hour % 12;
    h12 = h12 ? h12 : 12;
    return `${h12}:${String(minute).padStart(2, '0')} ${ampm}`;
}

function getTranslation(key, category) {
    if (typeof window.getTranslation === 'function') {
        const text = window.getTranslation(key, category);
        return text === key ? key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : text;
    }
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function toggleAlarmsSection(type) {
    const grid = document.querySelector(`.alarms-grid[data-alarm-grid="${type}"]`);
    if (!grid) return;
    const container = grid.closest('.alarms-container');
    if (!container) return;
    const btn = container.querySelector('.collapse-alarms-btn');
    const isActive = grid.classList.toggle('active');
    btn.classList.toggle('expanded', isActive);
}

function updateLocalTime() {
    const el = document.querySelector('.tool-alarm span');
    if (el) {
        const now = new Date();
        const options = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: !use24HourFormat };
        el.textContent = now.toLocaleTimeString(navigator.language, options);
    }
}

function startClock() {
    if (clockInterval) return;
    updateLocalTime();
    clockInterval = setInterval(updateLocalTime, 1000);
}

// Función mejorada para inicializar el sortable en ambas grillas
function initializeSortableAlarms() {
    if (!allowCardMovement) return;

    const userGrid = document.querySelector('.alarms-grid[data-alarm-grid="user"]');
    const defaultGrid = document.querySelector('.alarms-grid[data-alarm-grid="default"]');
    
    if (typeof Sortable === 'undefined') {
        console.warn('SortableJS no está disponible. La funcionalidad de arrastrar y soltar no funcionará.');
        return;
    }

    // Configuración para la grilla de alarmas de usuario
    if (userGrid) {
        new Sortable(userGrid, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'sortable-drag',
            onEnd: function (evt) {
                const newOrderIds = Array.from(evt.to.children).map(card => card.id);
                userAlarms.sort((a, b) => {
                    return newOrderIds.indexOf(a.id) - newOrderIds.indexOf(b.id);
                });
                saveAlarmsToStorage();
                console.log('📝 Nuevo orden de alarmas de usuario guardado');
            }
        });
    }

    // Configuración para la grilla de alarmas predeterminadas
    if (defaultGrid) {
        new Sortable(defaultGrid, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'sortable-drag',
            onEnd: function (evt) {
                const newOrderIds = Array.from(evt.to.children).map(card => card.id);
                defaultAlarmsState.sort((a, b) => {
                    return newOrderIds.indexOf(a.id) - newOrderIds.indexOf(b.id);
                });
                saveDefaultAlarmsOrder();
                console.log('📝 Nuevo orden de alarmas predeterminadas guardado');
            }
        });
    }
}

function setupEventListeners() {
    const sectionBottom = document.querySelector('.section-alarm .section-bottom');
    if (sectionBottom) {
        sectionBottom.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;
            const card = target.closest('.alarm-card');
            if (!card) return;
            const alarmId = card.dataset.id;
            const alarm = findAlarmById(alarmId);

            switch (target.dataset.action) {
                case 'toggle-alarm-menu':
                    e.stopPropagation();
                    const dropdown = card.querySelector('.card-dropdown-menu');
                    document.querySelectorAll('.card-dropdown-menu').forEach(m => m !== dropdown && m.classList.add('disabled'));
                    dropdown?.classList.toggle('disabled');
                    break;
                case 'toggle-alarm':
                    toggleAlarm(alarmId);
                    break;
                case 'test-alarm':
                    if (alarm) playAlarmSound(alarm.sound);
                    break;
                case 'edit-alarm':
                    e.stopPropagation();
                    if (alarm) {
                        prepareAlarmForEdit({ ...alarm, updateAlarm: updateAlarm });
                        if (getCurrentActiveOverlay() !== 'menuAlarm') {
                            activateModule('toggleMenuAlarm');
                        }
                    }
                    break;
                case 'delete-alarm':
                    if (confirm(getTranslation('confirm_delete_alarm', 'alarms'))) {
                        deleteAlarm(alarmId);
                    }
                    break;
            }
        });
    }

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.card-menu-btn-wrapper')) {
            document.querySelectorAll('.card-dropdown-menu').forEach(m => m.classList.add('disabled'));
        }
    });
}

export function initializeAlarmClock() {
    startClock();
    loadAlarmsFromStorage();
    loadDefaultAlarms();
    setupEventListeners();
    updateAlarmCounts();
    initializeSortableAlarms(); 
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
    window.alarmManager = { 
        createAlarm, 
        toggleAlarm, 
        deleteAlarm, 
        updateAlarm, 
        toggleAlarmsSection, 
        playAlarmSound, 
        dismissAlarm 
    };
}