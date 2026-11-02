// The three yearly plans, as shown on the home page and sign-up page.
// The SERVER decides what each plan really unlocks (server/src/config/plans.js) —
// keep the prices and feature lists here in step with it.
export const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    priceKobo: 25_000_000,
    tagline: 'Get your team organised.',
    items: ['Up to 10 employees', 'Verified clock-in & attendance', 'Leave requests & approvals', 'Staff documents', 'Onboarding checklists'],
  },
  {
    id: 'business',
    name: 'Business',
    priceKobo: 60_000_000,
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
    priceKobo: 100_000_000,
    tagline: 'For larger organisations with many branches.',
    items: ['Everything in Business', 'Unlimited branches', 'Custom roles & scopes', 'Cloud phone & call reviews (coming soon)', 'Priority support'],
  },
];

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
