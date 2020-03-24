const nodemailer = require('nodemailer');
const { getUserInfoByUserId } = require('../model/chat');
const { getNamespacesForUser, createNamespaceAndBindingGeneralRoom, renewNamespace } = require('../model/namespace');
require('dotenv').config();

const namespacePage = async (req, res) => {
  const { userId } = req.query;
  try {
    const validNamespaces = await getNamespacesForUser(userId);
    const currentUser = await getUserInfoByUserId(userId);
    res.render('namespace', {
      currentUser,
      namespaces: validNamespaces,
    });
  } catch (error) {
    res.status(500).send('Server error');
  }
};

const createNamespace = async (req, res) => {
  const { namespaceName, createNamespaceUserId } = req.body;
  try {
    const {
      newNamespaceId,
      newDefaultRoomId,
      newNamespaceName,
    } = await createNamespaceAndBindingGeneralRoom(namespaceName, createNamespaceUserId);
    res.status(200).send({
      data: {
        namespaceId: newNamespaceId,
        newDefaultRoomId,
        newNamespaceName,
      },
    });
  } catch (error) {
    res.status(500).send({
      data: error.message,
    });
  }
};

const updateNamespace = async (req, res) => {
  const { updateNamespaceId, updateNamespaceName } = req.body;
  try {
    // 預設該 namespace 底下的 general room 的 id
    const defaultRoomId = await renewNamespace(updateNamespaceId, updateNamespaceName);
    res.status(200).json({
      data: {
        updateNamespaceName,
        thisNamespaceDefaultRoomId: defaultRoomId,
      },
    });
  } catch (error) {
    res.status(500).send({
      data: error.message,
    });
  }
};

const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));

const sendEmail = (transporter, mailOptions) => new Promise((resolve, reject) => {
  transporter.sendMail(mailOptions, (err) => {
    if (err) {
      reject(err);
    } else {
      resolve('success');
    }
  });
});

const invitePeopleToNamespace = async (req, res) => {
  const {
    emailList, namespaceId, newDefaultRoomId, invitor,
  } = req.body;
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    requireTLS: true,
    auth: {
      user: process.env.gmailAccount,
      pass: process.env.gmailPassword,
    },
  });

  const sendEmailPromiseList = [];
  for (let i = 0; i < emailList.length; i++) {
    const email = emailList[i];
    let inviteUrl = '';
    if (process.env.environment === 'development') {
      inviteUrl = `${process.env.devHost}/signin?inviteNamespaceId=${namespaceId}&defaultRoomId=${newDefaultRoomId}`;
    } else if (process.env.environment === 'production') {
      inviteUrl = `${process.env.prodHost}/signin?inviteNamespaceId=${namespaceId}&defaultRoomId=${newDefaultRoomId}`;
    }
    const mailOptions = {
      from: process.env.gmailAccount,
      to: email,
      subject: `You are invited to join Interchatvas by ${invitor}`,
      text: `Your Interchatvas link: ${inviteUrl}`,
    };
    try {
      // 因為 nodemailer 用 promiseAll 太密集送會有問題，讓每一次送 email 間隔 1.5s
      // eslint-disable-next-line no-await-in-loop
      await sleep(1500);
      // eslint-disable-next-line no-await-in-loop
      const sendResult = await sendEmail(transporter, mailOptions);
      sendEmailPromiseList.push(sendResult);
    } catch (error) {
      console.log(error);
    }
    // const eachEmailPromise = sendEmail(transporter, mailOptions)
    // sendEmailPromiseList.push(eachEmailPromise);
  }

  res.status(200).send({
    data: sendEmailPromiseList,
  });
  // Promise.all(sendEmailPromiseList).then((results) => {
  //   res.status(200).send({
  //     data: results
  //   })
  // }).catch((error) => {
  //   console.log('寄信錯誤', error);
  //   res.status(500).send({
  //     data: error.message
  //   })
  // })
};

module.exports = {
  namespacePage,
  createNamespace,
  invitePeopleToNamespace,
  updateNamespace,
};
