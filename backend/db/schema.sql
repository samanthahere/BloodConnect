CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE donor_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  blood_group VARCHAR(3) NOT NULL
    CHECK (blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  district VARCHAR(50) NOT NULL,
  area VARCHAR(100),
  last_donated_at DATE,
  is_available BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE blood_requests (
  id SERIAL PRIMARY KEY,
  requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blood_group VARCHAR(3) NOT NULL
    CHECK (blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  district VARCHAR(50) NOT NULL,
  hospital VARCHAR(150) NOT NULL,
  units_needed INTEGER NOT NULL CHECK (units_needed > 0),
  needed_by DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','fulfilled','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE request_responses (
  id SERIAL PRIMARY KEY,
  request_id INTEGER NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE,
  donor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','accepted','declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (request_id, donor_id)
);

CREATE INDEX idx_donor_search ON donor_profiles (blood_group, district);