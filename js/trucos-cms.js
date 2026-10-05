/* =========================================================
   TRUCOS-CMS.JS — Carga editorial de Trucos desde JSON
   LOT-LAB CMS | Sincronización CMS → Web Pública
   ========================================================= */

(function () {
    "use strict";

    function esc(s) {
        return String(s || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    var PAGINAS_TRUCOS = [
        { idVentana: "ventanaTrucos", archivo: "data/content/trucos-inicio.json" },
        { idVentana: "ventanaTrucosConstruir", archivo: "data/content/trucos-construir.json" },
        { idVentana: "ventanaTrucosCAS", archivo: "data/content/trucos-cas.json" },
        { idVentana: "ventanaTrucosVivir", archivo: "data/content/trucos-vivir.json" },
        { idVentana: "ventanaTrucosPacks", archivo: "data/content/trucos-packs.json" }
    ];

    function renderizarBloquesTrucos(bloques) {
        var html = "";
        bloques.forEach(function (b) {
            switch (b.tipo) {
                case "titulo": {
                    var nivel = b.nivel || 3;
                    var tFontSize = b.fontSize ? ("font-size:" + esc(b.fontSize) + ";") : "";
                    var tAlign = b.textAlign ? ("text-align:" + esc(b.textAlign) + ";") : "";
                    var tCont = b.contenido || "";
                    var tHtml = /<[a-z][\s\S]*>/i.test(tCont) ? tCont : esc(tCont);
                    html += "<h" + nivel + ' style="' + tFontSize + tAlign + 'margin-bottom:12px;line-height:1.3;">' + tHtml + "</h" + nivel + ">\n";
                    break;
                }

                case "texto": {
                    var cTexto = b.contenido || "";
                    var txtAlign = b.textAlign ? ("text-align:" + esc(b.textAlign) + ";") : "";
                    if (!/<[a-z][\s\S]*>/i.test(cTexto)) {
                        var parrafos = cTexto.split(/\n\n+/);
                        parrafos.forEach(function (p) {
                            html += '<p style="margin-bottom:12px;' + txtAlign + '">' + esc(p).replace(/\n/g, "<br>") + "</p>\n";
                        });
                    } else {
                        html += '<p style="margin-bottom:12px;' + txtAlign + '">' + cTexto + "</p>\n";
                    }
                    break;
                }

                case "cuadro-copiable": {
                    var cAlign = b.alineacion || "center";
                    html += '<p style="text-align:' + esc(cAlign) + ';font-size:1.2rem;margin:18px 0;">'
                        + '<span class="truco-copiable" data-tooltip="Pulsa para copiar">' + esc(b.contenido || "") + '</span>'
                        + '</p>\n';
                    break;
                }

                case "buscador": {
                    var phB = esc(b.placeholder || "Buscar truco por nombre o código (ej: moveobjects, motherlode, dinero, cas...)");
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
                    // Delegar al renderer avanzado si está disponible
                    if (window.AcercaDeCMS && typeof window.AcercaDeCMS.renderizarBloques === "function") {
                        html += window.AcercaDeCMS.renderizarBloques([b]);
                        break;
                    }
                    if (typeof window.renderizarBloquesCMS === "function") {
                        html += window.renderizarBloquesCMS([b]);
                        break;
                    }
                    // Fallback local retrocompatible con propiedades básicas
                    var bTextoT  = b.texto || "Botón";
                    var bEmojiT  = b.emoji || "";
                    var bInnerT  = bEmojiT ? (esc(bEmojiT) + " " + esc(bTextoT)) : esc(bTextoT);
                    var esInternoT = b.tipoDestino === "interna" || (!b.url && b.destinoInterno);
                    var alignBT  = b.alineacion || "center";
                    var alignST  = alignBT === "full" ? "text-align:center;" : ("text-align:" + alignBT + ";");
                    var btnST    = alignBT === "full" ? "width:100%;" : "";
                    var dataDestT = esInternoT ? (' data-destino="' + esc(b.destinoInterno || "") + '"') : "";
                    var hrefBT   = esInternoT ? ("#" + esc(b.destinoInterno || "")) : esc(b.url || "#");
                    var targetBT = (!esInternoT && b.abrirNuevaPestana) ? ' target="_blank" rel="noopener noreferrer"' : (esInternoT ? "" : ' target="_blank" rel="noopener noreferrer"');
                    var ttAttrT  = (b.tooltip && b.tooltip.activo && b.tooltip.texto) ? (' data-tooltip="' + esc(b.tooltip.texto) + '"') : "";
                    html += '<div class="bloque-boton-container" style="margin:20px 0;' + alignST + '">\n'
                        + '  <a href="' + hrefBT + '"' + targetBT + dataDestT + ttAttrT + ' class="boton-lotlab"' + (btnST ? (' style="' + btnST + '"') : '') + '>'
                        + bInnerT
                        + '</a>\n'
                        + '</div>\n';
                    break;
                }


                case "separador": {
                    html += '<hr style="border:0;height:1px;background:var(--borde, rgba(255,255,255,0.25));margin:25px 0;">\n';
                    break;
                }

                case "espacio": {
                    var hEsp = b.altura ? (b.altura.indexOf("px") !== -1 ? b.altura : b.altura + "px") : "32px";
                    html += '<div style="height:' + esc(hEsp) + ';"></div>\n';
                    break;
                }

                default:
                    break;
            }
        });
        return html;
    }

    // Carga asíncrona de cada página de trucos
    function cargarTrucosDesdeJSON() {
        var promises = PAGINAS_TRUCOS.map(function (item) {
            return fetch(item.archivo)
                .then(function (r) {
                    if (!r.ok) throw new Error("HTTP " + r.status);
                    return r.json();
                })
                .then(function (data) {
                    var ventana = document.getElementById(item.idVentana);
                    if (!ventana) return;

                    var bloques = Array.isArray(data.bloques) ? data.bloques : [];
                    if (bloques.length === 0) return;

                    // 1. Actualizar H2
                    var primerTit = null;
                    for (var i = 0; i < bloques.length; i++) {
                        if (bloques[i].tipo === "titulo" && (bloques[i].nivel || 2) <= 2) {
                            primerTit = bloques[i];
                            break;
                        }
                    }
                    if (primerTit) {
                        var h2 = ventana.querySelector(".cabeceraVentana h2");
                        if (h2) {
                            if (primerTit.fontSize) h2.style.fontSize = primerTit.fontSize;
                            if (primerTit.textAlign) h2.style.textAlign = primerTit.textAlign;
                            var rawH2 = primerTit.contenido || "";
                            var tmpD = document.createElement("div");
                            tmpD.innerHTML = rawH2;
                            h2.textContent = tmpD.innerText || tmpD.textContent || rawH2;
                        }
                    }

                    // 2. Filtrar bloques del cuerpo
                    var bloquesCuerpo = bloques.filter(function (b) {
                        return !(b.tipo === "titulo" && (b.nivel || 2) <= 2);
                    });

                    // Si el contenido editorial define un buscador universal, ocultar el buscador estático previo
                    var tieneBuscadorEnBloques = bloquesCuerpo.some(function(b) { return b.tipo === "buscador"; });
                    if (tieneBuscadorEnBloques) {
                        var buscadorEstatico = ventana.querySelector(".contenedorBuscadorTrucos");
                        if (buscadorEstatico && !ventana.querySelector(".contenidoTrucos .contenedorBuscadorTrucos")) {
                            buscadorEstatico.style.display = "none";
                        }
                    }

                    var contTrucos = ventana.querySelector(".contenidoTrucos");
                    if (contTrucos && bloquesCuerpo.length > 0) {
                        contTrucos.innerHTML = renderizarBloquesTrucos(bloquesCuerpo);
                    }
                })
                .catch(function () {
                    // Fallback silencioso: se conserva el HTML estático de index.html
                });
        });

        Promise.all(promises).then(function () {
            // Re-indexar e inicializar buscadores universales y de trucos
            if (typeof window.construirIndiceTrucos === "function") {
                window.construirIndiceTrucos();
            }
            if (typeof window.inicializarBuscadorTrucos === "function") {
                window.inicializarBuscadorTrucos();
            }
        });
    }

    // ─── Resolución precisa de destinos internos de LOT-LAB ───
    function resolverDestinoLOTLAB(destino) {
        if (!destino) return null;
        var d = String(destino).trim();

        // 1. Coincidencia directa en MAPA_RUTAS de navigation.js
        if (typeof window !== "undefined" && window.MAPA_RUTAS && window.MAPA_RUTAS[d]) {
            return window.MAPA_RUTAS[d];
        }

        // 2. Comprobar si ya es un ID de ventana existente en el DOM
        if (document.getElementById(d)) {
            return d;
        }

        // 3. Normalizaciones habituales de slugs / IDs del árbol
        var slugNorm = d.toLowerCase().replace(/_/g, "-");
        if (typeof window !== "undefined" && window.MAPA_RUTAS && window.MAPA_RUTAS[slugNorm]) {
            return window.MAPA_RUTAS[slugNorm];
        }

        // 4. Mapeo estructural de respaldo para todos los nodos del árbol LOT-LAB
        var mapaEstructural = {
            "inicio": "ventanaAcercaDe",
            "acerca-de": "ventanaAcercaDe",
            "herramientas": "ventanaRetos",
            "trucos": "ventanaTrucos",
            "trucos-inicio": "ventanaTrucos",
            "trucos-construir": "ventanaTrucosConstruir",
            "trucos-cas": "ventanaTrucosCAS",
            "trucos-vivir": "ventanaTrucosVivir",
            "trucos-packs": "ventanaTrucosPacks",
            "temporizador": "ventanaTemporizador",
            "tier-list": "ventanaTierList",
            "solares": "ventanaBuscador",
            "buscador-solares": "ventanaBuscador",
            "listado-solares": "ventanaListado",
            "buscador": "ventanaBuscador",
            "listado": "ventanaListado",
            "generadores": "ventanaRetos",
            "dados": "ventanaDados",
            "tirador-dados": "ventanaDados",
            "ruleta-colores": "ventanaRuletaColor",
            "ruleta-color": "ventanaRuletaColor",
            "ruleta-desastres": "ventanaRuletaDesastres",
            "habilidades-azar": "ventanaHabilidadesGenerador",
            "packs-azar": "ventanaPacksGenerador",
            "mundos-azar": "ventanaMundosGenerador",
            "retos": "ventanaRetos",
            "modo-retos": "ventanaRetos",
            "retos-opciones": "ventanaRetosOpciones",
            "estadisticas": "ventanaEstadisticas"
        };

        if (mapaEstructural[slugNorm]) {
            return mapaEstructural[slugNorm];
        }

        // 5. Búsqueda por prefijo PascalCase ventana...
        var idCamel = "ventana" + slugNorm.split("-").map(function (s) {
            return s.charAt(0).toUpperCase() + s.slice(1);
        }).join("");
        if (document.getElementById(idCamel)) {
            return idCamel;
        }

        return null;
    }

    // Interceptar clics en botones de navegación interna de LOT-LAB
    document.addEventListener("click", function (e) {
        var btn = e.target.closest(".boton-lotlab[data-destino], [data-destino]");
        if (!btn) return;
        var destino = btn.getAttribute("data-destino");
        if (!destino) return;

        var targetVentana = resolverDestinoLOTLAB(destino);
        if (targetVentana && typeof window.abrirVentana === "function") {
            e.preventDefault();
            e.stopPropagation();

            if (targetVentana === "ventanaPacksGenerador") {
                window.proximaVentanaTrasPacks = "ventanaPacksGenerador";
            } else if (targetVentana === "ventanaHabilidadesGenerador") {
                window.proximaVentanaTrasPacks = "ventanaHabilidadesGenerador";
            } else if (targetVentana === "ventanaMundosGenerador") {
                window.proximaVentanaTrasPacks = "ventanaMundosGenerador";
            } else if (targetVentana === "ventanaRetosOpciones") {
                window.proximaVentanaTrasPacks = "ventanaRetosOpciones";
            }

            window.abrirVentana(targetVentana, true);

            var slug = (typeof window.VENTANA_A_SLUG !== "undefined" && window.VENTANA_A_SLUG[targetVentana]) || destino;
            if (history && history.pushState) {
                history.pushState(null, "", "#" + slug);
            } else {
                window.location.hash = slug;
            }
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    });

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", cargarTrucosDesdeJSON);
    } else {
        cargarTrucosDesdeJSON();
    }
})();
