const options = {
  lat: 37.5,
  lng: 127,
  zoom: 12,
  style: 'https://api.mapbox.com/styles/v1/vvannay/cjzawf4mg0p6m1cn3vw0m11s0/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoidnZhbm5heSIsImEiOiJjanphd2RhMnYwMDkxM2lvMm53eHg3cTFsIn0.dcA_ANFWwXRqIfVRqaIjZg'
}

// Create an instance of Leaflet
const mappa = new Mappa('Leaflet')
let myMap

let canvas

let seoulMinLat = 36.769502
let seoulMaxLat = 37.9481
let seoulMinLong = 126.452508
let seoulMaxLong = 127.723792

let canvasWidth = 2560
let canvasHeight = 1440

let stationsFetchResponse
let stations
let postsFetchResponse

async function setup() {
  canvas = createCanvas(canvasWidth, canvasHeight)
  myMap = mappa.tileMap(options) // lat 0, lng 0, zoom 4
  myMap.overlay(canvas)

  stationsFetchResponse = await fetchStations()
  stations = stationsFetchResponse.stations
  postsFetchResponse = await fetchPosts()

  for (post of postsFetchResponse.posts) {
    let item = stations.find(function (obj) {return obj._id === post.station})
    if (item.postCount == undefined) {
      item.postCount = 1
    }else{
      item.postCount++
    }
  }

  myMap.onChange(drawStations)
}

function draw() {}

function drawStations(){
  //clear the canvas
  clear()

  for (station of stations) {
    if (station.lat != "0" && station.long != "0" && station.postCount > 20) {
      let lat = Number(station.lat)
      let long = Number(station.long)

      const pos = myMap.latLngToPixel(lat, long)
      fill(255, 255 - station.postCount, 255 - station.postCount)
      ellipse(pos.x, pos.y, 10,  10)

      //fill(220 - station.postCount)
      // textSize(station.postCount * 0.2)


      // textSize(10)
      // text(station.postCount, pos.x + 10, pos.y)
      // fill(0, 0, 0)
    }
  }
}

async function fetchStations(){
  let response = await fetch('http://localhost:3535/api/get_stations')

  if (response.status !== 200) {
    console.log('looks like there was a problem. status code: ' + response.status);
    return
  }
  return await response.json()
}

async function fetchPosts(){
  let response = await fetch('http://localhost:3535/api/get_posts', {
    method: 'post',
    body: JSON.stringify({params: {station: { $exists: true }}}),
    headers: { 'Content-type': 'application/json' }
  })

  if (response.status !== 200) {
    console.log('looks like there was a problem. status code: ' + response.status);
    return
  }
  return await response.json()
}
