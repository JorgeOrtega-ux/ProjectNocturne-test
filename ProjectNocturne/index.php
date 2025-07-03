<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/chroma-js/2.4.2/chroma.min.js"></script>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded" />
    <link rel="stylesheet" type="text/css" href="assets/css/general/styles.css">
    <link rel="stylesheet" type="text/css" href="assets/css/general/dark-mode.css">
    <link rel="stylesheet" type="text/css" href="assets/css/tools/tools.css">
    <script src="assets/js/general/initial-theme.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js"></script>
    <title>ProjectNocturne - Home</title>
</head>

<body>
    <div class="page-wrapper">
        <div class="main-content">
            <?php include 'includes/layouts/sidebar-desktop.php'; ?>
            <div class="general-content overflow-y">
                <div class="general-content-top">
                    <?php include 'includes/layouts/header.php'; ?>
                </div>
                <div class="general-content-scrolleable">
                    <?php include 'includes/layouts/sidebar-mobile.php'; ?>
                    <?php include 'includes/modules/module-overlays.php'; ?>
                    <div class="scrollable-content overflow-y">
                        <div class="general-content-bottom">
                            <div class="section-content">
                                <?php include 'includes/sections/everything.php'; ?>
                                <?php include 'includes/sections/alarm.php'; ?>
                                <?php include 'includes/sections/timer.php'; ?>
                                <?php include 'includes/sections/stopwatch.php'; ?>
                                <?php include 'includes/sections/worldClock.php'; ?>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

<div class="module-overlay">
    <div class="menu-delete">
        <h1>¿Quieres eliminar, (Alarma, temproziador, reloj mundial, Audio)?</h1>
        <span>Estás a punto de eliminar <strong>nombre de alarma o timer</strong> de tu almacenamiento. No podrás deshacer la acción
        <div class="menu-delete-btns">
            <button>Cancelar</button>
            <button>Eliminar</button>
        </div>
    </div>
</div>

    <style>
        .module-overlay {
            width: 100%;
            height: 100vh;
            top: 0;
            left: 0;
            display: flex;
            position: fixed;
            background-color: #00000080;
            justify-content: center;
            align-items: center;
        }


        .menu-delete {
            max-width: 545px;
            height: 220px;
            width: 100%;
            padding: 18px;
            background-color: #ffffff;
            border-radius: 8px;
        }
    </style>





    <!-- General scripts -->
    <script type="module" src="assets/js/general/init-app.js"></script>
    <script type="module" src="assets/js/general/main.js"></script>
    <script type="module" src="assets/js/general/translations-controller.js"></script>
    <script type="module" src="assets/js/general/location-manager.js"></script>
    <script type="module" src="assets/js/general/module-manager.js"></script>
    <script type="module" src="assets/js/general/theme-manager.js"></script>
    <script type="module" src="assets/js/general/language-manager.js"></script>
    <script type="module" src="assets/js/general/tooltip-controller.js"></script>
    <script type="module" src="assets/js/general/drag-controller.js"></script>
    <script type="module" src="assets/js/general/dynamic-island-controller.js"></script>

    <!-- Tools scripts -->
    <script type="module" src="assets/js/tools/general-tools.js"></script>
    <script type="module" src="assets/js/tools/palette-colors.js"></script>
    <script type="module" src="assets/js/tools/color-search-system.js"></script>
    <script type="module" src="assets/js/tools/everything-controller.js"></script>
    <script type="module" src="assets/js/tools/alarm-controller.js"></script>
    <script type="module" src="assets/js/tools/timer-controller.js"></script>
    <script type="module" src="assets/js/tools/stopwatch-controller.js"></script>
    <script type="module" src="assets/js/tools/worldClock-controller.js"></script>
    <script type="module" src="assets/js/tools/menu-interactions.js"></script>
    <script type="module" src="assets/js/tools/zoneinfo-controller.js"></script>
    <script type="module" src="assets/js/tools/festivities-manager.js"></script>

</body>

</html>