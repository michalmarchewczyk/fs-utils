import type express from 'express';
import AuthController from './auth-controller';

const authController = AuthController.getInstance();

const authMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const hasPassword = await authController.checkPasswordSet();
  if (!hasPassword) {
    res.redirect('/auth/set-password');
    return;
  }
  if (!req.session.loggedIn) {
    res.redirect('/auth/login');
    return;
  }
  next();
};

export default authMiddleware;
