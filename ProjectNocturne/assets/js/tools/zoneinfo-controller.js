// /assets/js/tools/zoneinfo-controller.js

function updateZoneInfo(timezone = null) {
    const infoTools = document.querySelectorAll('.info-tool[data-timezone-alarm], .info-tool[data-timezone-worldclock]');

    if (infoTools.length === 0) {
        return;
    }

    try {
        const finalTimeZone = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
        const userFriendlyTimeZone = finalTimeZone.replace(/_/g, ' ');

        infoTools.forEach(tool => {
            // Busca o crea el span interno
            let span = tool.querySelector('span');
            if (!span) {
                span = document.createElement('span');
                tool.textContent = ''; // Limpia cualquier texto previo en el div
                tool.appendChild(span);
            }

            // Actualiza el contenido del span
            span.textContent = userFriendlyTimeZone;
            
            tool.setAttribute('data-translate', 'timezone');
            tool.setAttribute('data-translate-category', 'tooltips');
            tool.setAttribute('data-translate-target', 'tooltip');
        });

        if (window.tooltipManager && typeof window.tooltipManager.attachTooltipsToNewElements === 'function') {
            infoTools.forEach(tool => {
                window.tooltipManager.attachTooltipsToNewElements(tool.parentElement);
            });
        }

    } catch (error) {
        console.error("Error getting user's time zone:", error);
        infoTools.forEach(tool => {
            let span = tool.querySelector('span');
            if (!span) {
                span = document.createElement('span');
                tool.textContent = '';
                tool.appendChild(span);
            }
            span.textContent = "Time Zone Unavailable";
        });
    }
}

function initializeZoneInfoTool() {
    updateZoneInfo();
}

// Export the function to be called from init-app.js and worldClock-controller.js
export { initializeZoneInfoTool, updateZoneInfo };