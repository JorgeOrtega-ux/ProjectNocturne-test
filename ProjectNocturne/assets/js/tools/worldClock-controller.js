(function() {
    "use strict";

    // Objeto para almacenar los intervalos de cada reloj y poder limpiarlos después.
    const clockIntervals = new Map();

    /**
     * Actualiza la hora de un elemento de reloj específico.
     * @param {HTMLElement} element - El elemento <span> que mostrará la hora.
     * @param {string} timezone - La zona horaria IANA (ej. "America/Mexico_City").
     */
    function updateTimeForElement(element, timezone) {
        if (!element) return;
        try {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: timezone, hour12: false });
            element.textContent = timeString;
        } catch (error) {
            console.error(`Zona horaria inválida: ${timezone}`, error);
            element.textContent = "Error";
            if (clockIntervals.has(element)) {
                clearInterval(clockIntervals.get(element));
                clockIntervals.delete(element);
            }
        }
    }

    /**
     * Inicia un intervalo para actualizar un elemento de reloj cada segundo.
     * @param {HTMLElement} element - El elemento <span> a actualizar.
     * @param {string} timezone - La zona horaria IANA.
     */
    function startClockForElement(element, timezone) {
        if (clockIntervals.has(element)) {
            clearInterval(clockIntervals.get(element));
        }
        updateTimeForElement(element, timezone);
        const intervalId = setInterval(() => updateTimeForElement(element, timezone), 1000);
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

        const cardId = `clock-card-${Date.now()}`;
        const timeId = `time-${cardId}`;

        const editClockText = getTranslation('edit_clock', 'world_clock_options');
        const deleteClockText = getTranslation('delete_clock', 'world_clock_options');
        const optionsTooltipText = getTranslation('options', 'world_clock_options');

        const cardHTML = `
            <div class="world-clock-card" id="${cardId}">
                <div class="world-clock-card-top">
                    <span class="location-text" title="${title}">${title}</span>
                </div>
                <div class="world-clock-card-bottom">
                    <span id="${timeId}">--:--:--</span>
                </div>
                
                <button class="card-menu-btn" data-action="toggle-card-menu" data-tooltip="${optionsTooltipText}">
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

        const newTimeElement = document.getElementById(timeId);
        if (newTimeElement) {
            startClockForElement(newTimeElement, timezone);
        }
        
        if (window.attachTooltipsToNewElements) {
             const newCardElement = document.getElementById(cardId);
             window.attachTooltipsToNewElements(newCardElement);
        }
    }
    
    function getTranslation(key, category) {
        if (typeof window.getTranslation === 'function') {
            return window.getTranslation(key, category);
        }
        return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    async function initializeLocalClock() {
        const mainClockElement = document.querySelector('.tool-worldClock span');
        const localTimezoneElement = document.getElementById('local-timezone');
        const localTimeElement = document.getElementById('local-time');

        try {
            const response = await fetch('http://ip-api.com/json');
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
            const data = await response.json();
            if (data.status === 'success' && data.timezone) {
                const { country, timezone } = data;
                if (localTimezoneElement) localTimezoneElement.textContent = `${timezone.replace(/_/g, ' ')}, ${country}`;
                if (mainClockElement) startClockForElement(mainClockElement, timezone);
                if (localTimeElement) startClockForElement(localTimeElement, timezone);
            } else {
                throw new Error('API de IP no retornó una zona horaria válida.');
            }
        } catch (error) {
            console.warn(`No se pudo obtener la ubicación por IP (${error.message}). Usando hora local del navegador.`);
            const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            if (localTimezoneElement) localTimezoneElement.textContent = `${localTimezone.replace(/_/g, ' ')}, Local`;
            if (mainClockElement) startClockForElement(mainClockElement, localTimezone);
            if (localTimeElement) startClockForElement(localTimeElement, localTimezone);
        }
    }

    /**
     * INICIO DE LA LÓGICA CON SORTABLEJS (ACTUALIZADA)
     */
    function initializeSortable() {
        const grid = document.querySelector('.world-clocks-grid');
        if (grid && typeof Sortable !== 'undefined') {
            new Sortable(grid, {
                animation: 150,
                filter: '.local-clock-card', // Evita que la tarjeta local se pueda arrastrar
                draggable: '.world-clock-card',
                ghostClass: 'sortable-ghost',
                chosenClass: 'sortable-chosen',
                // AÑADIDO: Evita que otras tarjetas se puedan mover a la posición de la tarjeta local
                onMove: function (evt) {
                    // Retorna 'false' si el movimiento es hacia un elemento filtrado (nuestra tarjeta local)
                    return !evt.related.classList.contains('local-clock-card');
                }
            });
        } else if (typeof Sortable === 'undefined') {
            console.error('La librería SortableJS no está cargada. La función de arrastrar y soltar no funcionará.');
        }
    }

    // --- MANEJO DE EVENTOS PARA CLICS ---
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
                const timeElement = card.querySelector('span[id^="time-"]');
                for (const [keyElement, intervalId] of clockIntervals.entries()) {
                    if (keyElement.id === timeElement.id) {
                         clearInterval(intervalId);
                         clockIntervals.delete(keyElement);
                         break;
                    }
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

    // --- INICIALIZACIÓN PRINCIPAL ---
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