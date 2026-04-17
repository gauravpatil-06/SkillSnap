import express from 'express';
import Note from '../models/Note.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get private notes for a user
// @route   GET /api/notes/private/:userId
// @access  Private
router.get('/private/:userId', protect, async (req, res) => {
    try {
        if (req.user._id.toString() !== req.params.userId) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        const notes = await Note.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json(notes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all shared notes
// @route   GET /api/notes/shared
// @access  Private
router.get('/shared', protect, async (req, res) => {
    try {
        const notes = await Note.find({ isShared: true }).populate('userId', 'name college avatar').sort({ createdAt: -1 });
        res.json(notes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create a new note
// @route   POST /api/notes
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { title, description, fileUrl, isShared } = req.body;

        const note = new Note({
            userId: req.user._id,
            title,
            description,
            fileUrl,
            isShared: isShared || false
        });

        const createdNote = await note.save();
        res.status(201).json(createdNote);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update a note (especially toggle sharing)
// @route   PUT /api/notes/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);

        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }

        if (note.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'User not authorized to update this note' });
        }

        note.title = req.body.title || note.title;
        note.description = req.body.description !== undefined ? req.body.description : note.description;
        note.isShared = req.body.isShared !== undefined ? req.body.isShared : note.isShared;
        note.fileUrl = req.body.fileUrl || note.fileUrl;

        const updatedNote = await note.save();
        res.json(updatedNote);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete a note
// @route   DELETE /api/notes/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);

        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }

        if (note.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'User not authorized to delete this note' });
        }

        await note.deleteOne();
        res.json({ message: 'Note removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
