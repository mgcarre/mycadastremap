const zlib = require('zlib');
const http = require('https');
const fs = require('fs');

module.exports = function (req, res) {
    if (req.params.any.split('_')[0] == "ADRNIVX") {
        res.send({ message: "La recherche cadastrale ne peut pas avoir lieu sur une adresse précise mais approximative." })
        throw new Error('Recherche avec adresse précise')
    }
    let httpGetObject = new myUrl(req.params.any)
    let fichier = `${req.params.type}.json`
    let httpGetUrl = httpGetObject.getType(req.params.type)
    let httpRequest = http.get(httpGetUrl)
    httpRequest.on('response', (response) => {
        if (response.statusCode < 300) {
            let out = fs.createWriteStream(__dirname + '/' + fichier)
            let read = zlib.createGunzip()
            response.pipe(read).pipe(out)
            read.on('close', () => {
                res.sendFile(__dirname + '/' + fichier)
                console.log(`${httpGetObject.options[req.params.type]} : envoyé !`)
            })
            read.on('error', (err) => {
                console.error(`${httpGetObject.options[req.params.type]} : ERREUR !`, err, response)
                res.sendStatus(204)
            })
        } else {
            res.sendStatus(204)
        }
    })
}



class myUrl {
    constructor(code) {
        this.cp = code.match(/[0-9]{5}/gi)[0]
        this.baseUrl = 'https://cadastre.data.gouv.fr/data/etalab-cadastre/latest/geojson/communes/'
        this.options = ['batiments', 'communes', 'feuilles', 'lieux_dits', 'parcelles', 'sections']
    }
    getBaseUrl() {
        return this.baseUrl
    }
    getDepartement() {
        return this.cp.substr(0, 2) === "97" ? this.cp.substr(0, 3) : this.cp.substr(0, 2)
    }
    getFolder() {
        return this.getBaseUrl() + this.getDepartement() + '/' + this.cp
    }
    getBatiments() {
        return this.getFolder() + `/cadastre-${this.cp}-${this.options[0]}.json.gz`
    }
    getType(type = 0) {
        return this.getFolder() + `/cadastre-${this.cp}-${this.options[type]}.json.gz`
    }
}
