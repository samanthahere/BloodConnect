import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function Home() {
  const { user } = useAuth();

  return (
    <div>
      <section className="hero">
        <h1>Find blood donors near you</h1>
        <p>
          BloodConnect connects people who need blood with eligible donors in
          their district. Donor phone numbers stay private until a donor
          accepts your request.
        </p>
        <div className="hero-actions">
          {user ? (
            <>
              <Link to="/request/new" className="btn btn-light">
                Request blood
              </Link>
              <Link to="/find" className="btn btn-outline">
                Find donors
              </Link>
            </>
          ) : (
            <>
              <Link to="/register" className="btn btn-light">
                Get started
              </Link>
              <Link to="/login" className="btn btn-outline">
                Login
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="page">
        <h2>How it works</h2>
        <div className="steps">
          <div className="step">
            <span className="step-num">1</span>
            <h3>Post a request</h3>
            <p>Tell us the blood group, hospital, and when it is needed.</p>
          </div>
          <div className="step">
            <span className="step-num">2</span>
            <h3>Eligible donors respond</h3>
            <p>
              Only donors with a compatible blood group in your district, who
              have not donated in the last 90 days, see your request.
            </p>
          </div>
          <div className="step">
            <span className="step-num">3</span>
            <h3>Connect safely</h3>
            <p>When a donor accepts, you see their phone number. Not before.</p>
          </div>
        </div>
      </section>
    </div>
  );
}