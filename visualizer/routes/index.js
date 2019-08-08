const express = require('express')
const router = express.Router()
const Post = require('../models/post')

router.get('/', async function(req, res, next) {
  let posts = await Post.find({
    user: { $exists: true },
    // tags: { $ne: [] },
    // locationTag: { $exists: true }
  })
  .populate('locationTag')
  .sort({ date: -1 })

  res.render('index', {
    posts: posts
  })
})

module.exports = router
