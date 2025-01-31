const express = require('express');
const router = express.Router();
const CreditCard = require('../models/CreditCard');
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/authMiddleware');
const { updateCreditCardFields } = require('../utils/creditCardUtils.js');

router.post('/', authMiddleware, async (req, res) => {
    const { cardName, cardNumber, creditLimit, lastKnownOutstanding = 0, realTimeAvailableCredit = creditLimit } = req.body;
    console.log({ cardName, cardNumber, creditLimit, lastKnownOutstanding, realTimeAvailableCredit }, req.user)

    try {
        const userId = req.user.id;

        const lastKnownAvailableCredit = creditLimit - lastKnownOutstanding;
        const realTimeOutstanding = creditLimit - realTimeAvailableCredit;

        const newCard = new CreditCard({
            user: userId,
            cardName,
            cardNumber,
            creditLimit,
            lastKnownAvailableCredit,
            lastKnownOutstanding,
            realTimeAvailableCredit,
            realTimeOutstanding
        });
        updateCreditCardFields(newCard, newCard.realTimeAvailableCredit)
        await newCard.save();
        res.status(201).json(newCard);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.get('/all-cards', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const cards = await CreditCard.find({ user: userId }).lean();

        res.status(200).json(cards);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.get('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;

    try {
        const userId = req.user.id;

        const card = await CreditCard.findOne({ _id: id, user: userId }).lean();

        if (!card) {
            return res.status(404).json({ message: 'Credit card not found' });
        }

        const transactions = await Transaction.find({ card: id }).sort({ transactionDate: -1 });


        res.status(200).json({ ...card, transactions });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.patch('/:id/real-time-available-credit', authMiddleware, async (req, res) => {
    const { realTimeAvailable } = req.body;
    const { id } = req.params;

    try {
        const userId = req.user.id;

        const card = await CreditCard.findOne({ _id: id, user: userId });

        if (!card) {
            return res.status(404).json({ message: 'Credit card not found' });
        }

        updateCreditCardFields(card, realTimeAvailable);

        await card.save();

        res.status(200).json({
            message: 'Reported balance updated successfully',
            realTimeAvailableCredit: card.realTimeAvailableCredit,
            paymentDifference: card.paymentDifference,
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.delete('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;

    try {
        const userId = req.user.id;

        const card = await CreditCard.findOne({ _id: id, user: userId });

        if (!card) {
            return res.status(404).json({ message: 'Credit card not found' });
        }

        await Transaction.deleteMany({ card: id });

        await CreditCard.deleteOne({ _id: id });

        res.status(200).json({ message: 'Credit card and associated transactions deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


module.exports = router;
