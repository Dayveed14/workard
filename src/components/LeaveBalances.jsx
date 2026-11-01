import './LeaveBalances.css';

// Cards showing remaining days per leave type
export default function LeaveBalances({ balances }) {
  return (
    <div className="leave-balances">
      {balances.map((b) => (
        <div key={b.leaveTypeId} className="leave-balances__card">
          <span className="leave-balances__name">{b.name}</span>
          <strong>
            {b.remaining}
            <small> / {b.entitled} days</small>
          </strong>
          <div className="leave-balances__bar">
            <i style={{ width: `${b.entitled ? (b.used / b.entitled) * 100 : 0}%` }} />
          </div>
          <span className="leave-balances__used">
            {b.used} used{!b.isPaid && ' · unpaid'}
          </span>
        </div>
      ))}
    </div>
  );
}
