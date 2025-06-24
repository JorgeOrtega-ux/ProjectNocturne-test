document.addEventListener('DOMContentLoaded', () => {
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
            duration: {
                hours: 0,
                minutes: 5,
                seconds: 0
            },
            countTo: {
                date: new Date(),
                selectedDate: null,
                selectedHour: null,
                selectedMinute: null,
                timeSelectionStep: 'hour'
            },
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
    // Se reinicia el objeto de fecha para que sea una instancia válida
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

    // --- CARGAR LIBRERÍA DE PAÍSES Y ZONAS HORARIAS CON AUTO-UPDATE ---
    function loadCountriesAndTimezones() {
        return new Promise((resolve, reject) => {
            if (window.ct) {
                resolve(window.ct);
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/gh/manuelmhtr/countries-and-timezones@latest/dist/index.min.js';
            script.onload = () => window.ct ? resolve(window.ct) : reject(new Error('Library loaded but ct object not found'));
            script.onerror = (error) => reject(new Error('Failed to load countries-and-timezones script'));
            document.head.appendChild(script);
        });
    }

    // ===============================================
    // FUNCIONES GENÉRICAS DE UI
    // ===============================================

    const updateDisplay = (selector, text, parent = document) => {
        const element = parent.querySelector(selector);
        if (element) {
            element.textContent = text;
        }
    };

    const handleSelect = (selectedItem, displaySelector) => {
        const parentMenu = selectedItem.closest('.menu-alarm, .menu-timer, .menu-worldClock');
        if (!parentMenu) return;

        const displayElement = parentMenu.querySelector(displaySelector);
        const dropdownMenu = selectedItem.closest('.dropdown-menu-container');
        const textToDisplay = selectedItem.querySelector('.menu-link-text span')?.textContent;

        if (displayElement && textToDisplay) {
            displayElement.textContent = textToDisplay;
        }

        if (dropdownMenu) {
            dropdownMenu.classList.add('disabled');
        }
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

    // ===============================================
    // LÓGICA DE RESETEO DE MENÚS
    // ===============================================
    
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
    
        updateTimerTabView();
        updateTimerDurationDisplay();
        renderCalendar();
    
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

        const searchInput = menuElement.querySelector('.search-content-text input');
        if (searchInput) searchInput.value = '';
    
        resetDropdownDisplay(menuElement, '#worldclock-selected-country', 'select_a_country', 'world_clock');
        resetDropdownDisplay(menuElement, '#worldclock-selected-timezone', 'select_a_timezone', 'world_clock');
    
        const timezoneSelector = menuElement.querySelector('[data-action="toggleTimezoneDropdown"]');
        if (timezoneSelector) {
            timezoneSelector.classList.add('disabled-interactive');
        }
    };


    // ===============================================
    // LÓGICA ESPECÍFICA DE LOS MENÚS
    // ===============================================

    const updateAlarmDisplay = (parent) => {
        updateDisplay('#hour-display', `${state.alarm.hour} horas`, parent);
        updateDisplay('#minute-display', `${state.alarm.minute} minutos`, parent);
    };

    const setAlarmDefaults = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 10);
        state.alarm.hour = now.getHours();
        state.alarm.minute = now.getMinutes();
    };

    const timerMenu = document.querySelector('.menu-timer[data-menu="Timer"]');

    const updateTimerDurationDisplay = () => {
        if (!timerMenu) return;
        updateDisplay('#timer-hour-display', `${state.timer.duration.hours} h`, timerMenu);
        updateDisplay('#timer-minute-display', `${state.timer.duration.minutes} min`, timerMenu);
        updateDisplay('#timer-second-display', `${state.timer.duration.seconds} s`, timerMenu);
    };

    const updateTimerTabView = () => {
        if (!timerMenu) return;
        timerMenu.querySelectorAll('.menu-tab[data-tab]').forEach(t => t.classList.remove('active'));
        timerMenu.querySelectorAll('.menu-content-wrapper[data-tab-content]').forEach(c => {
            c.classList.remove('active');
            c.classList.add('disabled');
        });

        const activeTab = timerMenu.querySelector(`.menu-tab[data-tab="${state.timer.currentTab}"]`);
        const activeContent = timerMenu.querySelector(`.menu-content-wrapper[data-tab-content="${state.timer.currentTab}"]`);

        if (activeTab) activeTab.classList.add('active');
        if (activeContent) {
            activeContent.classList.remove('disabled');
            activeContent.classList.add('active');
        }
    };

    const renderCalendar = () => {
        if (!timerMenu) return;
        const monthYearDisplay = timerMenu.querySelector('#calendar-month-year');
        const daysContainer = timerMenu.querySelector('.calendar-days');
        if (!monthYearDisplay || !daysContainer) return;

        const date = state.timer.countTo.date;
        monthYearDisplay.textContent = date.toLocaleDateString(navigator.language, {
            month: 'long',
            year: 'numeric'
        });

        daysContainer.innerHTML = '';
        const firstDayIndex = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
        const lastDate = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

        for (let i = 0; i < firstDayIndex; i++) {
            daysContainer.innerHTML += `<div class="day other-month"></div>`;
        }

        for (let i = 1; i <= lastDate; i++) {
            const dayEl = document.createElement('div');
            dayEl.className = 'day';
            dayEl.textContent = i;
            dayEl.dataset.day = i;

            const today = new Date();
            if (i === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()) {
                dayEl.classList.add('today');
            }
            if (state.timer.countTo.selectedDate && i === new Date(state.timer.countTo.selectedDate).getDate() && date.getMonth() === new Date(state.timer.countTo.selectedDate).getMonth()) {
                dayEl.classList.add('selected');
            }
            daysContainer.appendChild(dayEl);
        }
    };

    const selectCalendarDate = (day) => {
        state.timer.countTo.selectedDate = new Date(state.timer.countTo.date.getFullYear(), state.timer.countTo.date.getMonth(), day).toISOString();
        updateDisplay('#selected-date-display', new Date(state.timer.countTo.selectedDate).toLocaleDateString(), timerMenu);
        timerMenu.querySelector('.calendar-container')?.classList.add('disabled');
        renderCalendar();
    };

    const populateHourSelectionMenu = () => {
        if (!timerMenu) return;
        const hourMenu = timerMenu.querySelector('.menu-timer-hour-selection .menu-list');
        if (!hourMenu || hourMenu.children.length > 0) return;

        for (let i = 0; i < 24; i++) {
            const hour = String(i).padStart(2, '0');
            const link = document.createElement('div');
            link.className = 'menu-link';
            link.setAttribute('data-action', 'selectTimerHour');
            link.setAttribute('data-hour', i);
            link.innerHTML = `<div class="menu-link-text"><span>${hour}:00</span></div>`;
            hourMenu.appendChild(link);
        }
    };
    
    const populateMinuteSelectionMenu = (hour) => {
        if (!timerMenu) return;
        const minuteMenu = timerMenu.querySelector('.menu-timer-minute-selection .menu-list');
        if (!minuteMenu) return;

        minuteMenu.innerHTML = '';

        for (let j = 0; j < 60; j += 5) {
            const hourStr = String(hour).padStart(2, '0');
            const minuteStr = String(j).padStart(2, '0');
            const link = document.createElement('div');
            link.className = 'menu-link';
            link.setAttribute('data-action', 'selectTimerMinute');
            link.setAttribute('data-hour', hour);
            link.setAttribute('data-minute', j);
            link.innerHTML = `<div class="menu-link-text"><span>${hourStr}:${minuteStr}</span></div>`;
            minuteMenu.appendChild(link);
        }
    };

    async function populateCountryDropdown(parentMenu) {
        const countryList = parentMenu.querySelector('.menu-worldclock-country .menu-list');
        if (!countryList) return;

        if (countryList.children.length <= 1) {
            countryList.innerHTML = `<div class="menu-link-text" style="padding: 0 12px;"><span>🌍 Cargando países...</span></div>`;
            try {
                const ct = await loadCountriesAndTimezones();
                const countries = Object.values(ct.getAllCountries()).sort((a, b) => a.name.localeCompare(b.name));
                countryList.innerHTML = '';
                countries.forEach(country => {
                    const link = document.createElement('div');
                    link.className = 'menu-link';
                    link.setAttribute('data-action', 'selectCountry');
                    link.setAttribute('data-country-code', country.id);
                    link.innerHTML = `<div class="menu-link-icon"><span class="material-symbols-rounded">public</span></div><div class="menu-link-text"><span>${country.name}</span></div>`;
                    countryList.appendChild(link);
                });
            } catch (error) {
                countryList.innerHTML = `<div class="menu-link-text" style="padding: 0 12px;"><span>❌ Error al cargar países.</span></div>`;
            }
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
                    link.className = 'menu-link';
                    link.setAttribute('data-action', 'selectTimezone');
                    link.setAttribute('data-timezone', tz.name);
                    link.innerHTML = `<div class="menu-link-icon"><span class="material-symbols-rounded">schedule</span></div><div class="menu-link-text"><span>${displayName}</span></div>`;
                    timezoneList.appendChild(link);
                });
                timezoneSelector.classList.remove('disabled-interactive');
            } else {
                timezoneList.innerHTML = `<div class="menu-link-text" style="padding: 0 12px;"><span>⚠️ No hay zonas horarias.</span></div>`;
                timezoneSelector.classList.add('disabled-interactive');
            }
        } catch (error) {
            timezoneList.innerHTML = `<div class="menu-link-text" style="padding: 0 12px;"><span>❌ Error al cargar zonas horarias.</span></div>`;
            timezoneSelector.classList.add('disabled-interactive');
        }
    }

    // ===============================================
    // INICIALIZACIÓN Y MANEJO DE EVENTOS
    // ===============================================

    function initialize() {
        
        if (timerMenu) {
            updateTimerDurationDisplay();
            renderCalendar();
            populateHourSelectionMenu();
        }

        const setupObserver = (menuSelector, onOpen, onClose) => {
            const menuElement = document.querySelector(menuSelector);
            if (menuElement) {
                const observer = new MutationObserver((mutationsList) => {
                    for (const mutation of mutationsList) {
                        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                            const isNowActive = menuElement.classList.contains('active');
                            const wasActive = mutation.oldValue && mutation.oldValue.includes('active');
                            if (isNowActive && !wasActive) onOpen(menuElement);
                            else if (!isNowActive && wasActive) onClose(menuElement);
                        }
                    }
                });
                observer.observe(menuElement, { attributes: true, attributeOldValue: true });
            }
        };

        setupObserver('.menu-alarm[data-menu="Alarm"]', 
            (el) => {
                console.log('⏰ Alarm menu opened. Setting default time.');
                setAlarmDefaults();
                updateAlarmDisplay(el);
            },
            (el) => {
                console.log('⏰ Alarm menu closed. Resetting.');
                resetAlarmMenu(el);
            }
        );

        setupObserver('.menu-timer[data-menu="Timer"]', 
            () => console.log('⏱️ Timer menu opened.'),
            (el) => {
                console.log('⏱️ Timer menu closed. Resetting.');
                resetTimerMenu(el);
            }
        );
        
        setupObserver('.menu-worldClock[data-menu="WorldClock"]',
             () => console.log('🌍 World Clock menu opened.'),
             (el) => {
                console.log('🌍 World Clock menu closed. Resetting.');
                resetWorldClockMenu(el);
             }
        );

        const timezoneSelector = document.querySelector('[data-action="toggleTimezoneDropdown"]');
        if (timezoneSelector) {
            timezoneSelector.classList.add('disabled-interactive');
        }

        document.addEventListener('click', (event) => {
            const isClickInsideDropdown = event.target.closest('.dropdown-menu-container');
            const isClickOnToggle = event.target.closest('[data-action]')?.dataset.action in dropdownMap;
            const isCalendarNavigation = event.target.closest('.calendar-nav, .calendar-header, .calendar-weekdays, .day.other-month');

            if (!isClickInsideDropdown && !isClickOnToggle && !isCalendarNavigation) {
                document.querySelectorAll('.dropdown-menu-container').forEach(d => d.classList.add('disabled'));
            }
        });

        document.body.addEventListener('click', async (event) => {
            const parentMenu = event.target.closest('.menu-alarm, .menu-timer, .menu-worldClock');
            const tabTarget = event.target.closest('.menu-tab[data-tab]');

            if (tabTarget) {
                state.timer.currentTab = tabTarget.dataset.tab;
                updateTimerTabView();
                return;
            }

            const dayTarget = event.target.closest('.calendar-days .day:not(.other-month)');
            if (dayTarget && dayTarget.dataset.day) {
                event.stopPropagation();
                selectCalendarDate(parseInt(dayTarget.dataset.day, 10));
                return;
            }

            const actionTarget = event.target.closest('[data-action]');
            if (!actionTarget) return;

            const action = actionTarget.dataset.action;

            if (dropdownMap[action]) {
                toggleDropdown(action, parentMenu);
                return;
            }

            if (!parentMenu) return;

            switch (action) {
                case 'increaseHour': state.alarm.hour = (state.alarm.hour + 1) % 24; updateAlarmDisplay(parentMenu); break;
                case 'decreaseHour': state.alarm.hour = (state.alarm.hour - 1 + 24) % 24; updateAlarmDisplay(parentMenu); break;
                case 'increaseMinute': state.alarm.minute = (state.alarm.minute + 1) % 60; updateAlarmDisplay(parentMenu); break;
                case 'decreaseMinute': state.alarm.minute = (state.alarm.minute - 1 + 60) % 60; updateAlarmDisplay(parentMenu); break;
                case 'selectAlarmSound':
                    event.stopPropagation();
                    handleSelect(actionTarget, '#alarm-selected-sound');
                    state.alarm.sound = actionTarget.dataset.sound;
                    break;
                case 'increaseTimerHour': state.timer.duration.hours = (state.timer.duration.hours + 1) % 100; updateTimerDurationDisplay(); break;
                case 'decreaseTimerHour': state.timer.duration.hours = (state.timer.duration.hours - 1 + 100) % 100; updateTimerDurationDisplay(); break;
                case 'increaseTimerMinute': state.timer.duration.minutes = (state.timer.duration.minutes + 1) % 60; updateTimerDurationDisplay(); break;
                case 'decreaseTimerMinute': state.timer.duration.minutes = (state.timer.duration.minutes - 1 + 60) % 60; updateTimerDurationDisplay(); break;
                case 'increaseTimerSecond': state.timer.duration.seconds = (state.timer.duration.seconds + 1) % 60; updateTimerDurationDisplay(); break;
                case 'decreaseTimerSecond': state.timer.duration.seconds = (state.timer.duration.seconds - 1 + 60) % 60; updateTimerDurationDisplay(); break;
                case 'selectTimerEndAction':
                    event.stopPropagation();
                    handleSelect(actionTarget, '#timer-selected-end-action');
                    state.timer.endAction = actionTarget.dataset.endAction;
                    break;
                case 'selectTimerSound':
                    event.stopPropagation();
                    handleSelect(actionTarget, '#timer-selected-sound');
                    state.timer.sound = actionTarget.dataset.sound;
                    break;

                case 'prev-month': state.timer.countTo.date.setMonth(state.timer.countTo.date.getMonth() - 1); renderCalendar(); break;
                case 'next-month': state.timer.countTo.date.setMonth(state.timer.countTo.date.getMonth() + 1); renderCalendar(); break;
                
                case 'selectTimerHour':
                    event.stopPropagation();
                    const hour = parseInt(actionTarget.dataset.hour, 10);
                    state.timer.countTo.selectedHour = hour;
                    updateDisplay('#selected-hour-display', String(hour).padStart(2, '0'), parentMenu);
                    updateDisplay('#selected-minute-display', '--', parentMenu);
                    actionTarget.closest('.dropdown-menu-container')?.classList.add('disabled');
                    populateMinuteSelectionMenu(hour);
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
                    const countryName = actionTarget.querySelector('.menu-link-text span')?.textContent;
                    const countryCode = actionTarget.getAttribute('data-country-code');
                    handleSelect(actionTarget, '#worldclock-selected-country');
                    state.worldClock.country = countryName;
                    updateDisplay('#worldclock-selected-timezone', 'Seleccionar zona horaria', parentMenu);
                    state.worldClock.timezone = '';
                    await populateTimezoneDropdown(parentMenu, countryCode);
                    break;

                case 'selectTimezone':
                    event.stopPropagation();
                    const timezoneName = actionTarget.getAttribute('data-timezone');
                    handleSelect(actionTarget, '#worldclock-selected-timezone');
                    state.worldClock.timezone = timezoneName;
                    break;

                case 'createAlarm':
                    const alarmTitle = parentMenu.querySelector('#alarm-title')?.value || 'Mi nueva alarma';
                    const alarmData = { title: alarmTitle, ...state.alarm };
                    console.group("⏰ Alarma Creada (Datos)");
                    console.log("Datos:", alarmData);
                    console.groupEnd();
                    break;

                case 'createTimer':
                    if (state.timer.currentTab === 'countdown') {
                        const timerTitle = timerMenu.querySelector('#timer-title')?.value || 'Mi nuevo temporizador';
                        const timerData = { type: 'countdown', title: timerTitle, duration: { ...state.timer.duration }, endAction: state.timer.endAction, sound: state.timer.sound };
                        console.group("⏱️ Temporizador Creado (Countdown)");
                        console.log("Datos:", timerData);
                        console.groupEnd();
                    } else {
                        const eventTitle = timerMenu.querySelector('#countto-title')?.value || 'Mi evento especial';
                        const eventData = { type: 'count_to_date', title: eventTitle, ...state.timer.countTo };
                        console.group("📅 Temporizador Creado (Conteo a Fecha)");
                        console.log("Datos:", eventData);
                        console.groupEnd();
                    }
                    break;
                    
                case 'addWorldClock':
                    const clockTitle = parentMenu.querySelector('#worldclock-title')?.value || 'Nuevo reloj';
                    const clockData = { title: clockTitle, ...state.worldClock };
                    console.group("🌍 Reloj Mundial Agregado");
                    console.log("Datos:", clockData);
                    console.groupEnd();
                    break;
            }
        });
    }

    // ===============================================
    // INICIALIZACIÓN FINAL
    // ===============================================

    initialize();
});