/* globals */
let map
let stationsFetchResponse
let stations

(async function () {
  await initMap()

  stationsFetchResponse = await fetchStations()
  stations = stationsFetchResponse.stations

  console.log(stationsFetchResponse)

  map.on('load', function() {
    let stationGeoJson = {
      "features": [],
      "type": "FeatureCollection"
    }

    for (station of stations) {
      if (station.lat != "0" && station.long != "0") {
        let lat = Number(station.lat)
        let long = Number(station.long)

        let polygon = createPolygonFromCoordinate([long, lat], 0.002, 100)
        stationGeoJson.features.push({
          "type": "Feature",
          "properties": {
            "level": 1,
            "name": station.name,
            "height": 20,
            "base_height": 0,
            "color": "orange"
          },
          "geometry": {
            "coordinates": [polygon],
            "type": "Polygon"
          },
          "id": station._id
        })
      }
    }

    console.log(stationGeoJson)

    map.addSource('stations', {
      "type": "geojson",
      "data": stationGeoJson
    })
    map.addLayer({
      "id": "stations",
      "source": "stations",
      "type": "fill-extrusion",
      "paint": {
        "fill-extrusion-color": "orange",
        "fill-extrusion-height": 500,
        "fill-extrusion-base": 0,
        "fill-extrusion-opacity": 0.5
      }
    })
  })

}())


async function initMap() {
  const mapboxResponse = await fetch('/api/mapbox_token', {
    method: 'post',
    headers: { 'Content-type': 'application/json' }
  })
  const mapbox_token = await mapboxResponse.json()

  mapboxgl.accessToken = mapbox_token
  map = new mapboxgl.Map({
    container: 'map',
    center: [127, 37.5],
    zoom: 12,
    pitch: 55,
    antialias: true,
    style: 'mapbox://styles/vvannay/cjzb1im7m0tnd1cqwelxv1ani'
  })
}

function createPolygonFromCoordinate(location, size, faces){
  let coordinates = []

  let step = 2 * Math.PI / faces
  let h = location[0]
  let k = location[1]
  let r = size

  for(let theta = 0;theta < 2 * Math.PI;theta += step){
    let x = h + r * Math.cos(theta)
    let y = k - r * Math.sin(theta)
    coordinates.push([x, y])
  }

  return coordinates
}

async function fetchStations(){
  let response = await fetch('/api/get_stations')

  if (response.status !== 200) {
    console.log('looks like there was a problem. status code: ' + response.status);
    return
  }
  return await response.json()
}
