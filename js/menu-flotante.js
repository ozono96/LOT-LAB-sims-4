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

    // Sentinel invisible que marca el final de la sección de botones original,
    // para saber con precisión cuándo dicha sección queda completamente fuera de la zona visible.
    const sentinel = document.createElement("div");
    sentinel.id = "sentinelMenuPrincipal";
    sentinel.style.cssText = "width: 100%; height: 1px; pointer-events: none; visibility: hidden;";
    menu.parentNode.insertBefore(sentinel, menu.nextSibling);

    // Placeholder que reserva SIEMPRE la misma altura (la que el menú
    // ocupa en su estado normal). Al activar el modo flotante, el menú
    // sale del flujo (position: fixed) y este placeholder ocupa
    // exactamente el hueco que dejaba, por lo que el documento NUNCA
    // cambia de altura en el momento del cambio, en ninguna dirección.
    const placeholder = document.createElement("div");
    placeholder.id = "placeholderMenuPrincipal";
    placeholder.style.height = "0px";
    menu.parentNode.insertBefore(placeholder, menu);

    // La altura normal del menú y cabecera se miden una sola vez (y se recalculan
    // en resize). Esto evita mediciones en estados transitorios o incorrectos.
    let alturaMenuNormal = 0;
    let alturaCabeceraNormal = 172;
    let offsetPrimerBoton = 26;
    let alturaPrimerBoton = 50;

    function medirAlturasNormales() {
        const estabaFlotante = menu.classList.contains("menuFlotante");
        const estabaCompacto = header.classList.contains("headerCompacto");
        if (estabaFlotante) {
            menu.classList.remove("menuFlotante");
            menu.style.top = "";
        }
        if (estabaCompacto) {
            header.classList.remove("headerCompacto");
        }
        alturaCabeceraNormal = header.offsetHeight || 172;
        alturaMenuNormal = menu.offsetHeight;
        if (track && track.firstElementChild) {
            alturaPrimerBoton = track.firstElementChild.offsetHeight || 50;
            offsetPrimerBoton = Math.round(track.firstElementChild.getBoundingClientRect().top - menu.getBoundingClientRect().top);
        }
        if (estabaCompacto) {
            header.classList.add("headerCompacto");
        }
        if (estabaFlotante) {
            menu.classList.add("menuFlotante");
            actualizarPosicionMenuFlotante();
        }
    }

    function actualizarPosicionMenuFlotante() {
        if (!menu.classList.contains("menuFlotante")) {
            menu.style.top = "";
            return;
        }
        const GAP = 6;
        const alturaCompacta = window.innerWidth <= 700 ? 52 : 72;
        menu.style.top = (alturaCompacta + GAP) + "px";
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

    // Determina de forma estable y responsive si la ventana actual es "corta"
    // (poco contenido / pequeño excedente de scroll) o "realmente larga / desplazable".
    // Evita la compactación y los rebotes visuales cuando el usuario solo necesita
    // un pequeño desplazamiento para ver el final del contenido o la tarjeta.
    function esVentanaCorta() {
        const ventanaActualEl = window.ventanaActual ? document.getElementById(window.ventanaActual) : null;

        const alturaCabeceraCompacta = window.innerWidth <= 700 ? 52 : 72;
        const deltaHeader = alturaCabeceraNormal - alturaCabeceraCompacta;

        // 1. Altura total descompactada estable (invariante ante si el header está o no compactado)
        const alturaTotalDesplazable = document.documentElement.scrollHeight +
            (header.classList.contains("headerCompacto") ? deltaHeader : 0);
        const alturaVisible = window.innerHeight;
        const scrollMaximo = Math.max(0, alturaTotalDesplazable - alturaVisible);

        // Si no hay scroll o el scroll máximo total es insignificante (< 40px)
        if (scrollMaximo <= 40) return true;

        // 2. Distancia requerida desde reposo para que los botones alcancen la cabecera
        const scrollYActual = window.scrollY || document.documentElement.scrollTop || 0;
        const placeholderTopDoc = placeholder.getBoundingClientRect().top + scrollYActual;
        const distanciaAlTrigger = Math.max(0, (placeholderTopDoc + offsetPrimerBoton + (alturaPrimerBoton * 0.5)) - alturaCabeceraNormal);
        const scrollRestante = scrollMaximo - distanciaAlTrigger;

        // 3. Regla física anti-rebote:
        // Si el scroll restante tras el trigger no supera con holgura la contracción de la cabecera (deltaHeader * 1.5),
        // contraer la cabecera consumiría todo el scroll restante forzando al navegador a reajustar y rebotar.
        if (scrollRestante <= deltaHeader * 1.5) {
            return true;
        }

        // 4. Si la ventana tiene scroll interno propio significativo (> 100px), es larga
        const scrollInterno = (ventanaActualEl && ventanaActualEl.scrollHeight > ventanaActualEl.clientHeight)
            ? (ventanaActualEl.scrollHeight - ventanaActualEl.clientHeight)
            : 0;
        if (scrollInterno > 100) return false;

        // 5. Análisis del contenido real de la ventana activa:
        // Si la ventana activa tiene un contenido compacto (< 650px):
        // Ejemplos: Timer (~417px), Buscador sin menús desplegados (~400px), Dados (~463px).
        // En estas ventanas el contenido es una tarjeta o herramienta breve y el poco scroll
        // existente es solo para llegar al final de la tarjeta o footer.
        const alturaContenido = ventanaActualEl ? ventanaActualEl.offsetHeight : 0;
        const esContenidoCompacto = (alturaContenido > 0 && alturaContenido < 650);

        if (esContenidoCompacto) {
            return true;
        }

        // 6. Criterio proporcional de recorrido disponible:
        // Si el scroll máximo total de la página no supera un recorrido significativo
        // respecto a la altura visible (al menos 35% del viewport)
        if (scrollMaximo < alturaVisible * 0.35) {
            return true;
        }

        return false;
    }

    function activarFlotante() {
        // Doble salvaguarda: nunca activar si el scroll está arriba del todo o es ventana corta
        const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
        if (scrollY <= 5) return;
        if (esVentanaCorta()) return;

        if (menu.classList.contains("menuFlotante")) return;
        header.classList.add("headerCompacto");
        placeholder.style.height = alturaMenuNormal + "px";
        menu.classList.add("menuFlotante");
        actualizarPosicionMenuFlotante();
        comprobarFlechasMenu();
    }

    function desactivarFlotante() {
        if (!menu.classList.contains("menuFlotante") && !header.classList.contains("headerCompacto")) return;
        header.classList.remove("headerCompacto");
        menu.classList.remove("menuFlotante");
        menu.style.top = "";
        placeholder.style.height = "0px";
        comprobarFlechasMenu();
    }

    // Jerarquía estricta de prioridades según especificación:
    // PRIORIDAD 2: Ventana corta con poco scroll o recorrido insuficiente -> barra completa obligatoria
    // PRIORIDAD 3: Scroll arriba del todo (scrollTop <= 5) -> barra completa obligatoria
    // PRIORIDAD 4: Sección original todavía visible en pantalla -> barra completa
    // PRIORIDAD 5: Primera fila empieza a ocultarse tras cabecera -> barra compacta
    function actualizarEstadoBarra() {
        const ventanaActualEl = window.ventanaActual ? document.getElementById(window.ventanaActual) : null;

        // PRIORIDAD 2: Ventana corta con poco scroll o recorrido insuficiente
        if (esVentanaCorta()) {
            desactivarFlotante();
            return;
        }

        // PRIORIDAD 3: El scroll está arriba del todo
        const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
        const scrollTopVentana = ventanaActualEl ? ventanaActualEl.scrollTop : 0;

        if (scrollY <= 5 && scrollTopVentana <= 5) {
            desactivarFlotante();
            return;
        }

        // PRIORIDAD 4 y 5: Según la visibilidad real de la primera fila de botones.
        // Mientras la primera fila esté mayoritariamente visible -> Formato completo.
        // Cuando aproximadamente el 50% de la primera fila queda cubierta por la cabecera -> Formato compacto flotante.
        const topPrimeraFila = placeholder.getBoundingClientRect().top + offsetPrimerBoton;
        const umbralTrigger = alturaCabeceraNormal - Math.round(alturaPrimerBoton * 0.5);

        if (topPrimeraFila <= umbralTrigger) {
            activarFlotante();
        } else if (topPrimeraFila > umbralTrigger + 6) {
            desactivarFlotante();
        }
    }

    // Funciones globales para garantizar reset limpio desde la navegación entre ventanas
    window.resetearBarraMenuPrincipal = function() {
        desactivarFlotante();
    };

    window.actualizarEstadoBarraMenu = function() {
        actualizarEstadoBarra();
    };

    // Observer nativo para supervisar el paso de la sección original por el umbral de pantalla
    const observer = new IntersectionObserver(() => {
        actualizarEstadoBarra();
    }, {
        root: null,
        threshold: 0
    });

    observer.observe(sentinel);

    // Listener de scroll (con capture para detectar tanto scroll de window como cualquier scroll interno)
    let scrollProgramado = false;
    window.addEventListener("scroll", () => {
        if (!scrollProgramado) {
            window.requestAnimationFrame(() => {
                actualizarEstadoBarra();
                scrollProgramado = false;
            });
            scrollProgramado = true;
        }
    }, { passive: true, capture: true });

    window.addEventListener("resize", () => {
        medirAlturasNormales();
        if (menu.classList.contains("menuFlotante")) {
            actualizarPosicionMenuFlotante();
        }
        comprobarFlechasMenu();
        actualizarEstadoBarra();
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
    medirAlturasNormales();
    actualizarEstadoBarra();

});



console.log("✔ menu-flotante cargado");