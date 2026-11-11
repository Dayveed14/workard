import { useSearchParams } from 'react-router-dom';
import PageHeader from '../../../components/PageHeader.jsx';
import Tabs from '../../../components/Tabs.jsx';
import { useApi } from '../../../hooks/useApi.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { MyMoneyRequests, Approvals, Payouts } from './MoneyRequests.jsx';
import { MyFeedback, FeedbackInbox } from './Feedback.jsx';
import Resignation from './Resignation.jsx';
import '../offboarding/Offboarding.css';
import './Requests.css';

// Requests: salary advances & loans (repaid through payroll) and feedback / complaints / suggestions
export default function Requests() {
  const { employee, role, can, subscription } = useAuth();
  const withHr = subscription?.features.includes('hr');
  const [params, setParams] = useSearchParams();
  const withPayroll = subscription?.features.includes('payroll');
  // Line managers see "Approvals" when someone who reports to them has asked for something
  const { data: approvals, reload: reloadApprovals } = useApi(withPayroll && employee ? '/api/requests?view=approvals' : null);

  const tabs = [
    withPayroll && employee && { id: 'money', label: 'Advances & loans' },
    { id: 'feedback', label: 'Feedback' },
    withPayroll && (can('requests.approve') || approvals?.length > 0) && { id: 'approvals', label: 'Approvals', count: approvals?.filter((r) => r.canDecide).length },
    withPayroll && can('payroll.manage') && { id: 'payouts', label: 'Pay outs' },
    can('feedback.manage') && { id: 'feedback-inbox', label: 'Staff feedback' },
    withHr && employee && !role?.isOwner && { id: 'resignation', label: 'Resignation' },
  ].filter(Boolean);
  const tab = tabs.some((t) => t.id === params.get('tab')) ? params.get('tab') : tabs[0].id;

  return (
    <div className="req">
      <PageHeader title="Requests" subtitle="Salary advances, staff loans, feedback for the company — and resigning." />
      <Tabs tabs={tabs} active={tab} onChange={(id) => setParams({ tab: id })} />
      {tab === 'money' && <MyMoneyRequests />}
      {tab === 'feedback' && <MyFeedback />}
      {tab === 'approvals' && <Approvals data={approvals || []} reload={reloadApprovals} />}
      {tab === 'payouts' && <Payouts />}
      {tab === 'feedback-inbox' && <FeedbackInbox />}
      {tab === 'resignation' && <Resignation />}
    </div>
  );
}
