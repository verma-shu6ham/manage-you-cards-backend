const mongoose = require('mongoose');

const creditCardSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cardName: { type: String, required: true },
    cardNumber: { type: String, required: true, unique: true },
    creditLimit: { type: Number, required: true },
    lastKnownAvailableCredit: { type: Number, required: true }, 
    lastKnownOutstanding: { type: Number, default: 0 }, 
    realTimeAvailableCredit: { type: Number, default: 0 }, 
    realTimeOutstanding: { type: Number, default: 0 },
    paymentDifference: { type: Number, default: 0 },
    // billingCycleStartDate: { type: Date, required: true }, 
    // billingCycleEndDate: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('CreditCard', creditCardSchema);
