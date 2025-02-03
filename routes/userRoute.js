import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/userModel.js';
import dotenv from 'dotenv';
import sendVerificationEmail from '../services/emailservice.js';

// Load environment variables
dotenv.config();

const router = express.Router();

// Route for User Sign-up
router.post('/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if all required fields are provided
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Normalize email to lowercase
        const normalizedEmail = email.toLowerCase();

        // Check if the username or email is already registered
        const existingUser = await User.findOne({
            $or: [{ username }, { email: normalizedEmail }],
        });

        if (existingUser) {
            return res.status(400).json({ message: 'Username or email already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user with `is_verified` defaulting to false
        const newUser = new User({
            username,
            email: normalizedEmail,
            password: hashedPassword,
            is_verified: false, // Ensure this field is set
        });

        await newUser.save();

        if (newUser) {
            // Generate email verification token
            const verificationToken = jwt.sign(
                { id: newUser._id },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            console.log('New User ID:', newUser._id); // Debugging
            console.log('Generated Token:', verificationToken); // Debugging

            // Send verification email
            await sendVerificationEmail(newUser.email, verificationToken);

            return res.status(201).json({
                message: 'User registered. Please verify your email to activate your account.',
            });
        }

        return res.status(400).json({ message: 'User registration failed' });

    } catch (error) {
        console.error('Signup error:', error.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

// Route for Email Verification
router.get('/verify-email', async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({ message: 'Invalid or missing token.' });
        }

        console.log('Received Token:', token); // Debugging

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find user by ID
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        if (user.is_verified) {
            return res.status(400).json({ message: 'Email is already verified.' });
        }

        // Update the user's verification status
        user.is_verified = true;
        await user.save();

        return res.status(200).json({ message: 'Email successfully verified. You can now log in.' });

    } catch (error) {
        console.error('Verification error:', error.message);
        return res.status(400).json({ message: 'Invalid or expired token.' });
    }
});

// Route for User Login
router.post('/login', async (req, res) => {
    try {
        const { identifier, password } = req.body;

        // Check if all required fields are provided
        if (!identifier || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Find the user by username or email
        const user = await User.findOne({
            $or: [{ username: identifier }, { email: identifier.toLowerCase() }],
        }).select('+password'); // Include password for validation

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the user is verified
        if (!user.is_verified) {
            return res.status(403).json({ message: 'Please verify your email before logging in.' });
        }

        // Check if the password is correct
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, isLogged: true },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Remove password before sending response
        user.password = undefined;

        return res.status(200).json({
            token,
            user, // Sending user details without password
        });

    } catch (error) {
        console.error('Login error:', error.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
