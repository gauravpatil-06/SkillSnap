import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        unique: true
    },
    codingGoalHrs: { type: Number, default: 100 },
    watchingGoalHrs: { type: Number, default: 50 },
    studyGoalHrs: { type: Number, default: 100 },
    month: { type: Number, default: () => new Date().getMonth() + 1 },
    year: { type: Number, default: () => new Date().getFullYear() }
}, { timestamps: true });

const Goal = mongoose.model('Goal', goalSchema);
export default Goal;
