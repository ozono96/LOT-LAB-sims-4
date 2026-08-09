document.addEventListener("DOMContentLoaded", () => {

    const logoImg = document.getElementById("imgLogoHeader");
    const logoContenedor = document.getElementById("headerLogo");

    if (!logoImg || !logoContenedor) return;

    const LOGO_1 = "img/logo/logo1.png";
    const LOGO_2 = "img/logo/logo2.jpg";

    const soportaHover = window.matchMedia("(hover: hover)").matches;

    if (soportaHover) {

        // Escritorio: cambia con el ratón
        logoContenedor.addEventListener("mouseenter", () => {
            logoImg.src = LOGO_2;
        });

        logoContenedor.addEventListener("mouseleave", () => {
            logoImg.src = LOGO_1;
        });

    } else {

        // Móvil/táctil: cambia al pulsar
        logoContenedor.addEventListener("click", () => {
            logoImg.src = logoImg.src.includes("logo2") ? LOGO_1 : LOGO_2;
        });

    }

});