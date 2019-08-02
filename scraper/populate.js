const cheerio = require('cheerio')
const puppeteer = require('puppeteer')
const request = require('request')

const INSA_API_URL = 'http://localhost:3535/api'
//const SELECTOR = '.v1Nh3.kIKUG'

populatePostsInfo()

async function populatePostsInfo(){
  let posts = await getPosts()

  for (post of posts) {
    if (post.user == undefined) {
      const browser = await puppeteer.launch({headless: true})
      const page = await browser.newPage()
      await page.goto('https://www.instagram.com/p/'+post.postId, {waitUntil: 'load'})
      //await page.waitForSelector(SELECTOR)

      const html = await page.content()
      const $ = cheerio.load(html)

      let hashtags = []
      let user = $('.FPmhX.nJAzx').attr('title')
      let postDate = $('._1o9PC.Nzb55').attr('datetime')

      $('.ltEKP a[href*="explore/tags"]').each(function() {
        let hashtagUrl = $(this).attr('href')
        let hashtag = hashtagUrl.substr(14, hashtagUrl.length).slice(0, -1)
        hashtags.push(hashtag)
      })

      await updatePost(post._id, user, hashtags, postDate)

      browser.close()
    }
  }
}

async function getPosts(){
  return new Promise(async (resolve, reject) => {
    let form = {
      params: {
        user: { $exists: false }
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

async function updatePost(id, user, hashtags, date){
  return new Promise(async (resolve, reject) => {
    let form = {
      postId: id,
      user: user,
      hashtags: hashtags,
      date: date
    }
    request.put({url: INSA_API_URL+'/update_post', form: form}, function(err, httpResponse, body){
      if(err){
        console.log(err)
      }
      else{
        let response = JSON.parse(body)
        if (response.status == "success") {
          console.log(`${response.post.postId} updated!`)
          resolve()
        }else{
          reject()
        }
      }
    })
  })
}

function wait (ms) {
  return new Promise(resolve => setTimeout(() => resolve(), ms))
}
