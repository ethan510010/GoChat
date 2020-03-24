const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
require('dotenv').config();
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const languageRouter = require('./routes/language');
const userLanguageRouter = require('./routes/userLanguage');
const namespaceRouter = require('./routes/namespace');
const chatPageRouter = require('./routes/chat');

const app = express();
// aws 設定
aws.config.update({
  secretAccessKey: process.env.awsSecretKey,
  accessKeyId: process.env.awsAccessKeyId,
});
const awsS3 = new aws.S3();
const fileStorage = multerS3({
  s3: awsS3,
  bucket: 'chatvas',
  acl: 'public-read',
  key(req, file, callback) {
    callback(null, `${Date.now()}_${file.originalname}`);
  },
  metadata(req, file, callback) {
    callback(null, { fieldName: file.fieldname });
  },
  // contentType: multerS3.AUTO_CONTENT_TYPE, ( 讓使用者可以直接下載 )
});
app.use(
  multer({ storage: fileStorage }).fields([
    {
      name: 'userAvatar',
      maxCount: 1,
    },
    {
      name: 'messageImage',
      maxCount: 1,
    },
  ]),
);
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/language', languageRouter);
app.use('/userLanguage', userLanguageRouter);
app.use('/namespace', namespaceRouter);
app.use('/chat', chatPageRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
