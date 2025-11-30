import { Router } from 'express';
import {
  signup,
  login,
  refreshToken,
  logout,
  logoutAll,
  getMe,
  updateProfile,
  changePassword
} from '../controllers/auth.controller';
import { googleSignIn, unlinkGoogle } from '../controllers/google-auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import {
  signupValidator,
  loginValidator,
  changePasswordValidator
} from '../validators/auth.validator';
import { validate } from '../validators/validate';

const router = Router();

// Public routes
router.post('/signup', signupValidator, validate, signup);
router.post('/login', loginValidator, validate, login);
router.post('/refresh-token', refreshToken);
router.post('/google', googleSignIn);

// Protected routes
router.post('/logout', authenticate, logout);
router.post('/logout-all', authenticate, logoutAll);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePasswordValidator, validate, changePassword);
router.delete('/google/unlink', authenticate, unlinkGoogle);

export default router;

