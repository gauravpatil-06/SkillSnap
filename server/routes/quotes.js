import express from 'express';
import Quote from '../models/Quote.js';

const router = express.Router();

// Get the Quote of the Day
router.get('/daily', async (req, res) => {
    try {
        const count = await Quote.countDocuments();
        if (count === 0) {
            return res.json({ content: "The secret of getting ahead is getting started." });
        }

        
        // Use a stable random pick based on the date of the year
        const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
        const index = dayOfYear % count;
        
        const quote = await Quote.findOne().skip(index);
        res.json(quote);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching daily quote' });
    }
});




export default router;
