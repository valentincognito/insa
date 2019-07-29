const mongoose = require('mongoose')

const PostSchema = new mongoose.Schema({
  postId: {
    type: String,
    unique: true
  },
  picture: String,
  tags: [{
    name: String
  }],
  created: Date,
  modified: Date
})

const Post = mongoose.model('Post', PostSchema)
module.exports = Post
