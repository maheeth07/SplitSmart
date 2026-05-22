const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true, 'Please enter an expense description'],
    trim: true,
  },
  amount: {
    type: Number,
    required: [true, 'Please enter a valid amount'],
    min: [0.01, 'Amount must be greater than zero'],
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
  },
  splitType: {
    type: String,
    enum: ['EQUAL', 'EXACT', 'PERCENTAGE'],
    default: 'EQUAL',
  },
  splits: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      amount: {
        type: Number,
        required: true,
      },
    },
  ],
  category: {
    type: String,
    enum: ['Food', 'Transport', 'Entertainment', 'Shopping', 'Utilities', 'Others'],
    default: 'Others',
  },
  date: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Expense', ExpenseSchema);
