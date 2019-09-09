/* globals */
let map
let stationsFetchResponse
let stations
let totalPostCount
let stationGeoJson

(async function () {
  await initMap()

  stationsFetchResponse = await fetchStations()
  stations = stationsFetchResponse.stations

  map.on('load', function() {
    totalPostCount = 0
    fetchPosts()

    rotateCamera(0)

    stationGeoJson = {
      "features": [],
      "type": "FeatureCollection"
    }

    for (station of stations) {
      if (station.lat != "0" && station.long != "0") {
        let lat = Number(station.lat)
        let long = Number(station.long)

        let polygon = createPolygonFromCoordinate([long, lat], 0.002, 200)
        stationGeoJson.features.push({
          "type": "Feature",
          "properties": {
            "level": 1,
            "name": station.name,
            "height": 0,
            "base_height": 0,
            "color": "#e89608"
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
        "fill-extrusion-color": ['get', 'color'],
        "fill-extrusion-height": ['get', 'height'],
        "fill-extrusion-base": ['get', 'base_height'],
        "fill-extrusion-opacity": 0.8
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
    zoom: 11,
    pitch: 55,
    antialias: true,
    style: 'mapbox://styles/vvannay/ck0c2grxx4il01cqwlw5alwgx'
  })
}

//style: 'mapbox://styles/vvannay/cjzb1im7m0tnd1cqwelxv1ani'
//style: 'mapbox://styles/vvannay/cjzawf4mg0p6m1cn3vw0m11s0'
//mapbox://styles/vvannay/ck0c2grxx4il01cqwlw5alwgx

function rotateCamera(timestamp) {
  //divide timestamp by 100 to slow rotation to ~10 degrees / sec
  map.rotateTo((timestamp / 200) % 360, {duration: 0})
  requestAnimationFrame(rotateCamera)
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

async function fetchPosts(){
  let response = await fetch('/api/lazy_load_posts', {
    method: 'post',
    body: JSON.stringify({params: {station: { $exists: true }}}),
    headers: { 'Content-type': 'application/json' }
  }).then((response) => {
    const reader = response.body.getReader()
    const stream = new ReadableStream({
      start(controller) {
        let partialChunk = ""

        function push() {
          reader.read().then(({ done, value }) => {
            if (done) {
              controller.close()
              return
            }

            let chunkOfPosts = new TextDecoder("utf-8").decode(value)
            chunkOfPosts = chunkOfPosts.replace(/}{/gm, "},{")

            let jsonChunk

            try {
              jsonChunk = JSON.parse("["+chunkOfPosts+"]")
            } catch (e) {
              partialChunk += chunkOfPosts
            }

            if (partialChunk != "") {
              try {
                jsonChunk = JSON.parse("["+partialChunk+"]")
                partialChunk = ""
              } catch (e) {
              }
            }

            if (jsonChunk != undefined) {
              for (chunk of jsonChunk) {
                let item = stationGeoJson.features.find(function (obj) {return obj.id === chunk.station})
                item.properties.height++
                totalPostCount++
              }
              map.getSource('stations').setData(stationGeoJson)
            }
            controller.enqueue(value)
            push()
          })
        }
        push()
      }
    })
    return new Response(stream, { headers: { "Content-Type": "text/json" } })
  })
}
