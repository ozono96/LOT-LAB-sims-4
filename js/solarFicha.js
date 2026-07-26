function abrirFichaSolar(idSolar){


    const solar = database.solares.find(
        solar => solar.id == idSolar
    );


    if(!solar){
        return;
    }


    document.getElementById(
        "contenidoFichaSolar"
    ).innerHTML = `


        <h3>
            ${solar.nombre}
        </h3>


        <p>
            📦 Pack:
            ${solar.nombrePack}
        </p>


        <p>
            🌎 Mundo:
            ${solar.mundo}
        </p>


        <p>
            🏘️ Barrio:
            ${solar.barrio}
        </p>


        <p>
            🏠 Tipo de lote:
            ${solar.tipoLote}
        </p>


        <p>
            🏡 Tipo de solar:
            ${solar.tipoSolar}
        </p>


        <p>
            📐 Tamaño:
            ${solar.tamaño}
        </p>


        <p>
            🧭 Orientación:
            ${solar.orientacion}
        </p>


        <p>
            🚶 Acera:
            ${solar.acera}
        </p>


        <div id="galeriaFichaSolar" class="galeriaFichaSolarWrapper"></div>


    `;


    abrirVentana(
        "ventanaFichaSolar"
    );

    if (typeof cargarGaleriaSolar === "function") {
        cargarGaleriaSolar(solar.id);
    }

}

function mostrarResumenSolar(event,idSolar){


    const solar = database.solares.find(
        solar => solar.id == idSolar
    );


    if(!solar){
        return;
    }


    const tooltip =
    document.getElementById("tooltipSolar");


    if(!tooltip){
        return;
    }


    tooltip.innerHTML = `

        <strong>${solar.nombre}</strong>

        <br><br>

        📦 ${solar.nombrePack}

        <br>

        🌎 ${solar.mundo}

        <br>

        🏘️ ${solar.barrio}

        <br>

        🏠 ${solar.tipoSolar}

        <br>

        📐 ${solar.tamaño}

    `;


    tooltip.style.display="block";


}

document.addEventListener("mousemove",(e)=>{


    const tooltip =
    document.getElementById("tooltipSolar");


    if(
        tooltip &&
        tooltip.style.display==="block"
    ){


        tooltip.style.left =
        (e.clientX + 18) + "px";


        tooltip.style.top =
        (e.clientY + 18) + "px";


    }


});



function ocultarResumenSolar(){


    const tooltip =
    document.getElementById("tooltipSolar");


    if(tooltip){

        tooltip.style.display="none";

    }

}