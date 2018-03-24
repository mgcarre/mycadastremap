const express = require('express')
const app = express()
const path = require('path')
const port = 3000 || process.env.PORT
const mymw = require('./GZIP.js')
const config = require('./config.json')

app.get('/', (req, res) => res.sendFile(path.resolve(__dirname + '/public/index.html')))

app.get('/vue.js', (req, res) => {
    res.sendFile(path.resolve(__dirname + '/public/vue.js'))
})

app.get('/geom/:any/:type', mymw)

app.get('/token', (req, res) => {
    res.send(config.mapbox.token)
})

app.listen(port, () => console.log(`L'application est lancée sur le port ${port}. Ouvrez http://localhost:${port}`))
