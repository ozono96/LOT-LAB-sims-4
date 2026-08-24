/* =========================================================
   RETO RESULTADO UI
   Renderizado del resultado final del reto con soporte de rerolls.
   ========================================================= */

function renderizarResultadoReto(reto) {
    const contenedor = document.getElementById("contenidoRetoResultado");
    if (!contenedor) return;

    let html = "";

    // 1. Dificultad y Cabecera
    const difVal = typeof reto.dificultad === "number" ? reto.dificultad : 0;
    let difHTML = "";

    if (difVal > 0) {
        difHTML = `<span style="color: #f39c12;">${"⭐".repeat(difVal)}</span> (${difVal} pts)`;
    } else if (difVal === 0) {
        difHTML = `<span style="color: var(--color-texto); opacity: 0.85;">⚪ (0 pts)</span>`;
    } else {
        const absVal = Math.abs(difVal);
        difHTML = `<span style="color: var(--color-exito, #2ecc71);">${"🟢".repeat(absVal)}</span> (${difVal} pts)`;
    }

    const tipoTexto = reto.tipo === "con-solar" ? "🏡 Reto Con Solar" : "🏗️ Reto Sin Solar";

    html += `
        <div class="cabeceraResultadoReto" style="text-align: center; margin-bottom: 25px;">
            <div class="badgeTipoReto">${tipoTexto}</div>
            <div class="dificultadReto" style="font-size: 1.4rem; font-weight: bold; margin-top: 10px;">
                Dificultad: ${difHTML}
            </div>
            ${reto.dificultadExtra > 0 ? `
                <div class="dificultadExtraReto" style="font-size: 1.2rem; font-weight: bold; margin-top: 6px;">
                    Dificultad Extra: <span style="color: #e74c3c;">${"🔥".repeat(reto.dificultadExtra)}</span> (${reto.dificultadExtra} pts)
                </div>
            ` : ""}
        </div>
    `;

    // 2. Solar asignado (si aplica)
    if (reto.tipo === "con-solar") {
        const rerollsSolarLeft = typeof reto.rerollsSolar === "number" ? reto.rerollsSolar : 3;
        const disabledSolar = rerollsSolarLeft <= 0 ? "disabled" : "";
        const btnSolarClass = rerollsSolarLeft <= 0 ? "btnReroll deshabilitado" : "btnReroll";

        const solarHtml = reto.solar
            ? (typeof crearFichaSolar === "function" ? crearFichaSolar(reto.solar) : `
                <div class="fichaSolar">
                    <strong>${reto.solar.nombre}</strong><br>
                    📦 ${reto.solar.nombrePack} | 🌎 ${reto.solar.mundo} | 📐 ${reto.solar.tamaño}
                </div>`)
            : `<p style="color: var(--color-error);">No se encontró ningún solar en los packs seleccionados.</p>`;

        html += `
            <div class="seccionSolarReto" style="margin-bottom: 30px;">
                <h3 style="text-align: center; margin-bottom: 12px;">🏡 Solar Seleccionado</h3>
                <div style="position: relative; display: flex; align-items: center; justify-content: center; min-height: 60px; max-width: 650px; margin: 0 auto; padding: 0 20px;">
                    <div style="display: flex; justify-content: center; align-items: center; width: 100%;">
                        ${solarHtml}
                    </div>
                    <button
                        class="${btnSolarClass}"
                        onclick="rerollSolar()"
                        ${disabledSolar}
                        data-tooltip=" ¡RECUERDA! Solo tienes 3 intentos para regenerar el solar."
                        style="position: absolute; right: 20px; display: flex; align-items: center; gap: 6px; padding: 8px 14px; font-size: 0.95rem; flex-shrink: 0;"
                    >
                        🔄 (${rerollsSolarLeft}/3)
                    </button>
                </div>
            </div>
        `;
    }




    // 3. Tarjetas de Categorías Activas
    html += `<div class="listaCategoriasReto" style="display: flex; flex-direction: column; gap: 15px; max-width: 650px; margin: 0 auto;">`;

    Object.keys(reto.categorias).forEach(catId => {
        const cat = reto.categorias[catId];
        const rerollsLeft = cat.rerollsRestantes;
        const disabled = rerollsLeft <= 0 ? "disabled" : "";
        const btnClass = rerollsLeft <= 0 ? "btnReroll deshabilitado" : "btnReroll";

        let textoHtml = `<div style="font-size: 1.05rem; margin-top: 4px;">${cat.resultado.texto}</div>`;
        if (catId === "colores") {
            textoHtml = "";
        } else if (cat.resultado.dificultadDelta !== undefined) {
            const colorStatus = cat.resultado.permitido ? "var(--color-exito, #2ecc71)" : "var(--color-error, #e74c3c)";
            textoHtml = `<div style="font-size: 1.05rem; margin-top: 4px; font-weight: bold; color: ${colorStatus};">${cat.resultado.texto}</div>`;
        }

        let detalleExtra = "";

        // Si es categoría colores y tiene muestras hex
        if (catId === "colores" && cat.resultado.elementos && cat.resultado.elementos.length > 0) {
            detalleExtra += `<div class="muestrasColores" style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 10px; align-items: center;">`;
            cat.resultado.elementos.forEach(c => {
                detalleExtra += `
                    <span class="chipColor" title="${c.nombre}" data-tooltip="${c.nombre}" style="width: 34px; height: 34px; border-radius: 50%; background: ${c.hex}; border: 2px solid rgba(255,255,255,0.8); display: inline-block; box-shadow: var(--sombra-suave); cursor: pointer; transition: transform 0.2s;" onmouseenter="this.style.transform='scale(1.15)'" onmouseleave="this.style.transform='scale(1)'"></span>
                `;
            });
            detalleExtra += `</div>`;
        }

        // Si es categoría habilidades y tiene lista de habilidades
        if (catId === "habilidades" && cat.resultado.elementos && cat.resultado.elementos.length > 0) {
            textoHtml = "";
            detalleExtra += `<div class="habResultadoGrid" style="margin-top: 12px; gap: 12px; justify-content: flex-start;">`;
            cat.resultado.elementos.forEach(fila => {
                const nombre = (fila[0] || "").trim();
                const packReq = (fila[1] || "").trim();
                const id = (fila[2] || "").trim();
                const esBase = !packReq || packReq.toLowerCase() === "base" || packReq.toLowerCase() === "juego base";
                const nombrePackNormalizado = esBase ? "Juego Base" : packReq;
                const imgSrc = id ? "img/Habilidades/" + id + ".png" : "";
                const rutaIcono = typeof rutaIconoPack === "function" ? rutaIconoPack(nombrePackNormalizado) : null;

                let packBadgeHTML = "";
                if (rutaIcono) {
                    packBadgeHTML = `<div class="habResultadoCardPack ${esBase ? "habResultadoCardPackBase" : ""}">
                        <img src="${rutaIcono}" alt="${nombrePackNormalizado}" class="iconoPackMini" style="width:16px;height:16px;object-fit:contain;vertical-align:middle;margin-right:3px;" onerror="this.style.display='none'">
                        <span>${nombrePackNormalizado}</span>
                    </div>`;
                } else {
                    packBadgeHTML = `<div class="habResultadoCardPack ${esBase ? "habResultadoCardPackBase" : ""}">
                        ${esBase ? "🎮 Juego Base" : "📦 " + packReq}
                    </div>`;
                }

                detalleExtra += `
                    <div class="habResultadoCard" style="width: 130px; padding: 12px 8px; opacity: 1; transform: none; animation: none;">
                        <div class="habResultadoCardImg" style="width: 48px; height: 48px;">
                            ${imgSrc ? `<img src="${imgSrc}" alt="${nombre}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` : ""}
                            <div class="habResultadoCardFallback" style="${imgSrc ? 'display:none' : 'display:flex'}; font-size: 1.8rem;">🧠</div>
                        </div>
                        <div class="habResultadoCardNombre" style="font-size: 0.88rem;">${nombre}</div>
                        ${packBadgeHTML}
                    </div>
                `;
            });
            detalleExtra += `</div>`;
        }

        // Si es categoría límite de packs y tiene lista de packs permitidos → mostrar iconos
        if (catId === "limitePacks" && cat.resultado.packsPermitidos && cat.resultado.packsPermitidos.length > 0) {
            detalleExtra += `<div class="tiraIconosPacks">${htmlIconosPacks(cat.resultado.packsPermitidos)}</div>`;
        }

        // Si es la categoría de tipo de solar y ha salido residencial, mostrar la
        // composición por etapas de vida de la vivienda (icono + cantidad de cada una)
        if (catId === "objetivo" && cat.resultado.tipo === "residencial" && cat.resultado.composicion && cat.resultado.composicion.length > 0 && typeof htmlComposicionVivienda === "function") {
            detalleExtra += `
                <div style="margin-top: 10px; font-weight: bold; font-size: 0.95rem; opacity: 0.85;">
                    👪 Etapas de vida de la vivienda:
                </div>
                ${htmlComposicionVivienda(cat.resultado.composicion)}
            `;
        }

        // Limitantes extra (Construir / Comprar): lista con foto o texto (sin 🔥 aquí,
        // la Dificultad Extra ya se muestra arriba, junto a la dificultad normal)
        if ((catId === "limitanteConstruir" || catId === "limitanteComprar") && cat.resultado.elementos && cat.resultado.elementos.length > 0) {
            detalleExtra += typeof htmlListaLimitantes === "function" ? htmlListaLimitantes(cat.resultado.elementos) : "";
        }

        html += `
            <div class="tarjetaCategoriaReto" style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.15); border: 1px solid var(--borde); padding: 15px 20px; border-radius: var(--radio-normal); flex-wrap: wrap; gap: 10px;">
                <div class="infoCategoria" style="flex: 1; min-width: 200px;">
                    <div style="font-weight: bold; font-size: 1.1rem; color: var(--color-titulo);">${cat.modulo.titulo}</div>
                    ${textoHtml}
                    ${detalleExtra}
                </div>
                <button
                    class="${btnClass}"
                    onclick="rerollCategoria('${catId}')"
                    ${disabled}
                    data-tooltip=" ¡RECUERDA! Solo tienes 3 intentos para regenerar cada limitante del reto."
                    style="display: flex; align-items: center; gap: 6px; padding: 8px 14px; font-size: 0.95rem;"
                >
                    🔄 (${rerollsLeft}/3)
                </button>
            </div>
        `;
    });

    html += `</div>`;

    contenedor.innerHTML = html;

    // Preservar texto del botón si el temporizador está acoplado
    const btnToggle = document.getElementById("toggleTemporizadorRetoBtn");
    if (btnToggle && document.getElementById("app")?.classList.contains("modo-paralelo")) {
        btnToggle.innerHTML = "⏱️ Cerrar temporizador";
    }

    // Ajustar escalado en OBS después de que el DOM se haya pintado (doble rAF
    // para que los iconos de pack e imágenes no distorsionen la medición)
    if (document.body.classList.contains("modo-obs")) {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (typeof ajustarEscalaRetoOBS === "function") ajustarEscalaRetoOBS();
            });
        });
    }

    // ── Tooltip de los botones de reroll ──
    const tooltip = document.getElementById("tooltipOpciones");
    if (tooltip) {
        contenedor.querySelectorAll(".btnReroll").forEach(boton => {
            boton.addEventListener("mouseenter", function () {
                tooltip.textContent = this.getAttribute("data-tooltip");
                tooltip.style.display = "block";
            });
            boton.addEventListener("mousemove", function (e) {
                tooltip.style.left = e.clientX + "px";
                tooltip.style.top = (e.clientY - 10) + "px";
            });
            boton.addEventListener("mouseleave", function () {
                tooltip.style.display = "none";
            });

            // Versión táctil: el tooltip solo se muestra mientras se mantiene pulsado
            boton.addEventListener("touchstart", function (e) {
                tooltip.textContent = this.getAttribute("data-tooltip");
                const touch = e.touches[0];
                tooltip.style.left = touch.clientX + "px";
                tooltip.style.top = (touch.clientY - 10) + "px";
                tooltip.style.display = "block";
            }, { passive: true });
            boton.addEventListener("touchend", function () {
                tooltip.style.display = "none";
            }, { passive: true });
            boton.addEventListener("touchcancel", function () {
                tooltip.style.display = "none";
            }, { passive: true });
        });
    }
}

// ─── Escalado proporcional de ventanaRetoResultado en modo OBS ─────────────
// Escala fija almacenada. Se calcula una sola vez al generar el reto o al redimensionar viewport.
let escalaFijaOBS = 1;

function calcularEscalaRetoOBS() {
    if (!document.body.classList.contains("modo-obs")) return;

    const ventana = document.getElementById("ventanaRetoResultado");
    if (!ventana) return;

    const estaVisible = ventana.style.display !== "none" && getComputedStyle(ventana).display !== "none";
    if (!estaVisible) {
        requestAnimationFrame(() => {
            if (ventana.style.display !== "none" && getComputedStyle(ventana).display !== "none") {
                calcularEscalaRetoOBS();
            }
        });
        return;
    }

    // scrollHeight y scrollWidth devuelven las dimensiones naturales del layout sin transformar
    const alturaContenido = ventana.scrollHeight || ventana.offsetHeight || 700;
    const anchuraContenido = ventana.scrollWidth || ventana.offsetWidth || 680;
    const alturaViewport = window.innerHeight;
    const anchuraViewport = window.innerWidth;

    if (alturaContenido <= 0 || anchuraContenido <= 0) return;

    // Margen de seguridad en píxeles (arriba/abajo y lados)
    const margenV = 24;
    const margenH = 24;

    const escalaAltura = (alturaViewport - margenV * 2) / alturaContenido;
    const escalaAnchura = (anchuraViewport - margenH * 2) / anchuraContenido;

    // Escalar solo hacia abajo si el contenido supera el espacio disponible (nunca agrandar por encima de 1)
    escalaFijaOBS = Math.min(escalaAltura, escalaAnchura, 1);
    if (escalaFijaOBS <= 0 || isNaN(escalaFijaOBS)) escalaFijaOBS = 1;

    aplicarEscalaOBS();
}

function aplicarEscalaOBS() {
    if (!document.body.classList.contains("modo-obs")) return;

    const ventana = document.getElementById("ventanaRetoResultado");
    const ventanaTemp = document.getElementById("ventanaTemporizador");
    const composicion = document.getElementById("composicionRetoTemporizador");

    // 1. Establecer la variable CSS en body y composicion para que las reglas de wrapper y margin-left se calculen de forma nativa en CSS
    document.body.style.setProperty("--escala-obs", escalaFijaOBS);
    if (composicion) {
        composicion.style.setProperty("--escala-obs", escalaFijaOBS);
        composicion.style.gap = "0px";
        composicion.style.transform = "";
    }

    // 2. El Reto Generado recibe SIEMPRE su escala fija almacenada
    if (ventana) {
        ventana.style.transform = `scale(${escalaFijaOBS})`;
        ventana.style.transformOrigin = "top left";
    }

    // 3. El Temporizador acoplado recibe exactamente la MISMA escala fija
    if (ventanaTemp) {
        ventanaTemp.style.transform = `scale(${escalaFijaOBS})`;
        ventanaTemp.style.transformOrigin = "top left";
    }
}

function ajustarEscalaRetoOBS() {
    calcularEscalaRetoOBS();
}

// Exponer en el objeto global para ser invocado desde obs.js u otros módulos
window.escalaFijaOBS = escalaFijaOBS;
window.calcularEscalaRetoOBS = calcularEscalaRetoOBS;
window.aplicarEscalaOBS = aplicarEscalaOBS;
window.ajustarEscalaRetoOBS = ajustarEscalaRetoOBS;

// Recalcular automáticamente si cambia el tamaño del viewport (browser source de OBS)
window.addEventListener("resize", () => {
    if (!document.body.classList.contains("modo-obs")) return;
    calcularEscalaRetoOBS();
});