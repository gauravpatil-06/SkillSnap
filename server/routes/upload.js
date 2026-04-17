import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ensure upload directories exist relative to the root of the server
const UPLOADS_BASE = path.join(__dirname, '..', 'uploads');
const uploadDirs = [
    path.join(UPLOADS_BASE, 'notes'),
    path.join(UPLOADS_BASE, 'avatars'),
    path.join(UPLOADS_BASE, 'materials')
];

uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

const storage = multer.diskStorage({
    destination(req, file, cb) {
        if (file.fieldname === 'avatar') {
            cb(null, path.join(UPLOADS_BASE, 'avatars'));
        } else if (file.fieldname === 'material') {
            cb(null, path.join(UPLOADS_BASE, 'materials'));
        } else {
            cb(null, path.join(UPLOADS_BASE, 'notes'));
        }
    },
    filename(req, file, cb) {
        // Sanitize and append timestamp to avoid collisions
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext).replace(/[^a-z0-9]/gi, '_').toLowerCase();
        cb(null, `${name}-${uniqueSuffix}${ext}`);
    },
});

function checkFileType(file, cb) {
    const filetypes = /pdf|jpg|jpeg|png|webp|doc|docx/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = /pdf|image|msword|officedocument/.test(file.mimetype);

    if (extname || mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('File type not supported!'));
    }
}

const upload = multer({
    storage,
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    },
});

// Removed 'protect' middleware as the app uses local storage for authentication
// and the server doesn't have access to the local user database.
router.post('/', upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'avatar', maxCount: 1 },
    { name: 'material', maxCount: 1 }
]), (req, res) => {
    try {
        if (!req.files || (Object.keys(req.files).length === 0)) {
            return res.status(400).json({ message: 'No files were uploaded.' });
        }

        const getUrl = (fileArray) => {
            if (!fileArray || fileArray.length === 0) return null;
            // Return path relative to the server/uploads directory
            // Multer's path includes the destination, so we need to extract the parts we want
            const fullPath = fileArray[0].path;
            const relativePath = path.relative(path.join(__dirname, '..'), fullPath).replace(/\\/g, '/');
            return `/${relativePath}`;
        };

        const fileUrl = getUrl(req.files.file);
        const avatarUrl = getUrl(req.files.avatar);
        const materialUrl = getUrl(req.files.material);

        res.json({
            message: 'File Uploaded',
            fileUrl: fileUrl || materialUrl,
            avatarUrl,
            materialUrl: materialUrl || fileUrl
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'Upload processing error' });
    }
});

export default router;
