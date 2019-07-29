const express = require('express')
const router = express.Router()
const Post = require('../models/post')

router.post('/add_post', function(req, res, next) {
  let post = new Post()
  post.postId = req.body.postId
  post.picture = req.body.picture
  post.save(err => {
    if (err)
      res.json({status: 'error', err: err})
    else
      res.json({status: 'success', post: post})
  })
})

module.exports = router
