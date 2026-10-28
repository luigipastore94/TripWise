import type { Expense, Member, Settlement } from '../types/trip';

export interface MemberBalance {
  memberId: string;
  paidInBase: number;
  owedInBase: number;
  netInBase: number; // positive = creditor (should receive), negative = debtor (should pay)
}

/**
 * Calculates individual balances and minimum-transfer settlements ("Chi deve a chi")
 * across 2 or more travel companions.
 */
export function calculateTripBalances(
  expenses: Expense[],
  members: Member[]
): {
  balances: MemberBalance[];
  settlements: Settlement[];
  totalSpentInBase: number;
} {
  const map = new Map<string, MemberBalance>();
  for (const m of members) {
    map.set(m.id, {
      memberId: m.id,
      paidInBase: 0,
      owedInBase: 0,
      netInBase: 0
    });
  }

  let totalSpentInBase = 0;

  for (const exp of expenses) {
    const amount = Number.isFinite(exp.amountInBase) ? exp.amountInBase : 0;
    if (amount <= 0) continue;
    totalSpentInBase += amount;

    const payer = map.get(exp.paidByMemberId);
    if (payer) {
      payer.paidInBase += amount;
    }

    const validParticipants =
      exp.splitBetweenMemberIds && exp.splitBetweenMemberIds.length > 0
        ? exp.splitBetweenMemberIds.filter((id) => map.has(id))
        : members.map((m) => m.id);

    const count = validParticipants.length || members.length;
    if (count > 0) {
      const share = amount / count;
      for (const pid of validParticipants) {
        const participant = map.get(pid);
        if (participant) {
          participant.owedInBase += share;
        }
      }
    }
  }

  const balances = Array.from(map.values()).map((b) => ({
    ...b,
    netInBase: Math.round((b.paidInBase - b.owedInBase) * 100) / 100
  }));

  const debtors = balances
    .filter((b) => b.netInBase < -0.01)
    .map((b) => ({ memberId: b.memberId, amount: -b.netInBase }))
    .sort((a, b) => b.amount - a.amount);

  const creditors = balances
    .filter((b) => b.netInBase > 0.01)
    .map((b) => ({ memberId: b.memberId, amount: b.netInBase }))
    .sort((a, b) => b.amount - a.amount);

  const settlements: Settlement[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const transfer = Math.min(debtor.amount, creditor.amount);

    if (transfer > 0.01) {
      settlements.push({
        fromMemberId: debtor.memberId,
        toMemberId: creditor.memberId,
        amountInBase: Math.round(transfer * 100) / 100
      });
    }

    debtor.amount -= transfer;
    creditor.amount -= transfer;

    if (debtor.amount <= 0.01) i++;
    if (creditor.amount <= 0.01) j++;
  }

  return { balances, settlements, totalSpentInBase };
}
