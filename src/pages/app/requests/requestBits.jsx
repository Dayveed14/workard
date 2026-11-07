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

// Preview the repayment while typing — with the company's own months and interest
// (from /api/requests/limits; the server works it out the same way when the request is sent)
export function previewPlan(rules, amountKobo) {
  const r = rules;
  const total = Math.round((amountKobo * (10_000 + r.interestRateBp)) / 10_000);
  return { total, monthly: Math.ceil(total / r.months / 100) * 100, months: r.months, ratePct: r.interestRateBp / 100 };
}
