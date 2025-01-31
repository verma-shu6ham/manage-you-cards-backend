const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const creditCardRoutes = require('./routes/creditCardRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const cors = require('cors');

require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(cors());

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.log('Error connecting to MongoDB', err));

app.use('/api/credit-card', creditCardRoutes);
app.use('/api/transaction', transactionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
