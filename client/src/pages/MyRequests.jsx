import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

export default function MyRequests() {
  const [requests, setRequests] = useState(null);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const data = await api('/api/requests/mine');
        setRequests(data.requests);
      } catch (err) {
        setError(err.message);
      }
    }
    load();
  }, [refresh]);

  async function updateStatus(id, status) {
    if (!window.confirm(`Mark this request as ${status}?`)) return;
    setError('');
    try {
      await api(`/api/requests/${id}/status`, {
        method: 'PATCH',
        body: { status },
      });
      setRefresh((n) => n + 1);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page">
      <h1>My blood requests</h1>
      {error && <p className="error">{error}</p>}

      {requests && requests.length === 0 && (
        <p>
          You have not posted any request yet.{' '}
          <Link to="/request/new">Request blood</Link>
        </p>
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
              <span className={`status status-${r.status}`}>{r.status}</span>
            </div>

            <div className="donors">
              <h4>Donors who accepted</h4>
              {r.accepted_donors.length === 0 ? (
                <p className="hint">No donor has accepted yet.</p>
              ) : (
                <ul>
                  {r.accepted_donors.map((d, i) => (
                    <li key={i}>
                      <strong>{d.name}</strong>
                      {d.area ? `, ${d.area}` : ''} ·{' '}
                      <a href={`tel:${d.phone}`}>{d.phone}</a>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {r.status === 'open' && (
              <div className="actions">
                <button onClick={() => updateStatus(r.id, 'fulfilled')}>
                  Mark fulfilled
                </button>
                <button
                  className="secondary"
                  onClick={() => updateStatus(r.id, 'cancelled')}
                >
                  Cancel request
                </button>
              </div>
            )}
          </div>
        ))}
    </div>
  );
}