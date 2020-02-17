const { getNamespacesForUser, createNamespaceAndBindingGeneralRoom } = require('../model/namespace');
const nodemailer = require('nodemailer');
require('dotenv').config();

const namespacePage = async (req, res) => {
  const { userId } = req.query;
  const validNamespaces = await getNamespacesForUser(userId);
  res.render('namespace', { 
    namespaces: validNamespaces
  })  
}

const createNamespace = async (req, res) => {
  const { namespaceName, createNamespaceUserId } = req.body;
  try {
    const { newNamespaceId, newDefaultRoomId, newNamespaceName } = await createNamespaceAndBindingGeneralRoom(namespaceName, createNamespaceUserId);
    res.status(200).send({
      data: {
        namespaceId: newNamespaceId,
        newDefaultRoomId: newDefaultRoomId,
        newNamespaceName: newNamespaceName
      }
    })  
  } catch (error) {
    res.status(500).send({
      data: error.message
    });
  }
}

const invitePeopleToNamespace = async (req, res) => {
  const { emailList, namespaceId, newDefaultRoomId } = req.body;
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    requireTLS: true,
    auth:{
      user: process.env.gmailAccount,
      pass: process.env.gmailPassword
    }
  })

  let sendEmailPromiseList = [];
  for (let i = 0; i < emailList.length; i++) {
    const email = emailList[i];
    const inviteUrl = `http://localhost:3000?inviteNamespaceId=${namespaceId}&defaultRoomId=${newDefaultRoomId}`;
    const mailOptions = {
      from: process.env.gmailAccount,
      to: email,
      subject: '有人邀請您到 interchatvas 喔',
      text: `您的邀請連結: ${inviteUrl}`
    }
    const eachEmailPromise = sendEmail(transporter, mailOptions)
    sendEmailPromiseList.push(eachEmailPromise);
  }
  Promise.all(sendEmailPromiseList).then((results) => {
    res.status(200).send({
      data: results
    })
  }).catch((error) => {
    res.status(500).send({
      data: error.message
    })
  })
}

const sendEmail = (transporter, mailOptions) => {
  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve('success')
      }
    })  
  })
}

module.exports = {
  namespacePage,
  createNamespace,
  invitePeopleToNamespace
}