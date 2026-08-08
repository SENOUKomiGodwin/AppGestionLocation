import { api } from './client';

/* ---------- Auth ---------- */
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: (all = false) => api.post('/auth/logout', { all }),
  me: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  verifyEmail: (code) => api.post('/auth/email/verify', { code }),
  resendVerification: () => api.post('/auth/email/resend'),
};

/* ---------- Dashboard ---------- */
export const dashboardApi = {
  stats: () => api.get('/dashboard'),
};

/* ---------- Maisons ---------- */
export const housesApi = {
  all: (params) => api.get('/houses', { params }),
  get: (id) => api.get(`/houses/${id}`),
  create: (data) => api.post('/houses', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/houses/${id}`, data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  }),
  destroy: (id) => api.delete(`/houses/${id}`),
  units: (id, params) => api.get(`/houses/${id}/units`, { params }),
};

/* ---------- Logements ---------- */
export const unitsApi = {
  all: (params) => api.get('/units', { params }),
  get: (id) => api.get(`/units/${id}`),
  create: (data) => api.post('/units', data),
  update: (id, data) => api.put(`/units/${id}`, data),
  destroy: (id) => api.delete(`/units/${id}`),
};

/* ---------- Locataires ---------- */
export const tenantsApi = {
  all: (params) => api.get('/tenants', { params }),
  get: (id) => api.get(`/tenants/${id}`),
  create: (data) => api.post('/tenants', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/tenants/${id}`, data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  }),
  destroy: (id) => api.delete(`/tenants/${id}`),
};

/* ---------- Contrats ---------- */
export const contractsApi = {
  all: (params) => api.get('/contracts', { params }),
  get: (id) => api.get(`/contracts/${id}`),
  create: (data) => api.post('/contracts', data),
  update: (id, data) => api.put(`/contracts/${id}`, data),
  destroy: (id) => api.delete(`/contracts/${id}`),
  renew: (id, data) => api.post(`/contracts/${id}/renew`, data),
  download: (id) => api.get(`/contracts/${id}/download`, { responseType: 'blob' }),
};

/* ---------- Échéances & paiements ---------- */
export const rentDuesApi = {
  all: (params) => api.get('/rent-dues', { params }),
  get: (id) => api.get(`/rent-dues/${id}`),
  generate: (monthsAhead = 3) => api.post('/rent-dues/generate', { months_ahead: monthsAhead }),
};

export const paymentsApi = {
  all: (params) => api.get('/payments', { params }),
  get: (id) => api.get(`/payments/${id}`),
  create: (data) => api.post('/payments', data),
  invoice: (id) => api.get(`/invoices/${id}`, { responseType: 'blob' }),
  receipt: (id) => api.get(`/receipts/${id}`, { responseType: 'blob' }),
};

/* ---------- Dépenses ---------- */
export const expensesApi = {
  all: (params) => api.get('/expenses', { params }),
  get: (id) => api.get(`/expenses/${id}`),
  create: (data) => api.post('/expenses', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/expenses/${id}`, data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  }),
  destroy: (id) => api.delete(`/expenses/${id}`),
};

/* ---------- Analytics ---------- */
export const analyticsApi = {
  get: (params) => api.get('/analytics', { params }),
  exportPdf: (params) => api.get('/analytics/export/pdf', { params, responseType: 'blob' }),
  exportExcel: (params) => api.get('/analytics/export/excel', { params, responseType: 'blob' }),
};

/* ---------- Recherche ---------- */
export const searchApi = {
  all: (params) => api.get('/search', { params }),
};

/* ---------- Paramètres ---------- */
export const settingsApi = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
  uploadLogo: (formData) => api.post('/settings/logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

/* ---------- Notifications ---------- */
export const notificationsApi = {
  all: (params) => api.get('/notifications', { params }),
  unreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.post(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
};

/* ---------- Utilisateurs & audit (super-admin) ---------- */
export const usersApi = {
  all: (params) => api.get('/users', { params }),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  destroy: (id) => api.delete(`/users/${id}`),
};

export const auditApi = {
  all: (params) => api.get('/audit-logs', { params }),
};
