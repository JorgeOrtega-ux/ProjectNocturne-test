// ========== DYNAMIC ISLAND CONTROLLER ==========

let dynamicIslandElement = null;
let notificationTimeout = null;
let dismissCallback = null; // Store the callback for the dismiss button
let currentRingingToolId = null; // Store the ID of the tool currently ringing

const NOTIFICATION_DISPLAY_DURATION = 3000; // 3 seconds for regular notifications
const RINGING_NOTIFICATION_DURATION = 8000; // 8 seconds for ringing tools (gives user time to react)

// Define icons based on the tool type or message type
const ICONS = {
    'alarm': 'alarm',
    'timer': 'timer',
    'worldClock': 'schedule',
    'system_info': 'info', // For general info messages
    'system_error': 'error', // For error messages
    'system_premium': 'workspace_premium', // For premium features
    'system_success': 'check_circle', // For success messages
    'default': 'info' // Fallback icon
};

/**
 * Initializes the dynamic island DOM element and appends it to the body.
 */
export function initDynamicIsland() {
    if (dynamicIslandElement) {
        return; // Already initialized
    }

    // Create the main dynamic island element
    dynamicIslandElement = document.createElement('div');
    dynamicIslandElement.id = 'dynamic-island';
    
    // Set initial classes for collapsed state (CSS handles opacity transitions)
    dynamicIslandElement.classList.remove('expanded');
    dynamicIslandElement.classList.remove('active-tool-ringing');

    // Construct the inner HTML structure
    dynamicIslandElement.innerHTML = `
        <div class="island-notification-content">
            <div class="island-left-group">
                <div class="island-circle notification-icon-wrapper">
                    <span class="material-symbols-rounded notification-icon-symbol"></span>
                </div>
                <div class="notification-text-info">
                    <p class="notification-title"></p>
                    <p class="notification-message"></p>
                </div>
            </div>
            <button class="island-dismiss-button" data-action="dismiss-active-tool">
                ${getTranslation('dismiss', 'general')}
            </button>
        </div>
    `;
    
    // Append the dynamic island to the body
    document.body.appendChild(dynamicIslandElement);

    // Attach event listener for the dismiss button
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
 * Displays a notification in the dynamic island.
 * @param {string} toolType - The type of tool (e.g., 'alarm', 'timer', 'worldClock', 'system' for general messages).
 * @param {string} actionType - The action performed (e.g., 'created', 'updated', 'ringing', 'deleted', 'limit_reached', 'error', 'info').
 * @param {string} messageKey - The key for the main message (e.g., 'alarm_deleted_success', 'feature_premium_required').
 * @param {string} messageCategory - The category for messageKey (e.g., 'notifications', 'general').
 * @param {object} [data={}] - An object containing data for message placeholders (e.g., {title: 'My Alarm', limit: 5}) or additional details like 'time' or 'duration'.
 * @param {function} [onDismiss=null] - Callback function to execute when dismiss button is clicked (for ringing tools).
 */
export function showDynamicIslandNotification(toolType, actionType, messageKey, messageCategory, data = {}, onDismiss = null) {
    if (!dynamicIslandElement) {
        initDynamicIsland(); // Attempt to initialize if not already
        if (!dynamicIslandElement) return; // If still not found, exit
    }

    // Clear any existing timeout
    if (notificationTimeout) {
        clearTimeout(notificationTimeout);
    }

    // Remove any ringing state classes from previous notifications
    dynamicIslandElement.classList.remove('active-tool-ringing');
    
    // Set icon, title, and message elements
    const iconSymbol = dynamicIslandElement.querySelector('.notification-icon-symbol');
    const titleP = dynamicIslandElement.querySelector('.notification-title');
    const messageP = dynamicIslandElement.querySelector('.notification-message');

    if (!iconSymbol || !titleP || !messageP) {
        console.error('Dynamic Island internal elements not found. Check HTML structure after dynamic creation.');
        return;
    }

    // Determine the icon
    let iconToUse = ICONS[toolType] || ICONS.default; // Default to tool type icon
    if (toolType === 'system') {
        if (actionType === 'error') iconToUse = ICONS.system_error;
        else if (actionType === 'premium_required') iconToUse = ICONS.system_premium;
        else if (actionType === 'deleted' || actionType === 'success') iconToUse = ICONS.system_success; // For generic success messages
        else iconToUse = ICONS.system_info; // For generic info messages
    }
    iconSymbol.textContent = iconToUse;

    // Set the main title (e.g., "Alarm Created", "Timer Ringing")
    const translatedToolType = getTranslation(toolType, 'tooltips');
    const translatedActionType = getTranslation(actionType, 'general');
    titleP.textContent = `${translatedToolType} ${translatedActionType}`;

    // Set the message (e.g., "Alarm 'My Alarm' deleted.", "Limit of 5 reached.")
    let formattedMessage = formatMessage(messageKey, messageCategory, data);
    
    // Add time/duration to message if present and not already part of key
    if (data.time && !formattedMessage.includes(data.time)) {
        formattedMessage += ` (${data.time})`;
    } else if (data.duration && !formattedMessage.includes(data.duration)) {
        formattedMessage += ` (${data.duration})`;
    }
    messageP.textContent = formattedMessage;

    // Handle ringing state and dismiss button
    let duration = NOTIFICATION_DISPLAY_DURATION;
    if (actionType === 'ringing') {
        dynamicIslandElement.classList.add('active-tool-ringing'); // Add class to trigger CSS for dismiss button and wider width
        duration = RINGING_NOTIFICATION_DURATION; // Longer duration for ringing
        dismissCallback = onDismiss;
        currentRingingToolId = data.toolId;
    } else {
        dismissCallback = null;
        currentRingingToolId = null;
    }

    // Trigger the expansion animation
    dynamicIslandElement.classList.add('expanded');

    // Set timeout to collapse the island after a duration
    notificationTimeout = setTimeout(() => {
        hideDynamicIsland();
    }, duration);

    console.log(`Dynamic Island: ${toolType} ${actionType} - ${messageKey} - Data:`, data);
}

/**
 * Formats a message string with placeholders.
 * @param {string} key - The translation key.
 * @param {string} category - The translation category.
 * @param {object} [placeholders={}] - An object with placeholder key-value pairs (e.g., {limit: 5}).
 * @returns {string} The formatted message.
 */
function formatMessage(key, category, placeholders = {}) {
    let message = getTranslation(key, category);
    for (const placeholder in placeholders) {
        if (placeholders.hasOwnProperty(placeholder)) {
            message = message.replace(`{${placeholder}}`, placeholders[placeholder]);
        }
    }
    return message;
}


/**
 * Hides the dynamic island.
 */
export function hideDynamicIsland() {
    if (notificationTimeout) {
        clearTimeout(notificationTimeout);
        notificationTimeout = null;
    }
    dynamicIslandElement.classList.remove('expanded');
    dynamicIslandElement.classList.remove('active-tool-ringing'); // Ensure ringing state is removed
    dismissCallback = null; // Clear callback on hide
    currentRingingToolId = null; // Clear current tool ID
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
        return (translated && translated !== key) ? translated : key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); // Simple fallback if translation system is not ready
}

// Optionally, expose a public API to manually hide the island
window.hideDynamicIsland = hideDynamicIsland;