import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import sendEmail from '../utils/sendEmail.js';
import cookie from 'cookie-parser';


const registerUser = async (req, res) => {
    try {
        console.log(req.body);
        const { userName, email } = req.body;
        console.log(userName, email);
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const newUser = new User({ userName, email });
        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '10m' });
        const link = `${process.env.BACKEND_URL}/api/v1/user/verify/${token}`;
        sendEmail(email, link);
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


const verifyUser = async (req, res) => {
    try {
        const { token } = req.params;   
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(400).json({ message: 'Invalid token' });
        }
        const jwtToken = jwt.sign({...user}, process.env.JWT_SECRET, {expiresIn:'7d'})
        res.cookie('token', jwtToken)
        res.status(200).json({ message: 'User verified successfully' });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server error' });
    }
};

export { registerUser, verifyUser };