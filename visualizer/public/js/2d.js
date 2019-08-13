async function setup() {
  let seoulMinLat = 36.769502
  let seoulMaxLat = 37.9481
  let seoulMinLong = 126.452508
  let seoulMaxLong = 127.723792

  let canvasWidth = 1920
  let canvasHeight = 1200

  createCanvas(canvasWidth, canvasHeight)
  background(255)

  let stationsFetchResponse = await fetchStations()
  let stations = stationsFetchResponse.stations

  let postsFetchResponse = await fetchPosts()

  for (post of postsFetchResponse.posts) {
    let item = stations.find(function (obj) {return obj._id === post.station})
    if (item.postCount == undefined) {
      item.postCount = 1
    }else{
      item.postCount++
    }
  }

  for (station of stations) {
    if (station.lat != "0" || station.long != "0") {
      let lat = Number(station.lat)
      let latPercent = (lat - seoulMinLat) / (seoulMaxLat - seoulMinLat)
      let xPos = canvasWidth * latPercent

      let long = Number(station.long)
      let longPercent = (long - seoulMinLong) / (seoulMaxLong - seoulMinLong)
      let yPos = canvasHeight * longPercent

      ellipse(xPos, yPos, 4,  4)

      fill(255 - station.postCount)
      textSize(station.postCount * 0.5)
      text(station.name, xPos, yPos)
    }
  }
  point(1270, 710)
}

function draw() {
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
