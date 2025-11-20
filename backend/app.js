import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import dbConnect from './utils/dbConnect.js';
import userRouter from './router/user.router.js';

const app = express();
dotenv.config();

const PORT = process.env.PORT || 5000;
dbConnect();
app.use(cors());
app.use(express.json());

app.use('/api/v1/user',userRouter)

app.get('/', (req, res)=>{
    res.send('Hello, Lazy Customer!');
})

app.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`);
})