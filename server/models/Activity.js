import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    date: {
        type: Date,
        required: true,
        default: () => {
            const d = new Date();
            d.setHours(0, 0, 0, 0);
            return d;
        }
    },
    minutes: {
        type: Number,
        required: true,
        min: 1
    },
    type: {
        type: String,
        enum: ['Study', 'Coding', 'Watching'],
        required: true
    },
    topic: {
        type: String,
        trim: true,
        default: ''
    },
    method: {
        type: String,
        enum: ['Manual', 'Countdown', 'Stopwatch'],
        default: 'Manual'
    }
}, { timestamps: true });

activitySchema.index({ userId: 1, date: -1 });

const Activity = mongoose.model('Activity', activitySchema);
export default Activity;
