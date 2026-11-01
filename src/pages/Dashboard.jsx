import { useNavigate } from 'react-router-dom';
import { FileText, LogOut, Receipt, ShoppingBag, UserPlus } from 'lucide-react';
import Logo from '../components/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import './Dashboard.css';

// Placeholder until the real app shell is built — proves the JWT session works end to end
export default function Dashboard() {
  const { user, business, role, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const firstName = user?.fullName?.split(' ')[0];

  return (
    <div className="dash">
      <header className="dash__bar">
        <Logo size={26} />
        <div className="dash__user">
          <span>
            <strong>{business?.name}</strong>
            <small>{role} · {business?.plan} plan</small>
          </span>
          <button type="button" className="btn btn--outline btn--sm" onClick={onLogout}>
            <LogOut size={16} /> Log out
          </button>
        </div>
      </header>

      <main className="container dash__main">
        <h1>Welcome, {firstName} 👋</h1>
        <p>Your account is ready. What would you like to do first?</p>

        <div className="dash__actions">
          <button type="button" className="dash__action"><FileText size={22} /> Create an invoice</button>
          <button type="button" className="dash__action"><ShoppingBag size={22} /> Record a sale</button>
          <button type="button" className="dash__action"><Receipt size={22} /> Record an expense</button>
          <button type="button" className="dash__action"><UserPlus size={22} /> Add a customer</button>
        </div>
      </main>
    </div>
  );
}
