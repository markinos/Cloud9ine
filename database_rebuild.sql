-- MySQL Workbench Forward Engineering


SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL,ALLOW_INVALID_DATES';


-- -----------------------------------------------------
-- Schema heroku_50a8c0371a0e6f5
-- -----------------------------------------------------


-- -----------------------------------------------------
-- Schema heroku_50a8c0371a0e6f5
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `heroku_50a8c0371a0e6f5` DEFAULT CHARACTER SET utf8 ;
USE `heroku_50a8c0371a0e6f5` ;


-- -----------------------------------------------------
-- Table `heroku_50a8c0371a0e6f5`.`Faculty`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `heroku_50a8c0371a0e6f5`.`Faculty`;
CREATE TABLE IF NOT EXISTS `heroku_50a8c0371a0e6f5`.`Faculty` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) NULL,
  `password` VARCHAR(255) NULL,
  `status` ENUM('Admin', 'Staff') NULL,
  `permissionAccess` TINYINT(1) NULL,
  `permissionUpdate` TINYINT(1) NULL,
  `permissionReport` TINYINT(1) NULL,
  `firstName` VARCHAR(255) NULL,
  `lastName` VARCHAR(255) NULL,
  PRIMARY KEY (`id`));
-- ENGINE = InnoDB




-----------------------------------------------------
-- Table `heroku_50a8c0371a0e6f5`.`Graduate`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `heroku_50a8c0371a0e6f5`.`Graduate`;
CREATE TABLE IF NOT EXISTS `heroku_50a8c0371a0e6f5`.`Graduate` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `status` ENUM('current', 'outdated', 'incomplete') NULL,
  `updatedAt` DATE NULL,
  `canContact` TINYINT(1) NULL,
  `contactStatus` ENUM('updated', 'incorrect', 'unknown') NULL,
  `canTrack` TINYINT(1) NULL,
  `surveyFreq` INT NULL,
  `firstName` VARCHAR(255) NULL,
  `lastName` VARCHAR(255) NULL,
  `UWemail` VARCHAR(255) NULL,
  `email` VARCHAR(255) NULL,
  `gpa` DOUBLE NULL,
  `appDate` DATE NULL,
  `program` ENUM('CSS', 'CES', 'EE', 'IT') NULL,
  `degree` ENUM('BA', 'BS', 'MS') NULL,
  `gradTerm` ENUM('AUT', 'WIN', 'SPR', 'SUM') NULL,
  `gradYear` YEAR NULL,
  `gender` ENUM('Female', 'Male', 'Other') NULL,
  `ethnicity` ENUM('Asian', 'African/Black', 'Caucasian/White', 'Native/Indigenous', 'Hispanic/Latino/a', 'Mixed', 'Pacific Islander', 'Other') NULL,
  `age` ENUM('<18', '18-23', '24-29', '30-39', '40-49', '50-59', '60+') NULL,
  `generation` ENUM('1st', '2nd', 'Parent(s) Alumni') NULL,
  `studentId` INT NULL,
  PRIMARY KEY (`id`));
-- ENGINE = InnoDB;




-- -----------------------------------------------------
-- Table `heroku_50a8c0371a0e6f5`.`Job`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `heroku_50a8c0371a0e6f5`.`Job`;
CREATE TABLE IF NOT EXISTS `heroku_50a8c0371a0e6f5`.`Job` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `jobCode` INT NULL,
  `employmentType` ENUM('Intern', 'Part Time', 'Full Time', 'Residency') NULL,
  `employerName` VARCHAR(255) NULL,
  `employerType` VARCHAR(255) NULL,
  `employerDesc` VARCHAR(255) NULL,
  `jobProgram` ENUM('CSS', 'CES', 'EE', 'IT', 'tech other', 'non tech') NULL,
  `jobTitle` VARCHAR(255) NULL,
  `salary` INT NULL,
  `startDate` DATE NULL,
  `endDate` DATE NULL,
  PRIMARY KEY (`id`));
-- ENGINE = InnoDB;




-- -----------------------------------------------------
-- Table `heroku_50a8c0371a0e6f5`.`Graduate_Has_Job`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `heroku_50a8c0371a0e6f5`.`Graduate_Has_Job`;
CREATE TABLE IF NOT EXISTS `heroku_50a8c0371a0e6f5`.`Graduate_Has_Job` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `employmentId` INT NOT NULL,
  `graduateId` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_Employment_has_Graduate_Graduate1_idx` (`graduateId` ASC),
  INDEX `fk_Employment_has_Graduate_Employment_idx` (`employmentId` ASC),
  CONSTRAINT `fk_Employment_has_Graduate_Employment`
    FOREIGN KEY (`employmentId`)
    REFERENCES `heroku_50a8c0371a0e6f5`.`Job` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Employment_has_Graduate_Graduate1`
    FOREIGN KEY (`graduateId`)
    REFERENCES `heroku_50a8c0371a0e6f5`.`Graduate` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION);
-- ENGINE = InnoDB;




-- -----------------------------------------------------
-- Table `heroku_50a8c0371a0e6f5`.`Survey`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `heroku_50a8c0371a0e6f5`.`Survey`;
CREATE TABLE IF NOT EXISTS `heroku_50a8c0371a0e6f5`.`Survey` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `graduateId` INT NOT NULL,
  `status` ENUM('sent', 'not sent', 'rejected', 'recieved', 'confirmed', 'complete') NULL,
  `gradConfirmation` TINYINT(1) NULL COMMENT '	',
  `comments` VARCHAR(255) NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_Surveys_Graduate1_idx` (`graduateId` ASC),
  CONSTRAINT `fk_Surveys_Graduate1`
    FOREIGN KEY (`graduateId`)
    REFERENCES `heroku_50a8c0371a0e6f5`.`Graduate` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION);
-- ENGINE = InnoDB;








-- -----------------------------------------------------
-- Table `heroku_50a8c0371a0e6f5`.`Transfer`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `heroku_50a8c0371a0e6f5`.`Transfer`;
CREATE TABLE IF NOT EXISTS `heroku_50a8c0371a0e6f5`.`Transfer` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `college` VARCHAR(255) NOT NULL,
  `gpa` DOUBLE NULL,
  `graduateId` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_Transfer_Graduate1_idx` (`graduateId` ASC),
  CONSTRAINT `fk_Transfer_Graduate1`
    FOREIGN KEY (`graduateId`)
    REFERENCES `heroku_50a8c0371a0e6f5`.`Graduate` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION);
-- ENGINE = InnoDB;




-- -----------------------------------------------------
-- Table `heroku_50a8c0371a0e6f5`.`Skill`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `heroku_50a8c0371a0e6f5`.`Skill`;
CREATE TABLE IF NOT EXISTS `heroku_50a8c0371a0e6f5`.`Skill` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `skill` VARCHAR(255) NULL,
  PRIMARY KEY (`id`));




-- -----------------------------------------------------
-- Table `heroku_50a8c0371a0e6f5`.`Skill_has_Job`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `heroku_50a8c0371a0e6f5`.`Skill_Has_Job`;
CREATE TABLE IF NOT EXISTS `heroku_50a8c0371a0e6f5`.`Skill_Has_Job` (
  `id` INT NOT NULL,
  `skillId` INT NOT NULL,
  `jobId` INT NOT NULL,
  INDEX `fk_Skill_has_Job_Job1_idx` (`jobId` ASC),
  INDEX `fk_Skill_has_Job_Skill1_idx` (`skillId` ASC),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_Skill_has_Job_Skill1`
    FOREIGN KEY (`skillId`)
    REFERENCES `heroku_50a8c0371a0e6f5`.`Skill` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Skill_has_Job_Job1`
    FOREIGN KEY (`jobId`)
    REFERENCES `heroku_50a8c0371a0e6f5`.`Job` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION);






SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;






