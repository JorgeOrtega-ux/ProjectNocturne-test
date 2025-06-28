// /assets/js/tools/timer-controller.js
import { use24HourFormat, PREMIUM_FEATURES, activateModule, getCurrentActiveOverlay, allowCardMovement } from '../general/main.js';
import { prepareTimerForEdit } from './menu-interactions.js';

const TIMERS_STORAGE_KEY = 'user-timers';
const TIMER_SOUND_PATTERNS = {
    'classic-beep': { frequencies: [800], beepDuration: 150, pauseDuration: 150, type: 'square' },
    'gentle-chime': { frequencies: [523.25, 659.25, 783.99], beepDuration: 300, pauseDuration: 500, type: 'sine' },
    'digital-alarm': { frequencies: [1200, 800], beepDuration: 100, pauseDuration: 100, type: 'square' },
    'peaceful-tone': { frequencies: [440, 554.37, 659.25], beepDuration: 400, pauseDuration: 600, type: 'sine' },
    'urgent-beep': { frequencies: [1600, 1600], beepDuration: 80, pauseDuration: 80, type: 'sawtooth' }
};

let userTimers = [];
let defaultTimer = null;
let activeTimers = new Map();
let isPlayingSound = false;
let audioContext = null;
let activeSoundSource = null;
let mainDisplayInterval = null;
let pinnedTimer = null;

// Initialize audio context
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

// Play timer sound
function playTimerSound(soundType = 'classic-beep') {
    if (isPlayingSound || !initializeAudioContext()) return;
    stopTimerSound();
    isPlayingSound = true;
    const pattern = TIMER_SOUND_PATTERNS[soundType] || TIMER_SOUND_PATTERNS['classic-beep'];
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

// Stop timer sound
function stopTimerSound() {
    if (activeSoundSource && activeSoundSource.intervalId) {
        clearInterval(activeSoundSource.intervalId);
    }
    activeSoundSource = null;
    isPlayingSound = false;
}

// Format time for display
function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    } else {
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
}

// Format date for display
function formatDate(date) {
    const currentAppLanguage = typeof window.getCurrentLanguage === 'function' ? window.getCurrentLanguage() : 'en-US';
    return date.toLocaleDateString(currentAppLanguage, {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });
}

// Create default timer
function createDefaultTimer() {
    defaultTimer = {
        id: 'default-timer-5min',
        title: 'Quick Timer',
        type: 'countdown',
        duration: { hours: 0, minutes: 5, seconds: 0 },
        endAction: 'stop',
        sound: 'gentle-chime',
        status: 'paused',
        remainingTime: 300, // 5 minutes in seconds
        isDefault: true,
        created: new Date().toISOString()
    };
    
    createTimerCard(defaultTimer);
    pinTimer(document.querySelector(`#${defaultTimer.id} .card-pin-btn`));
}

// Create timer function
function createTimer(timerData) {
    const timerLimit = PREMIUM_FEATURES ? 100 : 10;
    if (userTimers.length >= timerLimit) {
        const limitMessage = getTranslation('timer_limit_reached', 'timer').replace('{limit}', timerLimit);
        alert(limitMessage);
        return false;
    }
    
    const timer = {
        id: `timer-${Date.now()}`,
        ...timerData,
        status: 'paused',
        created: new Date().toISOString()
    };
    
    // Calculate remaining time based on timer type
    if (timer.type === 'countdown') {
        timer.remainingTime = (timer.duration.hours * 3600) + (timer.duration.minutes * 60) + timer.duration.seconds;
    } else if (timer.type === 'count_to_date') {
        const targetDate = new Date(timer.selectedDate);
        targetDate.setHours(timer.selectedHour, timer.selectedMinute, 0, 0);
        const now = new Date();
        timer.remainingTime = Math.max(0, Math.floor((targetDate.getTime() - now.getTime()) / 1000));
        timer.targetDate = targetDate.toISOString();
    }
    
    userTimers.push(timer);
    saveTimersToStorage();
    createTimerCard(timer);
    updateTimerCounts();
    return true;
}

// Create timer card
function createTimerCard(timer) {
    const grid = document.querySelector('.timers-grid');
    if (!grid) return;

    const timeDisplay = timer.type === 'countdown' ? 
        formatTime(timer.remainingTime) : 
        formatTime(timer.remainingTime);
    
    const dateDisplay = timer.type === 'count_to_date' ? 
        formatDate(new Date(timer.targetDate)) : 
        formatDate(new Date(timer.created));

    const cardHTML = `
        <div class="timer-card ${timer.status === 'paused' ? 'timer-paused' : ''}" id="${timer.id}" data-id="${timer.id}" data-type="${timer.type}">
            <div class="card-header">
                <div class="card-timer-details">
                    <span class="timer-title" title="${timer.title}">${timer.title}</span>
                    <span class="timer-type-badge">${getTranslation(timer.type, 'timer')}</span>
                </div>
            </div>
            <div class="card-body">
                <span class="timer-time">${timeDisplay}</span>
            </div>
            <div class="card-footer">
                <div class="timer-info">
                    <span class="timer-date">${dateDisplay}</span>
                    <span class="timer-sound-name">${getTranslation(timer.sound, 'sounds')}</span>
                </div>
            </div>
            <div class="card-menu-container disabled">
                <button class="card-pin-btn" data-action="pin-timer"
                        data-translate="pin_timer"
                        data-translate-category="tooltips"
                        data-translate-target="tooltip">
                    <span class="material-symbols-rounded">push_pin</span>
                </button>
                <div class="card-menu-btn-wrapper">
                    <button class="card-menu-btn" data-action="toggle-timer-menu"
                            data-translate="options"
                            data-translate-category="timer"
                            data-translate-target="tooltip">
                        <span class="material-symbols-rounded">more_horiz</span>
                    </button>
                    <div class="card-dropdown-menu disabled body-title">
                        <div class="menu-link" data-action="start-timer">
                            <div class="menu-link-icon"><span class="material-symbols-rounded">play_arrow</span></div>
                            <div class="menu-link-text"><span data-translate="start_timer" data-translate-category="timer">Start Timer</span></div>
                        </div>
                        <div class="menu-link" data-action="pause-timer">
                            <div class="menu-link-icon"><span class="material-symbols-rounded">pause</span></div>
                            <div class="menu-link-text"><span data-translate="pause_timer" data-translate-category="timer">Pause Timer</span></div>
                        </div>
                        <div class="menu-link" data-action="reset-timer">
                            <div class="menu-link-icon"><span class="material-symbols-rounded">refresh</span></div>
                            <div class="menu-link-text"><span data-translate="reset_timer" data-translate-category="timer">Reset Timer</span></div>
                        </div>
                        <div class="menu-link" data-action="edit-timer">
                            <div class="menu-link-icon"><span class="material-symbols-rounded">edit</span></div>
                            <div class="menu-link-text"><span data-translate="edit_timer" data-translate-category="timer">Edit Timer</span></div>
                        </div>
                        <div class="menu-link" data-action="delete-timer">
                            <div class="menu-link-icon"><span class="material-symbols-rounded">delete</span></div>
                            <div class="menu-link-text"><span data-translate="delete_timer" data-translate-category="timer">Delete Timer</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    grid.insertAdjacentHTML('beforeend', cardHTML);
    const newCard = document.getElementById(timer.id);
    if (newCard) {
        addCardEventListeners(newCard);
        setTimeout(() => {
            applyTranslationsToSpecificElement(newCard);
            if (typeof attachTooltipsToNewElements === 'function') {
                attachTooltipsToNewElements(newCard);
            }
        }, 0);
    }
}

// Add event listeners to card
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
}

// Start timer
function startTimer(timerId) {
    const timer = findTimerById(timerId);
    if (!timer || timer.status === 'running') return;
    
    timer.status = 'running';
    timer.startTime = Date.now();
    
    const timerInterval = setInterval(() => {
        updateTimerProgress(timer);
    }, 1000);
    
    activeTimers.set(timerId, timerInterval);
    updateTimerCardVisuals(timer);
    
    if (pinnedTimer && pinnedTimer.id === timerId) {
        updateMainTimerDisplay();
    }
    
    if (timer.isDefault) {
        // No need to save default timer
    } else {
        saveTimersToStorage();
    }
}

// Pause timer
function pauseTimer(timerId) {
    const timer = findTimerById(timerId);
    if (!timer || timer.status !== 'running') return;
    
    timer.status = 'paused';
    
    if (activeTimers.has(timerId)) {
        clearInterval(activeTimers.get(timerId));
        activeTimers.delete(timerId);
    }
    
    updateTimerCardVisuals(timer);
    
    if (timer.isDefault) {
        // No need to save default timer
    } else {
        saveTimersToStorage();
    }
}

// Reset timer
function resetTimer(timerId) {
    const timer = findTimerById(timerId);
    if (!timer) return;
    
    // Stop if running
    if (timer.status === 'running' && activeTimers.has(timerId)) {
        clearInterval(activeTimers.get(timerId));
        activeTimers.delete(timerId);
    }
    
    timer.status = 'paused';
    
    // Reset time based on timer type
    if (timer.type === 'countdown') {
        timer.remainingTime = (timer.duration.hours * 3600) + (timer.duration.minutes * 60) + timer.duration.seconds;
    } else if (timer.type === 'count_to_date') {
        const targetDate = new Date(timer.targetDate);
        const now = new Date();
        timer.remainingTime = Math.max(0, Math.floor((targetDate.getTime() - now.getTime()) / 1000));
    }
    
    updateTimerCardVisuals(timer);
    
    if (pinnedTimer && pinnedTimer.id === timerId) {
        updateMainTimerDisplay();
    }
    
    if (timer.isDefault) {
        // Reset default timer to 5 minutes
        timer.remainingTime = 300;
    } else {
        saveTimersToStorage();
    }
}

// Update timer progress
function updateTimerProgress(timer) {
    if (timer.type === 'countdown') {
        timer.remainingTime = Math.max(0, timer.remainingTime - 1);
        
        if (timer.remainingTime <= 0) {
            // Timer finished
            timerFinished(timer);
            return;
        }
    } else if (timer.type === 'count_to_date') {
        const targetDate = new Date(timer.targetDate);
        const now = new Date();
        timer.remainingTime = Math.max(0, Math.floor((targetDate.getTime() - now.getTime()) / 1000));
        
        if (timer.remainingTime <= 0) {
            // Timer finished
            timerFinished(timer);
            return;
        }
    }
    
    updateTimerCardVisuals(timer);
    
    if (pinnedTimer && pinnedTimer.id === timer.id) {
        updateMainTimerDisplay();
    }
}

// Timer finished
function timerFinished(timer) {
    // Stop the timer
    if (activeTimers.has(timer.id)) {
        clearInterval(activeTimers.get(timer.id));
        activeTimers.delete(timer.id);
    }
    
    timer.status = 'finished';
    timer.remainingTime = 0;
    
    // Play sound
    playTimerSound(timer.sound);
    
    // Execute end action
    switch (timer.endAction) {
        case 'stop':
            // Just stop
            break;
        case 'restart':
            setTimeout(() => {
                resetTimer(timer.id);
                startTimer(timer.id);
            }, 2000);
            break;
        case 'stopwatch':
            // Start as stopwatch (could integrate with stopwatch controller)
            console.log('Starting as stopwatch...');
            break;
    }
    
    updateTimerCardVisuals(timer);
    
    // Show notification if supported
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`Timer: ${timer.title}`, { 
            body: `Timer finished: ${timer.title}`, 
            icon: '/favicon.ico' 
        });
    }
}

// Update timer card visuals
function updateTimerCardVisuals(timer) {
    const card = document.getElementById(timer.id);
    if (!card) return;
    
    const timeElement = card.querySelector('.timer-time');
    const startLink = card.querySelector('[data-action="start-timer"]');
    const pauseLink = card.querySelector('[data-action="pause-timer"]');
    
    if (timeElement) {
        timeElement.textContent = formatTime(timer.remainingTime);
    }
    
    // Update card status classes
    card.classList.toggle('timer-paused', timer.status === 'paused');
    card.classList.toggle('timer-running', timer.status === 'running');
    card.classList.toggle('timer-finished', timer.status === 'finished');
    
    // Update menu visibility
    if (startLink) {
        startLink.style.display = timer.status === 'running' ? 'none' : 'flex';
    }
    if (pauseLink) {
        pauseLink.style.display = timer.status === 'running' ? 'flex' : 'none';
    }
}

// Pin timer
function pinTimer(button) {
    const card = button.closest('.timer-card');
    if (!card) return;
    
    const timerId = card.dataset.id;
    const timer = findTimerById(timerId);
    if (!timer) return;
    
    // Remove active class from all pin buttons
    document.querySelectorAll('.card-pin-btn').forEach(btn => btn.classList.remove('active'));
    
    // Add active class to clicked button
    button.classList.add('active');
    
    // Set as pinned timer
    pinnedTimer = timer;
    
    // Update main display
    updateMainTimerDisplay();
}

// Update main timer display
function updateMainTimerDisplay() {
    if (mainDisplayInterval) {
        clearInterval(mainDisplayInterval);
    }
    
    const mainDisplay = document.querySelector('.tool-timer span');
    if (!mainDisplay || !pinnedTimer) return;
    
    function update() {
        if (!mainDisplay || !pinnedTimer) return;
        mainDisplay.textContent = formatTime(pinnedTimer.remainingTime);
    }
    
    update();
    mainDisplayInterval = setInterval(update, 1000);
}

// Find timer by ID
function findTimerById(timerId) {
    if (defaultTimer && defaultTimer.id === timerId) {
        return defaultTimer;
    }
    return userTimers.find(t => t.id === timerId);
}

// Delete timer
function deleteTimer(timerId) {
    const timer = findTimerById(timerId);
    if (!timer || timer.isDefault) return;
    
    // Stop if running
    if (activeTimers.has(timerId)) {
        clearInterval(activeTimers.get(timerId));
        activeTimers.delete(timerId);
    }
    
    // Remove from array
    userTimers = userTimers.filter(t => t.id !== timerId);
    
    // Remove card
    const card = document.getElementById(timerId);
    if (card) {
        card.remove();
    }
    
    // If was pinned, pin default timer
    if (pinnedTimer && pinnedTimer.id === timerId) {
        const defaultPinBtn = document.querySelector('#default-timer-5min .card-pin-btn');
        if (defaultPinBtn) {
            pinTimer(defaultPinBtn);
        }
    }
    
    saveTimersToStorage();
    updateTimerCounts();
}

// Update timer counts
function updateTimerCounts() {
    const userTimersCount = userTimers.length;
    const userCountBadge = document.querySelector('.timer-count-badge[data-count-for="user"]');
    if (userCountBadge) {
        userCountBadge.textContent = userTimersCount;
    }
    
    const userContainer = document.querySelector('.timers-container[data-container="user"]');
    if (userContainer) {
        userContainer.style.display = userTimersCount > 0 ? 'flex' : 'none';
    }
}

// Apply translations to element
function applyTranslationsToSpecificElement(element) {
    if (!element) return;
    
    const getTranslationSafe = (key, category) => {
        if (typeof window.getTranslation === 'function') {
            const text = window.getTranslation(key, category);
            return text === key ? key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : text;
        }
        return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const elementsToTranslate = element.querySelectorAll('[data-translate]');
    
    elementsToTranslate.forEach(targetElement => {
        const translateKey = targetElement.getAttribute('data-translate');
        const translateCategory = targetElement.getAttribute('data-translate-category') || 'timer';
        const translateTarget = targetElement.getAttribute('data-translate-target') || 'text';

        if (!translateKey) return;

        const translatedText = getTranslationSafe(translateKey, translateCategory);

        switch (translateTarget) {
            case 'text':
                targetElement.textContent = translatedText;
                break;
            case 'tooltip':
                targetElement.setAttribute('data-tooltip', translatedText);
                break;
            case 'title':
                targetElement.setAttribute('title', translatedText);
                break;
            case 'placeholder':
                targetElement.setAttribute('placeholder', translatedText);
                break;
            default:
                targetElement.textContent = translatedText;
        }
    });
}

// Save timers to storage
function saveTimersToStorage() {
    try {
        localStorage.setItem(TIMERS_STORAGE_KEY, JSON.stringify(userTimers));
    } catch (error) {
        console.error('Error saving timers to localStorage:', error);
    }
}

// Load timers from storage
function loadTimersFromStorage() {
    try {
        const storedTimers = localStorage.getItem(TIMERS_STORAGE_KEY);
        if (storedTimers) {
            userTimers = JSON.parse(storedTimers);
            userTimers.forEach(timer => {
                createTimerCard(timer);
            });
        }
    } catch (error) {
        console.error('Error loading timers from localStorage:', error);
        userTimers = [];
    }
}

// Initialize sortable
function initializeSortable() {
    if (!allowCardMovement) return;
    
    const grid = document.querySelector('.timers-grid');
    if (grid && typeof Sortable !== 'undefined') {
        new Sortable(grid, {
            animation: 150,
            filter: '.timer-card[data-id="default-timer-5min"], .card-menu-btn, .card-dropdown-menu, .card-pin-btn',
            draggable: '.timer-card',
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'sortable-drag',
            onMove: function(evt) {
                return !evt.related.dataset.id || evt.related.dataset.id !== 'default-timer-5min';
            },
            onEnd: function() {
                const newOrder = Array.from(grid.querySelectorAll('.timer-card:not([data-id="default-timer-5min"])')).map(card => card.id);
                userTimers.sort((a, b) => newOrder.indexOf(a.id) - newOrder.indexOf(b.id));
                saveTimersToStorage();
            }
        });
    }
}

// Get translation helper
function getTranslation(key, category) {
    if (typeof window.getTranslation === 'function') {
        const text = window.getTranslation(key, category);
        return text === key ? key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : text;
    }
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Setup event listeners
function setupEventListeners() {
    const sectionBottom = document.querySelector('.section-timer .section-bottom');
    if (sectionBottom) {
        sectionBottom.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;
            
            const card = target.closest('.timer-card');
            if (!card) return;
            
            const timerId = card.dataset.id;
            const action = target.dataset.action;
            
            switch (action) {
                case 'toggle-timer-menu':
                    e.stopPropagation();
                    const dropdown = card.querySelector('.card-dropdown-menu');
                    document.querySelectorAll('.card-dropdown-menu').forEach(m => m !== dropdown && m.classList.add('disabled'));
                    dropdown?.classList.toggle('disabled');
                    break;
                case 'start-timer':
                    startTimer(timerId);
                    break;
                case 'pause-timer':
                    pauseTimer(timerId);
                    break;
                case 'reset-timer':
                    resetTimer(timerId);
                    break;
                case 'edit-timer':
                    // TODO: Implement edit functionality
                    console.log('Edit timer:', timerId);
                    break;
                case 'delete-timer':
                    if (confirm(getTranslation('confirm_delete_timer', 'timer'))) {
                        deleteTimer(timerId);
                    }
                    break;
                case 'pin-timer':
                    pinTimer(target);
                    break;
            }
        });
    }
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.card-menu-btn-wrapper')) {
            document.querySelectorAll('.card-dropdown-menu').forEach(m => m.classList.add('disabled'));
        }
    });
    
    // Language change listener
    document.addEventListener('languageChanged', (e) => {
        setTimeout(() => {
            updateExistingTimersTranslations();
        }, 500);
    });
}

// Update existing timers translations
function updateExistingTimersTranslations() {
    const cards = document.querySelectorAll('.timer-card');
    cards.forEach(card => {
        applyTranslationsToSpecificElement(card);
    });
}

// Export functions for use by menu-interactions
export function prepareTimerForEdit(timerData) {
    // TODO: Implement when menu-interactions is updated
    console.log('Prepare timer for edit:', timerData);
}

// Initialize timer system
export function initializeTimer() {
    createDefaultTimer();
    loadTimersFromStorage();
    setupEventListeners();
    updateTimerCounts();
    initializeSortable();
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
    
    // Global timer manager
    window.timerManager = {
        createTimer,
        startTimer,
        pauseTimer,
        resetTimer,
        deleteTimer,
        pinTimer,
        updateExistingTimersTranslations
    };
}