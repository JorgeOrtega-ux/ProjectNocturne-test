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
                    <input type="text" class="body-title" autocomplete="off" data-translate="search_alarms_placeholder" data-translate-category="search" data-translate-target="placeholder">
                </div>
            </div>
        </div>
        <div class="menu-content-scrolleable overflow-y">
            <div class="menu-section-center">
                <div class="menu-content-wrapper active">
                    <div class="menu-content">
                        <div class="menu-content-header">
                            <div class="menu-content-header-primary">
                                <span class="material-symbols-rounded">label</span>
                                <span data-translate="alarm_title" data-translate-category="alarms">Título de la alarma</span>
                            </div>
                        </div>
                        <div class="menu-content-general">
                            <div class="enter-text-tool">
                                <input type="text" id="alarm-title" data-translate="my_new_alarm_placeholder" data-translate-category="alarms" data-translate-target="placeholder">
                            </div>
                        </div>
                    </div>
                    <div class="menu-content">
                        <div class="menu-content-header">
                            <div class="menu-content-header-primary">
                                <span class="material-symbols-rounded">schedule</span>
                                <span data-translate="alarm_settings" data-translate-category="alarms">Configuración de la alarma</span>
                            </div>
                        </div>
                        <div class="menu-content-general">
                            <div class="enter-date-content">
                                <div class="enter-date-tool">
                                    <div class="enter-date-tool-left" data-action="decreaseHour">
                                        <span class="material-symbols-rounded">arrow_left</span>
                                    </div>
                                    <div class="enter-date-tool-center" id="hour-display">24 horas</div>
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
                                <span data-translate="alarm_sound" data-translate-category="alarms">Sonido de la alarma</span>
                            </div>
                        </div>
                        <div class="menu-content-general">
                            <div class="enter-sound-wrapper">
                                <div class="enter-sound-content" data-action="toggleDropdown" data-target-menu=".menu-alarm-sound">
                                    <div class="enter-sound-content-left">
                                        <span id="alarm-selected-sound" data-translate="classic_beep" data-translate-category="sounds">Beep Clásico</span>
                                    </div>
                                    <div class="enter-sound-content-right">
                                        <span class="material-symbols-rounded">expand_more</span>
                                    </div>
                                </div>
                                <div class="dropdown-menu-container menu-alarm-sound disabled" data-menu="alarmSoundMenu">
                                    <div class="menu-list">
                                        <div class="menu-link" data-action="selectAlarmSound" data-sound="classic-beep">
                                            <div class="menu-link-icon"><span class="material-symbols-rounded">volume_up</span></div>
                                            <div class="menu-link-text"><span data-translate="classic_beep" data-translate-category="sounds">Beep Clásico</span></div>
                                        </div>
                                        <div class="menu-link" data-action="selectAlarmSound" data-sound="gentle-chime">
                                            <div class="menu-link-icon"><span class="material-symbols-rounded">notifications</span></div>
                                            <div class="menu-link-text"><span data-translate="gentle_chime" data-translate-category="sounds">Campanita Suave</span></div>
                                        </div>
                                        <div class="menu-link" data-action="selectAlarmSound" data-sound="digital-alarm">
                                            <div class="menu-link-icon"><span class="material-symbols-rounded">alarm</span></div>
                                            <div class="menu-link-text"><span data-translate="digital_alarm" data-translate-category="sounds">Alarma Digital</span></div>
                                        </div>
                                        <div class="menu-link" data-action="selectAlarmSound" data-sound="peaceful-tone">
                                            <div class="menu-link-icon"><span class="material-symbols-rounded">self_care</span></div>
                                            <div class="menu-link-text"><span data-translate="peaceful_tone" data-translate-category="sounds">Tono Relajante</span></div>
                                        </div>
                                        <div class="menu-link" data-action="selectAlarmSound" data-sound="urgent-beep">
                                            <div class="menu-link-icon"><span class="material-symbols-rounded">priority_high</span></div>
                                            <div class="menu-link-text"><span data-translate="urgent_beep" data-translate-category="sounds">Beep Urgente</span></div>
                                        </div>
                                    </div>
                                </div>
                                <div class="menu-action-button" data-action="previewAlarmSound">
                                    <span class="material-symbols-rounded">play_arrow</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="menu-section-bottom">
                <div class="create-tool" data-action="createAlarm">
                    <span data-translate="create_alarm" data-translate-category="alarms">Crear alarma</span>
                </div>
            </div>
        </div>
    </div>
</div>