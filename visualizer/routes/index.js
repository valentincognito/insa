const express = require('express')
const router = express.Router()
const Post = require('../models/post')
const Station = require('../models/station')

router.get('/', async function(req, res, next) {
  let posts = await Post.find({
    user: { $exists: true },
    // tags: { $ne: [] },
    station: { $exists: true }
  })
  .populate('station')
  .sort({ date: -1 })
  .limit(500)

  res.render('index', {
    posts: posts
  })
})

router.get('/2d', async function(req, res, next) {
  res.render('2d')
})

router.get('/mapbox', async function(req, res, next) {
  res.render('mapbox')
})

module.exports = router
