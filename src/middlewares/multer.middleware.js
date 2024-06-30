import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get the current file path and directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the directory where files will be stored
const tempDir = path.join(__dirname, '../../public/temp');

// Ensure the directory exists
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
    cb(null, tempDir);
    },
    filename: function (req, file, cb) {
    cb(null, file.originalname);
    }
});

// Create the multer middleware
export const upload = multer({ 
    storage : storage
 });