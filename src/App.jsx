import { Navigate, Route, Routes } from 'react-router-dom';
import { useSeo } from './seo/useSeo.js';
import ProtectedRoute, { GuestRoute, RequirePermission } from './components/ProtectedRoute.jsx';
import AppLayout from './components/AppLayout.jsx';

// Public pages
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
import ReviewDetail from './pages/app/reviews/ReviewDetail.jsx';

export default function App() {
  useSeo();

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
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
          <Route path="/customers" element={<RequirePermission anyOf={['customers.view']}><Customers /></RequirePermission>} />
          <Route path="/customers/:id" element={<RequirePermission anyOf={['customers.view']}><CustomerProfile /></RequirePermission>} />
          <Route path="/invoices" element={<RequirePermission anyOf={['invoices.view']}><Invoices /></RequirePermission>} />
          <Route path="/invoices/new" element={<RequirePermission anyOf={['invoices.manage']}><InvoiceForm /></RequirePermission>} />
          <Route path="/invoices/:id" element={<RequirePermission anyOf={['invoices.view']}><InvoiceDetail /></RequirePermission>} />
          <Route path="/invoices/:id/edit" element={<RequirePermission anyOf={['invoices.manage']}><InvoiceForm /></RequirePermission>} />
          <Route path="/finance" element={<RequirePermission anyOf={['finance.view']}><Finance /></RequirePermission>} />

          {/* Phase 3 */}
          <Route path="/payroll" element={<RequirePermission anyOf={['payroll.view']}><Payroll /></RequirePermission>} />
          <Route path="/payroll/:id" element={<RequirePermission anyOf={['payroll.view']}><PayrollRun /></RequirePermission>} />
          <Route path="/payslips" element={<MyPayslips />} />
          <Route path="/payslips/:id" element={<PayslipView />} />

          {/* Phase 3B — everyone has their own tasks & reviews; access is checked by the API */}
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/tasks/:id" element={<TaskDetail />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/reviews/:id" element={<ReviewDetail />} />

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
