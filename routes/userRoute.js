import express, { request, response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/userModel.js';
import dotenv from 'dotenv';
import sendVerificationEmail from '../services/emailservice.js';

// Initialize dotenv to load environment variables
dotenv.config();

const router = express.Router();

// Route for User Sign up
router.post('/signup', async (request, response) => {
    try {
        const { username, email, password } = request.body;

        // Check if all required fields are provided
        if (!username || !email || !password) {
            return response.status(400).json({ message: 'All fields are required' });
        }

        // Normalize email to lowercase
        const normalizedEmail = email.toLowerCase();

        // Check if the username or email is already registered
        const existingUser = await User.findOne({
            $or: [{ username }, { email: normalizedEmail }],
        });
        if (existingUser) {
            return response.status(400).json({ message: 'Username or email already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const newUser = await User.create({
            username,
            email: normalizedEmail,
            password: hashedPassword,
        });

        // Remove password before returning the response
        //  const userResponse = {
        //     _id: newUser._id,
        //     username: newUser.username,
        //     email: newUser.email,
        // };

        // return response.status(201).json(userResponse);

        if (newUser) {
            const verificationToken = jwt.sign(
                { id: newUser._id },
                process.env.JWT_SECRET,
                { expiresIn: "1h" }
            );

            await sendVerificationEmail(newUser.email, verificationToken);

            response.status(201).json({
                message:
                    "User registered. Please verify your email to activate your account.",
            });
        } else {
            return response.status(400).json({
                message: "Invalid user data",
            });
        }
    } catch (error) {
        console.log('Signup error:', error.message);
        response.status(500).json({ message: 'Internal server error' });
    }
});

// Route for confirmation email
router.get('/verify-email', async (request, response) => {
    try {
        const { token } = request.query;

        if (!token) {
            return response.status(400).json({
                message: "Invalid or missing token.",
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);
        if (!user) {
            return response.status(400).json({
                message: "User not found.",
            });
        }

        if (user.isVerified) {
            return response.status(400).json({
                message: "Email is already verified.",
            });
        }

        user.is_verified = true;
        await user.save();

        response.status(200).json({
            message: "Email successfully verified. You can now log in.",
        });
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: "Internal server error" });
    }
});
//   const generateToken = (id) => {
//     return jwt.sign({ id }, process.env.SECRET_KEY, {
//       expiresIn: "500s",
//     });
//   };

// Route for User Login
router.post('/login', async (request, response) => {
    try {

        const { identifier, password } = request.body;

        // Check if all required fields are provided
        if (!identifier || !password) {
            return response.status(400).json({ message: 'All fields are required' });
        }

        // Find the user by username or email
        const user = await User.findOne({
            $or: [{ username: identifier }, { email: identifier.toLowerCase() }],
        });
        if (!user) {
            return response.status(404).json({ message: 'User not found' });
        }

         // Check if the user is verified
         if (!user.is_verified) {
            return response.status(403).json({ message: 'Please verify your email before logging in.' });
        }


        // Check if the password is correct
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return response.status(401).json({ message: 'Invalid password' });
        }

        // Genereate JWT token with userId included
        const token = jwt.sign(
            { userId: user._id, isLogged: true },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        return response.status(200).json({
            token,
            username: user.username,
            email: user.email,
        });
    } catch (error) {
        console.log('Login error:', error.message);
        response.status(500).json({ message: 'Internal server error' });
    }
});


export default router;