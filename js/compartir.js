/* =========================================================
   COMPARTIR (CAPTURA DE PANTALLA DE VENTANA O SECCIÓN)
   ========================================================= */

async function capturarElemento(elemento, nombreArchivoBase = "LotLab_Captura") {
    if (!elemento) return;

    // Ocultar botones de compartir/cerrar internos durante la captura
    const botonesOcultar = elemento.querySelectorAll(".compartir, .compartirSeccion, .cabeceraVentana");
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
            useCORS: true
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
        if (marcaAguaDerecha.parentNode) marcaAguaDerecha.parentNode.removeChild(marcaAguaDerecha);
        if (marcaAguaIzquierda.parentNode) marcaAguaIzquierda.parentNode.removeChild(marcaAguaIzquierda);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // Delegación global de eventos para botones de compartir (.compartir y .compartirSeccion)
    document.addEventListener("click", (e) => {
        const btnCompartir = e.target.closest(".compartir");
        if (btnCompartir) {
            const ventana = btnCompartir.closest(".ventana");
            if (ventana) capturarElemento(ventana, "LotLab_Captura");
            return;
        }

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
    });
});

