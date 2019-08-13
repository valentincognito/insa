require('dotenv').config()

const cheerio = require('cheerio')
const puppeteer = require('puppeteer')
const { Cluster } = require('puppeteer-cluster')
const chalk = require('chalk')
const api = require('./api')

const MAIN_TAGS = [
  '맛집',
  '술집',
  '맛스타그램',
  '고기스타그램',
  '주말스타그램',
  '불금',
  '칵테일'
]
const SELECTOR = {
  id: '.v1Nh3.kIKUG',
  user: '.FPmhX.nJAzx',
  date: '._1o9PC.Nzb55',
  hashtags: '.ltEKP a[href*="explore/tags"]',
  picture: '.FFVAD',
  videoThumbnail: '._8jZFn'
}

discoverNewPosts()

async function discoverNewPosts(){
  if(process.env.LOG == '1') console.log(chalk.yellow(`scraping initialization...`))
  console.time('scraping time')

  //get all subway stations info
  let getStationResponse = await api.getStations()

  //create an array to keep track of the discovered posts
  let discoveredPostsId = []

  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_BROWSER,
    maxConcurrency: process.env.PUPPETEER_CONCURRENCY
  })

  const extractInfo = async ({ page, data: id }) => {
    await page.goto('https://www.instagram.com/p/'+id, {waitUntil: 'domcontentloaded'})
    await page.waitForSelector(SELECTOR.user)
    await page.waitForSelector(SELECTOR.date)
    await page.waitForSelector(SELECTOR.picture)

    const html = await page.content()
    const $ = cheerio.load(html)

    let hashtags = []
    let user = $(SELECTOR.user).attr('title')
    let date = $(SELECTOR.date).attr('datetime')
    let picture = $(SELECTOR.picture).attr('src')
    let stationId

    //if the picture is not found it's a video case
    if (picture == undefined)
      picture = $(SELECTOR.videoThumbnail).attr('src')

    $(SELECTOR.hashtags).each(function() {
      let hashtagUrl = $(this).attr('href')
      let hashtag = hashtagUrl.substr(14, hashtagUrl.length).slice(0, -1)
      hashtags.push(hashtag)

      let search = (hashtag == "서울역") ? hashtag : hashtag.replace(/역$/gm, '') //remove the 역 keyword for the matching
      let found = getStationResponse.stations.find(el => el.name === search)
      if (found) {
        if(process.env.LOG == '1') console.log(chalk.cyan(`station info found for ${chalk.cyanBright(id)}`))
        stationId = found._id
      }
    })

    api.createPost({
      postId: id,
      user: user,
      date: date,
      picture: picture,
      hashtags: hashtags,
      station: stationId
    })

    if(process.env.LOG == '1') console.log(chalk.green(`post ${chalk.greenBright(id)} saved`))
  }

  await cluster.task(async ({ page, data: url }) => {
      await page.goto(url, {waitUntil: 'domcontentloaded'})
      await page.waitForSelector(SELECTOR.id)

      //get all the post id in the page
      const html = await page.content()
      const $ = cheerio.load(html)
      const scrapedPosts = []
      $(SELECTOR.id).each(function() {
        if ($(this).parents('.EZdmt').length == 0) {
          let postId = $('a', this).attr('href').replace(/\/p?\/?/gm, '')
          scrapedPosts.push(postId)
        }
      })

      if(process.env.LOG == '1') console.log(chalk.blue(`analyzing... ${scrapedPosts.length} posts from ${chalk.blueBright(decodeURI(url))}`))

      for (id of scrapedPosts) {
        //check db for existing post
        let checkResponse = await api.findOnePost({postId: id})
        if (checkResponse.status == 'success') {
          if (checkResponse.post == null) {
            //check if another queue didn't scrap that post already
            if (discoveredPostsId.indexOf(id) == -1) {
              //add post extracting info queue
              if(process.env.LOG == '1') console.log(chalk.blue(`adding ${chalk.blueBright(id)} to the info extracting queue`))
              cluster.queue(id, extractInfo)
              discoveredPostsId.push(id)
            }
          }
        }else{
          if(process.env.LOG == '1') console.log(chalk.red(`could not query database`))
        }
      }
  })

  // Add some pages to queue
  for (tag of MAIN_TAGS) {
    cluster.queue(encodeURI('https://www.instagram.com/explore/tags/'+ tag))
  }

  // Shutdown after everything is done
  await cluster.idle()
  await cluster.close()

  console.timeEnd('scraping time')
  discoverNewPosts()
}
