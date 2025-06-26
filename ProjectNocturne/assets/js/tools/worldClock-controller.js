// /assets/js/tools/worldClock-controller.js
import { PREMIUM_FEATURES, use24HourFormat } from '../general/main.js';

const clockIntervals = new Map();
const CLOCKS_STORAGE_KEY = 'world-clocks';
let userClocks = [];

const loadCountriesAndTimezones = () => new Promise((resolve, reject) => {
    if (window.ct) return resolve(window.ct);
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/gh/manuelmhtr/countries-and-timezones@latest/dist/index.min.js';
    script.onload = () => window.ct ? resolve(window.ct) : reject(new Error('Library loaded but ct object not found'));
    script.onerror = (error) => reject(new Error('Failed to load countries-and-timezones script'));
    document.head.appendChild(script);
});

function updateDateTime(element, timezone) {
    if (!element) return;

    try {
        const now = new Date();
         const timeOptions = {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: !use24HourFormat,
            timeZone: timezone
        };

        const timeString = now.toLocaleTimeString(navigator.language, timeOptions);


        if (element.tagName === 'SPAN') {
            element.textContent = timeString;
            return;
        }

        if (element.classList.contains('world-clock-card')) {
            const timeElement = element.querySelector('.clock-time');
            const dateElement = element.querySelector('.clock-date');

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
        }

    } catch (error) {
        console.error(`Zona horaria inválida: ${timezone}`, error);
        const targetElement = element.classList.contains('world-clock-card') ? element.querySelector('.clock-time') : element;
        if (targetElement) {
            targetElement.textContent = "Error";
        }
        if (clockIntervals.has(element)) {
            clearInterval(clockIntervals.get(element));
            clockIntervals.delete(element);
        }
    }
}

function startClockForElement(element, timezone) {
    if (clockIntervals.has(element)) {
        clearInterval(clockIntervals.get(element));
    }
    updateDateTime(element, timezone);
    const intervalId = setInterval(() => updateDateTime(element, timezone), 1000);
    clockIntervals.set(element, intervalId);
}

function saveClocksToStorage() {
    try {
        localStorage.setItem(CLOCKS_STORAGE_KEY, JSON.stringify(userClocks));
    } catch (error) {
        console.error('Error guardando los relojes en localStorage:', error);
    }
}

async function loadClocksFromStorage() {
    try {
        await loadCountriesAndTimezones();

        const storedClocks = localStorage.getItem(CLOCKS_STORAGE_KEY);
        if (storedClocks) {
            userClocks = JSON.parse(storedClocks);
            userClocks.forEach(clock => {
                createAndStartClockCard(clock.title, clock.country, clock.timezone, clock.id, false);
            });
        }
    } catch (error) {
        console.error('Error cargando los relojes desde localStorage:', error);
        userClocks = [];
    }
}

function createAndStartClockCard(title, country, timezone, existingId = null, save = true) {
    const grid = document.querySelector('.world-clocks-grid');
    if (!grid) return;

    const totalClockLimit = PREMIUM_FEATURES ? 100 : 5;
    const totalCurrentClocks = grid.querySelectorAll('.world-clock-card').length;

    if (save && totalCurrentClocks >= totalClockLimit) {
        alert(`Límite de ${totalClockLimit} relojes alcanzado.`);
        return;
    }

    const ct = window.ct;
    const countryForTimezone = ct.getCountryForTimezone(timezone);
    const timezoneObject = countryForTimezone ? ct.getTimezonesForCountry(countryForTimezone.id)?.find(tz => tz.name === timezone) : null;
    const utcOffsetText = timezoneObject ? `UTC ${timezoneObject.utcOffsetStr}` : '';

    const cardId = existingId || `clock-card-${Date.now()}`;
    
    const editClockText = getTranslation('edit_clock', 'world_clock_options');
    const deleteClockText = getTranslation('delete_clock', 'world_clock_options');

    const cardHTML = `
        <div class="world-clock-card" id="${cardId}" data-timezone="${timezone}" data-country="${country}" data-title="${title}">
            <div class="card-header">
                <div class="card-location-details">
                    <span class="location-text" title="${title}">${title}</span>
                </div>
            </div>
            <div class="card-body">
                <span class="clock-time">--:--:--</span>
            </div>
            <div class="card-footer">
                <div class="badges-container">
                    <span class="badge clock-date">---, -- ----</span>
                    <span class="badge clock-offset">${utcOffsetText}</span>
                </div>
            </div>

            <div class="card-menu-container disabled">
                <button class="card-fullscreen-btn" data-action="fullscreen-clock"
                        data-translate="fullscreen"
                        data-translate-category="tooltips"
                        data-translate-target="tooltip">
                    <span class="material-symbols-rounded">fullscreen</span>
                </button>
                <div class="card-menu-btn-wrapper">
                    <button class="card-menu-btn" data-action="toggle-card-menu"
                            data-translate="options"
                            data-translate-category="world_clock_options"
                            data-translate-target="tooltip">
                        <span class="material-symbols-rounded">more_horiz</span>
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
            </div>
        </div>
    `;

    grid.insertAdjacentHTML('beforeend', cardHTML);

    const newCardElement = document.getElementById(cardId);
    if (newCardElement) {
        startClockForElement(newCardElement, timezone);

        const menuContainer = newCardElement.querySelector('.card-menu-container');

        newCardElement.addEventListener('mouseenter', () => {
            menuContainer?.classList.add('active');
            menuContainer?.classList.remove('disabled');
        });

        newCardElement.addEventListener('mouseleave', () => {
            const dropdown = menuContainer?.querySelector('.card-dropdown-menu');
            if (dropdown?.classList.contains('disabled')) {
                menuContainer?.classList.remove('active');
                menuContainer?.classList.add('disabled');
            }
        });
        
        if (window.attachTooltipsToNewElements) {
            window.attachTooltipsToNewElements(newCardElement);
        }
    }
    
    if (save) {
        userClocks.push({ id: cardId, title, country, timezone });
        saveClocksToStorage();
    }
}

function getTranslation(key, category) {
    if (typeof window.getTranslation === 'function') {
        const text = window.getTranslation(key, category);
        return text === key ? key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : text;
    }
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function initializeLocalClock() {
    const mainClockElement = document.querySelector('.tool-worldClock span');
    const localClockCard = document.querySelector('.local-clock-card');

    if (!localClockCard && !mainClockElement) return;

    const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

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

    if (mainClockElement) {
        startClockForElement(mainClockElement, localTimezone);
    }
}

function initializeSortable() {
    const grid = document.querySelector('.world-clocks-grid');
    if (grid && typeof Sortable !== 'undefined') {
        new Sortable(grid, {
            animation: 150,
            filter: '.local-clock-card, .card-menu-btn, .card-dropdown-menu, .card-fullscreen-btn',
            draggable: '.world-clock-card',
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            onMove: function(evt) {
                return !evt.related.classList.contains('local-clock-card');
            },
            onEnd: function() {
                const newOrder = Array.from(grid.querySelectorAll('.world-clock-card:not(.local-clock-card)')).map(card => card.id);
                userClocks.sort((a, b) => newOrder.indexOf(a.id) - newOrder.indexOf(b.id));
                saveClocksToStorage();
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

        if (action === 'toggle-card-menu') {
            e.stopPropagation();
            const currentDropdown = card.querySelector('.card-dropdown-menu');

            // Cerrar todos los demás menús antes de abrir el nuevo
            document.querySelectorAll('.card-dropdown-menu').forEach(menu => {
                if (menu !== currentDropdown) {
                    menu.classList.add('disabled');
                    const otherCard = menu.closest('.world-clock-card');
                    if (otherCard && !otherCard.matches(':hover')) {
                        otherCard.querySelector('.card-menu-container')?.classList.add('disabled');
                        otherCard.querySelector('.card-menu-container')?.classList.remove('active');
                    }
                }
            });

            currentDropdown?.classList.toggle('disabled');
        } else if (action === 'delete-clock' || action === 'edit-clock') {
            if (action === 'delete-clock') {
                if (clockIntervals.has(card)) {
                    clearInterval(clockIntervals.get(card));
                    clockIntervals.delete(card);
                }
                const cardId = card.id;
                userClocks = userClocks.filter(clock => clock.id !== cardId);
                saveClocksToStorage();
                card.remove();
            }
            if (action === 'edit-clock') {
                console.log('Funcionalidad "Editar reloj" pendiente de implementación.');
                card.querySelector('.card-dropdown-menu')?.classList.add('disabled');
            }
        } else if (action === 'fullscreen-clock') {
            console.log('Funcionalidad "Pantalla completa" pendiente de implementación.');
        }
    });
}

document.addEventListener('click', function(e) {
    if (!e.target.closest('.card-menu-btn-wrapper')) {
        document.querySelectorAll('.card-dropdown-menu').forEach(menu => {
            menu.classList.add('disabled');
            const card = menu.closest('.world-clock-card');
            if (card && !card.matches(':hover')) {
                const menuContainer = card.querySelector('.card-menu-container');
                menuContainer?.classList.remove('active');
                menuContainer?.classList.add('disabled');
            }
        });
    }
});


window.worldClockManager = {
    createAndStartClockCard
};

export function initWorldClock() {
    initializeLocalClock();
    loadClocksFromStorage();
    initializeSortable();
}