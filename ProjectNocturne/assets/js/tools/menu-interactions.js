document.addEventListener('DOMContentLoaded', () => {

    // --- ESTADO CENTRALIZADO PARA LOS MENÚS ---
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
            }
        }
    };

    // ===============================================
    // FUNCIONES GENÉRICAS DE UI (MEJORADAS)
    // ===============================================

    /**
     * Alterna la visibilidad de un menú desplegable específico.
     * Se asegura de que todos los demás menús desplegables estén cerrados.
     * @param {HTMLElement} parentElement - El contenedor del menú (ej. .menu-alarm).
     * @param {string} menuSelector - El selector CSS del menú a alternar.
     */
    const toggleDropdown = (parentElement, menuSelector) => {
        if (!parentElement) return;
        const targetDropdown = parentElement.querySelector(menuSelector);
        if (!targetDropdown) return;

        const isTargetOpen = !targetDropdown.classList.contains('disabled');

        // Primero, cerrar todos los dropdowns de la página.
        document.querySelectorAll('.dropdown-menu-container').forEach(d => d.classList.add('disabled'));

        // Si el menú que se clickeó no estaba ya abierto, se abre.
        // Si ya estaba abierto, el paso anterior ya lo cerró.
        if (!isTargetOpen) {
            targetDropdown.classList.remove('disabled');
        }
    };

    /**
     * Maneja la selección de un ítem en un desplegable y actualiza el texto visible.
     * @param {HTMLElement} selectedItem - El elemento del menú en el que se hizo clic.
     * @param {string} displaySelector - El selector del <span> que muestra el valor seleccionado.
     */
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

    /**
     * Actualiza el texto de un elemento de visualización.
     * @param {string} selector - El selector del elemento a actualizar.
     * @param {string} text - El nuevo texto a mostrar.
     * @param {HTMLElement} [parent=document] - El elemento padre para buscar el selector.
     */
    const updateDisplay = (selector, text, parent = document) => {
        const element = parent.querySelector(selector);
        if (element) {
            element.textContent = text;
        }
    };

    // ===============================================
    // LÓGICA ESPECÍFICA DE LOS MENÚS
    // ===============================================

    // --- Lógica de Alarma ---
    const updateAlarmDisplay = (parent) => {
        updateDisplay('#hour-display', `${state.alarm.hour} horas`, parent);
        updateDisplay('#minute-display', `${state.alarm.minute} minutos`, parent);
    };

    // --- Lógica del Temporizador ---
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
        monthYearDisplay.textContent = date.toLocaleDateString(navigator.language, { month: 'long', year: 'numeric' });

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

    const populateTimerHourMenu = () => {
        if (!timerMenu) return;
        const hourMenu = timerMenu.querySelector('.menu-timer-hour .menu-list');
        if (!hourMenu || hourMenu.children.length > 0) return;

        for (let i = 0; i < 24; i++) {
            for (let j = 0; j < 60; j += 15) {
                const hour = String(i).padStart(2, '0');
                const minute = String(j).padStart(2, '0');
                const link = document.createElement('div');
                link.className = 'menu-link';
                link.setAttribute('data-action', 'selectTimerTime');
                link.setAttribute('data-hour', i);
                link.setAttribute('data-minute', j);
                link.innerHTML = `<div class="menu-link-text"><span>${hour}:${minute}</span></div>`;
                hourMenu.appendChild(link);
            }
        }
    };

    // Inicializar vistas del temporizador
    if (timerMenu) {
        updateTimerDurationDisplay();
        renderCalendar();
        populateTimerHourMenu();
    }


    // ===============================================
    // LISTENER DE EVENTOS GLOBAL Y ÚNICO
    // ===============================================
    document.body.addEventListener('click', (event) => {
        const target = event.target;
        const actionTarget = target.closest('[data-action]');
        const tabTarget = target.closest('.menu-tab[data-tab]');
        const dayTarget = target.closest('.calendar-days .day');

        // --- Cierre de Desplegables (Click Afuera) ---
        const activeDropdown = document.querySelector('.dropdown-menu-container:not(.disabled)');
        if (activeDropdown) {
            const isClickInside = activeDropdown.contains(target);
            const isClickOnToggle = actionTarget && actionTarget.dataset.action.startsWith('toggle');
            if (!isClickInside && !isClickOnToggle) {
                activeDropdown.classList.add('disabled');
            }
        }

        // --- Manejo de Pestañas (Timer) ---
        if (tabTarget) {
            state.timer.currentTab = tabTarget.dataset.tab;
            updateTimerTabView();
            return;
        }

        // --- Manejo de Calendario (Timer) ---
        if (dayTarget && dayTarget.dataset.day) {
            selectCalendarDate(parseInt(dayTarget.dataset.day, 10));
            return;
        }

        // --- Manejo de Acciones ---
        if (!actionTarget) return;

        const action = actionTarget.dataset.action;
        const parentMenu = actionTarget.closest('.menu-alarm, .menu-timer, .menu-worldClock');

        if (!parentMenu) return;

        switch (action) {
            // --- Menú de Alarma ---
            case 'increaseHour':   state.alarm.hour = (state.alarm.hour + 1) % 24; updateAlarmDisplay(parentMenu); break;
            case 'decreaseHour':   state.alarm.hour = (state.alarm.hour - 1 + 24) % 24; updateAlarmDisplay(parentMenu); break;
            case 'increaseMinute': state.alarm.minute = (state.alarm.minute + 1) % 60; updateAlarmDisplay(parentMenu); break;
            case 'decreaseMinute': state.alarm.minute = (state.alarm.minute - 1 + 60) % 60; updateAlarmDisplay(parentMenu); break;
            case 'toggleAlarmSoundMenu': toggleDropdown(parentMenu, '.menu-alarm-sound'); break;
            case 'selectAlarmSound':     handleSelect(actionTarget, '#alarm-selected-sound'); break;
            case 'previewAlarmSound':    console.log("Previewing alarm sound..."); break;

            // --- Menú de Timer (Countdown) ---
            case 'increaseTimerHour':   state.timer.duration.hours = (state.timer.duration.hours + 1) % 100; updateTimerDurationDisplay(); break;
            case 'decreaseTimerHour':   state.timer.duration.hours = (state.timer.duration.hours - 1 + 100) % 100; updateTimerDurationDisplay(); break;
            case 'increaseTimerMinute': state.timer.duration.minutes = (state.timer.duration.minutes + 1) % 60; updateTimerDurationDisplay(); break;
            case 'decreaseTimerMinute': state.timer.duration.minutes = (state.timer.duration.minutes - 1 + 60) % 60; updateTimerDurationDisplay(); break;
            case 'increaseTimerSecond': state.timer.duration.seconds = (state.timer.duration.seconds + 1) % 60; updateTimerDurationDisplay(); break;
            case 'decreaseTimerSecond': state.timer.duration.seconds = (state.timer.duration.seconds - 1 + 60) % 60; updateTimerDurationDisplay(); break;
            case 'toggleTimerEndActionMenu': toggleDropdown(parentMenu, '.menu-timer-end-action'); break;
            case 'selectTimerEndAction':     handleSelect(actionTarget, '#timer-selected-end-action'); break;
            case 'toggleTimerSoundMenu':     toggleDropdown(parentMenu, '.menu-timer-sound'); break;
            case 'selectTimerSound':         handleSelect(actionTarget, '#timer-selected-sound'); break;
            case 'previewTimerSound':        console.log("Previewing timer sound..."); break;

            // --- Menú de Timer (Count to Date) ---
            case 'toggleCalendar':      toggleDropdown(parentMenu, '.calendar-container'); break;
            case 'prev-month':          state.timer.countTo.date.setMonth(state.timer.countTo.date.getMonth() - 1); renderCalendar(); break;
            case 'next-month':          state.timer.countTo.date.setMonth(state.timer.countTo.date.getMonth() + 1); renderCalendar(); break;
            case 'toggleTimerHourMenu': toggleDropdown(parentMenu, '.menu-timer-hour'); break;
            case 'selectTimerTime':
                state.timer.countTo.selectedHour = actionTarget.dataset.hour;
                state.timer.countTo.selectedMinute = actionTarget.dataset.minute;
                updateDisplay('#selected-hour-display', String(state.timer.countTo.selectedHour).padStart(2, '0'), parentMenu);
                updateDisplay('#selected-minute-display', String(state.timer.countTo.selectedMinute).padStart(2, '0'), parentMenu);
                toggleDropdown(parentMenu, '.menu-timer-hour');
                break;

            // --- Menú de Reloj Mundial ---
            case 'toggleCountryMenu':  toggleDropdown(parentMenu, '.menu-worldclock-country'); break;
            case 'selectCountry':      handleSelect(actionTarget, '#worldclock-selected-country'); break;
            case 'toggleTimezoneMenu': toggleDropdown(parentMenu, '.menu-worldclock-timezone'); break;
            case 'selectTimezone':     handleSelect(actionTarget, '#worldclock-selected-timezone'); break;
        }
    });
});