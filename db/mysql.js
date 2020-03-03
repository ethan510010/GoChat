const mySQL = require('mysql');
const { mySQLConfig } = require('../config/mysql')

const mySQLPool = mySQL.createPool(mySQLConfig);

// generalUse
function exec(sql) {
  return new Promise((resolve, reject) => {
    mySQLPool.query(sql, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
    })
  })
}

function execWithParaObj(sql, paraObj) {
  return new Promise((resolve, reject) => {
    mySQLPool.query(sql, paraObj, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
    })
  })
}

// Create Room and Binding user
// function createRoomTransaction(roomSQL, junstionSQL, userIdList, roomName) {
//   return new Promise((resolve, reject) => {
//     mySQLPool.getConnection((err, connection) => {
//       if (err) {
//         connection.release();
//         reject(err);
//         return;
//       }
//       connection.beginTransaction((transactionErr) => {
//         if (transactionErr) {
//           return connection.rollback(() => {
//             connection.release();
//             reject(transactionErr);
//           })
//         }
//         connection.query(roomSQL, [roomName], (err, result) => {
//           if (err) {
//             return connection.rollback(() => {
//               connection.release();
//               reject(err);
//             })
//           }
//           const roomId = result.insertId;
//           for (let index = 0; index < userIdList.length; index++) {
//             const eachUserId = userIdList[index];
//             connection.query(junstionSQL, [roomId, eachUserId], (err, result) => {
//               if (err) {
//                 return connection.rollback(() => {
//                   connection.release();
//                   reject(err);
//                 })
//               }
//             })
//           }
//           connection.commit((commitErr) => {
//             if (commitErr) {
//               return connection.rollback(() => {
//                 connection.release();
//                 reject(commitErr);
//               })
//             }
//             resolve({
//               channelId: roomId,
//               allUsers: userIdList
//             });
//             connection.release();
//             console.log('新增 Room 及綁定 User 成功');
//           })
//         })
//       })
//     })
//   })
// }

// Create User use
function createGeneralUser(userBasicSQL, userDetailsSQL, userInfoObj) {
  return new Promise((resolve, reject) => {
    mySQLPool.getConnection((err, connection) => {
      if (err) {
        connection.release();
        reject(err);
        return;
      }
      connection.beginTransaction((transactionErr) => {
        // 有錯誤
        if (transactionErr) {
          return connection.rollback(() => {
            connection.release();
            reject(transactionErr);
          })
        }
        // 沒有錯誤
        connection.query(userBasicSQL, [userInfoObj.accessToken,
        userInfoObj.fbAccessToken,
        userInfoObj.provider,
        userInfoObj.expiredDate,
        userInfoObj.beInvitedRoomId], (insertBasicErr, result) => {
          if (insertBasicErr) {
            return connection.rollback(() => {
              connection.release();
              reject(insertBasicErr);
            })
          }
          const userId = result.insertId;
          // 要帶進去的參數根據 provider 變換
          let parameters = [];
          switch (userInfoObj.provider) {
            case 'native':
              parameters = [
                userInfoObj.avatarUrl,
                userInfoObj.email,
                userInfoObj.password,
                userInfoObj.name,
                userId,
                userInfoObj.activeToken]
              break;
            case 'facebook':
              parameters = [userInfoObj.avatarUrl, userInfoObj.name, userInfoObj.email, userId]
              break;
          }
          connection.query(userDetailsSQL, parameters, (insertDetailErr, result) => {
            if (insertDetailErr) {
              return connection.rollback(() => {
                connection.release();
                reject(insertDetailErr);
              })
            }
            // 每個新創建的用戶都會被綁定到 general 這個 room，這個 room 的 id 都是 1
            // 但如果是被邀請的人，下面的 roomId 就不是1，而是被邀請的 roomId
            let userRoomJunctionRoomId = userInfoObj.beInvitedRoomId ? userInfoObj.beInvitedRoomId : 1;
            connection.query(`
              insert into user_room_junction 
              set roomId=${userRoomJunctionRoomId},
              userId=${userId}
            `, (insertRoomErr, result) => {
              if (insertRoomErr) {
                return connection.rollback(() => {
                  connection.release();
                  reject(insertRoomErr);
                })
              }
              // 再把資料撈出來
              connection.query(`SELECT user.selected_language as selectedLanguage 
              from user where id=${userId}`,
                (searchErr, result) => {
                  if (searchErr) {
                    return connection.rollback(() => {
                      connection.release();
                      reject(searchErr);
                    })
                  }
                  connection.commit((commitErr) => {
                    if (commitErr) {
                      return connection.rollback(() => {
                        connection.release();
                        reject(commitErr);
                      })
                    }
                    console.log('新增用戶成功')
                    resolve({
                      userId: userId,
                      selectedLanguage: result[0].selectedLanguage
                    });
                    connection.release();
                  })
                })
            })
          })
        })
      })
    })
  })
}

// update FBUser use
function updateFBUserInfo(generalUserSQL, fbUserSQL, userDetailObj) {
  return new Promise((resolve, reject) => {
    mySQLPool.getConnection((err, connection) => {
      if (err) {
        connection.release();
        reject(err);
        return;
      }
      connection.beginTransaction((transactionErr) => {
        // 有錯誤
        if (transactionErr) {
          return connection.rollback(() => {
            connection.release();
            reject(transactionErr);
          })
        }
        // 沒有錯誤
        connection.query(generalUserSQL, [userDetailObj.accessToken,
        userDetailObj.fbAccessToken,
        userDetailObj.provider,
        userDetailObj.expiredDate,
        userDetailObj.beInvitedRoomId], (insertBasicErr, result) => {
          if (insertBasicErr) {
            return connection.rollback(() => {
              connection.release();
              reject(insertBasicErr);
            })
          }
          connection.query(fbUserSQL, [userDetailObj.avatarUrl, userDetailObj.fbUserName, userDetailObj.fbEmail], (insertDetailErr, result) => {
            if (insertDetailErr) {
              return connection.rollback(() => {
                connection.release();
                reject(insertDetailErr);
              })
            }
            // 如果有 beInvitedRoomId (beInvitedRoomId 不是 undefined)，代表是被邀請的，
            // 就必須再 insert 到 user_room_junction 這張 table，但是如果該用戶已經被綁定到該 room 過，就不應該再重複插入 (擋掉使用者又是從信件中按連結)
            // 否則代表是一般 FB 重新登入，就不需此步驟
            if (userDetailObj.beInvitedRoomId) {
              connection.query(`
                select * from user_room_junction 
                where userId=${userDetailObj.userId} and roomId=${userDetailObj.beInvitedRoomId}`, (err, result) => {
                if (err) {
                  return connection.rollback(() => {
                    connection.release();
                    reject(commitErr);
                  })
                }
                // 代表已經存在了，不用再 insert
                if (result.length > 0) {
                  connection.commit((commitErr) => {
                    if (commitErr) {
                      return connection.rollback(() => {
                        connection.release();
                        reject(commitErr);
                      })
                    }
                    console.log('更新FB用戶成功')
                    resolve(userDetailObj.userId);
                    connection.release();
                  })
                } else {
                  connection.query(`insert into user_room_junction 
                    set roomId=${userDetailObj.beInvitedRoomId}, 
                    userId=${userDetailObj.userId}
                  `, (insertRoomJunctionErr, result) => {
                    if (insertRoomJunctionErr) {
                      return connection.rollback(() => {
                        connection.release();
                        reject(commitErr);
                      })
                    }
                    connection.commit((commitErr) => {
                      if (commitErr) {
                        return connection.rollback(() => {
                          connection.release();
                          reject(commitErr);
                        })
                      }
                      console.log('更新FB用戶成功')
                      resolve(userDetailObj.userId);
                      connection.release();
                    })
                  })
                }
              })
            } else {
              connection.commit((commitErr) => {
                if (commitErr) {
                  return connection.rollback(() => {
                    connection.release();
                    reject(commitErr);
                  })
                }
                console.log('更新FB用戶成功')
                resolve(userDetailObj.userId);
                connection.release();
              })
            }
          })
        })
      })
    })
  })
}

function updateGeneralUserTransaction(updateGeneralUserSQL, insertRoomJunctionSQL, userObj) {
  return new Promise((resolve, reject) => {
    mySQLPool.getConnection((err, connection) => {
      if (err) {
        connection.release();
        reject(err);
        return;
      }
      connection.beginTransaction((transactionErr) => {
        // 有錯誤
        if (transactionErr) {
          return connection.rollback(() => {
            connection.release();
            reject(transactionErr);
          })
        }
        connection.query(updateGeneralUserSQL, [
          userObj.token,
          userObj.expiredTime
        ], (updateErr, result) => {
          if (updateErr) {
            return connection.rollback(() => {
              connection.release();
              reject(commitErr);
            })
          }
          // 區分是否為被邀清進 namespace
          // 沒有 beInvitedRoomId 代表為一般重新登入
          if (!userObj.beInvitedRoomId) {
            connection.commit((commitErr) => {
              if (commitErr) {
                return connection.rollback(() => {
                  connection.release();
                  reject(commitErr);
                })
              }
              console.log('更新一般用戶成功')
              resolve(userObj.userId);
              connection.release();
            })
            // 有 beInvitedRoomId 代表為有被邀請的重新登入，但要先確定是不是已經被綁定過到該房間裡面了 (這個是要擋使用者自己從信中點邀請連結避免重複 insert)
          } else {
            connection.query(`
            select * from user_room_junction 
            where roomId=${userObj.beInvitedRoomId} 
            and userId=${userObj.userId}`, (searchErr, result) => {
              if (searchErr) {
                return connection.rollback(() => {
                  connection.release();
                  reject(searchErr);
                })
              }
              // 代表該用戶已經被綁定到該房間了
              if (result.length > 0) {
                connection.commit((commitErr) => {
                  if (commitErr) {
                    return connection.rollback(() => {
                      connection.release();
                      reject(commitErr);
                    })
                  }
                  console.log('更新 Token 成功');
                  resolve(userObj.userId);
                  connection.release();
                })
              } else {
                connection.query(insertRoomJunctionSQL, [userObj.userId, userObj.beInvitedRoomId], (err, result) => {
                  if (err) {
                    return connection.rollback(() => {
                      connection.release();
                      reject(err);
                    })
                  }
                  connection.commit((commitErr) => {
                    if (commitErr) {
                      return connection.rollback(() => {
                        connection.release();
                        reject(commitErr);
                      })
                    }
                    console.log('更新一般用戶成功')
                    resolve(userObj.userId);
                    connection.release();
                  })
                })
              }
            })
          }
        })
      })
    })
  })
}


// 更新房間用戶
// function updateRoomMember(updateRoomSQL, roomId, userIdList) {
//   return new Promise((resolve, reject) => {
//     mySQLPool.getConnection((err, connection) => {
//       if (err) {
//         connection.release();
//         reject(err);
//         return;
//       }
//       connection.beginTransaction((transactionErr) => {
//         if (transactionErr) {
//           return connection.rollback(() => {
//             connection.release();
//             reject(transactionErr);
//           })
//         }
//         for (let i = 0; i < userIdList.length; i++) {
//           const userId = userIdList[i];
//           connection.query(updateRoomSQL, [roomId, userId], (err, result) => {
//             if (err) {
//               return connection.rollback(() => {
//                 connection.release();
//                 reject(err);
//               })
//             }
//           });
//         }
//         connection.commit((commitErr) => {
//           if (commitErr) {
//             return connection.rollback(() => {
//               connection.release();
//               reject(commitErr);
//             })
//           }
//           resolve({
//             roomId: roomId,
//             userIdList: userIdList
//           });
//           connection.release();
//           console.log('更新房間用戶成功');
//         })
//       })
//     })
//   })
// }

// canvasTransaction 
// function handleRoomCanvas(readQuery, insertQuery, updateQuery) {
//   return new Promise((resolve, reject) => {
//     mySQLPool.getConnection((err, connection) => {
//       if (err) {
//         connection.release();
//         reject(err);
//         return;
//       }
//       connection.beginTransaction((transactionErr) => {
//         if (transactionErr) {
//           return connection.rollback(() => {
//             connection.release();
//             reject(transactionErr);
//           })
//         }
//         connection.query(readQuery, (err, result) => {
//           if (err) {
//             return connection.rollback(() => {
//               connection.release();
//               reject(err);
//             })
//           }
//           if (result.length === 0) {
//             connection.query(insertQuery, (err, result) => {
//               if (err) {
//                 return connection.rollback(() => {
//                   connection.release();
//                   reject(err);
//                 })
//               }
//               connection.commit((commitErr) => {
//                 if (commitErr) {
//                   return connection.rollback(() => {
//                     connection.release();
//                     reject(commitErr);
//                   })
//                 }
//                 resolve({
//                   insertResult: result
//                 })
//                 connection.release();
//                 console.log('儲存 canvas 成功');
//               })
//             })
//           } else {
//             connection.query(updateQuery, (err, result) => {
//               if (err) {
//                 return connection.rollback(() => {
//                   connection.release();
//                   reject(err);
//                 })
//               }
//               connection.commit((commitErr) => {
//                 if (commitErr) {
//                   return connection.rollback(() => {
//                     connection.release();
//                     reject(commitErr);
//                   })
//                 }
//                 resolve({
//                   updateResult: result
//                 })
//                 connection.release();
//                 console.log('更新 canvas 成功');
//               })
//             })
//           }
//         })
//       })
//     })
//   })
// }

// create a namespace and binding general room transaction
// function createNameSpaceTransaction(createNamespaceSQL, namespaceName, createNamespaceUserId) {
//   return new Promise((resolve, reject) => {
//     mySQLPool.getConnection((err, connection) => {
//       if (err) {
//         connection.release();
//         reject(err);
//         return;
//       }
//       connection.beginTransaction((transactionErr) => {
//         if (transactionErr) {
//           return connection.rollback(() => {
//             connection.release();
//             reject(transactionErr);
//           })
//         }
//         connection.query(createNamespaceSQL, [namespaceName], (err, result) => {
//           if (err) {
//             return connection.rollback(() => {
//               connection.release();
//               reject(err);
//             })
//           }
//           const newNamespaceId = result.insertId;
//           connection.query(`
//             insert into room 
//             set name='general', 
//             namespaceId=${newNamespaceId}
//             `, (insertRoomErr, result) => {
//             if (insertRoomErr) {
//               return connection.rollback(() => {
//                 connection.release();
//                 reject(insertNamespaceErr);
//               })
//             }
//             // 新的 namespace 預設的 general room 的 id
//             const newNamespaceGeneralRoomId = result.insertId;
//             connection.query(`update user set 
//                   last_selected_room_id=${newNamespaceGeneralRoomId} 
//                   where id=${createNamespaceUserId}`, (updateErr, result) => {
//               if (updateErr) {
//                 return connection.rollback(() => {
//                   connection.release();
//                   reject(updateErr);
//                 })
//               }
//               connection.query(`insert into user_room_junction 
//                     set roomId=${newNamespaceGeneralRoomId}, userId=${createNamespaceUserId}`,
//                 (insertErr, result) => {
//                   if (insertErr) {
//                     return connection.rollback(() => {
//                       connection.release();
//                       reject(insertErr);
//                     })
//                   }
//                   connection.commit((commitErr) => {
//                     if (commitErr) {
//                       return connection.rollback(() => {
//                         connection.release();
//                         reject(commitErr);
//                       })
//                     }
//                     console.log('新增 namespace 及綁定預設房間成功')
//                     resolve({
//                       newNamespaceId: newNamespaceId,
//                       newDefaultRoomId: newNamespaceGeneralRoomId,
//                       newNamespaceName: namespaceName
//                     })
//                     connection.release();
//                   })
//                 })
//             })
//           })
//         })
//       })
//     })
//   })
// }

// update namespace transaction
// function updateNamespaceTransaction(namespaceName, selectDefaultRoomSQL, updateNamespaceSQL) {
//   return new Promise((resolve, reject) => {
//     mySQLPool.getConnection((err, connection) => {
//       if (err) {
//         connection.release();
//         reject(err);
//         return;
//       }
//       connection.beginTransaction((transactionErr) => {
//         if (transactionErr) {
//           return connection.rollback(() => {
//             connection.release();
//             reject(transactionErr);
//           })
//         }
//         connection.query(selectDefaultRoomSQL, (err, result) => {
//           if (err) {
//             return connection.rollback(() => {
//               connection.release();
//               reject(err);
//             })
//           }
//           if (result.length > 0) {
//             const defaultRoomId = result[0].roomId;
//             connection.query(updateNamespaceSQL, [namespaceName], (err, result) => {
//               if (err) {
//                 return connection.rollback(() => {
//                   connection.release();
//                   reject(err);
//                 })
//               }
//               connection.commit((commitErr) => {
//                 if (commitErr) {
//                   return connection.rollback(() => {
//                     connection.release();
//                     reject(commitErr);
//                   })
//                 }
//                 resolve({
//                   defaultRoomId: defaultRoomId
//                 })
//                 connection.release();
//                 console.log('更新 namespace 成功');
//               })
//             })
//           }
//         })
//       })
//     })
//   })
// }

function updateUserSelectedNamespaceAndRoomTransaction(userId, namespaceId) {
  return new Promise((resolve, reject) => {
    mySQLPool.getConnection((err, connection) => {
      if (err) {
        connection.release();
        reject(err);
        return;
      }
      connection.beginTransaction((transactionErr) => {
        if (transactionErr) {
          return connection.rollback(() => {
            connection.release();
            reject(transactionErr);
          })
        }
        connection.query(`
          SELECT 
          room.id as roomId, 
          room.name as roomName, 
          namespaceId, 
          namespaceName from namespace 
          inner join room 
          on namespace.id=room.namespaceId  
          where namespaceId=${namespaceId} order by roomId`
          , (err, result) => {
            if (err) {
              return connection.rollback(() => {
                connection.release();
                reject(err);
              })
            }
            if (result.length > 0) {
              // 因為有按照 roomId 排序，所以第一個就是 general room
              const namespaceGeneralRoomId = result[0].roomId;
              connection.query(`
              UPDATE user 
              SET last_selected_room_id=${namespaceGeneralRoomId},
              last_selected_namespace_id=${namespaceId} where id=${userId}`, (updateErr, result) => {
                if (updateErr) {
                  return connection.rollback(() => {
                    connection.release();
                    reject(err);
                  })
                }
                connection.commit((commitErr) => {
                  if (commitErr) {
                    return connection.rollback(() => {
                      connection.release();
                      reject(commitErr);
                    })
                  }
                  resolve({
                    namespaceId: namespaceId
                  })
                  connection.release();
                  console.log('更新 user 選擇的 namespace 成功');
                })
              })
            } else {
              resolve({
                namespaceId: namespaceId
              })
              connection.release();
            }
          })
      })
    })
  })
}

function updateUserNameOrAvatarTransaction(selecteUserProviderSQL, updateFBUserAvatarOrNameSQL, updateNativeUserAvatarOrNameSQL, parameter) {
  return new Promise((resolve, reject) => {
    mySQLPool.getConnection((err, connection) => {
      if (err) {
        connection.release();
        reject(err);
        return;
      }
      connection.beginTransaction((transactionErr) => {
        if (transactionErr) {
          return connection.rollback(() => {
            connection.release();
            reject(transactionErr);
          })
        }
        connection.query(selecteUserProviderSQL, (err, result) => {
          if (err) {
            return connection.rollback(() => {
              connection.release();
              reject(err);
            })
          }
          const { provider } = result[0];
          let updateUserSQL = '';
          if (provider === 'native') {
            updateUserSQL = updateNativeUserAvatarOrNameSQL;
          } else if (provider === 'facebook') {
            updateUserSQL = updateFBUserAvatarOrNameSQL;
          }
          connection.query(updateUserSQL, [parameter], (err, result) => {
            if (err) {
              return connection.rollback(() => {
                connection.release();
                reject(err);
              })
            }
            connection.commit((commitErr) => {
              if (commitErr) {
                return connection.rollback(() => {
                  connection.release();
                  reject(commitErr);
                })
              }
              resolve({
                updateInfo: parameter
              })
              connection.release();
              console.log('更新使用者資料成功');
            })
          })
        })
      })
    })
  })
}

function updateActiveTokenTransaction(
  updateActiveSQL,
  activeToken,
  getUserInfoSQL) {
  return new Promise((resolve, reject) => {
    mySQLPool.getConnection((err, connection) => {
      if (err) {
        connection.release();
        reject(err);
        return;
      }
      connection.beginTransaction((transactionErr) => {
        if (transactionErr) {
          return connection.rollback(() => {
            connection.release();
            reject(transactionErr);
          })
        }
        connection.query(updateActiveSQL, [activeToken], (updateErr, result) => {
          if (updateErr) {
            return connection.rollback(() => {
              connection.release();
              reject(err);
            })
          }
          connection.query(getUserInfoSQL, [activeToken], (err, result) => {
            if (err) {
              return connection.rollback(() => {
                connection.release();
                reject(err);
              })
            }
            connection.commit((commitErr) => {
              if (commitErr) {
                return connection.rollback(() => {
                  connection.release();
                  reject(commitErr);
                })
              }
              resolve({
                userId: result[0].userId,
                userEmail: result[0].email,
                userName: result[0].name,
                accessToken: result[0].accessToken,
                selectedLanguage: result[0].selectedLanguage
              })
              connection.release();
              console.log('驗證帳號成功');
            })
          })
        })
      })
    })
  })
}

// 測試封裝 transaction
function createConnection() {
  return new Promise((resolve, reject) => {
    mySQLPool.getConnection((err, connection) => {
      if (err) {
        connection.release();
        reject(err);
        return;
      }
      resolve(connection);
    })
  })
}

function startTransaction(connection) {
  return new Promise((resolve, reject) => {
    connection.beginTransaction((transactionErr) => {
      if (transactionErr) {
        return connection.rollback(() => {
          connection.release();
          reject(transactionErr);
        })
      }
      resolve();
    })
  })
}

function query(connection, sql, params) {
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (err, result) => {
      if (err) {
        return connection.rollback(() => {
          connection.release();
          reject(err);
        })
      }
      resolve(result);
    })
  })
}

function commit(connection, customResult) {
  return new Promise((resolve, reject) => {
    connection.commit((commitErr) => {
      if (commitErr) {
        return connection.rollback(() => {
          connection.release();
          reject(commitErr);
        })
      }
      resolve(customResult);
      connection.release();
      console.log('transaction 完成');
    })
  })
}

module.exports = {
  exec,
  execWithParaObj,
  createGeneralUser,
  updateFBUserInfo,
  escape: mySQL.escape,
  // createRoomTransaction,
  // updateRoomMember,
  // handleRoomCanvas,
  // createNameSpaceTransaction,
  // updateNamespaceTransaction,
  updateGeneralUserTransaction,
  updateUserNameOrAvatarTransaction,
  updateUserSelectedNamespaceAndRoomTransaction,
  updateActiveTokenTransaction,
  createConnection,
  startTransaction,
  query,
  commit
}