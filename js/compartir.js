// ── Procesamiento de iconos con filtro para captura fiel ────────
const _cacheIconosBlancos = new Map();

function generarIconoBlancoDataURL(imgElemento) {
    if (!imgElemento || !imgElemento.src) return null;
    const src = imgElemento.src;

    if (_cacheIconosBlancos.has(src)) {
        return _cacheIconosBlancos.get(src);
    }

    try {
        const canvas = document.createElement("canvas");
        const w = imgElemento.naturalWidth || imgElemento.width || 64;
        const h = imgElemento.naturalHeight || imgElemento.height || 64;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;

        ctx.drawImage(imgElemento, 0, 0, w, h);
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        // Convertir todos los píxeles visibles a blanco luminoso manteniendo la transparencia exacta
        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] > 0) {
                data[i] = 255;     // R
                data[i + 1] = 255; // G
                data[i + 2] = 255; // B
            }
        }

        ctx.putImageData(imgData, 0, 0);
        const dataURL = canvas.toDataURL("image/png");
        _cacheIconosBlancos.set(src, dataURL);
        return dataURL;
    } catch (e) {
        console.warn("No se pudo procesar icono para captura:", e);
        return null;
    }
}

function debeConvertirseABlanco(imgElemento) {
    if (!imgElemento) return false;

    // Si el botón padre está seleccionado (fondo resaltado), el icono se ve blanco
    const btnSeleccionado = imgElemento.closest(".opcionFiltro.seleccionada, .tarjetaCategoriaReto.seleccionada");
    if (btnSeleccionado) return true;

    // Para iconos de tipo de solar que usan color-resaltado reactivo del tema, no convertir a blanco genérico
    const esIconoTipoSolar = imgElemento.classList.contains("iconoTipoSolarReto") ||
                            imgElemento.classList.contains("iconoTipoSolarFiltro") ||
                            imgElemento.classList.contains("fichaSolarIconoTipoSolar") ||
                            imgElemento.classList.contains("tarjetaSolarTipoIcono") ||
                            (imgElemento.src && imgElemento.src.includes("iconos-tipo-solar"));
    if (esIconoTipoSolar) return false;

    const esModoNoche = document.body.classList.contains("modo-noche");
    if (esModoNoche) return true;

    // Comprobar si el computedStyle de filter incluye invert o brightness
    try {
        const computedFilter = window.getComputedStyle(imgElemento).filter;
        if (computedFilter && (computedFilter.includes("invert") || computedFilter.includes("brightness(0)"))) {
            return true;
        }
    } catch (e) {}

    return false;
}

function procesarIconosParaCaptura(elementoOriginal, elementoClonado) {
    if (!elementoOriginal || !elementoClonado) return;

    const imgsOriginales = Array.from(elementoOriginal.querySelectorAll("img"));
    const imgsClonadas = Array.from(elementoClonado.querySelectorAll("img"));

    imgsClonadas.forEach((imgClon, i) => {
        // Encontrar la imagen original ya cargada
        const imgOrig = imgsOriginales[i] || imgsOriginales.find(orig => orig.src === imgClon.src) || imgClon;

        const esIconoTipoSolar = imgClon.classList.contains("iconoTipoSolarReto") ||
                                imgClon.classList.contains("iconoTipoSolarFiltro") ||
                                imgClon.classList.contains("fichaSolarIconoTipoSolar") ||
                                imgClon.classList.contains("tarjetaSolarTipoIcono") ||
                                (imgClon.src && imgClon.src.includes("iconos-tipo-solar"));

        if (esIconoTipoSolar && debeConvertirseABlanco(imgOrig)) {
            const dataURL = generarIconoBlancoDataURL(imgOrig);
            if (dataURL) {
                imgClon.src = dataURL;
                imgClon.style.filter = "none";
                imgClon.style.left = "0";
            }
        }
    });
}
window.procesarIconosParaCaptura = procesarIconosParaCaptura;

// ── Sanitización de formatos de color CSS Color 4 para compatibilidad con html2canvas ──
function colorSrgbToRgba(str) {
    if (!str || typeof str !== 'string' || !str.includes('color(')) return str;
    return str.replace(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/gi, (_, r, g, b, a) => {
        const red = Math.round(parseFloat(r) * 255);
        const green = Math.round(parseFloat(g) * 255);
        const blue = Math.round(parseFloat(b) * 255);
        const alpha = a !== undefined ? parseFloat(a) : 1;
        return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
    });
}

function sanitizarColoresClonados(clonedDoc, elClonado = null) {
    if (!clonedDoc) return;

    // 1. Sanitizar elementos <style> clonados
    try {
        const styles = clonedDoc.querySelectorAll('style');
        styles.forEach(st => {
            if (st.textContent && st.textContent.includes('color(')) {
                st.textContent = colorSrgbToRgba(st.textContent);
            }
        });
    } catch (e) {}

    // 2. Sanitizar reglas CSS en las hojas de estilo del documento clonado
    try {
        for (let sheet of clonedDoc.styleSheets) {
            try {
                const rules = sheet.cssRules || sheet.rules;
                if (!rules) continue;
                for (let rule of rules) {
                    if (rule.style && rule.style.cssText && rule.style.cssText.includes('color(')) {
                        rule.style.cssText = colorSrgbToRgba(rule.style.cssText);
                    }
                }
            } catch (sheetErr) {}
        }
    } catch (e) {}

    // 3. Sanitizar estilos inline y computados de los elementos en el árbol a capturar
    try {
        const checkProps = [
            'box-shadow', 'background-image', 'background', 'background-color',
            'color', 'border-color', 'border-top-color', 'border-right-color',
            'border-bottom-color', 'border-left-color', 'outline-color', 'text-shadow'
        ];
        const root = elClonado || (clonedDoc.body);
        const allElements = root ? [root, ...Array.from(root.querySelectorAll('*'))] : clonedDoc.querySelectorAll('*');
        const win = clonedDoc.defaultView || window;
        allElements.forEach(el => {
            if (el.style && el.style.cssText && el.style.cssText.includes('color(')) {
                el.style.cssText = colorSrgbToRgba(el.style.cssText);
            }
            const comp = win.getComputedStyle ? win.getComputedStyle(el) : null;
            if (comp) {
                for (const prop of checkProps) {
                    const val = comp.getPropertyValue(prop);
                    if (val && val.includes('color(')) {
                        el.style.setProperty(prop, colorSrgbToRgba(val), 'important');
                    }
                }
            }
        });
    } catch (e) {}
}

let _capturaEnCurso = false;

function esElementoIgnorableParaCaptura(node, elementoObjetivo) {
    if (!node || !elementoObjetivo) return false;
    // Nunca ignorar el elemento a capturar ni sus ancestros (necesarios para preservar layout y herencia CSS)
    if (node === elementoObjetivo || node.contains(elementoObjetivo)) return false;
    // Si está dentro del elemento a capturar, no ignorar
    if (elementoObjetivo.contains(node)) return false;

    // Ignorar etiquetas pesadas externas al objetivo que no aportan contenido visual
    const tag = node.tagName;
    if (tag === 'SCRIPT' || tag === 'AUDIO' || tag === 'VIDEO' || tag === 'NOSCRIPT') {
        return true;
    }

    // Ignorar otras ventanas completas, lanzadores o modales externos que no forman parte de la captura
    if (node.classList && (
        node.classList.contains('ventana') ||
        node.classList.contains('launcher-experimental') ||
        node.classList.contains('cjs-modal-backdrop') ||
        node.classList.contains('overlayModal')
    )) {
        return true;
    }

    return false;
}

async function capturarElemento(elemento, nombreArchivoBase = "LotLab_Captura") {
    if (!elemento || _capturaEnCurso) return;
    _capturaEnCurso = true;

    // Feedback visual del cursor sin alterar elementos de la interfaz
    const cursorPrevio = document.body.style.cursor;
    document.body.style.cursor = "wait";

    // Capturar propiedades computadas del elemento en vivo (solo lectura, sin mutación)
    const computedStyle = window.getComputedStyle(elemento);
    const computedPos = computedStyle.position;
    const computedMaxH = computedStyle.maxHeight;
    const paddingBottomBase = parseFloat(computedStyle.paddingBottom) || 0;

    try {
        if (typeof html2canvas === 'undefined') {
            console.error("html2canvas no está cargado.");
            alert("Error: html2canvas no está cargado.");
            return;
        }

        const canvas = await html2canvas(elemento, {
            scale: 2,
            backgroundColor: null,
            useCORS: true,
            logging: false,
            ignoreElements: (node) => esElementoIgnorableParaCaptura(node, elemento),
            onclone: (clonedDoc) => {
                const elClonado = (elemento.id ? clonedDoc.getElementById(elemento.id) : null) || clonedDoc.body;
                if (!elClonado) return;

                // 1. Ocultar botones internos en el elemento clonado (no en el DOM en vivo)
                const selectorOcultar = (elemento.id === "ventanaTierList")
                    ? ".compartir, .captura, .cerrar, .compartirSeccion"
                    : ".compartir, .captura, .cerrar, .compartirSeccion, .cabeceraVentana";
                const botonesOcultar = elClonado.querySelectorAll(selectorOcultar);
                botonesOcultar.forEach(btn => {
                    btn.style.display = "none";
                });

                // 2. Estilos del contenedor en el clon
                elClonado.style.boxShadow = "none";
                if (computedPos === "static") {
                    elClonado.style.position = "relative";
                }

                // 3. Tarjetas o modales con scroll o max-height: expandir en el clon
                if (computedMaxH !== "none") {
                    elClonado.style.maxHeight = "none";
                    elClonado.style.overflow = "visible";
                }
                const scrollablesInternos = elClonado.querySelectorAll(".cuerpoModalAgradecimientos, [style*='overflow']");
                scrollablesInternos.forEach(s => {
                    s.style.maxHeight = "none";
                    s.style.overflow = "visible";
                });

                // 4. Padding inferior en el clon para ubicar las marcas de agua
                elClonado.style.paddingBottom = (paddingBottomBase + 36) + "px";

                // 5. Añadir marca de agua derecha (Autor) en el clon
                const marcaAguaDerecha = clonedDoc.createElement("div");
                marcaAguaDerecha.textContent = "Creado por Ozono 96";
                marcaAguaDerecha.style.position = "absolute";
                marcaAguaDerecha.style.bottom = "12px";
                marcaAguaDerecha.style.right = "15px";
                marcaAguaDerecha.style.fontSize = "0.9rem";
                marcaAguaDerecha.style.opacity = "0.75";
                marcaAguaDerecha.style.color = "var(--color-texto)";
                marcaAguaDerecha.style.fontWeight = "bold";
                marcaAguaDerecha.style.zIndex = "9999";
                marcaAguaDerecha.style.pointerEvents = "none";
                elClonado.appendChild(marcaAguaDerecha);

                // 6. Añadir marca de agua izquierda (Nombre de la app) en el clon
                const marcaAguaIzquierda = clonedDoc.createElement("div");
                marcaAguaIzquierda.textContent = "LOT-LAB Sims 4";
                marcaAguaIzquierda.style.position = "absolute";
                marcaAguaIzquierda.style.bottom = "12px";
                marcaAguaIzquierda.style.left = "15px";
                marcaAguaIzquierda.style.fontSize = "0.9rem";
                marcaAguaIzquierda.style.opacity = "0.75";
                marcaAguaIzquierda.style.color = "var(--color-texto)";
                marcaAguaIzquierda.style.fontWeight = "bold";
                marcaAguaIzquierda.style.zIndex = "9999";
                marcaAguaIzquierda.style.pointerEvents = "none";
                elClonado.appendChild(marcaAguaIzquierda);

                // 7. Sanitizar colores compatibles con html2canvas en el árbol clonado
                sanitizarColoresClonados(clonedDoc, elClonado);

                // 8. Procesar iconos para captura fiel
                procesarIconosParaCaptura(elemento, elClonado);
            }
        });

        const imageURL = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = imageURL;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        link.download = `${nombreArchivoBase}_${timestamp}.png`;

        document.body.appendChild(link);
        link.click();
        if (link.parentNode) {
            link.parentNode.removeChild(link);
        }

    } catch (error) {
        console.error("Error al capturar la pantalla: ", error);
        alert("Ocurrió un error al intentar capturar la pantalla. Comprueba la consola.");
    } finally {
        document.body.style.cursor = cursorPrevio;
        _capturaEnCurso = false;
    }
}

// ── Feedback visual con Tooltip de LOT-LAB ──────────────────────
function mostrarTooltipFeedback(event, elemento, mensaje = "Enlace copiado") {
    const tooltip = document.getElementById("tooltipOpciones");
    if (!tooltip) return;

    let x = 0;
    let y = 0;

    if (event && typeof event.clientX === "number" && event.clientX > 0) {
        x = event.clientX;
        y = event.clientY;
    } else if (elemento && typeof elemento.getBoundingClientRect === "function") {
        const rect = elemento.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top;
    } else {
        x = window.innerWidth / 2;
        y = window.innerHeight / 2;
    }

    tooltip.textContent = mensaje;
    tooltip.style.left = x + "px";
    tooltip.style.top = (y - 10) + "px";
    tooltip.style.display = "block";

    clearTimeout(window._tooltipCopiadoTimeout);
    window._tooltipCopiadoTimeout = setTimeout(() => {
        window._tooltipCopiadoTimeout = null;
        tooltip.style.display = "none";
    }, 1400);
}

// ── Copiar enlace actual al portapapeles ─────────────────────────
function copiarEnlaceCompartir(btn, event) {
    const url = window.location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url)
            .then(() => {
                mostrarTooltipFeedback(event, btn, "Enlace copiado");
            })
            .catch(() => {
                copiarEnlaceFallback(url, btn, event);
            });
    } else {
        copiarEnlaceFallback(url, btn, event);
    }
}

function copiarEnlaceFallback(texto, btn, event) {
    try {
        const textarea = document.createElement("textarea");
        textarea.value = texto;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(textarea);
        if (ok) {
            mostrarTooltipFeedback(event, btn, "Enlace copiado");
        } else {
            mostrarTooltipFeedback(event, btn, "No se pudo copiar");
        }
    } catch (err) {
        mostrarTooltipFeedback(event, btn, "No se pudo copiar");
    }
}

window.copiarEnlaceCompartir = copiarEnlaceCompartir;
window.capturarElemento = capturarElemento;

document.addEventListener("DOMContentLoaded", () => {
    // Delegación global de eventos para captura (.captura, .compartirSeccion) y compartir enlace (.compartir)
    document.addEventListener("click", (e) => {
        // 1. Botón Captura (.captura) -> Captura de pantalla de la ventana/tarjeta
        const btnCaptura = e.target.closest(".captura");
        if (btnCaptura) {
            const ventana = btnCaptura.closest(".ventana");
            if (ventana) {
                capturarElemento(ventana, "LotLab_Captura");
                return;
            }
            // Si no está dentro de .ventana, comprobar si tiene data-captura o pertenece a modal flotante
            const targetId = btnCaptura.getAttribute("data-captura");
            const targetEl = targetId ? document.getElementById(targetId) : btnCaptura.closest(".cardPacksFlotante");
            if (targetEl) {
                capturarElemento(targetEl, targetId ? `LotLab_${targetId}` : "LotLab_Captura");
                return;
            }
            return;
        }

        // 2. Botón Compartir Sección (.compartirSeccion) -> Captura de la sección específica
        const btnSeccion = e.target.closest(".compartirSeccion");
        if (btnSeccion) {
            const targetId = btnSeccion.getAttribute("data-captura");
            const targetEl = targetId ? document.getElementById(targetId) : null;
            if (targetEl) {
                capturarElemento(targetEl, `LotLab_${targetId}`);
            } else {
                const ventana = btnSeccion.closest(".ventana");
                if (ventana) capturarElemento(ventana, "LotLab_Captura");
            }
            return;
        }

        // 3. Botón Compartir (.compartir) -> Copiar enlace actual al portapapeles
        const btnCompartir = e.target.closest(".compartir");
        if (btnCompartir) {
            copiarEnlaceCompartir(btnCompartir, e);
            return;
        }
    });
});


