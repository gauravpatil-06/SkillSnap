import mongoose from 'mongoose';

const studyLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    studyHours: {
        type: Number,
        default: 0
    },
    codingHours: {
        type: Number,
        default: 0
    },
    watchingHours: {
        type: Number,
        default: 0
    },
    date: {
        type: Date,
        required: true,
        default: () => {
            const d = new Date();
            d.setHours(0, 0, 0, 0);
            return d;
        }
    }
}, { timestamps: true });

// Ensure one log per user per day
studyLogSchema.index({ userId: 1, date: 1 }, { unique: true });

const StudyLog = mongoose.model('StudyLog', studyLogSchema);
export default StudyLog;
