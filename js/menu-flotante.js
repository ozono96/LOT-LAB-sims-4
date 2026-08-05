/* =========================================================
   MENÚ PRINCIPAL FLOTANTE
   Cuando el scroll deja el menú principal tapado por la
   cabecera fija, se transforma en una barra horizontal
   pegada justo debajo del título. Si los botones no caben
   en pantalla, aparecen flechas para desplazarse.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const header = document.querySelector("header");
    const menu = document.getElementById("menuPrincipal");
    const track = document.getElementById("menuPrincipalTrack");
    const flechaIzq = document.getElementById("flechaMenuIzq");
    const flechaDer = document.getElementById("flechaMenuDer");

    if (!header || !menu || !track) return;

    // Sentinel invisible que marca la posición original del menú,
    // para saber exactamente cuándo el scroll lo tapa con la cabecera.
    const sentinel = document.createElement("div");
    sentinel.id = "sentinelMenuPrincipal";
    menu.parentNode.insertBefore(sentinel, menu);

    // Placeholder que reserva SIEMPRE la misma altura (la que el menú
    // ocupa en su estado normal). Al activar el modo flotante, el menú
    // sale del flujo (position: fixed) y este placeholder ocupa
    // exactamente el hueco que dejaba, por lo que el documento NUNCA
    // cambia de altura en el momento del cambio, en ninguna dirección.
    const placeholder = document.createElement("div");
    placeholder.id = "placeholderMenuPrincipal";
    placeholder.style.height = "0px";
    menu.parentNode.insertBefore(placeholder, menu);

    // La altura normal del menú se mide UNA SOLA VEZ (y se recalcula
    // solo en resize), nunca en el momento del toggle. Esto evita medir
    // el menú en un estado intermedio o incorrecto, que era la causa
    // del rebote al desactivar el modo flotante (scroll hacia arriba).
    let alturaMenuNormal = 0;

    function medirAlturaMenuNormal() {
        const estabaFlotante = menu.classList.contains("menuFlotante");
        if (estabaFlotante) {
            menu.classList.remove("menuFlotante");
            menu.style.top = "";
        }
        alturaMenuNormal = menu.offsetHeight;
        if (estabaFlotante) {
            menu.classList.add("menuFlotante");
        }
    }

    function comprobarFlechasMenu() {

        if (!menu.classList.contains("menuFlotante")) {
            flechaIzq.style.display = "none";
            flechaDer.style.display = "none";
            return;
        }

        const hayOverflow = track.scrollWidth > track.clientWidth + 2;

        flechaIzq.style.display = (hayOverflow && track.scrollLeft > 5) ? "flex" : "none";
        flechaDer.style.display = (hayOverflow && track.scrollLeft < (track.scrollWidth - track.clientWidth - 5)) ? "flex" : "none";
    }

    function activarFlotante() {
        if (menu.classList.contains("menuFlotante")) return;
        header.classList.add("headerCompacto");
        placeholder.style.height = alturaMenuNormal + "px";
        menu.classList.add("menuFlotante");
    }

    function desactivarFlotante() {
        if (!menu.classList.contains("menuFlotante")) return;
        header.classList.remove("headerCompacto");
        menu.classList.remove("menuFlotante");
        menu.style.top = "";
        placeholder.style.height = "0px";
    }

    function comprobarPosicionMenu() {

        const alturaCabecera = header.offsetHeight;
        const SEPARACION_FLOTANTE = 10; // px de hueco fijo, siempre igual en todas las ventanas
        const HISTERESIS = 6; // px de margen para evitar parpadeos justo en el límite

        const rectSentinel = sentinel.getBoundingClientRect();
        const yaFlotante = menu.classList.contains("menuFlotante");

        if (!yaFlotante && rectSentinel.top <= alturaCabecera) {
            activarFlotante();
        } else if (yaFlotante && rectSentinel.top > alturaCabecera + HISTERESIS) {
            desactivarFlotante();
        }

        if (menu.classList.contains("menuFlotante")) {
            menu.style.top = (header.offsetHeight + SEPARACION_FLOTANTE) + "px";
        }

        comprobarFlechasMenu();
    }

    // Optimización con requestAnimationFrame para no recalcular en cada píxel de scroll
    let scrollProgramado = false;
    window.addEventListener("scroll", () => {
        if (!scrollProgramado) {
            window.requestAnimationFrame(() => {
                comprobarPosicionMenu();
                scrollProgramado = false;
            });
            scrollProgramado = true;
        }
    }, { passive: true });

    window.addEventListener("resize", () => {
        desactivarFlotante();
        medirAlturaMenuNormal();
        comprobarPosicionMenu();
    }, { passive: true });

    track.addEventListener("scroll", comprobarFlechasMenu, { passive: true });

    // Permite desplazar el menú flotante horizontalmente con la rueda del ratón
    // Usa un paso fijo y scroll suave para una experiencia fluida
    menu.addEventListener("wheel", (e) => {
        if (!menu.classList.contains("menuFlotante")) return;

        const hayOverflow = track.scrollWidth > track.clientWidth + 2;
        if (!hayOverflow) return;

        e.preventDefault();

        const delta = e.deltaY !== 0 ? e.deltaY : e.deltaX;
        const direccion = delta > 0 ? 1 : -1;
        track.scrollBy({ left: direccion * 300 });
    }, { passive: false });

    flechaIzq?.addEventListener("click", () => {
        track.scrollBy({ left: -180, behavior: "smooth" });
    });

    flechaDer?.addEventListener("click", () => {
        track.scrollBy({ left: 180, behavior: "smooth" });
    });

    // Al inicializar, garantizar siempre la vista completa (título normal + botones normales)
    header.classList.remove("headerCompacto");
    desactivarFlotante();
    medirAlturaMenuNormal();
    comprobarPosicionMenu();

});



console.log("✔ menu-flotante cargado");