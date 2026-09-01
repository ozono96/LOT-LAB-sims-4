function abrirFichaSolar(idSolar){
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