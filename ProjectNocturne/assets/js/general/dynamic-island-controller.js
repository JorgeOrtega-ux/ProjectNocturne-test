// /assets/js/general/dynamic-island-controller.js

import { translateElementTree } from './translations-controller.js';

let dynamicIslandElement = null;
let notificationTimeout = null;
let dismissCallback = null;
let currentRingingToolId = null;

const NOTIFICATION_DISPLAY_DURATION = 5000;

const ICONS = {
    'alarm': 'alarm',
    'timer': 'timer',
    'worldClock': 'schedule',
    'system_info': 'info',
    'system_error': 'error',
    'system_premium': 'workspace_premium',
    'system_success': 'check_circle',
    'default': 'info'
};

/**
 * Initializes the dynamic island DOM element and appends it to the body.
 */
export function initDynamicIsland() {
    if (dynamicIslandElement) return;

    dynamicIslandElement = document.createElement('div');
    dynamicIslandElement.id = 'dynamic-island';
    dynamicIslandElement.classList.remove('expanded', 'active-tool-ringing');

    // Estructura HTML con atributos data-translate
    dynamicIslandElement.innerHTML = `
        <div class="island-notification-content">
            <div class="island-left-group">
                <div class="island-circle">
                    <span class="material-symbols-rounded notification-icon-symbol"></span>
                </div>
                <div class="notification-text-info">
                    <p class="notification-title" data-translate="" data-translate-category="notifications"></p>
                    <p class="notification-message" data-translate="" data-translate-category="notifications"></p>
                </div>
            </div>
            <button class="island-dismiss-button" data-action="dismiss-active-tool" data-translate="dismiss" data-translate-category="notifications">
            </button>
        </div>
    `;

    document.body.appendChild(dynamicIslandElement);

    const dismissButton = dynamicIslandElement.querySelector('.island-dismiss-button');
    if (dismissButton) {
        dismissButton.addEventListener('click', () => {
            if (dismissCallback && typeof dismissCallback === 'function') {
                dismissCallback(currentRingingToolId);
            }
            hideDynamicIsland();
        });
    }

    console.log('✨ Dynamic Island initialized and added to DOM.');
}

/**
 * Muestra una notificación en la isla dinámica utilizando el sistema data-translate.
 * @param {string} toolType - El tipo de herramienta ('alarm', 'timer', 'system').
 * @param {string} actionType - La acción ('created', 'updated', 'ringing', 'deleted').
 * @param {string} messageKey - La clave de traducción para el cuerpo del mensaje.
 * @param {string} category - La categoría de la traducción para el mensaje (usualmente 'notifications').
 * @param {object} [data={}] - Datos para los marcadores de posición (ej. {title: 'Mi Alarma'}).
 * @param {function} [onDismiss=null] - Callback para el botón de descarte.
 */
export function showDynamicIslandNotification(toolType, actionType, messageKey, category, data = {}, onDismiss = null) {
    if (!dynamicIslandElement) initDynamicIsland();
    if (!dynamicIslandElement) return;

    if (notificationTimeout) clearTimeout(notificationTimeout);
    dynamicIslandElement.classList.remove('active-tool-ringing');

    const iconSymbol = dynamicIslandElement.querySelector('.notification-icon-symbol');
    const titleP = dynamicIslandElement.querySelector('.notification-title');
    const messageP = dynamicIslandElement.querySelector('.notification-message');
    const dismissButton = dynamicIslandElement.querySelector('.island-dismiss-button');

    if (!iconSymbol || !titleP || !messageP) return;

    // 1. Configurar Icono
    let iconKey = toolType;
    if (toolType === 'system') {
        if (actionType.includes('error')) iconKey = 'system_error';
        else if (actionType.includes('premium') || actionType.includes('limit')) iconKey = 'system_premium';
        else if (actionType.includes('success') || actionType.includes('deleted')) iconKey = 'system_success';
        else iconKey = 'system_info';
    }
    iconSymbol.textContent = ICONS[iconKey] || ICONS.default;

    // 2. Establecer las claves de traducción y los placeholders
    const titleKey = `${toolType}_${actionType}_title`;
    titleP.setAttribute('data-translate', titleKey);

    messageP.setAttribute('data-translate', messageKey);
    // Convertir el objeto de datos en un string JSON para el atributo
    if (data && Object.keys(data).length > 0) {
        messageP.setAttribute('data-placeholders', JSON.stringify(data));
    } else {
        messageP.removeAttribute('data-placeholders');
    }
    
    // 3. Llamar al traductor para que actualice el contenido del DOM de la isla
    if (typeof translateElementTree === 'function') {
        translateElementTree(dynamicIslandElement);
    } else {
        console.error("translateElementTree function is not available.");
    }
    
    // 4. Manejar el estado de 'sonando'
    if (actionType === 'ringing') {
        dynamicIslandElement.classList.add('active-tool-ringing');
        dismissCallback = onDismiss;
        currentRingingToolId = data.toolId;
    } else {
        dismissCallback = null;
        currentRingingToolId = null;
        notificationTimeout = setTimeout(hideDynamicIsland, NOTIFICATION_DISPLAY_DURATION);
    }

    dynamicIslandElement.classList.add('expanded');
    console.log(`Dynamic Island Display: ${toolType} ${actionType} - TitleKey: ${titleKey}, MsgKey: ${messageKey}`);
}

/**
 * Hides the dynamic island.
 */
export function hideDynamicIsland() {
    if (!dynamicIslandElement) return;
    if (notificationTimeout) clearTimeout(notificationTimeout);
    notificationTimeout = null;
    
    dynamicIslandElement.classList.remove('expanded', 'active-tool-ringing');
    dismissCallback = null;
    currentRingingToolId = null;
}

/**
 * Retrieves a translation string. Assumes window.getTranslation is available.
 * @param {string} key - The translation key.
 * @param {string} category - The translation category.
 * @returns {string} The translated string or the key if not found.
 */
function getTranslation(key, category = 'general') {
    if (typeof window.getTranslation === 'function') {
        const translated = window.getTranslation(key, category);
        return (translated && translated !== key) ? translated : key;
    }
    return key;
}

window.hideDynamicIsland = hideDynamicIsland;