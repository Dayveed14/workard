// Small shared pieces for the Requests pages
export const TYPE_LABELS = { advance: 'Salary advance', loan: 'Staff loan' };
export const STATUS_LABELS = {
  pending: 'Waiting for approval',
  approved: 'Approved — waiting to be paid',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  paid_out: 'Being repaid',
  repaid: 'Fully repaid',
};
export const STATUS_BADGE = { pending: 'pending', approved: 'approved', rejected: 'rejected', cancelled: 'cancelled', paid_out: 'active', repaid: 'paid' };
export const FEEDBACK_CATEGORIES = { job: 'About my job', complaint: 'Complaint', suggestion: 'Suggestion' };
export const FEEDBACK_STATUS = { received: 'Received', in_review: 'Being looked at', resolved: 'Resolved' };
export const FEEDBACK_BADGE = { received: 'pending', in_review: 'active', resolved: 'paid' };

// The same rules as the server (config/requestRules.js), to preview repayments while typing
export const RULES = {
  loan: { months: 12, interestRateBp: 500 },
  advance: { months: 1, interestRateBp: 0 },
};

export function previewPlan(type, amountKobo) {
  const r = RULES[type];
  const total = Math.round((amountKobo * (10_000 + r.interestRateBp)) / 10_000);
  return { total, monthly: Math.ceil(total / r.months / 100) * 100, months: r.months, ratePct: r.interestRateBp / 100 };
}
