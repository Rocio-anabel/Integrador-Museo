const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const translate = require('node-google-translate-skidz');

app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

app.get('/', (req, res)=> {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
})

app.get('/imagenes/:object_id', (req,res) => {
    const URL_OBJETO = "https://collectionapi.metmuseum.org/public/collection/v1/objects/"
    let html = "";

    fetch(URL_OBJETO + req.params.object_id)
    .then((response) => response.json())
    .then((data)=> {
        if (data.additionalImages.length == 1) {
            html = `<img src=${data.additionalImages[0]}>`;
        } else {
            for (const img of data.additionalImages) {
                html += `<img src=${img}>`;
            }
        }
        res.send(html);
    })
    .catch(error => {
        console.log(error.message);
        res.status(500).send('Error al obtener las imágenes');
    })
})

app.post('/traducir', async (req, res) => {
    const queryParams = {
        title: req.query.title,
        culture: req.query.culture,
        dynasty: req.query.dynasty
    };
    console.log(queryParams);
    if(!queryParams.title){
        return res.status(400).send({status: 'failed'})
    }
    
    try {
        const [titulo, cultura, dinastia] = await Promise.all([
            translateText(queryParams.title, 'en', 'es'),
            queryParams.culture ? translateText(queryParams.culture, 'en', 'es') : Promise.resolve(''),
            queryParams.dynasty ? translateText(queryParams.dynasty, 'en', 'es') : Promise.resolve('')
        ]);

        const objetoTraducido = {
            title: titulo,
            culture: cultura,
            dynasty: dinastia
        };
        console.log(objetoTraducido);
        res.status(200).send(objetoTraducido);
    } catch (error) {
        console.error('Error traducción:', error);
        res.status(500).send({ status: 'error', message: 'Internal Server Error' });
    }
})

app.get('/traducir/:displayName', async(req,res) => {
    const displayName = req.params.displayName;
    try {
        const displayNametraducido = await translateText(displayName, 'en','es');
        console.log(displayNametraducido);
        res.status(200).json({displayNametraducido});
    } catch (error) {
        console.error('Error traducción:', error);
        res.status(500).send({ status: 'error', message: 'Internal Server Error' });
    }
})

async function translateText(texto, sourceLang, targetLang) {
    return new Promise((resolve, reject) => {
        translate({
            text: texto,
            source: sourceLang,
            target: targetLang
        }, function(result) {
            if (result && result.translation) {
                resolve(result.translation);
            } else {
                reject('Error al traducir el texto');
            }
        });
    });
}
app.listen(8080, 'localhost', () => {
    console.log("Servidor corriendo en el puerto 8080")
});