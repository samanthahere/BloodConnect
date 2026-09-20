import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { BLOOD_GROUPS, DISTRICTS } from '../constants.js';

const today = () => new Date().toLocaleDateString('en-CA');

export default function DonorProfile() {
  const [form, setForm] = useState({
    blood_group: '',
    district: '',
    area: '',
    last_donated_at: '',
    is_available: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        const { profile } = await api('/api/donors/me');
        setForm({
          blood_group: profile.blood_group,
          district: profile.district,
          area: profile.area || '',
          last_donated_at: profile.last_donated_at
            ? profile.last_donated_at.slice(0, 10)
            : '',
          is_available: profile.is_available,
        });
      } catch (err) {
        // No profile yet is fine: we just show an empty form
        if (err.message !== 'Donor profile not found') {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  function updateField(e) {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);
    try {
      await api('/api/donors/me', { method: 'PUT', body: form });
      setMessage('Profile saved.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDonatedToday() {
    setError('');
    setMessage('');
    try {
      const { profile } = await api('/api/donors/me/donated', { method: 'POST' });
      setForm({ ...form, last_donated_at: profile.last_donated_at.slice(0, 10) });
      setMessage('Thank you for donating! Your last donation date is now today.');
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="page narrow">
      <h1>My donor profile</h1>
      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}

      <form onSubmit={handleSubmit}>
        <label>
          Blood group
          <select
            name="blood_group"
            value={form.blood_group}
            onChange={updateField}
            required
          >
            <option value="">Select...</option>
            {BLOOD_GROUPS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </label>

        <label>
          District
          <select
            name="district"
            value={form.district}
            onChange={updateField}
            required
          >
            <option value="">Select...</option>
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </label>

        <label>
          Area (optional)
          <input name="area" value={form.area} onChange={updateField} />
        </label>

        <label>
          Last donation date (leave empty if never)
          <input
            type="date"
            name="last_donated_at"
            value={form.last_donated_at}
            onChange={updateField}
            max={today()}
          />
        </label>

        <label className="checkbox">
          <input
            type="checkbox"
            name="is_available"
            checked={form.is_available}
            onChange={updateField}
          />
          I am available to donate
        </label>

        <button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save profile'}
        </button>
      </form>

      <hr />
      <button type="button" className="secondary" onClick={handleDonatedToday}>
        I donated blood today
      </button>
      <p className="hint">
        After you donate, you will not appear in donor searches for 90 days.
        Save your profile first, then use this button.
      </p>
    </div>
  );
}