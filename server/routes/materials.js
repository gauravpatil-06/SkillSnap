import express from 'express';
import Material from '../models/Material.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all materials for a user
router.get('/', protect, async (req, res) => {
    try {
        const materials = await Material.find({
            userId: req.user._id
        }).sort({ createdAt: -1 });
        res.json(materials);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Create a new material
router.post('/', protect, async (req, res) => {
    const { title, description, fileUrl, fileType, fileName } = req.body;

    if (!title || !fileUrl || !fileType) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const material = new Material({
            userId: req.user._id,
            userEmail: req.user.email,
            title,
            description,
            fileUrl,
            fileName: fileName || 'document',
            fileType
        });

        const createdMaterial = await material.save();
        res.status(201).json(createdMaterial);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Update a material
router.put('/:id', protect, async (req, res) => {
    try {
        const material = await Material.findById(req.params.id);

        if (material) {
            if (material.userId.toString() !== req.user._id.toString()) {
                return res.status(401).json({ message: 'Not authorized' });
            }

            material.title = req.body.title || material.title;
            material.description = req.body.description || material.description;
            if (req.body.fileUrl) material.fileUrl = req.body.fileUrl;
            if (req.body.fileType) material.fileType = req.body.fileType;
            if (req.body.fileName) material.fileName = req.body.fileName;

            const updatedMaterial = await material.save();
            res.json(updatedMaterial);
        } else {
            res.status(404).json({ message: 'Material not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Delete a material
router.delete('/:id', protect, async (req, res) => {
    try {
        const material = await Material.findById(req.params.id);

        if (material) {
            if (material.userId.toString() !== req.user._id.toString()) {
                return res.status(401).json({ message: 'Not authorized' });
            }

            await Material.deleteOne({ _id: req.params.id });
            res.json({ message: 'Material removed' });
        } else {
            res.status(404).json({ message: 'Material not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
