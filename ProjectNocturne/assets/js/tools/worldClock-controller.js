// /assets/js/tools/worldClock-controller.js

(function() {
    "use strict";

    // Objeto para almacenar los intervalos de cada reloj y poder limpiarlos después.
    // La clave es el elemento (tarjeta o span) para una gestión precisa.
    const clockIntervals = new Map();
    let isPremium = false; // O 'true' para activar el modo premium

    /**
     * Actualiza la fecha y hora para un elemento de reloj (tarjeta o span).
     * @param {HTMLElement} element - El elemento del reloj (la tarjeta o el span principal).
     * @param {string} timezone - La zona horaria IANA (ej. "America/Mexico_City").
     */
    function updateDateTime(element, timezone) {
        if (!element) return;

        try {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZone: timezone,
                hour12: false
            });

            // Si el elemento es solo el span del reloj principal.
            if (element.tagName === 'SPAN') {
                element.textContent = timeString;
                return;
            }

            // Si el elemento es una tarjeta de reloj completa.
            if (element.classList.contains('world-clock-card')) {
                const timeElement = element.querySelector('.clock-time');
                const dateElement = element.querySelector('.clock-date');
                const dayNightIndicator = element.querySelector('.day-night-indicator');

                if (timeElement) {
                    timeElement.textContent = timeString;
                }

                if (dateElement) {
                    dateElement.textContent = now.toLocaleDateString(navigator.language || 'en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        timeZone: timezone
                    });
                }

                if (dayNightIndicator) {
                    const currentHour = parseInt(now.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        hour12: false,
                        timeZone: timezone
                    }), 10);
                    const isDayTime = currentHour >= 6 && currentHour < 18;
                    const newIcon = isDayTime ? 'light_mode' : 'dark_mode';

                    if (dayNightIndicator.textContent !== newIcon) {
                        dayNightIndicator.textContent = newIcon;
                    }
                }
            }

        } catch (error) {
            console.error(`Zona horaria inválida: ${timezone}`, error);
            const targetElement = element.classList.contains('world-clock-card') ? element.querySelector('.clock-time') : element;
            if (targetElement) {
                targetElement.textContent = "Error";
            }
            // Detener el intervalo si la zona horaria es inválida
            if (clockIntervals.has(element)) {
                clearInterval(clockIntervals.get(element));
                clockIntervals.delete(element);
            }
        }
    }

    /**
     * Inicia un intervalo para actualizar un elemento de reloj cada segundo.
     * @param {HTMLElement} element - El elemento a actualizar (tarjeta o span).
     * @param {string} timezone - La zona horaria IANA.
     */
    function startClockForElement(element, timezone) {
        if (clockIntervals.has(element)) {
            clearInterval(clockIntervals.get(element));
        }
        updateDateTime(element, timezone); // Primera actualización inmediata
        const intervalId = setInterval(() => updateDateTime(element, timezone), 1000);
        clockIntervals.set(element, intervalId);
    }

    /**
     * Crea una nueva tarjeta de reloj y la añade al grid.
     * @param {string} title - El título de la tarjeta.
     * @param {string} country - El país para mostrar.
     * @param {string} timezone - La zona horaria IANA para el reloj.
     */
    function createAndStartClockCard(title, country, timezone) {
        const grid = document.querySelector('.world-clocks-grid');
        if (!grid) return;

        const clockLimit = isPremium ? 100 : 5;
        const currentClocks = grid.querySelectorAll('.world-clock-card').length;

        if (currentClocks >= clockLimit) {
            alert(`Límite de relojes alcanzado (${clockLimit}).`);
            return;
        }

        // Obtenemos el objeto de la zona horaria para el desplazamiento UTC
        const ct = window.ct;
        const timezoneObject = ct.getTimezonesForCountry(ct.getCountryForTimezone(timezone)?.id)?.find(tz => tz.name === timezone);
        const utcOffsetText = timezoneObject ? `UTC ${timezoneObject.utcOffsetStr}` : '';

        const cardId = `clock-card-${Date.now()}`;

        // Obtenemos las traducciones para el menú de la tarjeta
        const editClockText = getTranslation('edit_clock', 'world_clock_options');
        const deleteClockText = getTranslation('delete_clock', 'world_clock_options');

        const cardHTML = `
            <div class="world-clock-card" id="${cardId}" data-timezone="${timezone}">
                <div class="card-header">
                    <div class="card-location-details">
                        <span class="location-text" title="${title}">${title}</span>
                        <span class="clock-offset">${utcOffsetText}</span>
                    </div>
                    <button class="card-menu-btn" data-action="toggle-card-menu"
                            data-translate="options"
                            data-translate-category="world_clock_options"
                            data-translate-target="tooltip">
                        <span class="material-symbols-rounded">more_vert</span>
                    </button>
                </div>
                <div class="card-body">
                    <span class="clock-time">--:--:--</span>
                </div>
                <div class="card-footer">
                    <span class="clock-date">---, -- ----</span>
                    <span class="day-night-indicator material-symbols-rounded"></span>
                </div>

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

    /**
     * Obtiene una traducción.
     * @param {string} key - La clave de la traducción.
     * @param {string} category - La categoría de la traducción.
     * @returns {string} - El texto traducido o una versión formateada de la clave.
     */
    function getTranslation(key, category) {
        if (typeof window.getTranslation === 'function') {
            const text = window.getTranslation(key, category);
            return text === key ? key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : text;
        }
        return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    /**
     * Inicializa el reloj principal y la tarjeta del reloj local usando la zona horaria del navegador.
     */
    function initializeLocalClock() {
        const mainClockElement = document.querySelector('.tool-worldClock span');
        const localClockCard = document.querySelector('.local-clock-card');

        if (!localClockCard && !mainClockElement) return;

        // Usar la zona horaria del navegador directamente.
        const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        console.log(`WorldClock: Usando hora local del navegador: ${localTimezone}`);

        // Configurar la tarjeta de reloj local si existe.
        if (localClockCard) {
            const locationText = localClockCard.querySelector('.location-text');
            const offsetText = localClockCard.querySelector('.clock-offset');

            if (locationText) {
                locationText.textContent = getTranslation('local_time', 'world_clock_options') || "Local Time";
            }

            if (offsetText) {
                const now = new Date();
                const utcOffset = -now.getTimezoneOffset() / 60;
                const offsetSign = utcOffset >= 0 ? '+' : '-';
                const offsetHours = Math.abs(Math.trunc(utcOffset));
                const offsetMinutes = Math.abs(utcOffset * 60) % 60;
                offsetText.textContent = `UTC ${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;
            }

            startClockForElement(localClockCard, localTimezone);
        }

        // Configurar el reloj principal en la sección central.
        if (mainClockElement) {
            startClockForElement(mainClockElement, localTimezone);
        }
    }

    /**
     * Inicializa la funcionalidad de arrastrar y soltar para las tarjetas.
     */
    function initializeSortable() {
        const grid = document.querySelector('.world-clocks-grid');
        if (grid && typeof Sortable !== 'undefined') {
            new Sortable(grid, {
                animation: 150,
                filter: '.local-clock-card, .card-menu-btn, .card-dropdown-menu', // Evita el arrastre en la tarjeta local y su menú
                draggable: '.world-clock-card',
                ghostClass: 'sortable-ghost',
                chosenClass: 'sortable-chosen',
                onMove: function(evt) {
                    // No permitir que otros elementos se muevan antes de la tarjeta local
                    return !evt.related.classList.contains('local-clock-card');
                }
            });
        } else if (typeof Sortable === 'undefined') {
            console.error('La librería SortableJS no está cargada. La función de arrastrar y soltar no funcionará.');
        }
    }

    // Listener para los menús de las tarjetas (editar/borrar)
    const grid = document.querySelector('.world-clocks-grid');
    if (grid) {
        grid.addEventListener('click', function(e) {
            const actionTarget = e.target.closest('[data-action]');
            if (!actionTarget) return;

            const action = actionTarget.getAttribute('data-action');
            const card = actionTarget.closest('.world-clock-card');
            if (!card) return;

            // Cerrar otros menús desplegables abiertos
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

    // Listener global para cerrar menús desplegables al hacer clic fuera
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.card-dropdown-menu') && !e.target.closest('[data-action="toggle-card-menu"]')) {
            document.querySelectorAll('.card-dropdown-menu:not(.disabled)').forEach(menu => {
                menu.classList.add('disabled');
            });
        }
    });

    // Exponer la función para crear tarjetas al objeto window
    window.worldClockManager = {
        createAndStartClockCard
    };

    // Inicializar el controlador cuando el DOM esté listo
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