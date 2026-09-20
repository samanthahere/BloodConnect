import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { BLOOD_GROUPS, DISTRICTS } from '../constants.js';

const today = () => new Date().toLocaleDateString('en-CA');

export default function NewRequest() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    blood_group: '',
    district: '',
    hospital: '',
    units_needed: 1,
    needed_by: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function updateField(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api('/api/requests', {
        method: 'POST',
        body: { ...form, units_needed: Number(form.units_needed) },
      });
      navigate('/my-requests');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page narrow">
      <h1>Request blood</h1>
      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <label>
          Patient's blood group
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
          Hospital
          <input
            name="hospital"
            value={form.hospital}
            onChange={updateField}
            required
          />
        </label>

        <label>
          Blood bags needed (1 to 10)
          <input
            type="number"
            name="units_needed"
            min="1"
            max="10"
            value={form.units_needed}
            onChange={updateField}
            required
          />
        </label>

        <label>
          Needed by
          <input
            type="date"
            name="needed_by"
            min={today()}
            value={form.needed_by}
            onChange={updateField}
            required
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? 'Posting...' : 'Post request'}
        </button>
      </form>

      <p className="hint">
        Eligible donors in this district who can give to this blood group will
        see your request. A donor's phone number is shown to you only after
        they accept.
      </p>
    </div>
  );
}