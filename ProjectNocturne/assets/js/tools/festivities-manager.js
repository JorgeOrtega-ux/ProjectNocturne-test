// /assets/js/tools/festivities-manager.js

import { getTranslation } from '../general/translations-controller.js';
import { getCurrentLocation } from '../general/location-manager.js';

const WIDGET_ID = 'festivities-widget';
const NOT_AVAILABLE_MESSAGE_KEY = 'festivities_not_available';

/**
 * Inicializa el gestor de festividades.
 * Ahora solo se prepara para escuchar eventos.
 */
function initializeFestivitiesManager() {
    console.log('🎉 Festivities Manager initialized and listening for location changes.');
    // La actualización se moverá al event listener.
}

/**
 * Obtiene las festividades del archivo PHP.
 * @returns {Promise<object|null>}
 */
async function fetchFestivities() {
    try {
        const response = await fetch('festivities.php');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching festivities:', error);
        return null;
    }
}

/**
 * Actualiza el contenido del widget de festividades.
 */
async function updateFestivitiesWidget() {
    console.log('Updating festivities widget due to location change event...');
    const widget = document.getElementById(WIDGET_ID);
    if (!widget) return;

    const widgetList = widget.querySelector('.widget-list');
    if (!widgetList) return;

    const currentLocation = getCurrentLocation();
    const allFestivities = await fetchFestivities();

    if (!currentLocation || !allFestivities || !allFestivities[currentLocation.code]) {
        widgetList.innerHTML = `<p class="widget-list-item-value" style="padding: 0 12px;">${getTranslation(NOT_AVAILABLE_MESSAGE_KEY, 'everything')}</p>`;
        return;
    }

    const countryFestivities = allFestivities[currentLocation.code];
    const upcomingFestivities = getUpcomingFestivities(countryFestivities, 3);

    if (upcomingFestivities.length === 0) {
        widgetList.innerHTML = `<p class="widget-list-item-value" style="padding: 0 12px;">${getTranslation(NOT_AVAILABLE_MESSAGE_KEY, 'everything')}</p>`;
        return;
    }
    
    renderFestivities(widgetList, upcomingFestivities);
}

/**
 * Obtiene las próximas 'count' festividades.
 * @param {Array} festivities - Lista de festividades del país.
 * @param {number} count - Número de festividades a devolver.
 * @returns {Array}
 */
function getUpcomingFestivities(festivities, count) {
    const now = new Date();
    const currentYear = now.getFullYear();

    const sortedFestivities = festivities
        .map(fest => {
            let festDate = new Date(currentYear, fest.month - 1, fest.day);
            if (festDate < now) {
                festDate.setFullYear(currentYear + 1);
            }
            return { ...fest, date: festDate };
        })
        .sort((a, b) => a.date - b.date);

    return sortedFestivities.slice(0, count);
}

/**
 * Renderiza la lista de festividades en el widget.
 * @param {HTMLElement} container - El elemento donde se renderizará la lista.
 * @param {Array} festivities - La lista de festividades a renderizar.
 */
function renderFestivities(container, festivities) {
    container.innerHTML = '';
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

    festivities.forEach(fest => {
        const monthName = getTranslation(monthNames[fest.month - 1], 'months');
        const dateString = `${fest.day} de ${monthName}`;
        
        const item = document.createElement('div');
        item.className = 'widget-list-item';
        item.innerHTML = `
            <div class="widget-list-item-icon">
                <span class="material-symbols-rounded">celebration</span>
            </div>
            <div class="widget-list-item-details">
                <span class="widget-list-item-title">${fest.name}</span>
                <span class="widget-list-item-value">${dateString}</span>
            </div>
        `;
        container.appendChild(item);
    });
}

// --- MODIFICACIÓN CLAVE ---
// El listener ahora es el único responsable de iniciar la actualización del widget.
document.addEventListener('locationChanged', updateFestivitiesWidget);
// --- FIN DE LA MODIFICACIÓN ---

export { initializeFestivitiesManager };