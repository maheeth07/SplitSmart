const express = require('express');
const router = express.Router();
const {
  addExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
} = require('../controllers/expenseController');
const { protect } = require('../middleware/auth');

router.use(protect); // Secure all expense routes

router.route('/')
  .post(addExpense)
  .get(getExpenses);

router.route('/:id')
  .put(updateExpense)
  .delete(deleteExpense);

module.exports = router;
