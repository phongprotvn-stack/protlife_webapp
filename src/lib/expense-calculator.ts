export interface ExpenseDetail {
  paidBy: string; // ID or Name of the person who paid
  amount: number;
}

export interface SplitResult {
  from: string;
  to: string;
  amount: number;
}

/**
 * Thuật toán Splitwise đơn giản:
 * 1. Tính tổng chi tiêu
 * 2. Tính số tiền trung bình mỗi người phải chịu (tổng chi tiêu / số người)
 * 3. Tính số dư (Balance) của mỗi người = Số tiền đã trả - Số tiền trung bình
 *    (Balance > 0: Người này trả thừa, cần được nhận lại tiền)
 *    (Balance < 0: Người này nợ tiền, cần phải trả)
 * 4. Bù trừ công nợ giữa những người nợ và những người được nhận
 */
export function calculateSplitwise(
  participants: string[],
  expenses: ExpenseDetail[]
): SplitResult[] {
  if (participants.length === 0) return [];

  // 1. Tính tổng chi của mỗi người
  const paidAmounts: Record<string, number> = {};
  participants.forEach(p => (paidAmounts[p] = 0));
  
  let totalExpense = 0;
  expenses.forEach(exp => {
    if (paidAmounts[exp.paidBy] !== undefined) {
      paidAmounts[exp.paidBy] += exp.amount;
      totalExpense += exp.amount;
    }
  });

  // 2. Tính số tiền trung bình mỗi người phải chịu
  const averagePerPerson = totalExpense / participants.length;

  // 3. Tính balance (Số dư)
  // balance > 0 => người này cho vay (cần lấy lại tiền)
  // balance < 0 => người này nợ (cần trả tiền)
  const balances: { person: string; balance: number }[] = participants.map(p => ({
    person: p,
    balance: paidAmounts[p] - averagePerPerson
  }));

  // Tách ra 2 mảng: người nợ (debtors) và người cho vay (creditors)
  const debtors = balances.filter(b => b.balance < -0.01).sort((a, b) => a.balance - b.balance);
  const creditors = balances.filter(b => b.balance > 0.01).sort((a, b) => b.balance - a.balance);

  const transactions: SplitResult[] = [];

  let i = 0; // index of debtors
  let j = 0; // index of creditors

  // 4. Bù trừ (Greedy algorithm)
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const debtAmount = Math.abs(debtor.balance);
    const creditAmount = creditor.balance;

    // Lấy số tiền nhỏ hơn để cấn trừ
    const amountToSettle = Math.min(debtAmount, creditAmount);

    transactions.push({
      from: debtor.person,
      to: creditor.person,
      amount: Math.round(amountToSettle)
    });

    // Cập nhật lại balance sau khi cấn trừ
    debtor.balance += amountToSettle;
    creditor.balance -= amountToSettle;

    // Nếu người nợ đã trả hết nợ (sai số nhỏ hơn 0.01), chuyển sang người nợ tiếp theo
    if (Math.abs(debtor.balance) < 0.01) {
      i++;
    }
    // Nếu người cho vay đã nhận đủ tiền, chuyển sang người cho vay tiếp theo
    if (creditor.balance < 0.01) {
      j++;
    }
  }

  return transactions;
}
