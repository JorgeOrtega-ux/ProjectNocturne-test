<div class="menu-alarm disabled body-title" data-menu="Alarm">
    <div class="pill-container">
        <div class="drag-handle"></div>
    </div>
    <div class="menu-section">
        <div class="menu-section-top">
            <div class="search-content">
                <div class="search-content-icon">
                    <span class="material-symbols-rounded">search</span>
                </div>
                <div class="search-content-text">
                    <input type="text" class="body-title" autocomplete="off" placeholder="Buscar alarmas...">
                </div>
            </div>
        </div>
        <div class="menu-section-center">
            <div class="menu-content-wrapper active">
                <div class="menu-content">
                    <div class="menu-content-header">
                        <div class="menu-content-header-primary">
                            <span class="material-symbols-rounded">tag</span>
                            <span>Título de la alarma</span>
                        </div>
                    </div>
                    <div class="menu-content-general">
                        <div class="enter-text-tool">
                            <input type="text" id="alarm-title" placeholder="Mi nueva alarma">
                        </div>
                    </div>
                </div>
                <div class="menu-content">
                    <div class="menu-content-header">
                        <div class="menu-content-header-primary">
                            <span class="material-symbols-rounded">schedule</span>
                            <span>Configuración de la alarma</span>
                        </div>
                    </div>
                    <div class="menu-content-general">
                        <div class="enter-date-content">
                            <div class="enter-date-tool">
                                <div class="enter-date-tool-left" data-action="decreaseHour">
                                    <span class="material-symbols-rounded">arrow_left</span>
                                </div>
                                <div class="enter-date-tool-center" id="hour-display">12 horas</div>
                                <div class="enter-date-tool-right" data-action="increaseHour">
                                    <span class="material-symbols-rounded">arrow_right</span>
                                </div>
                            </div>
                            <div class="enter-date-tool">
                                <div class="enter-date-tool-left" data-action="decreaseMinute">
                                    <span class="material-symbols-rounded">arrow_left</span>
                                </div>
                                <div class="enter-date-tool-center" id="minute-display">0 minutos</div>
                                <div class="enter-date-tool-right" data-action="increaseMinute">
                                    <span class="material-symbols-rounded">arrow_right</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="menu-content">
                    <div class="menu-content-header">
                        <div class="menu-content-header-primary">
                            <span class="material-symbols-rounded">music_note</span>
                            <span>Sonido de la alarma</span>
                        </div>
                    </div>
                    <div class="menu-content-general">
                        <div class="enter-sound-wrapper">
                            <div class="enter-sound-content" data-action="toggleSoundMenu">
                                <div class="enter-sound-content-left">
                                    <span id="selected-sound">Beep Clásico</span>
                                </div>
                                <div class="enter-sound-content-right">
                                    <span class="material-symbols-rounded">expand_more</span>
                                </div>
                            </div>
                            <div class="menu-sound disabled" data-menu="sound-menu">
                                <div class="menu-list">
                                    <div class="menu-link" data-action="selectSound" data-sound="classic-beep">
                                        <div class="menu-link-icon">
                                            <span class="material-symbols-rounded">volume_up</span>
                                        </div>
                                        <div class="menu-link-text">
                                            <span>Beep Clásico</span>
                                        </div>
                                    </div>
                                    <div class="menu-link" data-action="selectSound" data-sound="gentle-chime">
                                        <div class="menu-link-icon">
                                            <span class="material-symbols-rounded">notifications</span>
                                        </div>
                                        <div class="menu-link-text">
                                            <span>Campanita Suave</span>
                                        </div>
                                    </div>
                                    <div class="menu-link" data-action="selectSound" data-sound="digital-alarm">
                                        <div class="menu-link-icon">
                                            <span class="material-symbols-rounded">alarm</span>
                                        </div>
                                        <div class="menu-link-text">
                                            <span>Alarma Digital</span>
                                        </div>
                                    </div>
                                    <div class="menu-link" data-action="selectSound" data-sound="peaceful-tone">
                                        <div class="menu-link-icon">
                                            <span class="material-symbols-rounded">self_care</span>
                                        </div>
                                        <div class="menu-link-text">
                                            <span>Tono Relajante</span>
                                        </div>
                                    </div>
                                    <div class="menu-link" data-action="selectSound" data-sound="urgent-beep">
                                        <div class="menu-link-icon">
                                            <span class="material-symbols-rounded">priority_high</span>
                                        </div>
                                        <div class="menu-link-text">
                                            <span>Beep Urgente</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="menu-alarm-button" data-action="previewSound">
                                <span class="material-symbols-rounded">play_arrow</span>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
        <div class="menu-section-bottom">
            <div class="create-tool" data-action="createAlarm">
                <span>Crear alarma</span>
            </div>
        </div>
    </div>
</div>