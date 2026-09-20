import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="page">
      <h1>Find blood donors near you</h1>
      <p>
        BloodConnect connects people who need blood with eligible donors in
        their district.
      </p>
      {!user && (
        <p>
          <Link to="/register" className="btn">Get started</Link>
        </p>
      )}
    </div>
  );
}