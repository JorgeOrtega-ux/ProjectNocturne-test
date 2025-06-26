// /assets/js/tools/zoneinfo-controller.js

function initializeZoneInfoTool() {
    const zoneInfoTools = document.querySelectorAll('.zoneInfoTool');

    if (zoneInfoTools.length === 0) {
        return;
    }

    function updateZoneInfo() {
        try {
            const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const userFriendlyTimeZone = timeZone.replace(/_/g, ' ');

            zoneInfoTools.forEach(tool => {
                tool.textContent = userFriendlyTimeZone;
                tool.setAttribute('data-tooltip', `Timezone: ${userFriendlyTimeZone}`);
            });

            // If the tooltip system is ready, refresh tooltips for these elements
            if (window.tooltipManager && typeof window.tooltipManager.attachTooltipsToNewElements === 'function') {
                zoneInfoTools.forEach(tool => {
                    window.tooltipManager.attachTooltipsToNewElements(tool.parentElement);
                });
            }

        } catch (error) {
            console.error("Error getting user's time zone:", error);
            zoneInfoTools.forEach(tool => {
                tool.textContent = "Time Zone Unavailable";
            });
        }
    }

    // Initial update
    updateZoneInfo();
}

// Export the function to be called from init-app.js
export { initializeZoneInfoTool };