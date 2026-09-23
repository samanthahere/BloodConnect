import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { api } from '../api.js';
import { BLOOD_GROUPS, DISTRICTS } from '../constants.js';
import { DISTRICT_COORDS } from '../districtCoordinates.js';

// Spread pins slightly apart so donors in the same district don't stack exactly
function jitter([lat, lng], index) {
  const angle = index * 0.9;
  const offset = 0.01 * index;
  return [lat + Math.sin(angle) * offset, lng + Math.cos(angle) * offset];
}

export default function FindDonors() {
  const [bloodGroup, setBloodGroup] = useState('');
  const [district, setDistrict] = useState('');
  const [donors, setDonors] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const params = new URLSearchParams({ blood_group: bloodGroup, district });
      const data = await api(`/api/donors/search?${params}`);
      setDonors(data.donors);
    } catch (err) {
      setError(err.message);
      setDonors(null);
    } finally {
      setLoading(false);
    }
  }

  const mapCenter = district && DISTRICT_COORDS[district]
    ? DISTRICT_COORDS[district]
    : [23.8103, 90.4125]; // Dhaka, default center

  return (
    <div className="page">
      <h1>Find blood donors</h1>
      <p className="hint">
        Select the blood group the patient needs. We show eligible donors who
        can safely give to that patient. A donor's phone number is shared only
        after they accept your blood request.
      </p>

      {error && <p className="error">{error}</p>}

      <form className="search-form" onSubmit={handleSearch}>
        <label>
          Patient's blood group
          <select
            value={bloodGroup}
            onChange={(e) => setBloodGroup(e.target.value)}
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
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            required
          >
            <option value="">Select...</option>
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </label>

        <button type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {donors && donors.length === 0 && (
        <p>No eligible donors found for this search yet.</p>
      )}

      {donors && donors.length > 0 && (
        <>
          <div className="map-wrap">
            <MapContainer center={mapCenter} zoom={11} scrollWheelZoom={false}>
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {donors.map((d, i) => {
                const base = DISTRICT_COORDS[d.district];
                if (!base) return null;
                return (
                  <Marker key={d.id} position={jitter(base, i)}>
                    <Popup>
                      <strong>{d.name}</strong>
                      <br />
                      {d.blood_group} &middot; {d.area || d.district}
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>

          <div className="cards">
            {donors.map((d) => (
              <div className="card" key={d.id}>
                <div className="badge">{d.blood_group}</div>
                <div>
                  <strong>{d.name}</strong>
                  <div>
                    {d.area ? `${d.area}, ` : ''}
                    {d.district}
                  </div>
                  <small>
                    {d.last_donated_at
                      ? `Last donated: ${d.last_donated_at.slice(0, 10)}`
                      : 'Has not donated before'}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}