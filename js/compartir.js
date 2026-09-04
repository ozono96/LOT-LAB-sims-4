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
    const esModoNoche = document.body.classList.contains("modo-noche");
    if (esModoNoche) return true;

    // En modo día, si el botón padre está seleccionado (fondo verde), el icono se ve blanco
    const btnSeleccionado = imgElemento.closest(".opcionFiltro.seleccionada, .tarjetaCategoriaReto.seleccionada");
    if (btnSeleccionado) return true;

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
                                (imgClon.src && imgClon.src.includes("iconos-tipo-solar"));

        if (esIconoTipoSolar && debeConvertirseABlanco(imgOrig)) {
            const dataURL = generarIconoBlancoDataURL(imgOrig);
            if (dataURL) {
                imgClon.src = dataURL;
                imgClon.style.filter = "none";
            }
        }
    });
}
window.procesarIconosParaCaptura = procesarIconosParaCaptura;

async function capturarElemento(elemento, nombreArchivoBase = "LotLab_Captura") {
    if (!elemento) return;

    // Ocultar botones de compartir/captura/cerrar internos durante la captura
    const botonesOcultar = elemento.querySelectorAll(".compartir, .captura, .compartirSeccion, .cabeceraVentana");
    const estadosOriginales = [];
    botonesOcultar.forEach(btn => {
        estadosOriginales.push({ el: btn, display: btn.style.display });
        btn.style.display = "none";
    });

    const posOriginal = elemento.style.position;
    const computedPos = window.getComputedStyle(elemento).position;
    if (computedPos === "static") {
        elemento.style.position = "relative";
    }

    const boxshadowOriginal = elemento.style.boxShadow;
    elemento.style.boxShadow = "none";

    // Para tarjetas modales con scroll o max-height, permitir expansión completa durante captura
    const maxHeightOriginal = elemento.style.maxHeight;
    const overflowOriginal = elemento.style.overflow;
    const scrollablesInternos = elemento.querySelectorAll(".cuerpoModalAgradecimientos, [style*='overflow']");
    const scrollablesEstados = [];
    if (window.getComputedStyle(elemento).maxHeight !== "none") {
        elemento.style.maxHeight = "none";
        elemento.style.overflow = "visible";
    }
    scrollablesInternos.forEach(s => {
        scrollablesEstados.push({ el: s, mh: s.style.maxHeight, ov: s.style.overflow });
        s.style.maxHeight = "none";
        s.style.overflow = "visible";
    });

    const paddingBottomOriginal = elemento.style.paddingBottom;
    const computedPadBottom = parseFloat(window.getComputedStyle(elemento).paddingBottom) || 0;
    elemento.style.paddingBottom = (computedPadBottom + 50) + "px";

    // Añadir marca de agua derecha (Autor)
    const marcaAguaDerecha = document.createElement("div");
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
    elemento.appendChild(marcaAguaDerecha);

    // Añadir marca de agua izquierda (Nombre de la app)
    const marcaAguaIzquierda = document.createElement("div");
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
    elemento.appendChild(marcaAguaIzquierda);

    await new Promise(r => setTimeout(r, 100));

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
            onclone: (clonedDoc) => {
                const elClonado = (elemento.id ? clonedDoc.getElementById(elemento.id) : null) || clonedDoc.body;
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
        document.body.removeChild(link);

    } catch (error) {
        console.error("Error al capturar la pantalla: ", error);
        alert("Ocurrió un error al intentar capturar la pantalla. Comprueba la consola.");
    } finally {
        // Restaurar visibilidad de botones y estilos
        estadosOriginales.forEach(item => {
            item.el.style.display = item.display;
        });
        elemento.style.position = posOriginal;
        elemento.style.boxShadow = boxshadowOriginal;
        elemento.style.paddingBottom = paddingBottomOriginal;
        elemento.style.maxHeight = maxHeightOriginal;
        elemento.style.overflow = overflowOriginal;
        scrollablesEstados.forEach(item => {
            item.el.style.maxHeight = item.mh;
            item.el.style.overflow = item.ov;
        });
        if (marcaAguaDerecha.parentNode) marcaAguaDerecha.parentNode.removeChild(marcaAguaDerecha);
        if (marcaAguaIzquierda.parentNode) marcaAguaIzquierda.parentNode.removeChild(marcaAguaIzquierda);
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


