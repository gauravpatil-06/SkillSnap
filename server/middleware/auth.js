import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Admin from '../models/Admin.js';

export const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Check User collection first
            let user = await User.findById(decoded.id).select('-password');

            // If not found in User, check Admin collection
            if (!user) {
                user = await Admin.findById(decoded.id).select('-password');
                if (user) {
                    user.role = 'admin'; // Manually set role for easier checking in routes
                }
            }

            req.user = user;
            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

export const isAdmin = (req, res, next) => {
    // Check if the user exists and either has role 'admin' (from User table) 
    // or corresponds to an entry in the Admin table (checked above)
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as an admin' });
    }
};
