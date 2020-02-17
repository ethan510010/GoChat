const { getNamespacesForUser, createNamespaceAndBindingGeneralRoom, renewNamespace } = require('../model/namespace');
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

const updateNamespace = async (req, res) => {
  const { updateNamespaceId, updateNamespaceName } = req.body;
  try {
    // 預設該 namespace 底下的 general room 的 id
    const defaultRoomId = await renewNamespace(updateNamespaceId, updateNamespaceName);
    res.status(200).json({
      data: {
        updateNamespaceName: updateNamespaceName,
        thisNamespaceDefaultRoomId: defaultRoomId
      }
    })
  } catch (error) {
    res.status(500).send({
      data: error.message
    })
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
      subject: 'You are invited to join Interchatvas',
      text: `Your Interchatvas link: ${inviteUrl}`
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
  invitePeopleToNamespace,
  updateNamespace
}