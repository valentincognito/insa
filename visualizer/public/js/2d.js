let stationsFetchResponse
let stations
let totalPostCount = 0
let worldMap

let canvas

async function setup() {
  const mapboxResponse = await fetch('/api/mapbox_token', {
    method: 'post',
    headers: { 'Content-type': 'application/json' }
  })
  const mapbox_key = await mapboxResponse.json()

  const options = {
    lat: 37.5,
    lng: 127,
    zoom: 12,
    style: 'https://api.mapbox.com/styles/v1/vvannay/cjzawf4mg0p6m1cn3vw0m11s0/tiles/256/{z}/{x}/{y}?access_token='+mapbox_key
  }
  //mapbox://styles/vvannay/cjzb1im7m0tnd1cqwelxv1ani
  //mapbox://styles/vvannay/cjzawf4mg0p6m1cn3vw0m11s0

  // Create an instance of Leaflet
  const mappa = new Mappa('Leaflet')

  canvas = createCanvas(windowWidth, windowHeight)
  worldMap = mappa.tileMap(options)
  worldMap.overlay(canvas)

  stationsFetchResponse = await fetchStations()
  stations = stationsFetchResponse.stations
  fetchPosts()

  worldMap.onChange(drawStations)
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight)
}

function drawStations(){
  //clear the canvas
  clear()

  for (station of stations) {
    if (station.lat != "0" && station.long != "0" && station.postCount > 50) {
      let lat = Number(station.lat)
      let long = Number(station.long)

      const pos = worldMap.latLngToPixel(lat, long)
      let normalizedCount = normalize(station.postCount, totalPostCount, 0)

      noStroke()
      fill(255 * normalizedCount, 150)

      let ellipseSizeOffset = (normalizedCount > 0.01) ? 600 : 6000
      let diameter = (normalizedCount * ellipseSizeOffset)
      ellipse(pos.x, pos.y, diameter,  diameter)

      textSize(10)
      textFont('Consolas');
      textAlign(CENTER, CENTER)
      fill(255)
      text(station.postCount, pos.x, pos.y)
    }
  }
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
                let item = stations.find(function (obj) {return obj._id === chunk.station})
                if (item.postCount == undefined) {
                  item.postCount = 1
                }else{
                  item.postCount++
                }
                totalPostCount++
              }
              drawStations()
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

function normalize(val, max, min) { return (val - min) / (max - min) }
