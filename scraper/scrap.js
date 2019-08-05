const cheerio = require('cheerio')
const puppeteer = require('puppeteer')
const request = require('request')

const MAIN_TAGS = [
  '맛집',
  '술집',
  '맛스타그램',
  '고기스타그램',
  '주말스타그램',
  '불금',
  '칵테일'
]
const INSA_API_URL = 'http://localhost:3535/api'
const SELECTOR = '.v1Nh3.kIKUG'

let NEW_POST_COUNT = 0
let LAST_POST_COUNT = 0
let SIMILARITY_COUNT = 0

scrapAll()

async function scrapAll(){
  for (tag of MAIN_TAGS) {
    let URL = encodeURI('https://www.instagram.com/explore/tags/'+ tag)
    await scrap(URL, SELECTOR)
  }

  await populatePostsInfo()
  await discoverTags()
  await inferLocation()
}

//scrap posts from a given url
async function scrap(URL, SELECTOR){
  const browser = await puppeteer.launch({headless: true})
  const page = await browser.newPage()
  await page.setViewport({
    width: 320,
    height: 480,
    deviceScaleFactor: 1
  })
  await page.goto(URL, {waitUntil: 'load'})
  await page.waitForSelector(SELECTOR)

  // Get the height of the rendered page
  const bodyHandle = await page.$('body')
  const { height } = await bodyHandle.boundingBox()
  await bodyHandle.dispose()

  // Scroll one viewport at a time, pausing to let content load
  const viewportHeight = page.viewport().height

  console.log(`height: ${height}, viewportHeight: ${viewportHeight} `)

  let viewportIncr = 0
  let viewportTarget = viewportHeight * 2
  while (viewportIncr + viewportHeight < viewportTarget) {
    await page.evaluate(_viewportHeight => {
      window.scrollBy(0, _viewportHeight)
    }, viewportHeight)
    await wait(1500)
    await savePosts(page)
    viewportIncr = viewportIncr + viewportHeight

    let percentComplete = viewportIncr * 100 / viewportTarget
    console.log(`${percentComplete}% completed`)

    if (NEW_POST_COUNT == LAST_POST_COUNT) {
      SIMILARITY_COUNT++
      if (SIMILARITY_COUNT >= 10) {
        break
      }
    }else{
      SIMILARITY_COUNT = 0
    }
    LAST_POST_COUNT = NEW_POST_COUNT
  }

  browser.close()
}

//visit and save the post page detail
async function populatePostsInfo(){
  let posts = await getPosts({
    user: { $exists: false }
  })

  for (post of posts) {
    if (post.user == undefined) {
      const browser = await puppeteer.launch({headless: true})
      const page = await browser.newPage()
      await page.goto('https://www.instagram.com/p/'+post.postId, {waitUntil: 'load'})

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

//get all the tags from all the posts
async function discoverTags(){
  let posts = await getPosts({
    tags: { $ne: [] }
  })

  for (post of posts) {
    for (tag of post.tags) {
      await addTag(tag.name).catch(function(err){
        console.log(err)
      })
    }
  }
}

async function inferLocation(){
  let posts = await getPosts({
    tags: { $ne: [] },
    locationTag: { $exists: false },
  })

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

//get all post from the database
async function getPosts(params){
  return new Promise(async (resolve, reject) => {
    let form = {
      params: params
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

//save post id and picture from the explore page
async function savePosts(page){
  return new Promise(async (resolve) => {
    const html = await page.content()
    const $ = cheerio.load(html)

    const posts = []
    $(SELECTOR).each(function() {
      let postId = $('a', this).attr('href').replace(/\/p?\/?/gm, '')
      let picture = $('img', this).attr('src')

      posts.push({
        postId: postId,
        picture: picture
      })
    })

    for (post of posts) {
      let form = {
        postId: post.postId,
        picture: post.picture
      }
      request.post({url: INSA_API_URL+'/add_post', form: form}, function(err, httpResponse, body){
        if(err){
          console.log(err)
        }
        else{
          let response = JSON.parse(body)
          if (response.status == "success") {
            NEW_POST_COUNT++
            console.log('new post saved!')
          }
        }
      })
    }
    resolve()
  })
}

//update the post info in the database
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

//add a new tag in the database
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

//utility wait function
function wait (ms) {
  return new Promise(resolve => setTimeout(() => resolve(), ms))
}
