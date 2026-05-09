// ── STORE CENTRAL ──────────────────────────────────────────

const CRM_STORE = {
  currentUser: null,
  currentRole: null,
  currentProfile: null,

  prospects: [],
  actions: {},
  users: [],

  selectedWeek: null,
  selectedYear: null,
  selectedPeriod: 'weekly',

  charts: {},

  filters: {
    owner: null,
    status: null,
    search: ''
  }
};
