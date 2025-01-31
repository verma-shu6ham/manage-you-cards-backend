const express = require('express');
const router = express.Router();
const User = require('../models/User');
const CreditCard = require('../models/CreditCard');
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/authMiddleware');
const { updateCreditCardAfterTransaction } = require('../utils/creditCardUtils');

router.post('/', authMiddleware, async (req, res) => {
    const { cardId, amount, type, category, subcategory, description, transactionDate } = req.body;
    try {
        if (!cardId || !amount || !type || !category) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const newTransaction = new Transaction({
            user: user._id,
            card: cardId,
            amount: Number(amount),
            type,
            category,
            subcategory,
            description,
            transactionDate,
        });
        await newTransaction.save();

        const card = await CreditCard.findById(cardId);
        if (!card) {
            return res.status(404).json({ message: 'Credit Card not found' });
        }

        updateCreditCardAfterTransaction(card, newTransaction);

        await card.save();

        res.status(201).json({ message: 'Transaction added successfully', transaction: newTransaction });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/', authMiddleware, async (req, res) => {
    try {
        const user = req.user;

        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        console.log(req.query)

        const {
            cardId,
            type,
            category,
            subcategory,
            startDate,
            endDate,
            minAmount,
            maxAmount,
        } = req.query;

        const filters = { user: user._id };

        if (cardId) {
            filters.card = cardId;
        }
        if (type) {
            filters.type = type;
        }
        if (category) {
            filters.category = category;
            if (subcategory) {
                filters.subcategory = subcategory;
            }
        }
        if (startDate || endDate) {
            filters.transactionDate = {};
            if (startDate) {
                filters.transactionDate.$gte = new Date(startDate);
            }
            if (endDate) {
                filters.transactionDate.$lte = new Date(endDate);
            }
        }
        if (minAmount || maxAmount) {
            filters.amount = {};
            if (minAmount) {
                filters.amount.$gte = Number(minAmount);
            }
            if (maxAmount) {
                filters.amount.$lte = Number(maxAmount);
            }
        }

        const transactions = await Transaction.find(filters).sort({ transactionDate: -1 });

        res.status(200).json({ transactions });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/:transactionId', authMiddleware, async (req, res) => {
    try {
        const { transactionId } = req.params;
        const user = req.user;

        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const transaction = await Transaction.findById(transactionId);
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        if (transaction.user.toString() !== user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this transaction' });
        }

        const card = await CreditCard.findById(transaction.card);
        if (!card) {
            return res.status(404).json({ message: 'Associated credit card not found' });
        }

        const reversedTransaction = {
            type: transaction.type === 'credit' ? 'debit' : 'credit',
            amount: transaction.amount,
        };

        updateCreditCardAfterTransaction(card, reversedTransaction);

        await card.save();

        await transaction.deleteOne();

        res.status(200).json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
