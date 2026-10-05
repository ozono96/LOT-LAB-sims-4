/* =========================================================
   ACERCADE-CMS.JS — Carga editorial de "Acerca de" desde JSON
   FASE 2.6C — Conexión CMS → Web LOT-LAB (solo Acerca de)

   Flujo:
     fetch("data/content/acerca-de.json")
       → éxito: rellena #acercaDeH2 y #acercaDeContenido
               + expone window._acercaDeVideoIDs para acercade.js
       → error:  fallback silencioso (el HTML estático de index.html queda intacto)

   La web NO depende del servidor CMS (localhost:4000).
   Compatible con GitHub Pages (rutas relativas).
   ========================================================= */

(function () {
    "use strict";

    /* ── Escape básico de HTML para seguridad ── */
    function esc(s) {
        return String(s || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    /* ── Helper: Renderizador de Encuadre Universal de Imagen para Web Pública ── */
    function renderImagenFramedPublic(b) {
        if (!b || !b.url) return "";
        var forma = b.forma || "original";
        var zoom = (b.zoom !== undefined && b.zoom !== null) ? parseFloat(b.zoom) : 1.0;
        var posX = (b.posX !== undefined && b.posX !== null) ? parseInt(b.posX, 10) : 50;
        var posY = (b.posY !== undefined && b.posY !== null) ? parseInt(b.posY, 10) : 50;
        var ancho = b.ancho || "";

        var frameStyle = "position:relative;overflow:hidden;display:inline-block;box-sizing:border-box;vertical-align:middle;";
        var imgStyle = "display:block;width:100%;height:100%;transition:transform 0.25s ease;";

        if (ancho) frameStyle += "width:" + esc(ancho) + ";max-width:100%;";
        else frameStyle += "max-width:100%;";

        var formaClass = "forma-" + forma;
        if (forma === "cuadrado") {
            frameStyle += "aspect-ratio:1/1;border-radius:12px;";
            imgStyle += "object-fit:cover;object-position:" + posX + "% " + posY + "%;transform:scale(" + zoom + ");transform-origin:" + posX + "% " + posY + "%;";
        } else if (forma === "redondo") {
            frameStyle += "aspect-ratio:1/1;border-radius:50%;";
            imgStyle += "object-fit:cover;object-position:" + posX + "% " + posY + "%;transform:scale(" + zoom + ");transform-origin:" + posX + "% " + posY + "%;";
        } else if (forma === "horizontal") {
            frameStyle += "aspect-ratio:16/9;border-radius:12px;";
            imgStyle += "object-fit:cover;object-position:" + posX + "% " + posY + "%;transform:scale(" + zoom + ");transform-origin:" + posX + "% " + posY + "%;";
        } else if (forma === "vertical") {
            frameStyle += "aspect-ratio:3/4;border-radius:12px;";
            imgStyle += "object-fit:cover;object-position:" + posX + "% " + posY + "%;transform:scale(" + zoom + ");transform-origin:" + posX + "% " + posY + "%;";
        } else {
            frameStyle += "border-radius:10px;";
            imgStyle += "height:auto;object-fit:contain;";
            if (zoom > 1.0) {
                imgStyle += "transform:scale(" + zoom + ");transform-origin:" + posX + "% " + posY + "%;";
            }
        }

        // Glow verde adaptativo en el marco exterior visible
        var glowClass = b.hoverGlow ? " has-hover-glow" : "";

        // Capa base
        var baseImg = '<img src="' + esc(b.url) + '" alt="' + esc(b.alt || "Imagen LOT-LAB") + '" class="ve-img-layer ve-img-layer-base" style="' + imgStyle + '" loading="lazy">';

        // Capa hover opcional (mantiene fijo el contenedor y hace fade suave de opacidad)
        var hoverImg = "";
        if (b.hoverUrl) {
            var hZoom = (b.hoverZoom !== undefined && b.hoverZoom !== null) ? parseFloat(b.hoverZoom) : 1.0;
            var hPosX = (b.hoverPosX !== undefined && b.hoverPosX !== null) ? parseInt(b.hoverPosX, 10) : 50;
            var hPosY = (b.hoverPosY !== undefined && b.hoverPosY !== null) ? parseInt(b.hoverPosY, 10) : 50;
            var hoverFit = (forma === "original")
                ? ("object-fit:contain;" + (hZoom > 1.0 ? "transform:scale(" + hZoom + ");transform-origin:" + hPosX + "% " + hPosY + "%;" : ""))
                : ("object-fit:cover;object-position:" + hPosX + "% " + hPosY + "%;transform:scale(" + hZoom + ");transform-origin:" + hPosX + "% " + hPosY + "%;");
            hoverImg = '<img src="' + esc(b.hoverUrl) + '" alt="' + esc(b.alt || "Imagen LOT-LAB") + ' (hover)" class="ve-img-layer ve-img-layer-hover" style="position:absolute;inset:0;width:100%;height:100%;' + hoverFit + 'opacity:0;pointer-events:none;transition:opacity 0.22s ease;" loading="lazy">';
        }

        var frameHtml = '<div class="ve-img-frame ' + formaClass + glowClass + '" style="' + frameStyle + '">' + baseImg + hoverImg + '</div>';

        if (b.linkUrl) {
            frameHtml = '<a href="' + esc(b.linkUrl) + '" target="_blank" rel="noopener noreferrer" style="display:inline-block;text-decoration:none;">' + frameHtml + '</a>';
        }
        return frameHtml;
    }

    /* ── Convierte bloques editoriales a HTML con clases de LOT-LAB ── */
        function renderFotoGaleriaHTML(img) {
        if (!img || !img.url) return '';
        var posX = (img.posX !== undefined && img.posX !== null) ? parseInt(img.posX, 10) : 50;
        var posY = (img.posY !== undefined && img.posY !== null) ? parseInt(img.posY, 10) : 50;
        var zoom = (img.zoom !== undefined && img.zoom !== null) ? parseFloat(img.zoom) : 1.0;
        var html = '<img src="' + esc(img.url) + '" alt="' + esc(img.alt || 'Foto de galería') + '" class="ve-img-layer ve-img-layer-base galeriaImagenActual" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:' + posX + '% ' + posY + '%;transform:scale(' + zoom + ');transform-origin:' + posX + '% ' + posY + '%;display:block;">';
        if (img.hoverUrl) {
            var hPosX = (img.hoverPosX !== undefined && img.hoverPosX !== null) ? parseInt(img.hoverPosX, 10) : 50;
            var hPosY = (img.hoverPosY !== undefined && img.hoverPosY !== null) ? parseInt(img.hoverPosY, 10) : 50;
            var hZoom = (img.hoverZoom !== undefined && img.hoverZoom !== null) ? parseFloat(img.hoverZoom) : 1.0;
            html += '<img src="' + esc(img.hoverUrl) + '" alt="Hover" class="ve-img-layer ve-img-layer-hover" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:' + hPosX + '% ' + hPosY + '%;transform:scale(' + hZoom + ');transform-origin:' + hPosX + '% ' + hPosY + '%;opacity:0;transition:opacity 0.3s ease;display:block;">';
        }
        return html;
    }

    function renderizarBloques(bloques) {
        var html = "";

        bloques.forEach(function (b) {
            switch (b.tipo) {

                case "titulo":
                    // El h2 principal ya va a la cabeceraVentana (nivel 2).
                    // Aquí solo renderizamos subtítulos (h3, h4…).
                    if ((b.nivel || 2) >= 3) {
                        var fontStyle = b.fontSize ? ("font-size:" + b.fontSize + ";") : "font-size:1.4rem;";
                        var alignStyle = b.textAlign ? ("text-align:" + b.textAlign + ";") : "";
                        var titDimStyle = (b.ancho ? "width:" + b.ancho + ";max-width:100%;box-sizing:border-box;" : "") +
                                          (b.alto  ? "min-height:" + b.alto + ";" : "");
                        var contTit = b.contenido || "";
                        var titHtml = /<[a-z][\s\S]*>/i.test(contTit) ? contTit : esc(contTit);
                        html += "<h" + b.nivel + ' class="subtitulo-acerca" style="' + fontStyle + alignStyle + titDimStyle + 'margin-bottom:12px;line-height:1.3;">'
                            + titHtml
                            + "</h" + b.nivel + ">\n";
                    }
                    break;

                case "texto":
                    var contenidoTexto = b.contenido || "";
                    var textoAlignStyle = b.textAlign ? ("text-align:" + b.textAlign + ";") : "";
                    var textoDimStyle = "";
                    if (b.ancho) textoDimStyle += "width:" + b.ancho + ";max-width:100%;box-sizing:border-box;";
                    if (b.alto)  textoDimStyle += "min-height:" + b.alto + ";";
                    if (!/<[a-z][\s\S]*>/i.test(contenidoTexto)) {
                        var parrafos = contenidoTexto.split(/\n\n+/);
                        parrafos.forEach(function (p) {
                            var pEsc = esc(p).replace(/\n/g, "<br>");
                            html += '<p style="margin-bottom:12px;' + textoAlignStyle + textoDimStyle + '">' + pEsc + "</p>\n";
                        });
                    } else {
                        html += '<p style="margin-bottom:12px;' + textoAlignStyle + textoDimStyle + '">' + contenidoTexto + "</p>\n";
                    }
                    break;

                case "separador":
                    html += '<hr class="separador-bloque" style="border:0;height:1px;background:var(--borde, rgba(255,255,255,0.35));margin:20px 0;">\n';
                    break;

                case "espacio":
                    var hEsp = b.altura ? (b.altura.indexOf("px") !== -1 ? b.altura : b.altura + "px") : "32px";
                    html += '<div class="espacio-bloque" style="height:' + esc(hEsp) + ';"></div>\n';
                    break;

                case "carrusel-videos":
                    var carruselId = b.id || ("carrusel_" + Date.now());
                    var titC = b.titulo ? '<h3 style="font-size:1.25rem;margin:24px 0 10px 0;">' + esc(b.titulo) + '</h3>\n' : '';
                    if (!window._acercaDeCarousels) window._acercaDeCarousels = [];
                    var existeC = false;
                    for (var ki = 0; ki < window._acercaDeCarousels.length; ki++) {
                        if (window._acercaDeCarousels[ki].id === carruselId) { existeC = true; break; }
                    }
                    if (!existeC) window._acercaDeCarousels.push(b);

                    var cItems = (Array.isArray(b.items) && b.items.length) ? b.items : ((Array.isArray(b.videos) && b.videos.length) ? b.videos : []);
                    var itemsHTML = "";
                    if (cItems.length > 0) {
                        var renderUnItem = function(it) {
                            if (typeof it === "string") it = { tipo: "video", youtubeId: it };
                            if (it.tipo === "playlist") {
                                var pId = esc(it.playlistId || it.id || "");
                                var nombrePl = esc(it.playlistTitle ? String(it.playlistTitle) : (it.titulo ? String(it.titulo) : (it.nombre ? String(it.nombre) : "")));
                                var cover = it.coverUrl ? esc(it.coverUrl) : (it.coverVideoId ? ("https://img.youtube.com/vi/" + esc(it.coverVideoId) + "/hqdefault.jpg") : "");
                                var bgFallback = '<div style="width:100%;height:100%;background:linear-gradient(135deg,#151c2e,#0d3b66);display:flex;align-items:center;justify-content:center;color:rgba(255,213,74,0.3);font-size:3rem;">📑</div>';
                                return '<a href="https://www.youtube.com/playlist?list=' + pId + '" target="_blank" rel="noopener noreferrer" class="video-item video-item--playlist">' +
                                    (cover ? ('<img src="' + cover + '" alt="' + nombrePl + '" loading="lazy" decoding="async">') : bgFallback) +
                                    '<div class="playlist-overlay-center" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;pointer-events:none;z-index:2;">' +
                                        '<div class="play-icon" style="position:static;transform:none;margin:0;">▶</div>' +
                                        '<div class="playlist-badge-box" style="background:rgba(15,17,23,0.92);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);color:#ffd54a;border:1px solid rgba(255,213,74,0.5);padding:3px 9px;border-radius:6px;text-align:center;max-width:88%;box-shadow:0 3px 8px rgba(0,0,0,0.6);">' +
                                            '<div style="font-size:0.62rem;font-weight:800;letter-spacing:0.5px;color:#ffd54a;">▶ PLAYLIST</div>' +
                                            (nombrePl ? ('<div style="font-size:0.72rem;font-weight:600;color:#ffffff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:1px;max-width:140px;">' + nombrePl + '</div>') : '') +
                                        '</div>' +
                                    '</div>' +
                                '</a>';
                            } else {
                                var yId = esc(it.youtubeId || it.id || "");
                                var yCover = it.coverUrl ? esc(it.coverUrl) : ("https://img.youtube.com/vi/" + yId + "/hqdefault.jpg");
                                return '<a href="https://www.youtube.com/watch?v=' + yId + '" target="_blank" rel="noopener noreferrer" class="video-item">' +
                                    '<img src="' + yCover + '" alt="Vídeo de YouTube" loading="lazy" decoding="async">' +
                                    '<div class="play-icon">▶</div>' +
                                '</a>';
                            }
                        };
                        var unaP = cItems.map(renderUnItem).join("");
                        var repsPerSet = Math.max(1, Math.ceil(8 / cItems.length));
                        var setCompleto = "";
                        for (var r = 0; r < repsPerSet; r++) {
                            setCompleto += unaP;
                        }
                        itemsHTML = setCompleto + setCompleto + setCompleto;
                    }

                    html += titC + '<div class="carrusel-videos-wrapper" data-carrusel-id="' + esc(carruselId) + '" style="margin:20px 0;">'
                        + '<div id="' + esc(carruselId) + '" class="carrusel-videos-track">' + itemsHTML + '</div>'
                        + '</div>\n';
                    break;

                case "enlace":
                    var urlE = esc(b.url || "#");
                    var txtE = esc(b.texto || b.url || "Enlace");
                    html += '<p style="margin-bottom:12px;"><a href="' + urlE
                        + '" target="_blank" rel="noopener noreferrer">' + txtE + "</a></p>\n";
                    break;

                case "columnas":
                    var cols = Array.isArray(b.columnas) ? b.columnas : [];
                    if (cols.length === 0) break;
                    var gridTemplate = "";
                    if (b.distribucion === "60-40") gridTemplate = "3fr 2fr";
                    else if (b.distribucion === "40-60") gridTemplate = "2fr 3fr";
                    else if (b.distribucion === "33-33-33" || cols.length === 3) gridTemplate = "repeat(3, 1fr)";
                    else if (b.distribucion === "70-30") gridTemplate = "7fr 3fr";
                    else if (b.distribucion === "30-70") gridTemplate = "3fr 7fr";
                    else if (cols.every(function(c) { return c.ancho; })) {
                        gridTemplate = cols.map(function(c) { return c.ancho.indexOf("%") !== -1 ? (parseFloat(c.ancho) + "fr") : c.ancho; }).join(" ");
                    } else {
                        gridTemplate = "repeat(" + cols.length + ", 1fr)";
                    }

                    var colsHtml = "";
                    cols.forEach(function(col) {
                        var colBloques = Array.isArray(col.bloques) ? col.bloques : [];
                        colsHtml += '<div class="columna-cms" style="min-width:0;box-sizing:border-box;word-break:break-word;overflow-wrap:break-word;">\n'
                            + renderizarBloques(colBloques)
                            + '</div>\n';
                    });

                    html += '<div class="fila-columnas-cms" style="display:grid;grid-template-columns:' + gridTemplate + ';gap:24px;margin-bottom:20px;align-items:start;width:100%;box-sizing:border-box;">\n'
                        + colsHtml
                        + '</div>\n';
                    break;

                case "imagen":
                    var imgUrl = esc(b.url || "");
                    if (imgUrl) {
                        var align = b.alineacion || "center";
                        var cap = (b.caption && b.caption.trim()) ? ('<div class="pie-imagen-cms" style="font-size:0.85rem;color:var(--color-texto-secundario,#888);margin-top:6px;">' + esc(b.caption.trim()) + '</div>') : '';
                        var framedImg = renderImagenFramedPublic(b);
                        html += '<div class="bloque-imagen-cms" style="margin-bottom:16px;text-align:' + esc(align) + ';">\n'
                            + framedImg
                            + cap
                            + '</div>\n';
                    }
                    break;

                case "tablon":
                    var tAlign = b.alineacion || "center";
                    var tAlignStyle = "margin-left:auto !important;margin-right:auto !important;align-self:center !important;justify-self:center !important;";
                    if (tAlign === "left") {
                        tAlignStyle = "margin-left:0 !important;margin-right:auto !important;align-self:flex-start !important;justify-self:start !important;";
                    } else if (tAlign === "right") {
                        tAlignStyle = "margin-left:auto !important;margin-right:0 !important;align-self:flex-end !important;justify-self:end !important;";
                    }

                    var tDimStyle = "";
                    if (b.ancho) {
                        tDimStyle = "width:" + esc(b.ancho) + ";max-width:100%;";
                    } else {
                        tDimStyle = "width:100%;max-width:100%;";
                    }
                    if (b.alto) {
                        tDimStyle += "min-height:" + esc(b.alto) + ";";
                    }

                    // Asegurar filas y soporte retrocompatible con b.items legacy
                    var tFilas = [];
                    if (Array.isArray(b.filas) && b.filas.length > 0) {
                        tFilas = b.filas;
                    } else {
                        var legacyItems = Array.isArray(b.items) ? b.items : [];
                        var legacyCols = parseInt(b.columnas, 10) || (b.distribucion === "1-col" ? 1 : (b.distribucion === "3-col" ? 3 : 2));
                        legacyCols = Math.max(1, Math.min(6, legacyCols));
                        for (var li = 0; li < legacyItems.length; li += legacyCols) {
                            var chunk = legacyItems.slice(li, li + legacyCols);
                            var flexEq = Math.round((100 / chunk.length) * 10) / 10;
                            chunk.forEach(function(it) {
                                if (typeof it.flex !== "number" || it.flex <= 0) it.flex = flexEq;
                            });
                            tFilas.push({ id: "fila_" + li, altura: null, items: chunk });
                        }
                    }

                    var filasHtml = "";
                    tFilas.forEach(function(fila) {
                        var fItems = Array.isArray(fila.items) ? fila.items.filter(function(it) { return it && it.url; }) : [];
                        if (fItems.length === 0) return;

                        var fAlturaStyle = fila.altura ? ("min-height:" + esc(fila.altura) + ";") : "";
                        var totalFlex = 0;
                        fItems.forEach(function(it) {
                            totalFlex += (typeof it.flex === "number" && it.flex > 0) ? it.flex : 1;
                        });
                        if (totalFlex <= 0) totalFlex = fItems.length;

                        var cellsHtml = "";
                        fItems.forEach(function(item) {
                            var itemFlex = (typeof item.flex === "number" && item.flex > 0) ? item.flex : (totalFlex / fItems.length);
                            var flexPct = Math.round((itemFlex / totalFlex) * 1000) / 10;

                            var cellStyle = "flex:" + itemFlex + " 1 0px;width:" + flexPct + "%;overflow:visible !important;display:flex;flex-direction:column;align-items:center;justify-content:center;box-sizing:border-box;";
                            var itemFramed = renderImagenFramedPublic(item);
                            var itemCap = (item.caption && item.caption.trim()) ? ('<div class="pie-imagen-cms" style="font-size:0.8rem;color:var(--color-texto-secundario,#888);margin-top:4px;text-align:center;">' + esc(item.caption.trim()) + '</div>') : '';

                            cellsHtml += '<div class="tablon-cms-cell" style="' + cellStyle + '">\n'
                                + itemFramed
                                + itemCap
                                + '</div>\n';
                        });

                        filasHtml += '<div class="tablon-cms-fila" style="display:flex;width:100%;gap:12px;align-items:stretch;overflow:visible !important;' + fAlturaStyle + 'box-sizing:border-box;">\n'
                            + cellsHtml
                            + '</div>\n';
                    });

                    html += '<div class="tablon-cms ve-tablon-align-' + esc(tAlign) + '" style="display:flex;flex-direction:column;gap:14px;margin-top:20px;margin-bottom:20px;' + tAlignStyle + tDimStyle + 'box-sizing:border-box;overflow:visible !important;">\n'
                        + filasHtml
                        + '</div>\n';
                    break;
case "galeria":
                    var gImagenes = Array.isArray(b.imagenes) ? b.imagenes.filter(function(img) { return img && img.url; }) : [];
                    if (gImagenes.length === 0) break;
                    var galId = b.id || ("galeria_" + Date.now());
                    var totalG = gImagenes.length;
                    var primImg = gImagenes[0];
                    var primFotoHtml = renderFotoGaleriaHTML(primImg);
                    var primCap = (primImg.caption && primImg.caption.trim()) ? ('<div class="galeriaCaption pie-imagen-cms" style="font-size:0.85rem;color:var(--color-texto-secundario,#888);margin-top:6px;text-align:center;">' + esc(primImg.caption.trim()) + '</div>') : '<div class="galeriaCaption pie-imagen-cms" style="font-size:0.85rem;color:var(--color-texto-secundario,#888);margin-top:6px;text-align:center;display:none;"></div>';

                    // Puntos sin flechas (Círculos perfectos garantizados)
                    var dotsG = "";
                    if (totalG > 1) {
                        dotsG = '<div class="galeriaPuntos" style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:10px;">';
                        var countD = (totalG <= 4) ? totalG : 5;
                        for (var dg = 0; dg < countD; dg++) {
                            var isA = (dg === 0);
                            dotsG += '<button type="button" class="puntoGaleria ' + (isA ? 'activo' : '') + '" data-gal-id="' + esc(galId) + '" data-idx="' + dg + '" aria-label="Foto ' + (dg + 1) + '" style="width:11px;height:11px;min-width:11px;min-height:11px;max-width:11px;max-height:11px;border-radius:50%;background:' + (isA ? 'var(--color-resaltado, #ffd54a)' : 'var(--color-secundario, rgba(255,255,255,0.4))') + ';border:none;cursor:pointer;padding:0;flex-shrink:0;' + (isA ? 'transform:scale(1.25);' : '') + '"></button>';
                        }
                        dotsG += '</div>';
                    }

                    // Contador SOLO a partir de 5 fotos
                    var contG = (totalG >= 5) ? ('<div class="galeriaContador" style="font-weight:bold;font-size:0.95rem;opacity:0.85;margin-top:6px;text-align:center;"><span class="galeriaNumActual">1</span> / ' + totalG + '</div>') : '';
                    var jsonFotos = esc(JSON.stringify(gImagenes));

                    var gAlign = b.alineacion || "center";
                    var gAlignStyle = "margin:20px auto;align-self:center;justify-self:center;";
                    if (gAlign === "left") gAlignStyle = "margin:20px auto 20px 0;align-self:flex-start;justify-self:start;";
                    else if (gAlign === "right") gAlignStyle = "margin:20px 0 20px auto;align-self:flex-end;justify-self:end;";

                    var gWidthStyle = b.ancho ? ("width:" + esc(b.ancho) + ";max-width:100%;") : "width:100%;max-width:520px;";

                    // Ventana visible 16:9 fija sin salto de tamaño y sin flechas
                    html += '<div class="galeriaSolar galeria-cms ve-galeria-align-' + esc(gAlign) + '" id="' + esc(galId) + '" data-fotos="' + jsonFotos + '" data-idx="0" style="' + gAlignStyle + gWidthStyle + 'display:flex;flex-direction:column;align-items:center;gap:12px;box-sizing:border-box;">\n'
                        + '  <div class="galeriaImagenContenedor lotlab-galeria-zoom-trigger" data-gal-id="' + esc(galId) + '" title="Haz clic para ampliar esta imagen" style="position:relative;width:100%;aspect-ratio:16/9;background:rgba(0,0,0,0.35);border-radius:12px;overflow:hidden;cursor:zoom-in;">\n'
                        + '    <div class="galeriaSlot" style="position:absolute;inset:0;width:100%;height:100%;">' + primFotoHtml + '</div>\n'
                        + '  </div>\n'
                        + dotsG
                        + contG
                        + primCap
                        + '</div>\n';
                    break;

                case "buscador": {
                    var phB = esc(b.placeholder || "Buscar...");
                    var ambB = esc(b.ambito || "arbol");
                    html += '<div class="contenedorBuscadorTrucos" data-ambito="' + ambB + '" style="margin: 18px auto 26px auto;">\n'
                        + '  <div class="cajaEntradaBuscadorTrucos">\n'
                        + '    <span class="iconoLupaBuscadorTrucos">🔍</span>\n'
                        + '    <input type="text" class="inputBuscadorTrucos" placeholder="' + phB + '" autocomplete="off" data-ambito="' + ambB + '">\n'
                        + '    <button type="button" class="btnLimpiarBuscador btnLimpiarBuscadorTrucos" style="display:none;" data-tooltip="Limpiar búsqueda">✕</button>\n'
                        + '  </div>\n'
                        + '  <div class="desplegableResultadosTrucos" style="display:none;"></div>\n'
                        + '</div>\n';
                    break;
                }

                case "boton": {
                    // ── Defaults retrocompatibles ──
                    var bAp  = b.apariencia  || {};
                    var bTm  = b.tamano      || {};
                    var bIm  = b.imagen      || {};
                    var bHv  = b.hover       || {};
                    var bIH  = bHv.imagenHover || {};
                    var bTt  = b.tooltip     || {};
                    var bSnd = b.sonido      || {};
                    var bDp  = b.desplegable || {};
                    var bDpOps = Array.isArray(bDp.opciones) ? bDp.opciones : [];
                    var bEmoji   = b.emoji    || "";
                    var bEmojiP  = b.emojiPos || "left";
                    var bTexto   = b.texto    || "Botón";
                    var bAlign   = b.alineacion || "center";

                    // ── Destino ──
                    var bEsInterno = b.tipoDestino === "interna" || (!b.url && b.destinoInterno);
                    var bHref = bEsInterno ? ("#" + esc(b.destinoInterno || "")) : esc(b.url || "#");
                    var bTarget = (!bEsInterno && b.abrirNuevaPestana) ? ' target="_blank" rel="noopener noreferrer"' : "";
                    var bDataDest = bEsInterno ? (' data-destino="' + esc(b.destinoInterno || "") + '"') : "";

                    // ── Alineación contenedor ──
                    var bAlignContStyle = bAlign === "full" ? "text-align:center;" : ("text-align:" + bAlign + ";");

                    // ── Estilo inline del botón ──
                    var bIsCustom = bAp.preset === "custom";
                    var bInlineStyle = "";
                    var bBtnId = "btn-cms-" + esc(b.id || ("b" + Date.now()));

                    if (bIsCustom) {
                        if (bAp.fondoColor) bInlineStyle += "background:" + bAp.fondoColor + ";";
                        if (bAp.textoColor) bInlineStyle += "color:" + bAp.textoColor + ";";
                        var bBW = bAp.bordeGrosor || "";
                        var bBS = bAp.bordeEstilo || "solid";
                        var bBC = bAp.bordeColor  || "transparent";
                        if (bBW) bInlineStyle += "border:" + bBW + " " + bBS + " " + bBC + ";";
                        if (bAp.radio) bInlineStyle += "border-radius:" + bAp.radio + ";";
                        if (bAp.sombra) {
                            var bSh = bAp.sombraIntensidad === "suave" ? "0 2px 8px rgba(0,0,0,0.3)" : bAp.sombraIntensidad === "fuerte" ? "0 6px 24px rgba(0,0,0,0.6)" : "0 4px 16px rgba(0,0,0,0.45)";
                            bInlineStyle += "box-shadow:" + bSh + ";";
                        }
                        if (bAp.opacidad !== undefined && bAp.opacidad !== 1) bInlineStyle += "opacity:" + bAp.opacidad + ";";
                    }
                    if (!bTm.adaptativo) {
                        if (bTm.ancho) bInlineStyle += "width:" + bTm.ancho + (bTm.anchoUnidad === "percent" ? "%" : bTm.anchoUnidad || "px") + ";";
                        if (bTm.alto)  bInlineStyle += "height:" + bTm.alto + (bTm.altoUnidad || "px") + ";";
                    } else if (bAlign === "full") {
                        bInlineStyle += "width:100%;";
                    }
                    if (bTm.paddingH || bTm.paddingV) bInlineStyle += "padding:" + (bTm.paddingV || "12") + "px " + (bTm.paddingH || "24") + "px;";
                    if (bTm.fontSize) bInlineStyle += "font-size:" + bTm.fontSize + ";";
                    var bTransicion = bHv.transicion || "0.25s";
                    bInlineStyle += "transition:background " + bTransicion + ",color " + bTransicion + ",border-color " + bTransicion + ",box-shadow " + bTransicion + ",transform " + bTransicion + ";";

                    // ── CSS hover dinámico ──
                    var bHoverCSS = "";
                    if (bIsCustom || bHv.fondoColor || bHv.bordeColor || bHv.glow || bHv.escala) {
                        var bHoverRules = [];
                        if (bHv.fondoColor) bHoverRules.push("background:" + bHv.fondoColor);
                        if (bHv.bordeColor) bHoverRules.push("border-color:" + bHv.bordeColor);
                        if (bHv.escala) bHoverRules.push("transform:scale(1.02)");
                        if (bHv.glow) {
                            var bGlowSize = bHv.glowIntensidad === "suave" ? "0 0 8px 2px" : bHv.glowIntensidad === "fuerte" ? "0 0 20px 6px" : "0 0 12px 3px";
                            bHoverRules.push("box-shadow:" + bGlowSize + " " + (bHv.glowColor || "#ffd54a"));
                        }
                        if (bHoverRules.length > 0) {
                            bHoverCSS = "<style>#" + bBtnId + ":hover,#" + bBtnId + ":focus{" + bHoverRules.join(";") + ";}</style>\n";
                        }
                    }

                    // ── Imagen hover CSS ──
                    var bImgHoverCSS = "";
                    if (bIm.activa && bIH.activa && bIH.url) {
                        bImgHoverCSS = "<style>" +
                            "#" + bBtnId + " .btn-cms-img-normal{transition:opacity " + bTransicion + ";opacity:1;}" +
                            "#" + bBtnId + " .btn-cms-img-hover{transition:opacity " + bTransicion + ";opacity:0;position:absolute;inset:0;}" +
                            "#" + bBtnId + ":hover .btn-cms-img-normal{opacity:0;}" +
                            "#" + bBtnId + ":hover .btn-cms-img-hover{opacity:1;}" +
                        "</style>\n";
                    }

                    // ── Contenido interno ──
                    var bEmojiHtml = bEmoji ? ('<span class="btn-cms-emoji" style="font-size:' + esc(bTm.emojiSize || "1.1em") + ';">' + esc(bEmoji) + '</span>') : "";
                    var bTextoHtml = bTexto ? ('<span class="btn-cms-txt">' + esc(bTexto) + '</span>') : "";
                    var bImgHtml = "";
                    if (bIm.activa && bIm.url) {
                        var bImgR = bIm.forma === "redonda" ? "50%" : bIm.forma === "cuadrada" ? "8px" : "6px";
                        var bImgA = bIm.forma === "horizontal" ? "16/9" : bIm.forma === "vertical" ? "9/16" : "auto";
                        var bImgInnerStyle = "width:100%;height:100%;object-fit:cover;object-position:" + (bIm.posX||50) + "% " + (bIm.posY||50) + "%;transform:scale(" + ((bIm.zoom||100)/100) + ");";
                        var bImgWrapStyle = "display:inline-block;position:relative;overflow:hidden;border-radius:" + bImgR + ";aspect-ratio:" + bImgA + ";width:2.2em;height:2.2em;vertical-align:middle;flex-shrink:0;";
                        bImgHtml = '<span class="btn-cms-img-wrap" style="' + bImgWrapStyle + '">' +
                            '<img class="btn-cms-img-normal" src="' + esc(bIm.url) + '" alt="' + esc(bIm.alt || "") + '" style="' + bImgInnerStyle + '">' +
                            (bIH.activa && bIH.url ? '<img class="btn-cms-img-hover" src="' + esc(bIH.url) + '" alt="" style="width:100%;height:100%;object-fit:cover;object-position:' + (bIH.posX||50) + '% ' + (bIH.posY||50) + '%;transform:scale(' + ((bIH.zoom||100)/100) + ');">' : '') +
                        '</span>';
                    }

                    var bInner;
                    if (bEmojiP === "top") {
                        bInner = '<span style="display:flex;flex-direction:column;align-items:center;gap:4px;">' + bEmojiHtml + bImgHtml + bTextoHtml + '</span>';
                    } else if (bEmojiP === "right") {
                        bInner = [bImgHtml, bTextoHtml, bEmojiHtml].filter(Boolean).join(" ");
                    } else if (bEmojiP === "hidden") {
                        bInner = [bImgHtml, bTextoHtml].filter(Boolean).join(" ");
                    } else {
                        bInner = [bEmojiHtml, bImgHtml, bTextoHtml].filter(Boolean).join(" ");
                    }
                    if (bDp.activo) bInner += ' <span style="font-size:0.75em;opacity:0.7;">&#9662;</span>';

                    // ── Tooltip ──
                    var bTooltipAttr = (bTt.activo && bTt.texto) ? (' data-tooltip="' + esc(bTt.texto) + '"') : "";

                    // ── Sonido ──
                    var bSoundJS = (bSnd.activo !== false) ? "if(window.reproducirSonidoUI)window.reproducirSonidoUI('click');" : "";

                    var bBtnClass = "boton-lotlab" + (!bIsCustom && bAlign === "full" ? " boton-lotlab--full" : "");
                    var bStyleAttr = bInlineStyle ? (' style="' + bInlineStyle + '"') : "";

                    // ── DESPLEGABLE ──
                    if (bDp.activo && bDpOps.length > 0) {
                        var bDpPos  = bDp.posicion || "bottom";
                        var bMenuId = "dp-" + esc(b.id || ("m" + Date.now()));
                        var bMenuPosStyle = "position:absolute;z-index:999;min-width:160px;background:var(--bg-panel,#1a1a2e);border:1px solid rgba(255,255,255,0.12);border-radius:10px;box-shadow:0 8px 32px rgba(0,0,0,0.5);padding:6px 0;display:none;";
                        if (bDpPos === "bottom")     bMenuPosStyle += "top:calc(100% + 6px);left:0;";
                        else if (bDpPos === "top")   bMenuPosStyle += "bottom:calc(100% + 6px);left:0;";
                        else if (bDpPos === "left")  bMenuPosStyle += "top:0;right:calc(100% + 6px);";
                        else if (bDpPos === "right") bMenuPosStyle += "top:0;left:calc(100% + 6px);";

                        var bMenuItems = bDpOps.map(function(op) {
                            var opEsInt = op.tipoDestino !== "url";
                            var opHref  = opEsInt ? ("#" + esc(op.destinoInterno || "")) : esc(op.url || "#");
                            var opTarget = (!opEsInt) ? ' target="_blank" rel="noopener noreferrer"' : "";
                            var opDataDest = opEsInt ? (' data-destino="' + esc(op.destinoInterno || "") + '"') : "";
                            var opTT = op.tooltip ? (' data-tooltip="' + esc(op.tooltip) + '"') : "";
                            var opInner = (op.emoji ? esc(op.emoji) + " " : "") + esc(op.texto || "");
                            return '<a href="' + opHref + '"' + opTarget + opDataDest + opTT +
                                ' style="display:flex;align-items:center;gap:8px;padding:9px 16px;font-size:0.88rem;color:var(--color-texto,#fff);text-decoration:none;cursor:pointer;white-space:nowrap;"' +
                                ' onmouseenter="this.style.background=\'rgba(255,255,255,0.06)\'" onmouseleave="this.style.background=\'\'"' +
                                ' onclick="' + bSoundJS + 'var m=document.getElementById(\'' + bMenuId + '\');if(m)m.style.display=\'none\';">' +
                                opInner + '</a>';
                        }).join("");

                        html += bHoverCSS + bImgHoverCSS +
                            '<div class="bloque-boton-container" style="margin:20px 0;' + bAlignContStyle + '">' +
                            '<div style="position:relative;display:inline-block;' + (bAlign === "full" ? "width:100%;" : "") + '">' +
                            '<button id="' + bBtnId + '" type="button" class="' + bBtnClass + '"' + bStyleAttr + bTooltipAttr + ' aria-haspopup="true"' +
                              ' onclick="' + bSoundJS + 'var m=document.getElementById(\'' + bMenuId + '\');if(m){m.style.display=m.style.display===\'none\'||!m.style.display?\'block\':\'none\';}">' +
                              bInner +
                            '</button>' +
                            '<div id="' + bMenuId + '" style="' + bMenuPosStyle + '" role="menu">' + bMenuItems + '</div>' +
                            '</div></div>\n';
                        html += '<script>!function(){var mi="' + bMenuId + '";document.addEventListener("click",function(e){var m=document.getElementById(mi);if(m&&!m.parentElement.contains(e.target))m.style.display="none";},{capture:true,once:false});}();<\\/script>\n';
                    } else {
                        // Botón normal
                        var bOnclick = bSoundJS ? (' onclick="' + bSoundJS + '"') : "";
                        html += bHoverCSS + bImgHoverCSS +
                            '<div class="bloque-boton-container" style="margin:20px 0;' + bAlignContStyle + '">' +
                            '<a id="' + bBtnId + '" href="' + bHref + '"' + bTarget + bDataDest + bTooltipAttr + bOnclick + ' class="' + bBtnClass + '"' + bStyleAttr + '>' +
                            bInner +
                            '</a>' +
                            '</div>\n';
                    }
                    break;
                }

                case "cuadro-copiable": {
                    var cAlignB = b.alineacion || "center";
                    var alignStyleCop = "text-align:" + cAlignB + ";";
                    html += '<div class="bloque-copiable-container" style="margin:16px 0;' + alignStyleCop + '">\n'
                        + '  <span class="truco-copiable" data-tooltip="Pulsa para copiar">' + esc(b.contenido || '') + '</span>\n'
                        + '</div>\n';
                    break;
                }

                default:
                    break;
            }
        });

        return html;
    }

    /* ── Inyector de estilos CMS (nivel IIFE para que las exportaciones puedan referenciarlo) ── */
    function inyectarEstilosCMS() {
        if (!document.getElementById("acercaDeEstilosCMS")) {
            var st = document.createElement("style");
            st.id = "acercaDeEstilosCMS";
            st.textContent = "#acercaDeContenido strong, #acercaDeContenido b, .contenidoPaginaEditable strong, .contenidoPaginaEditable b { font-weight: 900 !important; -webkit-text-stroke: 0.55px currentColor; text-shadow: 0 0 0.4px currentColor; letter-spacing: 0.2px; }\n" +
              "@media (max-width: 768px) { .fila-columnas-cms { grid-template-columns: 1fr !important; gap: 16px !important; } }\n" +
              ".ve-img-frame { position: relative; overflow: hidden; display: inline-block; vertical-align: middle; box-sizing: border-box; }\n" +
              ".ve-img-frame img, .ve-img-frame .ve-img-layer { display: block; width: 100%; height: 100%; }\n" +
              ".ve-img-frame .ve-img-layer-base { transition: opacity 0.22s ease; }\n" +
              ".ve-img-frame .ve-img-layer-hover { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; pointer-events: none; transition: opacity 0.22s ease; }\n" +
              ".ve-img-frame:hover .ve-img-layer-hover { opacity: 1 !important; }\n" +
              ".ve-img-frame.has-hover-glow, .has-hover-glow.ve-img-frame, a:has(.has-hover-glow) { transition: box-shadow 0.25s ease, transform 0.25s ease !important; }\n" +
              ".ve-img-frame.has-hover-glow:hover, .has-hover-glow.ve-img-frame:hover { box-shadow: 0 0 20px rgba(46, 204, 113, 0.85), 0 0 0 2.5px #2ecc71 !important; transform: translateY(-2px); }\n" +
              "/* Alineación Unificada de Bloques */\n" +
              ".ve-tablon-align-center, .ve-galeria-align-center { margin-left: auto !important; margin-right: auto !important; align-self: center !important; justify-self: center !important; }\n" +
              ".ve-tablon-align-left, .ve-galeria-align-left { margin-left: 0 !important; margin-right: auto !important; align-self: flex-start !important; justify-self: start !important; }\n" +
              ".ve-tablon-align-right, .ve-galeria-align-right { margin-left: auto !important; margin-right: 0 !important; align-self: flex-end !important; justify-self: end !important; }\n" +
              ".tablon-cms { display: flex; flex-direction: column; gap: 14px; box-sizing: border-box; overflow: visible !important; width: 100%; }\n" +
              ".tablon-cms-fila { display: flex; width: 100%; gap: 12px; align-items: stretch; overflow: visible !important; box-sizing: border-box; }\n" +
              ".tablon-cms-cell { position: relative; overflow: visible !important; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 0; }\n" +
              "@media (max-width: 650px) { .tablon-cms-fila { flex-wrap: wrap !important; } .tablon-cms-cell { flex: 1 1 100% !important; width: 100% !important; } }\n" +
              ".ve-img-frame.forma-cuadrado { aspect-ratio: 1/1; border-radius: 12px; }\n" +
              ".ve-img-frame.forma-redondo { aspect-ratio: 1/1; border-radius: 50%; }\n" +
              ".ve-img-frame.forma-horizontal { aspect-ratio: 16/9; border-radius: 12px; }\n" +
              ".ve-img-frame.forma-vertical { aspect-ratio: 3/4; border-radius: 12px; }\n" +
              ".ve-img-frame.forma-original { border-radius: 10px; }\n" +
              ".galeriaFlecha { transition: background 0.2s ease, transform 0.2s ease; }\n" +
              ".galeriaFlecha:hover { background: rgba(0,0,0,0.85) !important; transform: translateY(-50%) scale(1.1) !important; }\n" +
              ".lotlab-lightbox-backdrop { position: fixed; inset: 0; z-index: 9999999; background: rgba(0,0,0,0.88); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; box-sizing: border-box; cursor: zoom-out !important; }\n" +
              ".lotlab-lightbox-close { display: none !important; width: 0 !important; height: 0 !important; padding: 0 !important; margin: 0 !important; border: none !important; pointer-events: none !important; }\n" +
              ".lotlab-lightbox-content, .lotlab-lightbox-img { cursor: zoom-out !important; max-width: 90vw; max-height: 80vh; object-fit: contain; border-radius: 10px; box-shadow: 0 24px 60px rgba(0,0,0,0.9); }\n" +
              ".lotlab-lightbox-caption { margin-top: 12px; font-size: 0.95rem; color: #ffd54a; background: rgba(15,17,23,0.85); padding: 6px 16px; border-radius: 20px; border: 1px solid rgba(255,213,74,0.3); text-align: center; max-width: 800px; }";
            document.head.appendChild(st);
        }
    }

    /* ── Lógica principal de carga ── */
    function cargarAcercaDe() {
        fetch("data/content/acerca-de.json")
            .then(function (r) {
                if (!r.ok) throw new Error("HTTP " + r.status);
                return r.json();
            })
            .then(function (data) {
                var bloques = Array.isArray(data.bloques) ? data.bloques : [];

                /* 1. Actualizar el H2 de la cabeceraVentana */
                var primerTitulo = null;
                for (var i = 0; i < bloques.length; i++) {
                    if (bloques[i].tipo === "titulo" && (bloques[i].nivel || 2) <= 2) {
                        primerTitulo = bloques[i];
                        break;
                    }
                }
                if (primerTitulo) {
                    var h2 = document.getElementById("acercaDeH2");
                    if (h2) {
                        if (primerTitulo.fontSize) {
                            h2.style.fontSize = primerTitulo.fontSize;
                        }
                        if (primerTitulo.textAlign) {
                            h2.style.textAlign = primerTitulo.textAlign;
                        }
                        // SIEMPRE texto plano en el H2, nunca HTML escapado
                        var contH2 = primerTitulo.contenido || "";
                        if (/<[a-z][\s\S]*>/i.test(contH2)) {
                            // Por si acaso el JSON guardado tiene HTML, extraer texto
                            var tmpDiv = document.createElement("div");
                            tmpDiv.innerHTML = contH2;
                            h2.textContent = tmpDiv.innerText || tmpDiv.textContent || contH2;
                        } else {
                            h2.textContent = contH2;
                        }
                    }
                }

                /* 2. Actualizar el bloque de contenido en su orden semántico exacto
                      (excluimos únicamente el H2 principal que ya fue a la cabecera) */
                var bloquesContenido = bloques.filter(function (b) {
                    if (b.tipo === "titulo" && (b.nivel || 2) <= 2) return false;
                    return true;
                });
                var contenedor = document.getElementById("acercaDeContenido");

    inyectarEstilosCMS();

    if (contenedor && bloquesContenido.length) {
        contenedor.innerHTML = renderizarBloques(bloquesContenido);
        inicializarGaleriasCMS(contenedor);
    }

                /* 3. Registrar todos los carruseles presentes en la página recursivamente */
                function extraerCarruseles(lista) {
                    var out = [];
                    (lista || []).forEach(function(b) {
                        if (b.tipo === "carrusel-videos") out.push(b);
                        if (b.tipo === "columnas" && Array.isArray(b.columnas)) {
                            b.columnas.forEach(function(col) {
                                out = out.concat(extraerCarruseles(col.bloques));
                            });
                        }
                    });
                    return out;
                }
                var carruseles = extraerCarruseles(bloques);
                window._acercaDeCarousels = carruseles;

                // Ocultar el carrusel estático original fuera de #acercaDeContenido
                if (carruseles.length > 0) {
                    var wrapperEstatico = document.querySelector("#ventanaAcercaDe > .carrusel-videos-wrapper");
                    if (wrapperEstatico) wrapperEstatico.style.display = "none";

                    // Compatibilidad hacia atrás: primer carrusel a window._acercaDeVideoIDs
                    var itemsPrimerC = carruseles[0].items || carruseles[0].videos || [];
                    window._acercaDeVideoIDs = itemsPrimerC.map(function(it) {
                        return (typeof it === "string") ? it : (it.youtubeId || it.id || "");
                    }).filter(Boolean);
                }

                // Disparar inicialización de carruseles si ya está disponible
                if (typeof window.inicializarCarruselAcercaDe === "function") {
                    window.inicializarCarruselAcercaDe();
                }

                // Disparar indexación de buscadores universales si existen
                if (typeof window.construirIndiceTrucos === "function") {
                    window.construirIndiceTrucos();
                }
                if (typeof window.inicializarBuscadorTrucos === "function") {
                    window.inicializarBuscadorTrucos();
                }
            })
            .catch(function (err) {
                /* Fallback silencioso: el contenido estático de index.html queda intacto.
                   La ventana "Acerca de" sigue funcionando con su contenido original. */
                console.warn(
                    "[LOT-LAB CMS] No se pudo cargar data/content/acerca-de.json. " +
                    "Usando contenido estático original. Error: " + err.message
                );
            });
    }

    /* ── Visor Lightbox para Web Pública (Fase 2.8M: sin botón ✕, clic en cualquier zona cierra) ── */
    function abrirLightboxPublico(imgUrl, caption) {
        if (!imgUrl) return;
        var existing = document.querySelector(".lotlab-lightbox-backdrop");
        if (existing) existing.remove();

        var backdrop = document.createElement("div");
        backdrop.className = "lotlab-lightbox-backdrop";
        backdrop.style.cursor = "zoom-out";
        backdrop.innerHTML =
            '<div class="lotlab-lightbox-content" style="cursor:zoom-out;">' +
                '<img src="' + esc(imgUrl) + '" alt="Imagen ampliada" class="lotlab-lightbox-img" style="cursor:zoom-out;">' +
                (caption ? ('<div class="lotlab-lightbox-caption">' + esc(caption) + '</div>') : '') +
            '</div>';

        function cerrar(ev) {
            if (ev) { ev.preventDefault(); ev.stopPropagation(); }
            backdrop.remove();
            document.removeEventListener("keydown", onKeyDown);
        }

        function onKeyDown(ev) {
            if (ev.key === "Escape" || ev.keyCode === 27) {
                cerrar(ev);
            }
        }

        // Clic en cualquier zona (imagen, caption o fondo) cierra la ampliación
        backdrop.addEventListener("click", cerrar);
        document.addEventListener("keydown", onKeyDown);
        document.body.appendChild(backdrop);
    }

    /* ── Inicializador Interactivo de Galerías en Web Pública ── */
    function inicializarGaleriasCMS(root) {
        var base = root || document;
        if (typeof window.inicializarCarruselAcercaDe === "function") {
            window.inicializarCarruselAcercaDe(base);
        }
        var galerias = base.querySelectorAll(".galeria-cms");
        galerias.forEach(function(gal) {
            if (gal._iniciada) return;
            gal._iniciada = true;

            var rawFotos = gal.getAttribute("data-fotos");
            var fotos = [];
            try {
                fotos = JSON.parse(rawFotos);
            } catch(e) {
                return;
            }
            if (!Array.isArray(fotos) || fotos.length <= 1) return;

            var curIdx = 0;
            var slot = gal.querySelector(".galeriaSlot");
            var numAct = gal.querySelector(".galeriaNumActual");
            var captionEl = gal.querySelector(".galeriaCaption");
            var puntosContainer = gal.querySelector(".galeriaPuntos");

            function actualizarPuntos() {
                if (!puntosContainer) return;
                var total = fotos.length;
                if (total <= 4) {
                    var puntos = puntosContainer.querySelectorAll(".puntoGaleria");
                    puntos.forEach(function(p, pIdx) {
                        if (pIdx === curIdx) {
                            p.classList.add("activo");
                            p.style.background = "var(--color-resaltado, #ffd54a)";
                            p.style.transform = "scale(1.25)";
                        } else {
                            p.classList.remove("activo");
                            p.style.background = "var(--color-secundario, rgba(255,255,255,0.4))";
                            p.style.transform = "scale(1)";
                        }
                    });
                } else {
                    // Ventana deslizante de 5 puntos atómica (sin destruir DOM si no cambia rango)
                    var startDot = Math.max(0, Math.min(total - 5, curIdx - 2));
                    var puntos = puntosContainer.querySelectorAll(".puntoGaleria");
                    var currentStart = puntosContainer.getAttribute("data-start-dot");

                    if (puntos.length === 5 && currentStart === String(startDot)) {
                        // El rango no ha cambiado: solo actualizamos clases y colores (cero parpadeo)
                        puntos.forEach(function(p) {
                            var dotIdx = parseInt(p.getAttribute("data-idx"), 10);
                            if (dotIdx === curIdx) {
                                p.classList.add("activo");
                                p.style.background = "var(--color-resaltado, #ffd54a)";
                                p.style.transform = "scale(1.25)";
                            } else {
                                p.classList.remove("activo");
                                p.style.background = "var(--color-secundario, rgba(255,255,255,0.4))";
                                p.style.transform = "scale(1)";
                            }
                        });
                    } else {
                        // El rango cambió: reconstruir y sincronizar
                        puntosContainer.setAttribute("data-start-dot", String(startDot));
                        var htmlDots = "";
                        for (var d = startDot; d < startDot + 5; d++) {
                            var isAct = (d === curIdx);
                            htmlDots += '<button type="button" class="puntoGaleria ' + (isAct ? 'activo' : '') + '" data-idx="' + d + '" aria-label="Foto ' + (d + 1) + '" style="width:11px;height:11px;min-width:11px;min-height:11px;max-width:11px;max-height:11px;border-radius:50%;background:' + (isAct ? 'var(--color-resaltado, #ffd54a)' : 'var(--color-secundario, rgba(255,255,255,0.4))') + ';border:none;cursor:pointer;padding:0;flex-shrink:0;' + (isAct ? 'transform:scale(1.25);' : '') + '"></button>';
                        }
                        puntosContainer.innerHTML = htmlDots;
                        puntosContainer.querySelectorAll(".puntoGaleria").forEach(function(p) {
                            p.addEventListener("click", function(e) {
                                e.preventDefault();
                                var targetIdx = parseInt(p.getAttribute("data-idx"), 10);
                                if (!isNaN(targetIdx)) irA(targetIdx);
                            });
                        });
                    }
                }
            }

            function irA(idx) {
                if (idx < 0) idx = fotos.length - 1;
                if (idx >= fotos.length) idx = 0;
                curIdx = idx;
                gal.setAttribute("data-idx", curIdx);

                if (slot) {
                    slot.innerHTML = renderFotoGaleriaHTML(fotos[curIdx]);
                }
                if (numAct) {
                    numAct.textContent = (curIdx + 1);
                }
                if (captionEl) {
                    var capText = (fotos[curIdx].caption && fotos[curIdx].caption.trim()) ? fotos[curIdx].caption.trim() : "";
                    if (capText) {
                        captionEl.textContent = capText;
                        captionEl.style.display = "block";
                    } else {
                        captionEl.textContent = "";
                        captionEl.style.display = "none";
                    }
                }
                actualizarPuntos();
            }

            // Enlazar puntos iniciales
            if (puntosContainer && fotos.length <= 4) {
                puntosContainer.querySelectorAll(".puntoGaleria").forEach(function(p) {
                    p.addEventListener("click", function(e) {
                        e.preventDefault();
                        var targetIdx = parseInt(p.getAttribute("data-idx"), 10);
                        if (!isNaN(targetIdx)) irA(targetIdx);
                    });
                });
            } else if (puntosContainer && fotos.length >= 5) {
                actualizarPuntos();
            }

            // Navegación con rueda del ratón (throttled ~260ms, limpia sin parpadeo)
            var lastWheel = 0;
            gal.addEventListener("wheel", function(e) {
                var now = Date.now();
                if (now - lastWheel < 260) {
                    e.preventDefault();
                    return;
                }
                if (Math.abs(e.deltaY) > 6 || Math.abs(e.deltaX) > 6) {
                    e.preventDefault();
                    lastWheel = now;
                    if (e.deltaY > 0 || e.deltaX > 0) irA(curIdx + 1);
                    else irA(curIdx - 1);
                }
            }, { passive: false });

            // Ampliar imagen al hacer clic (Lightbox)
            var imgCont = gal.querySelector(".galeriaImagenContenedor");
            if (imgCont) {
                imgCont.addEventListener("click", function(e) {
                    if (e.target.closest(".galeriaFlecha")) return;
                    var curFoto = fotos[curIdx];
                    if (curFoto && curFoto.url) {
                        abrirLightboxPublico(curFoto.url, curFoto.caption);
                    }
                });
            }
        });
    }

    /* ── Exponer API pública en window para modularidad y testing ── */
    window.AcercaDeCMS = {
        renderizarBloques: renderizarBloques,
        cargarAcercaDe: cargarAcercaDe,
        inicializarGaleriasCMS: inicializarGaleriasCMS,
        renderImagenFramedPublic: renderImagenFramedPublic,
        abrirLightboxPublico: abrirLightboxPublico,
        inyectarEstilosCMS: inyectarEstilosCMS
    };
    window.renderizarBloquesCMS = renderizarBloques;
    window.inicializarGaleriasCMS = inicializarGaleriasCMS;
    window.inyectarEstilosCMS = inyectarEstilosCMS;

    /* ── Ejecutar tras DOMContentLoaded ── */
    if (document && document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", cargarAcercaDe);
    } else if (document && typeof document.getElementById === "function") {
        // El DOM ya está listo (script cargado con defer o al final del body)
        cargarAcercaDe();
    }

})();
