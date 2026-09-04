/* ==========================================================================
   AGRADECIMIENTOS — LOT-LAB (Los Sims 4)
   Módulo para la ventana modal de créditos y agradecimientos.
   Completamente dinámico desde database.agradecimientos.
   ========================================================================== */

(function () {
    "use strict";

    let _datosRenderizados = false;

    /**
     * Normaliza cualquier fila de database.agradecimientos (array o estructura objeto)
     * Columna A: Nombre
     * Columna B: Categoría (Aportación, Pioneros)
     * Columna C: Red social (URL o vacío)
     * Columna D: ID (nombre de archivo de imagen con extensión)
     */
    function normalizarRegistro(fila) {
        if (!fila) return null;

        if (Array.isArray(fila)) {
            const nombre = String(fila[0] ?? "").trim();
            const categoria = String(fila[1] ?? "").trim();
            const redSocial = String(fila[2] ?? "").trim();
            const id = String(fila[3] ?? "").trim();
            if (!nombre && !id) return null;
            return { nombre, categoria, redSocial, id };
        }

        if (typeof fila === "object") {
            const nombre = String(fila.nombre ?? fila.Nombre ?? "").trim();
            const categoria = String(fila.categoria ?? fila.Categoría ?? fila.Categoria ?? "").trim();
            const redSocial = String(fila.redSocial ?? fila["Red social"] ?? fila.red_social ?? "").trim();
            const id = String(fila.id ?? fila.ID ?? "").trim();
            if (!nombre && !id) return null;
            return { nombre, categoria, redSocial, id };
        }

        return null;
    }

    /**
     * Construye un nodo de tarjeta para un colaborador
     */
    function crearTarjetaColaborador(c, esAportacionEspecial) {
        const tarjeta = document.createElement("div");
        tarjeta.className = esAportacionEspecial ? "tarjetaAportacion" : "tarjetaPionero";

        const tieneRedSocial = Boolean(
            c.redSocial &&
            c.redSocial.length > 0 &&
            c.redSocial !== "null" &&
            c.redSocial !== "undefined"
        );

        // Contenedor de la fotografía circular
        const wrapperFoto = document.createElement("div");
        wrapperFoto.className = "wrapperFotoColaborador";

        const img = document.createElement("img");
        img.className = "fotoColaborador";
        img.alt = c.nombre ? `Foto de ${c.nombre}` : "Colaborador";
        img.loading = "lazy";

        // Columna D es el nombre exacto del archivo
        img.src = `img/agradecimientos/${c.id}`;

        // Manejo defensivo si la imagen falla
        img.onerror = function () {
            if (!this.dataset.triedWebp && !this.src.endsWith(".webp")) {
                this.dataset.triedWebp = "true";
                this.src = this.src + ".webp";
                return;
            }
            this.onerror = null;
            this.classList.add("fotoFallback");
        };

        if (tieneRedSocial) {
            const enlaceFoto = document.createElement("a");
            enlaceFoto.href = c.redSocial;
            enlaceFoto.target = "_blank";
            enlaceFoto.rel = "noopener noreferrer";
            enlaceFoto.className = "enlaceFotoColaborador";
            enlaceFoto.title = `Visitar red social de ${c.nombre}`;
            enlaceFoto.setAttribute("aria-label", `Visitar red social de ${c.nombre}`);
            enlaceFoto.appendChild(img);
            wrapperFoto.appendChild(enlaceFoto);
        } else {
            wrapperFoto.appendChild(img);
        }

        tarjeta.appendChild(wrapperFoto);

        // Nombre del colaborador
        if (tieneRedSocial) {
            const enlaceNombre = document.createElement("a");
            enlaceNombre.href = c.redSocial;
            enlaceNombre.target = "_blank";
            enlaceNombre.rel = "noopener noreferrer";
            enlaceNombre.className = "nombreColaborador enlaceTexto";
            enlaceNombre.textContent = c.nombre;
            enlaceNombre.title = `Visitar red social de ${c.nombre}`;
            tarjeta.appendChild(enlaceNombre);
        } else {
            const spanNombre = document.createElement("span");
            spanNombre.className = "nombreColaborador";
            spanNombre.textContent = c.nombre;
            tarjeta.appendChild(spanNombre);
        }

        // Texto descriptivo obligatorio para categoría Aportación
        if (esAportacionEspecial) {
            const textoDesc = document.createElement("p");
            textoDesc.className = "textoAportacion";
            textoDesc.textContent = "Acceso previo y suministro del contenido visual puntual.";
            tarjeta.appendChild(textoDesc);
        }

        return tarjeta;
    }

    /**
     * Renderiza dinámicamente las secciones Aportación especial y Pioneros
     */
    function renderizarAgradecimientos() {
        const contenedorAportacion = document.getElementById("contenedorAportacion");
        const gridPioneros = document.getElementById("gridPioneros");
        const seccionAportacion = document.getElementById("seccionAportacionEspecial");
        const seccionPioneros = document.getElementById("seccionPioneros");

        if (!contenedorAportacion || !gridPioneros) return;

        const listaCruda = (window.database && Array.isArray(window.database.agradecimientos))
            ? window.database.agradecimientos
            : [];

        const colaboradores = listaCruda
            .map(normalizarRegistro)
            .filter(Boolean);

        // Filtrar estrictamente por los valores de Sheets
        const aportaciones = colaboradores.filter(c =>
            c.categoria.toLowerCase() === "aportación" || c.categoria.toLowerCase() === "aportacion"
        );
        const pioneros = colaboradores.filter(c =>
            c.categoria.toLowerCase() === "pioneros"
        );

        // Limpiar contenedores
        contenedorAportacion.innerHTML = "";
        gridPioneros.innerHTML = "";

        // Sección Aportación especial
        if (aportaciones.length > 0) {
            if (seccionAportacion) seccionAportacion.style.display = "";
            aportaciones.forEach(c => {
                contenedorAportacion.appendChild(crearTarjetaColaborador(c, true));
            });
        } else if (seccionAportacion) {
            seccionAportacion.style.display = "none";
        }

        // Sección Pioneros
        if (pioneros.length > 0) {
            if (seccionPioneros) seccionPioneros.style.display = "";
            pioneros.forEach(c => {
                gridPioneros.appendChild(crearTarjetaColaborador(c, false));
            });
        } else if (seccionPioneros) {
            seccionPioneros.style.display = "none";
        }

        _datosRenderizados = true;
    }

    /**
     * Abre el modal y lanza la animación de créditos cinematográficos
     */
    function abrirModalAgradecimientos() {
        const modal = document.getElementById("modalAgradecimientos");
        const cuerpo = document.getElementById("cuerpoModalAgradecimientos");
        const creditos = document.getElementById("creditosContenido");
        if (!modal || !cuerpo || !creditos) return;

        // Renderizar si aún no se ha hecho o si los datos cambiaron
        renderizarAgradecimientos();

        // Limpieza de scroll y estado de animación
        cuerpo.scrollTop = 0;
        creditos.classList.remove("creditos-animando", "creditos-estaticos");

        // Reflow forzado para reiniciar limpiamente la animación CSS
        void creditos.offsetWidth;

        // Iniciar animación cinematográfica
        creditos.classList.add("creditos-animando");

        modal.classList.add("activo");
        modal.style.display = "flex";
    }

    /**
     * Cierra el modal y restablece cualquier estado temporal
     */
    function cerrarModalAgradecimientos() {
        const modal = document.getElementById("modalAgradecimientos");
        const cuerpo = document.getElementById("cuerpoModalAgradecimientos");
        const creditos = document.getElementById("creditosContenido");
        if (!modal) return;

        modal.classList.remove("activo");
        modal.style.display = "none";

        if (creditos) {
            creditos.classList.remove("creditos-animando", "creditos-estaticos");
        }
        if (cuerpo) {
            cuerpo.scrollTop = 0;
        }
    }

    /**
     * Cancela la animación al instante y pasa el contenido a su posición estática
     */
    function saltarAnimacion() {
        const creditos = document.getElementById("creditosContenido");
        if (!creditos) return;
        creditos.classList.remove("creditos-animando");
        creditos.classList.add("creditos-estaticos");
    }

    /**
     * Inicialización de eventos e integración con la app
     */
    function inicializar() {
        const btnAbrir = document.getElementById("botonAgradecimientos");
        const btnCerrar = document.getElementById("cerrarModalAgradecimientosBtn");
        const overlay = document.getElementById("overlayAgradecimientos");
        const btnSaltar = document.getElementById("btnSaltarAnimacionAgradecimientos");
        const creditos = document.getElementById("creditosContenido");

        if (btnAbrir) {
            btnAbrir.addEventListener("click", abrirModalAgradecimientos);
        }

        if (btnCerrar) {
            btnCerrar.addEventListener("click", cerrarModalAgradecimientos);
        }

        if (overlay) {
            overlay.addEventListener("click", cerrarModalAgradecimientos);
        }

        const btnCaptura = document.getElementById("btnCapturaAgradecimientos");

        if (btnCaptura) {
            btnCaptura.addEventListener("click", () => {
                saltarAnimacion();
            });
        }

        if (btnSaltar) {
            btnSaltar.addEventListener("click", saltarAnimacion);
        }

        if (creditos) {
            creditos.addEventListener("animationend", () => {
                creditos.classList.remove("creditos-animando");
                creditos.classList.add("creditos-estaticos");
            });
        }

        // Cierre con Escape
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                const modal = document.getElementById("modalAgradecimientos");
                if (modal && modal.classList.contains("activo")) {
                    cerrarModalAgradecimientos();
                }
            }
        });

        // Actualizar cuando los datos de database.json terminen de cargarse
        document.addEventListener("datosCargados", () => {
            renderizarAgradecimientos();
        });
    }

    // Exponer helpers en window de forma limpia
    window.abrirModalAgradecimientos = abrirModalAgradecimientos;
    window.cerrarModalAgradecimientos = cerrarModalAgradecimientos;
    window.saltarAnimacionAgradecimientos = saltarAnimacion;

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", inicializar);
    } else {
        inicializar();
    }
})();
