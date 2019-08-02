const cheerio = require('cheerio')
const puppeteer = require('puppeteer')
const request = require('request')

const INSA_API_URL = 'http://localhost:3535/api'

discoverTags()

async function discoverTags(){
  let posts = await getPosts()

  for (post of posts) {
    for (tag of post.tags) {
      await addTag(tag.name).catch(function(err){
        console.log(err)
      })
    }
  }
}

async function getPosts(){
  return new Promise(async (resolve, reject) => {
    let form = {
      params: {
        tags: { $ne: [] }
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

async function addTag(tag){
  return new Promise(async (resolve, reject) => {
    let form = {
      name: tag
    }
    request.post({url: INSA_API_URL+'/add_tag', form: form}, function(err, httpResponse, body){
      if(err){
        console.log(err)
      }
      else{
        let response = JSON.parse(body)
        if (response.status == "success") {
          console.log(`${response.tag.name} added!`)
          resolve()
        }else{
          reject(response)
        }
      }
    })
  })
}
