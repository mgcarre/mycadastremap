const baseUrl = 'https://api-adresse.data.gouv.fr/'
/**
 * URL de recherche texte
 * 
 * @param {string} lookup 
 * @returns {string} - Url
 */
const searchAdresse = (lookup) => `${baseUrl}search/?q=${lookup}`

/**
 * URL de recherche par coordonées
 * 
 * @param {any} {lat, lon} 
 * @returns {string} - Url
 */
const searchCoords = ({lat, lon}) => `${baseUrl}reverse/?lon=${lon}&lat=${lat}`

const recherche = (q) => {
    if(typeof q === 'string'){
        return fetch(searchAdresse(q)).then(res => res.json())
    } else {
        return fetch(searchCoords(q)).then(res => res.json())
    }
}
