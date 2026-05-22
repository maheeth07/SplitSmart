const Expense = require('../models/Expense');
const Group = require('../models/Group');
const User = require('../models/User');

// Helper to validate splits amounts
const validateAndCalculateSplits = (splitType, amount, splits, members) => {
  if (!splits || !Array.isArray(splits) || splits.length === 0) {
    throw new Error('Splits must be an array of participants');
  }

  // Validate that all split users are indeed members of the group
  const memberIdStrings = members.map(m => m.toString());
  splits.forEach(s => {
    if (!memberIdStrings.includes(s.user.toString())) {
      throw new Error(`Participant ${s.user} is not a member of the group`);
    }
  });

  let calculatedSplits = [];

  if (splitType === 'EQUAL') {
    const share = Math.round((amount / splits.length) * 100) / 100;
    // Distribute with adjustments for remainder
    let runningSum = 0;
    splits.forEach((s, idx) => {
      let userShare = share;
      if (idx === splits.length - 1) {
        // Last person absorbs rounding error
        userShare = Math.round((amount - runningSum) * 100) / 100;
      } else {
        runningSum += share;
      }
      calculatedSplits.push({
        user: s.user,
        amount: userShare,
      });
    });
  } else if (splitType === 'EXACT') {
    let totalSplitSum = 0;
    splits.forEach(s => {
      if (s.amount === undefined || s.amount === null || s.amount < 0) {
        throw new Error('Exact split amounts must be non-negative values');
      }
      totalSplitSum += Number(s.amount);
      calculatedSplits.push({
        user: s.user,
        amount: Math.round(Number(s.amount) * 100) / 100,
      });
    });

    if (Math.abs(totalSplitSum - amount) > 0.05) {
      throw new Error(`Total split shares (₹${totalSplitSum.toFixed(2)}) must sum up to the total expense amount (₹${amount.toFixed(2)})`);
    }
  } else if (splitType === 'PERCENTAGE') {
    let totalPercentSum = 0;
    splits.forEach(s => {
      if (s.percentage === undefined || s.percentage === null || s.percentage < 0) {
        throw new Error('Percentage splits must contain non-negative numbers');
      }
      totalPercentSum += Number(s.percentage);
    });

    if (Math.abs(totalPercentSum - 100) > 0.01) {
      throw new Error(`Total split percentages (${totalPercentSum}%) must sum up to exactly 100%`);
    }

    let runningSum = 0;
    splits.forEach((s, idx) => {
      let share = Math.round((amount * (Number(s.percentage) / 100)) * 100) / 100;
      if (idx === splits.length - 1) {
        // Last person absorbs rounding errors
        share = Math.round((amount - runningSum) * 100) / 100;
      } else {
        runningSum += share;
      }
      calculatedSplits.push({
        user: s.user,
        amount: share,
      });
    });
  } else {
    throw new Error('Invalid split type. Use EQUAL, EXACT, or PERCENTAGE');
  }

  return calculatedSplits;
};

/**
 * @desc    Add an expense to a group
 * @route   POST /api/expenses
 * @access  Private
 */
const addExpense = async (req, res, next) => {
  try {
    const { description, amount, paidBy, group: groupId, splitType, splits, category, date } = req.body;

    if (!description || !amount || !paidBy || !groupId) {
      const error = new Error('Please enter description, amount, payer, and group');
      error.statusCode = 400;
      return next(error);
    }

    // Check group existence
    const group = await Group.findById(groupId);
    if (!group) {
      const error = new Error('Group not found');
      error.statusCode = 404;
      return next(error);
    }

    // Verify current user membership
    const isMember = group.members.some(
      memberId => memberId.toString() === req.user._id.toString()
    );
    if (!isMember) {
      const error = new Error('Not authorized to post to this group');
      error.statusCode = 403;
      return next(error);
    }

    // Validate and build split percentages
    const finalSplits = validateAndCalculateSplits(
      splitType || 'EQUAL',
      Number(amount),
      splits,
      group.members
    );

    // Save expense
    const expense = await Expense.create({
      description,
      amount: Number(amount),
      paidBy,
      group: groupId,
      splitType: splitType || 'EQUAL',
      splits: finalSplits,
      category: category || 'Others',
      date: date || new Date(),
    });

    res.status(201).json({
      success: true,
      expense,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all expenses of a group with searching, sorting, and simulation delays
 * @route   GET /api/expenses
 * @access  Private
 */
const getExpenses = async (req, res, next) => {
  try {
    const { group: groupId, search, member, sortBy, order } = req.query;

    if (!groupId) {
      const error = new Error('Please specify a group parameter in the query');
      error.statusCode = 400;
      return next(error);
    }

    // --- EDGE CASE SIMULATION CHECKS ---
    // 1. Slow network latency simulation
    if (req.headers['x-simulate-delay']) {
      const delayMs = Number(req.headers['x-simulate-delay']);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    // 2. Forced failure mock injection
    if (req.headers['x-simulate-failure'] === 'true') {
      const error = new Error('[Simulated Exception] Backend system encountered a severe database failure.');
      error.statusCode = 500;
      return next(error);
    }

    // 3. Mock empty response injection
    if (req.headers['x-simulate-empty'] === 'true') {
      return res.status(200).json({
        success: true,
        count: 0,
        expenses: [],
      });
    }
    // ------------------------------------

    const group = await Group.findById(groupId);
    if (!group) {
      const error = new Error('Group not found');
      error.statusCode = 404;
      return next(error);
    }

    // Member check
    const isMember = group.members.some(
      memberId => memberId.toString() === req.user._id.toString()
    );
    if (!isMember) {
      const error = new Error('Not authorized to access group expenses');
      error.statusCode = 403;
      return next(error);
    }

    // Build filter query
    let filterQuery = { group: groupId };

    // Search filter
    if (search) {
      filterQuery.description = { $regex: search, $options: 'i' };
    }

    // Member filter
    if (member) {
      filterQuery.$or = [
        { paidBy: member },
        { 'splits.user': member }
      ];
    }

    // Dynamic sort sorting
    let sortQuery = { date: -1 }; // default: latest date
    if (sortBy) {
      const sortDirection = order === 'asc' ? 1 : -1;
      sortQuery = { [sortBy]: sortDirection };
    }

    const expenses = await Expense.find(filterQuery)
      .populate('paidBy', 'name email')
      .populate('splits.user', 'name email')
      .sort(sortQuery);

    res.status(200).json({
      success: true,
      count: expenses.length,
      expenses,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an expense
 * @route   PUT /api/expenses/:id
 * @access  Private
 */
const updateExpense = async (req, res, next) => {
  try {
    const { description, amount, paidBy, splitType, splits, category, date } = req.body;

    let expense = await Expense.findById(req.params.id);
    if (!expense) {
      const error = new Error('Expense not found');
      error.statusCode = 404;
      return next(error);
    }

    const group = await Group.findById(expense.group);
    if (!group) {
      const error = new Error('Group associated with expense not found');
      error.statusCode = 404;
      return next(error);
    }

    // Check user membership
    const isMember = group.members.some(
      memberId => memberId.toString() === req.user._id.toString()
    );
    if (!isMember) {
      const error = new Error('Not authorized to update this expense');
      error.statusCode = 403;
      return next(error);
    }

    // Re-verify and calculate splits if amount, splits or type changes
    if (amount || splits || splitType) {
      const finalAmount = amount !== undefined ? Number(amount) : expense.amount;
      const finalType = splitType || expense.splitType;
      const finalSplitsSource = splits || expense.splits;

      const finalSplits = validateAndCalculateSplits(
        finalType,
        finalAmount,
        finalSplitsSource,
        group.members
      );

      expense.amount = finalAmount;
      expense.splitType = finalType;
      expense.splits = finalSplits;
    }

    if (description) expense.description = description;
    if (paidBy) expense.paidBy = paidBy;
    if (category) expense.category = category;
    if (date) expense.date = date;

    await expense.save();

    const populatedExpense = await Expense.findById(expense._id)
      .populate('paidBy', 'name email')
      .populate('splits.user', 'name email');

    res.status(200).json({
      success: true,
      expense: populatedExpense,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete an expense
 * @route   DELETE /api/expenses/:id
 * @access  Private
 */
const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      const error = new Error('Expense not found');
      error.statusCode = 404;
      return next(error);
    }

    const group = await Group.findById(expense.group);
    if (!group) {
      const error = new Error('Associated group not found');
      error.statusCode = 404;
      return next(error);
    }

    // Member auth check
    const isMember = group.members.some(
      memberId => memberId.toString() === req.user._id.toString()
    );
    if (!isMember) {
      const error = new Error('Not authorized to delete this expense');
      error.statusCode = 403;
      return next(error);
    }

    await Expense.deleteOne({ _id: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
};
