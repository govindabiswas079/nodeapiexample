import UserModel from '../Model/UserModel.js';
import bcrypt from 'bcrypt';

export const Authentication = async (req, res, next) => {

  try {
    const token = req.headers.authorization.split(" ")[1];
    const [username, password] = Buffer.from(token, 'base64').toString().split(':')
    await UserModel.findOne({ email: username })
      .then(user => {
        bcrypt.compare(password, user.password)
          .then(passwordCheck => {
            if (!passwordCheck) return res.status(401).send({ error: "Authentication Failed" });
            const auth = { username: user?.email, password: password };
            const b64auth = (req.headers.authorization).split(" ")[1];
            const [Husername, Hpassword] = Buffer.from(b64auth, 'base64').toString().split(':')
            if (Husername && Hpassword && Husername === auth?.username && Hpassword === auth?.password) {
              return next();
            };
            res.status(401).json({ error: "Authentication Failed" });
          })
          .catch(error => {
            return res.status(401).send({ error: "Authentication Failed", })
          })
      })
      .catch(error => {
        return res.status(401).send({ error: "Authentication Failed" });
      });
  } catch (error) {
    res.status(401).json({ error: "Authentication Failed!" })
  }
}


export function localVariables(req, res, next) {
  req.app.locals = {
    OTP: null,
    resetSession: false
  }
  next()
}