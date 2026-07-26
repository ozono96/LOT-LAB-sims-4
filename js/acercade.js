/* =========================================================
   ACERCA DE Y CARRUSEL YOUTUBE
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const botonAcercaDe = document.getElementById("botonAcercaDe");
    const carruselTrack = document.getElementById("carruselVideos");
    const carruselWrapper = document.querySelector(".carrusel-videos-wrapper");

    // IDs de los vídeos proporcionados por el usuario
    const videoIDs = [
        "9pZkYub2bUc",
        "p2AcmNNJyL4",
        "tYRgqTsAj4w",
        "ZmaXZFk0iNs",
        "Hxpdoo_lnwc",
        "SdL7_hgM73A",
        "mWw9CyfysMk",
        "65n8_WzLhao",
        "aq3f9XkyGXg",
        "3KWwAJsUzhY",
        "G2HRpJkjo0w"
    ];

    // Mezclar el array (Fisher-Yates) para que salgan aleatorios
    function mezclarArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function cargarVideos() {
        if (!carruselTrack) return;

        carruselTrack.innerHTML = "";
        const mezclados = mezclarArray([...videoIDs]);

        // Crear las miniaturas
        mezclados.forEach(id => {
            const a = document.createElement("a");
            a.href = `https://www.youtube.com/watch?v=${id}`;
            a.target = "_blank";
            a.className = "video-item";

            const img = document.createElement("img");
            img.src = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
            img.alt = "Vídeo de YouTube";

            const playIcon = document.createElement("div");
            playIcon.className = "play-icon";
            playIcon.innerHTML = "▶";

            a.appendChild(img);
            a.appendChild(playIcon);
            carruselTrack.appendChild(a);
        });

        // Duplicar para crear efecto de scroll infinito si el carrusel es ancho
        mezclados.forEach(id => {
            const a = document.createElement("a");
            a.href = `https://www.youtube.com/watch?v=${id}`;
            a.target = "_blank";
            a.className = "video-item";

            const img = document.createElement("img");
            img.src = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
            img.alt = "Vídeo de YouTube";

            const playIcon = document.createElement("div");
            playIcon.className = "play-icon";
            playIcon.innerHTML = "▶";

            a.appendChild(img);
            a.appendChild(playIcon);
            carruselTrack.appendChild(a);
        });

        // Tercera copia para el scroll infinito bidireccional
        mezclados.forEach(id => {
            const a = document.createElement("a");
            a.href = `https://www.youtube.com/watch?v=${id}`;
            a.target = "_blank";
            a.className = "video-item";

            const img = document.createElement("img");
            img.src = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
            img.alt = "Vídeo de YouTube";

            const playIcon = document.createElement("div");
            playIcon.className = "play-icon";
            playIcon.innerHTML = "▶";

            a.appendChild(img);
            a.appendChild(playIcon);
            carruselTrack.appendChild(a);
        });
    }

    // Configurar lógica del carrusel dinámico
    let position = 0;
    let speed = 0.5; // Velocidad base lenta
    let targetSpeed = 0.5;
    let animFrame = null;

    function animarCarrusel() {
        // Interpolar suavemente la velocidad
        speed += (targetSpeed - speed) * 0.1;

        position -= speed;

        if (carruselTrack) {
            // Tenemos 3 copias idénticas, por lo que el ancho de 1 copia es scrollWidth / 3
            const singleWidth = carruselTrack.scrollWidth / 3;

            if (singleWidth > 0) {
                // Si llegamos demasiado a la izquierda (pasamos la copia del centro)
                if (position <= -(singleWidth * 2)) {
                    position += singleWidth;
                }
                // Si llegamos demasiado a la derecha (pasamos la copia del centro)
                else if (position > -singleWidth) {
                    position -= singleWidth;
                }
            }

            carruselTrack.style.transform = `translateX(${position}px)`;
        }

        animFrame = requestAnimationFrame(animarCarrusel);
    }

    if (carruselWrapper) {
        carruselWrapper.addEventListener("mousemove", (e) => {
            const rect = carruselWrapper.getBoundingClientRect();
            // Calcular de -1 a 1 según el ratón (centro = 0, izq = -1, der = 1)
            const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;

            // Si el ratón está en los laterales, aumentar velocidad en esa dirección
            // targetSpeed positivo mueve hacia la izq, targetSpeed negativo mueve hacia la der
            // Si ratón a la derecha (x = 1), movemos pista hacia la izquierda (scroll a la derecha)
            // Velocidad máxima = 8

            // Si abs(x) es menor a 0.2 (centro), velocidad muy lenta 
            if (Math.abs(x) < 0.2) {
                targetSpeed = x > 0 ? 0.5 : -0.5;
            } else {
                // Acelera progresivamente hacia los bordes
                const multiplier = Math.pow(Math.abs(x), 2) * 10;
                targetSpeed = x > 0 ? multiplier : -multiplier;
            }
        });

        carruselWrapper.addEventListener("mouseleave", () => {
            // Vuelve a la velocidad base lenta
            targetSpeed = targetSpeed > 0 ? 0.5 : -0.5;
        });

             // Soporte táctil: arrastrar el carrusel con el dedo
let arrastrando = false;
let touchStartX = 0;
let touchStartPosition = 0;
let huboArrastre = false;

if (carruselWrapper) {

    carruselWrapper.addEventListener("touchstart", (e) => {
        arrastrando = true;
        huboArrastre = false;
        touchStartX = e.touches[0].clientX;
        touchStartPosition = position;
        if (animFrame) cancelAnimationFrame(animFrame);
    }, { passive: true });

    carruselWrapper.addEventListener("touchmove", (e) => {
        if (!arrastrando) return;

        const deltaX = e.touches[0].clientX - touchStartX;
        if (Math.abs(deltaX) > 5) huboArrastre = true;

        position = touchStartPosition + deltaX;

        if (carruselTrack) {
            const singleWidth = carruselTrack.scrollWidth / 3;
            if (singleWidth > 0) {
                if (position <= -(singleWidth * 2)) {
                    position += singleWidth;
                } else if (position > -singleWidth) {
                    position -= singleWidth;
                }
            }
            carruselTrack.style.transform = `translateX(${position}px)`;
        }
    }, { passive: true });

    carruselWrapper.addEventListener("touchend", () => {
        arrastrando = false;
        speed = 0.5;
        targetSpeed = 0.5;
        animarCarrusel();
    });

    // Evita abrir el vídeo por error si el usuario estaba arrastrando
    carruselWrapper.addEventListener("click", (e) => {
        if (huboArrastre) {
            e.preventDefault();
            e.stopPropagation();
        }
    }, true);
}  
    }


    if (botonAcercaDe) {
        botonAcercaDe.addEventListener("click", () => {
            cargarVideos(); // Recargar aleatorios al abrir
            abrirVentana("ventanaAcercaDe");
            position = 0;
            if (animFrame) cancelAnimationFrame(animFrame);
            animarCarrusel();
        });
    }

    // Abrir ventana por defecto si no hay hash en la URL que diga lo contrario
    // Se ejecuta con un pequeño timeout para asegurar que todo está cargado.
    setTimeout(() => {
        // Solo abrir si no se ha abierto ya otra ventana (ej: por un ID guardado)
        const ventanasAbiertas = document.querySelectorAll(".ventana[style*='display: block']");
        if (ventanasAbiertas.length === 0) {
            cargarVideos();
            abrirVentana("ventanaAcercaDe");
            position = 0;
            if (animFrame) cancelAnimationFrame(animFrame);
            animarCarrusel();
        }
    }, 100);

});
