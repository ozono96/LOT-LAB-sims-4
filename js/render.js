function mostrarSolares(listaSolares) {

    const zona = document.getElementById("listaResultados");

    if (!zona) {
        return;
    }

    if (!Array.isArray(listaSolares) || listaSolares.length === 0) {
        zona.innerHTML = "";
        return;
    }

    zona.innerHTML = listaSolares.map(solar => crearFichaSolar(solar)).join("");

}





function crearFichaSolar(solar) {

    const rutaPack  = typeof rutaIconoPack === "function" ? rutaIconoPack(solar.nombrePack) : null;
    const rutaMundo = typeof rutaIconoMundo === "function" ? rutaIconoMundo(solar.mundo) : null;

    let iconoHtml;

    if (rutaPack) {

        const imgMundo = rutaMundo
            ? `<img class="iconoMundoImg" src="${rutaMundo}" alt="${solar.mundo}" loading="lazy" decoding="async" onerror="this.style.display='none'">`
            : "";

        iconoHtml = `
            <img class="iconoPackImg" src="${rutaPack}" alt="${solar.nombrePack}" loading="lazy" decoding="async" onerror="this.style.display='none';this.parentElement.querySelector('.iconoTarjetaSolarFallback').style.display='flex'">
            ${imgMundo}
            <span class="iconoTarjetaSolarFallback" style="display:none;">📦</span>
        `;

    } else {

        iconoHtml = `<span class="iconoTarjetaSolarFallback">📦</span>`;

    }

    const claseHover = (rutaPack && rutaMundo) ? "tieneIconoMundo" : "";

    return `

    <div
        class="tarjetaSolar"
        onclick="abrirFichaSolar('${solar.id}')"
        onmouseenter="mostrarResumenSolar(event,'${solar.id}')"
        onmouseleave="ocultarResumenSolar()"
        ontouchstart="mostrarResumenSolar(event,'${solar.id}')"
        ontouchend="ocultarResumenSolar()"
        ontouchcancel="ocultarResumenSolar()"
    >

        <div class="iconoTarjetaSolar ${claseHover}">
            ${iconoHtml}
        </div>

        <div class="nombreTarjetaSolar">
            🏡 ${solar.nombre}
        </div>

    </div>

    `;

}