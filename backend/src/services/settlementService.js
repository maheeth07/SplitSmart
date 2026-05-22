const User = require('../models/User');

/**
 * Calculates simplified debts (who owes whom) using a greedy algorithm.
 * Pairs the largest debtors with the largest creditors to minimize total transaction count.
 * @param {Array} expenses - List of group expenses
 * @param {Array} members - List of group member user objects
 * @returns {Array} List of settlement transactions: { from, fromName, to, toName, amount }
 */
const calculateSettlements = (expenses, members) => {
  const balanceMap = {};
  const userNamesMap = {};

  // Initialize balances for all group members to 0
  members.forEach(member => {
    const idStr = member._id.toString();
    balanceMap[idStr] = 0;
    userNamesMap[idStr] = member.name;
  });

  // Calculate net balances for each member
  expenses.forEach(expense => {
    const payerId = expense.paidBy.toString();
    const totalAmount = expense.amount;

    // The payer gets credited for the total amount they paid
    if (balanceMap[payerId] !== undefined) {
      balanceMap[payerId] += totalAmount;
    }

    // Each participant gets debited for their share of the split
    expense.splits.forEach(split => {
      const participantId = split.user.toString();
      if (balanceMap[participantId] !== undefined) {
        balanceMap[participantId] -= split.amount;
      }
    });
  });

  // Separate members into Debtors (net balance < 0) and Creditors (net balance > 0)
  let debtors = [];
  let creditors = [];

  Object.keys(balanceMap).forEach(userId => {
    // Round to 2 decimal places to avoid floating point issues
    const netBalance = Math.round(balanceMap[userId] * 100) / 100;

    if (netBalance < 0) {
      debtors.push({
        userId,
        name: userNamesMap[userId] || 'Unknown User',
        balance: Math.abs(netBalance),
      });
    } else if (netBalance > 0) {
      creditors.push({
        userId,
        name: userNamesMap[userId] || 'Unknown User',
        balance: netBalance,
      });
    }
  });

  const settlements = [];

  // Greedy debt simplification
  while (debtors.length > 0 && creditors.length > 0) {
    // Sort so the largest values are always at the end
    debtors.sort((a, b) => a.balance - b.balance);
    creditors.sort((a, b) => a.balance - b.balance);

    const activeDebtor = debtors[debtors.length - 1];
    const activeCreditor = creditors[creditors.length - 1];

    const settleAmount = Math.round(Math.min(activeDebtor.balance, activeCreditor.balance) * 100) / 100;

    if (settleAmount > 0) {
      settlements.push({
        from: activeDebtor.userId,
        fromName: activeDebtor.name,
        to: activeCreditor.userId,
        toName: activeCreditor.name,
        amount: settleAmount,
      });
    }

    activeDebtor.balance = Math.round((activeDebtor.balance - settleAmount) * 100) / 100;
    activeCreditor.balance = Math.round((activeCreditor.balance - settleAmount) * 100) / 100;

    if (activeDebtor.balance <= 0.01) {
      debtors.pop();
    }
    if (activeCreditor.balance <= 0.01) {
      creditors.pop();
    }
  }

  return {
    balances: Object.keys(balanceMap).map(userId => ({
      userId,
      name: userNamesMap[userId],
      netBalance: Math.round(balanceMap[userId] * 100) / 100,
    })),
    settlements,
  };
};

module.exports = {
  calculateSettlements,
};
