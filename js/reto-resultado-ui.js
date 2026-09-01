// Helper: Genera el contenido interno enriquecido de una categoría de reto
function obtenerContenidoCategoriaHTML(catId, cat) {
    if (!cat || !cat.resultado) return "";

    let textoHtml = `<div class="textoResultadoCat" style="font-size: 1.05rem; margin-top: 4px;">${cat.resultado.texto || ""}</div>`;
    let detalleExtra = "";

    // 🎨 Colores: solo muestras de color limpias
    if (catId === "colores") {
        textoHtml = "";
        if (cat.resultado.elementos && cat.resultado.elementos.length > 0) {
            detalleExtra += `<div class="muestrasColores" style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 6px; align-items: center;">`;
            cat.resultado.elementos.forEach(c => {
                detalleExtra += `
                    <span class="chipColor" title="${c.nombre}" data-tooltip="${c.nombre}" style="width: 34px; height: 34px; border-radius: 50%; background: ${c.hex}; border: 2px solid rgba(255,255,255,0.8); display: inline-block; box-shadow: var(--sombra-suave); cursor: pointer; transition: transform 0.2s;" onmouseenter="this.style.transform='scale(1.15)'" onmouseleave="this.style.transform='scale(1)'"></span>
                `;
            });
            detalleExtra += `</div>`;
        } else {
            textoHtml = `<div class="textoResultadoCat" style="font-size: 1.05rem; margin-top: 4px;">${cat.resultado.texto || "Cualquiera"}</div>`;
        }
    }

    // 🧠 Habilidades: solo las cartas de habilidades
    else if (catId === "habilidades") {
        textoHtml = "";
        if (cat.resultado.elementos && cat.resultado.elementos.length > 0) {
            detalleExtra += `<div class="habResultadoGrid" style="margin-top: 4px; gap: 10px; justify-content: flex-start; flex-wrap: wrap;">`;
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
                        <img src="${rutaIcono}" alt="${nombrePackNormalizado}" class="iconoPackMini" style="width:14px;height:14px;object-fit:contain;vertical-align:middle;margin-right:3px;" onerror="this.style.display='none'">
                        <span>${nombrePackNormalizado}</span>
                    </div>`;
                } else {
                    packBadgeHTML = `<div class="habResultadoCardPack ${esBase ? "habResultadoCardPackBase" : ""}">
                        ${esBase ? "🎮 Juego Base" : "📦 " + packReq}
                    </div>`;
                }

                detalleExtra += `
                    <div class="habResultadoCard" style="width: 120px; padding: 8px 6px; opacity: 1; transform: none; animation: none; flex-shrink: 0;">
                        <div class="habResultadoCardImg" style="width: 42px; height: 42px;">
                            ${imgSrc ? `<img src="${imgSrc}" alt="${nombre}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` : ""}
                            <div class="habResultadoCardFallback" style="${imgSrc ? 'display:none' : 'display:flex'}; font-size: 1.6rem;">🧠</div>
                        </div>
                        <div class="habResultadoCardNombre" style="font-size: 0.84rem;">${nombre}</div>
                        ${packBadgeHTML}
                    </div>
                `;
            });
            detalleExtra += `</div>`;
        } else {
            textoHtml = `<div class="textoResultadoCat" style="font-size: 1.05rem; margin-top: 4px;">${cat.resultado.texto || "Ninguna"}</div>`;
        }
    }

    // 📦 Límite de Packs: solo los iconos limpios y grandes
    else if (catId === "limitePacks") {
        textoHtml = "";
        if (cat.resultado.packsPermitidos && cat.resultado.packsPermitidos.length > 0) {
            detalleExtra += `<div class="tiraIconosPacks">${typeof htmlIconosPacks === "function" ? htmlIconosPacks(cat.resultado.packsPermitidos) : ""}</div>`;
        } else {
            textoHtml = `<div class="textoResultadoCat" style="font-size: 1.05rem; margin-top: 4px;">${cat.resultado.texto || "Todos los packs"}</div>`;
        }
    }

    // 🔨 Limitantes Construir / Comprar: solo la lista de limitantes sin texto repetido
    else if (catId === "limitanteConstruir" || catId === "limitanteComprar") {
        textoHtml = "";
        if (cat.resultado.elementos && cat.resultado.elementos.length > 0) {
            detalleExtra += typeof htmlListaLimitantes === "function" ? htmlListaLimitantes(cat.resultado.elementos) : "";
        } else {
            textoHtml = `<div class="textoResultadoCat" style="font-size: 1.05rem; margin-top: 4px;">${cat.resultado.texto || "Ninguno"}</div>`;
        }
    }

    // 🎯 Objetivo / Tipo de solar
    else if (catId === "objetivo") {
        if (cat.resultado.imagen) {
            textoHtml = `
                <div class="objetivoResultadoWrap" style="display: flex; align-items: center; gap: 14px; margin-top: 4px;">
                    <div class="iconoTipoSolarWrap" style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        <img src="${cat.resultado.imagen}" alt="${cat.resultado.nombre || ''}" class="iconoTipoSolarReto" onerror="this.parentElement.style.display='none';">
                    </div>
                    <div class="textoResultadoCat" style="font-size: 1.05rem; font-weight: 600;">${cat.resultado.texto || ""}</div>
                </div>
            `;
        }
        if (cat.resultado.tipo === "residencial" && cat.resultado.composicion && cat.resultado.composicion.length > 0 && typeof htmlComposicionVivienda === "function") {
            detalleExtra += `
                <div style="margin-top: 4px;">
                    ${htmlComposicionVivienda(cat.resultado.composicion)}
                </div>
            `;
        }
    }

    // ✨ Ayudas (CC, Trucos, Mods) con color verde/rojo
    else if (cat.resultado.dificultadDelta !== undefined) {
        const colorStatus = cat.resultado.permitido ? "var(--color-exito, #2ecc71)" : "var(--color-error, #e74c3c)";
        textoHtml = `<div class="textoResultadoCat" style="font-size: 1.05rem; margin-top: 4px; font-weight: bold; color: ${colorStatus};">${cat.resultado.texto || ""}</div>`;
    }

    return `${textoHtml}${detalleExtra}`;
}

function obtenerAlturaSlotCategoria(catId, cat) {
    if (catId === "solar") return 220;
    if (catId === "habilidades") return 115;
    if (catId === "colores") return 46;
    if (catId === "limitePacks") return 50;
    if (catId === "limitanteConstruir" || catId === "limitanteComprar") return 54;
    if (catId === "objetivo") {
        if (cat && cat.resultado && cat.resultado.imagen) return 60;
        return (cat && cat.resultado && cat.resultado.tipo === "residencial" && cat.resultado.composicion) ? 76 : 44;
    }
    return 44;
}

// ── Renderizado estático / directo de resultado de reto ───────────
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
                Dificultad: <span class="difValorSpan">${difHTML}</span>
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
            <div class="seccionSolarReto" id="seccionSolarReto" style="margin-bottom: 30px;">
                <h3 style="text-align: center; margin-bottom: 12px;">🏡 Solar Seleccionado</h3>
                <div style="position: relative; display: flex; align-items: center; justify-content: center; min-height: 60px; max-width: 650px; margin: 0 auto; padding: 0 20px;">
                    <div class="solarCardSlotWrap" style="display: flex; justify-content: center; align-items: center; width: 100%;">
                        ${solarHtml}
                    </div>
                    <button
                        class="${btnSolarClass}"
                        onclick="rerollSolar()"
                        ${disabledSolar}
                        data-tooltip=" ¡RECUERDA! Solo tienes 3 intentos para regenerar el solar."
                        style="position: absolute; right: 20px; display: flex; align-items: center; gap: 6px; padding: 8px 14px; font-size: 0.95rem; flex-shrink: 0;"
                    >
                        🔄 (<span class="rerollSolarNum">${rerollsSolarLeft}</span>/3)
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
        const innerContent = obtenerContenidoCategoriaHTML(catId, cat);

        html += `
            <div class="tarjetaCategoriaReto" data-categoria="${catId}" style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.15); border: 1px solid var(--borde); padding: 15px 20px; border-radius: var(--radio-normal); flex-wrap: wrap; gap: 10px;">
                <div class="infoCategoria" style="flex: 1; min-width: 200px;">
                    <div style="font-weight: bold; font-size: 1.1rem; color: var(--color-titulo);">${cat.modulo.titulo}</div>
                    <div class="catResultadoSlotWrap">${innerContent}</div>
                </div>
                <button
                    class="${btnClass}"
                    onclick="rerollCategoria('${catId}')"
                    ${disabled}
                    data-tooltip=" ¡RECUERDA! Solo tienes 3 intentos para regenerar cada limitante del reto."
                    style="display: flex; align-items: center; gap: 6px; padding: 8px 14px; font-size: 0.95rem;"
                >
                    🔄 (<span class="rerollCatNum">${rerollsLeft}</span>/3)
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

    if (document.body.classList.contains("modo-obs")) {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (typeof ajustarEscalaRetoOBS === "function") ajustarEscalaRetoOBS();
            });
        });
    }

    _inicializarTooltipsReroll(contenedor);
}

function _inicializarTooltipsReroll(contenedor) {
    const tooltip = document.getElementById("tooltipOpciones");
    if (!tooltip || !contenedor) return;

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

// Tiempos entre cambios (ms): rápido al principio, desacelera prog. hasta el ganador
// Más espaciados que antes para que cada opción sea perceptible y no marear
const INTERVALOS_CICLADO_VISUAL = [110, 120, 135, 150, 170, 200, 240, 295, 360, 440, 530];

// Extrae todas las URLs de imágenes de un fragmento HTML
function _extraerURLsImagenes(html) {
    const urls = [];
    const regex = /src="([^"]+)"/g;
    let m;
    while ((m = regex.exec(html)) !== null) {
        if (m[1] && !m[1].startsWith('data:')) urls.push(m[1]);
    }
    return urls;
}

// Precarga un array de URLs de imagen; resuelve cuando todas están listas (o fallan)
function precargaImagenes(urls) {
    if (!urls || urls.length === 0) return Promise.resolve();
    return Promise.all(urls.map(src => new Promise(resolve => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = resolve;
        img.src = src;
    })));
}

/**
 * Ejecuta el ciclo de opciones visuales:
 *  - Pre-renderiza todos los HTMLs y precarga imágenes
 *  - Mide la altura REAL del contenido renderizando el item 0 en capaA
 *  - Dos capas con crossfade: nunca hay instante vacío entre opciones
 *  - Altura del wrapper fija durante TODA la animación (evita saltos de layout)
 *  - overflow:hidden SOLO mientras anima; se libera al terminar (colores pueden hacer hover)
 */
function ejecutarCicladoVisual(elementoContenedor, items, renderFn, onFinish) {
    if (!elementoContenedor || !items || items.length === 0) {
        if (typeof onFinish === 'function') onFinish();
        return;
    }

    // Pre-renderizar todos los HTML para extraer imágenes y evitar re-render durante la animación
    const htmlsPrecalculados = items.map(item => renderFn(item));

    // Recoger todas las URLs únicas de imágenes para precargar
    const todasURLs = [];
    htmlsPrecalculados.forEach(html => {
        _extraerURLsImagenes(html).forEach(url => {
            if (!todasURLs.includes(url)) todasURLs.push(url);
        });
    });

    // Dos capas de crossfade
    const capaA = document.createElement('div');
    const capaB = document.createElement('div');
    capaA.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden;';
    capaB.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden;opacity:0;';

    // ─── CLAVE: renderizar item 0 en capaA ANTES de fijar la altura ───────────
    // Así scrollHeight devuelve la altura NATURAL del contenido real
    // (incluyendo habilidades en múltiples filas, tarjetas solares, etc.)
    capaA.innerHTML = htmlsPrecalculados[0];

    elementoContenedor.style.position = 'relative';
    elementoContenedor.innerHTML = '';
    elementoContenedor.appendChild(capaA);
    elementoContenedor.appendChild(capaB);

    // Leer la altura natural del primer item (fuerza layout síncrono)
    // scrollHeight da el contenido completo sin clipping, aunque haya flex-wrap
    const alturaContenido = Math.max(capaA.scrollHeight || capaA.offsetHeight || 44, 44);

    // Ahora sí: fijar la altura del wrapper para estabilizar el layout durante la animación
    elementoContenedor.style.overflow = 'hidden';
    elementoContenedor.style.height = alturaContenido + 'px';
    elementoContenedor.style.minHeight = alturaContenido + 'px';

    function limpiarYFinalizar() {
        // Restaurar el contenedor: sin clipping, sin altura fija
        elementoContenedor.style.overflow = '';
        elementoContenedor.style.position = '';
        elementoContenedor.style.height = '';
        elementoContenedor.style.minHeight = '';
        if (typeof onFinish === 'function') onFinish();
    }

    function arrancarCiclado() {
        // Item 0 ya está visible en capaA → empezamos en paso 1
        let paso = 1;
        let capaActiva = capaA; // contiene item 0, opacity=1 (default)
        let capaOculta = capaB; // vacía, opacity=0

        // Si solo hay 1 item (el ganador), aterrizar directamente
        if (htmlsPrecalculados.length === 1) {
            capaA.style.animation = 'retoCicladoAterrizaje 0.30s cubic-bezier(0.18,0.89,0.32,1.28) forwards';
            setTimeout(limpiarYFinalizar, 360);
            return;
        }

        // Esperar el tiempo del item 0 antes de pasar al siguiente
        setTimeout(mostrarPaso, INTERVALOS_CICLADO_VISUAL[0] !== undefined ? INTERVALOS_CICLADO_VISUAL[0] : 110);

        function mostrarPaso() {
            const esUltimo = (paso === htmlsPrecalculados.length - 1);
            const delay = INTERVALOS_CICLADO_VISUAL[paso] !== undefined
                ? INTERVALOS_CICLADO_VISUAL[paso]
                : 200;

            // Inyectar el nuevo contenido en la capa que va a aparecer
            capaOculta.innerHTML = htmlsPrecalculados[paso];

            // Duración del crossfade: proporcional al tiempo visible (más lento al aterrizar)
            const msDuracion = esUltimo ? 280 : Math.round(delay * 0.45);
            const transCss = `opacity ${msDuracion}ms ease`;
            capaActiva.style.transition = transCss;
            capaOculta.style.transition = transCss;

            capaActiva.style.opacity = '0';
            capaOculta.style.opacity = '1';

            if (esUltimo) {
                capaOculta.style.animation = 'retoCicladoAterrizaje 0.30s cubic-bezier(0.18,0.89,0.32,1.28) forwards';
            } else {
                capaOculta.style.animation = 'none';
            }

            // Intercambiar roles para el próximo paso
            [capaActiva, capaOculta] = [capaOculta, capaActiva];

            if (!esUltimo) {
                paso++;
                setTimeout(mostrarPaso, delay);
            } else {
                setTimeout(limpiarYFinalizar, 360);
            }
        }
    }

    // Precargar todas las imágenes y arrancar la animación
    precargaImagenes(todasURLs).then(arrancarCiclado);
}


function esCategoriaVisual(catId, cat) {
    if (catId === "solar") return true;
    if (catId === "colores") return true;
    if (catId === "habilidades") return true;
    if (catId === "limitePacks") return true;
    if (catId === "limitanteConstruir" || catId === "limitanteComprar") return true;
    if (catId === "objetivo") {
        if (cat && cat.resultado && cat.resultado.imagen) return true;
        if (cat && cat.resultado && cat.resultado.tipo === "residencial" && cat.resultado.composicion) return true;
        return false;
    }
    return false;
}

// ── Constructor de secuencias de candidatos reales ─────────────────────

function construirSecuenciasReto(reto, contexto) {
    const secuencias = {};

    // 1. Solar
    if (reto.tipo === "con-solar" && reto.solar) {
        secuencias.solar = construirSecuenciaCategoria("solar", reto, contexto);
    }

    // 2. Categorías
    if (reto.categorias) {
        Object.keys(reto.categorias).forEach(catId => {
            secuencias[catId] = construirSecuenciaCategoria(catId, reto, contexto);
        });
    }

    return secuencias;
}

function construirSecuenciaCategoria(catId, reto, contexto) {
    const cat = reto.categorias ? reto.categorias[catId] : null;
    const esVisual = esCategoriaVisual(catId, cat);

    // ── 1. Solar ──
    if (catId === "solar") {
        const packsUsuario = (contexto && contexto.packsUsuario) ? contexto.packsUsuario : [];
        let poolSolares = (database && database.solares) ? database.solares : [];
        if (packsUsuario.length > 0) {
            const poolFiltrado = poolSolares.filter(s => {
                const p = (s.nombrePack || "").trim().toLowerCase();
                return p === "base" || p === "juego base" || packsUsuario.some(u => u.toLowerCase() === p);
            });
            if (poolFiltrado.length > 0) poolSolares = poolFiltrado;
        }

        const items = [];
        const numPasos = INTERVALOS_CICLADO_VISUAL.length;
        for (let i = 0; i < numPasos; i++) {
            const sol = poolSolares[Math.floor(Math.random() * poolSolares.length)];
            items.push(sol || reto.solar);
        }
        items.push(reto.solar);
        return items;
    }

    const modulo = (cat && cat.modulo) ? cat.modulo : RetoModulos[catId];
    const targetResultado = (cat && cat.resultado)
        ? cat.resultado
        : (modulo ? modulo.generar(contexto) : { texto: "Resultado" });

    // ── 2. Categorías Visuales: lista de candidate resultado objects para ciclado ──
    if (esVisual) {
        const items = [];
        const numPasos = INTERVALOS_CICLADO_VISUAL.length;
        for (let i = 0; i < numPasos; i++) {
            if (modulo && typeof modulo.generar === "function") {
                const randRes = modulo.generar(contexto || {});
                if (catId === "objetivo" && randRes.tipo === "residencial" && typeof generarComposicionAleatoria === "function") {
                    randRes.composicion = generarComposicionAleatoria(randRes.sims || 4);
                }
                items.push(randRes);
            } else {
                items.push({ texto: "Opción" });
            }
        }
        items.push(targetResultado);
        return items;
    }

    // ── 3. Categorías de Texto: carrete vertical con valores reales del generador ──
    const targetIdx = 14;
    const items = [];
    const targetTexto = (targetResultado && targetResultado.texto) ? targetResultado.texto : "Resultado";

    // Generar candidatos reales desde el módulo
    if (modulo && typeof modulo.generar === "function") {
        for (let i = 0; i < targetIdx; i++) {
            const res = modulo.generar(contexto || {});
            items.push((res && res.texto) ? res.texto : targetTexto);
        }
    } else {
        // Fallback: pool estático según categoría
        let poolTextos = [];
        switch (catId) {
            case "estiloExterior":
                poolTextos = (database.estilosArquitectonicos || []).map(f => Array.isArray(f) ? f[0] : f).filter(Boolean);
                break;
            case "estiloInterior":
                poolTextos = (database.estilosDecoracion || []).map(f => Array.isArray(f) ? f[0] : f).filter(Boolean);
                break;
            case "presupuesto":
                poolTextos = ["20.000 §", "35.000 §", "50.000 §", "75.000 §", "100.000 §", "120.000 §", "150.000 §", "ILIMITADO"];
                break;
            case "temporizador":
                poolTextos = ["7 min", "9 min", "12 min", "14 min", "18 min", "21 min", "25 min", "30 min", "45 min"];
                break;
            default:
                poolTextos = ["Opción A", "Opción B", "Opción C"];
        }
        if (poolTextos.length === 0) poolTextos = ["Cualquiera", "Aleatorio", "Estándar"];
        for (let i = 0; i < targetIdx; i++) {
            items.push(poolTextos[Math.floor(Math.random() * poolTextos.length)]);
        }
    }

    items.push(targetTexto);
    // Añadir algunos pasos finales (el ganador permanece en pantalla)
    for (let i = 0; i < 4; i++) {
        if (modulo && typeof modulo.generar === "function") {
            const res = modulo.generar(contexto || {});
            items.push((res && res.texto) ? res.texto : targetTexto);
        } else {
            items.push(targetTexto);
        }
    }

    return items;
}

// ── Animación completa al generar el reto ─────────────────────────
function animarGeneracionReto(reto, secuencias, onComplete) {
    const contenedor = document.getElementById("contenidoRetoResultado");
    if (!contenedor) return;

    window.retoAnimando = true;

    // Renderizar cabecera fija
    let html = "";

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
                Dificultad: <span class="difValorSpan">${difHTML}</span>
            </div>
            ${reto.dificultadExtra > 0 ? `
                <div class="dificultadExtraReto" style="font-size: 1.2rem; font-weight: bold; margin-top: 6px;">
                    Dificultad Extra: <span style="color: #e74c3c;">${"🔥".repeat(reto.dificultadExtra)}</span> (${reto.dificultadExtra} pts)
                </div>
            ` : ""}
        </div>
    `;

    // 2. Solar: contenedor fijo
    if (reto.tipo === "con-solar" && secuencias.solar) {
        const rerollsSolarLeft = typeof reto.rerollsSolar === "number" ? reto.rerollsSolar : 3;
        const primerSolar = secuencias.solar[0] || reto.solar;
        const solarInitHTML = typeof crearFichaSolar === "function" ? crearFichaSolar(primerSolar) : `<div>${primerSolar.nombre}</div>`;

        html += `
            <div class="seccionSolarReto" id="seccionSolarReto" style="margin-bottom: 30px;">
                <h3 style="text-align: center; margin-bottom: 12px;">🏡 Solar Seleccionado</h3>
                <div style="position: relative; display: flex; align-items: center; justify-content: center; min-height: 60px; max-width: 650px; margin: 0 auto; padding: 0 20px;">
                    <div class="solarCardSlotWrap" style="display: flex; justify-content: center; align-items: center; width: 100%;">
                        ${solarInitHTML}
                    </div>
                    <button
                        class="btnReroll deshabilitado"
                        disabled
                        style="position: absolute; right: 20px; display: flex; align-items: center; gap: 6px; padding: 8px 14px; font-size: 0.95rem; flex-shrink: 0;"
                    >
                        🔄 (<span class="rerollSolarNum">${rerollsSolarLeft}</span>/3)
                    </button>
                </div>
            </div>
        `;
    }

    // 3. Categorías: marco exterior fijo
    html += `<div class="listaCategoriasReto" style="display: flex; flex-direction: column; gap: 15px; max-width: 650px; margin: 0 auto;">`;

    const catKeys = Object.keys(reto.categorias);
    catKeys.forEach(catId => {
        const cat = reto.categorias[catId];
        const seq = secuencias[catId] || [];
        const rerollsLeft = cat.rerollsRestantes;
        const esVisual = esCategoriaVisual(catId, cat);

        let contenidoInicialHTML = "";

        if (esVisual) {
            // Ciclado visual: empieza vacío, la animación arranca al montar el DOM
            contenidoInicialHTML = '';
        } else {
            // Carrete vertical de texto — misma alineación que el resultado final
            const itemsHTML = seq.map((txt, idx) => `
                <div class="retoSlotItemVisual" data-idx="${idx}" style="height: 44px; min-height: 44px; display: flex; align-items: flex-start; padding-top: 6px;">
                    <div class="textoResultadoCat" style="font-size: 1.05rem; text-align: left;">${txt}</div>
                </div>
            `).join('');

            contenidoInicialHTML = `
                <div class="retoSlotViewport" style="height: 44px;">
                    <div class="retoSlotTrack" id="retoSlotTrack_${catId}">
                        ${itemsHTML}
                    </div>
                </div>
            `;
        }

        html += `
            <div class="tarjetaCategoriaReto" data-categoria="${catId}" style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.15); border: 1px solid var(--borde); padding: 15px 20px; border-radius: var(--radio-normal); flex-wrap: wrap; gap: 10px;">
                <div class="infoCategoria" style="flex: 1; min-width: 200px;">
                    <div style="font-weight: bold; font-size: 1.1rem; color: var(--color-titulo);">${cat.modulo.titulo}</div>
                    <div class="catResultadoSlotWrap">
                        ${contenidoInicialHTML}
                    </div>
                </div>
                <button
                    class="btnReroll deshabilitado"
                    disabled
                    style="display: flex; align-items: center; gap: 6px; padding: 8px 14px; font-size: 0.95rem;"
                >
                    🔄 (<span class="rerollCatNum">${rerollsLeft}</span>/3)
                </button>
            </div>
        `;
    });

    html += `</div>`;
    contenedor.innerHTML = html;

    if (document.body.classList.contains("modo-obs") && typeof ajustarEscalaRetoOBS === "function") {
        ajustarEscalaRetoOBS();
    }

    // Disparar las animaciones (ciclado visual y slots de texto en paralelo)
    requestAnimationFrame(() => {
        let totalAnimaciones = 0;
        let completadas = 0;

        const verificarFinTotal = () => {
            completadas++;
            if (completadas >= totalAnimaciones) {
                window.retoAnimando = false;
                renderizarResultadoReto(reto);
                if (typeof onComplete === "function") onComplete();
            }
        };

        // Solar (ciclado visual)
        if (reto.tipo === "con-solar" && secuencias.solar) {
            totalAnimaciones++;
            const solarWrap = contenedor.querySelector("#seccionSolarReto .solarCardSlotWrap");
            if (solarWrap) {
                ejecutarCicladoVisual(solarWrap, secuencias.solar, (s) => crearFichaSolar(s), verificarFinTotal);
            } else {
                verificarFinTotal();
            }
        }

        // Categorías
        catKeys.forEach((catId, i) => {
            totalAnimaciones++;
            const cat = reto.categorias[catId];
            const esVisual = esCategoriaVisual(catId, cat);
            const card = contenedor.querySelector(`.tarjetaCategoriaReto[data-categoria="${catId}"]`);
            const wrap = card ? card.querySelector(".catResultadoSlotWrap") : null;

            if (esVisual && wrap) {
                // Ciclado visual rápido
                ejecutarCicladoVisual(
                    wrap,
                    secuencias[catId],
                    (resObj) => obtenerContenidoCategoriaHTML(catId, { modulo: cat.modulo, resultado: resObj }),
                    verificarFinTotal
                );
            } else {
                // Carrete de texto vertical
                const track = document.getElementById(`retoSlotTrack_${catId}`);
                if (track) {
                    const targetIdx = 14;
                    const duracionMs = 1550 + i * 60;
                    track.style.transition = `transform ${duracionMs / 1000}s cubic-bezier(0.12, 0.85, 0.2, 1.0)`;
                    track.style.transform = `translateY(-${targetIdx * 44}px)`;
                    setTimeout(verificarFinTotal, duracionMs + 30);
                } else {
                    verificarFinTotal();
                }
            }
        });
    });
}

// ── Animación aislada para Reroll de tarjeta individual ───────────
function animarRerollTarjeta(categoriaId, nuevoReto, secuencia, onComplete) {
    const contenedor = document.getElementById("contenidoRetoResultado");
    if (!contenedor) return;

    if (categoriaId === "solar") {
        const wrap = contenedor.querySelector("#seccionSolarReto .solarCardSlotWrap");
        const btn = contenedor.querySelector("#seccionSolarReto .btnReroll");
        if (!wrap) {
            renderizarResultadoReto(nuevoReto);
            return;
        }
        if (btn) {
            btn.disabled = true;
            btn.classList.add("deshabilitado");
        }
        ejecutarCicladoVisual(wrap, secuencia, (s) => crearFichaSolar(s), () => {
            renderizarResultadoReto(nuevoReto);
            if (typeof onComplete === "function") onComplete();
        });
        return;
    }

    // Reroll de categoría individual
    const card = contenedor.querySelector(`.tarjetaCategoriaReto[data-categoria="${categoriaId}"]`);
    if (!card) {
        renderizarResultadoReto(nuevoReto);
        return;
    }

    const cat = nuevoReto.categorias[categoriaId];
    const esVisual = esCategoriaVisual(categoriaId, cat);
    const wrap = card.querySelector(".catResultadoSlotWrap");
    const btn = card.querySelector(".btnReroll");
    if (btn) {
        btn.disabled = true;
        btn.classList.add("deshabilitado");
    }

    if (esVisual) {
        ejecutarCicladoVisual(
            wrap,
            secuencia,
            (resObj) => obtenerContenidoCategoriaHTML(categoriaId, { modulo: cat.modulo, resultado: resObj }),
            () => {
                renderizarResultadoReto(nuevoReto);
                if (typeof onComplete === "function") onComplete();
            }
        );
    } else {
        // Carrete de texto vertical — misma alineación que el resultado final
        const itemsHTML = secuencia.map((txt, idx) => `
            <div class="retoSlotItemVisual" data-idx="${idx}" style="height: 44px; min-height: 44px; display: flex; align-items: flex-start; padding-top: 6px;">
                <div class="textoResultadoCat" style="font-size: 1.05rem; text-align: left;">${txt}</div>
            </div>
        `).join('');

        wrap.innerHTML = `
            <div class="retoSlotViewport" style="height: 44px;">
                <div class="retoSlotTrack" id="rerollTrack_${categoriaId}">
                    ${itemsHTML}
                </div>
            </div>
        `;

        requestAnimationFrame(() => {
            const track = document.getElementById(`rerollTrack_${categoriaId}`);
            if (track) {
                const targetIdx = 14;
                track.style.transition = 'transform 1.35s cubic-bezier(0.12, 0.85, 0.2, 1.0)';
                track.style.transform = `translateY(-${targetIdx * 44}px)`;
                setTimeout(() => {
                    renderizarResultadoReto(nuevoReto);
                    if (typeof onComplete === 'function') onComplete();
                }, 1400);
            } else {
                renderizarResultadoReto(nuevoReto);
            }
        });
    }
}

window.renderizarResultadoReto = renderizarResultadoReto;
window.animarGeneracionReto = animarGeneracionReto;
window.animarRerollTarjeta = animarRerollTarjeta;
window.construirSecuenciasReto = construirSecuenciasReto;
window.construirSecuenciaCategoria = construirSecuenciaCategoria;
window.esCategoriaVisual = esCategoriaVisual;
window.ejecutarCicladoVisual = ejecutarCicladoVisual;

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

    // Escalar hacia abajo si el contenido supera el espacio disponible (nunca agrandar por encima de 1)
    const escalaAuto = Math.min(escalaAltura, escalaAnchura, 1);
    const escalaAutoValida = (escalaAuto <= 0 || isNaN(escalaAuto)) ? 1 : escalaAuto;

    // Obtener la escala de ventanas configurada por el usuario en OBS (por defecto 100% = 1.0)
    let escalaUsuario = 1;
    if (typeof window.obtenerEscalaUsuarioOBS === "function") {
        escalaUsuario = window.obtenerEscalaUsuarioOBS();
    } else if (window.obsConfig && window.obsConfig.scale !== undefined) {
        escalaUsuario = (parseInt(window.obsConfig.scale, 10) || 100) / 100;
    }

    // Combinar la escala de ajuste automático del reto con la escala elegida por el usuario
    escalaFijaOBS = escalaAutoValida * escalaUsuario;
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