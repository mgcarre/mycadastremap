const mapboxgl = require('mapbox-gl')
const area = require('@turf/area').default
const turf = require('@turf/helpers')
const token = process.env.TOKEN

class MapboxMap {
    constructor(HTMLelement) {
        this.HTMLContainer = document.querySelector(HTMLelement)
        this.loaded = false
        this.map = null
        this.markerTitle = ''
        this.couches = new Array()
        this.layerColours = {
            building: {
                'fill-color': '#f08',
                'fill-opacity': 0.4
            },
            city: {
                'fill-outline-color': '#889be8',
                'fill-opacity': 0.35,
            },
            sheet: {
                'fill-color': '#f6ff9e',
                'fill-opacity': 0.1
            },
            known: {
                'fill-color': '#f6ff9e',
                'fill-opacity': 0.2
            },
            area: {
                'fill-color': '#5b602b',
                'fill-opacity': 0.3
            },
            section: {
                'fill-color': '#797a73',
                'fill-opacity': 0.15
            }

        }
    }
    load() {
        if (!this.loaded) {
            this.loaded = true
            mapboxgl.accessToken = token
            this.map = new mapboxgl.Map({
                container: this.HTMLContainer,
                center: [2.5377, 46.718],
                zoom: 4,
                style: 'mapbox://styles/mgcarre/cj9suhpr72dkz2socqotoy2p8'
            });
            this.map.addControl(new mapboxgl.NavigationControl());
            this.map.addControl(new mapboxgl.FullscreenControl());
            this.addButton()
            this.map.on('mousemove', (event) => this.evented(event))
            this.map.on('touchmove', (event) => this.evented(event))
            this.map.on('contextmenu', (event) => {
                let ici = this.map.queryRenderedFeatures(event.point)
                let target = document.querySelector('#surface-section')
                let sortie = new Array()
                ici.forEach(calque => {
                    if (calque.layer.id.indexOf('cadastre-calque') > -1) {
                        let filtered = calque.layer.id.substr('cadastre-calque-'.length)
                        switch (filtered) {
                            case 'area':
                                sortie.push(`<h4>Parcelle :</h4>
                                    Préfixe : ${calque.properties.prefixe}
                                    Section : ${calque.properties.section}
                                    Numéro  : ${calque.properties.numero}
                                    Surface : ${calque.properties.contenance}`)
                                break;
                            case 'known':
                                sortie.push(`<h4>Lieu-dit :</h4>${calque.properties.nom}`)
                                break
                            case 'city':
                                sortie.push(`<h4>Commune :</h4> ${calque.properties.nom}`)
                                break
                            case 'sheet':
                                sortie.push(`</h4>Feuille :</h4>
                                    Préfixe : ${calque.properties.prefixe}
                                    Section : ${calque.properties.section}
                                    Numéro  : ${calque.properties.numero}
                                    Qualité : ${calque.properties.qualite}
                                    Echelle : ${calque.properties.echelle}
                                    Créée le : ${calque.properties.created}
                                    Dernière mise à jour : ${calque.properties.updated}`)
                                break
                            case 'section':
                                sortie.push(`</h4>Section :</h4>
                                    Préfixe : ${calque.properties.prefixe}
                                    Code : ${calque.properties.code}
                                    Créée le : ${calque.properties.created}
                                    Dernière mise à jour : ${calque.properties.updated}`)
                                break
                            default:
                                sortie.push(`Les informations sont déjà affichées à l'écran.`)
                                break;
                        }

                    }
                })
                console.log(sortie)
                new mapboxgl.Popup()
                    .setLngLat(event.lngLat)
                    .setHTML(sortie.join('<br>'))
                    .addTo(this.map)
            })
        }
    }
    addButton() {
        let div = document.createElement('div')
        div.style.top = 0
        div.style.right = 0
        div.style.overflow = 'auto'
        div.style.position = 'absolute'
        let btn = document.createElement('button')
        btn.classList.add('btn', 'btn-error')
        btn.innerText = "Efface carte"
        btn.addEventListener('click', () => this.removePolygons())
        div.appendChild(btn)
        document.body.appendChild(div)
    }
    evented(event) {
        let ici = this.map.queryRenderedFeatures(event.point)
        let batiment = ici.find(elem => elem.layer.id == "cadastre-calque-building")
        let parcelle = ici.find(elem => elem.layer.id == "cadastre-calque-area")
        let target = document.querySelector('#surface-section')
        target.innerHTML = ''
        let sortie = new Array()
        if (batiment || parcelle) {
            if (batiment) {
                let polygon = turf.polygon(batiment.geometry.coordinates)
                let aire = area(polygon)
                console.log(aire)
                sortie.push(`Bât : ${turf.round(aire, 2)}m<sup>2</sup> au sol.`)
            }
            if (parcelle) {
                let polygon = turf.polygon(parcelle.geometry.coordinates)
                let aire = area(polygon)
                console.log(aire)
                let surface = aire > 10000 ? { unit: "ha", value: (aire / 10000), sup: '' } : { unit: 'm', value: aire, sup: 2 }
                sortie.push(`Parc. : ${turf.round(surface.value * 0.99765, 3)}${surface.unit}<sup>${surface.sup}</sup> au sol.`)
            }
            sortie.forEach(elem => {
                let p = document.createElement('p')
                p.classList.add('section-content')
                p.innerHTML = elem
                target.appendChild(p)
            })
        } else {
            target.innerHTML = '<p class="surface-content">Survolez un batiment ou une parcelle...</p>'
        }
    }
    setMarkerTitle(title) {
        this.markerTitle = title
    }
    removePolygons() {
        this.couches.forEach(couche => {
            this.map.removeLayer(couche.layer)
            this.map.removeSource(couche.source)
        })
        this.couches = new Array()
        console.info('Polygones supprimes')
    }
    addPolygons(feature, layer) {
        let source = 'cadastre-source-' + layer
        let calque = 'cadastre-calque-' + layer
        this.map.addSource(source, {
            type: "geojson",
            data: feature,
            clusterMaxZoom: 14,
            clusterRadius: 50
        })
        this.map.addLayer({
            id: calque,
            type: "fill",
            source: source,
            paint: this.layerColours[layer]
        })
        this.couches.push({ source: source, layer: calque })
    }
    removeMarkers() {
        document.querySelectorAll('.mapboxgl-marker').forEach(element => element.remove())
    }
    toggleVisibility() {
        this.HTMLContainer.classList.toggle('_nodisplay')
        this.map.resize()
    }
    drawMarker(geom) {
        let marker = new mapboxgl.Marker()
        if (this.markerTitle !== '') {
            let popup = new mapboxgl.Popup()
                .setText(this.markerTitle)
            marker.setPopup(popup)
        }
        marker.setLngLat(geom.coordinates).addTo(this.map)
        setTimeout(() => {
            this.map.flyTo({ center: geom.coordinates, zoom: 12 })
        }, 2000);
    }
}
class Cadastre {
    constructor(idVille, options = {}) {
        this.id = idVille
        this.options = Object.assign({}, {
            building: true,
            city: false,
            sheet: false,
            known: false,
            area: false,
            section: false
        }, options)
        this.types = {
            building: 0,
            city: 1,
            sheet: 2,
            known: 3,
            area: 4,
            section: 5
        }
        this.loaded = {
            building: null,
            city: null,
            sheet: null,
            known: null,
            area: null,
            section: null
        }
        this.promises = new Array()
    }
    getCount() {
        let options = Object.keys(this.options)
        return options.reduce(elem => this.options[elem] === true, 0)
    }
    async getData(type) {
        let res = await fetch(`/geom/${this.id}/${this.types[type]}`)
        if (res.status === 200) {
            return await res.json()
        } else {
            return null
        }
    }
}
const Cmap = new MapboxMap('#map')
Cmap.load()

Vue.component('todo-item', {
    props: ['todo'],
    template: '<li>{{ todo.label }}</li>'
})
let resultats = new Vue({
    el: '#resultats',
    data: {
        myList: []
    },
    methods: {
        select: function (id) {
            if (id === 0) {
                return
            }
            let obj = (this.myList.filter(elem => elem.id === id))[0]
            let cadastre = new Cadastre(id, app.options)
            if (app.getOptions().length === 0) {
                alert('Pensez à sélectionner des données à afficher puis cliquer à nouveau sur la ville dans la liste "Résultats"')
            } else {
                app.getOptions().forEach(element => {
                    cadastre.getData(element).then(res => {
                        Cmap.addPolygons(res, element)
                    })
                })
            }
            Cmap.setMarkerTitle(obj.label)
            Cmap.drawMarker(obj.coords)
            this.clear()
        },
        clear: function () {
            this.myList = []
        }
    }
})
let app = new Vue({
    el: '#app',
    data: {
        value: '',
        error: {
            active: false,
            message: 'Une erreur est survenue, veuillez réessayer.'
        },
        isLoading: false,
        options: {
            building: true,
            city: true,
            sheet: false,
            area: false,
            known: false,
            section: false
        }
    },
    methods: {
        sub: function () {
            this.isLoading = true
            let restrict = ['lyon', 'marseille', 'paris']
            if (restrict.indexOf(this.value.toLowerCase()) > -1) {
                this.error.active = true
                this.error.message = `Les villes suivantes ne permettent pas la recherche inversée : ${restrict.join(', ')}. Privilégiez la recherche par adresse postale ou par code postal.`
                this.isLoading = false
                throw new Error(this.error.message)
            }
            if (this.value !== '' && this.value.length !== 0) {
                recherche(this.value).then(res => {
                    this.error.active = false
                    for (let feature of res.features) {
                        let props = feature.properties
                        resultats.myList.push({
                            id: props.id,
                            label: `${props.label} (${props.postcode})`,
                            coords: feature.geometry,
                            hidden: false
                        })
                    }
                    this.isLoading = false
                }).catch(err => {
                    console.error(err)
                    this.error.active = true
                    this.isLoading = false
                })
            } else {
                this.error.active = true
                this.isLoading = false
            }
        },
        getOptions: function () {
            let options = Object.keys(this.options)
            return options.filter(elem => this.options[elem] === true)
        }
    }
})

const baseUrl = 'https://api-adresse.data.gouv.fr/'
/**
 * URL de recherche texte
 * 
 * @param {string} lookup 
 * @returns {string} - Url
 */
const searchAdresse = (lookup) => `${baseUrl}search/?q=${lookup}&limit=20`

/**
 * URL de recherche par coordonées
 * 
 * @param {any} {lat, lon} 
 * @returns {string} - Url
 */
const searchCoords = ({ lat, lng }) => `${baseUrl}reverse/?lon=${lng}&lat=${lat}`

const recherche = (q) => {
    if (typeof q === 'string') {
        return fetch(searchAdresse(q)).then(res => res.json())
    } else {
        return fetch(searchCoords(q)).then(res => res.json())
    }
}
document.querySelector('#geolocateMe').addEventListener('click', (e) => {
    e.preventDefault()
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
            console.log(pos)
            fetch(searchCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })).then(rep => rep.json()).then(res => {
                resultats.myList = new Array()
                for (let feature of res.features) {
                    let props = feature.properties
                    resultats.myList.push({
                        id: props.id,
                        label: `${props.city} (${props.postcode})`,
                        coords: feature.geometry
                    })
                }
            })
        }, (err) => {
            console.error(err)
        })
    }
})