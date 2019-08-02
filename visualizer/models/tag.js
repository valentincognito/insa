const mongoose = require('mongoose')

const TagSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true
  },
  isLocation: Boolean
})

const Tag = mongoose.model('Tag', TagSchema)
module.exports = Tag
