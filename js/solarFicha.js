// ─── NORMALIZACIÓN Y RESOLUCIÓN DE SLUGS PARA FICHAS DE SOLARES ────────
function normalizarSlug(texto) {
    if (!texto) return "";
    return texto
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function obtenerSlugSolar(solar) {
    if (!solar) return "";
    const slugBase = normalizarSlug(solar.nombre);
    if (!slugBase) return "";

    if (typeof database !== "undefined" && Array.isArray(database.solares)) {
        const duplicados = database.solares.filter(
            s => s.id !== solar.id && normalizarSlug(s.nombre) === slugBase
        );
        if (duplicados.length > 0) {
            const slugMundo = normalizarSlug(solar.mundo);
            if (slugMundo) {
                return `${slugBase}-${slugMundo}`;
            }
            return `${slugBase}-${normalizarSlug(solar.id)}`;
        }
    }
    return slugBase;
}

function buscarSolarPorSlug(slugBuscado) {
    if (!slugBuscado || typeof database === "undefined" || !Array.isArray(database.solares)) return null;
    const slugNorm = normalizarSlug(slugBuscado);
    if (!slugNorm) return null;

    // 1. Coincidencia exacta con el slug identificador generado
    let encontrado = database.solares.find(s => obtenerSlugSolar(s) === slugNorm);
    if (encontrado) return encontrado;

    // 2. Coincidencia con slug(nombre) + "-" + slug(mundo)
    encontrado = database.solares.find(s => `${normalizarSlug(s.nombre)}-${normalizarSlug(s.mundo)}` === slugNorm);
    if (encontrado) return encontrado;

    // 3. Coincidencia con slug(nombre) + "-" + slug(id)
    encontrado = database.solares.find(s => `${normalizarSlug(s.nombre)}-${normalizarSlug(s.id)}` === slugNorm);
    if (encontrado) return encontrado;

    // 4. Coincidencia básica por slug del nombre
    encontrado = database.solares.find(s => normalizarSlug(s.nombre) === slugNorm);
    if (encontrado) return encontrado;

    return null;
}

window.normalizarSlug = normalizarSlug;
window.obtenerSlugSolar = obtenerSlugSolar;
window.buscarSolarPorSlug = buscarSolarPorSlug;

function abrirFichaSolar(idSolar){
    ocultarResumenSolar();

    if (!database || !database.solares || database.solares.length === 0) {
        document.addEventListener("datosCargados", () => abrirFichaSolar(idSolar), { once: true });
        return;
    }

    const solar = database.solares.find(
        solar => solar.id == idSolar
    );

    if(!solar){
        return;
    }

    window.solarFichaActual = solar;

    const rutaPack = typeof rutaIconoPack === "function" ? rutaIconoPack(solar.nombrePack) : null;
    const rutaMundo = typeof rutaIconoMundo === "function" ? rutaIconoMundo(solar.mundo) : null;
    const rutaTipoSolar = typeof rutaIconoTipoSolar === "function" ? rutaIconoTipoSolar(solar.tipoSolar) : null;

    function bloqueConIcono(ruta, fallbackEmoji, etiqueta, valor, claseImgExtra = "") {
        const iconoHtml = ruta
            ? `
                <img src="${ruta}" alt="${etiqueta}" class="fichaSolarIcono ${claseImgExtra.trim()}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                <span class="fichaSolarIconoFallback" style="display:none;">${fallbackEmoji}</span>
              `
            : `<span class="fichaSolarIconoFallback">${fallbackEmoji}</span>`;

        return `
            <div class="fichaSolarItem fichaSolarItemConIcono">
                <div class="fichaSolarIconoWrap">${iconoHtml}</div>
                <div class="fichaSolarTexto">${fallbackEmoji} <strong>${etiqueta}:</strong> ${valor}</div>
            </div>
        `;
    }

    // Icono de barrio: foto real en img/barrios/{barrio}/foto.*
    // (carpeta plana: img/barrios/ contiene una carpeta por cada barrio, con la foto dentro)
    // Reutiliza EXTENSIONES_FOTO_BARRIO / manejarErrorImagenBarrio definidos en sheets.js
    function bloqueBarrioConIcono(barrio) {
        const hayDatos = barrio && typeof EXTENSIONES_FOTO_BARRIO !== "undefined";
        const rutaBase = hayDatos ? `img/barrios/${barrio.trim()}/foto` : null;

        const iconoHtml = rutaBase
            ? `
                <img src="${rutaBase}.${EXTENSIONES_FOTO_BARRIO[0]}" data-ruta-base="${rutaBase}" data-intento="0"
                    alt="Barrio" class="fichaSolarIcono fichaSolarIconoBarrio" onerror="manejarErrorImagenBarrio(this)">
                <span class="fichaSolarIconoFallback" style="display:none;">🏘️</span>
              `
            : `<span class="fichaSolarIconoFallback">🏘️</span>`;

        return `
            <div class="fichaSolarItem fichaSolarItemConIcono">
                <div class="fichaSolarIconoWrap fichaSolarIconoWrapBarrio">${iconoHtml}</div>
                <div class="fichaSolarTexto">🏘️ <strong>Barrio:</strong> ${barrio}</div>
            </div>
        `;
    }

    function bloqueSimple(emoji, etiqueta, valor) {
        return `
            <div class="fichaSolarItem">
                <div class="fichaSolarTexto">${emoji} <strong>${etiqueta}:</strong> ${valor}</div>
            </div>
        `;
    }

    document.getElementById(
        "contenidoFichaSolar"
    ).innerHTML = `

        <h3>
            ${solar.nombre}
        </h3>

        <div class="fichaSolarInfoGrid">

            <div class="fichaSolarColumna fichaSolarColumnaIzquierda">
                ${bloqueConIcono(rutaPack, "📦", "Pack", solar.nombrePack)}
                ${bloqueConIcono(rutaMundo, "🌎", "Mundo", solar.mundo)}
                ${bloqueBarrioConIcono(solar.barrio)}
            </div>

            <div class="fichaSolarColumna fichaSolarColumnaDerecha">
                ${bloqueConIcono(rutaTipoSolar, "🏡", "Tipo de solar", solar.tipoSolar, "fichaSolarIconoTipoSolar")}
                ${bloqueSimple("🏠", "Tipo de lote", solar.tipoLote)}
                ${bloqueSimple("📐", "Tamaño", solar.tamaño)}
                ${bloqueSimple("🧭", "Orientación", solar.orientacion)}
                ${bloqueSimple("🚶", "Acera", solar.acera)}
            </div>

        </div>

        <div id="galeriaFichaSolar" class="galeriaFichaSolarWrapper"></div>

    `;


    // Guardar la ventana de origen ANTES de que abrirVentana la sobreescriba en ventanaAnterior
    const ventanaOrigen = window.ventanaActual || null;
    window.ventanaOrigenFicha = ventanaOrigen;

    abrirVentana(
        "ventanaFichaSolar"
    );

    const slugSolar = typeof obtenerSlugSolar === "function" ? obtenerSlugSolar(solar) : "";
    if (slugSolar && typeof actualizarHashURL === "function") {
        actualizarHashURL("ficha-solar/" + slugSolar);
    }

    if (typeof window.emitirEventoOBS === 'function' && !window.esSincronizacionOBS) {
        window.emitirEventoOBS("SYNC_FICHA_SOLAR", {
            abierta: true,
            idSolar: idSolar,
            ventanaOrigen: ventanaOrigen
        });
    }

    if (typeof cargarGaleriaSolar === "function") {
        cargarGaleriaSolar(solar.id);
    }

}

function mostrarResumenSolar(event,idSolar){


    const solar = database.solares.find(
        solar => solar.id == idSolar
    );


    if(!solar){
        return;
    }


    const tooltip =
    document.getElementById("tooltipSolar");


    if(!tooltip){
        return;
    }


    tooltip.innerHTML = `

        <strong>${solar.nombre}</strong>

        <br><br>

        📦 ${solar.nombrePack}

        <br>

        🌎 ${solar.mundo}

        <br>

        🏘️ ${solar.barrio}

        <br>

        🏠 ${solar.tipoSolar}

        <br>

        📐 ${solar.tamaño}

    `;

    // Soporta tanto ratón (event normal) como tacto (event.touches)
    const punto = event && event.touches ? event.touches[0] : event;

    if (punto) {
        tooltip.style.left = (punto.clientX + 18) + "px";
        tooltip.style.top = (punto.clientY + 18) + "px";
    }

    tooltip.style.display="block";


}

document.addEventListener("mousemove",(e)=>{


    const tooltip =
    document.getElementById("tooltipSolar");


    if(
        tooltip &&
        tooltip.style.display==="block"
    ){


        tooltip.style.left =
        (e.clientX + 18) + "px";


        tooltip.style.top =
        (e.clientY + 18) + "px";


    }


});



function ocultarResumenSolar(){


    const tooltip =
    document.getElementById("tooltipSolar");


    if(tooltip){

        tooltip.style.display="none";

    }

}

window.ocultarResumenSolar = ocultarResumenSolar;

// En pantallas táctiles, ocultar tooltip al tocar fuera o al hacer scroll
document.addEventListener("touchstart", (e) => {
    if (!e.target || typeof e.target.closest !== "function" || !e.target.closest(".tarjetaSolar")) {
        ocultarResumenSolar();
    }
}, { passive: true });

document.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch" || e.pointerType === "pen") {
        if (!e.target || typeof e.target.closest !== "function" || !e.target.closest(".tarjetaSolar")) {
            ocultarResumenSolar();
        }
    }
}, { passive: true });

document.addEventListener("scroll", () => {
    ocultarResumenSolar();
}, { passive: true });