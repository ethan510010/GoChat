require('dotenv').config();
const aws = require('aws-sdk');
aws.config.update({
  secretAccessKey: process.env.awsSecretKey,
  accessKeyId: process.env.awsAccessKeyId
})
const s3Bucket = new aws.S3({
  params: {
    Bucket: 'chatvas'
  }
})

async function handleBufferUpload(base64Info, fileKey) {
  const buffer = new Buffer.from(base64Info.replace(/^data:image\/\w+;base64,/, ""), 'base64');
  // Getting the file type, ie: jpeg, png or gif
  const type = base64Info.split(';')[0].split('/')[1];
  const uploadS3Paras = {
    Key: fileKey,
    Body: buffer,
    ACL: 'public-read',
    ContentEncoding: 'base64',
    // ContentType: `image/${type}` // 為了讓使用者點擊可以直接下載
  }
  const { Key } = await s3Bucket.upload(uploadS3Paras).promise();
  return `https://d1pj9pkj6g3ldu.cloudfront.net/${Key}`;
}

module.exports = {
  handleBufferUpload
}