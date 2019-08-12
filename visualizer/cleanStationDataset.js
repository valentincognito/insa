require('dotenv').config()

const mongoose = require('mongoose')
const fs = require('fs')
const Station = require('./models/station')

cleanData()

async function cleanData(){
  await wait(1000)

  fs.readFile('./data/seoul_subway_stations.json', (err, data) => {
    if (err) throw err
    let json = JSON.parse(data)

    for (station of json.DATA) {
      console.log(station.station_nm)
      saveData(station)
    }
  })
}

async function saveData(station){
  let check = await Station.findOne({name: station.station_nm})
  if (check == null) {
    let newStation = new Station()
    newStation.name = station.station_nm
    newStation.lat = station.xpoint_wgs
    newStation.long = station.ypoint_wgs
    await newStation.save(err => {
      if (err)
        console.log('duplicate error')
      else
        console.log('saved!')
    })
  }
}


function wait (ms) {
  return new Promise(resolve => setTimeout(() => resolve(), ms))
}

//mongodb
mongoose.connect('mongodb://'+process.env.DB_USER+':'+process.env.DB_PWD+'@'+process.env.DB_HOST+'/'+process.env.DB_NAME , {
  useCreateIndex: true,
  useNewUrlParser: true
})
const db = mongoose.connection
