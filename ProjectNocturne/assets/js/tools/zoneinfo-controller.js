// /assets/js/tools/zoneinfo-controller.js

function updateZoneInfo(timezone = null) {
    const zoneInfoTools = document.querySelectorAll('.zoneInfoTool');

    if (zoneInfoTools.length === 0) {
        return;
    }

    try {
        const finalTimeZone = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
        const userFriendlyTimeZone = finalTimeZone.replace(/_/g, ' ');

        zoneInfoTools.forEach(tool => {
            // Busca o crea el span interno
            let span = tool.querySelector('span');
            if (!span) {
                span = document.createElement('span');
                tool.textContent = ''; // Limpia cualquier texto previo en el div
                tool.appendChild(span);
            }

            // Actualiza el contenido del span
            span.textContent = userFriendlyTimeZone;
            
            // ===== LÍNEAS CORREGIDAS =====
            // En lugar de poner texto estático, usamos los atributos de traducción.
            // El sistema de tooltips leerá estos atributos y mostrará el texto correcto para el idioma seleccionado.
            tool.setAttribute('data-translate', 'timezone');
            tool.setAttribute('data-translate-category', 'tooltips');
            tool.setAttribute('data-translate-target', 'tooltip');
        });

        // Si el sistema de tooltips está listo, actualiza los tooltips para estos elementos
        if (window.tooltipManager && typeof window.tooltipManager.attachTooltipsToNewElements === 'function') {
            zoneInfoTools.forEach(tool => {
                window.tooltipManager.attachTooltipsToNewElements(tool.parentElement);
            });
        }

    } catch (error) {
        console.error("Error getting user's time zone:", error);
        zoneInfoTools.forEach(tool => {
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