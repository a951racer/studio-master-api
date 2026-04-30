import { Router } from 'express';
import { body } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { validate } from '../middleware/validate';
import User from '../models/User';
import config from '../config';

const authRouter = Router();

authRouter.post(
  '/login',
  validate([
    body('username').notEmpty().withMessage('username is required'),
    body('password').notEmpty().withMessage('password is required'),
  ]),
  async (req, res, next) => {
    try {
      const { username, password } = req.body;

      const user = await User.findOne({ username });
      if (!user) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      const signOptions: SignOptions = {
        expiresIn: config.jwtExpiresIn as SignOptions['expiresIn'],
      };

      const token = jwt.sign(
        { id: user._id, username: user.username, isAdmin: user.isAdmin },
        config.jwtSecret,
        signOptions,
      );

      res.status(200).json({ token });
    } catch (err) {
      next(err);
    }
  },
);

authRouter.post(
  '/register',
  validate([
    body('username')
      .trim()
      .notEmpty()
      .withMessage('username is required')
      .isLength({ min: 3 })
      .withMessage('username must be at least 3 characters'),
    body('password')
      .notEmpty()
      .withMessage('password is required')
      .isLength({ min: 8 })
      .withMessage('password must be at least 8 characters'),
  ]),
  async (req, res, next) => {
    try {
      const { username, password } = req.body;

      const existing = await User.findOne({ username: username.trim() });
      if (existing) {
        res.status(409).json({ error: 'Username already taken' });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const user = await User.create({
        username: username.trim(),
        passwordHash,
        isAdmin: false,
      });

      const signOptions: SignOptions = {
        expiresIn: config.jwtExpiresIn as SignOptions['expiresIn'],
      };

      const token = jwt.sign(
        { id: user._id, username: user.username, isAdmin: user.isAdmin },
        config.jwtSecret,
        signOptions,
      );

      res.status(201).json({ token });
    } catch (err) {
      next(err);
    }
  },
);

export default authRouter;
