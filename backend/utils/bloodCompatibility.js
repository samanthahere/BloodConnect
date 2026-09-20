// Recipient blood group -> donor groups that can give them blood.
// Simplified rule for this project, not medical advice.
export const COMPATIBLE_DONORS = {
  'O-': ['O-'],
  'O+': ['O+', 'O-'],
  'A-': ['A-', 'O-'],
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'AB+': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-'],
};

export const DONATION_GAP_DAYS = 90;

// A donor is eligible if their last donation was on or before this date.
export function eligibleCutoffDate(today = new Date()) {
  const d = new Date(today);
  d.setUTCDate(d.getUTCDate() - DONATION_GAP_DAYS);
  return d.toISOString().slice(0, 10);
}