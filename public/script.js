
const URL_OBJETOS_CON_IMAG = "https://collectionapi.metmuseum.org/public/collection/v1/search?hasImages=true&q=%22%22";
const URL_DEPARTAMENTOS = "https://collectionapi.metmuseum.org/public/collection/v1/departments";
const URL_OBJETO = "https://collectionapi.metmuseum.org/public/collection/v1/objects/";
const URL_SEARCH = "https://collectionapi.metmuseum.org/public/collection/v1/search?hasImages=true";

let indInicialMuestra = 28;
let indFinalMuestra = 160;


let paginaActual = 1;
const PAGINA_SIZE = 20;
let totalPaginas = indFinalMuestra / PAGINA_SIZE;
let objectIDs = [];

function cargarDepartamentos(){
    fetch(URL_DEPARTAMENTOS)
    .then((response) => response.json())
    .then((data) => {
        const selectDepartamento = document.getElementById("departamento");
        data.departments.forEach(departamento => {
            const option = document.createElement("option");
            option.value = departamento.departmentId;
            fetch(`traducir/${departamento.displayName}`)
            .then((response) => response.text())
            .then(displayNametraducido => option.textContent = displayNametraducido)
            .catch(error => {
                console.log(error.message)
                option.textContent = departamento.displayName;
            })
            selectDepartamento.appendChild(option);
        });
    })
} 

function paginado(objectIDs, PAGINA_SIZE, paginaActual, indiceInicial) {
    return objectIDs.slice(((paginaActual - 1) * PAGINA_SIZE ) + indiceInicial, (paginaActual * PAGINA_SIZE) + indiceInicial);
    
    
}

function cargarPagina(objectIDs, paginaActual, indiceInicial) {
    const objetosIDsPaginados = paginado(objectIDs, PAGINA_SIZE, paginaActual, indiceInicial);
    cargarObjetos(objetosIDsPaginados);
}

function cargarObjetos(objectIDs) {
    let objetosHTML = "";
    const grilla = document.getElementById("grilla");
    for (objectID of objectIDs) {
        fetch(URL_OBJETO + objectID)
        .then((response)=> response.json())
        .then((data)=> {
            if(!data.title || data.title == "Untitled" ){
                throw new Error('Invalid object data');
            }

            fetch(`traducir/?title=${data.title}&culture=${data.culture}&dynasty=${data.dynasty}`,{
                method: 'POST'
            })
            .then((response) => response.json())
            .then((objetoTraducido) => {
                if(data.additionalImages.length != 0) {
                    objetosHTML += `<div class="card" title="Fecha de creación = ${data.objectDate}">
                <img src=${data.primaryImageSmall != "" ? data.primaryImageSmall : "https://www.losprincipios.org/images/default.jpg"}>
                <div class="contenido">
                    <h1>${objetoTraducido.title}</h1>
                    <h2>Cultura: <span>${objetoTraducido.culture != "" ? objetoTraducido.culture : "--"}</span></h2>
                    <h2>Dinastia: <span>${objetoTraducido.dynasty != "" ? objetoTraducido.dynasty : "--"}</span></h2>
                    <a class="card-button" href="/imagenes/${data.objectID}" target="_blank">Ver más fotos</a>
                </div>
            </div>`
                } else {
                    objetosHTML += `<div class="card" title="Fecha de creación = ${data.objectDate}">
                <img src=${data.primaryImageSmall != "" ? data.primaryImageSmall : "https://www.losprincipios.org/images/default.jpg"}>
                <div class="contenido">
                    <h1>${objetoTraducido.title}</h1>
                    <h2>Cultura: <span>${objetoTraducido.culture != "" ? objetoTraducido.culture : "--"}</span></h2>
                    <h2>Dinastia: <span>${objetoTraducido.dynasty != "" ? objetoTraducido.dynasty : "--"}</span></h2>
                    <a class="card-button-disabled" href="">Ver más fotos</a>
                </div>
            </div>`
                }
            })
            .catch(error => console.log(error.message));
            
            
            
        grilla.innerHTML = objetosHTML;
        
        })
        .catch(error => console.log(error.message));
    }
}


fetch(URL_OBJETOS_CON_IMAG)
.then((response)=> response.json())
.then((data)=> {
    objectIDs = data.objectIDs;
    console.log(objectIDs);
    cargarPagina(objectIDs, paginaActual, indInicialMuestra);
})
document.addEventListener('DOMContentLoaded', function () {
    cargarDepartamentos();

    const inputKeyword = document.getElementById('keyword');

    inputKeyword.addEventListener('focus', function () {
        if (inputKeyword.value === 'palabra clave') {
            inputKeyword.value = ''; 
        }
    });

    inputKeyword.addEventListener('blur', function () {
        if (inputKeyword.value === '') {
            inputKeyword.value = 'palabra clave'; 
        }
    });

    const botonSiguiente = document.getElementById("siguiente");
    botonSiguiente.addEventListener("click", () => {
        if (paginaActual < totalPaginas) {
            paginaActual++;
            cargarPagina(objectIDs, paginaActual, indInicialMuestra);
        } 
        
    })

    const botonAnterior = document.getElementById("anterior");

    botonAnterior.addEventListener("click", () => {
        if (paginaActual > 1) {
            paginaActual--;
            cargarPagina(objectIDs, paginaActual, indInicialMuestra);
        } 
    })

    const botonFiltrar = document.getElementById("buttonFiltrar")
    botonFiltrar.addEventListener("click", (event) => {
        event.preventDefault();

        paginaActual = 1;
        indInicialMuestra = 0;

        const departamento = document.getElementById("departamento").value;
        const keyword = document.getElementById("keyword").value;
        const localizacion = document.getElementById("localizacion").value;

        const paramLocalizacion = (localizacion != "") ? `&geoLocation=${localizacion}` : "";
        const paramDepartamento = (departamento != "") ? `&departmentId=${departamento}` : "";
        const paramKeyword = (keyword != "palabra clave") ? `?q=${keyword}` : "&q=''";

        fetch(URL_SEARCH + paramKeyword + paramDepartamento + paramLocalizacion)
        .then((response) => response.json())
        .then((data) => {
            if(data.objectIDs != null) {
            totalPaginas = Math.ceil(data.objectIDs.length / PAGINA_SIZE);
            objectIDs = data.objectIDs;
            cargarPagina(objectIDs, paginaActual,indInicialMuestra);
            } else {
                document.getElementById("grilla").innerHTML = `<div class = "sin-resultados">No se ha encontrado resultados</div> `;
                paginaActual = 1;
                totalPaginas = 1;
            }
        })

    })

});