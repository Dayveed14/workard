import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useSeo } from './seo/useSeo.js';
import ProtectedRoute, { GuestRoute, RequireFeature, RequirePermission } from './components/ProtectedRoute.jsx';
import AppLayout from './components/AppLayout.jsx';

// Public pages
import Privacy from './pages/Privacy.jsx';
import Blog from './pages/Blog.jsx';
import BlogPost from './pages/BlogPost.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import AcceptInvite from './pages/AcceptInvite.jsx';
import NotFound from './pages/NotFound.jsx';

// App pages (logged in)
import Dashboard from './pages/app/Dashboard.jsx';
import Employees from './pages/app/Employees.jsx';
import EmployeeForm from './pages/app/EmployeeForm.jsx';
import EmployeeProfile from './pages/app/EmployeeProfile.jsx';
import Attendance from './pages/app/Attendance.jsx';
import Leave from './pages/app/Leave.jsx';
import Settings from './pages/app/settings/Settings.jsx';
import Customers from './pages/app/crm/Customers.jsx';
import CustomerProfile from './pages/app/crm/CustomerProfile.jsx';
import Invoices from './pages/app/invoices/Invoices.jsx';
import InvoiceForm from './pages/app/invoices/InvoiceForm.jsx';
import InvoiceDetail from './pages/app/invoices/InvoiceDetail.jsx';
import Finance from './pages/app/finance/Finance.jsx';
import PublicInvoice from './pages/PublicInvoice.jsx';
import Payroll from './pages/app/payroll/Payroll.jsx';
import PayrollRun from './pages/app/payroll/PayrollRun.jsx';
import MyPayslips from './pages/app/payroll/MyPayslips.jsx';
import PayslipView from './pages/app/payroll/PayslipView.jsx';
import Tasks from './pages/app/tasks/Tasks.jsx';
import TaskDetail from './pages/app/tasks/TaskDetail.jsx';
import Reviews from './pages/app/reviews/Reviews.jsx';
import Performance from './pages/app/performance/Performance.jsx';
import ReviewDetail from './pages/app/reviews/ReviewDetail.jsx';
import Announcements from './pages/app/announcements/Announcements.jsx';
import Requests from './pages/app/requests/Requests.jsx';
import { PrivateFeedback } from './pages/app/requests/Feedback.jsx';
import Resources from './pages/app/resources/Resources.jsx';
import ResourceDetail from './pages/app/resources/ResourceDetail.jsx';
import Projects from './pages/app/projects/Projects.jsx';
import ProjectDetail from './pages/app/projects/ProjectDetail.jsx';
import Meetings from './pages/app/meetings/Meetings.jsx';
import MeetingDetail from './pages/app/meetings/MeetingDetail.jsx';
import Billing from './pages/app/billing/Billing.jsx';
import BillingCallback from './pages/app/billing/BillingCallback.jsx';
import Onboarding from './pages/app/onboarding/Onboarding.jsx';
import OnboardingDetail from './pages/app/onboarding/OnboardingDetail.jsx';
import Offboarding from './pages/app/offboarding/Offboarding.jsx';
import OffboardingDetail from './pages/app/offboarding/OffboardingDetail.jsx';

// The video room loads LiveKit (large) only when someone joins a meeting
const MeetingRoom = lazy(() => import('./pages/app/meetings/MeetingRoom.jsx'));
const AdminApp = lazy(() => import('./pages/admin/AdminApp.jsx'));

export default function App() {
  useSeo();

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:slug" element={<BlogPost />} />
      {/* Workard super admins — its own log-in and its own code bundle */}
      <Route path="/admin/*" element={<Suspense fallback={<div className="page-loader"><span className="page-loader__spinner" /></div>}><AdminApp /></Suspense>} />
      <Route path="/invite/:token" element={<AcceptInvite />} />
      <Route path="/i/:token" element={<PublicInvoice />} />
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>
      <Route path="/register" element={<Navigate to="/signup" replace />} />

      {/* Logged in — inside the sidebar layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/meetings" element={<Meetings />} />
          <Route path="/meetings/:id" element={<MeetingDetail />} />
          <Route path="/meetings/:id/room" element={<Suspense fallback={<div className="page-loader"><span className="page-loader__spinner" /></div>}><MeetingRoom /></Suspense>} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/resources/:id" element={<ResourceDetail />} />
          <Route path="/feedback/:token" element={<PrivateFeedback />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/leave" element={<Leave />} />
          <Route
            path="/employees"
            element={<RequirePermission anyOf={['employees.view']}><Employees /></RequirePermission>}
          />
          <Route
            path="/employees/new"
            element={<RequirePermission anyOf={['employees.create']}><EmployeeForm /></RequirePermission>}
          />
          <Route path="/employees/:id" element={<EmployeeProfile />} />
          <Route
            path="/employees/:id/edit"
            element={<RequirePermission anyOf={['employees.edit']}><EmployeeForm /></RequirePermission>}
          />

          {/* Phase 2 */}
          <Route path="/customers" element={<RequireFeature feature="crm"><RequirePermission anyOf={['customers.view']}><Customers /></RequirePermission></RequireFeature>} />
          <Route path="/customers/:id" element={<RequireFeature feature="crm"><RequirePermission anyOf={['customers.view']}><CustomerProfile /></RequirePermission></RequireFeature>} />
          <Route path="/invoices" element={<RequireFeature feature="invoices"><RequirePermission anyOf={['invoices.view']}><Invoices /></RequirePermission></RequireFeature>} />
          <Route path="/invoices/new" element={<RequireFeature feature="invoices"><RequirePermission anyOf={['invoices.manage']}><InvoiceForm /></RequirePermission></RequireFeature>} />
          <Route path="/invoices/:id" element={<RequireFeature feature="invoices"><RequirePermission anyOf={['invoices.view']}><InvoiceDetail /></RequirePermission></RequireFeature>} />
          <Route path="/invoices/:id/edit" element={<RequireFeature feature="invoices"><RequirePermission anyOf={['invoices.manage']}><InvoiceForm /></RequirePermission></RequireFeature>} />
          <Route path="/finance" element={<RequireFeature feature="finance"><RequirePermission anyOf={['finance.view']}><Finance /></RequirePermission></RequireFeature>} />

          {/* Phase 3 */}
          <Route path="/payroll" element={<RequireFeature feature="payroll"><RequirePermission anyOf={['payroll.view']}><Payroll /></RequirePermission></RequireFeature>} />
          <Route path="/payroll/:id" element={<RequireFeature feature="payroll"><RequirePermission anyOf={['payroll.view']}><PayrollRun /></RequirePermission></RequireFeature>} />
          <Route path="/payslips" element={<RequireFeature feature="payroll"><MyPayslips /></RequireFeature>} />
          <Route path="/payslips/:id" element={<RequireFeature feature="payroll"><PayslipView /></RequireFeature>} />

          {/* Plans & onboarding */}
          <Route path="/billing" element={<Billing />} />
          <Route path="/billing/callback" element={<BillingCallback />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/onboarding/:id" element={<OnboardingDetail />} />
          <Route path="/offboarding" element={<Offboarding />} />
          <Route path="/offboarding/:id" element={<OffboardingDetail />} />

          {/* Phase 3B — everyone has their own tasks & reviews; access is checked by the API */}
          <Route path="/tasks" element={<RequireFeature feature="tasks"><Tasks /></RequireFeature>} />
          <Route path="/tasks/:id" element={<RequireFeature feature="tasks"><TaskDetail /></RequireFeature>} />
          <Route path="/projects" element={<RequireFeature feature="tasks"><Projects /></RequireFeature>} />
          <Route path="/projects/:id" element={<RequireFeature feature="tasks"><ProjectDetail /></RequireFeature>} />
          <Route path="/reviews" element={<RequireFeature feature="reviews"><Reviews /></RequireFeature>} />
          <Route path="/performance" element={<RequirePermission anyOf={['reviews.view']}><RequireFeature feature="reviews"><Performance /></RequireFeature></RequirePermission>} />
          <Route path="/reviews/:id" element={<RequireFeature feature="reviews"><ReviewDetail /></RequireFeature>} />

          <Route
            path="/settings"
            element={
              <RequirePermission anyOf={['organization.manage', 'roles.manage', 'audit.view', 'finance.manage', 'payroll.manage', 'payroll.approve', 'reviews.setup']}>
                <Settings />
              </RequirePermission>
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
