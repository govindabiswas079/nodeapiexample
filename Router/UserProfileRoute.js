import express from 'express';
import multer from 'multer';
import { CreateProfile, GetProfiles, GetProfile, DeleteProfile, UpdaetProfileImage, UpdaetProfileData } from '../Controller/UserProfileContorller.js';
import { Authentication, localVariables } from '../Middleware/Authentication.js';

const Router = express.Router({ automatic405: false });
const methodNotAllowed = (req, res, next) => res.status(405).send();
var upload = multer({});

Router.post('/user/profile', Authentication, upload.single('imagepath'), CreateProfile, (req, res) => res.end()).all(methodNotAllowed);
Router.get('/user/profile', Authentication, GetProfiles, (req, res) => res.end()).all(methodNotAllowed);
Router.get('/user/profile/:id', Authentication, GetProfile, (req, res) => res.end()).all(methodNotAllowed);
Router.delete('/user/profile/:id', Authentication, DeleteProfile, (req, res) => res.end()).all(methodNotAllowed);
Router.patch('/user/profile/image/:id', Authentication, upload.single('imagepath'), UpdaetProfileImage, (req, res) => res.end()).all(methodNotAllowed);
Router.patch('/user/profile/address/:id', Authentication, upload.single('imagepath'), UpdaetProfileData, (req, res) => res.end()).all(methodNotAllowed);

export default Router;