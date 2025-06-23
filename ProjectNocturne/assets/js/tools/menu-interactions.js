document.addEventListener('DOMContentLoaded', () => {

    /**
     * Función genérica para alternar la visibilidad de un menú desplegable.
     * @param {HTMLElement} parentElement - El contenedor principal del menú (ej. .menu-alarm).
     * @param {string} menuSelector - El selector CSS del menú a alternar (ej. '.menu-alarm-sound').
     */
    const toggleDropdown = (parentElement, menuSelector) => {
        if (!parentElement) return;
        
        const dropdownMenu = parentElement.querySelector(menuSelector);
        if (dropdownMenu) {
            // Cerrar otros menús desplegables dentro del mismo contenedor padre
            const allDropdowns = parentElement.querySelectorAll('.dropdown-menu-container');
            allDropdowns.forEach(menu => {
                if (menu !== dropdownMenu) {
                    menu.classList.add('disabled');
                }
            });
            
            // Alternar el menú actual
            dropdownMenu.classList.toggle('disabled');
        }
    };

    /**
     * Función genérica para manejar la selección de un ítem en un desplegable.
     * @param {HTMLElement} selectedItem - El elemento del menú en el que se hizo clic.
     * @param {string} displaySelector - El selector del <span> que muestra el valor seleccionado.
     * @param {string} dropdownSelector - El selector del menú desplegable a cerrar.
     */
    const handleSelect = (selectedItem, displaySelector, dropdownSelector) => {
        const parentMenu = selectedItem.closest('.menu-alarm, .menu-worldClock');
        if (!parentMenu) return;

        const displayElement = parentMenu.querySelector(displaySelector);
        const dropdownMenu = parentMenu.querySelector(dropdownSelector);
        const textToDisplay = selectedItem.querySelector('.menu-link-text span')?.textContent;

        if (displayElement && textToDisplay) {
            displayElement.textContent = textToDisplay;
        }

        if (dropdownMenu) {
            dropdownMenu.classList.add('disabled');
        }
    };

    // Usamos delegación de eventos para manejar todos los clics de forma eficiente
    document.body.addEventListener('click', (event) => {
        const target = event.target.closest('[data-action]');
        if (!target) return;

        const action = target.getAttribute('data-action');
        const parentMenu = target.closest('.menu-alarm, .menu-worldClock');

        switch (action) {
            // --- Menú de Alarma ---
            case 'toggleAlarmSoundMenu':
                toggleDropdown(parentMenu, '.menu-alarm-sound');
                break;
            case 'selectAlarmSound':
                handleSelect(target, '#alarm-selected-sound', '.menu-alarm-sound');
                break;
            
            // --- Menú de Reloj Mundial ---
            case 'toggleCountryMenu':
                toggleDropdown(parentMenu, '.menu-worldclock-country');
                break;
            case 'selectCountry':
                handleSelect(target, '#worldclock-selected-country', '.menu-worldclock-country');
                // Aquí podrías añadir lógica para cargar las zonas horarias del país seleccionado
                break;
            case 'toggleTimezoneMenu':
                toggleDropdown(parentMenu, '.menu-worldclock-timezone');
                break;
            case 'selectTimezone':
                handleSelect(target, '#worldclock-selected-timezone', '.menu-worldclock-timezone');
                break;
        }
    });

    // Cerrar los desplegables si se hace clic fuera de ellos
    document.body.addEventListener('click', (event) => {
        const activeDropdown = document.querySelector('.dropdown-menu-container:not(.disabled)');
        if (activeDropdown && !event.target.closest('.enter-sound-wrapper')) {
            activeDropdown.classList.add('disabled');
        }
    }, true); // Usar 'capturing' para que se ejecute antes que otros eventos de clic

});