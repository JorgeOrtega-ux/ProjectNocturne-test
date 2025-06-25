(function() {
    "use strict";

    let clockInterval = null;

    /**
     * Actualiza el reloj principal en la sección "World Clock" para mostrar la hora de una zona horaria específica.
     * @param {string} timezone - El nombre de la zona horaria IANA (ej. "America/Mexico_City").
     */
    function updateWorldClockTime(timezone) {
        const worldClockElement = document.querySelector('.tool-worldClock span');
        if (!worldClockElement) return;

        try {
            const now = new Date();
            // Usamos toLocaleTimeString con la opción timeZone para obtener la hora correcta.
            const timeString = now.toLocaleTimeString('en-US', { // 'en-US' para un formato predecible HH:MM:SS
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZone: timezone,
                hour12: false // Usar formato de 24 horas
            });
            
            worldClockElement.textContent = timeString;

        } catch (error) {
            console.error(`Zona horaria inválida: ${timezone}`, error);
            // Si la zona horaria no es válida, mostramos la hora local como respaldo.
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            worldClockElement.textContent = `${hours}:${minutes}:${seconds}`;
            
            // Detenemos el intervalo para prevenir errores repetidos.
            if (clockInterval) {
                clearInterval(clockInterval);
            }
        }
    }

    /**
     * Inicia el intervalo para actualizar la hora del reloj mundial cada segundo para una zona horaria dada.
     * @param {string|null} timezone - El nombre de la zona horaria IANA. Si es nulo, usa la hora local.
     */
    function startWorldClock(timezone) {
        if (clockInterval) {
            clearInterval(clockInterval);
        }
        
        // Actualiza la hora inmediatamente.
        updateWorldClockTime(timezone); 
        
        // Y luego la actualiza cada segundo.
        clockInterval = setInterval(() => updateWorldClockTime(timezone), 1000);
    }

    /**
     * Obtiene los datos de ubicación del usuario e inicia el reloj con la zona horaria detectada.
     */
    async function initializeWorldClock() {
        try {
            const response = await fetch('http://ip-api.com/json');
            
            if (!response.ok) {
                throw new Error(`Error HTTP! estado: ${response.status}`);
            }

            const data = await response.json();

            if (data.status === 'success' && data.timezone) {
                const country = data.country;
                const timezone = data.timezone;

                console.log("===== Información de Ubicación del Usuario =====");
                console.log(`País detectado: ${country}`);
                console.log(`Zona horaria detectada: ${timezone}`);
                console.log("=============================================");

                // Inicia el reloj con la zona horaria detectada.
                startWorldClock(timezone);

            } else {
                console.error('No se pudo obtener la zona horaria. Estado de la API: ' + data.status);
                // Respaldo a la hora local del usuario.
                startWorldClock(null);
            }

        } catch (error) {
            console.error('Error al obtener la ubicación del usuario. Usando hora local como respaldo.', error);
            // Respaldo a la hora local del usuario en caso de error de red.
            startWorldClock(null);
        }
    }
    
    // Cuando el DOM esté completamente cargado, se inicializa el reloj mundial.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeWorldClock);
    } else {
        initializeWorldClock();
    }

})();