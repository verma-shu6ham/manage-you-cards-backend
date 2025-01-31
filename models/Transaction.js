const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    card: { type: mongoose.Schema.Types.ObjectId, ref: 'CreditCard', required: true },
    amount: { type: Number, required: true },
    type: {
        type: String,
        required: true,
        enum: ['credit', 'debit'],
    },
    category: {
        type: String,
        required: true,
    },
    subcategory: {
        type: String,
    },
    description: {
        type: String,
        default: '',
    },
    transactionDate: {
        type: Date,
        default: Date.now,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

transactionSchema.pre('save', async function (next) {
    try {
        const User = mongoose.model('User');
        const user = await User.findById(this.user);

        if (!user) {
            return next(new Error('User not found.'));
        }

        const userCategory = user.categories.find((cat) => cat.category === this.category);
        if (!userCategory) {
            return next(new Error(`Invalid category: "${this.category}".`));
        }

        if (this.subcategory && !userCategory.subcategories.includes(this.subcategory)) {
            return next(
                new Error(
                    `Invalid subcategory: "${this.subcategory}" for category "${this.category}".`
                )
            );
        }
        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('Transaction', transactionSchema);
