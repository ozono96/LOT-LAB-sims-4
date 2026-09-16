function mostrarSolares(listaSolares) {

    const zona = document.getElementById("listaResultados");

    if (!zona) {
        return;
    }

    if (!Array.isArray(listaSolares) || listaSolares.length === 0) {
        zona.innerHTML = "";
        return;
    }

    zona.innerHTML = listaSolares.map(solar => crearFichaSolar(solar)).join("");

}

function activarHoverTarjetaSolar(tarjeta, event, idSolar) {
    if (tarjeta) {
        const img = tarjeta.querySelector(".tarjetaSolarFoto");
        if (img && !img.getAttribute("src")) {
            if (typeof obtenerUltimaFotoSolarSync === "function") {
                const fSync = obtenerUltimaFotoSolarSync(idSolar);
                if (fSync) img.src = fSync;
            }
            if (!img.getAttribute("src") && typeof obtenerUltimaFotoSolar === "function") {
                obtenerUltimaFotoSolar(idSolar).then(fAsync => {
                    if (fAsync && img) img.src = fAsync;
                });
            }
        }
    }
    if (typeof mostrarResumenSolar === "function") {
        mostrarResumenSolar(event, idSolar);
    }
    if (!window.esSincronizacionOBS && typeof window.emitirEventoOBS === "function") {
        const srcFoto = tarjeta?.querySelector(".tarjetaSolarFoto")?.getAttribute("src") || null;
        window.emitirEventoOBS("SYNC_ACCION", {
            accion: "SOLAR_HOVER",
            payload: { idSolar: idSolar ? String(idSolar) : null, srcFoto }
        });
    }
}
window.activarHoverTarjetaSolar = activarHoverTarjetaSolar;

function desactivarHoverTarjetaSolar() {
    if (typeof ocultarResumenSolar === "function") {
        ocultarResumenSolar();
    }
    if (!window.esSincronizacionOBS && typeof window.emitirEventoOBS === "function") {
        window.emitirEventoOBS("SYNC_ACCION", {
            accion: "SOLAR_HOVER",
            payload: { idSolar: null }
        });
    }
}
window.desactivarHoverTarjetaSolar = desactivarHoverTarjetaSolar;

function actualizarHoverSolarObs(payload) {
    const idSolar = (payload && payload.idSolar) ? String(payload.idSolar) : null;
    const srcFoto = payload ? payload.srcFoto : null;

    // Desactivar cualquier tarjeta activa previa
    document.querySelectorAll(".tarjetaSolar.tarjetaSolarActiva").forEach(tarjeta => {
        if (!idSolar || tarjeta.getAttribute("data-solar-id") !== idSolar) {
            tarjeta.classList.remove("tarjetaSolarActiva");
        }
    });

    if (!idSolar) return;

    // Activar tarjeta(s) con data-solar-id coincidente
    const tarjetas = document.querySelectorAll(`.tarjetaSolar[data-solar-id="${idSolar}"]`);
    tarjetas.forEach(tarjeta => {
        const img = tarjeta.querySelector(".tarjetaSolarFoto");
        if (img) {
            if (!img.getAttribute("src") || img.getAttribute("src") === "") {
                if (srcFoto) {
                    img.src = srcFoto;
                } else if (typeof obtenerUltimaFotoSolarSync === "function") {
                    const fSync = obtenerUltimaFotoSolarSync(idSolar);
                    if (fSync) img.src = fSync;
                }
                if (!img.getAttribute("src") && typeof obtenerUltimaFotoSolar === "function") {
                    obtenerUltimaFotoSolar(idSolar).then(fAsync => {
                        if (fAsync && img) img.src = fAsync;
                    });
                }
            }
        }
        tarjeta.classList.add("tarjetaSolarActiva");
    });
}
window.actualizarHoverSolarObs = actualizarHoverSolarObs;

if (typeof document !== "undefined") {
    document.addEventListener("mouseleave", () => {
        if (!window.esSincronizacionOBS && typeof window.emitirEventoOBS === "function") {
            window.emitirEventoOBS("SYNC_ACCION", {
                accion: "SOLAR_HOVER",
                payload: { idSolar: null }
            });
        }
    });
}

function activarTouchTarjetaSolar(tarjeta, event, idSolar) {
    if (tarjeta) tarjeta.classList.add("tarjetaSolarActiva");
    activarHoverTarjetaSolar(tarjeta, event, idSolar);
}
window.activarTouchTarjetaSolar = activarTouchTarjetaSolar;

function desactivarTouchTarjetaSolar(tarjeta) {
    if (tarjeta) tarjeta.classList.remove("tarjetaSolarActiva");
    desactivarHoverTarjetaSolar();
}
window.desactivarTouchTarjetaSolar = desactivarTouchTarjetaSolar;

function manejarErrorFoto(img) {
    if (!img) return;
    img.style.display = "none";
}
window.manejarErrorFoto = manejarErrorFoto;
window.manejarErrorFotoHover = manejarErrorFoto; // compatibilidad

// Cuando el manifest termine de precargarse, rellenar fotos de tarjetas existentes que estuvieran pendientes
document.addEventListener("datosCargados", function () {
    if (typeof cargarManifestSolares === "function") {
        cargarManifestSolares().then(() => {
            document.querySelectorAll(".tarjetaSolar").forEach(tarjeta => {
                const id = tarjeta.dataset.solarId;
                const img = tarjeta.querySelector(".tarjetaSolarFoto");
                if (id && img && !img.getAttribute("src") && typeof obtenerUltimaFotoSolarSync === "function") {
                    const f = obtenerUltimaFotoSolarSync(id);
                    if (f) img.src = f;
                }
            });
        });
    }
}, { once: true });

function crearFichaSolar(solar) {

    if (!solar) return "";

    const esBase = (solar.nombrePack || "").trim().toLowerCase() === "sims 4" || (solar.nombrePack || "").trim().toLowerCase() === "juego base";
    const packKey = esBase ? "sims 4" : (solar.nombrePack || "");
    const rutaPack = typeof rutaIconoPack === "function" ? (rutaIconoPack(packKey) || rutaIconoPack("sims 4")) : null;
    const tooltipPack = "Pack: " + (esBase ? "Sims 4" : (solar.nombrePack || ""));

    const rutaMundo = typeof rutaIconoMundo === "function" ? rutaIconoMundo(solar.mundo) : null;
    const tooltipMundo = "Mundo: " + (solar.mundo || "");

    const rutaTipo = typeof rutaIconoTipoSolar === "function" ? rutaIconoTipoSolar(solar.tipoSolar) : null;
    const tooltipTipo = solar.tipoSolar || "";

    const ultimaFoto = typeof obtenerUltimaFotoSolarSync === "function" ? obtenerUltimaFotoSolarSync(solar.id) : null;

    // Reposo: Icono Mundo (principal en centro)
    const mundoReposoHtml = rutaMundo
        ? `<img class="tarjetaSolarMundoImg" src="${rutaMundo}" alt="${solar.mundo || ''}" loading="lazy" decoding="async" onerror="this.style.display='none';this.nextElementSibling.style.display='inline'">
           <span class="tarjetaSolarMundoFallback" style="display:none;">🌎</span>`
        : `<span class="tarjetaSolarMundoFallback">🌎</span>`;

    // Reposo: Icono Pack superpuesto (abajo izquierda)
    const packReposoHtml = rutaPack
        ? `<img src="${rutaPack}" alt="${tooltipPack}" class="iconoPackMini" onerror="this.style.display='none';this.nextElementSibling.style.display='inline'">
           <span class="iconoPackMini fallback" style="display:none;">${esBase ? "🎮" : "📦"}</span>`
        : `<span class="iconoPackMini fallback">${esBase ? "🎮" : "📦"}</span>`;

    // Reposo: Icono Tipo de Solar (abajo derecha) - tamaño fijo 25px
    const tipoReposoHtml = rutaTipo
        ? `<img src="${rutaTipo}" alt="${tooltipTipo}" class="tarjetaSolarTipoIcono" loading="lazy" decoding="async" onerror="this.style.display='none';this.nextElementSibling.style.display='inline'">
           <span class="tarjetaSolarTipoFallback" style="display:none;">🏡</span>`
        : `<span class="tarjetaSolarTipoFallback">🏡</span>`;

    // Hover sobre la foto: Mini iconos mundo y pack en columna abajo izq
    const miniMundoHtml = rutaMundo
        ? `<img src="${rutaMundo}" class="tarjetaSolarFotoMiniIcono miniMundo" alt="${tooltipMundo}" title="${tooltipMundo}">`
        : `<span class="tarjetaSolarFotoMiniFallback" title="${tooltipMundo}">🌎</span>`;

    const miniPackHtml = rutaPack
        ? `<img src="${rutaPack}" class="tarjetaSolarFotoMiniIcono miniPack" alt="${tooltipPack}" title="${tooltipPack}">`
        : `<span class="tarjetaSolarFotoMiniFallback" title="${tooltipPack}">${esBase ? "🎮" : "📦"}</span>`;

    // Hover sobre la foto: Mini icono tipo solar abajo der - tamaño fijo 25px idéntico a reposo
    const miniTipoHtml = rutaTipo
        ? `<img src="${rutaTipo}" class="tarjetaSolarFotoMiniIcono tarjetaSolarTipoIcono miniTipo" alt="${tooltipTipo}" title="${tooltipTipo}">`
        : `<span class="tarjetaSolarFotoMiniFallback" title="${tooltipTipo}">🏡</span>`;

    return `
    <div
        class="tarjetaSolar"
        data-solar-id="${solar.id}"
        onclick="abrirFichaSolar('${solar.id}')"
        onmouseenter="activarHoverTarjetaSolar(this,event,'${solar.id}')"
        onmouseleave="desactivarHoverTarjetaSolar(this)"
        ontouchstart="activarTouchTarjetaSolar(this,event,'${solar.id}')"
        ontouchend="desactivarTouchTarjetaSolar(this)"
        ontouchcancel="desactivarTouchTarjetaSolar(this)"
    >
        <div class="iconoTarjetaSolar">
            <!-- Foto de fondo: siempre presente (muy desenfocada en reposo, nítida en hover) -->
            <img
                class="tarjetaSolarFoto"
                ${ultimaFoto ? `src="${ultimaFoto}"` : ""}
                alt="${solar.nombre}"
                loading="lazy"
                decoding="async"
                onerror="manejarErrorFoto(this)"
            >

            <!-- Capa de Reposo: Mundo en centro, Pack abajo izq, Tipo abajo der -->
            <div class="tarjetaSolarCapaReposo">
                <div class="tarjetaSolarMundoCenter">
                    ${mundoReposoHtml}
                </div>
                <div class="tarjetaSolarPackBadge" data-tooltip="${tooltipPack}" title="${tooltipPack}">
                    ${packReposoHtml}
                </div>
                <div class="tarjetaSolarTipoBadge" data-tooltip="${tooltipTipo}" title="${tooltipTipo}">
                    ${tipoReposoHtml}
                </div>
            </div>

            <!-- Capa de Hover / Pulsación: Iconos sobre la foto nítida -->
            <div class="tarjetaSolarCapaHover">
                <div class="tarjetaSolarFotoStackIzq">
                    ${miniMundoHtml}
                    ${miniPackHtml}
                </div>
                <div class="tarjetaSolarFotoDer">
                    ${miniTipoHtml}
                </div>
            </div>
        </div>

        <div class="nombreTarjetaSolar">
            <span>${solar.nombre}</span>
        </div>
    </div>
    `;

}