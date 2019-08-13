const express = require('express')
const router = express.Router()
const Post = require('../models/post')
const Tag = require('../models/tag')
const Station = require('../models/station')

router.post('/get_post', function(req, res, next) {
  Post.findOne(req.body.params, function(err, post){
    if (err)
      res.json({status: 'error', err: err})
    else
      res.json({status: 'success', post: post})
  })
})

router.post('/get_posts', function(req, res, next) {
  Post.find(req.body.params, function(err, posts){
    if (err)
      res.json({status: 'error', err: err})
    else
      res.json({status: 'success', posts: posts})
  })
})

router.post('/add_post', function(req, res, next) {
  Post.find({postId: req.body.postId}, function(err, posts){
    if (posts.length == 0) {
      let post = new Post()
      post.postId = req.body.postId
      post.picture = req.body.picture
      post.user = req.body.user
      post.station = req.body.station
      post.date = req.body.date
      if (post.hashtags.length <= 0) {
        if (req.body.hashtags != undefined) {
          for (hashtag of req.body.hashtags){
            if (hashtag != undefined) {
              post.hashtags.push({
                name: hashtag
              })
            }
          }
        }
      }
      post.save(err => {
        if (err){
          res.json({status: 'error', err: err})
        }else{
          Post.populate(post, {path:"station"}, function(err, post) {
            res.io.emit('new post', post)
          })
          res.json({status: 'success', post: post})
        }
      })
    }else{
      res.json({status: 'error', err: 'existing post'})
    }
  })
})

router.put('/update_post', function(req, res, next) {
  Post.findById(req.body.postId, function (err, post) {
    if (post.tags.length <= 0) {
      if (req.body.hashtags != undefined) {
        for (hashtag of req.body.hashtags){
          if (hashtag != undefined) {
            post.tags.push({
              name: hashtag
            })
          }
        }
      }
    }
    post.user = req.body.user
    post.date = req.body.date
    post.save(err => {
      if (err)
        res.json({status: 'error', err: err})
      else
        res.json({status: 'success', post: post})
    })
  })
})

router.put('/update_post_location', function(req, res, next) {
  Post.findById(req.body.postId, function (err, post) {
    post.locationTag = req.body.tag
    post.save(err => {
      if (err)
        res.json({status: 'error', err: err})
      else
        res.json({status: 'success', post: post})
    })
  })
})

router.post('/get_tag', function(req, res, next) {
  Tag.findOne(req.body.params, function(err, tag){
    if (err)
      res.json({status: 'error', err: err})
    else
      res.json({status: 'success', tag: tag})
  })
})

router.post('/add_tag', function(req, res, next) {
  Tag.find({name: req.body.name}, function(err, tags){
    if (tags.length == 0) {
      let tag = new Tag()
      tag.name = req.body.name
      tag.isLocation = false
      tag.save(err => {
        if (err)
          res.json({status: 'error', err: err})
        else
          res.json({status: 'success', tag: tag})
      })
    }else{
      res.json({status: 'error', err: 'existing tag'})
    }
  })
})

router.get('/get_stations', function(req, res, next) {
  Station.find(function(err, stations){
    if (err)
      res.json({status: 'error', err: err})
    else
      res.json({status: 'success', stations: stations})
  })
})

// router.post('/subway_station', function(req, res, next) {
//   Tag.find({
//     isLocation: { $eq: false }
//   }, function(err, tags){
//     for (tag of tags) {
//       if (tag.name.match(/동$/gm)) {
//         console.log(tag.name)
//         tag.isLocation = true
//         tag.save()
//       }
//     }
//     res.send('done')
//   })
// })

module.exports = router
