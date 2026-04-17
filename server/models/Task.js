import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        default: '',
    },
    pdfUrl: {
        type: String,
        default: '',
    },
    fileName: {
        type: String,
        default: '',
    },
    status: {
        type: String,
        enum: ['pending', 'completed'],
        default: 'pending',
    },
    completedAt: {
        type: Date,
    }
}, { timestamps: true });

export default mongoose.model('Task', TaskSchema);
