import { useSearchParams } from 'react-router-dom';
import PageHeader from '../../../components/PageHeader.jsx';
import Tabs from '../../../components/Tabs.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import GeneralSettings from './GeneralSettings.jsx';
import BranchesSettings from './BranchesSettings.jsx';
import StructureSettings from './StructureSettings.jsx';
import LeaveTypesSettings from './LeaveTypesSettings.jsx';
import RolesSettings from './RolesSettings.jsx';
import FinanceSettings from './FinanceSettings.jsx';
import PayrollSettings from './PayrollSettings.jsx';
import ReviewSettings from './ReviewSettings.jsx';
import ActivityLog from './ActivityLog.jsx';
import './Settings.css';

// Each tab only shows if the user has the permission for it
const TABS = [
  { id: 'general', label: 'Organisation', permission: 'organization.manage', Component: GeneralSettings },
  { id: 'branches', label: 'Branches & clock-in', permission: 'organization.manage', Component: BranchesSettings },
  { id: 'structure', label: 'Departments & teams', permission: 'organization.manage', Component: StructureSettings },
  { id: 'leave-types', label: 'Leave types', permission: 'organization.manage', Component: LeaveTypesSettings },
  { id: 'finance', label: 'Invoicing & finance', permission: 'finance.manage', feature: 'invoices', Component: FinanceSettings },
  { id: 'payroll', label: 'Payroll', permission: ['payroll.manage', 'payroll.approve'], feature: 'payroll', Component: PayrollSettings },
  { id: 'reviews', label: 'Reviews', permission: 'reviews.setup', feature: 'reviews', Component: ReviewSettings },
  { id: 'roles', label: 'Roles & permissions', permission: 'roles.manage', Component: RolesSettings },
  { id: 'activity', label: 'Activity log', permission: 'audit.view', Component: ActivityLog },
];

export default function Settings() {
  const { can, canAny, subscription } = useAuth();
  const [params, setParams] = useSearchParams();
  const tabs = TABS.filter((t) => (Array.isArray(t.permission) ? canAny(...t.permission) : can(t.permission)))
    .filter((t) => !t.feature || subscription?.features.includes(t.feature)); // only what the plan includes
  const active = tabs.find((t) => t.id === params.get('tab')) || tabs[0];

  return (
    <>
      <PageHeader title="Settings" subtitle="Set up your organisation, how clock-in works and who can do what." />
      <Tabs tabs={tabs} active={active?.id} onChange={(id) => setParams({ tab: id })} />
      {active && <active.Component />}
    </>
  );
}
