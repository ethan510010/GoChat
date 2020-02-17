-- MySQL dump 10.13  Distrib 5.7.24, for macos10.14 (x86_64)
--
-- Host: localhost    Database: goChat
-- ------------------------------------------------------
-- Server version	5.7.24

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `canvas_image`
--

DROP TABLE IF EXISTS `canvas_image`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `canvas_image` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `roomId` int(11) unsigned NOT NULL,
  `canvasUrl` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `roomId` (`roomId`),
  CONSTRAINT `canvas_image_ibfk_1` FOREIGN KEY (`roomId`) REFERENCES `room` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `canvas_image`
--

LOCK TABLES `canvas_image` WRITE;
/*!40000 ALTER TABLE `canvas_image` DISABLE KEYS */;
/*!40000 ALTER TABLE `canvas_image` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fb_info`
--

DROP TABLE IF EXISTS `fb_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fb_info` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `userId` int(11) unsigned NOT NULL,
  `fb_avatar_url` varchar(255) NOT NULL DEFAULT '',
  `fb_name` varchar(45) NOT NULL DEFAULT '',
  `fb_email` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `fb_info_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fb_info`
--

LOCK TABLES `fb_info` WRITE;
/*!40000 ALTER TABLE `fb_info` DISABLE KEYS */;
/*!40000 ALTER TABLE `fb_info` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `general_user_info`
--

DROP TABLE IF EXISTS `general_user_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `general_user_info` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `avatarUrl` varchar(100) NOT NULL DEFAULT '',
  `email` varchar(50) NOT NULL DEFAULT '',
  `password` varchar(255) NOT NULL DEFAULT '',
  `name` varchar(50) NOT NULL DEFAULT '',
  `userId` int(11) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `general_user_info_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `general_user_info`
--

LOCK TABLES `general_user_info` WRITE;
/*!40000 ALTER TABLE `general_user_info` DISABLE KEYS */;
INSERT INTO `general_user_info` VALUES (44,'','test1@hotmail.com','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92','test1',128),(55,'','test3@hotmail.com','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92','test3',139);
/*!40000 ALTER TABLE `general_user_info` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `message`
--

DROP TABLE IF EXISTS `message`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `message` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `messageContent` varchar(255) NOT NULL DEFAULT '',
  `createdTime` bigint(11) NOT NULL,
  `userId` int(11) unsigned NOT NULL,
  `roomId` int(11) unsigned NOT NULL,
  `messageType` varchar(20) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `roomId` (`roomId`),
  CONSTRAINT `message_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `message_ibfk_2` FOREIGN KEY (`roomId`) REFERENCES `room` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `message`
--

LOCK TABLES `message` WRITE;
/*!40000 ALTER TABLE `message` DISABLE KEYS */;
INSERT INTO `message` VALUES (24,'message',1581939276901,139,85,'text');
/*!40000 ALTER TABLE `message` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `namespace`
--

DROP TABLE IF EXISTS `namespace`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `namespace` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `namespaceName` varchar(50) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `namespace`
--

LOCK TABLES `namespace` WRITE;
/*!40000 ALTER TABLE `namespace` DISABLE KEYS */;
INSERT INTO `namespace` VALUES (1,'systemDefault'),(27,'appworks');
/*!40000 ALTER TABLE `namespace` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `room`
--

DROP TABLE IF EXISTS `room`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `room` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL DEFAULT '',
  `namespaceId` int(11) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `namespaceId` (`namespaceId`),
  CONSTRAINT `room_ibfk_1` FOREIGN KEY (`namespaceId`) REFERENCES `namespace` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=86 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `room`
--

LOCK TABLES `room` WRITE;
/*!40000 ALTER TABLE `room` DISABLE KEYS */;
INSERT INTO `room` VALUES (1,'general',1),(85,'general',27);
/*!40000 ALTER TABLE `room` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `translation_message`
--

DROP TABLE IF EXISTS `translation_message`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `translation_message` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `messageId` int(11) unsigned NOT NULL,
  `language` varchar(11) NOT NULL DEFAULT '',
  `translatedContent` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `messageId` (`messageId`),
  CONSTRAINT `translation_message_ibfk_1` FOREIGN KEY (`messageId`) REFERENCES `message` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=97 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `translation_message`
--

LOCK TABLES `translation_message` WRITE;
/*!40000 ALTER TABLE `translation_message` DISABLE KEYS */;
INSERT INTO `translation_message` VALUES (93,24,'en','message'),(94,24,'zh-TW','信息'),(95,24,'ja','メッセージ'),(96,24,'es','mensaje');
/*!40000 ALTER TABLE `translation_message` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `access_token` varchar(255) NOT NULL DEFAULT '',
  `fb_access_token` varchar(255) DEFAULT NULL,
  `provider` varchar(45) NOT NULL DEFAULT '',
  `expired_date` bigint(20) NOT NULL,
  `selected_language` varchar(11) NOT NULL DEFAULT 'en',
  `last_selected_room_id` int(11) unsigned NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `last_selected_room_id` (`last_selected_room_id`),
  CONSTRAINT `user_ibfk_1` FOREIGN KEY (`last_selected_room_id`) REFERENCES `room` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=140 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (128,'8d09c804ae4bad736918b90c66497d952603a960d04cc7acbbb078dd545fe528','','native',1582010786189,'en',85),(139,'ebe525c33c529e71a6f5d7d7b1aea83dc15d7595c0a0d298049b35d5caae95bb','','native',1582025649030,'en',85);
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_room_junction`
--

DROP TABLE IF EXISTS `user_room_junction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_room_junction` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `roomId` int(11) unsigned NOT NULL,
  `userId` int(11) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `roomId` (`roomId`),
  KEY `userId` (`userId`),
  CONSTRAINT `user_room_junction_ibfk_1` FOREIGN KEY (`roomId`) REFERENCES `room` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_room_junction_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=227 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_room_junction`
--

LOCK TABLES `user_room_junction` WRITE;
/*!40000 ALTER TABLE `user_room_junction` DISABLE KEYS */;
INSERT INTO `user_room_junction` VALUES (192,1,128),(225,85,128),(226,85,139);
/*!40000 ALTER TABLE `user_room_junction` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2020-02-17 20:03:52
