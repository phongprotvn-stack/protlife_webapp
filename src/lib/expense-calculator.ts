export interface ExpenseDetail {
  paidBy: string; // ID or Name of the person who paid
  amount: number;
  involvedParticipants?: string[]; // Array of IDs/Names of people who participated in this specific expense. If undefined/empty, assumes ALL participants.
}

export interface SplitResult {
  from: string;
  to: string;
  amount: number;
}

/**
 * Thuật toán Splitwise (Cải tiến theo từng khoản chi):
 * 1. Tính số tiền mỗi người đã trả (paidAmounts).
 * 2. Tính số tiền mỗi người PHẢI trả (owedAmounts) dựa trên việc họ có tham gia vào từng khoản chi hay không.
 *    (Nếu một khoản chi không có danh sách người tham gia cụ thể, chia đều cho TẤT CẢ).
 * 3. Tính số dư (Balance) = Số tiền đã trả - Số tiền phải trả
 *    (Balance > 0: Người này trả thừa, cần được nhận lại tiền)
 *    (Balance < 0: Người này nợ tiền, cần phải trả)
 * 4. Bù trừ công nợ giữa những người nợ và những người được nhận
 */
export function calculateSplitwise(
  participants: string[],
  expenses: ExpenseDetail[]
): SplitResult[] {
  if (participants.length === 0) return [];

  // Khởi tạo các biến lưu trữ
  const paidAmounts: Record<string, number> = {};
  const owedAmounts: Record<string, number> = {};
  
  participants.forEach(p => {
    paidAmounts[p] = 0;
    owedAmounts[p] = 0;
  });
  
  // 1 & 2. Tính tổng chi (paid) và tổng nợ (owed) cho từng người
  expenses.forEach(exp => {
    // Cộng tiền đã trả cho người thanh toán
    if (paidAmounts[exp.paidBy] !== undefined) {
      paidAmounts[exp.paidBy] += exp.amount;
    }

    // Xác định những ai tham gia khoản chi này
    let involved = exp.involvedParticipants;
    if (!involved || involved.length === 0) {
      involved = participants; // Mặc định chia đều cho tất cả nếu không chỉ định
    }

    // Chia đều khoản tiền này cho những người tham gia
    const splitAmount = exp.amount / involved.length;
    involved.forEach(person => {
      if (owedAmounts[person] !== undefined) {
        owedAmounts[person] += splitAmount;
      }
    });
  });

  // 3. Tính balance (Số dư)
  const balances: { person: string; balance: number }[] = participants.map(p => ({
    person: p,
    balance: paidAmounts[p] - owedAmounts[p]
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
      amount: Math.round(amountToSettle) // Làm tròn số tiền cho đẹp
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
