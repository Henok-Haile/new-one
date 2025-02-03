import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import booksRoute from './routes/booksRoute.js';
import userRoute from './routes/userRoute.js';

// Load environment variables
dotenv.config();

const app = express();

// Get environment variables from .env
const PORT = process.env.PORT || 3000;
const mongoDBURL = process.env.MONGO_URI;

// Middleware for parsing request body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files in the uploads directory
app.use("/uploads", express.static("uploads"));


const allowedOrigins = [
    'http://localhost:5000',
    'http://localhost:5173',
    'http://localhost:5555',
    'http://localhost:3000', // Local development
    'http://127.0.0.1:3000', // Alternate localhost
    'https://fullstack-web-developmnet-na-amal-duh6.vercel.app', // Deployed frontend
];

// app.use(cors())

app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin) return callback(null, true); // Allow requests with no `Origin`
            if (allowedOrigins.includes(origin)) {
                callback(null, true); // Allow the origin
            } else {
                callback(new Error('Not allowed by CORS')); // Reject the origin
            }
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type'],
        credentials: true,
    })
);

// Routes
app.get('/', (req, res) => {
    console.log(req)
    return res.status(200).send('Welcome To MERN Stack Tutorial');
});

app.use('/books', booksRoute);
app.use('/user', userRoute);

// Connect to MongoDB
mongoose
    .connect(mongoDBURL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('App connected to database');
        app.listen(PORT, () => {
            console.log(`App is listening on port: ${PORT}`);
        });
    })
    .catch(error => console.log(error));
