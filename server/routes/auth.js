import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import User from '../models/User.js';
import Admin from '../models/Admin.js';
import StudyLog from '../models/StudyLog.js';
import Activity from '../models/Activity.js';
import { protect } from '../middleware/auth.js';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const router = express.Router();

// Generate Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// NodeMailer Setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// @desc    Register a new user
// @route   POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, college, email, password } = req.body;

        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            college,
            email,
            password,
        });

        if (user) {
            res.status(201).json({
                ...user._doc,
                token: generateToken(user._id),
                isNewUser: true
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Auth user / Login
// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        let user = await User.findOne({ email });
        let isAdminLogin = false;

        if (!user) {
            user = await Admin.findOne({ email });
            if (user) {
                isAdminLogin = true;
                user.role = 'admin'; // Temporary assign for response
                user.name = 'System Admin'; // Admins don't have name in collection
            }
        }

        if (!user) {
            return res.status(401).json({ message: 'Invalid Email' });
        }

        if (await user.matchPassword(password)) {
            res.json({
                ...user._doc,
                token: generateToken(user._id),
                role: user.role || user._doc.role || 'user',
                name: user.name || user._doc.name || 'User'
            });
        } else {
            res.status(401).json({ message: 'Invalid Password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Google Auth
// @route   POST /api/auth/google
router.post('/google', async (req, res) => {
    try {
        const { credential, userProfile } = req.body;
        let email, name, picture;

        if (credential) {
            console.log('Verifying Google Credential...');
            const ticket = await client.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            email = payload.email;
            name = payload.name;
            picture = payload.picture;
            console.log('Google Payload (via Credential):', payload);
        } else if (userProfile) {
            console.log('Using User Profile from Google Access Token...');
            email = userProfile.email;
            name = userProfile.name;
            picture = userProfile.picture;
            console.log('Google Profile (via Access Token):', userProfile);
        } else {
            return res.status(400).json({ message: 'No authentication data provided' });
        }

        if (!email) {
            return res.status(400).json({ message: 'Invalid Google account' });
        }

        // Optimize image quality if possible
        const avatarUrl = picture ? picture.replace('=s96-c', '=s400-c') : '';
        console.log('Google Avatar URL:', avatarUrl);

        let user = await User.findOne({ email });

        let isNewUser = false;
        if (!user) {
            user = await User.create({
                name,
                email,
                avatar: avatarUrl,
                provider: 'google',
            });
            isNewUser = true;
        } else {
            // Update avatar if missing or if it's a Google user to keep it fresh
            if (avatarUrl && (!user.avatar || user.provider === 'google')) {
                user.avatar = avatarUrl;
                await user.save();
            }
        }

        const token = generateToken(user._id);

        res.json({
            ...user._doc,
            avatar: user.avatar, // Ensure the latest avatar is sent
            token,
            isNewUser,
            role: user.role || 'user',
            name: user.name || 'User'
        });
    } catch (error) {
        console.error('Google Auth Error:', error);
        res.status(500).json({ message: 'Google authentication failed' });
    }
});

// @desc    Send OTP for password reset
// @route   POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        user.resetPasswordOtp = otp;
        user.resetPasswordExpire = Date.now() + 5 * 60 * 1000; // 5 minutes
        await user.save();

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'StudyHub Password Reset OTP',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center;">
                    <h2 style="color: #47C4B7;">StudyHub Password Reset</h2>
                    <p>You requested a password reset. Your One Time Password (OTP) is:</p>
                    <h1 style="font-size: 40px; color: #333; letter-spacing: 5px; padding: 10px; background: #f4f4f4; border-radius: 10px;">${otp}</h1>
                    <p>This code will expire in 5 minutes.</p>
                    <p>If you did not request this, please ignore this email.</p>
                </div>
            `,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                // Clear OTP on failure
                user.resetPasswordOtp = undefined;
                user.resetPasswordExpire = undefined;
                user.save();
                return res.status(500).json({ message: 'Error sending email' });
            } else {
                return res.json({ message: 'OTP sent to email successfully' });
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Verify if email exists (for simple forgot password flow)
// @route   POST /api/auth/verify-email
router.post('/verify-email', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'Email not found in our records' });
        }

        res.json({ message: 'Email verified successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Directly update password (for simple forgot password flow)
// @route   POST /api/auth/update-password-direct
router.post('/update-password-direct', async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // We use .password assignment because the pre-save hook will hash it
        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({
            email,
            resetPasswordOtp: otp,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        res.json({ message: 'OTP verified successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Reset password using verified OTP
// @route   POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        const user = await User.findOne({
            email,
            resetPasswordOtp: otp,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired OTP session' });
        }

        user.password = newPassword;
        user.resetPasswordOtp = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.json({ message: 'Password reset completely successful' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// @desc    Update user profile & avatar
// @route   PUT /api/auth/profile
router.put('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = req.body.name || user.name;
            user.college = req.body.college || user.college;

            if (req.body.avatar !== undefined) user.avatar = req.body.avatar;
            if (req.body.coverImage !== undefined) user.coverImage = req.body.coverImage;
            if (req.body.bio !== undefined) user.bio = req.body.bio;
            if (req.body.headline !== undefined) user.headline = req.body.headline;
            if (req.body.about !== undefined) user.about = req.body.about;
            if (req.body.pronouns !== undefined) user.pronouns = req.body.pronouns;
            if (req.body.education !== undefined) user.education = req.body.education;
            if (req.body.country !== undefined) user.country = req.body.country;
            if (req.body.city !== undefined) user.city = req.body.city;
            if (req.body.phone !== undefined) user.phone = req.body.phone;
            if (req.body.phoneType !== undefined) user.phoneType = req.body.phoneType;
            if (req.body.address !== undefined) user.address = req.body.address;
            if (req.body.birthdayMonth !== undefined) user.birthdayMonth = req.body.birthdayMonth;
            if (req.body.birthdayDay !== undefined) user.birthdayDay = req.body.birthdayDay;
            if (req.body.website !== undefined) user.website = req.body.website;
            if (req.body.websiteType !== undefined) user.websiteType = req.body.websiteType;
            if (req.body.profileUrl !== undefined) user.profileUrl = req.body.profileUrl;
            if (req.body.pinnedSkills !== undefined) user.pinnedSkills = req.body.pinnedSkills;

            if (req.body.skills !== undefined) {
                // handle either array or comma-separated string
                if (Array.isArray(req.body.skills)) {
                    user.skills = req.body.skills;
                } else if (typeof req.body.skills === 'string') {
                    user.skills = req.body.skills.split(',').map(s => s.trim()).filter(s => s);
                }
            }

            if (req.body.password) {
                user.password = req.body.password;
            }

            const updatedUser = await user.save();

            res.json({
                ...updatedUser._doc,
                token: generateToken(updatedUser._id),
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (user) {
            // STRICT STREAK RESET LOGIC
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (user.lastActiveDate) {
                const lastActive = new Date(user.lastActiveDate);
                lastActive.setHours(0, 0, 0, 0);

                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);

                // If last activity was before yesterday, streak is broken
                if (lastActive.getTime() < yesterday.getTime()) {
                    user.streak = 0;
                    await user.save();
                }
            } else if (user.streak > 0) {
                // No activity recorded yet but streak has value (shouldn't happen with new logic but for safety)
                user.streak = 0;
                await user.save();
            }

            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Add study hours
// @route   PUT /api/auth/study-hours
router.put('/study-hours', protect, async (req, res) => {
    try {
        const { hours, method, type = 'Study' } = req.body;
        const user = await User.findById(req.user._id);
        const hoursNum = parseFloat(hours);

        if (user) {
            // Update cumulative hours on User model based on type
            if (type === 'Coding') {
                user.codingHours = parseFloat(((user.codingHours || 0) + hoursNum).toFixed(2));
            } else if (type === 'Watching') {
                user.watchingHours = parseFloat(((user.watchingHours || 0) + hoursNum).toFixed(2));
            } else {
                user.studyHours = parseFloat(((user.studyHours || 0) + hoursNum).toFixed(2));
            }

            // Streak Maintenance for Study Sessions
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;
            if (lastActive) lastActive.setHours(0, 0, 0, 0);

            // If this is the first activity of the day
            if (!lastActive || lastActive.getTime() < today.getTime()) {
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);

                if (lastActive && lastActive.getTime() === yesterday.getTime()) {
                    user.streak = (user.streak || 0) + 1;
                } else {
                    user.streak = 1;
                }

                if (user.streak > (user.highestStreak || 0)) {
                    user.highestStreak = user.streak;
                }
                user.lastActiveDate = new Date();
            }

            await user.save();

            // Record in StudyLog (daily history)
            let log = await StudyLog.findOne({ userId: user._id, date: today });
            const logUpdate = {};
            if (type === 'Coding') logUpdate.codingHours = hours;
            else if (type === 'Watching') logUpdate.watchingHours = hours;
            else logUpdate.studyHours = hours;

            if (log) {
                if (type === 'Coding') log.codingHours = parseFloat(((log.codingHours || 0) + hours).toFixed(2));
                else if (type === 'Watching') log.watchingHours = parseFloat(((log.watchingHours || 0) + hours).toFixed(2));
                else log.studyHours = parseFloat(((log.studyHours || 0) + hours).toFixed(2));
                await log.save();
            } else {
                log = await StudyLog.create({
                    userId: user._id,
                    ...logUpdate,
                    date: today
                });
            }

            // Sync with Activity collection for unified Analytics/History
            const totalMinutes = Math.round(hours * 60);
            if (totalMinutes > 0) {
                await Activity.create({
                    userId: user._id,
                    date: today,
                    minutes: totalMinutes,
                    type: type || 'Study',
                    topic: 'Timer Session',
                    method: method || 'Countdown'
                });
            }

            res.json({
                studyHours: user.studyHours,
                codingHours: user.codingHours,
                watchingHours: user.watchingHours,
                streak: user.streak,
                highestStreak: user.highestStreak,
                dailyLog: log
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all study logs for history page
// @route   GET /api/auth/study-logs
router.get('/study-logs', protect, async (req, res) => {
    try {
        const logs = await StudyLog.find({ userId: req.user._id }).sort({ date: -1 });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
