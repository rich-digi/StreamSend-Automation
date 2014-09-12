# ************************************************************
# Database: dmnews_reports
# ************************************************************

# Table Clickers
# ------------------------------------------------------------

DROP TABLE IF EXISTS `Clickers`;

CREATE TABLE `Clickers` (
  `CID` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `LinkID` int(11) DEFAULT NULL,
  `EmailID` int(11) DEFAULT NULL,
  `Email` varchar(255) DEFAULT NULL,
  `PrimaryDMID` varchar(128) DEFAULT NULL,
  `Time` datetime DEFAULT NULL,
  `IPAddress` varchar(15) DEFAULT NULL,
  `UserAgent` varchar(128) DEFAULT NULL,
  PRIMARY KEY (`CID`),
  KEY `Email` (`Email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Table Emails
# ------------------------------------------------------------

DROP TABLE IF EXISTS `Emails`;

CREATE TABLE `Emails` (
  `EmailID` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `Email` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`EmailID`),
  UNIQUE KEY `Email` (`Email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Table Links
# ------------------------------------------------------------

DROP TABLE IF EXISTS `Links`;

CREATE TABLE `Links` (
  `LinkID` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `URL` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`LinkID`),
  UNIQUE KEY `URL` (`URL`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Table PDMIDLink
# ------------------------------------------------------------

DROP TABLE IF EXISTS `PDMIDLink`;

CREATE TABLE `PDMIDLink` (
  `MDID` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `Email` varchar(255) DEFAULT NULL,
  `PrimaryDMID` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`MDID`),
  KEY `Email` (`Email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Table Viewers
# ------------------------------------------------------------

DROP TABLE IF EXISTS `Viewers`;

CREATE TABLE `Viewers` (
  `VID` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `EmailID` int(11) DEFAULT NULL,
  `Email` varchar(255) DEFAULT NULL,
  `PrimaryDMID` varchar(128) DEFAULT NULL,
  `Time` datetime DEFAULT NULL,
  `IPAddress` varchar(15) DEFAULT NULL,
  `UserAgent` varchar(128) DEFAULT NULL,
  PRIMARY KEY (`VID`),
  KEY `Email` (`Email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
