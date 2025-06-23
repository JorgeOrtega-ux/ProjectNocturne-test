document.addEventListener('DOMContentLoaded', () => {
    "use strict";

    // --- ESTADO CENTRALIZADO PARA TODOS LOS MENÚS ---
    const state = {
        alarm: {
            hour: 0,
            minute: 0
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
            }
        },
        worldClock: {}
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
            
            // Lógica especial para el selector de hora del timer
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
        // Cerrar solo el dropdown del calendario cuando se selecciona una fecha
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

        minuteMenu.innerHTML = ''; // Limpiar minutos anteriores

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
    // INICIALIZACIÓN Y MANEJO DE EVENTOS
    // ===============================================

    function initialize() {
        if (timerMenu) {
            updateTimerDurationDisplay();
            renderCalendar();
            populateHourSelectionMenu();
        }

        // Cerrar dropdowns cuando se hace clic fuera
        document.addEventListener('click', (event) => {
            const isClickInsideDropdown = event.target.closest('.dropdown-menu-container');
            const isClickOnToggle = event.target.closest('[data-action]')?.dataset.action in dropdownMap;
            
            // Casos especiales para el calendario - no cerrar si se hace clic en navegación
            const isCalendarNavigation = event.target.closest('.calendar-nav');
            const isCalendarHeader = event.target.closest('.calendar-header');
            const isCalendarWeekdays = event.target.closest('.calendar-weekdays');
            const isOtherMonthDay = event.target.closest('.calendar-days .day.other-month');

            if (!isClickInsideDropdown && !isClickOnToggle && 
                !isCalendarNavigation && !isCalendarHeader && 
                !isCalendarWeekdays && !isOtherMonthDay) {
                document.querySelectorAll('.dropdown-menu-container').forEach(d => d.classList.add('disabled'));
            }
        });

        // Listener principal de eventos
        document.body.addEventListener('click', (event) => {
            const actionTarget = event.target.closest('[data-action]');
            if (!actionTarget) return;

            const action = actionTarget.dataset.action;
            const parentMenu = actionTarget.closest('.menu-alarm, .menu-timer, .menu-worldClock');

            // Manejar dropdowns con el nuevo sistema
            if (dropdownMap[action]) {
                toggleDropdown(action, parentMenu);
                return;
            }

            // Manejar tabs del timer
            const tabTarget = event.target.closest('.menu-tab[data-tab]');
            if (tabTarget) {
                state.timer.currentTab = tabTarget.dataset.tab;
                updateTimerTabView();
                return;
            }

            // Manejar días del calendario
            const dayTarget = event.target.closest('.calendar-days .day');
            if (dayTarget && dayTarget.dataset.day) {
                // Solo prevenir propagación si es un día válido (no de otros meses)
                if (!dayTarget.classList.contains('other-month')) {
                    event.stopPropagation(); // Evitar que el evento cierre todo el menú
                    selectCalendarDate(parseInt(dayTarget.dataset.day, 10));
                }
                return;
            }

            if (!parentMenu) return;

            // Manejar todas las otras acciones
            switch (action) {
                // === ACCIONES DE ALARMA ===
                case 'increaseHour':
                    state.alarm.hour = (state.alarm.hour + 1) % 24;
                    updateAlarmDisplay(parentMenu);
                    break;
                case 'decreaseHour':
                    state.alarm.hour = (state.alarm.hour - 1 + 24) % 24;
                    updateAlarmDisplay(parentMenu);
                    break;
                case 'increaseMinute':
                    state.alarm.minute = (state.alarm.minute + 1) % 60;
                    updateAlarmDisplay(parentMenu);
                    break;
                case 'decreaseMinute':
                    state.alarm.minute = (state.alarm.minute - 1 + 60) % 60;
                    updateAlarmDisplay(parentMenu);
                    break;
                case 'selectAlarmSound':
                    event.stopPropagation(); // Evitar que se cierre el menú
                    handleSelect(actionTarget, '#alarm-selected-sound');
                    break;

                // === ACCIONES DE TIMER ===
                case 'increaseTimerHour':
                    state.timer.duration.hours = (state.timer.duration.hours + 1) % 100;
                    updateTimerDurationDisplay();
                    break;
                case 'decreaseTimerHour':
                    state.timer.duration.hours = (state.timer.duration.hours - 1 + 100) % 100;
                    updateTimerDurationDisplay();
                    break;
                case 'increaseTimerMinute':
                    state.timer.duration.minutes = (state.timer.duration.minutes + 1) % 60;
                    updateTimerDurationDisplay();
                    break;
                case 'decreaseTimerMinute':
                    state.timer.duration.minutes = (state.timer.duration.minutes - 1 + 60) % 60;
                    updateTimerDurationDisplay();
                    break;
                case 'increaseTimerSecond':
                    state.timer.duration.seconds = (state.timer.duration.seconds + 1) % 60;
                    updateTimerDurationDisplay();
                    break;
                case 'decreaseTimerSecond':
                    state.timer.duration.seconds = (state.timer.duration.seconds - 1 + 60) % 60;
                    updateTimerDurationDisplay();
                    break;
                case 'selectTimerEndAction':
                    event.stopPropagation(); // Evitar que se cierre el menú
                    handleSelect(actionTarget, '#timer-selected-end-action');
                    break;
                case 'selectTimerSound':
                    event.stopPropagation(); // Evitar que se cierre el menú
                    handleSelect(actionTarget, '#timer-selected-sound');
                    break;

                // === ACCIONES DEL CALENDARIO ===
                case 'prev-month':
                    // NO usar stopPropagation aquí - queremos que se mantenga abierto el dropdown
                    state.timer.countTo.date.setMonth(state.timer.countTo.date.getMonth() - 1);
                    renderCalendar();
                    break;
                case 'next-month':
                    // NO usar stopPropagation aquí - queremos que se mantenga abierto el dropdown
                    state.timer.countTo.date.setMonth(state.timer.countTo.date.getMonth() + 1);
                    renderCalendar();
                    break;
                
                // === ACCIONES DE SELECCIÓN DE HORA ===
                case 'selectTimerHour':
                    event.stopPropagation(); // Evitar que se cierre el menú
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
                    event.stopPropagation(); // Evitar que se cierre el menú
                    const minute = parseInt(actionTarget.dataset.minute, 10);
                    state.timer.countTo.selectedMinute = minute;
                    updateDisplay('#selected-minute-display', String(minute).padStart(2, '0'), parentMenu);
                    actionTarget.closest('.dropdown-menu-container')?.classList.add('disabled');
                    state.timer.countTo.timeSelectionStep = 'hour';
                    break;

                // === ACCIONES DE WORLD CLOCK ===
                case 'selectCountry':
                    event.stopPropagation(); // Evitar que se cierre el menú
                    handleSelect(actionTarget, '#worldclock-selected-country');
                    break;
                case 'selectTimezone':
                    event.stopPropagation(); // Evitar que se cierre el menú
                    handleSelect(actionTarget, '#worldclock-selected-timezone');
                    break;

                // === ACCIONES DE CREACIÓN ===
                case 'createAlarm':
                    console.log('Crear alarma:', state.alarm);
                    break;
                case 'createTimer':
                    console.log('Crear timer:', state.timer);
                    break;
                case 'addWorldClock':
                    console.log('Agregar world clock:', state.worldClock);
                    break;

                // === ACCIONES DE PREVIEW ===
                case 'previewAlarmSound':
                case 'previewTimerSound':
                    console.log('Preview sound for:', action);
                    break;
            }
        });
    }

    initialize();
});