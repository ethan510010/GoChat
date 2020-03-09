const namespaces = [
  {
    id: 1,
    namespaceName: 'systemDefault'
  },
  {
    id: 2,
    namespaceName: 'AppWorks'
  },
  {
    id: 3,
    namespaceName: 'Taipei'
  }
]

const rooms = [
  {
    id: 1,
    name: 'general',
    namespaceId: 1
  },
  {
    id: 2,
    name: 'general',
    namespaceId: 2
  },
  {
    id: 3,
    name: 'general',
    namespaceId: 3
  }
]

const canvasImages = [
  {
    id: 1,
    roomId: 2,
    canvasUrl: 'https://d1pj9pkj6g3ldu.cloudfront.net/1583463344489_canvas2'
  },
  {
    id: 2,
    roomId: 3,
    canvasUrl: 'https://d1pj9pkj6g3ldu.cloudfront.net/1583463344489_canvas3'
  }
]

const users = [
  {
    id: 1,
    access_token: 'user1AccessToken',
    fb_access_token: '',
    provider: 'native',
    expired_date: 1584030665572,
    selected_language: 'en',
    last_selected_room_id: 2,
    last_selected_namespace_id: 2
  },
  {
    id: 2,
    access_token: 'user2AccessToken',
    fb_access_token: '',
    provider: 'native',
    expired_date: 1584030705572,
    selected_language: 'zh-TW',
    last_selected_room_id: 3,
    last_selected_namespace_id: 3
  }, 
  {
    id: 3,
    access_token: 'user3AccessToken',
    fb_access_token: '',
    provider: 'native',
    expired_date: 1584130705572,
    selected_language: 'es',
    last_selected_room_id: 3,
    last_selected_namespace_id: 3
  }
]

const fbUsers = []

const generalUsers = [
  {
    id: 1,
    avatarUrl: '',
    email: 'user1@gmail.com',
    password: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
    name: 'user1',
    userId: 1,
    isActive: 1,
    activeToken: 'user1ActiveToken'
  },
  {
    id: 2,
    avatarUrl: 'https://user2Avatar.jpg',
    email: 'user2@gmail.com',
    password: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
    name: 'user2',
    userId: 2,
    isActive: 1,
    activeToken: 'user2ActiveToken'
  },
  {
    id: 3,
    avatarUrl: 'https://user3Avatar.jpg',
    email: 'user3@gmail.com',
    password: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
    name: 'user3',
    userId: 3,
    isActive: 1,
    activeToken: 'user3ActiveToken'
  }
]

const userRoomJunctions = [
  {
    id: 1,
    roomId: 1,
    userId: 1
  },
  {
    id: 2,
    roomId: 1,
    userId: 2
  },
  {
    id: 3,
    roomId: 1,
    userId: 3
  }, 
  {
    id: 4,
    roomId: 2,
    userId: 3
  },
  {
    id: 5,
    roomId: 3,
    userId: 3
  }
]

const messages = [
  {
    id: 1,
    messageContent: '你好',
    createdTime: 1583118500332,
    userId: 1,
    roomId: 3,
    messageType: 'text'
  },
  {
    id: 2,
    messageContent: '我剛剛忘了傳圖片',
    createdTime: 1583119924854,
    userId: 3,
    roomId: 3,
    messageType: 'text'
  }
]

const translatedMessages = [
  {
    id: 1,
    messageId: 1,
    language: 'en',
    translatedContent: 'Hello there'
  },
  {
    id: 2,
    messageId: 1,
    language: 'zh-TW',
    translatedContent: '你好',
  },
  {
    id: 3,
    messageId: 1,
    language: 'ja',
    translatedContent: 'こんにちは',
  },
  {
    id: 4,
    messageId: 1,
    language: 'es',
    translatedContent: 'Hola'
  },
  {
    id: 5,
    messageId: 2,
    language: 'en',
    translatedContent: 'I just forgot to pass the picture'
  },
  {
    id: 6,
    messageId: 2,
    language: 'zh-TW',
    translatedContent: '我剛剛忘了傳圖片'
  },
  {
    id: 7,
    messageId: 2,
    language: 'ja',
    translatedContent: '写真を渡すのを忘れた'
  },
  {
    id: 8,
    messageId: 2,
    language: 'es',
    translatedContent: 'Solo olvidé pasar la foto'
  }
]

module.exports = {
  namespaces,
  rooms,
  canvasImages,
  users,
  fbUsers,
  generalUsers,
  userRoomJunctions,
  messages,
  translatedMessages
}
