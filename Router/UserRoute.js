import express from 'express';
import multer from 'multer';
import { DeleteProfile } from '../Controller/UserProfileContorller.js';
import { VerifyUser, RegisterUser, LoginUser, GetUsers, GetUser, UpdateUser, DeleteUser, UpdatePassword, ForogotPassword, PasswordForgotOtp, PasswordForgotOtpVerify, CreateStatic, GetStatics, ReportStatic, ReportUpload } from '../Controller/UserController.js';
import { Authentication, localVariables } from '../Middleware/Authentication.js';

const Router = express.Router({ automatic405: false });
const methodNotAllowed = (req, res, next) => res.status(405).send();
var upload = multer({});

Router.post('/user/verify', VerifyUser, (req, res) => res.end()).all(methodNotAllowed);
Router.post('/user/registaer', RegisterUser, (req, res) => res.end()).all(methodNotAllowed);
Router.post('/user/login', VerifyUser, LoginUser, CreateStatic, (req, res) => res.end()).all(methodNotAllowed);
Router.get('/user/users', Authentication, GetUsers, (req, res) => res.end()).all(methodNotAllowed);
Router.get('/user/users/:id', Authentication, GetUser, (req, res) => res.end()).all(methodNotAllowed);
Router.patch('/user/users/:id', Authentication, UpdateUser, (req, res) => res.end()).all(methodNotAllowed);
Router.delete('/user/users/:id', Authentication, DeleteUser, DeleteProfile, (req, res) => res.end()).all(methodNotAllowed);
Router.patch('/user/users/password/:id', Authentication, UpdatePassword, (req, res) => res.end()).all(methodNotAllowed);
Router.get('/user/forgot/password/verify', VerifyUser, localVariables, PasswordForgotOtp, (req, res) => res.end()).all(methodNotAllowed);
Router.patch('/user/forgot/password/verify', VerifyUser, PasswordForgotOtpVerify, (req, res) => res.end()).all(methodNotAllowed);
Router.patch('/user/users/password/forgot/:id', VerifyUser, ForogotPassword, (req, res) => res.end()).all(methodNotAllowed);
Router.get('/user/login/static', Authentication, GetStatics, (req, res) => res.end()).all(methodNotAllowed);
Router.get('/user/login/static/report', Authentication, ReportStatic, (req, res) => res.end()).all(methodNotAllowed);
Router.post('/user/login/static/report', Authentication, upload.single('userreport'), ReportUpload, (req, res) => res.end()).all(methodNotAllowed);

export default Router;