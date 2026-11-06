// The three plans, as shown on the home page and sign-up page. Paid monthly, or
// yearly at a lower monthly price (the card is charged again automatically).
// The SERVER decides what each plan really unlocks (server/src/config/plans.js) —
// keep the prices and feature lists here in step with it.
export const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    prices: { monthly: 1_500_000, yearly: 15_598_800 }, // ₦15,000/month or ₦12,999/month yearly
    tagline: 'Get your team organised.',
    items: ['Up to 10 employees', 'Verified clock-in & attendance', 'Leave requests & approvals', 'Staff documents', 'Onboarding checklists'],
  },
  {
    id: 'business',
    name: 'Business',
    prices: { monthly: 3_500_000, yearly: 39_598_800 }, // ₦35,000/month or ₦32,999/month yearly
    tagline: 'Run people, money and customers in one place.',
    items: [
      'Everything in Starter',
      'Unlimited employees, up to 3 branches',
      'Tasks & performance reviews',
      'Payroll with PAYE & pension',
      'Customers (CRM) & invoicing',
      'Income, expenses & profit reports',
    ],
    featured: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    prices: { monthly: 5_500_000, yearly: 64_798_800 }, // ₦55,000/month or ₦53,999/month yearly
    tagline: 'For larger organisations with many branches.',
    items: ['Everything in Business', 'Unlimited branches', 'Custom roles & scopes', 'Cloud phone & call reviews (coming soon)', 'Priority support'],
  },
];

// What one month costs on this interval (yearly: the yearly price ÷ 12)
export const perMonthKobo = (plan, interval) => (interval === 'yearly' ? Math.round(plan.prices.yearly / 12) : plan.prices.monthly);

// The biggest yearly saving, for "save up to 13%" labels
export const YEARLY_SAVING = Math.max(...PLANS.map((p) => Math.round((1 - p.prices.yearly / (p.prices.monthly * 12)) * 100)));

export const planById = (id) => PLANS.find((p) => p.id === id);

// Which plan first includes a feature — used on "upgrade to unlock" messages
export const FEATURE_PLAN = {
  tasks: 'business',
  reviews: 'business',
  payroll: 'business',
  crm: 'business',
  invoices: 'business',
  finance: 'business',
  calls: 'enterprise',
};

export const FEATURE_NAMES = {
  hr: 'Employees & HR',
  tasks: 'Tasks',
  reviews: 'Performance reviews',
  payroll: 'Payroll',
  crm: 'Customers',
  invoices: 'Invoicing',
  finance: 'Finance',
  calls: 'Cloud phone',
};
