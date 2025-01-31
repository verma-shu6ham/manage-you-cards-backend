const express = require('express');
const router = express.Router();
const User = require('../models/User');
const CreditCard = require('../models/CreditCard');
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/categories', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json(user.categories);
    } catch (error) {
        console.error('Error fetching categories:', error.message);
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
});

router.post('/categories', authMiddleware, async (req, res) => {
    const { category, subcategory } = req.body;

    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const result = await user.addCategory(category, subcategory);
        res.json({ message: result });
    } catch (error) {
        console.error('Error adding category:', error.message);
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
});

router.delete('/categories', authMiddleware, async (req, res) => {
    const { category, subcategory } = req.body;

    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const result = await user.removeCategory(category, subcategory);
        res.json({ message: result });
    } catch (error) {
        console.error('Error removing category:', error.message);
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
});


router.delete('/delete-account', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const creditCards = await CreditCard.find({ user: userId });

        const cardIds = creditCards.map(card => card._id);
        await Transaction.deleteMany({ card: { $in: cardIds } });

        await CreditCard.deleteMany({ user: userId });

        await User.deleteOne({ _id: userId });

        res.status(200).json({ message: 'User account and all associated data deleted successfully.' });
    } catch (error) {
        console.error('Error deleting account:', error.message);
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
});



module.exports = router;
