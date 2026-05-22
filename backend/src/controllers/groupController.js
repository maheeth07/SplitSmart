const Group = require('../models/Group');
const User = require('../models/User');
const Expense = require('../models/Expense');
const { calculateSettlements } = require('../services/settlementService');

/**
 * @desc    Create a new split group
 * @route   POST /api/groups
 * @access  Private
 */
const createGroup = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      const error = new Error('Please enter a group name');
      error.statusCode = 400;
      return next(error);
    }

    // Create group with current user as the first member
    const group = await Group.create({
      name,
      description,
      createdBy: req.user._id,
      members: [req.user._id],
    });

    res.status(201).json({
      success: true,
      group,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all groups current user is a member of
 * @route   GET /api/groups
 * @access  Private
 */
const getGroups = async (req, res, next) => {
  try {
    const groups = await Group.find({ members: req.user._id })
      .populate('createdBy', 'name email')
      .populate('members', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: groups.length,
      groups,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single group details
 * @route   GET /api/groups/:id
 * @access  Private
 */
const getGroupDetails = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('members', 'name email');

    if (!group) {
      const error = new Error('Group not found');
      error.statusCode = 404;
      return next(error);
    }

    // Check if current user is a member
    const isMember = group.members.some(
      member => member._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      const error = new Error('Not authorized to access this group');
      error.statusCode = 403;
      return next(error);
    }

    res.status(200).json({
      success: true,
      group,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Invite/Add a user by email to a group
 * @route   POST /api/groups/:id/members
 * @access  Private
 */
const inviteMember = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      const error = new Error('Please provide an email address');
      error.statusCode = 400;
      return next(error);
    }

    const group = await Group.findById(req.params.id);
    if (!group) {
      const error = new Error('Group not found');
      error.statusCode = 404;
      return next(error);
    }

    // Check if current user is member of this group
    const isMember = group.members.some(
      memberId => memberId.toString() === req.user._id.toString()
    );
    if (!isMember) {
      const error = new Error('Not authorized to modify this group');
      error.statusCode = 403;
      return next(error);
    }

    // Find invited user by email
    const invitedUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (!invitedUser) {
      const error = new Error(`User with email "${email}" is not registered on this platform`);
      error.statusCode = 404;
      return next(error);
    }

    // Check if user is already a member
    const alreadyMember = group.members.some(
      memberId => memberId.toString() === invitedUser._id.toString()
    );
    if (alreadyMember) {
      const error = new Error('User is already a member of this group');
      error.statusCode = 400;
      return next(error);
    }

    // Add user to group
    group.members.push(invitedUser._id);
    await group.save();

    res.status(200).json({
      success: true,
      message: 'Member added successfully',
      group,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get group settlements / simplified debts
 * @route   GET /api/groups/:id/settlements
 * @access  Private
 */
const getGroupSettlements = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id).populate('members', 'name email');
    if (!group) {
      const error = new Error('Group not found');
      error.statusCode = 404;
      return next(error);
    }

    // Check user membership
    const isMember = group.members.some(
      member => member._id.toString() === req.user._id.toString()
    );
    if (!isMember) {
      const error = new Error('Not authorized to access this group settlements');
      error.statusCode = 403;
      return next(error);
    }

    // Fetch all group expenses
    const expenses = await Expense.find({ group: req.params.id });

    // Calculate settlements using greedy algorithm
    const settlementData = calculateSettlements(expenses, group.members);

    res.status(200).json({
      success: true,
      balances: settlementData.balances,
      settlements: settlementData.settlements,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createGroup,
  getGroups,
  getGroupDetails,
  inviteMember,
  getGroupSettlements,
};
