const mongoose = require('mongoose')

const PostSchema = new mongoose.Schema({
  postId: {
    type: String,
    unique: true
  },
  user: String,
  picture: String,
  hashtags: [{
    name: String
  }],
  station: {type: mongoose.Schema.Types.ObjectId, ref: 'Station'},
  date: Date
})

const Post = mongoose.model('Post', PostSchema)
module.exports = Post
