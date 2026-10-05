/* =========================================================
   ACERCA DE Y CARRUSEL YOUTUBE
   Soporte dinámico para múltiples carruseles, vídeos y playlists
   FASE 2.8C — LOT-LAB
   ========================================================= */

(function() {

    const botonAcercaDe = document.getElementById("botonAcercaDe");

    // IDs de vídeos por defecto (fallback)
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

    // Mezclar el array (Fisher-Yates) para fallback
    function mezclarArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function inicializarUnCarrusel(wrapper, items) {
        if (!wrapper) return;
        const track = wrapper.querySelector(".carrusel-videos-track");
        if (!track) return;

        // Normalizar items a lista de objetos { tipo, youtubeId / playlistId }
        let listaItems = [];
        if (items && Array.isArray(items) && items.length > 0) {
            listaItems = items.map(it => {
                if (typeof it === "string") return { tipo: "video", youtubeId: it };
                return it;
            });
        } else if (track.children.length === 0) {
            listaItems = mezclarArray([...videoIDs]).map(id => ({ tipo: "video", youtubeId: id }));
        }

        function crearElemento(it) {
            const a = document.createElement("a");
            a.target = "_blank";
            a.className = "video-item";

            if (it.tipo === "playlist") {
                const pId = it.playlistId || it.id || "";
                const nombrePl = it.playlistTitle ? String(it.playlistTitle) : (it.titulo ? String(it.titulo) : (it.nombre ? String(it.nombre) : ""));
                a.href = `https://www.youtube.com/playlist?list=${pId}`;
                a.className += " video-item--playlist";
                const cover = it.coverUrl || (it.coverVideoId ? `https://img.youtube.com/vi/${it.coverVideoId}/hqdefault.jpg` : "");
                const bgFallback = `<div style="width:100%;height:100%;background:linear-gradient(135deg,#151c2e,#0d3b66);display:flex;align-items:center;justify-content:center;color:rgba(255,213,74,0.3);font-size:3rem;">📑</div>`;
                a.innerHTML = (cover
                    ? `<img src="${cover}" alt="${nombrePl}" loading="lazy" decoding="async">`
                    : bgFallback) +
                    `<div class="playlist-overlay-center" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;pointer-events:none;z-index:2;">` +
                        `<div class="play-icon" style="position:static;transform:none;margin:0;">▶</div>` +
                        `<div class="playlist-badge-box" style="background:rgba(15,17,23,0.92);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);color:#ffd54a;border:1px solid rgba(255,213,74,0.5);padding:3px 9px;border-radius:6px;text-align:center;max-width:88%;box-shadow:0 3px 8px rgba(0,0,0,0.6);">` +
                            `<div style="font-size:0.62rem;font-weight:800;letter-spacing:0.5px;color:#ffd54a;">▶ PLAYLIST</div>` +
                            (nombrePl ? `<div style="font-size:0.72rem;font-weight:600;color:#ffffff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:1px;max-width:140px;">${nombrePl}</div>` : '') +
                        `</div>` +
                    `</div>`;
            } else {
                const yId = it.youtubeId || it.id || "";
                a.href = `https://www.youtube.com/watch?v=${yId}`;
                a.innerHTML = `<img src="https://img.youtube.com/vi/${yId}/hqdefault.jpg" alt="Vídeo de YouTube" loading="lazy" decoding="async">` +
                    `<div class="play-icon">▶</div>`;
            }
            return a;
        }

        if (track.children.length === 0 && listaItems.length > 0) {
            track.innerHTML = "";
            // 3 copias para el scroll infinito suave
            for (let pass = 0; pass < 3; pass++) {
                listaItems.forEach(it => {
                    track.appendChild(crearElemento(it));
                });
            }
        }

        if (wrapper._carruselIniciado) return;
        wrapper._carruselIniciado = true;

        let position = 0;
        let speed = 0.5;
        let targetSpeed = 0.5;
        let animFrame = null;

        function animar() {
            speed += (targetSpeed - speed) * 0.1;
            position -= speed;
            const singleWidth = track.scrollWidth / 3;
            if (singleWidth > 0) {
                if (position <= -(singleWidth * 2)) position += singleWidth;
                else if (position > -singleWidth) position -= singleWidth;
            }
            track.style.transform = `translateX(${position}px)`;
            animFrame = requestAnimationFrame(animar);
        }

        wrapper.addEventListener("mousemove", (e) => {
            const rect = wrapper.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            if (Math.abs(x) < 0.2) targetSpeed = x > 0 ? 0.5 : -0.5;
            else {
                const mult = Math.pow(Math.abs(x), 2) * 10;
                targetSpeed = x > 0 ? mult : -mult;
            }
        });

        wrapper.addEventListener("mouseleave", () => {
            targetSpeed = targetSpeed > 0 ? 0.5 : -0.5;
        });

        let arrastrando = false;
        let touchStartX = 0;
        let touchStartPos = 0;
        let huboArrastre = false;

        wrapper.addEventListener("touchstart", (e) => {
            arrastrando = true;
            huboArrastre = false;
            touchStartX = e.touches[0].clientX;
            touchStartPos = position;
            if (animFrame) cancelAnimationFrame(animFrame);
        }, { passive: true });

        wrapper.addEventListener("touchmove", (e) => {
            if (!arrastrando) return;
            const deltaX = e.touches[0].clientX - touchStartX;
            if (Math.abs(deltaX) > 5) huboArrastre = true;
            position = touchStartPos + deltaX;
            const singleWidth = track.scrollWidth / 3;
            if (singleWidth > 0) {
                if (position <= -(singleWidth * 2)) position += singleWidth;
                else if (position > -singleWidth) position -= singleWidth;
            }
            track.style.transform = `translateX(${position}px)`;
        }, { passive: true });

        wrapper.addEventListener("touchend", () => {
            arrastrando = false;
            speed = 0.5;
            targetSpeed = 0.5;
            animar();
        });

        wrapper.addEventListener("click", (e) => {
            if (huboArrastre) {
                e.preventDefault();
                e.stopPropagation();
            }
        }, true);

        setTimeout(() => { animar(); }, 60);
    }

    window.inicializarCarruselAcercaDe = function(root) {
        const base = root || document;
        const wrappers = base.querySelectorAll(".carrusel-videos-wrapper");
        if (!wrappers || wrappers.length === 0) return;

        const carruselesConfig = window._acercaDeCarousels || [];

        wrappers.forEach(wrap => {
            if (wrap.style.display === "none") return;
            const cId = wrap.dataset.carruselId;
            let items = null;
            if (cId && carruselesConfig.length > 0) {
                const found = carruselesConfig.find(c => c.id === cId);
                if (found) items = found.items || found.videos;
            }
            if (!items && carruselesConfig.length > 0) {
                items = carruselesConfig[0].items || carruselesConfig[0].videos;
            }
            if (!items && window._acercaDeVideoIDs) {
                items = window._acercaDeVideoIDs;
            }
            inicializarUnCarrusel(wrap, items);
        });
    };

    if (botonAcercaDe) {
        botonAcercaDe.addEventListener("click", () => {
            window.inicializarCarruselAcercaDe();
            abrirVentana("ventanaAcercaDe", true);
        });
    }

})();
