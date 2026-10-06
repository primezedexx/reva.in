// ============================================================================
// REVA (reva.in) — Time Calculator & "Registered On" Formatter Test Suite
// ============================================================================

function formatMemberSinceMonth(isoDateStr) {
  if (!isoDateStr) {
    return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
  }
  try {
    const d = new Date(isoDateStr);
    if (isNaN(d.getTime())) return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
  } catch {
    return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
  }
}

function formatExactRegistrationDate(isoDateStr) {
  if (!isoDateStr) return new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  try {
    const d = new Date(isoDateStr);
    if (isNaN(d.getTime())) return new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}

function getLivelyMembershipDuration(isoDateStr) {
  if (!isoDateStr) return 'Joined today • Active';
  try {
    const now = Date.now();
    const joined = new Date(isoDateStr).getTime();
    if (isNaN(joined)) return 'Joined today • Active';
    const diffMs = Math.max(0, now - joined);
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 60) {
      if (diffMins <= 5) return 'Joined just now • Active';
      return 'Joined today • Active';
    }
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 24) return 'Joined today • Active';
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return 'Member for 1 day • Active';
    if (diffDays < 30) return `Member for ${diffDays} days • Active`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `Member for ${diffMonths} month${diffMonths > 1 ? 's' : ''} • Active`;
    const diffYears = Math.floor(diffDays / 365);
    return `Member for ${diffYears} year${diffYears > 1 ? 's' : ''} • VIP`;
  } catch {
    return 'Joined today • Active';
  }
}

// Scenarios to test
const scenarios = [
  {
    name: '1. Just joined (2 minutes ago)',
    date: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    name: '2. Joined earlier today (4 hours ago)',
    date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    name: '3. Joined yesterday (Bhim Pujari - Oct 2, 24h ago)',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    name: '4. Joined 5 days ago',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    name: '5. Joined 45 days ago',
    date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    name: '6. Joined 1 year ago (VIP member)',
    date: new Date(Date.now() - 380 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

console.log('================================================================');
console.log('REVA — TIME CALCULATOR & REGISTRATION DATE VERIFICATION REPORT');
console.log('================================================================\n');

scenarios.forEach((s) => {
  console.log(`📌 Scenario: ${s.name}`);
  console.log(`   ISO Date:        ${s.date}`);
  console.log(`   Exact Date:      ${formatExactRegistrationDate(s.date)}`);
  console.log(`   Header Badge:    MEMBER SINCE ${formatMemberSinceMonth(s.date)}`);
  console.log(`   Live Duration:   ${getLivelyMembershipDuration(s.date)}`);
  console.log('----------------------------------------------------------------');
});
