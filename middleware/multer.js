import multer from 'multer';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

// Get the absolute path of the current directory
const filename = fileURLToPath(import.meta.url);
const dirname = dirname(filename);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // cb(null, 'uploads/');
        cb(null, path.join(dirname, '../uploads')); // Use an absolute path for 'uploads/'
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const fileFilter = (req, file, cb) => {
    const allowedFileTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedFileTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true); // Accept the file
    } else {
        cb(new Error('Invalid file type. Only .jpeg, .jpg, or .png files are allowed'));
    }

    // if (file.mimetype.startsWith('image/')) {
    //     cb(null, true);
    // } else {
    //     cb(new Error('Invalid file type, only images are allowed!'), false);
    // }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: process.env.MAX_FILE_SIZE || 1024 * 1024 * 5 }, // Default to 5MB if not set
    });

export default upload;