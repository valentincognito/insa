const mongoose = require('mongoose')

const PostSchema = new mongoose.Schema({
  postId: {
    type: String,
    unique: true
  },
  user: String,
  picture: String,
  tags: [{
    name: String
  }],
  locationTag: {type: mongoose.Schema.Types.ObjectId, ref: 'Tag'},
  date: Date
})

const Post = mongoose.model('Post', PostSchema)
module.exports = Post
