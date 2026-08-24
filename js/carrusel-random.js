/* ==========================================================
   ENGINE REUTILIZABLE DE CARRUSEL / SLOT HORIZONTAL
   carrusel-random.js
   Compartido por: Habilidades, Packs, Mundos
   ========================================================== */

window.ejecutarGiroSecuencialSlot = function (config) {
    const {
        estado,             // { animacionActiva, acelerado, animTimer }
        elegidas,           // Array de seleccionados
        index,              // Índice actual (0..elegidas.length-1)
        fuentePool,         // Array de todos los elementos disponibles para relleno
        ids,                // { animacion, pista, progresoWrap, progresoTexto, acelerarWrap, final, grid }
        renderItemTrackHTML,// (item, idx, esTarget) => string
        renderCardFinal,    // (item, idx) => HTMLElement
        onFinish            // opcional () => void
    } = config;

    if (!estado.animacionActiva) return;

    const animacion = document.getElementById(ids.animacion);
    const pista = document.getElementById(ids.pista);
    const final = document.getElementById(ids.final);
    const grid = document.getElementById(ids.grid);
    const progresoWrap = document.getElementById(ids.progresoWrap);
    const progresoTexto = document.getElementById(ids.progresoTexto);
    const acelerarWrap = document.getElementById(ids.acelerarWrap);

    if (!animacion || !pista) return;

    // Actualizar texto del badge en selecciones múltiples
    if (progresoTexto && elegidas.length > 1) {
        progresoTexto.textContent = "SELECCIÓN " + (index + 1) + "/" + elegidas.length;
    }

    const itemObjetivo = elegidas[index];
    const pool = (fuentePool && fuentePool.length > 0) ? fuentePool : elegidas;

    // Cantidad de elementos previos al objetivo
    const targetIndex = estado.acelerado ? 18 : (elegidas.length === 1 ? 45 : (index === 0 ? 30 : 22));
    const itemsSecuencia = [];

    for (let i = 0; i < targetIndex; i++) {
        itemsSecuencia.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    // Elemento objetivo que aterrizará en el selector central
    itemsSecuencia.push(itemObjetivo);
    // Elementos posteriores para que nunca se vacíe la pista
    for (let i = 0; i < 22; i++) {
        itemsSecuencia.push(pool[Math.floor(Math.random() * pool.length)]);
    }

    pista.innerHTML = itemsSecuencia.map((item, idx) => renderItemTrackHTML(item, idx, idx === targetIndex)).join("");

    requestAnimationFrame(() => {
        const animWidth = animacion.getBoundingClientRect().width || 520;
        const itemWidth = 104;
        const itemGap = 14;
        const step = itemWidth + itemGap;

        const startX = (animWidth - itemWidth) / 2;
        const targetX = startX - (targetIndex * step);

        pista.style.transition = "none";
        pista.style.transform = "translateX(" + startX + "px)";

        requestAnimationFrame(() => {
            const esAcel = estado.acelerado;
            let duracionMs = 0;
            let curva = "";
            let pausaConfirmacionMs = 0;

            if (esAcel) {
                duracionMs = 550;
                curva = "cubic-bezier(0.15, 0.85, 0.25, 1.0)";
                pausaConfirmacionMs = 280;
            } else {
                if (elegidas.length === 1) {
                    duracionMs = 3200;
                    curva = "cubic-bezier(0.12, 0.85, 0.18, 1.0)";
                    pausaConfirmacionMs = 700;
                } else if (index === 0) {
                    duracionMs = 1700;
                    curva = "cubic-bezier(0.14, 0.85, 0.2, 1.0)";
                    pausaConfirmacionMs = 550;
                } else {
                    duracionMs = 1300;
                    curva = "cubic-bezier(0.14, 0.85, 0.2, 1.0)";
                    pausaConfirmacionMs = 480;
                }
            }

            pista.style.transition = "transform " + (duracionMs / 1000) + "s " + curva;
            pista.style.transform = "translateX(" + targetX + "px)";

            estado.animTimer = setTimeout(() => {
                // Iluminar la casilla seleccionada
                const itemLanded = pista.querySelector(".habAnim-item[data-idx='" + targetIndex + "']");
                if (itemLanded) itemLanded.classList.add("habAnim-item--elegida");

                // Pausa de confirmación antes de la siguiente o final
                estado.animTimer = setTimeout(() => {
                    if (index + 1 < elegidas.length) {
                        window.ejecutarGiroSecuencialSlot({
                            ...config,
                            index: index + 1
                        });
                    } else {
                        // Fin de las selecciones: mostrar resultado final
                        animacion.style.display = "none";
                        if (progresoWrap) progresoWrap.style.display = "none";
                        if (acelerarWrap) acelerarWrap.style.display = "none";

                        if (grid) {
                            grid.innerHTML = "";
                            elegidas.forEach((item, i) => {
                                const card = renderCardFinal(item, i);
                                if (card) grid.appendChild(card);
                            });
                        }
                        if (final) final.style.display = "block";
                        estado.animacionActiva = false;
                        if (typeof onFinish === "function") onFinish();
                    }
                }, pausaConfirmacionMs);
            }, duracionMs + 30);
        });
    });
};
