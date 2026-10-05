/* =========================================================
   LOT-LAB SIMS 4 - TIER LIST (LÓGICA Y ESTADO)
   js/tier-list.js
   ========================================================= */

(function () {
    "use strict";

    const TIERLIST_VERSION = 1;
    const DB_INDEXED_NAME = "lotlab_tierlist_db";
    const DB_INDEXED_STORE = "imagenes_custom";

    // Tiers iniciales con IDs estables y colores estándar
    const ESTADO_INICIAL_TIERS = [
        { id: "tier_s", nombre: "S", color: "rgba(255, 77, 77, 1)", orden: 0, elementos: [] },
        { id: "tier_a", nombre: "A", color: "rgba(255, 159, 67, 1)", orden: 1, elementos: [] },
        { id: "tier_b", nombre: "B", color: "rgba(254, 211, 48, 1)", orden: 2, elementos: [] },
        { id: "tier_c", nombre: "C", color: "rgba(38, 222, 129, 1)", orden: 3, elementos: [] },
        { id: "tier_d", nombre: "D", color: "rgba(69, 170, 242, 1)", orden: 4, elementos: [] }
    ];

    const STORAGE_PREFERENCIAS_KEY = "lotlab_tierlist_preferencias";

    function obtenerPreferenciasGlobales() {
        try {
            const raw = localStorage.getItem(STORAGE_PREFERENCIAS_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) {
            return null;
        }
    }

    function guardarPreferenciasGlobales(prefs) {
        try {
            if (!prefs) {
                localStorage.removeItem(STORAGE_PREFERENCIAS_KEY);
                return;
            }
            localStorage.setItem(STORAGE_PREFERENCIAS_KEY, JSON.stringify(prefs));
        } catch (e) {
            console.warn("[TierList] Error guardando preferencias globales:", e);
        }
    }

    function obtenerAlcanceCambios() {
        try {
            const prefs = obtenerPreferenciasGlobales();
            if (prefs && (prefs.alcanceCambios === "solo_este" || prefs.alcanceCambios === "todos")) {
                return prefs.alcanceCambios;
            }
        } catch (e) {}
        return "todos";
    }

    function guardarAlcanceCambios(alcance) {
        try {
            const valor = (alcance === "solo_este") ? "solo_este" : "todos";
            let prefs = obtenerPreferenciasGlobales();
            if (!prefs || typeof prefs !== "object") {
                prefs = {};
            }
            prefs.alcanceCambios = valor;
            guardarPreferenciasGlobales(prefs);
            return valor;
        } catch (e) {
            console.warn("[TierList] Error guardando alcance de cambios:", e);
            return "todos";
        }
    }

    function limpiarPreferenciasGlobales() {
        try {
            const alcance = obtenerAlcanceCambios();
            localStorage.removeItem(STORAGE_PREFERENCIAS_KEY);
            if (alcance) {
                guardarAlcanceCambios(alcance);
            }
        } catch (e) {}
    }

    function crearTiersIniciales() {
        const prefs = obtenerPreferenciasGlobales();
        if (prefs && Array.isArray(prefs.tiers) && prefs.tiers.length > 0) {
            return prefs.tiers.map((t, idx) => ({
                id: t.id,
                nombre: t.nombre,
                color: t.color,
                orden: idx,
                elementos: [],
                ...(prefs.anchoGlobal ? { ancho: prefs.anchoGlobal } : (t.ancho ? { ancho: t.ancho } : {}))
            }));
        }
        const copia = JSON.parse(JSON.stringify(ESTADO_INICIAL_TIERS));
        if (prefs && prefs.anchoGlobal) {
            copia.forEach(t => { t.ancho = prefs.anchoGlobal; });
        }
        return copia;
    }

    function actualizarEstructuraTiersDesdeModo(modoOrigen) {
        const estado = window.EstadoTierList;
        const modoActivo = estado.modos[modoOrigen] || estado.activo;
        if (!modoActivo || !Array.isArray(modoActivo.tiers)) return;

        const tiersReferencia = modoActivo.tiers;
        const prefs = obtenerPreferenciasGlobales() || {};
        const anchoGlobal = prefs.anchoGlobal || null;

        prefs.tiers = tiersReferencia.map((t, idx) => ({
            id: t.id,
            nombre: t.nombre,
            color: t.color,
            orden: idx,
            ...(t.ancho ? { ancho: t.ancho } : {})
        }));
        guardarPreferenciasGlobales(prefs);

        const listaModos = ["mundos", "packs", "personalizada"];
        listaModos.forEach(m => {
            if (m === modoOrigen) return;
            const modoObj = estado.modos[m];
            if (!modoObj || !Array.isArray(modoObj.tiers)) return;

            const tierMap = new Map();
            modoObj.tiers.forEach(t => tierMap.set(t.id, t));

            const nuevosTiersModo = [];
            const idsReferencia = new Set();

            tiersReferencia.forEach((tRef, idx) => {
                idsReferencia.add(tRef.id);
                const existente = tierMap.get(tRef.id);
                if (existente) {
                    existente.nombre = tRef.nombre;
                    existente.color = tRef.color;
                    existente.orden = idx;
                    if (tRef.ancho) {
                        existente.ancho = tRef.ancho;
                    } else if (anchoGlobal) {
                        existente.ancho = anchoGlobal;
                    }
                    nuevosTiersModo.push(existente);
                } else {
                    const nuevoT = {
                        id: tRef.id,
                        nombre: tRef.nombre,
                        color: tRef.color,
                        orden: idx,
                        elementos: []
                    };
                    if (tRef.ancho) {
                        nuevoT.ancho = tRef.ancho;
                    } else if (anchoGlobal) {
                        nuevoT.ancho = anchoGlobal;
                    }
                    nuevosTiersModo.push(nuevoT);
                }
            });

            modoObj.tiers.forEach(tViejo => {
                if (!idsReferencia.has(tViejo.id) && Array.isArray(tViejo.elementos)) {
                    tViejo.elementos.forEach(elId => {
                        if (!modoObj.sinClasificar.includes(elId)) {
                            modoObj.sinClasificar.push(elId);
                        }
                    });
                }
            });

            modoObj.tiers = nuevosTiersModo;
        });
    }

    function agregarTierGlobal(nuevoTier) {
        const estado = window.EstadoTierList;
        const prefs = obtenerPreferenciasGlobales() || {};
        if (prefs.anchoGlobal) {
            nuevoTier.ancho = prefs.anchoGlobal;
        }

        const alcance = obtenerAlcanceCambios();
        if (alcance === "todos") {
            const listaModos = ["mundos", "packs", "personalizada"];
            listaModos.forEach(m => {
                const modoObj = estado.modos[m];
                if (modoObj && Array.isArray(modoObj.tiers)) {
                    if (!modoObj.tiers.some(t => t.id === nuevoTier.id)) {
                        modoObj.tiers.push({
                            ...nuevoTier,
                            orden: modoObj.tiers.length,
                            elementos: []
                        });
                    }
                }
            });

            actualizarEstructuraTiersDesdeModo(estado.modo);
        } else {
            const modoObj = estado.modos[estado.modo] || estado.activo;
            if (modoObj && Array.isArray(modoObj.tiers)) {
                if (!modoObj.tiers.some(t => t.id === nuevoTier.id)) {
                    modoObj.tiers.push({
                        ...nuevoTier,
                        orden: modoObj.tiers.length,
                        elementos: []
                    });
                }
            }
        }
    }

    function eliminarTierGlobal(tierId) {
        const estado = window.EstadoTierList;
        if (estado.tiers.length <= 1) return;

        const alcance = obtenerAlcanceCambios();
        if (alcance === "todos") {
            const listaModos = ["mundos", "packs", "personalizada"];
            listaModos.forEach(m => {
                const modoObj = estado.modos[m];
                if (modoObj && Array.isArray(modoObj.tiers)) {
                    const tier = modoObj.tiers.find(t => t.id === tierId);
                    if (tier && Array.isArray(tier.elementos)) {
                        tier.elementos.forEach(id => {
                            if (!modoObj.sinClasificar.includes(id)) {
                                modoObj.sinClasificar.push(id);
                            }
                        });
                    }
                    modoObj.tiers = modoObj.tiers.filter(t => t.id !== tierId);
                    modoObj.tiers.forEach((t, idx) => { t.orden = idx; });
                }
            });

            actualizarEstructuraTiersDesdeModo(estado.modo);
        } else {
            const modoObj = estado.modos[estado.modo] || estado.activo;
            if (modoObj && Array.isArray(modoObj.tiers)) {
                const tier = modoObj.tiers.find(t => t.id === tierId);
                if (tier && Array.isArray(tier.elementos)) {
                    tier.elementos.forEach(id => {
                        if (!modoObj.sinClasificar.includes(id)) {
                            modoObj.sinClasificar.push(id);
                        }
                    });
                }
                modoObj.tiers = modoObj.tiers.filter(t => t.id !== tierId);
                modoObj.tiers.forEach((t, idx) => { t.orden = idx; });
            }
        }
    }

    function actualizarTierGlobal(tierId, datos) {
        const estado = window.EstadoTierList;
        const alcance = obtenerAlcanceCambios();
        if (alcance === "todos") {
            const listaModos = ["mundos", "packs", "personalizada"];
            listaModos.forEach(m => {
                const modoObj = estado.modos[m];
                if (modoObj && Array.isArray(modoObj.tiers)) {
                    const t = modoObj.tiers.find(item => item.id === tierId);
                    if (t) {
                        if (datos.nombre !== undefined) t.nombre = datos.nombre;
                        if (datos.color !== undefined) t.color = datos.color;
                    }
                }
            });

            actualizarEstructuraTiersDesdeModo(estado.modo);
        } else {
            const modoObj = estado.modos[estado.modo] || estado.activo;
            if (modoObj && Array.isArray(modoObj.tiers)) {
                const t = modoObj.tiers.find(item => item.id === tierId);
                if (t) {
                    if (datos.nombre !== undefined) t.nombre = datos.nombre;
                    if (datos.color !== undefined) t.color = datos.color;
                }
            }
        }
    }

    function sincronizarOrdenGlobalTiers(modoOrigen) {
        const alcance = obtenerAlcanceCambios();
        if (alcance !== "todos") return;

        const estado = window.EstadoTierList;
        const origenObj = estado.modos[modoOrigen] || estado.activo;
        if (!origenObj || !Array.isArray(origenObj.tiers)) return;
        const idsOrdenados = origenObj.tiers.map(t => t.id);

        const listaModos = ["mundos", "packs", "personalizada"];
        listaModos.forEach(m => {
            if (m === modoOrigen) return;
            const modoObj = estado.modos[m];
            if (!modoObj || !Array.isArray(modoObj.tiers)) return;

            const map = new Map(modoObj.tiers.map(t => [t.id, t]));
            const nuevosTiers = [];
            idsOrdenados.forEach((id, idx) => {
                if (map.has(id)) {
                    const t = map.get(id);
                    t.orden = idx;
                    nuevosTiers.push(t);
                    map.delete(id);
                }
            });
            map.forEach(t => {
                t.orden = nuevosTiers.length;
                nuevosTiers.push(t);
            });
            modoObj.tiers = nuevosTiers;
        });

        actualizarEstructuraTiersDesdeModo(modoOrigen);
    }

    function aplicarAnchoGlobal(nuevoAncho) {
        const estado = window.EstadoTierList;
        const esMovil = typeof window !== "undefined" && window.innerWidth <= 768;
        const anchoMin = esMovil ? 85 : 110;
        const anchoMax = Math.round(anchoMin * 2.2);
        const anchoClamped = Math.max(anchoMin, Math.min(anchoMax, Math.round(nuevoAncho)));

        const alcance = obtenerAlcanceCambios();
        if (alcance === "todos") {
            const prefs = obtenerPreferenciasGlobales() || {};
            prefs.anchoGlobal = anchoClamped;
            guardarPreferenciasGlobales(prefs);

            ["mundos", "packs", "personalizada"].forEach(m => {
                const modoObj = estado.modos[m];
                if (modoObj && Array.isArray(modoObj.tiers)) {
                    modoObj.tiers.forEach(t => {
                        t.ancho = anchoClamped;
                    });
                }
            });
        } else {
            const modoObj = estado.modos[estado.modo] || estado.activo;
            if (modoObj && Array.isArray(modoObj.tiers)) {
                modoObj.tiers.forEach(t => {
                    t.ancho = anchoClamped;
                });
            }
        }
    }

    function aplicarAnchoIndividual(tierId, nuevoAncho) {
        const estado = window.EstadoTierList;
        const esMovil = typeof window !== "undefined" && window.innerWidth <= 768;
        const anchoMin = esMovil ? 85 : 110;
        const anchoMax = Math.round(anchoMin * 2.2);
        const anchoClamped = Math.max(anchoMin, Math.min(anchoMax, Math.round(nuevoAncho)));

        const alcance = obtenerAlcanceCambios();
        if (alcance === "todos") {
            const prefs = obtenerPreferenciasGlobales() || {};
            const listaModos = ["mundos", "packs", "personalizada"];
            listaModos.forEach(m => {
                const modoObj = estado.modos[m];
                if (modoObj && Array.isArray(modoObj.tiers)) {
                    const tier = modoObj.tiers.find(t => t.id === tierId);
                    if (tier) {
                        if (anchoClamped <= anchoMin && !prefs.anchoGlobal) {
                            delete tier.ancho;
                        } else {
                            tier.ancho = anchoClamped;
                        }
                    }
                }
            });

            if (Array.isArray(prefs.tiers)) {
                const pTier = prefs.tiers.find(t => t.id === tierId);
                if (pTier) {
                    if (anchoClamped <= anchoMin && !prefs.anchoGlobal) {
                        delete pTier.ancho;
                    } else {
                        pTier.ancho = anchoClamped;
                    }
                }
                guardarPreferenciasGlobales(prefs);
            }
        } else {
            const modoObj = estado.modos[estado.modo] || estado.activo;
            if (modoObj && Array.isArray(modoObj.tiers)) {
                const tier = modoObj.tiers.find(t => t.id === tierId);
                if (tier) {
                    const prefs = obtenerPreferenciasGlobales() || {};
                    if (anchoClamped <= anchoMin && !prefs.anchoGlobal) {
                        delete tier.ancho;
                    } else {
                        tier.ancho = anchoClamped;
                    }
                }
            }
        }
    }

    function propagarConfiguracionModoATodos(modoOrigen) {
        const estado = window.EstadoTierList;
        const modoActivo = estado.modos[modoOrigen] || estado.activo;
        if (!modoActivo || !Array.isArray(modoActivo.tiers)) return;

        const tiersReferencia = modoActivo.tiers;
        const prefs = obtenerPreferenciasGlobales() || {};

        // Guardar estructura global en preferencias
        prefs.tiers = tiersReferencia.map((t, idx) => ({
            id: t.id,
            nombre: t.nombre,
            color: t.color,
            orden: idx,
            ...(t.ancho ? { ancho: t.ancho } : {})
        }));
        guardarPreferenciasGlobales(prefs);

        // Propagar a todos los demás modos
        const listaModos = ["mundos", "packs", "personalizada"];
        listaModos.forEach(m => {
            if (m === modoOrigen) return;
            const modoObj = estado.modos[m];
            if (!modoObj || !Array.isArray(modoObj.tiers)) return;

            const tierMap = new Map();
            modoObj.tiers.forEach(t => tierMap.set(t.id, t));

            const nuevosTiersModo = [];
            const idsReferencia = new Set();

            tiersReferencia.forEach((tRef, idx) => {
                idsReferencia.add(tRef.id);
                const existente = tierMap.get(tRef.id);
                if (existente) {
                    existente.nombre = tRef.nombre;
                    existente.color = tRef.color;
                    existente.orden = idx;
                    if (tRef.ancho) {
                        existente.ancho = tRef.ancho;
                    } else if (prefs.anchoGlobal) {
                        existente.ancho = prefs.anchoGlobal;
                    } else {
                        delete existente.ancho;
                    }
                    nuevosTiersModo.push(existente);
                } else {
                    const nuevoT = {
                        id: tRef.id,
                        nombre: tRef.nombre,
                        color: tRef.color,
                        orden: idx,
                        elementos: []
                    };
                    if (tRef.ancho) {
                        nuevoT.ancho = tRef.ancho;
                    } else if (prefs.anchoGlobal) {
                        nuevoT.ancho = prefs.anchoGlobal;
                    }
                    nuevosTiersModo.push(nuevoT);
                }
            });

            // Mover a sinClasificar fichas de tiers eliminados
            modoObj.tiers.forEach(tViejo => {
                if (!idsReferencia.has(tViejo.id) && Array.isArray(tViejo.elementos)) {
                    tViejo.elementos.forEach(elId => {
                        if (!modoObj.sinClasificar.includes(elId)) {
                            modoObj.sinClasificar.push(elId);
                        }
                    });
                }
            });

            modoObj.tiers = nuevosTiersModo;
        });
    }

    function sincronizarModosConPreferencias() {
        const alcance = obtenerAlcanceCambios();
        if (alcance !== "todos") return;

        const prefs = obtenerPreferenciasGlobales();
        if (!prefs) return;

        const estado = window.EstadoTierList;
        const anchoGlobal = prefs.anchoGlobal || null;

        if (Array.isArray(prefs.tiers) && prefs.tiers.length > 0) {
            ["mundos", "packs", "personalizada"].forEach(m => {
                const modoObj = estado.modos[m];
                if (!modoObj) return;

                const tierMap = new Map((modoObj.tiers || []).map(t => [t.id, t]));
                const nuevosTiers = [];
                const idsPref = new Set();

                prefs.tiers.forEach((pTier, idx) => {
                    idsPref.add(pTier.id);
                    const existente = tierMap.get(pTier.id);
                    if (existente) {
                        existente.nombre = pTier.nombre;
                        existente.color = pTier.color;
                        existente.orden = idx;
                        if (anchoGlobal) {
                            existente.ancho = anchoGlobal;
                        }
                        nuevosTiers.push(existente);
                    } else {
                        const nuevo = {
                            id: pTier.id,
                            nombre: pTier.nombre,
                            color: pTier.color,
                            orden: idx,
                            elementos: []
                        };
                        if (anchoGlobal) {
                            nuevo.ancho = anchoGlobal;
                        }
                        nuevosTiers.push(nuevo);
                    }
                });

                if (Array.isArray(modoObj.tiers)) {
                    modoObj.tiers.forEach(tViejo => {
                        if (!idsPref.has(tViejo.id) && Array.isArray(tViejo.elementos)) {
                            tViejo.elementos.forEach(id => {
                                if (!modoObj.sinClasificar.includes(id)) {
                                    modoObj.sinClasificar.push(id);
                                }
                            });
                        }
                    });
                }

                modoObj.tiers = nuevosTiers;
            });
        } else if (anchoGlobal) {
            ["mundos", "packs", "personalizada"].forEach(m => {
                const modoObj = estado.modos[m];
                if (modoObj && Array.isArray(modoObj.tiers)) {
                    modoObj.tiers.forEach(t => {
                        t.ancho = anchoGlobal;
                    });
                }
            });
        }
    }

    // Estado principal de la Tier List con separación estricta por modo
    window.EstadoTierList = {
        version: TIERLIST_VERSION,
        pantalla: "selector", // "selector" | "tablero"
        modo: "mundos", // "mundos" | "packs" | "personalizada"
        modos: {
            mundos: {
                titulo: "Tier List de Mundos de Los Sims 4",
                filtros: ["base", "expansion", "contenido"],
                tiers: crearTiersIniciales(),
                sinClasificar: [],
                elementos: {}
            },
            packs: {
                titulo: "Tier List de Packs de Los Sims 4",
                filtros: ["base", "expansion", "contenido", "accesorios", "kits", "gratuitos"],
                tiers: crearTiersIniciales(),
                sinClasificar: [],
                elementos: {}
            },
            personalizada: {
                titulo: "Mi Tier List",
                tiers: crearTiersIniciales(),
                sinClasificar: [],
                elementos: {}, // id -> { id, nombre, rutaIcono, forma: "cuadrado"|"circulo", encuadre: {x,y,zoom} }
                imagenesCustom: {} // id -> dataUrl WebP
            }
        },
        get activo() {
            return this.modos[this.modo] || this.modos.mundos;
        },
        get titulo() { return this.activo.titulo; },
        set titulo(val) { this.activo.titulo = val; },
        get tiers() { return this.activo.tiers; },
        set tiers(val) { this.activo.tiers = val; },
        get sinClasificar() { return this.activo.sinClasificar; },
        set sinClasificar(val) { this.activo.sinClasificar = val; },
        get elementos() { return this.activo.elementos; },
        set elementos(val) { this.activo.elementos = val; },
        get imagenesCustom() { return this.modos.personalizada.imagenesCustom; },
        set imagenesCustom(val) { this.modos.personalizada.imagenesCustom = val; },
        get filtros() {
            return {
                mundos: this.modos.mundos.filtros,
                packs: this.modos.packs.filtros
            };
        }
    };

    let _timerAutoGuardado = null;
    let _borradorResuelto = false;

    // ── 1. INDEXEDDB PARA IMÁGENES CUSTOM LOCALES ─────────────
    function abrirDBIndexed() {
        return new Promise((resolve, reject) => {
            if (typeof indexedDB === "undefined") {
                resolve(null);
                return;
            }
            const request = indexedDB.open(DB_INDEXED_NAME, 1);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(DB_INDEXED_STORE)) {
                    db.createObjectStore(DB_INDEXED_STORE, { keyPath: "id" });
                }
            };
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => {
                console.warn("[TierList] Error abriendo IndexedDB:", e);
                resolve(null);
            };
        });
    }

    async function guardarImagenCustomDB(id, dataUrl) {
        const db = await abrirDBIndexed();
        if (!db) return;
        return new Promise((resolve) => {
            const tx = db.transaction(DB_INDEXED_STORE, "readwrite");
            const store = tx.objectStore(DB_INDEXED_STORE);
            store.put({ id, dataUrl, timestamp: Date.now() });
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => resolve(false);
        });
    }

    async function obtenerTodasImagenesCustomDB() {
        const db = await abrirDBIndexed();
        if (!db) return {};
        return new Promise((resolve) => {
            const tx = db.transaction(DB_INDEXED_STORE, "readonly");
            const store = tx.objectStore(DB_INDEXED_STORE);
            const req = store.getAll();
            req.onsuccess = () => {
                const map = {};
                (req.result || []).forEach(item => {
                    map[item.id] = item.dataUrl;
                });
                resolve(map);
            };
            req.onerror = () => resolve({});
        });
    }

    async function eliminarImagenCustomDB(id) {
        const db = await abrirDBIndexed();
        if (!db) return;
        return new Promise((resolve) => {
            const tx = db.transaction(DB_INDEXED_STORE, "readwrite");
            const store = tx.objectStore(DB_INDEXED_STORE);
            store.delete(id);
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => resolve(false);
        });
    }

    async function limpiarImagenesCustomDB() {
        const db = await abrirDBIndexed();
        if (!db) return;
        return new Promise((resolve) => {
            const tx = db.transaction(DB_INDEXED_STORE, "readwrite");
            const store = tx.objectStore(DB_INDEXED_STORE);
            store.clear();
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => resolve(false);
        });
    }

    // ── 2. CONVERSIÓN Y OPTIMIZACIÓN LOCAL A WEBP ──────────────
    function convertirImagenAWebP(archivo, maxDim = 800) {
        return new Promise((resolve, reject) => {
            if (!archivo) return reject(new Error("No file provided"));
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    let w = img.width;
                    let h = img.height;
                    if (w > maxDim || h > maxDim) {
                        if (w > h) {
                            h = Math.round((h * maxDim) / w);
                            w = maxDim;
                        } else {
                            w = Math.round((w * maxDim) / h);
                            h = maxDim;
                        }
                    }
                    const canvas = document.createElement("canvas");
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(img, 0, 0, w, h);
                    const webpDataUrl = canvas.toDataURL("image/webp", 0.85);
                    resolve({
                        dataUrl: webpDataUrl,
                        anchoOriginal: img.width,
                        altoOriginal: img.height,
                        esCuadrada: Math.abs(img.width - img.height) <= 2
                    });
                };
                img.onerror = () => reject(new Error("Error decodificando imagen"));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error("Error leyendo archivo"));
            reader.readAsDataURL(archivo);
        });
    }

    // ── 3. RESOLUCIÓN DE DATOS DETERMINISTA: MUNDOS ───────────
    function obtenerTodosLosMundos() {
        if (!window.database || !Array.isArray(window.database.mundos)) return [];

        // Mapa de mundo -> { tipo, pack } obtenido deterministamente de solares
        const mapaMundoATipo = new Map();
        if (Array.isArray(window.database.solares)) {
            window.database.solares.forEach(solar => {
                const mLower = (solar.mundo || "").trim().toLowerCase();
                if (mLower && !mapaMundoATipo.has(mLower)) {
                    let tipoCategoria = "contenido";
                    const tPack = (solar.tipoPack || "").trim().toLowerCase();
                    if (tPack.includes("base")) {
                        tipoCategoria = "base";
                    } else if (tPack.includes("expan") || tPack.includes("expansión") || tPack.includes("expansion")) {
                        tipoCategoria = "expansion";
                    } else {
                        tipoCategoria = "contenido";
                    }
                    mapaMundoATipo.set(mLower, {
                        tipo: tipoCategoria,
                        pack: solar.nombrePack || ""
                    });
                }
            });
        }

        const mundos = [];
        window.database.mundos.forEach((fila, idx) => {
            const nombre = (fila[0] || "").trim();
            const idCarpeta = (fila[1] || "").trim();
            if (!nombre) return;

            const nombreLower = nombre.toLowerCase();
            let tipo = "contenido";
            let pack = "";

            // Mundos base conocidos
            if (nombreLower === "willow creek" || nombreLower === "oasis springs" || nombreLower === "newcrest") {
                tipo = "base";
                pack = "Sims 4";
            } else if (mapaMundoATipo.has(nombreLower)) {
                const info = mapaMundoATipo.get(nombreLower);
                tipo = info.tipo;
                pack = info.pack;
            }

            const rutaIconoDirecta = idCarpeta ? `img/mundos-con-solares/${idCarpeta}/icono.webp` : null;
            const rutaIcono = (typeof window.rutaIconoMundo === "function" ? window.rutaIconoMundo(nombre) : null) || rutaIconoDirecta;

            // Extraer número de orden cronológico del idCarpeta ("1-Willow-Creek" → 1)
            const numOrden = parseInt(idCarpeta.split("-")[0]) || 999;

            mundos.push({
                id: `mundo_${idCarpeta || idx}_${nombreLower.replace(/[^a-z0-9]/g, "_")}`,
                nombre: nombre,
                tipo: tipo, // "base" | "expansion" | "contenido"
                pack: pack,
                rutaIcono: rutaIcono,
                forma: "circulo",
                encuadre: { x: 0, y: 0, zoom: 1 },
                _orden: numOrden
            });
        });

        // Ordenar cronológicamente (más antiguo → más reciente)
        mundos.sort((a, b) => a._orden - b._orden);
        return mundos;
    }

    // ── 4. RESOLUCIÓN DE DATOS DETERMINISTA: PACKS ────────────
    function obtenerTodosLosPacks() {
        if (!window.database || !Array.isArray(window.database.estadisticasSims4)) return [];

        const categorias = [
            { tipo: "expansion", colFecha: 0, colNombre: 2, colId: 5 },
            { tipo: "contenido", colFecha: 6, colNombre: 8, colId: 11 },
            { tipo: "accesorios", colFecha: 12, colNombre: 14, colId: 17 },
            { tipo: "kits", colFecha: 18, colNombre: 20, colId: 23 },
            { tipo: "gratuitos", colFecha: 24, colNombre: 26, colId: 29 },
            { tipo: "base", colFecha: 30, colNombre: 32, colId: 35 }
        ];

        const packs = [];
        const idsVistos = new Set();

        const subcarpetasPorPrefijo = {
            EP: "expansiones",
            GP: "contenido",
            SP: "accesorios",
            TK: "kits",
            FP: "packs gratuitos",
            FR: "packs gratuitos",
            BG: "juego base"
        };

        window.database.estadisticasSims4.forEach((fila, idx) => {
            if (idx === 0 || !fila) return; // Encabezado

            categorias.forEach(cat => {
                const nombre = (fila[cat.colNombre] || "").trim();
                const fechaStr = (fila[cat.colFecha] || "").trim();
                const rawId = (fila[cat.colId] || "").trim();

                if (!nombre || !fechaStr || !rawId || rawId.toUpperCase() === "ID") return;

                const claveUnica = rawId.toLowerCase();
                if (idsVistos.has(claveUnica)) return;
                idsVistos.add(claveUnica);

                let timestamp = Infinity;
                const partes = fechaStr.split("/");
                if (partes.length === 3) {
                    const ts = new Date(+partes[2], +partes[1] - 1, +partes[0]).getTime();
                    if (!isNaN(ts)) timestamp = ts;
                }

                const prefijo = (rawId.match(/^[A-Za-z]+/)?.[0] || "").toUpperCase();
                const subcarpeta = subcarpetasPorPrefijo[prefijo] || (cat.tipo === "gratuitos" ? "packs gratuitos" : "expansiones");
                const rutaIconoDirecta = `img/icon-pack/${subcarpeta}/${rawId}.webp`;
                const ruta = (typeof window.rutaIconoPack === "function" ? window.rutaIconoPack(nombre) : null) || rutaIconoDirecta;

                packs.push({
                    id: `pack_${rawId.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
                    nombre: nombre,
                    tipo: cat.tipo,
                    rutaIcono: ruta,
                    forma: "circulo",
                    encuadre: { x: 0, y: 0, zoom: 1 },
                    _fechaLanzamiento: timestamp
                });
            });
        });

        packs.sort((a, b) => a._fechaLanzamiento - b._fechaLanzamiento);
        return packs;
    }

    // ── 5. POBLAR Y SINCRONIZAR ELEMENTOS DISPONIBLES ──────────
    function sincronizarElementosDisponibles(modo) {
        const estado = window.EstadoTierList;
        estado.modo = modo;

        if (modo === "personalizada") {
            // En personalizada los elementos provienen de imágenes subidas por el usuario
            return;
        }

        let listaTodos = [];
        let filtrosActivos = [];

        if (modo === "mundos") {
            listaTodos = obtenerTodosLosMundos();
            filtrosActivos = Array.isArray(estado.modos.mundos?.filtros) ? estado.modos.mundos.filtros : ["base", "expansion", "contenido"];
            if (!estado.titulo || estado.titulo === "Tier List de Packs de Los Sims 4" || estado.titulo === "Mi Tier List") {
                estado.titulo = "Tier List de Mundos de Los Sims 4";
            }
        } else if (modo === "packs") {
            listaTodos = obtenerTodosLosPacks();
            filtrosActivos = Array.isArray(estado.modos.packs?.filtros) ? estado.modos.packs.filtros : ["base", "expansion", "contenido", "accesorios", "kits", "gratuitos"];
            if (!estado.titulo || estado.titulo === "Tier List de Mundos de Los Sims 4" || estado.titulo === "Mi Tier List") {
                estado.titulo = "Tier List de Packs de Los Sims 4";
            }
        }

        // Actualizar diccionario de elementos conocidos
        const setFiltros = new Set(Array.isArray(filtrosActivos) ? filtrosActivos : []);
        const elementosValidosSet = new Set();

        listaTodos.forEach(item => {
            estado.elementos[item.id] = item;
            if (setFiltros.has(item.tipo)) {
                elementosValidosSet.add(item.id);
            }
        });

        // 1. Limpiar de las tiers elementos que ya no coincidan con el filtro
        estado.tiers.forEach(tier => {
            tier.elementos = tier.elementos.filter(id => elementosValidosSet.has(id));
        });

        // 2. Elementos que ya están ubicados en alguna tier
        const enTiers = new Set();
        estado.tiers.forEach(t => t.elementos.forEach(id => enTiers.add(id)));

        // 3. Reconstruir sinClasificar con los elementos válidos que no estén en tiers,
        // garantizando estrictamente el orden cronológico de listaTodos
        const nuevoSinClasificar = [];
        listaTodos.forEach(item => {
            if (elementosValidosSet.has(item.id) && !enTiers.has(item.id)) {
                nuevoSinClasificar.push(item.id);
            }
        });
        estado.sinClasificar = nuevoSinClasificar;
    }

    // ── 6. AUTOGUARDADO LOCAL (DEBOUNCED) ──────────────────────
    function notificarCambioEstado(emitirOBS = true) {
        if (_timerAutoGuardado) clearTimeout(_timerAutoGuardado);
        _timerAutoGuardado = setTimeout(() => {
            guardarBorradorLocal();
            if (window.EstadoTierList.modo !== "personalizada") {
                actualizarURLDinamica();
            }
        }, 250);

        if (emitirOBS && typeof window.emitirEventoOBS === "function" && !window.esSincronizacionOBS) {
            emitirEstadoOBS();
        }
    }

    function guardarBorradorLocal() {
        try {
            const estado = window.EstadoTierList;
            const borradorLigero = {
                version: estado.version,
                modo: estado.modo,
                titulo: estado.titulo,
                forma: estado.forma,
                filtros: estado.filtros,
                tiers: estado.tiers,
                sinClasificar: estado.sinClasificar,
                elementosMeta: {}
            };

            // Para elementos personalizados o con encuadre, guardar metadatos
            Object.keys(estado.elementos).forEach(id => {
                const el = estado.elementos[id];
                borradorLigero.elementosMeta[id] = {
                    id: el.id,
                    nombre: el.nombre,
                    tipo: el.tipo,
                    rutaIcono: el.rutaIcono,
                    encuadre: el.encuadre || { x: 0, y: 0, zoom: 1 }
                };
            });

            // Guardar también token y URL si corresponde a modo compartible v1
            if (estado.modo !== "personalizada") {
                const token = serializarEstadoURL();
                if (token) {
                    borradorLigero.token = token;
                    borradorLigero.url = "#tier-list/v1/" + token;
                }
            }

            localStorage.setItem("lotlab_tierlist_draft", JSON.stringify(borradorLigero));
        } catch (e) {
            console.warn("[TierList] No se pudo guardar borrador en localStorage:", e);
        }
    }

    function hayBorradorRecuperable() {
        try {
            const raw = localStorage.getItem("lotlab_tierlist_draft");
            if (!raw) return false;
            const data = JSON.parse(raw);
            if (!data || !data.tiers) return false;

            // Comprobar si tiene trabajo real: alguna tier con elementos o modo personalizada con elementos
            const tieneElementosEnTiers = data.tiers.some(t => t.elementos && t.elementos.length > 0);
            const esPersonalizadaConFotos = data.modo === "personalizada" && (
                (data.sinClasificar && data.sinClasificar.length > 0) || tieneElementosEnTiers
            );

            return tieneElementosEnTiers || esPersonalizadaConFotos;
        } catch (e) {
            return false;
        }
    }

    async function cargarBorradorLocal() {
        try {
            const raw = localStorage.getItem("lotlab_tierlist_draft");
            if (!raw) return false;
            const data = JSON.parse(raw);
            if (!data) return false;

            // Asegurar que los datos de database estén listos
            if (typeof database === "undefined" || !Array.isArray(database.mundos) || database.mundos.length === 0) {
                await new Promise(resolve => {
                    document.addEventListener("datosCargados", resolve, { once: true });
                    setTimeout(resolve, 2000);
                });
            }

            // Si es Mundos o Packs, reutilizar el mecanismo existente de carga de URL v1
            if (data.modo !== "personalizada") {
                let token = data.token;
                if (!token && data.url) {
                    const match = data.url.match(/tier-?list\/v1\/([^/?#]+)/);
                    if (match) token = match[1];
                }
                // Si proviene de un borrador previo sin token guardado, sintetizar token v1
                if (!token && data.tiers) {
                    const encuadres = {};
                    if (data.elementosMeta) {
                        Object.keys(data.elementosMeta).forEach(id => {
                            const enc = data.elementosMeta[id]?.encuadre;
                            if (enc && (enc.x !== 0 || enc.y !== 0 || enc.zoom !== 1)) {
                                encuadres[id] = [Math.round(enc.x), Math.round(enc.y), +(enc.zoom.toFixed(2))];
                            }
                        });
                    }
                    const min = {
                        v: data.version || 1,
                        m: data.modo === "mundos" ? "m" : "p",
                        t: data.titulo,
                        f: data.forma === "circulo" ? "c" : "q",
                        fl: data.modo === "mundos" ? (data.filtros?.mundos || data.filtros) : (data.filtros?.packs || data.filtros),
                        tr: (data.tiers || []).map(t => ({ id: t.id, n: t.nombre, c: t.color, el: t.elementos, ...(t.ancho ? { w: t.ancho } : {}) })),
                        sc: data.sinClasificar || [],
                        enc: Object.keys(encuadres).length > 0 ? encuadres : undefined
                    };
                    try {
                        const json = JSON.stringify(min);
                        token = (typeof window.codificarBase64URL === "function")
                            ? window.codificarBase64URL(json)
                            : btoa(unescape(encodeURIComponent(json))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
                    } catch (e) {}
                }

                if (token && deserializarEstadoURL(token)) {
                    return { ok: true, token };
                }
            }

            // Modo personalizada (o si no hubiera token v1):
            const estado = window.EstadoTierList;
            estado.version = data.version || TIERLIST_VERSION;
            estado.modo = data.modo || "personalizada";
            estado.pantalla = "tablero";
            estado.titulo = data.titulo || (estado.modo === "mundos" ? "Tier List de Mundos de Los Sims 4" : "Mi Tier List");
            estado.forma = data.forma || "cuadrado";
            if (data.tiers) estado.tiers = data.tiers;
            if (data.sinClasificar) estado.sinClasificar = data.sinClasificar;

            if (estado.modo === "personalizada") {
                const imagenes = await obtenerTodasImagenesCustomDB();
                estado.imagenesCustom = imagenes;
                estado.elementos = {};
                if (data.elementosMeta) {
                    Object.keys(data.elementosMeta).forEach(id => {
                        const m = data.elementosMeta[id];
                        estado.elementos[id] = {
                            id: m.id,
                            nombre: m.nombre,
                            tipo: "personalizada",
                            rutaIcono: imagenes[id] || m.rutaIcono || "",
                            encuadre: m.encuadre || { x: 0, y: 0, zoom: 1 }
                        };
                    });
                }
                // La actualización de URL la gestiona el llamador
            } else {
                if (data.filtros) {
                    if (estado.modo === "mundos") estado.modos.mundos.filtros = data.filtros.mundos || data.filtros;
                    else if (estado.modo === "packs") estado.modos.packs.filtros = data.filtros.packs || data.filtros;
                }
                sincronizarElementosDisponibles(estado.modo);
                if (data.tiers) estado.tiers = data.tiers;
                if (data.sinClasificar) estado.sinClasificar = data.sinClasificar;
                if (data.elementosMeta) {
                    Object.keys(data.elementosMeta).forEach(id => {
                        if (estado.elementos[id] && data.elementosMeta[id].encuadre) {
                            estado.elementos[id].encuadre = data.elementosMeta[id].encuadre;
                        }
                    });
                }
                // La actualización de URL la gestiona el llamador
            }

            return { ok: true, token: null };
        } catch (e) {
            console.error("[TierList] Error cargando borrador:", e);
            return false;
        }
    }

    function descartarBorradorLocal() {
        localStorage.removeItem("lotlab_tierlist_draft");
        limpiarImagenesCustomDB();
    }

    // ── 7. SERIALIZACIÓN Y DESERIALIZACIÓN PARA URL (MUNDOS / PACKS) ──
    function serializarEstadoURL() {
        const estado = window.EstadoTierList;
        if (estado.modo === "personalizada") return null;

        // Formato compacto para URL
        const encuadresPersonalizados = {};
        Object.keys(estado.elementos).forEach(id => {
            const enc = estado.elementos[id].encuadre;
            if (enc && (enc.x !== 0 || enc.y !== 0 || enc.zoom !== 1)) {
                encuadresPersonalizados[id] = [Math.round(enc.x), Math.round(enc.y), +(enc.zoom.toFixed(2))];
            }
        });

        const min = {
            v: 1,
            m: estado.modo === "mundos" ? "m" : "p",
            t: estado.titulo,
            f: estado.forma === "circulo" ? "c" : "q",
            fl: estado.modo === "mundos" ? estado.filtros.mundos : estado.filtros.packs,
            tr: estado.tiers.map(t => ({
                id: t.id,
                n: t.nombre,
                c: t.color,
                el: t.elementos,
                ...(t.ancho ? { w: t.ancho } : {})
            })),
            sc: estado.sinClasificar,
            enc: Object.keys(encuadresPersonalizados).length > 0 ? encuadresPersonalizados : undefined
        };

        try {
            const json = JSON.stringify(min);
            if (typeof window.codificarBase64URL === "function") {
                return window.codificarBase64URL(json);
            }
            return btoa(unescape(encodeURIComponent(json))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        } catch (e) {
            console.warn("[TierList] Error serializando a token URL:", e);
            return null;
        }
    }

    function deserializarEstadoURL(token) {
        if (!token) return false;
        try {
            let json = "";
            if (typeof window.decodificarBase64URL === "function") {
                json = window.decodificarBase64URL(token);
            } else {
                let b64 = token.replace(/-/g, "+").replace(/_/g, "/");
                while (b64.length % 4 !== 0) b64 += "=";
                json = decodeURIComponent(escape(atob(b64)));
            }

            const min = JSON.parse(json);
            if (!min || !min.tr) return false;

            const estado = window.EstadoTierList;
            estado.version = min.v || 1;
            estado.pantalla = "tablero";
            estado.modo = min.m === "m" ? "mundos" : "packs";
            estado.titulo = min.t || (estado.modo === "mundos" ? "Tier List de Mundos de Los Sims 4" : "Tier List de Packs de Los Sims 4");
            if (min.f) {
                estado.forma = min.f === "c" ? "circulo" : "cuadrado";
            }

            if (min.fl && Array.isArray(min.fl)) {
                if (estado.modo === "mundos") estado.modos.mundos.filtros = min.fl;
                else estado.modos.packs.filtros = min.fl;
            }

            // Reconstruir elementos desde la base de datos
            sincronizarElementosDisponibles(estado.modo);

            // Reconstruir tiers
            estado.tiers = min.tr.map((t, idx) => ({
                id: t.id || `tier_${idx}`,
                nombre: t.n || "Tier",
                color: t.c || "#ff4d4d",
                orden: idx,
                elementos: Array.isArray(t.el) ? t.el : [],
                ...(t.w ? { ancho: t.w } : {})
            }));

            if (Array.isArray(min.sc)) {
                estado.sinClasificar = min.sc;
            }

            // Restaurar encuadres
            if (min.enc) {
                Object.keys(min.enc).forEach(id => {
                    const arr = min.enc[id];
                    if (estado.elementos[id] && Array.isArray(arr) && arr.length >= 3) {
                        estado.elementos[id].encuadre = { x: arr[0], y: arr[1], zoom: arr[2] };
                    }
                });
            }

            return true;
        } catch (e) {
            console.error("[TierList] Error deserializando token URL:", e);
            return false;
        }
    }

    function actualizarURLDinamica() {
        const estado = window.EstadoTierList;
        if (typeof window.actualizarHashURL !== "function") return;

        // Si estamos en la pantalla selector, mantener ruta base de selector
        if (estado.pantalla === "selector") {
            window.actualizarHashURL("tier-list", false);
            return;
        }

        // Modo personalizada mantiene su ruta fija (sin serialización v1 con imágenes)
        if (estado.modo === "personalizada") {
            window.actualizarHashURL("tier-list/personalizada", false);
            return;
        }

        // Modos Mundos y Packs en tablero: mantener URL dinámica con token v1
        const token = serializarEstadoURL();
        if (token) {
            window.actualizarHashURL("tier-list/v1/" + token, false);
        } else if (estado.modo === "mundos" || estado.modo === "packs") {
            window.actualizarHashURL("tier-list/" + estado.modo, false);
        }
    }

    // ── 8. ARCHIVO .LOTLAB AUTOSUFICIENTE ──────────────────────
    function extraerFiltrosModo(filtrosData, modo) {
        if (!filtrosData) return null;
        if (Array.isArray(filtrosData)) return filtrosData;
        if (typeof filtrosData === "object" && modo && Array.isArray(filtrosData[modo])) {
            return filtrosData[modo];
        }
        return null;
    }

    function exportarArchivoLotlab() {
        const estado = window.EstadoTierList;
        const contenido = {
            formatVersion: 1,
            generadoPor: "LOT-LAB Sims 4",
            fecha: new Date().toISOString(),
            modo: estado.modo,
            titulo: estado.titulo,
            forma: estado.forma,
            filtros: Array.isArray(estado.modos[estado.modo]?.filtros) ? [...estado.modos[estado.modo].filtros] : [],
            tiers: estado.tiers,
            sinClasificar: estado.sinClasificar,
            elementos: estado.elementos,
            // En personalizada, las imágenes WebP van directamente embebidas
            imagenesCustom: estado.modo === "personalizada" ? estado.imagenesCustom : {}
        };

        const blob = new Blob([JSON.stringify(contenido, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const nombreLimpio = (estado.titulo || "TierList").replace(/[^a-zA-Z0-9_\-áéíóúñÁÉÍÓÚÑ]/g, "_");
        a.href = url;
        a.download = `${nombreLimpio}.lotlab`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async function importarArchivoLotlab(archivo) {
        return new Promise((resolve, reject) => {
            if (!archivo) return reject(new Error("No se seleccionó ningún archivo"));
            const reader = new FileReader();
            reader.onload = async (e) => {
                const estado = window.EstadoTierList;
                // Snapshot de respaldo para recuperación segura si falla la importación
                const snapshotRespaldo = {
                    pantalla: estado.pantalla,
                    modo: estado.modo,
                    modos: {
                        mundos: JSON.parse(JSON.stringify(estado.modos.mundos)),
                        packs: JSON.parse(JSON.stringify(estado.modos.packs)),
                        personalizada: JSON.parse(JSON.stringify(estado.modos.personalizada))
                    }
                };

                try {
                    const data = JSON.parse(e.target.result);
                    if (!data || !data.formatVersion || !Array.isArray(data.tiers)) {
                        throw new Error("El archivo .lotlab no tiene un formato válido");
                    }

                    const targetModo = estado.modo || data.modo || "personalizada";
                    estado.version = data.formatVersion;
                    estado.pantalla = "tablero";
                    estado.modo = targetModo;
                    estado.titulo = data.titulo || (targetModo === "mundos" ? "Tier List de Mundos de Los Sims 4" : targetModo === "packs" ? "Tier List de Packs de Los Sims 4" : "Mi Tier List");

                    const filtrosImportados = extraerFiltrosModo(data.filtros, targetModo);
                    if (filtrosImportados && data.modo === targetModo) {
                        estado.modos[targetModo].filtros = filtrosImportados;
                    }

                    // Reconstruir estructura de tiers desde el archivo
                    estado.tiers = data.tiers.map((t, idx) => ({
                        id: t.id || `tier_${idx}`,
                        nombre: t.nombre || "Tier",
                        color: t.color || "#ff4d4d",
                        orden: idx,
                        elementos: [],
                        ...(t.ancho ? { ancho: t.ancho } : {})
                    }));

                    if (targetModo === "personalizada") {
                        if (data.modo === "personalizada") {
                            estado.imagenesCustom = data.imagenesCustom || {};
                            estado.elementos = {};
                            if (data.elementos && typeof data.elementos === "object") {
                                Object.keys(data.elementos).forEach(id => {
                                    const el = data.elementos[id];
                                    estado.elementos[id] = {
                                        id: el.id,
                                        nombre: el.nombre,
                                        tipo: "personalizada",
                                        forma: el.forma || "cuadrado",
                                        rutaIcono: (data.imagenesCustom && data.imagenesCustom[id]) || el.rutaIcono || "",
                                        encuadre: el.encuadre || { x: 0, y: 0, zoom: 1 }
                                    };
                                });
                            }

                            data.tiers.forEach((t, idx) => {
                                if (estado.tiers[idx] && Array.isArray(t.elementos)) {
                                    estado.tiers[idx].elementos = t.elementos.filter(id => estado.elementos[id]);
                                }
                            });
                            estado.sinClasificar = Array.isArray(data.sinClasificar) ? data.sinClasificar.filter(id => estado.elementos[id]) : [];

                            const ids = Object.keys(estado.imagenesCustom);
                            for (const id of ids) {
                                await guardarImagenCustomDB(id, estado.imagenesCustom[id]);
                                if (estado.elementos[id]) {
                                    estado.elementos[id].rutaIcono = estado.imagenesCustom[id];
                                }
                            }
                        } else {
                            // Importado a personalizada desde otro modo: se conserva estructura pero no se importan elementos
                            estado.sinClasificar = Object.keys(estado.elementos || {});
                        }
                    } else {
                        // Modos Mundos o Packs
                        sincronizarElementosDisponibles(targetModo);

                        if (data.modo === targetModo) {
                            const colocados = new Set();
                            data.tiers.forEach((t, idx) => {
                                if (estado.tiers[idx] && Array.isArray(t.elementos)) {
                                    const validos = t.elementos.filter(id => {
                                        if (estado.elementos[id] && !colocados.has(id)) {
                                            colocados.add(id);
                                            return true;
                                        }
                                        return false;
                                    });
                                    estado.tiers[idx].elementos = validos;
                                }
                            });

                            if (Array.isArray(data.sinClasificar) && data.sinClasificar.length > 0) {
                                estado.sinClasificar = data.sinClasificar.filter(id => estado.elementos[id] && !colocados.has(id));
                                Object.keys(estado.elementos).forEach(id => {
                                    if (!colocados.has(id) && !estado.sinClasificar.includes(id)) {
                                        estado.sinClasificar.push(id);
                                    }
                                });
                            } else {
                                estado.sinClasificar = Object.keys(estado.elementos).filter(id => !colocados.has(id));
                            }

                            if (data.elementos && typeof data.elementos === "object") {
                                Object.keys(data.elementos).forEach(id => {
                                    if (estado.elementos[id] && data.elementos[id].encuadre) {
                                        estado.elementos[id].encuadre = data.elementos[id].encuadre;
                                    }
                                });
                            }
                        } else {
                            // El archivo es de otro modo (ej: importó Packs en Mundos):
                            // Estructura de tiers adaptada, pero los elementos del otro modo NO se copian.
                            // Todos los elementos propios de este modo van a sinClasificar.
                            estado.tiers.forEach(t => { t.elementos = []; });
                            estado.sinClasificar = Object.keys(estado.elementos);
                        }
                    }

                    guardarBorradorLocal();
                    resolve(true);
                } catch (err) {
                    // Restauración segura del estado previo en caso de error
                    estado.pantalla = snapshotRespaldo.pantalla;
                    estado.modo = snapshotRespaldo.modo;
                    estado.modos.mundos = snapshotRespaldo.modos.mundos;
                    estado.modos.packs = snapshotRespaldo.modos.packs;
                    estado.modos.personalizada = snapshotRespaldo.modos.personalizada;
                    reject(new Error("Error procesando el archivo: " + err.message));
                }
            };
            reader.onerror = () => reject(new Error("Error leyendo el archivo"));
            reader.readAsText(archivo);
        });
    }

    // ── 9. EMISIÓN DE EVENTO OBS ESPECÍFICO ────────────────────
    function emitirEstadoOBS() {
        const estado = window.EstadoTierList;
        const payload = {
            version: estado.version,
            modo: estado.modo,
            titulo: estado.titulo,
            forma: estado.forma,
            filtros: estado.filtros,
            tiers: estado.tiers,
            sinClasificar: estado.sinClasificar,
            elementos: estado.elementos,
            // Solo en modo personalizada enviamos imágenes para OBS
            imagenesCustom: estado.modo === "personalizada" ? estado.imagenesCustom : {}
        };

        if (typeof window.emitirEventoOBS === "function") {
            window.emitirEventoOBS("TIER_LIST_ESTADO", { estado: payload });
        }
    }

    // ── 9.0 LIMPIAR FICHAS ────────────────────────────────────
    function limpiarFichas(alcance = "actual") {
        const estado = window.EstadoTierList;
        const modoOriginal = estado.modo;
        const modosALimpiar = (alcance === "todos") ? ["mundos", "packs", "personalizada"] : [modoOriginal];

        modosALimpiar.forEach(m => {
            const modoObj = estado.modos[m];
            if (!modoObj) return;

            // Retirar fichas de todos los tiers de este modo sin tocar estructura, nombres, colores ni anchos
            if (Array.isArray(modoObj.tiers)) {
                modoObj.tiers.forEach(t => {
                    t.elementos = [];
                });
            }

            // Devolver las fichas a sinClasificar
            if (m === "personalizada") {
                const ids = Object.keys(modoObj.elementos || {});
                modoObj.sinClasificar = ids;
            } else {
                sincronizarElementosDisponibles(m);
            }
        });

        estado.modo = modoOriginal;
        guardarBorradorLocal();
        notificarCambioEstado();
    }

    // ── 9.1 RESTAURAR ESTADO DE FÁBRICA ───────────────────────
    async function restaurarDeFabrica(alcance = "todos") {
        const estado = window.EstadoTierList;
        const modoOriginal = estado.modo;

        if (alcance === "todos") {
            limpiarPreferenciasGlobales();
            descartarBorradorLocal();

            estado.modos.mundos = {
                titulo: "Tier List de Mundos de Los Sims 4",
                filtros: ["base", "expansion", "contenido"],
                tiers: JSON.parse(JSON.stringify(ESTADO_INICIAL_TIERS)),
                sinClasificar: [],
                elementos: {}
            };
            sincronizarElementosDisponibles("mundos");

            estado.modos.packs = {
                titulo: "Tier List de Packs de Los Sims 4",
                filtros: ["base", "expansion", "contenido", "accesorios", "kits", "gratuitos"],
                tiers: JSON.parse(JSON.stringify(ESTADO_INICIAL_TIERS)),
                sinClasificar: [],
                elementos: {}
            };
            sincronizarElementosDisponibles("packs");

            await limpiarImagenesCustomDB();
            estado.modos.personalizada = {
                titulo: "Mi Tier List",
                tiers: JSON.parse(JSON.stringify(ESTADO_INICIAL_TIERS)),
                sinClasificar: [],
                elementos: {},
                imagenesCustom: {}
            };
        } else {
            const targetModo = (alcance === "actual" || !alcance) ? modoOriginal : alcance;
            if (targetModo === "mundos") {
                estado.modos.mundos = {
                    titulo: "Tier List de Mundos de Los Sims 4",
                    filtros: ["base", "expansion", "contenido"],
                    tiers: JSON.parse(JSON.stringify(ESTADO_INICIAL_TIERS)),
                    sinClasificar: [],
                    elementos: {}
                };
                sincronizarElementosDisponibles("mundos");
            } else if (targetModo === "packs") {
                estado.modos.packs = {
                    titulo: "Tier List de Packs de Los Sims 4",
                    filtros: ["base", "expansion", "contenido", "accesorios", "kits", "gratuitos"],
                    tiers: JSON.parse(JSON.stringify(ESTADO_INICIAL_TIERS)),
                    sinClasificar: [],
                    elementos: {}
                };
                sincronizarElementosDisponibles("packs");
            } else if (targetModo === "personalizada") {
                await limpiarImagenesCustomDB();
                estado.modos.personalizada = {
                    titulo: "Mi Tier List",
                    tiers: JSON.parse(JSON.stringify(ESTADO_INICIAL_TIERS)),
                    sinClasificar: [],
                    elementos: {},
                    imagenesCustom: {}
                };
            }
        }

        estado.modo = modoOriginal;
        guardarBorradorLocal();
        notificarCambioEstado();
    }

    // ── 10. SINCRONIZACIÓN CON CARGA ASÍNCRONA DE BASE DE DATOS ─
    document.addEventListener("datosCargados", () => {
        if (window.EstadoTierList && window.EstadoTierList.modo !== "personalizada") {
            sincronizarElementosDisponibles(window.EstadoTierList.modo);
            if (typeof window.TierListUI?.renderizarTierList === "function") {
                const vent = document.getElementById("ventanaTierList");
                if (vent && vent.style.display !== "none") {
                    window.TierListUI.renderizarTierList();
                }
            }
        }
    });

    // ── EXPORTACIÓN PÚBLICA ───────────────────────────────────
    window.TierListCore = {
        VERSION: TIERLIST_VERSION,
        ESTADO_INICIAL_TIERS,
        sincronizarElementosDisponibles,
        convertirImagenAWebP,
        guardarImagenCustomDB,
        obtenerTodasImagenesCustomDB,
        eliminarImagenCustomDB,
        limpiarImagenesCustomDB,
        notificarCambioEstado,
        guardarBorradorLocal,
        hayBorradorRecuperable,
        cargarBorradorLocal,
        descartarBorradorLocal,
        serializarEstadoURL,
        deserializarEstadoURL,
        actualizarURLDinamica,
        exportarArchivoLotlab,
        importarArchivoLotlab,
        emitirEstadoOBS,
        limpiarFichas,
        restaurarDeFabrica,
        obtenerPreferenciasGlobales,
        guardarPreferenciasGlobales,
        limpiarPreferenciasGlobales,
        obtenerAlcanceCambios,
        guardarAlcanceCambios,
        actualizarEstructuraTiersDesdeModo,
        agregarTierGlobal,
        eliminarTierGlobal,
        actualizarTierGlobal,
        sincronizarOrdenGlobalTiers,
        aplicarAnchoGlobal,
        aplicarAnchoIndividual,
        sincronizarModosConPreferencias,
        propagarConfiguracionModoATodos,
        get borradorResuelto() { return _borradorResuelto; },
        set borradorResuelto(val) { _borradorResuelto = val; }
    };

    console.log("✔ tier-list.js cargado correctamente");
})();
