const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { CategoryEnum } = require('../utils/constant.js');

// User schema definition
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address.'],
    },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    categories: {
        type: [
            {
                category: {
                    type: String,
                    required: true,
                },
                isCustom: { type: Boolean, default: false },
                subcategories: { type: [String] },
            },
        ],
        default: Object.values(CategoryEnum).map((category) => ({
            category,
            isCustom: false,
            subcategories: [],
        })),
    },
});

userSchema.methods.addCategory = async function (newCategory, subcategory = null) {
    const category = this.categories.find((cat) => cat.category === newCategory);

    if (category) {
        if (subcategory && !category.subcategories.includes(subcategory)) {
            category.subcategories.push(subcategory);
            await this.save();
            return {
                status: 'success',
                message: `Subcategory "${subcategory}" successfully added to the "${newCategory}" category.`,
            };
        }
        return {
            status: 'failed',
            message: `Subcategory "${subcategory}" already exists in the "${newCategory}" category.`,
        };
    }


    const newCategoryData = {
        category: newCategory,
        isCustom: !Object.values(CategoryEnum).includes(newCategory),
        subcategories: subcategory ? [subcategory] : [],
    };
    this.categories.push(newCategoryData);
    await this.save();
    return {
        status: 'success',
        message: `Category "${newCategory}" added.`
    }
};

userSchema.methods.removeCategory = async function (categoryToRemove, subcategory = null) {
    const category = this.categories.find((cat) => cat.category === categoryToRemove);

    if (!category) {
        return {
            status: 'success',
            message: `Category "${categoryToRemove}" does not exist.`
        }
    }

    if (subcategory) {
        const subcategoryIndex = category.subcategories.indexOf(subcategory);
        if (subcategoryIndex !== -1) {
            category.subcategories.splice(subcategoryIndex, 1);
            await this.save();
            return {
                status: 'success',
                message: `Subcategory "${subcategory}" removed from "${categoryToRemove}" category.`
            }
        }
        return {
            status: 'failed',
            message: `Subcategory "${subcategory}" not found in "${categoryToRemove}" category.`
        }
    }

    this.categories = this.categories.filter((cat) => cat.category !== categoryToRemove);
    await this.save();
    return {
        status: 'success',
        message: `Category "${categoryToRemove}" removed.`
    }
};

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);
