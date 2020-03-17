# Chatvas
Chatvas aims to eliminate the difficulty of communication between different countries.

Website URL: https://interchatvas.com

Test account and password: ethan510010@hotmail.com / 123456 

[![Chatvas Demo](https://i.imgur.com/s0A1Klu.gif)](https://www.youtube.com/watch?v=ksQrCt32N9M "Chatvas Demo")

## Table of Contents
* [Backend Technique](#backend-Technique)
    * [Infrastructure](#infrastructure)
    * [Environment](#environment)
    * [Database](#database)
    * [Cloud Service (AWS)](#cloud-service-(AWS))
    * [Networking](#networking)
    * [Test](#test)
    * [Third Party](#third-party)
    * [Version Control](#version-control)
    * [Key Points](#key-points)
* [Architecture](#architecture)
* [Database Schema](#database-schema)
* [Front-End Technique](#Front-End-technique)
* [Main Features](#main-features)
* [API Doc](#api-doc)
* [Contact](#contact)

## Backend Technique

#### Infrastructure
* Docker

#### Environment
* Node.js/Express.js

#### Database
* MySQL
* Redis (Cache)

#### Cloud Service (AWS)
* EC2
* S3, CloudFront
* Route 53
* RDS
* ElastiCache

#### Networking
* HTTP & HTTPS
* Domain Name System (DNS)
* NGINX
* SSL (Let's Encrypt)

#### Test
* Unit Test: Jest
* Load Test Tool: Artillery

#### Third Party
* Facebook Login API
* Google Translate API

#### Version Control
* Git/GitHub

#### Key Points
* Socket IO
* Canvas
* MVC Pattern
* Peer Server
* WebRTC

## Architecture
* #### Server Architecture
![](https://i.imgur.com/zj483Vk.png)



* #### Socket Architecture
    * ##### User join room and get online users
    ![](https://i.imgur.com/RyyOPqh.png)
    * ##### User get historical messages and canvas image
    ![](https://i.imgur.com/KQVWqwC.png)
    * ##### User send Message, draw image and peer info
    ![](https://i.imgur.com/bgEqYQU.png)




## Database Schema
![](https://i.imgur.com/xluVw1d.png)

## Front-End Technique
* HTML
* CSS
* JavaScript
* AJAX

## Main Features
* Multiple workspaces
    * Users can create their own workspace like company or any organization
    * Users can invite people to workspace by sending invited email
* Live Translation Chat
    * The original chat message would be translated to the user's preferred language
    * Support uploading images, and drawing on whiteboard
    * Show the online users of each channel
    * Users can receive notification of the message from other channel they have joined
    * Create channel by user
    * Edit user profile during conversation
    * Search channel
    * Invite people for existing channel
    * User can leave channel, and other people in the room will receive notification
* Chat History
    * Users can trace their historical messages and draw result
* WebRTC
    * Users can make screen sharing call to all people in the channel
* Member System
    * Support native and facebook account
    * Native signup user will receive verified email to activate their account

## API Doc
### Host Name
interchatvas.com

### Main Response Object
* `Sign in/up object`



| Field | Type | Description |
| -------- | -------- | -------- |
| accessToken     | String     | Token for verifying identity     |
| expiredDate | Int | Token expired timestamp |
| id | Int | User id |
| provider | String | user sign in way |
| email | String | user's email |
| name | String | user's name |
| avatarUrl | String | user's avatar url |
| selectedLanguage | String | user's preferred language |

* `renew avatar object`

| Field | Type | Description |
| -------- | -------- | -------- |
| userId     | Int     |  user id     |
| avatarUrl | String | new avatar url |


* `update selected namespace object`

| Field    | Type   | Description   |
| -------- | ------ | ------------- |
| userId | Int | user id |
| newSelectedNamespaceId | Int | user's new selected workspace id |


* `create namespace object`


| Field    | Type   | Description   |
| -------- | ------ | ------------- |
| namespaceId | Int | new created workspace id |
| newDefaultRoomId | Int | new workspace default room id |
| newNamespaceName | String | new workspace name |

* update workspace response

| Field    | Type   | Description   |
| -------- | ------ | ------------- |
| updateNamespaceName | String | workspace name |
| thisNamespaceDefaultRoomId | Int | this workspace default room id |


### Users Related API

* #### User Sign in
##### End Point: `/users/signin`
##### Method: `POST`
##### Request Example: 
`https://interchatvas.com/users/signin`
##### Request Headers: 

| Field | Type | Description |
| -------- | -------- | -------- |
| Content-Type     | String     | `application/json`     |
##### Request Body

| Field    | Type   | Description   |
| -------- | ------ | ------------- |
| email    | String | user mail (be necessary if using native login)   |
| password | String | user password (be necessary if using native login)|
| signinway  |  String    |   `native` or `facebook`            |
| thirdPartyAuthToken | String | facebook auth token (be necessary if using fb login) |
| (optional) beInvitedRoomId | Int | room id user be invited |

##### Request Example
```
{
    "email": "ethan510010@hotmail.com",
    "password": "123456",
    "signinway": "native"
}
```
or
```
{
    "thirdPartyAuthToken": "53829141081dd7748a445d837cf016d1de8ba59e218353d6528b20b43fe9479c",
    "signinway": "facebook"
}
```

##### Success Response: 200


| Field | Type | Description |
| -------- | -------- | -------- |
| data     | Object     | A detailed user info object     |

##### Success Response Example:
```
{
    "data": {
        "accessToken": "a4558a0bd67901bc779b449d6178c376cf6372a40462655190020f1e5330f2a9",
        "expiredDate": 1583891262383,
        "user": {
            "id": 214,
            "provider": "native",
            "email": "ethan510010@hotmail.com",
            "name": "ethan0909",
            "avatarUrl": "https://d1pj9pkj6g3ldu.cloudfront.net/1582969896150_main.jpg",
            "selectedLanguage": "zh-TW"
        }
    }
}
```
if no user exists:
```
{
    "data": "此用戶不存在"
}
```
* #### User Sign up
##### End Point: `/users/signup`
##### Method: `POST`
##### Request Example: 
`https://interchatvas.com/users/signup`
##### Request Headers: 

| Field | Type | Description |
| -------- | -------- | -------- |
| Content-Type     | String     | `application/json`     |
##### Request Body

| Field    | Type   | Description   |
| -------- | ------ | ------------- |
| username    | String | user sign up name |
| email | String | user sign up email |
| password  |  String    |  user sign up password  |
| (optional) beInvitedRoomId | Int | room id user be invited |

##### Request Example
```
{
    "username": "test2",
    "email": "test2@hotmail.com",
    "password": "123456"
}
```

##### Success Response: 200


| Field | Type | Description |
| -------- | -------- | -------- |
| data     | Object     | A detailed user info object     |

##### Success Response Example:
```
{
    "data": {
        "accessToken": "9ea5141d3d3670bfaff1c7cf592f16bf7203bc92a0bd4671e035a68c1d1d03f4",
        "expiredDate": 1583918432434,
        "user": {
            "id": 215,
            "provider": "native",
            "name": "test2",
            "email": "test2@hotmail.com",
            "avatarUrl": "/images/defaultAvatar.png",
            "selectedLanguage": "en"
        }
    }
}
```
if the email has already existed:
```
{
    "data": "該用戶已存在"
}
```
* #### User renew avatar
##### End Point: `/users/renewUserAvatar`
##### Method: `PUT`
##### Request Example: 
`https://interchatvas.com/users/renewUserAvatar`
##### Request Headers: 

| Field | Type | Description |
| -------- | -------- | -------- |
| Content-Type     | String     | `multipart/form-data`     |
##### Request Body

| Field    | Type   | Description   |
| -------- | ------ | ------------- |
| userAvatar    | binary | avatar file |
| userId | Int | user id |

##### Request Example
```
{
    "userAvatar": (binary),
    "userId": "215"
}
```

##### Success Response: 200


| Field | Type | Description |
| -------- | -------- | -------- |
| data     | Object     | user's Id, new user avatar url     |

##### Success Response Example:
```
{
    "data": {
        "userId": 215,
        "avatarUrl": "https://d1pj9pkj6g3ldu.cloudfront.net/aaaa.png"
    }
}
```
* #### User update selected workspace
##### End Point: `/users/updateSelectedNamespace`
##### Method: `PUT`
##### Request Example: 
`https://interchatvas.com/users/updateSelectedNamespace`
##### Request Headers: 

| Field | Type | Description |
| -------- | -------- | -------- |
| Content-Type     | String     | `application/json`     |
##### Request Body

| Field    | Type   | Description   |
| -------- | ------ | ------------- |
| userId | Int | user id |
| newSelectedNamespaceId | Int | user's new selected workspace id |

##### Request Example
```
{
    "userId": 125,
    "newSelectedNamespaceId": 3
}
```

##### Success Response: 200


| Field | Type | Description |
| -------- | -------- | -------- |
| userId     | Int     | user's Id |
| updateNamespaceId | Int | user's new selected workspace id |

##### Success Response Example:
```
{
    "userId": 215,
    "updateNamespaceId": 3
}
```
### Workspace Related api
* #### create new workspace
##### End Point: `/namespace/createNamespace`
##### Method: `POST`
##### Request Example: 
`https://interchatvas.com/namespace/createNamespace`
##### Request Headers: 

| Field | Type | Description |
| -------- | -------- | -------- |
| Content-Type     | String     | `application/json`     |
##### Request Body

| Field    | Type   | Description   |
| -------- | ------ | ------------- |
| namespaceName    | String | new workspace name user creates  |
| createNamespaceUserId | Int | create new workspace user id|

##### Request Example
```
{
    "namespaceName": "AppWorks",
    "userId": 215
}
```


##### Success Response: 200


| Field | Type | Description |
| -------- | -------- | -------- |
| data     | Object     | new created workspace info     |

##### Success Response Example:
```
{
    data: {
        namespaceId: 3,
        newDefaultRoomId: 55,
        newNamespaceName: 'AppWorks'
    }
}
```
* #### update existed workspace
##### End Point: `/namespace/updateNamespace`
##### Method: `PUT`
##### Request Example: 
`https://interchatvas.com/namespace/updateNamespace`
##### Request Headers: 

| Field | Type | Description |
| -------- | -------- | -------- |
| Content-Type     | String     | `application/json`     |
##### Request Body

| Field    | Type   | Description   |
| -------- | ------ | ------------- |
| updateNamespaceName    | String | new workspace name name  |
| updateNamespaceId | Int | be updated namespace id |

##### Request Example
```
{
    "updateNamespaceName": "School",
    "updateNamespaceId": 3
}
```


##### Success Response: 200


| Field | Type | Description |
| -------- | -------- | -------- |
| data     | Object     | be updated workspace info     |

##### Success Response Example:
```
{
    data: {
        updateNamespaceName: 'School',
        thisNamespaceDefaultRoomId: 55
    }
}
```
* #### invite people to workspace
##### End Point: `/namespace/invitePeople`
##### Method: `POST`
##### Request Example: 
`https://interchatvas.com/namespace/invitePeople`
##### Request Headers: 

| Field | Type | Description |
| -------- | -------- | -------- |
| Content-Type     | String     | `application/json`     |
##### Request Body

| Field    | Type   | Description   |
| -------- | ------ | ------------- |
| emailList    | [String] | the emails user want to invite  |
| namespaceId | Int | namespace id |
| newDefaultRoomId | Int | current namespace default room id |
| invitor | String | invitor's name |

##### Request Example
```
{
    emailList: ['ethan510010@hotmail.com'],
    namespaceId: 3,
    newDefaultRoomId: 55,
    invitor: 'ethan'
}
```


##### Success Response: 200


| Field | Type | Description |
| -------- | -------- | -------- |
| data     | [String]     | send email results    |

##### Success Response Example:
```
{
    data: ["success"]
}
```
### Language Related api
* #### user update prefered language
##### End Point: `/language/userPreferedLanguage`
##### Method: `PUT`
##### Request Example: 
`https://interchatvas.com/language/userPreferedLanguage`
##### Request Headers: 

| Field | Type | Description |
| -------- | -------- | -------- |
| Content-Type     | String     | `application/json`     |
##### Request Body

| Field    | Type   | Description   |
| -------- | ------ | ------------- |
| userId    | Int | user id  |
| selectedLanguage | String | prefered language|

##### Request Example
```
{
    "userId": 215,
    "selectedlanguage": 'ja'
}
```


##### Success Response: 200


| Field | Type | Description |
| -------- | -------- | -------- |
| data     | String     | update language result     |

##### Success Response Example:
```
{
    data: "success"
}
```

## Contact

Po-Han Lin

E-mail: ethan510010@gmail.com