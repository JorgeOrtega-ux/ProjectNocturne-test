// Contenido para /assets/js/tools/worldClock-controller.js

(function() {
    "use strict";

    // Objeto para almacenar los intervalos de cada reloj y poder limpiarlos después.
    // La clave ahora será el elemento de la tarjeta (card) para una mejor gestión.
    const clockIntervals = new Map();

    /**
     * NEW: Actualiza la hora, fecha e indicador día/noche para una tarjeta específica.
     * @param {HTMLElement} cardElement - El elemento de la tarjeta del reloj.
     * @param {string} timezone - La zona horaria IANA (ej. "America/Mexico_City").
     */
    function updateCardDateTime(cardElement, timezone) {
        if (!cardElement) return;

        const timeElement = cardElement.querySelector('.clock-time');
        const dateElement = cardElement.querySelector('.clock-date');
        const dayNightIndicator = cardElement.querySelector('.day-night-indicator');

        // Si algún elemento no se encuentra, detenemos la ejecución para esta tarjeta.
        if (!timeElement || !dateElement || !dayNightIndicator) {
            if (clockIntervals.has(cardElement)) {
                clearInterval(clockIntervals.get(cardElement));
                clockIntervals.delete(cardElement);
            }
            return;
        }

        try {
            const now = new Date();

            // Actualizar la hora
            timeElement.textContent = now.toLocaleTimeString('en-US', {
                hour: '2-digit', minute: '2-digit', second: '2-digit',
                timeZone: timezone, hour12: false
            });

            // Actualizar la fecha, usando el idioma del navegador para el formato
            dateElement.textContent = now.toLocaleDateString(navigator.language || 'en-US', {
                weekday: 'short', month: 'short', day: 'numeric',
                timeZone: timezone
            });

            // Actualizar el indicador de día/noche (sol/luna)
            const currentHour = parseInt(now.toLocaleTimeString('en-US', { hour: 'numeric', hour12: false, timeZone: timezone }), 10);
            const isDayTime = currentHour >= 6 && currentHour < 18;
            const newIcon = isDayTime ? 'light_mode' : 'dark_mode';
            
            // Actualizar el ícono solo si ha cambiado para evitar repintados innecesarios
            if (dayNightIndicator.textContent !== newIcon) {
                dayNightIndicator.textContent = newIcon;
            }

        } catch (error) {
            console.error(`Zona horaria inválida para actualizar la tarjeta: ${timezone}`, error);
            timeElement.textContent = "Error";
            // Detener el intervalo si hay un error
            if (clockIntervals.has(cardElement)) {
                clearInterval(clockIntervals.get(cardElement));
                clockIntervals.delete(cardElement);
            }
        }
    }


    /**
     * UPDATED: Inicia un intervalo para actualizar una tarjeta de reloj cada segundo.
     * @param {HTMLElement} cardElement - El elemento de la tarjeta a actualizar.
     * @param {string} timezone - La zona horaria IANA.
     */
    function startClockForElement(cardElement, timezone) {
        if (clockIntervals.has(cardElement)) {
            clearInterval(clockIntervals.get(cardElement));
        }
        updateCardDateTime(cardElement, timezone); // Primera actualización inmediata
        const intervalId = setInterval(() => updateCardDateTime(cardElement, timezone), 1000);
        clockIntervals.set(cardElement, intervalId);
    }
    
    /**
     * REWRITTEN: Crea una nueva tarjeta de reloj informativa y la añade al grid.
     * @param {string} title - El título de la tarjeta.
     * @param {string} country - El país para mostrar.
     * @param {string} timezone - La zona horaria IANA para el reloj.
     */
    function createAndStartClockCard(title, country, timezone) {
        const grid = document.querySelector('.world-clocks-grid');
        if (!grid) return;

        // Obtenemos el objeto de la zona horaria para el desplazamiento UTC
        const ct = window.ct;
        const timezoneObject = ct.getTimezonesForCountry(ct.getCountryForTimezone(timezone)?.id)?.find(tz => tz.name === timezone);
        const utcOffsetText = timezoneObject ? `UTC ${timezoneObject.utcOffsetStr}` : '';

        const cardId = `clock-card-${Date.now()}`;
        
        // Obtenemos las traducciones para el menú de la tarjeta
        const editClockText = getTranslation('edit_clock', 'world_clock_options');
        const deleteClockText = getTranslation('delete_clock', 'world_clock_options');
        const optionsTooltipText = getTranslation('options', 'world_clock_options');

        const cardHTML = `
            <div class="world-clock-card" id="${cardId}" data-timezone="${timezone}">
                <div class="card-header">
                    <span class="location-text" title="${title}">${title}</span>
                    <span class="clock-offset">${utcOffsetText}</span>
                </div>
                <div class="card-body">
                    <span class="clock-time">--:--:--</span>
                </div>
                <div class="card-footer">
                    <span class="clock-date">---, -- ----</span>
                    <span class="day-night-indicator material-symbols-rounded"></span>
                </div>
                
                <button class="card-menu-btn" data-action="toggle-card-menu" 
                        data-translate="options"
                        data-translate-category="world_clock_options"
                        data-translate-target="tooltip">
                    <span class="material-symbols-rounded">more_vert</span>
                </button>
                
                <div class="card-dropdown-menu disabled">
                    <div class="menu-link" data-action="edit-clock">
                        <div class="menu-link-icon"><span class="material-symbols-rounded">edit</span></div>
                        <div class="menu-link-text"><span>${editClockText}</span></div>
                    </div>
                    <div class="menu-link" data-action="delete-clock">
                        <div class="menu-link-icon"><span class="material-symbols-rounded">delete</span></div>
                        <div class="menu-link-text"><span>${deleteClockText}</span></div>
                    </div>
                </div>
            </div>
        `;

        grid.insertAdjacentHTML('beforeend', cardHTML);

        const newCardElement = document.getElementById(cardId);
        if (newCardElement) {
            startClockForElement(newCardElement, timezone);
            // Adjuntar tooltips a los elementos recién creados
            if (window.attachTooltipsToNewElements) {
                 window.attachTooltipsToNewElements(newCardElement);
            }
        }
    }
    
    function getTranslation(key, category) {
        if (typeof window.getTranslation === 'function') {
            const text = window.getTranslation(key, category);
            // Fallback por si la clave no existe en la traducción
            return text === key ? key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : text;
        }
        return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    async function initializeLocalClock() {
        const mainClockElement = document.querySelector('.tool-worldClock span');
        const localClockCard = document.querySelector('.local-clock-card');

        if (!localClockCard && !mainClockElement) return;

        try {
            const response = await fetch('https://ip-api.com/json');
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
            const data = await response.json();
            if (data.status === 'success' && data.timezone) {
                const { country, timezone } = data;
                
                if (localClockCard) {
                    const locationText = localClockCard.querySelector('.location-text');
                    const offsetText = localClockCard.querySelector('.clock-offset');
                    if (locationText) locationText.textContent = `${timezone.replace(/_/g, ' ')}`;
                    
                    // Calculamos el offset para el reloj local también
                    const now = new Date();
                    const utcOffset = -now.getTimezoneOffset() / 60;
                    const offsetSign = utcOffset >= 0 ? '+' : '-';
                    const offsetHours = Math.abs(Math.trunc(utcOffset));
                    const offsetMinutes = Math.abs(utcOffset * 60) % 60;
                    if (offsetText) offsetText.textContent = `UTC ${offsetSign}${offsetHours}:${String(offsetMinutes).padStart(2, '0')}`;

                    startClockForElement(localClockCard, timezone);
                }

                if (mainClockElement) startClockForElement(mainClockElement, timezone);
            } else {
                throw new Error('API de IP no retornó una zona horaria válida.');
            }
        } catch (error) {
            console.warn(`No se pudo obtener la ubicación por IP (${error.message}). Usando hora local del navegador.`);
            const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            
            if (localClockCard) {
                const locationText = localClockCard.querySelector('.location-text');
                if (locationText) locationText.textContent = `${localTimezone.replace(/_/g, ' ')}, Local`;
                startClockForElement(localClockCard, localTimezone);
            }

            if (mainClockElement) startClockForElement(mainClockElement, localTimezone);
        }
    }

    function initializeSortable() {
        const grid = document.querySelector('.world-clocks-grid');
        if (grid && typeof Sortable !== 'undefined') {
            new Sortable(grid, {
                animation: 150,
                filter: '.local-clock-card',
                draggable: '.world-clock-card',
                ghostClass: 'sortable-ghost',
                chosenClass: 'sortable-chosen',
                onMove: function (evt) {
                    return !evt.related.classList.contains('local-clock-card');
                }
            });
        } else if (typeof Sortable === 'undefined') {
            console.error('La librería SortableJS no está cargada. La función de arrastrar y soltar no funcionará.');
        }
    }

    const grid = document.querySelector('.world-clocks-grid');
    if (grid) {
        grid.addEventListener('click', function(e) {
            const actionTarget = e.target.closest('[data-action]');
            if (!actionTarget) return;

            const action = actionTarget.getAttribute('data-action');
            const card = actionTarget.closest('.world-clock-card');
            if (!card) return;

            document.querySelectorAll('.card-dropdown-menu:not(.disabled)').forEach(menu => {
                if (!card.contains(menu)) {
                    menu.classList.add('disabled');
                }
            });

            if (action === 'toggle-card-menu') {
                e.stopPropagation();
                const dropdown = card.querySelector('.card-dropdown-menu');
                if (dropdown) dropdown.classList.toggle('disabled');
            } else if (action === 'delete-clock') {
                // Detener el intervalo antes de eliminar la tarjeta
                if (clockIntervals.has(card)) {
                    clearInterval(clockIntervals.get(card));
                    clockIntervals.delete(card);
                }
                card.remove();
            } else if (action === 'edit-clock') {
                console.log('Funcionalidad "Editar reloj" pendiente de implementación.');
                const dropdown = card.querySelector('.card-dropdown-menu');
                if (dropdown) dropdown.classList.add('disabled');
            }
        });
    }
    
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.card-dropdown-menu') && !e.target.closest('[data-action="toggle-card-menu"]')) {
            document.querySelectorAll('.card-dropdown-menu:not(.disabled)').forEach(menu => {
                menu.classList.add('disabled');
            });
        }
    });

    window.worldClockManager = {
        createAndStartClockCard
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initializeLocalClock();
            initializeSortable(); 
        });
    } else {
        initializeLocalClock();
        initializeSortable();
    }
})();