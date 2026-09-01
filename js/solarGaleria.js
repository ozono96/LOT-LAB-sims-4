let fotosGaleriaActual = [];
let indiceGaleriaActual = 0;
let _manifestSolares = null;
let _promesaCargaManifest = null;

async function cargarManifestSolares() {
    if (_manifestSolares) return _manifestSolares;
    if (_promesaCargaManifest) return _promesaCargaManifest;

    _promesaCargaManifest = (async () => {
        try {
            const respuesta = await fetch("img/solares/manifest.json");
            if (!respuesta.ok) {
                console.warn("[Galería] No se pudo cargar img/solares/manifest.json (status: " + respuesta.status + ")");
                _manifestSolares = {};
                return _manifestSolares;
            }
            _manifestSolares = await respuesta.json();
            return _manifestSolares;
        } catch (err) {
            console.warn("[Galería] Error al cargar el manifest de solares:", err);
            _manifestSolares = {};
            return _manifestSolares;
        } finally {
            _promesaCargaManifest = null;
        }
    })();

    return _promesaCargaManifest;
}

// Carga diferida (lazy loading): el manifest se carga la primera vez que se abre una ficha.
// Además, cuando los datos esenciales han terminado de cargarse (evento "datosCargados"),
// se precalienta el manifest en segundo plano para que esté listo antes de que el usuario
// abra su primer solar. Este listener es { once: true } y no bloquea window.load ni la
// pantalla de carga en ningún caso.
document.addEventListener("datosCargados", function () {
    cargarManifestSolares();
}, { once: true });


async function obtenerFotosSolar(idSolar) {
    if (!idSolar) return { fotos: [], error: false, sinFotos: true };

    const manifest = await cargarManifestSolares();
    const idLimpio = String(idSolar).trim();
    const lista = manifest[idLimpio] || [];

    if (!Array.isArray(lista) || lista.length === 0) {
        return { fotos: [], error: false, sinFotos: true };
    }

    return { fotos: lista, error: false };
}

async function cargarGaleriaSolar(idSolar) {
    const contenedor = document.getElementById("galeriaFichaSolar");
    if (!contenedor) return;

    contenedor.innerHTML = `<div class="galeriaCargando">Cargando fotos...</div>`;

    const resultado = await obtenerFotosSolar(idSolar);

    // Si el usuario ya cerró/cambió de ficha mientras cargaba, no pintamos nada desactualizado
    if (!document.getElementById("galeriaFichaSolar")) return;

    if (resultado.error) {
        contenedor.innerHTML = `<div class="galeriaNoDisponible">⚠️ No se pudieron cargar las fotos. Inténtalo de nuevo más tarde.</div>`;
        return;
    }

    if (!resultado.fotos || resultado.fotos.length === 0) {
        contenedor.innerHTML = `<div class="galeriaNoDisponible">📷 FOTO NO DISPONIBLE</div>`;
        return;
    }

    fotosGaleriaActual = resultado.fotos;
    indiceGaleriaActual = 0;

    renderizarGaleria(contenedor);
}

/* Genera los puntos de navegación tipo "sliding window":
   Muestra siempre un máximo de MAX_PUNTOS puntos.
   La ventana visible se desplaza para mantener el punto activo
   dentro, con al menos 1 punto de margen a cada lado si es posible. */
function generarPuntosSliding(total, activo) {
    const MAX_PUNTOS = 5;

    if (total <= MAX_PUNTOS) {
        // Todos los puntos caben: mostrarlos todos
        return Array.from({ length: total }, (_, i) => `
            <button
                class="puntoGaleria ${i === activo ? "activo" : ""}"
                onclick="irAFotoGaleria(${i})"
                aria-label="Foto ${i + 1}"
            ></button>
        `).join("");
    }

    // Calcular inicio de la ventana deslizante
    // Intentamos centrar el punto activo dentro de la ventana
    const mitad = Math.floor(MAX_PUNTOS / 2);
    let inicio = activo - mitad;

    // Limitar para no salirse del rango
    if (inicio < 0) inicio = 0;
    if (inicio + MAX_PUNTOS > total) inicio = total - MAX_PUNTOS;

    let html = "";
    for (let i = inicio; i < inicio + MAX_PUNTOS; i++) {
        // Primer o último punto de la ventana → punto pequeño como indicador de "hay más"
        const esBorde = (i === inicio && inicio > 0) || (i === inicio + MAX_PUNTOS - 1 && inicio + MAX_PUNTOS < total);
        html += `
            <button
                class="puntoGaleria ${i === activo ? "activo" : ""} ${esBorde ? "borde" : ""}"
                onclick="irAFotoGaleria(${i})"
                aria-label="Foto ${i + 1}"
            ></button>
        `;
    }
    return html;
}

function renderizarGaleria(contenedor) {
    const total = fotosGaleriaActual.length;
    const mostrarPuntos = total > 1;
    const mostrarContador = total > 5;

    contenedor.innerHTML = `
        <div class="galeriaSolar">
            <div class="galeriaImagenContenedor" id="galeriaImagenContenedor">
                <img
                    src="${fotosGaleriaActual[indiceGaleriaActual]}"
                    class="galeriaImagenActual"
                    id="imgGaleriaActual"
                    alt="Foto del solar"
                    onclick="toggleAmpliarGaleria(this)"
                >
            </div>

            ${mostrarPuntos ? `
                <div class="galeriaPuntos" id="galeriaPuntos">
                    ${generarPuntosSliding(total, indiceGaleriaActual)}
                </div>
            ` : ""}

            ${mostrarContador ? `<div class="galeriaContador" id="galeriaContador">${indiceGaleriaActual + 1} / ${total}</div>` : ""}
        </div>

        <div class="galeriaBackdrop" id="galeriaBackdrop" onclick="cerrarAmpliarGaleria()"></div>
    `;

    activarGestosGaleria();
}

function activarGestosGaleria() {
    const contenedorImg = document.getElementById("galeriaImagenContenedor");
    if (!contenedorImg) return;

    // ── Rueda del ratón (escritorio) ──
    let bloqueoWheel = false;

    contenedorImg.addEventListener("wheel", (e) => {
        if (fotosGaleriaActual.length <= 1) return;

        e.preventDefault();
        if (bloqueoWheel) return;
        bloqueoWheel = true;

        const direccion = (e.deltaY > 0 || e.deltaX > 0) ? 1 : -1;
        cambiarFotoGaleria(direccion);

        setTimeout(() => { bloqueoWheel = false; }, 350);
    }, { passive: false });

    // ── Gesto de deslizar el dedo (móvil) ──
    let touchStartX = 0;
    let touchStartY = 0;

    contenedorImg.addEventListener("touchstart", (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    contenedorImg.addEventListener("touchend", (e) => {
        if (fotosGaleriaActual.length <= 1) return;

        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;

        // Solo si el gesto es principalmente horizontal (evita interferir con el scroll vertical de la página)
        if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
            cambiarFotoGaleria(deltaX < 0 ? 1 : -1);
        }
    }, { passive: true });
}

function actualizarGaleriaUI() {
    const contenedor = document.getElementById("galeriaFichaSolar");
    if (!contenedor) return;

    const img = document.getElementById("imgGaleriaActual");
    const puntosContenedor = document.getElementById("galeriaPuntos");
    const contador = document.getElementById("galeriaContador");
    const total = fotosGaleriaActual.length;

    // Si la estructura ya está montada en el DOM, actualizamos solo los datos necesarios
    if (img && total > 0) {
        img.src = fotosGaleriaActual[indiceGaleriaActual] || "";

        if (puntosContenedor && total > 1) {
            puntosContenedor.innerHTML = generarPuntosSliding(total, indiceGaleriaActual);
        }

        if (contador) {
            contador.textContent = `${indiceGaleriaActual + 1} / ${total}`;
        }
        return;
    }

    renderizarGaleria(contenedor);
}

function cambiarFotoGaleria(direccion) {
    const total = fotosGaleriaActual.length;
    if (total === 0) return;

    indiceGaleriaActual = (indiceGaleriaActual + direccion + total) % total;
    actualizarGaleriaUI();
}

function irAFotoGaleria(indice) {
    indiceGaleriaActual = indice;
    actualizarGaleriaUI();
}

function toggleAmpliarGaleria(img) {
    const backdrop = document.getElementById("galeriaBackdrop");

    if (img.classList.contains("ampliada")) {
        img.classList.remove("ampliada");
        if (backdrop) backdrop.classList.remove("activo");
        document.body.classList.remove("galeria-ampliada");
    } else {
        img.classList.add("ampliada");
        if (backdrop) backdrop.classList.add("activo");
        document.body.classList.add("galeria-ampliada");
    }
}

function cerrarAmpliarGaleria() {
    const img = document.getElementById("imgGaleriaActual");
    const backdrop = document.getElementById("galeriaBackdrop");

    if (img) img.classList.remove("ampliada");
    if (backdrop) backdrop.classList.remove("activo");
    document.body.classList.remove("galeria-ampliada");
}