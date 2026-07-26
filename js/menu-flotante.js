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

    function comprobarPosicionMenu() {

        const alturaCabecera = header.offsetHeight;
        const rectSentinel = sentinel.getBoundingClientRect();

        if (rectSentinel.top <= alturaCabecera) {
            if (!menu.classList.contains("menuFlotante")) {
                menu.classList.add("menuFlotante");
            }
            menu.style.top = alturaCabecera + "px";
        } else {
            menu.classList.remove("menuFlotante");
            menu.style.top = "";
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
    });

    window.addEventListener("resize", comprobarPosicionMenu);
    track.addEventListener("scroll", comprobarFlechasMenu);

    flechaIzq?.addEventListener("click", () => {
        track.scrollBy({ left: -180, behavior: "smooth" });
    });

    flechaDer?.addEventListener("click", () => {
        track.scrollBy({ left: 180, behavior: "smooth" });
    });

    // Comprobación inicial (por si la página carga ya con scroll aplicado)
    comprobarPosicionMenu();

});

console.log("✔ menu-flotante cargado");
