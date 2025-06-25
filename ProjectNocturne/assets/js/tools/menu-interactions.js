"use strict";

// --- ESTADO INICIAL (VALORES POR DEFECTO) ---
const initialState = {
    alarm: {
        hour: 0,
        minute: 0,
        sound: 'classic-beep'
    },
    timer: {
        currentTab: 'countdown',
        duration: { hours: 0, minutes: 5, seconds: 0 },
        countTo: { date: new Date(), selectedDate: null, selectedHour: null, selectedMinute: null, timeSelectionStep: 'hour' },
        endAction: 'stop',
        sound: 'classic-beep'
    },
    worldClock: {
        country: '',
        timezone: ''
    }
};

// --- ESTADO CENTRALIZADO Y DINÁMICO ---
const state = JSON.parse(JSON.stringify(initialState));
state.timer.countTo.date = new Date();

// --- MAPEO DE ACCIONES A DROPDOWNS ---
const dropdownMap = {
    'toggleAlarmSoundDropdown': '.menu-alarm-sound',
    'toggleTimerEndActionDropdown': '.menu-timer-end-action',
    'toggleTimerSoundDropdown': '.menu-timer-sound',
    'toggleCalendarDropdown': '.calendar-container',
    'toggleTimerHourDropdown': '.menu-timer-hour-selection',
    'toggleCountryDropdown': '.menu-worldclock-country',
    'toggleTimezoneDropdown': '.menu-worldclock-timezone'
};

// --- FUNCIÓN DE INICIALIZACIÓN ÚNICA PARA EVENTOS GLOBALES ---
let areGlobalListenersInitialized = false;

function initMenuInteractions() {
    if (areGlobalListenersInitialized) return;
    
    // Configura listeners que solo deben añadirse una vez al body.
    setupGlobalEventListeners();
    
    areGlobalListenersInitialized = true;
}


// ===============================================
// FUNCIONES DE RESETEO (LÓGICA INTERNA)
// ===============================================

const getMenuElement = (menuName) => {
    const menuSelectorMap = {
        'menuAlarm': '.menu-alarm[data-menu="Alarm"]',
        'menuTimer': '.menu-timer[data-menu="Timer"]',
        'menuWorldClock': '.menu-worldClock[data-menu="WorldClock"]'
    };
    return document.querySelector(menuSelectorMap[menuName]);
};

const resetAlarmMenu = (menuElement) => {
    state.alarm = JSON.parse(JSON.stringify(initialState.alarm));
    const titleInput = menuElement.querySelector('#alarm-title');
    if (titleInput) titleInput.value = '';
    const searchInput = menuElement.querySelector('.search-content-text input');
    if (searchInput) searchInput.value = '';
    updateAlarmDisplay(menuElement);
    resetDropdownDisplay(menuElement, '#alarm-selected-sound', 'classic_beep', 'sounds');
};

const resetTimerMenu = (menuElement) => {
    state.timer = JSON.parse(JSON.stringify(initialState.timer));
    state.timer.countTo.date = new Date();
    const countdownTitle = menuElement.querySelector('#timer-title');
    if (countdownTitle) countdownTitle.value = '';
    const countToTitle = menuElement.querySelector('#countto-title');
    if (countToTitle) countToTitle.value = '';
    updateTimerTabView(menuElement);
    updateTimerDurationDisplay(menuElement);
    renderCalendar(menuElement);
    updateDisplay('#selected-date-display', '-- / -- / ----', menuElement);
    updateDisplay('#selected-hour-display', '--', menuElement);
    updateDisplay('#selected-minute-display', '--', menuElement);
    resetDropdownDisplay(menuElement, '#timer-selected-end-action', 'stop_timer', 'timer');
    resetDropdownDisplay(menuElement, '#timer-selected-sound', 'classic_beep', 'sounds');
};

const resetWorldClockMenu = (menuElement) => {
    state.worldClock = JSON.parse(JSON.stringify(initialState.worldClock));
    const titleInput = menuElement.querySelector('#worldclock-title');
    if (titleInput) titleInput.value = '';
    
    const countrySearchInput = menuElement.querySelector('#country-search-input');
    if (countrySearchInput) countrySearchInput.value = '';
    
    const countryList = menuElement.querySelector('.menu-worldclock-country .menu-list');
    if (countryList) {
        const allCountries = countryList.querySelectorAll('.menu-link');
        allCountries.forEach(country => country.style.display = 'flex');
        
        // MODIFIED: Remove no-results message on reset
        const noResultsMsg = countryList.querySelector('.no-results-message');
        if (noResultsMsg) noResultsMsg.remove();
    }

    resetDropdownDisplay(menuElement, '#worldclock-selected-country', 'select_a_country', 'world_clock');
    resetDropdownDisplay(menuElement, '#worldclock-selected-timezone', 'select_a_timezone', 'world_clock');
    const timezoneSelector = menuElement.querySelector('[data-action="toggleTimezoneDropdown"]');
    if (timezoneSelector) {
        timezoneSelector.classList.add('disabled-interactive');
    }
};

// ===============================================
// FUNCIONES DE INICIALIZACIÓN (LÓGICA INTERNA)
// ===============================================

const initializeAlarmMenu = (menuElement) => {
    setAlarmDefaults();
    updateAlarmDisplay(menuElement);
};

const initializeTimerMenu = (menuElement) => {
    updateTimerDurationDisplay(menuElement);
    renderCalendar(menuElement);
    populateHourSelectionMenu(menuElement);
};

const initializeWorldClockMenu = (menuElement) => {
    const timezoneSelector = menuElement.querySelector('[data-action="toggleTimezoneDropdown"]');
    if (timezoneSelector) {
        timezoneSelector.classList.add('disabled-interactive');
    }
};


// ===============================================
// FUNCIONES PÚBLICAS EXPORTADAS
// ===============================================

/**
 * Función central que inicializa un menú específico cuando se abre.
 * @param {string} menuName - El nombre del menú (ej. 'menuAlarm').
 */
export function initializeMenuForOverlay(menuName) {
    const menuElement = getMenuElement(menuName);
    if (!menuElement) return;

    switch (menuName) {
        case 'menuAlarm':
            initializeAlarmMenu(menuElement);
            break;
        case 'menuTimer':
            initializeTimerMenu(menuElement);
            break;
        case 'menuWorldClock':
            initializeWorldClockMenu(menuElement);
            break;
    }
}

/**
 * Función central que resetea un menú específico cuando se cierra.
 * @param {string} menuName - El nombre del menú (ej. 'menuAlarm').
 */
export function resetMenuForOverlay(menuName) {
    const menuElement = getMenuElement(menuName);
    if (!menuElement) return;

    switch (menuName) {
        case 'menuAlarm':
            resetAlarmMenu(menuElement);
            break;
        case 'menuTimer':
            resetTimerMenu(menuElement);
            break;
        case 'menuWorldClock':
            resetWorldClockMenu(menuElement);
            break;
    }
}


// ===============================================
// LÓGICA DE UI Y HELPERS (SIN CAMBIOS)
// ===============================================

const loadCountriesAndTimezones = () => new Promise((resolve, reject) => {
    if (window.ct) return resolve(window.ct);
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/gh/manuelmhtr/countries-and-timezones@latest/dist/index.min.js';
    script.onload = () => window.ct ? resolve(window.ct) : reject(new Error('Library loaded but ct object not found'));
    script.onerror = (error) => reject(new Error('Failed to load countries-and-timezones script'));
    document.head.appendChild(script);
});

const updateDisplay = (selector, text, parent = document) => {
    const element = parent.querySelector(selector);
    if (element) element.textContent = text;
};

const handleSelect = (selectedItem, displaySelector) => {
    const parentMenu = selectedItem.closest('.menu-alarm, .menu-timer, .menu-worldClock');
    if (!parentMenu) return;
    const displayElement = parentMenu.querySelector(displaySelector);
    const dropdownMenu = selectedItem.closest('.dropdown-menu-container');
    const textToDisplay = selectedItem.querySelector('.menu-link-text span')?.textContent;
    if (displayElement && textToDisplay) displayElement.textContent = textToDisplay;
    if (dropdownMenu) dropdownMenu.classList.add('disabled');
};

const toggleDropdown = (action, parentMenu) => {
    const targetSelector = dropdownMap[action];
    if (!targetSelector || !parentMenu) return;
    const targetDropdown = parentMenu.querySelector(targetSelector);
    if (!targetDropdown) return;
    const isCurrentlyOpen = !targetDropdown.classList.contains('disabled');
    document.querySelectorAll('.dropdown-menu-container').forEach(d => d.classList.add('disabled'));
    if (!isCurrentlyOpen) {
        targetDropdown.classList.remove('disabled');
        if (action === 'toggleCountryDropdown') populateCountryDropdown(parentMenu);
    }
};

const resetDropdownDisplay = (menuElement, displaySelector, translateKey, translateCategory) => {
    const display = menuElement.querySelector(displaySelector);
    if (display && typeof window.getTranslation === 'function') {
        display.textContent = window.getTranslation(translateKey, translateCategory);
    }
};

const updateAlarmDisplay = (parent) => {
    const hourText = typeof window.getTranslation === 'function' ? window.getTranslation('hours', 'timer') : 'horas';
    const minuteText = typeof window.getTranslation === 'function' ? window.getTranslation('minutes', 'timer') : 'minutos';
    updateDisplay('#hour-display', `${state.alarm.hour} ${hourText}`, parent);
    updateDisplay('#minute-display', `${state.alarm.minute} ${minuteText}`, parent);
};

const setAlarmDefaults = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 10);
    state.alarm.hour = now.getHours();
    state.alarm.minute = now.getMinutes();
};

const updateTimerDurationDisplay = (timerMenu) => {
    if (!timerMenu) return;
    updateDisplay('#timer-hour-display', `${state.timer.duration.hours} h`, timerMenu);
    updateDisplay('#timer-minute-display', `${state.timer.duration.minutes} min`, timerMenu);
    updateDisplay('#timer-second-display', `${state.timer.duration.seconds} s`, timerMenu);
};

const updateTimerTabView = (timerMenu) => {
    if (!timerMenu) return;
    timerMenu.querySelectorAll('.menu-tab[data-tab]').forEach(t => t.classList.remove('active'));
    timerMenu.querySelectorAll('.menu-content-wrapper[data-tab-content]').forEach(c => { c.classList.remove('active'); c.classList.add('disabled'); });
    const activeTab = timerMenu.querySelector(`.menu-tab[data-tab="${state.timer.currentTab}"]`);
    const activeContent = timerMenu.querySelector(`.menu-content-wrapper[data-tab-content="${state.timer.currentTab}"]`);
    if (activeTab) activeTab.classList.add('active');
    if (activeContent) { activeContent.classList.remove('disabled'); activeContent.classList.add('active'); }
};

const renderCalendar = (timerMenu) => {
    if (!timerMenu) return;
    const monthYearDisplay = timerMenu.querySelector('#calendar-month-year');
    const daysContainer = timerMenu.querySelector('.calendar-days');
    if (!monthYearDisplay || !daysContainer) return;
    const date = state.timer.countTo.date;
    monthYearDisplay.textContent = date.toLocaleDateString(navigator.language, { month: 'long', year: 'numeric' });
    daysContainer.innerHTML = '';
    const firstDayIndex = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    const lastDate = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    for (let i = 0; i < firstDayIndex; i++) daysContainer.innerHTML += `<div class="day other-month"></div>`;
    for (let i = 1; i <= lastDate; i++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'day'; dayEl.textContent = i; dayEl.dataset.day = i;
        const today = new Date();
        if (i === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()) dayEl.classList.add('today');
        if (state.timer.countTo.selectedDate && i === new Date(state.timer.countTo.selectedDate).getDate() && date.getMonth() === new Date(state.timer.countTo.selectedDate).getMonth()) dayEl.classList.add('selected');
        daysContainer.appendChild(dayEl);
    }
};

const selectCalendarDate = (day, timerMenu) => {
    state.timer.countTo.selectedDate = new Date(state.timer.countTo.date.getFullYear(), state.timer.countTo.date.getMonth(), day).toISOString();
    updateDisplay('#selected-date-display', new Date(state.timer.countTo.selectedDate).toLocaleDateString(), timerMenu);
    timerMenu.querySelector('.calendar-container')?.classList.add('disabled');
    renderCalendar(timerMenu);
};

const populateHourSelectionMenu = (timerMenu) => {
    if (!timerMenu) return;
    const hourMenu = timerMenu.querySelector('.menu-timer-hour-selection .menu-list');
    if (!hourMenu || hourMenu.children.length > 0) return;
    for (let i = 0; i < 24; i++) {
        const hour = String(i).padStart(2, '0');
        const link = document.createElement('div');
        link.className = 'menu-link'; link.setAttribute('data-action', 'selectTimerHour'); link.setAttribute('data-hour', i);
        link.innerHTML = `<div class="menu-link-text"><span>${hour}:00</span></div>`;
        hourMenu.appendChild(link);
    }
};

const populateMinuteSelectionMenu = (hour, timerMenu) => {
    if (!timerMenu) return;
    const minuteMenu = timerMenu.querySelector('.menu-timer-minute-selection .menu-list');
    if (!minuteMenu) return;
    minuteMenu.innerHTML = '';
    for (let j = 0; j < 60; j += 5) {
        const hourStr = String(hour).padStart(2, '0');
        const minuteStr = String(j).padStart(2, '0');
        const link = document.createElement('div');
        link.className = 'menu-link'; link.setAttribute('data-action', 'selectTimerMinute'); link.setAttribute('data-hour', hour); link.setAttribute('data-minute', j);
        link.innerHTML = `<div class="menu-link-text"><span>${hourStr}:${minuteStr}</span></div>`;
        minuteMenu.appendChild(link);
    }
};

async function populateCountryDropdown(parentMenu) {
    const countryList = parentMenu.querySelector('.menu-worldclock-country .menu-list');
    if (!countryList) return;
    if (countryList.children.length > 1) return; // Already populated
    const loadingText = (typeof window.getTranslation === 'function') ? window.getTranslation('loading_countries', 'world_clock') : 'Loading countries...';
    countryList.innerHTML = `<div class="menu-link-text" style="padding: 0 12px;"><span>${loadingText}</span></div>`;
    try {
        const ct = await loadCountriesAndTimezones();
        const countries = Object.values(ct.getAllCountries()).sort((a, b) => a.name.localeCompare(b.name));
        countryList.innerHTML = '';
        countries.forEach(country => {
            const link = document.createElement('div');
            link.className = 'menu-link'; link.setAttribute('data-action', 'selectCountry'); link.setAttribute('data-country-code', country.id);
            link.innerHTML = `<div class="menu-link-icon"><span class="material-symbols-rounded">public</span></div><div class="menu-link-text"><span>${country.name}</span></div>`;
            countryList.appendChild(link);
        });
    } catch (error) {
        const errorText = (typeof window.getTranslation === 'function') ? window.getTranslation('error_loading_countries', 'world_clock') : '❌ Error loading countries.';
        countryList.innerHTML = `<div class="menu-link-text" style="padding: 0 12px;"><span>${errorText}</span></div>`;
    }
}


async function populateTimezoneDropdown(parentMenu, countryCode) {
    const timezoneList = parentMenu.querySelector('.menu-worldclock-timezone .menu-list');
    const timezoneSelector = parentMenu.querySelector('[data-action="toggleTimezoneDropdown"]');
    if (!timezoneList || !timezoneSelector) return;
    timezoneList.innerHTML = '';
    try {
        const ct = await loadCountriesAndTimezones();
        const timezones = ct.getTimezonesForCountry(countryCode);
        if (timezones && timezones.length > 0) {
            timezones.forEach(tz => {
                const cityName = tz.name.split('/').pop().replace(/_/g, ' ');
                const displayName = `(UTC ${tz.utcOffsetStr}) ${cityName}`;
                const link = document.createElement('div');
                link.className = 'menu-link'; link.setAttribute('data-action', 'selectTimezone'); link.setAttribute('data-timezone', tz.name);
                link.innerHTML = `<div class="menu-link-icon"><span class="material-symbols-rounded">schedule</span></div><div class="menu-link-text"><span>${displayName}</span></div>`;
                timezoneList.appendChild(link);
            });
            timezoneSelector.classList.remove('disabled-interactive');
        } else {
            const noTimezonesText = (typeof window.getTranslation === 'function') ? window.getTranslation('no_timezones_found', 'world_clock') : '⚠️ No timezones found.';
            timezoneList.innerHTML = `<div class="menu-link-text" style="padding: 0 12px;"><span>${noTimezonesText}</span></div>`;
            timezoneSelector.classList.add('disabled-interactive');
        }
    } catch (error) {
        const errorText = (typeof window.getTranslation === 'function') ? window.getTranslation('error_loading_timezones', 'world_clock') : '❌ Error loading timezones.';
        timezoneList.innerHTML = `<div class="menu-link-text" style="padding: 0 12px;"><span>${errorText}</span></div>`;
        timezoneSelector.classList.add('disabled-interactive');
    }
}


function setupGlobalEventListeners() {
    document.addEventListener('click', (event) => {
        const isClickInsideDropdown = event.target.closest('.dropdown-menu-container');
        const isClickOnToggle = event.target.closest('[data-action]')?.dataset.action in dropdownMap;
        const isCalendarNavigation = event.target.closest('.calendar-nav, .calendar-header, .calendar-weekdays, .day.other-month');
        if (!isClickInsideDropdown && !isClickOnToggle && !isCalendarNavigation) {
            document.querySelectorAll('.dropdown-menu-container').forEach(d => d.classList.add('disabled'));
        }
    });

    // MODIFIED: Country search listener with no-results message
    document.body.addEventListener('input', (event) => {
        const searchInput = event.target.closest('#country-search-input');
        if (searchInput) {
            const searchTerm = searchInput.value.toLowerCase();
            const countryDropdown = searchInput.closest('.menu-worldclock-country');
            const countryList = countryDropdown.querySelector('.menu-list');
            const countries = countryList.querySelectorAll('.menu-link');
            let matchesFound = 0;

            countries.forEach(country => {
                const countryName = country.querySelector('.menu-link-text span').textContent.toLowerCase();
                if (countryName.includes(searchTerm)) {
                    country.style.display = 'flex';
                    matchesFound++;
                } else {
                    country.style.display = 'none';
                }
            });

            // Handle "No results" message
            let noResultsMsg = countryList.querySelector('.no-results-message');
            if (matchesFound === 0 && searchTerm) {
                if (!noResultsMsg) {
                    noResultsMsg = document.createElement('div');
                    noResultsMsg.className = 'menu-link-text no-results-message';
                    noResultsMsg.style.padding = '8px 12px';
                    noResultsMsg.style.textAlign = 'center';
                    noResultsMsg.style.color = '#888';
                    countryList.appendChild(noResultsMsg);
                }
                const noResultsText = (typeof window.getTranslation === 'function')
                    ? window.getTranslation('no_results', 'search')
                    : 'No results found for';
                noResultsMsg.textContent = `${noResultsText} "${searchInput.value}"`;
                noResultsMsg.style.display = 'block';
            } else {
                if (noResultsMsg) {
                    noResultsMsg.style.display = 'none';
                }
            }
        }
    });

    document.body.addEventListener('click', async (event) => {
        const parentMenu = event.target.closest('.menu-alarm, .menu-timer, .menu-worldClock');
        if (!parentMenu) return;

        const tabTarget = event.target.closest('.menu-tab[data-tab]');
        if (tabTarget) { state.timer.currentTab = tabTarget.dataset.tab; updateTimerTabView(parentMenu); return; }

        const dayTarget = event.target.closest('.calendar-days .day:not(.other-month)');
        if (dayTarget && dayTarget.dataset.day) { event.stopPropagation(); selectCalendarDate(parseInt(dayTarget.dataset.day, 10), parentMenu); return; }

        const actionTarget = event.target.closest('[data-action]');
        if (!actionTarget) return;

        const action = actionTarget.dataset.action;
        if (dropdownMap[action]) { toggleDropdown(action, parentMenu); return; }

        switch (action) {
            case 'increaseHour': state.alarm.hour = (state.alarm.hour + 1) % 24; updateAlarmDisplay(parentMenu); break;
            case 'decreaseHour': state.alarm.hour = (state.alarm.hour - 1 + 24) % 24; updateAlarmDisplay(parentMenu); break;
            case 'increaseMinute': state.alarm.minute = (state.alarm.minute + 1) % 60; updateAlarmDisplay(parentMenu); break;
            case 'decreaseMinute': state.alarm.minute = (state.alarm.minute - 1 + 60) % 60; updateAlarmDisplay(parentMenu); break;
            case 'selectAlarmSound': event.stopPropagation(); handleSelect(actionTarget, '#alarm-selected-sound'); state.alarm.sound = actionTarget.dataset.sound; break;
            case 'increaseTimerHour': state.timer.duration.hours = (state.timer.duration.hours + 1) % 100; updateTimerDurationDisplay(parentMenu); break;
            case 'decreaseTimerHour': state.timer.duration.hours = (state.timer.duration.hours - 1 + 100) % 100; updateTimerDurationDisplay(parentMenu); break;
            case 'increaseTimerMinute': state.timer.duration.minutes = (state.timer.duration.minutes + 1) % 60; updateTimerDurationDisplay(parentMenu); break;
            case 'decreaseTimerMinute': state.timer.duration.minutes = (state.timer.duration.minutes - 1 + 60) % 60; updateTimerDurationDisplay(parentMenu); break;
            case 'increaseTimerSecond': state.timer.duration.seconds = (state.timer.duration.seconds + 1) % 60; updateTimerDurationDisplay(parentMenu); break;
            case 'decreaseTimerSecond': state.timer.duration.seconds = (state.timer.duration.seconds - 1 + 60) % 60; updateTimerDurationDisplay(parentMenu); break;
            case 'selectTimerEndAction': event.stopPropagation(); handleSelect(actionTarget, '#timer-selected-end-action'); state.timer.endAction = actionTarget.dataset.endAction; break;
            case 'selectTimerSound': event.stopPropagation(); handleSelect(actionTarget, '#timer-selected-sound'); state.timer.sound = actionTarget.dataset.sound; break;
            case 'prev-month': state.timer.countTo.date.setMonth(state.timer.countTo.date.getMonth() - 1); renderCalendar(parentMenu); break;
            case 'next-month': state.timer.countTo.date.setMonth(state.timer.countTo.date.getMonth() + 1); renderCalendar(parentMenu); break;
            case 'selectTimerHour':
                event.stopPropagation();
                const hour = parseInt(actionTarget.dataset.hour, 10);
                state.timer.countTo.selectedHour = hour;
                updateDisplay('#selected-hour-display', String(hour).padStart(2, '0'), parentMenu);
                updateDisplay('#selected-minute-display', '--', parentMenu);
                actionTarget.closest('.dropdown-menu-container')?.classList.add('disabled');
                populateMinuteSelectionMenu(hour, parentMenu);
                const minuteMenu = parentMenu.querySelector('.menu-timer-minute-selection');
                if (minuteMenu) minuteMenu.classList.remove('disabled');
                state.timer.countTo.timeSelectionStep = 'minute';
                break;
            case 'selectTimerMinute':
                event.stopPropagation();
                const minute = parseInt(actionTarget.dataset.minute, 10);
                state.timer.countTo.selectedMinute = minute;
                updateDisplay('#selected-minute-display', String(minute).padStart(2, '0'), parentMenu);
                actionTarget.closest('.dropdown-menu-container')?.classList.add('disabled');
                state.timer.countTo.timeSelectionStep = 'hour';
                break;
            case 'selectCountry':
                event.stopPropagation();
                const countryCode = actionTarget.getAttribute('data-country-code');
                handleSelect(actionTarget, '#worldclock-selected-country');
                state.worldClock.country = actionTarget.querySelector('.menu-link-text span')?.textContent;
                resetDropdownDisplay(parentMenu, '#worldclock-selected-timezone', 'select_a_timezone', 'world_clock');
                state.worldClock.timezone = '';
                await populateTimezoneDropdown(parentMenu, countryCode);
                break;
            case 'selectTimezone':
                event.stopPropagation();
                handleSelect(actionTarget, '#worldclock-selected-timezone');
                state.worldClock.timezone = actionTarget.getAttribute('data-timezone');
                break;

            // ===============================================
            // LÓGICA DE VALIDACIÓN Y CREACIÓN
            // ===============================================
            case 'createAlarm': {
                const alarmTitleInput = parentMenu.querySelector('#alarm-title');
                const alarmTitle = alarmTitleInput ? alarmTitleInput.value.trim() : '';

                if (!alarmTitle) {
                    console.warn('⚠️ Se bloqueó la creación de la alarma: falta el título.');
                    return; 
                }

                const alarmData = { title: alarmTitle, ...state.alarm };
                console.group("⏰ Alarma Creada (Datos)");
                console.log("Datos:", alarmData);
                console.groupEnd();
                break;
            }
            case 'createTimer': {
                const timerMenu = parentMenu; 
                if (state.timer.currentTab === 'countdown') {
                    const timerTitleInput = timerMenu.querySelector('#timer-title');
                    const timerTitle = timerTitleInput ? timerTitleInput.value.trim() : '';
                    const { hours, minutes, seconds } = state.timer.duration;

                    if (!timerTitle) {
                        console.warn('⚠️ Se bloqueó la creación del temporizador: falta el título.');
                        return;
                    }
                    if (hours === 0 && minutes === 0 && seconds === 0) {
                        console.warn('⚠️ Se bloqueó la creación del temporizador: la duración no puede ser cero.');
                        return;
                    }

                    const timerData = { type: 'countdown', title: timerTitle, duration: { ...state.timer.duration }, endAction: state.timer.endAction, sound: state.timer.sound };
                    console.group("⏱️ Temporizador Creado (Countdown)");
                    console.log("Datos:", timerData);
                    console.groupEnd();

                } else { // 'count_to_date'
                    const eventTitleInput = timerMenu.querySelector('#countto-title');
                    const eventTitle = eventTitleInput ? eventTitleInput.value.trim() : '';
                    const { selectedDate, selectedHour, selectedMinute } = state.timer.countTo;

                    if (!eventTitle) {
                        console.warn('⚠️ Se bloqueó la creación del evento: falta el título.');
                        return;
                    }
                    if (selectedDate == null) { 
                        console.warn('⚠️ Se bloqueó la creación del evento: falta seleccionar la fecha.');
                        return;
                    }
                    if (typeof selectedHour !== 'number' || typeof selectedMinute !== 'number') {
                        console.warn('⚠️ Se bloqueó la creación del evento: falta seleccionar la hora y los minutos.');
                        return;
                    }

                    const eventData = { type: 'count_to_date', title: eventTitle, ...state.timer.countTo };
                    console.group("📅 Temporizador Creado (Conteo a Fecha)");
                    console.log("Datos:", eventData);
                    console.groupEnd();
                }
                break;
            }
            case 'addWorldClock': {
                const clockTitleInput = parentMenu.querySelector('#worldclock-title');
                const clockTitle = clockTitleInput ? clockTitleInput.value.trim() : '';
                const { country, timezone } = state.worldClock;
            
                if (!clockTitle) {
                    console.warn('⚠️ Se bloqueó la creación del reloj: falta el título.');
                    return;
                }
                if (!country) {
                    console.warn('⚠️ Se bloqueó la creación del reloj: falta seleccionar el país.');
                    return;
                }
                if (!timezone) {
                    console.warn('⚠️ Se bloqueó la creación del reloj: falta seleccionar la zona horaria.');
                    return;
                }
            
                // --- CÁLCULO DE LA HORA LOCAL ---
                let currentTimeInZone = 'No se pudo obtener la hora.';
                try {
                    const date = new Date();
                    const appLanguage = typeof window.getCurrentLanguage === 'function' ? window.getCurrentLanguage() : 'en-US';
                    
                    const options = {
                        timeZone: timezone,
                        year: 'numeric', month: 'long', day: 'numeric',
                        hour: 'numeric', minute: 'numeric', second: 'numeric',
                    };

                    currentTimeInZone = new Intl.DateTimeFormat(appLanguage, options).format(date);
                } catch (e) {
                    console.error(`Error al formatear la fecha para la zona horaria ${timezone}:`, e);
                }
                // --- FIN DEL CÁLCULO ---

                const clockData = { 
                    title: clockTitle, 
                    country: country,
                    timezone: timezone,
                    currentTime: currentTimeInZone // <- Dato añadido
                };

                console.group("🌍 Reloj Mundial Agregado");
                console.log("Datos:", clockData);
                console.groupEnd();
                break;
            }
        }
    });
}

// Inicializar los listeners globales una vez.
initMenuInteractions();