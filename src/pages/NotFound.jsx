import { Link } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import './NotFound.css';

export default function NotFound() {
  return (
    <main className="not-found">
      <Logo size={30} />
      <h1>Page not found</h1>
      <p>The page you’re looking for doesn’t exist or has moved.</p>
      <Link to="/" className="btn btn--primary">Back to home</Link>
    </main>
  );
}
