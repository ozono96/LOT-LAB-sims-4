/* =========================================================
   COMPARTIR (CAPTURA DE PANTALLA)
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    const botonesCompartir = document.querySelectorAll(".compartir");

    botonesCompartir.forEach(boton => {
        boton.addEventListener("click", async function() {
            const ventana = this.closest(".ventana");
            if (!ventana) return;

            // Ocultamos la cabecera (botones de cerrar/compartir) para que no salgan en la foto
            const cabecera = ventana.querySelector(".cabeceraVentana");
            let displayOriginal = "";
            if (cabecera) {
                displayOriginal = cabecera.style.display;
                cabecera.style.display = "none";
            }
            
            // Cambiamos estilos temporalmente para asegurar un buen render
            const boxshadowOriginal = ventana.style.boxShadow;
            ventana.style.boxShadow = "none";
            
            // Añadir marca de agua derecha (Autor)
            const marcaAguaDerecha = document.createElement("div");
            marcaAguaDerecha.textContent = "Creado por Ozono 96";
            marcaAguaDerecha.style.position = "absolute";
            marcaAguaDerecha.style.bottom = "10px";
            marcaAguaDerecha.style.right = "15px";
            marcaAguaDerecha.style.fontSize = "0.9rem";
            marcaAguaDerecha.style.opacity = "0.7";
            marcaAguaDerecha.style.color = "var(--color-texto)";
            marcaAguaDerecha.style.fontWeight = "bold";
            marcaAguaDerecha.style.zIndex = "9999";
            marcaAguaDerecha.style.pointerEvents = "none";
            ventana.appendChild(marcaAguaDerecha);
            
            // Añadir marca de agua izquierda (Nombre de la app)
            const marcaAguaIzquierda = document.createElement("div");
            marcaAguaIzquierda.textContent = "LOT-LAB Sims 4";
            marcaAguaIzquierda.style.position = "absolute";
            marcaAguaIzquierda.style.bottom = "10px";
            marcaAguaIzquierda.style.left = "15px";
            marcaAguaIzquierda.style.fontSize = "0.9rem";
            marcaAguaIzquierda.style.opacity = "0.7";
            marcaAguaIzquierda.style.color = "var(--color-texto)";
            marcaAguaIzquierda.style.fontWeight = "bold";
            marcaAguaIzquierda.style.zIndex = "9999";
            marcaAguaIzquierda.style.pointerEvents = "none";
            ventana.appendChild(marcaAguaIzquierda);
            
            // Pausa breve para que el navegador aplique los cambios visuales
            await new Promise(r => setTimeout(r, 100));
            
            try {
                if (typeof html2canvas === 'undefined') {
                    console.error("html2canvas no está cargado.");
                    return;
                }

                // Generar el canvas a partir del DOM
                const canvas = await html2canvas(ventana, {
                    scale: 2, // Alta calidad
                    backgroundColor: null, // Mantiene transparencias si las hay
                    useCORS: true // Para cargar imágenes externas si las hay (hojas de sheets)
                });

                // Convertir a PNG
                const imageURL = canvas.toDataURL("image/png");

                // Crear un enlace temporal para descargar la imagen
                const link = document.createElement("a");
                link.href = imageURL;
                // Nombre de archivo único usando la fecha actual
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                link.download = `LotLab_Reto_${timestamp}.png`;
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
            } catch (error) {
                console.error("Error al capturar la pantalla: ", error);
                alert("Ocurrió un error al intentar capturar la pantalla. Comprueba la consola.");
            } finally {
                // Restaurar los elementos ocultos
                if (cabecera) {
                    cabecera.style.display = displayOriginal;
                }
                ventana.style.boxShadow = boxshadowOriginal;
                // Eliminar las marcas de agua
                if (marcaAguaDerecha && marcaAguaDerecha.parentNode) {
                    marcaAguaDerecha.parentNode.removeChild(marcaAguaDerecha);
                }
                if (marcaAguaIzquierda && marcaAguaIzquierda.parentNode) {
                    marcaAguaIzquierda.parentNode.removeChild(marcaAguaIzquierda);
                }
            }
        });
    });
});
