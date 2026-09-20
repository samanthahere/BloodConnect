import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

export default function DonorRequests() {
  const [requests, setRequests] = useState(null);
  const [eligible, setEligible] = useState(true);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const data = await api('/api/requests/open');
        setEligible(data.eligible);
        setRequests(data.requests);
        setNeedsProfile(false);
      } catch (err) {
        if (err.message === 'Create your donor profile first') {
          setNeedsProfile(true);
        } else {
          setError(err.message);
        }
      }
    }
    load();
  }, [refresh]);

  async function respond(id, status) {
    setError('');
    try {
      await api(`/api/requests/${id}/respond`, {
        method: 'POST',
        body: { status },
      });
      setRefresh((n) => n + 1);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page">
      <h1>Requests you can help with</h1>
      <p className="hint">
        Only requests that match your blood group and district are shown. When
        you accept, the requester can see your phone number.
      </p>

      {error && <p className="error">{error}</p>}

      {needsProfile && (
        <p className="info">
          Create your <Link to="/profile">donor profile</Link> first to see
          matching requests.
        </p>
      )}

      {!needsProfile && !eligible && (
        <p className="info">
          You are not eligible to donate right now. This happens if you marked
          yourself unavailable or donated in the last 90 days.
        </p>
      )}

      {!needsProfile && eligible && requests && requests.length === 0 && (
        <p>No open requests match you right now.</p>
      )}

      {requests &&
        requests.map((r) => (
          <div className="request" key={r.id}>
            <div className="request-head">
              <div className="badge">{r.blood_group}</div>
              <div>
                <strong>{r.hospital}</strong>
                <div>
                  {r.district} · {r.units_needed} bag(s) · needed by{' '}
                  {r.needed_by.slice(0, 10)}
                </div>
              </div>
              {r.my_response && (
                <span className={`status status-${r.my_response}`}>
                  {r.my_response}
                </span>
              )}
            </div>

            <div className="actions">
              <button
                disabled={r.my_response === 'accepted'}
                onClick={() => respond(r.id, 'accepted')}
              >
                {r.my_response === 'accepted' ? 'Accepted' : 'Accept'}
              </button>
              <button
                className="secondary"
                disabled={r.my_response === 'declined'}
                onClick={() => respond(r.id, 'declined')}
              >
                {r.my_response === 'accepted' ? 'Withdraw' : 'Decline'}
              </button>
            </div>
          </div>
        ))}
    </div>
  );
}