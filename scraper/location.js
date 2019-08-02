const cheerio = require('cheerio')
const puppeteer = require('puppeteer')
const request = require('request')

const INSA_API_URL = 'http://localhost:3535/api'

inferLocation()

async function inferLocation(){
  let posts = await getPosts()

  for (post of posts) {
    for (tag of post.tags) {
      let tagObject = await getTag(tag.name)
      if (tagObject.isLocation) {
        console.log(`added`)
        await addPostLocation(post._id, tagObject._id).catch(function(err){
          console.log(err)
        })
      }
    }
  }
}

async function getPosts(){
  return new Promise(async (resolve, reject) => {
    let form = {
      params: {
        tags: { $ne: [] },
        locationTag: { $exists: false },
      }
    }
    request.post({url: INSA_API_URL+'/get_posts', form: form}, function(err, httpResponse, body){
      if(err){
        console.log(err)
      }
      else{
        let response = JSON.parse(body)
        if (response.status == "success") {
          resolve(response.posts)
        }else{
          reject()
        }
      }
    })
  })
}

async function getTag(name){
  return new Promise(async (resolve, reject) => {
    let form = {
      params: {
        name: name,
      }
    }
    request.post({url: INSA_API_URL+'/get_tag', form: form}, function(err, httpResponse, body){
      if(err){
        console.log(err)
      }
      else{
        let response = JSON.parse(body)
        if (response.status == "success") {
          resolve(response.tag)
        }else{
          reject()
        }
      }
    })
  })
}

async function addPostLocation(postId, tag){
  return new Promise(async (resolve, reject) => {
    let form = {
      postId: postId,
      tag: tag
    }
    console.log(form)
    request.put({url: INSA_API_URL+'/update_post_location', form: form}, function(err, httpResponse, body){
      if(err){
        console.log(err)
      }
      else{
        let response = JSON.parse(body)
        if (response.status == "success") {
          console.log(`${response.post.postId} location added!`)
          resolve()
        }else{
          reject(response)
        }
      }
    })
  })
}
