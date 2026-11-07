import { Route, Routes } from 'react-router-dom';
import { AdminAuthProvider } from './AdminAuth.jsx';
import AdminLayout from './AdminLayout.jsx';
import AdminLogin from './AdminLogin.jsx';
import AdminSetup from './AdminSetup.jsx';
import AdminOverview from './AdminOverview.jsx';
import AdminCompanies from './AdminCompanies.jsx';
import AdminCompany from './AdminCompany.jsx';
import AdminUsers from './AdminUsers.jsx';
import AdminPayments from './AdminPayments.jsx';
import AdminPricing from './AdminPricing.jsx';
import AdminBlog from './AdminBlog.jsx';
import AdminBlogEditor from './AdminBlogEditor.jsx';
import AdminAnnouncements from './AdminAnnouncements.jsx';
import AdminDemos from './AdminDemos.jsx';
import AdminAdmins from './AdminAdmins.jsx';
import AdminLog from './AdminLog.jsx';
import NotFound from '../NotFound.jsx';

// Everything under /admin — loaded only when someone opens it (its own code bundle)
export default function AdminApp() {
  return (
    <AdminAuthProvider>
      <Routes>
        <Route path="login" element={<AdminLogin />} />
        <Route path="setup/:token" element={<AdminSetup />} />
        <Route element={<AdminLayout />}>
          <Route index element={<AdminOverview />} />
          <Route path="companies" element={<AdminCompanies />} />
          <Route path="companies/:id" element={<AdminCompany />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="pricing" element={<AdminPricing />} />
          <Route path="blog" element={<AdminBlog />} />
          <Route path="blog/new" element={<AdminBlogEditor />} />
          <Route path="blog/:id" element={<AdminBlogEditor />} />
          <Route path="announcements" element={<AdminAnnouncements />} />
          <Route path="demos" element={<AdminDemos />} />
          <Route path="admins" element={<AdminAdmins />} />
          <Route path="log" element={<AdminLog />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </AdminAuthProvider>
  );
}
