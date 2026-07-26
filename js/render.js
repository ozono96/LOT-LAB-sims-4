function mostrarSolares(listaSolares) {

    const zona = document.getElementById("listaResultados");

    if(!zona){
        return;
    }


    zona.innerHTML = "";


    listaSolares.forEach(solar => {

        zona.innerHTML += crearFichaSolar(solar);

    });


}





function crearFichaSolar(solar) {

    const rutaPack  = typeof rutaIconoPack === "function" ? rutaIconoPack(solar.nombrePack) : null;
    const rutaMundo = typeof rutaIconoMundo === "function" ? rutaIconoMundo(solar.mundo) : null;

    let iconoHtml;

    if (rutaPack) {

        const imgMundo = rutaMundo
            ? `<img class="iconoMundoImg" src="${rutaMundo}" alt="${solar.mundo}" onerror="this.style.display='none'">`
            : "";

        iconoHtml = `
            <img class="iconoPackImg" src="${rutaPack}" alt="${solar.nombrePack}" onerror="this.style.display='none';this.parentElement.querySelector('.iconoTarjetaSolarFallback').style.display='flex'">
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