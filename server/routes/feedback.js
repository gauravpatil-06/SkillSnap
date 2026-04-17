import express from 'express';
import Feedback from '../models/Feedback.js';
import User from '../models/User.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Get all feedbacks
router.get('/', async (req, res) => {
    try {
        const feedbacks = await Feedback.find().sort({ createdAt: -1 }).lean();

        // Fetch all unique emails from feedbacks
        const emails = [...new Set(feedbacks.map(f => f.email?.toLowerCase()))].filter(Boolean);

        // Find users matching those emails to get their avatars (case-insensitive)
        const emailRegexes = emails.map(e => new RegExp(`^${e}$`, 'i'));
        const users = await User.find({ email: { $in: emailRegexes } }, 'email avatar').lean();

        // Create a map of email to avatar safely
        const avatarMap = {};
        users.forEach(u => {
            if (u.avatar && u.email) {
                avatarMap[u.email.toLowerCase()] = u.avatar;
            }
        });

        // Map avatars back to feedbacks
        const feedbacksWithAvatars = feedbacks.map(f => ({
            ...f,
            profilePic: f.email ? (avatarMap[f.email.toLowerCase()] || null) : null
        }));

        res.json(feedbacksWithAvatars);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Submit feedback
router.post('/', async (req, res) => {
    const { name, mobile, email, message, rating, role } = req.body;

    try {
        const newFeedback = new Feedback({
            name,
            mobile,
            email,
            message,
            rating,
            role: role || 'User'
        });

        const savedFeedback = await newFeedback.save();

        // Send Email notification
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER || 'gp949958@gmail.com',
                pass: process.env.EMAIL_PASS // User needs to set this in .env
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER || 'gp949958@gmail.com',
            to: 'gp949958@gmail.com',
            subject: `New StudyHub Feedback from ${name}`,
            text: `StudyHub Feedback Details:\n\n` +
                `Name: ${name}\n` +
                `Email: ${email}\n` +
                `Mobile: ${mobile}\n` +
                `Rating: ${rating}/5\n` +
                `Message: ${message}`
        };

        // Attempt to send email but don't block response
        transporter.sendMail(mailOptions).catch(err => console.error('Email send failed:', err));

        res.status(201).json(savedFeedback);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

export default router;
