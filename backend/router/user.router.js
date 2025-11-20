import {Router} from 'express';
import { registerUser, verifyUser } from '../controllers/user.controller.js';


const userRouter = Router();

userRouter.post('/register', registerUser)
userRouter.get('/verify/:token', verifyUser);
export default userRouter;