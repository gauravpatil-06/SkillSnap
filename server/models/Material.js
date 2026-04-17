import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    userEmail: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    fileUrl: {
        type: String,
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        required: true,
        enum: ['pdf', 'image', 'doc']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Material = mongoose.model('Material', materialSchema);
export default Material;
