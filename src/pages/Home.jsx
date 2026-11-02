import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock,
  Contact,
  FileText,
  LayoutDashboard,
  MapPin,
  Phone,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
  Wifi,
  Zap,
  Banknote,
  ListChecks,
} from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import { PLANS } from '../config/plans.js';
import { formatMoney } from '../utils/format.js';
import Footer from '../components/Footer.jsx';
import Logo from '../components/Logo.jsx';
import { faq } from '../data/homeContent.js';
import './Home.css';

// A day in a business run on Workard
const steps = [
  { icon: Clock, title: 'Staff clock in', text: 'Verified by office location and Wi-Fi.' },
  { icon: Users, title: 'Manage your team', text: 'Profiles, leave, documents and tasks.' },
  { icon: Contact, title: 'Serve customers', text: 'Every customer, enquiry and follow-up.' },
  { icon: Phone, title: 'Handle calls', text: 'Business calls, recorded and reviewed.' },
  { icon: FileText, title: 'Invoice & get paid', text: 'Track paid, unpaid and overdue.' },
  { icon: TrendingUp, title: 'See performance', text: 'People, money and service in one view.' },
];

const features = [
  {
    icon: Users,
    color: 'blue',
    title: 'Employee & HR management',
    text: 'One home for every employee: profiles, job details, documents, leave and employment history — organised by branch, department and team.',
    points: ['Staff profiles & documents', 'Leave requests & approvals', 'Monthly performance reviews'],
  },
  {
    icon: Clock,
    color: 'green',
    title: 'Verified attendance',
    text: 'Staff clock in and out from their phone. Workard checks they are really at the office, flags anything unusual and tracks hours and lateness.',
    points: ['Location + office Wi-Fi checks', 'Late & absent tracking', 'Daily register for managers'],
  },
  {
    icon: ShieldCheck,
    color: 'blue',
    title: 'Roles & access',
    text: 'Owner, HR, finance, operations, supervisors and staff each see only what they need — down to their own team or branch.',
    points: ['Built-in & custom roles', 'Team, department or branch scope', 'Full activity log'],
  },
  {
    icon: FileText,
    color: 'green',
    title: 'Invoicing & finance',
    text: 'Create and send invoices, record income and expenses, and see revenue, costs and profit every month.',
    points: ['Send by email or WhatsApp', 'Paid, unpaid & overdue', 'Monthly profit & expenses'],
  },
  {
    icon: ListChecks,
    color: 'blue',
    title: 'Tasks & performance reviews',
    text: 'Give out work with due dates and checklists, set tasks that repeat every week or month, and run monthly reviews backed by real attendance and task numbers.',
    points: ['Tasks, checklists & comments', 'Repeating tasks & morning reminders', 'Reviews with self-assessment'],
  },
  {
    icon: Banknote,
    color: 'green',
    title: 'Payroll',
    text: 'Salaries, PAYE, pension and NHF worked out under the 2026 tax rules, approved by a second person, then paid by bank upload or Paystack — and booked straight into your expenses.',
    points: ['2026 PAYE bands & rent relief', 'Maker-checker approval', 'Payslips emailed to staff'],
  },
  {
    icon: Contact,
    color: 'blue',
    title: 'Customers (CRM)',
    text: 'Customer profiles, leads and enquiries, linked to their invoices, payments and call history — and assigned to your staff.',
    points: ['Leads & prospects', 'Complaints & follow-ups', 'Account owners'],
  },
  {
    icon: Phone,
    color: 'green',
    title: 'Cloud business phone',
    text: 'Make and receive business calls in Workard, route them to the right team, and let managers review calls and coach staff.',
    points: ['Calls to teams or staff', 'Recording with consent', 'Flag & review calls'],
    soon: true,
  },
];

const insights = [
  { tone: 'alert', icon: Bell, text: '3 staff clocked in outside the office today.', action: 'Review' },
  { tone: 'warn', icon: Clock, text: 'Lateness in Field Sales is up 18% this month.', action: 'View team' },
  { tone: 'info', icon: CalendarDays, text: '4 leave requests are waiting for approval.', action: 'Approve' },
  { tone: 'info', icon: UserCheck, text: '42 of 48 employees are at work right now.', action: 'Register' },
];

// Pricing comes from the same list the sign-up page uses (src/config/plans.js)
const plans = PLANS.map((p) => ({
  ...p,
  price: formatMoney(p.priceKobo, { decimals: false }),
  period: 'per year',
  text: p.tagline,
  cta: `Choose ${p.name}`,
}));

function DashboardPreview() {
  return (
    <div className="preview" aria-hidden="true">
      <div className="preview__window">
        <aside className="preview__sidebar">
          <Logo variant="light" size={14} />
          <ul>
            <li className="is-active"><LayoutDashboard size={12} /> Dashboard</li>
            <li><Clock size={12} /> Attendance</li>
            <li><CalendarDays size={12} /> Leave</li>
            <li><Users size={12} /> Employees</li>
            <li><FileText size={12} /> Invoices</li>
            <li><ListChecks size={12} /> Tasks</li>
            <li><Banknote size={12} /> Payroll</li>
            <li><Phone size={12} /> Calls</li>
            <li><BarChart3 size={12} /> Reports</li>
          </ul>
        </aside>
        <div className="preview__main">
          <p className="preview__heading">Today at a glance</p>
          <div className="preview__stats">
            <div className="preview__stat">
              <span>Present</span>
              <strong>42 / 48</strong>
              <em className="up">88% attendance</em>
            </div>
            <div className="preview__stat">
              <span>Late</span>
              <strong>3</strong>
              <em className="neutral">Field Sales</em>
            </div>
            <div className="preview__stat">
              <span>Outstanding</span>
              <strong>₦420,000</strong>
              <em className="muted">3 invoices</em>
            </div>
          </div>
          <div className="preview__chart">
            <span className="preview__chart-title">Attendance this month</span>
            <svg viewBox="0 0 300 90" preserveAspectRatio="none">
              <defs>
                <linearGradient id="previewFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#2563EB" stopOpacity="0.25" />
                  <stop offset="1" stopColor="#2563EB" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0 40 L30 34 L60 44 L90 30 L120 36 L150 26 L180 30 L210 20 L240 24 L270 14 L300 12 L300 90 L0 90 Z" fill="url(#previewFill)" />
              <path d="M0 40 L30 34 L60 44 L90 30 L120 36 L150 26 L180 30 L210 20 L240 24 L270 14 L300 12" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>

      <div className="preview__toast preview__toast--paid">
        <CheckCircle2 size={18} />
        <div>
          <strong>Chidi clocked in · 07:56</strong>
          <span>Wuse Office · location & Wi-Fi verified</span>
        </div>
      </div>
      <div className="preview__toast preview__toast--wa">
        <CalendarDays size={18} />
        <div>
          <strong>Leave approved</strong>
          <span>Amaka · 3 days annual leave</span>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        {/* HERO */}
        <section className="hero">
          <div className="hero__glow" aria-hidden="true" />
          <div className="container hero__grid">
            <div className="hero__copy">
              <p className="eyebrow eyebrow--light">
                <Zap size={14} /> The operations centre for your business
              </p>
              <h1>
                Run your business.
                <br />
                <span className="text-gradient">Grow smarter.</span>
              </h1>
              <p className="hero__lead">
                From the moment your staff resume work to managing customers, handling calls, issuing invoices and
                reviewing performance — Workard puts your whole operation in one simple platform.
              </p>
              <div className="hero__ctas">
                <Link to="/signup" className="btn btn--success btn--lg">
                  Get started <ArrowRight size={18} />
                </Link>
                <a href="#how-it-works" className="btn btn--ghost-light btn--lg">
                  See how it works
                </a>
              </div>
              <ul className="hero__trust">
                <li><CheckCircle2 size={16} /> For small and large businesses</li>
                <li><CheckCircle2 size={16} /> Multiple branches & teams</li>
                <li><CheckCircle2 size={16} /> Works on any phone</li>
              </ul>
            </div>
            <DashboardPreview />
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="section workflow">
          <div className="container">
            <div className="section__head">
              <p className="eyebrow">How it works</p>
              <h2>One platform for the whole working day</h2>
              <p>
                Stop switching between an HR app, a spreadsheet, a phone line and an invoicing tool. Everything your
                business does in a day happens — and is recorded — in Workard.
              </p>
            </div>
            <ol className="workflow__steps">
              {steps.map(({ icon: Icon, title, text }, i) => (
                <li key={title} className="workflow__step">
                  <span className="workflow__num">{i + 1}</span>
                  <span className="workflow__icon"><Icon size={22} /></span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="section section--tinted">
          <div className="container">
            <div className="section__head">
              <p className="eyebrow">Features</p>
              <h2>Everything you need to run operations</h2>
              <p>Built for Nigerian businesses — from a 5-person shop to a company with branches across the country.</p>
            </div>
            <div className="features">
              {features.map(({ icon: Icon, color, title, text, points, soon }) => (
                <article key={title} className="feature">
                  <div className="feature__top">
                    <span className={`feature__icon feature__icon--${color}`}><Icon size={22} /></span>
                    {soon && <span className="feature__soon">Coming soon</span>}
                  </div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                  <ul>
                    {points.map((p) => (
                      <li key={p}><CheckCircle2 size={16} /> {p}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* INSIGHTS */}
        <section className="section insights">
          <div className="container insights__grid">
            <div className="insights__copy">
              <p className="eyebrow">Business dashboard</p>
              <h2>Know what’s happening, right now</h2>
              <p>
                Each organisation gets its own live dashboard. Managers see their own people; owners see the whole
                business — with a button to act on everything.
              </p>
              <ul className="check-list">
                <li><CheckCircle2 size={18} /> Who’s at work, late or on leave</li>
                <li><CheckCircle2 size={18} /> What needs your approval</li>
                <li><CheckCircle2 size={18} /> How each team is performing</li>
              </ul>
            </div>
            <ul className="insights__cards">
              {insights.map(({ tone, icon: Icon, text, action }) => (
                <li key={text} className={`insight insight--${tone}`}>
                  <span className="insight__icon"><Icon size={18} /></span>
                  <p>{text}</p>
                  <span className="insight__action">{action} <ArrowRight size={14} /></span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CLOCK-IN SPOTLIGHT */}
        <section className="section section--tinted">
          <div className="container spotlight">
            <div className="spotlight__phone" aria-hidden="true">
              <div className="spotlight__screen">
                <div className="spotlight__bar">
                  <Logo variant="light" size={16} />
                </div>
                <div className="spotlight__clock">
                  <span>Monday, 2 November</span>
                  <strong>07:56</strong>
                  <small>Wuse Office · 08:00–17:00</small>
                </div>
                <div className="spotlight__checks">
                  <span><MapPin size={14} /> At the office · 24 m</span>
                  <span><Wifi size={14} /> Office Wi-Fi</span>
                </div>
                <div className="spotlight__btn">Clocked in ✓</div>
              </div>
            </div>
            <div>
              <p className="eyebrow">Verified clock-in</p>
              <h2>Know your team is really at work</h2>
              <p>
                Staff clock in with one tap. Workard checks they’re inside the office area and on the office internet,
                then records the time, lateness and hours worked — automatically.
              </p>
              <ul className="check-list">
                <li><MapPin size={18} /> GPS location checked against each branch</li>
                <li><Wifi size={18} /> Office Wi-Fi (internet IP) check</li>
                <li><ShieldCheck size={18} /> Unusual clock-ins flagged for review, never lost</li>
              </ul>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="section">
          <div className="container">
            <div className="section__head">
              <p className="eyebrow">Pricing</p>
              <h2>One yearly price. Grow into it.</h2>
              <p>Simple plans for businesses of every size.</p>
            </div>
            <div className="plans">
              {plans.map((p) => (
                <article key={p.name} className={`plan ${p.featured ? 'plan--featured' : ''}`}>
                  {p.featured && <span className="plan__badge">Most popular</span>}
                  <h3>{p.name}</h3>
                  <p className="plan__price">{p.price}</p>
                  <p className="plan__period">{p.period}</p>
                  <p className="plan__text">{p.text}</p>
                  <ul>
                    {p.items.map((i) => (
                      <li key={i}><CheckCircle2 size={16} /> {i}</li>
                    ))}
                  </ul>
                  <Link to={`/signup?plan=${p.id}`} className={`btn btn--block ${p.featured ? 'btn--primary' : 'btn--outline'}`}>
                    {p.cta}
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="section section--tinted">
          <div className="container faq">
            <div className="section__head">
              <p className="eyebrow">FAQ</p>
              <h2>Questions business owners ask</h2>
            </div>
            <div className="faq__list">
              {faq.map((f) => (
                <details key={f.q} className="faq__item">
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta">
          <div className="container cta__inner">
            <h2>Ready to run your business smarter?</h2>
            <p>Set up your organisation and invite your team in minutes.</p>
            <Link to="/signup" className="btn btn--success btn--lg">
              Get started <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
