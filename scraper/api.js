require('dotenv').config()
const request = require('request')

module.exports.findOnePost = findOnePost
module.exports.createPost = createPost
module.exports.getStations = getStations

function findOnePost(data, callback) {
  let form = {params: data}

  return new Promise((resolve, reject) => {
    request.post({url: process.env.API_URL+'/get_post', form: form}, function(err, httpResponse, body){
      if(err)
        return callback ? callback(err) : reject(err)
      else
        return callback ? callback(JSON.parse(body)) : resolve(JSON.parse(body))
    })
  })
}

function createPost(data, callback) {
  let form = {
    postId: data.postId,
    user: data.user,
    date: data.date,
    picture: data.picture,
    station: data.station,
    hashtags: data.hashtags
  }

  return new Promise((resolve, reject) => {
    request.post({url: process.env.API_URL+'/add_post', form: form}, function(err, httpResponse, body){
      if(err)
        return callback ? callback(err) : reject(err)
      else
        return callback ? callback(JSON.parse(body)) : resolve(JSON.parse(body))
    })
  })
}

function getStations(data, callback) {
  let form = {params: data}

  return new Promise((resolve, reject) => {
    request.get({url: process.env.API_URL+'/get_stations'}, function(err, httpResponse, body){
      if(err)
        return callback ? callback(err) : reject(err)
      else
        return callback ? callback(JSON.parse(body)) : resolve(JSON.parse(body))
    })
  })
}
