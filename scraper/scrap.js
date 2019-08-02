const cheerio = require('cheerio')
const puppeteer = require('puppeteer')
const request = require('request')

const INSA_API_URL = 'http://localhost:3535/api'
const URL = encodeURI('https://www.instagram.com/explore/tags/맛집')
const SELECTOR = '.v1Nh3.kIKUG'

scrap(URL, SELECTOR)

async function scrap(URL, SELECTOR){
  const browser = await puppeteer.launch({headless: false})
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
  let viewportTarget = viewportHeight * 500000
  while (viewportIncr + viewportHeight < viewportTarget) {
    await page.evaluate(_viewportHeight => {
      window.scrollBy(0, _viewportHeight)
    }, viewportHeight)
    await wait(1500)
    await savePosts(page)
    viewportIncr = viewportIncr + viewportHeight
    let percentComplete = viewportIncr * 100 / viewportTarget
    console.log(`${percentComplete}% completed`)
  }

  browser.close()
}


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
            console.log('new post saved!')
          }
        }
      })
    }
    resolve()
  })
}

function wait (ms) {
  return new Promise(resolve => setTimeout(() => resolve(), ms))
}
