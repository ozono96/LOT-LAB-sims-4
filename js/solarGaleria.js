/* =========================================================
   GALERÍA DE FOTOS DEL SOLAR
   Lee dinámicamente las fotos de cada carpeta img/solares/{ID}
   usando la API de GitHub. Funciona con cualquier nombre de
   archivo y reconoce carpetas/fotos nuevas automáticamente.
   ========================================================= */

const GITHUB_OWNER_GALERIA = "Ozono96";
const GITHUB_REPO_GALERIA = "LOT-LAB-sims-4";
const GITHUB_BRANCH_GALERIA = "main";

let fotosGaleriaActual = [];
let indiceGaleriaActual = 0;

async function obtenerFotosSolar(idSolar, intento = 1) {
    const url = `https://api.github.com/repos/${GITHUB_OWNER_GALERIA}/${GITHUB_REPO_GALERIA}/contents/img/solares/${encodeURIComponent(idSolar)}?ref=${GITHUB_BRANCH_GALERIA}`;

    // Usar token de GitHub si está configurado (sube el límite de 60 a 5000 req/hora)
    const headers = {};
    const token = (typeof CONFIG !== "undefined" && CONFIG.GITHUB_TOKEN) ? CONFIG.GITHUB_TOKEN : "";
    if (token) {
        headers["Authorization"] = `token ${token}`;
    }

    try {
        const respuesta = await fetch(url, { headers });

        // 404 real: carpeta no existe en el repo
        if (respuesta.status === 404) {
            return { fotos: [], error: false, sinFotos: true };
        }

        // Rate limit agotado
        if (respuesta.status === 403 || respuesta.status === 429) {
            const resetHeader = respuesta.headers.get("X-RateLimit-Reset");
            const resetMs = resetHeader ? (parseInt(resetHeader) * 1000 - Date.now()) : 0;
            const minutos = resetMs > 0 ? Math.ceil(resetMs / 60000) : "unos";
            console.warn(`[Galería] Rate limit de GitHub alcanzado para ${idSolar}. Se restablece en ${minutos} minuto(s). Crea un token en config.js para evitar este límite.`);
            return { fotos: [], error: true, rateLimitado: true, minutos };
        }

        // Otros errores HTTP → reintento automático una vez
        if (!respuesta.ok) {
            if (intento < 2) {
                console.warn(`[Galería] Error ${respuesta.status} al cargar fotos de ${idSolar}. Reintentando...`);
                await new Promise(r => setTimeout(r, 1500));
                return obtenerFotosSolar(idSolar, intento + 1);
            }
            console.error("[Galería] Error al consultar fotos del solar:", respuesta.status);
            return { fotos: [], error: true };
        }

        const datos = await respuesta.json();

        if (!Array.isArray(datos)) {
            return { fotos: [], error: false, sinFotos: true };
        }

        const fotos = datos
            .filter(item => item.type === "file" && /\.(png|jpg|jpeg|webp)$/i.test(item.name))
            .sort((a, b) => a.name.localeCompare(b.name, "es", { numeric: true }))
            .map(item => item.download_url);

        return { fotos, error: false };

    } catch (error) {
        // Error de red → reintento automático una vez
        if (intento < 2) {
            console.warn(`[Galería] Error de red al cargar fotos de ${idSolar}. Reintentando...`, error);
            await new Promise(r => setTimeout(r, 1500));
            return obtenerFotosSolar(idSolar, intento + 1);
        }
        console.error("[Galería] Error cargando fotos del solar:", idSolar, error);
        return { fotos: [], error: true };
    }
}

async function cargarGaleriaSolar(idSolar) {
    const contenedor = document.getElementById("galeriaFichaSolar");
    if (!contenedor) return;

    contenedor.innerHTML = `<div class="galeriaCargando">Cargando fotos...</div>`;

    const resultado = await obtenerFotosSolar(idSolar);

    // Si el usuario ya cerró/cambió de ficha mientras cargaba, no pintamos nada desactualizado
    if (!document.getElementById("galeriaFichaSolar")) return;

    if (resultado.rateLimitado) {
        contenedor.innerHTML = `<div class="galeriaNoDisponible">⏳ Límite de la API de GitHub alcanzado. Las fotos estarán disponibles en ${resultado.minutos} minuto(s).<br><small>Configura un token en config.js para evitar este problema.</small></div>`;
        return;
    }

    if (resultado.error) {
        contenedor.innerHTML = `<div class="galeriaNoDisponible">⚠️ No se pudieron cargar las fotos. Inténtalo de nuevo más tarde.</div>`;
        return;
    }

    if (resultado.fotos.length === 0) {
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
    const mostrarFlechas = total > 1;

    contenedor.innerHTML = `
        <div class="galeriaSolar">
            <div class="galeriaImagenContenedor">
                ${mostrarFlechas ? `<button class="galeriaFlecha galeriaFlechaIzq" onclick="cambiarFotoGaleria(-1)">‹</button>` : ""}
                <img
                    src="${fotosGaleriaActual[indiceGaleriaActual]}"
                    class="galeriaImagenActual"
                    id="imgGaleriaActual"
                    alt="Foto del solar"
                    onclick="toggleAmpliarGaleria(this)"
                >
                ${mostrarFlechas ? `<button class="galeriaFlecha galeriaFlechaDer" onclick="cambiarFotoGaleria(1)">›</button>` : ""}
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
}

function actualizarGaleriaUI() {
    const contenedor = document.getElementById("galeriaFichaSolar");
    if (!contenedor) return;
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