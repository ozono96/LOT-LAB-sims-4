document.addEventListener("DOMContentLoaded", () => {

    document
        .getElementById("buscarSolares")
        ?.addEventListener("click", buscarSolares);



    document
        .getElementById("botonListado")
        ?.addEventListener("click", abrirListadoCompleto);


    document
        .getElementById("cerrarAvisoFiltros")
        ?.addEventListener("click", () => {

            cerrarVentana("ventanaAvisoFiltros");

            abrirVentana("ventanaBuscador");

        });


    document
        .getElementById("subirResultados")
        ?.addEventListener("click", () => {
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        });

    document
        .getElementById("bajarResultados")
        ?.addEventListener("click", () => {
            window.scrollTo({
                top: document.body.scrollHeight,
                behavior: "smooth"
            });
        });


    const botonSubir = document.getElementById("subirResultados");
    const botonBajar = document.getElementById("bajarResultados");

    let scrollBotonesProgramado = false;

    function actualizarBotonesScroll() {
        if (window.innerWidth <= 700) {
            if (botonSubir) botonSubir.style.display = "none";
            if (botonBajar) botonBajar.style.display = "none";
            return;
        }

        const scrollY = window.scrollY;
        const totalHeight = document.documentElement.scrollHeight;
        const viewportHeight = window.innerHeight;

        if (botonSubir) {
            botonSubir.style.display = scrollY > 300 ? "flex" : "none";
        }

        if (botonBajar) {
            // Mostrar botón de bajar si hay más contenido abajo (al menos 200px)
            const quedanPorBajar = totalHeight - (scrollY + viewportHeight);
            botonBajar.style.display = (totalHeight > viewportHeight + 300 && quedanPorBajar > 200) ? "flex" : "none";
        }
    }

    window.addEventListener("scroll", () => {
        if (!scrollBotonesProgramado) {
            window.requestAnimationFrame(() => {
                actualizarBotonesScroll();
                scrollBotonesProgramado = false;
            });
            scrollBotonesProgramado = true;
        }
    }, { passive: true });



    document
        .getElementById("ventanaResultados")
        ?.querySelector(".cerrar")
        ?.addEventListener("click", () => {

            cerrarVentana("ventanaResultados");

            abrirVentana("ventanaBuscador");

        });

    // Refresh view if data loads after navigating via direct URL
    document.addEventListener("datosCargados", () => {
        if (window.ventanaActual === "ventanaListado" && typeof window.mostrarListadoCompleto === "function") {
            window.mostrarListadoCompleto();
        }
        if (window.ventanaActual === "ventanaAleatorio" && typeof window.mostrarAleatorio === "function") {
            window.mostrarAleatorio();
        }
    });

});





function buscarSolares() {

    const hayBusquedaNombre = typeof hayBusquedaNombreActiva === "function" && hayBusquedaNombreActiva();

    if (!hayFiltros() && !hayBusquedaNombre) {

        abrirVentana("ventanaAvisoFiltros");
        return;

    }

    abrirVentana("ventanaResultados");
    mostrarResultados();

    // Sincronizar filtros y resultados con OBS
    if (!window.esSincronizacionOBS && typeof window.emitirEventoOBS === "function" && typeof window.obtenerEstadoFiltros === "function") {
        window.emitirEventoOBS("SYNC_ACCION", {
            accion: "BUSCAR_SOLARES_RESULTADO",
            payload: { estadoFiltros: window.obtenerEstadoFiltros() }
        });
    }

}





function abrirSolarAleatorio() {

    abrirVentana("ventanaAleatorio");
    mostrarAleatorio();

}





function abrirListadoCompleto() {

    abrirVentana("ventanaListado");
    mostrarListadoCompleto();

}

let ultimoNumeroResultados = 0;

function ajustarAnchoVentanaResultados(cantidad) {

    const ventana = document.getElementById("ventanaResultados");
    if (!ventana) return;

    // En móvil dejamos que el CSS responsive controle el ancho (96%)
    if (window.innerWidth <= 700) {
        ventana.style.width = "";
        return;
    }

    const ANCHO_TARJETA = 150;
    const GAP = 16;
    const PADDING_VENTANA = 50; // 25px a cada lado
    const MAX_COLUMNAS = 7;
    const MIN_COLUMNAS = 2;

    const columnas = Math.min(MAX_COLUMNAS, Math.max(MIN_COLUMNAS, cantidad || MIN_COLUMNAS));

    const anchoCalculado = (columnas * ANCHO_TARJETA) + ((columnas - 1) * GAP) + PADDING_VENTANA;

    // El CSS "max-width" ya actúa como límite de seguridad si esto se pasara
    ventana.style.width = anchoCalculado + "px";
}

window.addEventListener("resize", () => {
    ajustarAnchoVentanaResultados(ultimoNumeroResultados);
});

function mostrarResultados() {

    const lista = obtenerResultadosOrdenados();

    const zona = document.getElementById("listaResultados");

    const botonVolver = document.getElementById("subirResultados");
    const botonBajar = document.getElementById("bajarResultados");

    zona.innerHTML = "";

    ultimoNumeroResultados = lista.length;

    if (lista.length === 0) {

        zona.innerHTML = "<p>No existen solares con esos filtros.</p>";

        if (botonVolver) botonVolver.style.display = "none";
        if (botonBajar) botonBajar.style.display = "none";

        ajustarAnchoVentanaResultados(0);

        return;

    }

    lista.forEach(solar => {

        zona.innerHTML += crearFichaSolar(solar);

    });

    ajustarAnchoVentanaResultados(lista.length);

    if (botonVolver) botonVolver.style.display = "none";
    if (botonBajar) botonBajar.style.display = "none";

    if (lista.length > 3) {

        window.scrollTo({

            top: 0,

            behavior: "instant"

        });

    }

}



function mostrarAleatorio() {

    const solar = obtenerSolarAleatorio();

    const zona = document.getElementById("resultadoAleatorio");

    if (!solar) {

        zona.innerHTML = "<p>No hay solares disponibles.</p>";
        return;

    }

    zona.innerHTML = crearFichaSolar(solar);

}





function mostrarListadoCompleto() {

    const zona = document.getElementById("listaCompletaSolares");
    if (!zona) return;

    const db = (typeof database !== "undefined" && database) ? database : window.database;

    if (!db || !Array.isArray(db.solares) || !db.solares.length || !Array.isArray(db.mundos) || !db.mundos.length) {
        document.addEventListener("datosCargados", () => {
            if (window.ventanaActual === "ventanaListado") {
                mostrarListadoCompleto();
            }
        }, { once: true });
        return;
    }

    zona.innerHTML = "";

    const mundosSolares = {};
    db.solares.forEach(solar => {
        const mundo = solar.mundo || "Sin mundo";
        if (!mundosSolares[mundo]) {
            mundosSolares[mundo] = [];
        }
        mundosSolares[mundo].push(solar);
    });

    const mundosJuegoBase = [];
    const mundosExpansion = [];
    const mundosContenido = [];
    const procesados = new Set();

    db.mundos.forEach(fila => {
        const nombreMundo = fila[0];
        if (mundosSolares[nombreMundo]) {
            procesados.add(nombreMundo);
            const tipoPack = mundosSolares[nombreMundo][0].tipoPack.toLowerCase();

            if (tipoPack.includes("base")) {
                mundosJuegoBase.push(nombreMundo);
            } else if (tipoPack.includes("expansión") || tipoPack.includes("expansion")) {
                mundosExpansion.push(nombreMundo);
            } else {
                mundosContenido.push(nombreMundo);
            }
        }
    });

    Object.keys(mundosSolares).forEach(nombreMundo => {
        if (!procesados.has(nombreMundo)) {
            const tipoPack = mundosSolares[nombreMundo][0].tipoPack.toLowerCase();
            if (tipoPack.includes("base")) mundosJuegoBase.push(nombreMundo);
            else if (tipoPack.includes("expansión") || tipoPack.includes("expansion")) mundosExpansion.push(nombreMundo);
            else mundosContenido.push(nombreMundo);
        }
    });

    const renderGrupoMundos = (listaMundos) => {
        return listaMundos.map(mundo => {
            const solaresMundo = mundosSolares[mundo];

            // ── Icono del mundo ──────────────────────────────────────
            const rutaMundo = rutaIconoMundo(mundo);
            const iconoMundoHTML = rutaMundo
                ? `<img src="${rutaMundo}" alt="${mundo}" class="iconoMundo"
                       onerror="this.style.display='none';this.nextElementSibling.style.display='inline'">`
                : "";
            const fallbackMundo = rutaMundo
                ? `<span class="iconoMundoFallback" style="display:none;">🌎</span>`
                : `<span class="iconoMundoFallback">🌎</span>`;

            // ── Sub-agrupación por barrio ─────────────────────────────
            const barriosSolares = {};
            solaresMundo.forEach(solar => {
                const barrio = solar.barrio || "Sin barrio";
                if (!barriosSolares[barrio]) barriosSolares[barrio] = [];
                barriosSolares[barrio].push(solar);
            });

            const barriosHTML = Object.entries(barriosSolares).map(([barrio, solaresBarrio]) => {
                const rutaBaseBarrio = barrio !== "Sin barrio"
                    ? `img/barrios/${barrio.trim()}/foto`
                    : null;
                const iconoBarrioHTML = rutaBaseBarrio
                    ? `<img src="${rutaBaseBarrio}.png"
                           data-ruta-base="${rutaBaseBarrio}" data-intento="0"
                           alt="${barrio}" class="iconoBarrio"
                           onerror="manejarErrorImagenBarrio(this)">`
                    : `<span class="iconoBarrioFallback">🏘️</span>`;

                return `
                <div class="grupoBarrio">
                    <button class="tituloBarrio">
                        <span class="nombreBarrioConIcono">
                            ${iconoBarrioHTML}
                            <span class="nombreBarrio">${barrio}</span>
                        </span>
                        <span class="ladoDerechoBarrio">
                            <span class="contadorBarrio">${solaresBarrio.length}</span>
                            <span class="flechaBarrio">▼</span>
                        </span>
                    </button>
                    <div class="contenidoBarrio">
                        ${solaresBarrio.map(solar => crearFichaSolar(solar)).join("")}
                    </div>
                </div>`;
            }).join("");

            return `
            <div class="grupoMundo">
                <button class="tituloMundo">
                    <span class="nombreMundoConIcono">
                        ${iconoMundoHTML}${fallbackMundo}
                        <span class="nombreMundo">${mundo}</span>
                    </span>
                    <span class="ladoDerechoMundo">
                        <span class="contadorMundo">${solaresMundo.length}</span>
                        <span class="flechaMundo">▼</span>
                    </span>
                </button>
                <div class="contenidoMundo">
                    ${barriosHTML}
                </div>
            </div>
            `;
        }).join("");
    };

    zona.innerHTML = `
        <div class="seccionJuegoBase" style="margin-bottom: 25px;">
            <h3 style="text-align: center; margin-bottom: 15px;">Juego Base</h3>
            <div class="contenedorMundosBase">
                ${renderGrupoMundos(mundosJuegoBase)}
            </div>
        </div>
        
        <div class="seccionColumnasPacks" style="display: flex; gap: 20px; flex-wrap: wrap;">
            <div class="columnaExpansion" style="flex: 1; min-width: 250px;">
                <h3 style="text-align: center; margin-bottom: 15px;">Expansión</h3>
                ${renderGrupoMundos(mundosExpansion)}
            </div>
            <div class="columnaContenido" style="flex: 1; min-width: 250px;">
                <h3 style="text-align: center; margin-bottom: 15px;">Contenido</h3>
                ${renderGrupoMundos(mundosContenido)}
            </div>
        </div>
    `;

    // Listeners acordeón de mundos
    document
        .querySelectorAll("#listaCompletaSolares .tituloMundo")
        .forEach((boton, idx) => {
            boton.addEventListener("click", () => {
                boton.classList.toggle("abierto");
                boton.nextElementSibling.classList.toggle("abierto");

                if (!window.esSincronizacionOBS && typeof window.emitirEventoOBS === "function") {
                    window.emitirEventoOBS("SYNC_ACCION", {
                        accion: "LISTADO_ACORDEON_TOGGLE",
                        payload: { tipo: "mundo", idx, abierto: boton.classList.contains("abierto") }
                    });
                }
            });
        });

    // Listeners acordeón de barrios
    document
        .querySelectorAll("#listaCompletaSolares .tituloBarrio")
        .forEach((boton, idx) => {
            boton.addEventListener("click", () => {
                boton.classList.toggle("abierto");
                boton.nextElementSibling.classList.toggle("abierto");

                if (!window.esSincronizacionOBS && typeof window.emitirEventoOBS === "function") {
                    window.emitirEventoOBS("SYNC_ACCION", {
                        accion: "LISTADO_ACORDEON_TOGGLE",
                        payload: { tipo: "barrio", idx, abierto: boton.classList.contains("abierto") }
                    });
                }
            });
        });

}

// Re-vincular solo los listeners de acordeón en OBS tras recibir el HTML del listado
// (el HTML llega correcto, los addEventListener deben recrearse porque no se serializan)
function vincularListenersListado() {
    document
        .querySelectorAll("#listaCompletaSolares .tituloMundo")
        .forEach((boton, idx) => {
            const nuevoBoton = boton.cloneNode(true);
            boton.parentNode.replaceChild(nuevoBoton, boton);
            nuevoBoton.addEventListener("click", () => {
                nuevoBoton.classList.toggle("abierto");
                nuevoBoton.nextElementSibling.classList.toggle("abierto");
            });
        });

    document
        .querySelectorAll("#listaCompletaSolares .tituloBarrio")
        .forEach((boton, idx) => {
            const nuevoBoton = boton.cloneNode(true);
            boton.parentNode.replaceChild(nuevoBoton, boton);
            nuevoBoton.addEventListener("click", () => {
                nuevoBoton.classList.toggle("abierto");
                nuevoBoton.nextElementSibling.classList.toggle("abierto");
            });
        });
}

window.mostrarResultados = mostrarResultados;
window.mostrarListadoCompleto = mostrarListadoCompleto;
window.vincularListenersListado = vincularListenersListado;
