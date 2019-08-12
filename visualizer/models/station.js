const mongoose = require('mongoose')

const StationSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true
  },
  lat: String,
  long: String,
})

const Station = mongoose.model('Station', StationSchema)
module.exports = Station
