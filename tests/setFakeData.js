require('dotenv').config()
const { exec, execWithParaObj } = require('../db/mysql');
const { 
  namespaces,
  rooms,
  canvasImages,
  users,
  fbUsers,
  generalUsers,
  userRoomJunctions, 
  messages, 
  translatedMessages} = require('./fakeData');

async function truncateFakeData() {
  if (process.env.environment !== 'test') {
      console.log('Not in test env');
      return;
  }

  console.log('truncate fake data');

  try {
    await exec(`SET FOREIGN_KEY_CHECKS = 0`);
    await exec(`TRUNCATE TABLE canvas_image`);
    await exec(`TRUNCATE TABLE fb_info`);
    await exec(`TRUNCATE TABLE general_user_info`);
    await exec(`TRUNCATE TABLE message`);
    await exec(`TRUNCATE TABLE namespace`);
    await exec(`TRUNCATE TABLE room`);
    await exec(`TRUNCATE TABLE translation_message`);
    await exec(`TRUNCATE TABLE user`);
    await exec(`TRUNCATE TABLE user_room_junction`);
    await exec(`SET FOREIGN_KEY_CHECKS = 1`);
  } catch (error) {
    console.log(error);
  }
}

async function createFakeData() {
  if (process.env.environment !== 'test') {
      console.log('Not in test env');
      return;
  }

  console.log('insert each fake data');

  try {
    // namespace 資料
    const namespacesInfo = namespaces.map((eachNamespace) => {
      return Object.values(eachNamespace)
    });
    await execWithParaObj(`insert into namespace (id, namespaceName) values ?`, [namespacesInfo])
    // 房間資料
    const roomsInfo = rooms.map((eachRoomInfo) => {
      return Object.values(eachRoomInfo);
    })
    await execWithParaObj(`insert into room (id, name, namespaceId) values ?`, [roomsInfo]);
    // canvas 資料
    const canvasImagesInfo = canvasImages.map((eachImage) => {
      return Object.values(eachImage);
    })
    await execWithParaObj(`insert into canvas_image (id, roomId, canvasUrl) values ?`, [canvasImagesInfo]);
    // users 資料
    const usersInfo = users.map((eachUser) => {
      return Object.values(eachUser);
    })
    await execWithParaObj(`insert into user (id, access_token, fb_access_token, provider, expired_date, selected_language, last_selected_room_id, last_selected_namespace_id) values ?`, [usersInfo]);
    // general_user 資料
    const generalUsersInfo = generalUsers.map((eachGeneralUser) => {
      return Object.values(eachGeneralUser);
    })
    await execWithParaObj(`insert into general_user_info (id, avatarUrl, email, password, name, userId, isActive, activeToken) values ?`, [generalUsersInfo]);
    // user_room junction 資料
    const userRoomJunctionsInfo = userRoomJunctions.map((userRoomJunctionInfo) => {
      return Object.values(userRoomJunctionInfo);
    })
    await execWithParaObj(`insert into user_room_junction (id, roomId, userId) values ?`, [userRoomJunctionsInfo]);
    // fb 用戶資料
    // const fbUsersInfo = fbUsers.map((eachUser) => {
    //   return Object.values(eachUser);
    // })
    // await execWithParaObj(`insert into fb_info (id, userId, fb_avatar_url, fb_name, fb_email) values ?`, [fbUsersInfo]);
    // 訊息資料
    const messagesInfo = messages.map((eachMsg) => {
      return Object.values(eachMsg);
    })
    await execWithParaObj(`insert into message (id, messageContent, createdTime, userId, roomId, messageType) values ?`, [messagesInfo]);
    // 翻譯訊息資料
    const translatedMsgs = translatedMessages.map((eachMsg) => {
      return Object.values(eachMsg);
    })
    await execWithParaObj(`insert into translation_message (id, messageId, language, translatedContent) values ?`, [translatedMsgs]);
  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  truncateFakeData,
  createFakeData
}