require('dotenv').config()

const createError = require('http-errors')
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')

const indexRouter = require('./routes/index')
const apiRouter = require('./routes/api')

const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))
app.use(function(req, res, next){
  res.io = io
  next()
})

app.use('/', indexRouter)
app.use('/api', apiRouter)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404))
})

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
})

//mongodb
mongoose.connect('mongodb://'+process.env.DB_USER+':'+process.env.DB_PWD+'@'+process.env.DB_HOST+'/'+process.env.DB_NAME , {
  useCreateIndex: true,
  useNewUrlParser: true
})
const db = mongoose.connection

module.exports = {app:app, server:server}
