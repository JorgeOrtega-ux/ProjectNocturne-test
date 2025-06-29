<div class="menu-timer disabled body-title" data-menu="Timer">
    <div class="pill-container">
        <div class="drag-handle"></div>
    </div>
    <div class="menu-section">
        <div class="menu-tabs">
            <div class="menu-tab active" data-tab="countdown">
                <span data-translate="countdown" data-translate-category="timer">Cuenta atrás</span>
            </div>
            <div class="menu-tab" data-tab="count_to_date">
                <span data-translate="count_to_date" data-translate-category="timer">Contar hasta fecha</span>
            </div>
        </div>
        <div class="menu-content-scrolleable overflow-y">
            <div class="menu-section-center overflow-y">
                <div class="menu-content-wrapper active" data-tab-content="countdown">
                    <div class="menu-content">
                        <div class="menu-content-header">
                            <div class="menu-content-header-primary"><span class="material-symbols-rounded">label</span><span data-translate="timer_title" data-translate-category="timer">Título</span></div>
                        </div>
                        <div class="menu-content-general">
                            <div class="enter-text-tool"><input type="text" id="timer-title" data-translate="my_new_timer_placeholder" data-translate-category="timer" data-translate-target="placeholder"></div>
                        </div>
                    </div>
                    <div class="menu-content">
                        <div class="menu-content-header">
                            <div class="menu-content-header-primary"><span class="material-symbols-rounded">timelapse</span><span data-translate="set_duration" data-translate-category="timer">Establecer Duración</span></div>
                        </div>
                        <div class="menu-content-general">
                            <div class="enter-date-content">
                                <div class="enter-date-tool">
                                    <div class="enter-date-tool-left" data-action="decreaseTimerHour"><span class="material-symbols-rounded">arrow_left</span></div>
                                    <div class="enter-date-tool-center" id="timer-hour-display">0 h</div>
                                    <div class="enter-date-tool-right" data-action="increaseTimerHour"><span class="material-symbols-rounded">arrow_right</span></div>
                                </div>
                                <div class="enter-date-tool">
                                    <div class="enter-date-tool-left" data-action="decreaseTimerMinute"><span class="material-symbols-rounded">arrow_left</span></div>
                                    <div class="enter-date-tool-center" id="timer-minute-display">5 min</div>
                                    <div class="enter-date-tool-right" data-action="increaseTimerMinute"><span class="material-symbols-rounded">arrow_right</span></div>
                                </div>
                                <div class="enter-date-tool">
                                    <div class="enter-date-tool-left" data-action="decreaseTimerSecond"><span class="material-symbols-rounded">arrow_left</span></div>
                                    <div class="enter-date-tool-center" id="timer-second-display">0 s</div>
                                    <div class="enter-date-tool-right" data-action="increaseTimerSecond"><span class="material-symbols-rounded">arrow_right</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="menu-content">
                        <div class="menu-content-header">
                            <div class="menu-content-header-primary"><span class="material-symbols-rounded">settings_power</span><span data-translate="when_timer_ends" data-translate-category="timer">Cuando el temporizador termine</span></div>
                        </div>
                        <div class="menu-content-general">
                            <div class="enter-sound-wrapper">
                                <div class="enter-sound-content" data-action="toggleTimerEndActionDropdown">
                                    <div class="enter-sound-content-left"><span id="timer-selected-end-action" data-translate="stop_timer" data-translate-category="timer">Parar temporizador</span></div>
                                    <div class="enter-sound-content-right"><span class="material-symbols-rounded">expand_more</span></div>
                                </div>
                                <div class="dropdown-menu-container menu-timer-end-action disabled body-title" data-menu="timerEndActionMenu">
                                    <div class="menu-list">
                                        <div class="menu-link" data-action="selectTimerEndAction" data-end-action="stop">
                                            <div class="menu-link-icon"><span class="material-symbols-rounded">stop</span></div>
                                            <div class="menu-link-text"><span data-translate="stop_timer" data-translate-category="timer">Parar temporizador</span></div>
                                        </div>
                                        <div class="menu-link" data-action="selectTimerEndAction" data-end-action="restart">
                                            <div class="menu-link-icon"><span class="material-symbols-rounded">replay</span></div>
                                            <div class="menu-link-text"><span data-translate="restart_timer" data-translate-category="timer">Reiniciar temporizador</span></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="menu-content">
                        <div class="menu-content-header">
                            <div class="menu-content-header-primary"><span class="material-symbols-rounded">music_note</span><span data-translate="alarm_sound" data-translate-category="alarms">Sonido</span></div>
                        </div>
                        <div class="menu-content-general">
                            <div class="enter-sound-wrapper">
                                <div class="enter-sound-content" data-action="toggleTimerSoundDropdown">
                                    <div class="enter-sound-content-left"><span id="timer-selected-sound" data-translate="classic_beep" data-translate-category="sounds">Beep Clásico</span></div>
                                    <div class="enter-sound-content-right"><span class="material-symbols-rounded">expand_more</span></div>
                                </div>
                                <div class="dropdown-menu-container dropdown-menu--structured menu-timer-sound disabled body-title" data-menu="timerSoundMenu">
                                     <div class="dropdown-menu-top">
                                        <div class="menu-link" data-action="upload-sound" data-target-input="timer-audio-upload">
                                            <div class="menu-link-icon"><span class="material-symbols-rounded">upload</span></div>
                                            <div class="menu-link-text"><span data-translate="upload_audio" data-translate-category="sounds">Subir audio</span></div>
                                            <input type="file" accept="audio/*" style="display: none;" id="timer-audio-upload">
                                        </div>
                                    </div>
                                    <div class="dropdown-menu-bottom overflow-y">
                                        <div class="menu-list">
                                            </div>
                                    </div>
                                </div>
                                <div class="menu-action-button" data-action="previewTimerSound"><span class="material-symbols-rounded">play_arrow</span></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="menu-content-wrapper disabled" data-tab-content="count_to_date">
                    <div class="menu-content">
                        <div class="menu-content-header">
                            <div class="menu-content-header-primary"><span class="material-symbols-rounded">label</span><span data-translate="timer_title" data-translate-category="timer">Título</span></div>
                        </div>
                        <div class="menu-content-general">
                            <div class="enter-text-tool"><input type="text" id="countto-title" data-translate="my_event_placeholder" data-translate-category="timer" data-translate-target="placeholder"></div>
                        </div>
                    </div>
                    <div class="menu-content">
                        <div class="menu-content-header">
                            <div class="menu-content-header-primary"><span class="material-symbols-rounded">calendar_month</span><span data-translate="select_date_time" data-translate-category="timer">Seleccionar Fecha y Hora</span></div>
                        </div>
                        <div class="menu-content-general">
                            <div class="date-time-content">
                                <div class="date-time-selector">
                                    <div class="enter-sound-content" data-action="toggleCalendarDropdown">
                                        <div class="enter-sound-content-left"><span id="selected-date-display">-- / -- / ----</span></div>
                                        <div class="enter-sound-content-right"><span class="material-symbols-rounded">calendar_today</span></div>
                                    </div>
                                    <div class="dropdown-menu-container calendar-container overflow-y disabled body-title" data-menu="calendar">
                                        <div class="calendar-header">
                                            <button class="calendar-nav" data-action="prev-month">
                                                <span class="material-symbols-rounded">arrow_left</span>
                                            </button>
                                            <span id="calendar-month-year"></span>
                                            <button class="calendar-nav" data-action="next-month">
                                                <span class="material-symbols-rounded">arrow_right</span>
                                            </button>
                                        </div>
                                        <div class="calendar-weekdays">
                                            <div>D</div>
                                            <div>L</div>
                                            <div>M</div>
                                            <div>M</div>
                                            <div>J</div>
                                            <div>V</div>
                                            <div>S</div>
                                        </div>
                                        <div class="calendar-days"></div>
                                    </div>
                                </div>

                                <div class="date-time-selector">
                                    <div class="enter-sound-content" data-action="toggleTimerHourDropdown">
                                        <div class="enter-sound-content-left"><span id="selected-hour-display">--</span> : <span id="selected-minute-display">--</span></div>
                                        <div class="enter-sound-content-right"><span class="material-symbols-rounded">schedule</span></div>
                                    </div>

                                    <div class="dropdown-menu-container menu-timer-hour-selection overflow-y disabled body-title" data-menu="timerHourMenu">
                                        <div class="menu-list menu-list-grid" data-list-type="hours">
                                            </div>
                                    </div>

                                    <div class="dropdown-menu-container menu-timer-minute-selection overflow-y disabled body-title" data-menu="timerMinuteMenu">
                                        <div class="menu-list menu-list-grid" data-list-type="minutes">
                                            </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="menu-section-bottom">
                <div class="create-tool" data-action="createTimer">
                    <span data-translate="create_timer" data-translate-category="timer">Crear temporizador</span>
                </div>
            </div>
        </div>
    </div>
</div>