document.addEventListener('DOMContentLoaded', () => {
    "use strict";

    // --- ESTADO CENTRALIZADO PARA TODOS LOS MENÚS ---
    const state = {
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
            // Verificar si ya está cargada
            if (window.ct) {
                resolve(window.ct);
                return;
            }

            console.log('🌍 Loading countries-and-timezones library with auto-update...');
            
            const script = document.createElement('script');
            
            // ✨ SOLUCIÓN: Usar @latest para auto-actualización
            script.src = 'https://cdn.jsdelivr.net/gh/manuelmhtr/countries-and-timezones@latest/dist/index.min.js';
            
            // Agregar timestamp para evitar cache en desarrollo
            const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            if (isDevelopment) {
                script.src += '?t=' + Date.now();
                console.log('🔧 Development mode: Cache busting enabled');
            }
            
            script.onload = () => {
                if (window.ct) {
                    console.log('✅ Countries-and-timezones library loaded successfully');
                    console.log('📊 Library version:', window.ct.version || 'Unknown');
                    resolve(window.ct);
                } else {
                    reject(new Error('Library loaded but ct object not found'));
                }
            };
            
            script.onerror = (error) => {
                console.error('❌ Failed to load countries-and-timezones library:', error);
                reject(new Error('Failed to load countries-and-timezones script'));
            };
            
            // Timeout de seguridad
            setTimeout(() => {
                if (!window.ct) {
                    console.warn('⏰ Library loading timeout, attempting fallback...');
                    // Intentar con una versión específica conocida como fallback
                    loadFallbackLibrary().then(resolve).catch(reject);
                }
            }, 10000);
            
            document.head.appendChild(script);
        });
    }

    // --- FALLBACK CON VERSIÓN ESPECÍFICA CONOCIDA ---
    function loadFallbackLibrary() {
        return new Promise((resolve, reject) => {
            console.log('🔄 Loading fallback version...');
            
            const fallbackScript = document.createElement('script');
            fallbackScript.src = 'https://cdn.jsdelivr.net/gh/manuelmhtr/countries-and-timezones@v3.8.0/dist/index.min.js';
            
            fallbackScript.onload = () => {
                if (window.ct) {
                    console.log('✅ Fallback library loaded successfully');
                    resolve(window.ct);
                } else {
                    reject(new Error('Fallback library failed to load'));
                }
            };
            
            fallbackScript.onerror = () => {
                reject(new Error('Both main and fallback libraries failed to load'));
            };
            
            document.head.appendChild(fallbackScript);
        });
    }

    // --- VERIFICAR UPDATES DISPONIBLES (OPCIONAL) ---
    async function checkForUpdates() {
        try {
            // Verificar si hay una nueva versión disponible
            const response = await fetch('https://api.github.com/repos/manuelmhtr/countries-and-timezones/releases/latest');
            const data = await response.json();
            const latestVersion = data.tag_name;
            const currentVersion = window.ct?.version;
            
            if (currentVersion && latestVersion !== currentVersion) {
                console.log(`🆕 New version available: ${latestVersion} (current: ${currentVersion})`);
                console.log('💡 Refresh the page to get the latest version');
            } else {
                console.log('✅ You have the latest version');
            }
        } catch (error) {
            console.log('ℹ️ Could not check for updates:', error.message);
        }
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
    // LÓGICA DE WORLD CLOCK CON LIBRERÍA IANA AUTO-ACTUALIZABLE
    // ===============================================

    async function populateCountryDropdown(parentMenu) {
        const countryList = parentMenu.querySelector('.menu-worldclock-country .menu-list');
        if (!countryList) return;

        // Mostrar loading solo si no hay países cargados
        if (countryList.children.length <= 1) {
            countryList.innerHTML = `
                <div class="menu-link-text" style="padding: 0 12px;">
                    <span>🌍 Cargando países...</span>
                </div>
            `;

            try {
                console.log('🔄 Loading countries with auto-update capability...');
                
                // Cargar la librería con auto-update
                const ct = await loadCountriesAndTimezones();
                
                // Verificar updates en background (no bloquea la UI)
                checkForUpdates();
                
                // Obtener todos los países
                const countries = ct.getAllCountries();
                
                countryList.innerHTML = ''; // Limpiar loading

                // Convertir a array y ordenar
                const countryArray = Object.values(countries).sort((a, b) => a.name.localeCompare(b.name));

                console.log(`📊 Loaded ${countryArray.length} countries`);

                countryArray.forEach(country => {
                    const link = document.createElement('div');
                    link.className = 'menu-link';
                    link.setAttribute('data-action', 'selectCountry');
                    link.setAttribute('data-country-code', country.id);
                    link.innerHTML = `
                        <div class="menu-link-icon">
                            <span class="material-symbols-rounded">public</span>
                        </div>
                        <div class="menu-link-text">
                            <span>${country.name}</span>
                        </div>
                    `;
                    countryList.appendChild(link);
                });

                console.log('✅ Countries populated successfully');

            } catch (error) {
                console.error("❌ Error loading countries:", error);
                countryList.innerHTML = `
                    <div class="menu-link-text" style="padding: 0 12px;">
                        <span>❌ Error al cargar países. Inténtalo de nuevo.</span>
                    </div>
                `;
            }
        }
    }

    async function populateTimezoneDropdown(parentMenu, countryCode) {
        const timezoneList = parentMenu.querySelector('.menu-worldclock-timezone .menu-list');
        const timezoneSelector = parentMenu.querySelector('[data-action="toggleTimezoneDropdown"]');

        if (!timezoneList || !timezoneSelector) return;
        
        timezoneList.innerHTML = ''; // Limpiar zonas horarias anteriores

        try {
            console.log(`🕐 Loading timezones for country: ${countryCode}`);
            
            const ct = await loadCountriesAndTimezones();
            const timezones = ct.getTimezonesForCountry(countryCode);

            if (timezones && timezones.length > 0) {
                console.log(`📍 Found ${timezones.length} timezone(s) for ${countryCode}`);
                
                timezones.forEach((tz, index) => {
                    // Crear nombre más legible
                    const cityName = tz.name.split('/').pop().replace(/_/g, ' ');
                    const offset = tz.utcOffsetStr;
                    const displayName = `(UTC ${offset}) ${cityName}`;

                    const link = document.createElement('div');
                    link.className = 'menu-link';
                    link.setAttribute('data-action', 'selectTimezone');
                    link.setAttribute('data-timezone', tz.name);
                    link.innerHTML = `
                        <div class="menu-link-icon">
                            <span class="material-symbols-rounded">schedule</span>
                        </div>
                        <div class="menu-link-text">
                            <span>${displayName}</span>
                        </div>
                    `;
                    timezoneList.appendChild(link);
                    
                    if (index === 0) {
                        console.log(`🏙️ First timezone: ${tz.name} (${displayName})`);
                    }
                });
                
                timezoneSelector.classList.remove('disabled-interactive');
                console.log('✅ Timezones populated successfully');
                
            } else {
                console.warn(`⚠️ No timezones found for country: ${countryCode}`);
                timezoneList.innerHTML = `
                    <div class="menu-link-text" style="padding: 0 12px;">
                        <span>⚠️ No hay zonas horarias disponibles.</span>
                    </div>
                `;
                timezoneSelector.classList.add('disabled-interactive');
            }
        } catch (error) {
            console.error("❌ Error loading timezones:", error);
            timezoneList.innerHTML = `
                <div class="menu-link-text" style="padding: 0 12px;">
                    <span>❌ Error al cargar zonas horarias.</span>
                </div>
            `;
            timezoneSelector.classList.add('disabled-interactive');
        }
    }

    // ===============================================
    // INICIALIZACIÓN Y MANEJO DE EVENTOS
    // ===============================================

    function initialize() {
        console.log('🚀 Initializing menu interactions with auto-update support...');
        
        if (timerMenu) {
            updateTimerDurationDisplay();
            renderCalendar();
            populateHourSelectionMenu();
        }

        // Deshabilitar dropdown de timezone al inicio
        const timezoneSelector = document.querySelector('[data-action="toggleTimezoneDropdown"]');
        if (timezoneSelector) {
            timezoneSelector.classList.add('disabled-interactive');
        }

        // Event listener para cerrar dropdowns al hacer click fuera
        document.addEventListener('click', (event) => {
            const isClickInsideDropdown = event.target.closest('.dropdown-menu-container');
            const isClickOnToggle = event.target.closest('[data-action]')?.dataset.action in dropdownMap;
            const isCalendarNavigation = event.target.closest('.calendar-nav, .calendar-header, .calendar-weekdays, .day.other-month');

            if (!isClickInsideDropdown && !isClickOnToggle && !isCalendarNavigation) {
                document.querySelectorAll('.dropdown-menu-container').forEach(d => d.classList.add('disabled'));
            }
        });

        // Event listener principal
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
                    console.log('🌍 Country selected, processing...');
                    
                    const countryName = actionTarget.querySelector('.menu-link-text span')?.textContent;
                    const countryCode = actionTarget.getAttribute('data-country-code');
                    
                    console.log(`📍 Selected country: ${countryName} (${countryCode})`);
                    
                    handleSelect(actionTarget, '#worldclock-selected-country');
                    state.worldClock.country = countryName;
                    updateDisplay('#worldclock-selected-timezone', 'Seleccionar zona horaria', parentMenu);
                    state.worldClock.timezone = '';
                    
                    // Cargar zonas horarias para el país seleccionado
                    await populateTimezoneDropdown(parentMenu, countryCode);
                    break;

                case 'selectTimezone':
                    event.stopPropagation();
                    console.log('🕐 Timezone selected, processing...');
                    
                    const timezoneName = actionTarget.getAttribute('data-timezone');
                    const timezoneDisplay = actionTarget.querySelector('.menu-link-text span')?.textContent;
                    
                    console.log(`🌍 Selected timezone: ${timezoneName}`);
                    console.log(`👁️ Display name: ${timezoneDisplay}`);
                    
                    handleSelect(actionTarget, '#worldclock-selected-timezone');
                    state.worldClock.timezone = timezoneName; // Guardar el nombre IANA
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
                    
                    // Obtener la hora actual del país/zona horaria seleccionada
                    let currentTimeInfo = null;
                    if (state.worldClock.timezone) {
                        try {
                            const now = new Date();
                            const timeInTimezone = new Intl.DateTimeFormat('es-MX', {
                                timeZone: state.worldClock.timezone,
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                                hour12: false
                            }).format(now);
                            
                            // También obtener información adicional de la zona horaria
                            const timeZoneInfo = Intl.DateTimeFormat('es-MX', {
                                timeZone: state.worldClock.timezone,
                                timeZoneName: 'longOffset'
                            }).formatToParts(now);
                            
                            const offset = timeZoneInfo.find(part => part.type === 'timeZoneName')?.value || 'UTC';
                            
                            // Calcular diferencia con hora local
                            const localTime = new Date();
                            const targetTime = new Date(localTime.toLocaleString("en-US", {timeZone: state.worldClock.timezone}));
                            const timeDiff = (targetTime.getTime() - localTime.getTime()) / (1000 * 60 * 60);
                            const diffText = timeDiff === 0 ? 'Misma zona horaria' : 
                                           timeDiff > 0 ? `+${timeDiff.toFixed(1)} horas adelante` : 
                                           `${Math.abs(timeDiff).toFixed(1)} horas atrás`;
                            
                            currentTimeInfo = {
                                currentTime: timeInTimezone,
                                offset: offset,
                                timeDifference: diffText,
                                timestamp: now.toISOString()
                            };
                        } catch (error) {
                            console.warn('Error getting timezone info:', error);
                            currentTimeInfo = {
                                currentTime: 'No disponible',
                                offset: 'Desconocido',
                                timeDifference: 'No calculable',
                                error: error.message
                            };
                        }
                    }
                    
                    const clockData = { 
                        title: clockTitle, 
                        country: state.worldClock.country,
                        timezone: state.worldClock.timezone,
                        timeInfo: currentTimeInfo
                    };
                    
                    console.group("🌍 Reloj Mundial Agregado (Datos Completos)");
                    console.log("📋 Datos básicos:", {
                        title: clockData.title,
                        country: clockData.country,
                        timezone: clockData.timezone
                    });
                    
                    if (currentTimeInfo) {
                        console.log("🕐 Información de tiempo:");
                        console.log(`   ⏰ Hora actual: ${currentTimeInfo.currentTime}`);
                        console.log(`   🌍 Zona horaria: ${state.worldClock.timezone}`);
                        console.log(`   📍 Offset: ${currentTimeInfo.offset}`);
                        console.log(`   ⏳ Diferencia con hora local: ${currentTimeInfo.timeDifference}`);
                        console.log(`   📅 Timestamp de creación: ${currentTimeInfo.timestamp}`);
                        if (currentTimeInfo.error) {
                            console.warn(`   ⚠️ Error: ${currentTimeInfo.error}`);
                        }
                    }
                    
                    console.log("📊 Auto-update enabled: Using @latest version");
                    console.log("🔄 Datos completos:", clockData);
                    console.groupEnd();
                    break;

                case 'previewAlarmSound':
                case 'previewTimerSound':
                    console.log('🔊 Preview sound for:', action);
                    break;
            }
        });

        console.log('✅ Menu interactions initialized with auto-update support');
    }

    // ===============================================
    // AUTO-UPDATE MONITORING (OPCIONAL)
    // ===============================================
    
    function setupAutoUpdateMonitoring() {
        // Verificar updates cada 30 minutos
        setInterval(() => {
            if (window.ct) {
                checkForUpdates();
            }
        }, 30 * 60 * 1000);
        
        // También verificar cuando se regresa al tab
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && window.ct) {
                setTimeout(checkForUpdates, 1000);
            }
        });
    }

    // ===============================================
    // INICIALIZACIÓN FINAL
    // ===============================================

    initialize();
    setupAutoUpdateMonitoring();
    
    // Pre-cargar la librería para mejor UX (opcional)
    setTimeout(() => {
        loadCountriesAndTimezones().then(() => {
            console.log('📦 Library pre-loaded for better UX');
        }).catch(() => {
            console.log('ℹ️ Pre-loading failed, will load when needed');
        });
    }, 2000);
});