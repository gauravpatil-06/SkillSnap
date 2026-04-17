import mongoose from 'mongoose';

const NoteSchema = new mongoose.Schema({
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
    },
    fileUrl: {
        type: String, // Path to the uploaded PDF
    },
    isShared: {
        type: Boolean,
        default: false,
    }
}, { timestamps: true });

export default mongoose.model('Note', NoteSchema);
