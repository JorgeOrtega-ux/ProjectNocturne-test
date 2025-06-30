// ========== DYNAMIC ISLAND CONTROLLER ==========

let dynamicIslandContainer = null;
let notificationTimeout = null;

const NOTIFICATION_DISPLAY_DURATION = 3000; // 3 seconds
const NOTIFICATION_FADE_DURATION = 300; // 0.3 seconds

const ICONS = {
    'alarm': 'alarm',
    'timer': 'timer',
    'worldClock': 'schedule',
    'create': 'check_circle',
    'edit': 'edit',
    'default': 'info'
};

/**
 * Initializes the dynamic island DOM element and appends it to the body.
 */
export function initDynamicIsland() {
    if (dynamicIslandContainer) {
        return; // Already initialized
    }

    dynamicIslandContainer = document.createElement('div');
    dynamicIslandContainer.className = 'dynamic-island-container hidden'; // Start hidden
    dynamicIslandContainer.innerHTML = `
        <div class="island-notification">
            <div class="notification-icon">
                <span class="material-symbols-rounded"></span>
            </div>
            <div class="notification-content">
                <p class="notification-title"></p>
                <p class="notification-message"></p>
            </div>
        </div>
    `;
    document.body.appendChild(dynamicIslandContainer);

    // Ensure it's hidden initially by applying the class
    dynamicIslandContainer.classList.add('hidden');

    console.log('✨ Dynamic Island initialized.');
}

/**
 * Displays a notification in the dynamic island.
 * @param {string} type - The type of tool (e.g., 'alarm', 'timer', 'worldClock').
 * @param {string} action - The action performed (e.g., 'created', 'updated').
 * @param {object} data - An object containing relevant data for the notification message.
 * @param {string} data.title - The title of the item (e.g., alarm title, timer name).
 * @param {string} [data.time] - The time string (for alarms/clocks).
 * @param {string} [data.duration] - The duration string (for timers).
 */
export function showDynamicIslandNotification(type, action, data) {
    if (!dynamicIslandContainer) {
        initDynamicIsland(); // Self-initialize if not already
    }

    // Clear any existing timeout
    if (notificationTimeout) {
        clearTimeout(notificationTimeout);
    }

    const iconSpan = dynamicIslandContainer.querySelector('.notification-icon .material-symbols-rounded');
    const titleP = dynamicIslandContainer.querySelector('.notification-title');
    const messageP = dynamicIslandContainer.querySelector('.notification-message');

    if (!iconSpan || !titleP || !messageP) {
        console.error('Dynamic Island elements not found.');
        return;
    }

    // Set icon based on type
    iconSpan.textContent = ICONS[type] || ICONS.default;

    // Set title and message
    const translatedType = getTranslation(type, 'tooltips') || type; // Get translated tool name
    const translatedAction = getTranslation(action, 'general') || action; // Assuming 'general' category for actions

    titleP.textContent = `${translatedType} ${translatedAction}`;
    messageP.textContent = data.title;

    if (data.time) {
        messageP.textContent += ` (${data.time})`;
    } else if (data.duration) {
        messageP.textContent += ` (${data.duration})`;
    }


    // Make the island visible
    dynamicIslandContainer.classList.remove('hidden');
    dynamicIslandContainer.classList.add('active');

    // Hide after a delay
    notificationTimeout = setTimeout(() => {
        dynamicIslandContainer.classList.remove('active');
        dynamicIslandContainer.classList.add('hidden');
    }, NOTIFICATION_DISPLAY_DURATION);

    console.log(`Dynamic Island: ${type} ${action} - ${data.title}`);
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
        // Fallback to a readable string if translation system returns the key itself
        return (translated && translated !== key) ? translated : key.replace(/_/g, ' ');
    }
    return key.replace(/_/g, ' '); // Simple fallback if translation system is not ready
}

// Add a 'general' category to your translation files (en-us.json, es-mx.json, fr-fr.json)
// For example, in en-us.json:
/*
"general": {
    "created": "created",
    "updated": "updated"
}
*/