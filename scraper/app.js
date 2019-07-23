const cheerio = require('cheerio')
const puppeteer = require('puppeteer')

const url = encodeURI('https://www.instagram.com/explore/tags/맛집')
const selector = '.v1Nh3.kIKUG'

scrap(url, selector)

async function scrap(url, selector){
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto(url)
  await page.waitForSelector(selector)
  const html = await page.content()

  const $ = cheerio.load(html)

  const postUrls = []
  $(selector).each(function() {
    postUrls.push({
      url: $('a', this).attr('href'),
    })
  })

  console.log(postUrls)

  browser.close()
}
