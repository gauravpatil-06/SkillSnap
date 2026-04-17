import mongoose from 'mongoose';

const quoteSchema = new mongoose.Schema({
    content: { type: String, required: true },
}, { timestamps: true });

const Quote = mongoose.model('Quote', quoteSchema);
export default Quote;
