const express = require('express')
const app = express()
const path = require('path')
const port = process.env.PORT
const mymw = require('./GZIP.js')

app.get('/geom/:any/:type', mymw)

app.listen(port, () => console.log(`L'application est lancée sur le port ${port}. Ouvrez http://localhost:${port}`))
