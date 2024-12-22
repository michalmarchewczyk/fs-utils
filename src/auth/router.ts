import express from 'express';
import AuthController from './auth-controller';

// eslint-disable-next-line new-cap
const router = express.Router();

const authController = AuthController.getInstance();

router.get('/login', async (req, res) => {
  const hasPassword = await authController.checkPasswordSet();
  if (!hasPassword) {
    res.redirect(req.baseUrl + '/set-password');
    return;
  }
  res.render('login');
});

router.get('/set-password', async (req, res) => {
  res.render('set-password');
});

router.all('/logout', async (req, res) => {
  req.session.loggedIn = false;
  res.redirect(req.baseUrl + '/login?msg=You have been logged out');
});

router.post('/login', async (req, res) => {
  const { password } = req.body as { password: string };
  if (!password) {
    res.json({ error: { password: 'Password is required' } }).status(400);
    return;
  }
  const goodPassword = await authController.checkPassword(password);
  if (!goodPassword) {
    res.json({ error: { password: 'Invalid password' } }).status(401);
    return;
  }
  req.session.loggedIn = true;
  res.redirect('/');
});

router.post('/set-password', async (req, res) => {
  const { password } = req.body as { password: string };
  if (!password) {
    res.json({ error: { password: 'Password is required' } }).status(400);
    return;
  }
  await authController.setPassword(password);
  res.redirect(req.baseUrl + '/login?msg=You can now log in');
});

export default router;
