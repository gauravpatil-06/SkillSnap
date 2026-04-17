import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    college: {
        type: String,
        required: false,
        default: '',
    },
    password: {
        type: String,
        required: false,
    },
    provider: {
        type: String,
        enum: ['email', 'google'],
        default: 'email',
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    avatar: {
        type: String,
        default: '',
    },
    coverImage: {
        type: String,
        default: '',
    },
    bio: {
        type: String,
        default: '',
    },
    about: {
        type: String,
        default: '',
    },
    skills: {
        type: [String],
        default: [],
    },
    resetPasswordOtp: {
        type: String,
    },
    resetPasswordExpire: {
        type: Date,
    },
    dailyGoal: {
        type: Number,
        default: 5,
    },
    streak: {
        type: Number,
        default: 0,
    },
    highestStreak: {
        type: Number,
        default: 0,
    },
    studyHours: {
        type: Number,
        default: 0,
    },
    codingHours: {
        type: Number,
        default: 0,
    },
    watchingHours: {
        type: Number,
        default: 0,
    },
    lastActiveDate: {
        type: Date,
        default: null,
    },
    pronouns: {
        type: String,
        default: '',
    },
    headline: {
        type: String,
        default: '',
    },
    education: {
        type: String,
        default: '',
    },
    country: {
        type: String,
        default: 'India',
    },
    city: {
        type: String,
        default: 'Pune District, Maharashtra',
    },
    phone: {
        type: String,
        default: '',
    },
    phoneType: {
        type: String,
        default: 'Mobile',
    },
    address: {
        type: String,
        default: '',
    },
    birthdayMonth: {
        type: String,
        default: '',
    },
    birthdayDay: {
        type: String,
        default: '',
    },
    website: {
        type: String,
        default: '',
    },
    websiteType: {
        type: String,
        default: 'Personal',
    },
    profileUrl: {
        type: String,
        default: '',
    },
    pinnedSkills: {
        type: [String],
        default: [],
    }
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare passwords
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', UserSchema);
