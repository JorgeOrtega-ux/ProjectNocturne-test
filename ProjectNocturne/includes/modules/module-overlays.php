<div class="module-overlay disabled">
    <?php include 'includes/menus/menu-paletteColors.php'; ?>
    <?php include 'includes/menus/menu-alarm.php'; ?>
    <?php include 'includes/menus/menu-timer.php'; ?>
    <?php include 'includes/menus/menu-worldClock.php'; ?>
</div>












<script>
    // Obtener el contenedor de scrollable y el header del menú
    const menuContentScrollable = document.querySelector('.menu-content-scrolleable');
    const menuSectionTop = document.querySelector('.menu-section-top');

    // Escuchar el evento de scroll
    menuContentScrollable.addEventListener('scroll', () => {
        // Verificar si el scroll es mayor que 50px (ajusta este valor según tus necesidades)
        if (menuContentScrollable.scrollTop > 50) {
            // Añadir la clase 'shadow' si el scroll supera los 50px
            menuSectionTop.classList.add('shadow');
        } else {
            // Remover la clase 'shadow' si el scroll es menor o igual a 50px
            menuSectionTop.classList.remove('shadow');
        }
    });
</script>