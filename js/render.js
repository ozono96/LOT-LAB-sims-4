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

    return `

    <div class="solarResultado">


        <button 
        class="botonSolar"
        onclick="abrirFichaSolar('${solar.id}')"
        onmouseenter="mostrarResumenSolar(event,'${solar.id}')"
        onmouseleave="ocultarResumenSolar()">


            🏡 ${solar.nombre}


        </button>


    </div>


    `;

}