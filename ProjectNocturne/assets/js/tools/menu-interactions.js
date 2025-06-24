document.addEventListener('DOMContentLoaded', () => {
    "use strict";

    // --- ESTADO CENTRALIZADO PARA TODOS LOS MENÚS ---
    const state = {
        alarm: {
            hour: 0,
            minute: 0,
            sound: 'classic-beep' // Valor inicial por defecto
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
                timeSelectionStep: 'hour' // 'hour' o 'minute'
            },
            endAction: 'stop', // Valor inicial por defecto
            sound: 'classic-beep' // Valor inicial por defecto
        },
        worldClock: {
            country: '',
            timezone: ''
        }
    };

    // --- MAPEO DE ACCIONES A DROPDOWNS ---
    const dropdownMap = {
        // Alarma
        'toggleAlarmSoundDropdown': '.menu-alarm-sound',
        
        // Timer
        'toggleTimerEndActionDropdown': '.menu-timer-end-action',
        'toggleTimerSoundDropdown': '.menu-timer-sound',
        'toggleCalendarDropdown': '.calendar-container',
        'toggleTimerHourDropdown': '.menu-timer-hour-selection',
        
        // World Clock
        'toggleCountryDropdown': '.menu-worldclock-country',
        'toggleTimezoneDropdown': '.menu-worldclock-timezone'
    };

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
        
        // Cerrar todos los dropdowns primero
        document.querySelectorAll('.dropdown-menu-container').forEach(d => d.classList.add('disabled'));

        // Si el dropdown estaba cerrado, abrirlo
        if (!isCurrentlyOpen) {
            targetDropdown.classList.remove('disabled');
            
            if (action === 'toggleCountryDropdown') {
                populateCountryDropdown(parentMenu);
            }
            
            if (action === 'toggleTimerHourDropdown') {
                state.timer.countTo.timeSelectionStep = 'hour';
                updateDisplay('#selected-hour-display', '--', parentMenu);
                updateDisplay('#selected-minute-display', '--', parentMenu);
            }
        }
    };

    // ===============================================
    // LÓGICA ESPECÍFICA DE LOS MENÚS
    // ===============================================

    const updateAlarmDisplay = (parent) => {
        updateDisplay('#hour-display', `${state.alarm.hour} horas`, parent);
        updateDisplay('#minute-display', `${state.alarm.minute} minutos`, parent);
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
            if (state.timer.countTo.selectedDate && i === state.timer.countTo.selectedDate.getDate() && date.getMonth() === state.timer.countTo.selectedDate.getMonth()) {
                dayEl.classList.add('selected');
            }
            daysContainer.appendChild(dayEl);
        }
    };

    const selectCalendarDate = (day) => {
        state.timer.countTo.selectedDate = new Date(state.timer.countTo.date.getFullYear(), state.timer.countTo.date.getMonth(), day);
        updateDisplay('#selected-date-display', state.timer.countTo.selectedDate.toLocaleDateString(), timerMenu);
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
    
    // ===============================================
    // LÓGICA DE WORLD CLOCK (CON API)
    // ===============================================

    async function populateCountryDropdown(parentMenu) {
        const countryList = parentMenu.querySelector('.menu-worldclock-country .menu-list');
        if (!countryList || countryList.children.length > 1) { // >1 para no recargar si ya hay paises
            return;
        }

        countryList.innerHTML = `<div class="menu-link-text" style="padding: 0 12px;"><span>Cargando países...</span></div>`;

        try {
            const response = await fetch('https://restcountries.com/v3.1/all?fields=name,timezones');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const countries = await response.json();

            countryList.innerHTML = ''; // Limpiar mensaje de carga

            countries.sort((a, b) => a.name.common.localeCompare(b.name.common));

            countries.forEach(country => {
                const link = document.createElement('div');
                link.className = 'menu-link';
                link.setAttribute('data-action', 'selectCountry');
                link.dataset.timezones = JSON.stringify(country.timezones);
                link.innerHTML = `<div class="menu-link-icon"><span class="material-symbols-rounded">public</span></div>
                                  <div class="menu-link-text"><span>${country.name.common}</span></div>`;
                countryList.appendChild(link);
            });
        } catch (error) {
            console.error("Error fetching countries:", error);
            countryList.innerHTML = `<div class="menu-link-text" style="padding: 0 12px;"><span>Error al cargar países.</span></div>`;
        }
    }

    function populateTimezoneDropdown(parentMenu, timezones) {
        const timezoneList = parentMenu.querySelector('.menu-worldclock-timezone .menu-list');
        const timezoneSelector = parentMenu.querySelector('[data-action="toggleTimezoneDropdown"]');

        if (!timezoneList || !timezoneSelector) return;
        
        timezoneList.innerHTML = ''; // Limpiar zonas horarias anteriores

        if (timezones && timezones.length > 0) {
            timezones.forEach(tz => {
                const link = document.createElement('div');
                link.className = 'menu-link';
                link.setAttribute('data-action', 'selectTimezone');
                link.innerHTML = `<div class="menu-link-icon"><span class="material-symbols-rounded">schedule</span></div>
                                  <div class="menu-link-text"><span>${tz}</span></div>`;
                timezoneList.appendChild(link);
            });
            timezoneSelector.classList.remove('disabled-interactive');
        } else {
            timezoneList.innerHTML = `<div class="menu-link-text" style="padding: 0 12px;"><span>No hay zonas horarias.</span></div>`;
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

        // Deshabilitar dropdown de timezone al inicio
        const timezoneSelector = document.querySelector('[data-action="toggleTimezoneDropdown"]');
        if(timezoneSelector) {
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

        document.body.addEventListener('click', (event) => {
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
                    handleSelect(actionTarget, '#worldclock-selected-country');
                    state.worldClock.country = actionTarget.querySelector('.menu-link-text span')?.textContent;
                    updateDisplay('#worldclock-selected-timezone', 'Seleccionar zona horaria', parentMenu);
                    state.worldClock.timezone = '';
                    const timezones = JSON.parse(actionTarget.dataset.timezones || '[]');
                    populateTimezoneDropdown(parentMenu, timezones);
                    break;

                case 'selectTimezone':
                    event.stopPropagation();
                    handleSelect(actionTarget, '#worldclock-selected-timezone');
                    state.worldClock.timezone = actionTarget.querySelector('.menu-link-text span')?.textContent;
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
                    console.group("🌍 Reloj Mundial Agregado (Datos)");
                    console.log("Datos:", clockData);
                    console.groupEnd();
                    break;

                case 'previewAlarmSound':
                case 'previewTimerSound':
                    console.log('Preview sound for:', action);
                    break;
            }
        });
    }

    initialize();
});