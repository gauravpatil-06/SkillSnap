import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const uploadDirs = ['uploads/notes', 'uploads/avatars', 'uploads/materials'];
uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

const storage = multer.diskStorage({
    destination(req, file, cb) {
        if (file.fieldname === 'avatar') {
            cb(null, 'uploads/avatars/');
        } else if (file.fieldname === 'material') {
            cb(null, 'uploads/materials/');
        } else {
            // Default to materials for study resources if 'file' is used but it's not a note
            // But we'll keep 'uploads/notes' for task-related PDFs to maintain consistency
            cb(null, 'uploads/notes/');
        }
    },
    filename(req, file, cb) {
        cb(null, file.originalname);
    },
});

function checkFileType(file, cb) {
    // Robust type checking
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

router.post('/', protect, upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'avatar', maxCount: 1 },
    { name: 'material', maxCount: 1 }
]), (req, res) => {
    try {
        const fileUrl = req.files.file ? `/${req.files.file[0].path.replace(/\\/g, '/')}` : null;
        const avatarUrl = req.files.avatar ? `/${req.files.avatar[0].path.replace(/\\/g, '/')}` : null;
        const materialUrl = req.files.material ? `/${req.files.material[0].path.replace(/\\/g, '/')}` : null;

        res.json({
            message: 'File Uploaded',
            fileUrl: fileUrl || materialUrl, // Fallback to either
            avatarUrl,
            materialUrl: materialUrl || fileUrl // Fallback to either
        });
    } catch (error) {
        res.status(500).json({ message: 'Upload processing error' });
    }
});

export default router;
