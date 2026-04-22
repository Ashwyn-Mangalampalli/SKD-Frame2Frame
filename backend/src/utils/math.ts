/**
 * Round to 2 decimal places to avoid JS float precision issues.
 */
export function round(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates balance and payment status based on total and advance paid.
 */
export function calcBalance(total: number, paid: number) {
  const rTotal = round(total);
  const rPaid = round(paid);
  const balance = round(rTotal - rPaid);

  let status: "Unpaid" | "Partial" | "Paid" | "Overpaid" = "Unpaid";

  // Safety: If total is 0, any payment >= 0 results in "Paid" or "Overpaid"
  if (rTotal <= 0) {
    status = rPaid > 0 ? "Overpaid" : "Paid";
    return { balance, status };
  }

  if (rPaid === 0) {
    status = "Unpaid";
  } else if (rPaid < rTotal) {
    status = "Partial";
  } else if (rPaid === rTotal) {
    status = "Paid";
  } else if (rPaid > rTotal) {
    status = "Overpaid";
  }

  return { balance, status };
}
