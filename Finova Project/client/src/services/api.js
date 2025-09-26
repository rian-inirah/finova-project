import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      // Handle authentication errors
      if (status === 401 || status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(error);
      }
      
      // Handle validation errors
      if (status === 400 && data.details) {
        const errorMessage = data.details.map(detail => detail.msg).join(', ');
        toast.error(errorMessage);
      } else if (data.error) {
        toast.error(data.error);
      } else {
        toast.error('An error occurred');
      }
    } else if (error.request) {
      toast.error('Network error. Please check your connection.');
    } else {
      toast.error('An unexpected error occurred');
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
  verifyToken: () => api.get('/auth/verify'),
};

// Business API
export const businessAPI = {
  getDetails: () => api.get('/business'),
  updateDetails: (formData) => api.post('/business', formData),
  setReportsPin: (pin) => api.post('/business/pin', { pin }),
};

// Items API
export const itemsAPI = {
  getAll: (params) => api.get('/items', { params }),
  getById: (id) => api.get(`/items/${id}`),
  create: (formData) => api.post('/items', formData),
  update: (id, formData) => api.put(`/items/${id}`, formData),
  delete: (id, confirm) => api.delete(`/items/${id}`, { data: { confirm } }),
};

// Orders API
export const ordersAPI = {
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (orderData) => api.post('/orders', orderData),
  update: (id, orderData) => api.put(`/orders/${id}`, orderData),
  delete: (id) => api.delete(`/orders/${id}`),
  markPrinted: (id) => api.post(`/orders/${id}/print`),
};

// Billing API
export const billingAPI = {
  getPreview: (id) => api.get(`/billing/${id}/preview`),
  getPDF: (id) => api.get(`/billing/${id}/pdf`, { responseType: 'blob' }),
  shareEmail: (id, email) => api.post(`/billing/${id}/email`, { email }),
  getWhatsAppLink: (id) => api.get(`/billing/${id}/whatsapp`),
  print: (id) => api.post(`/billing/${id}/print`),
};

// Reports API
export const reportsAPI = {
  getOrderReports: (params) => api.get('/reports/orders', { params }),
  getItemReports: (params) => api.get('/reports/items', { params }),
  getDailyReports: (params) => api.get('/reports/daily', { params }),
  getTopItems: (params) => api.get('/reports/top-items', { params }),
};

// PSG API
export const psgAPI = {
  getReports: (params) => api.get('/psg/reports', { params }),
  getOrderHistory: (params) => api.get('/psg/orders', { params }),
  getItemDetails: (itemId, params) => api.get(`/psg/items/${itemId}`, { params }),
};

// Utility functions
export const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const shareWhatsApp = (message) => {
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
  window.open(whatsappUrl, '_blank');
};

export const shareEmail = (subject, body) => {
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);
  const mailtoUrl = `mailto:?subject=${encodedSubject}&body=${encodedBody}`;
  window.location.href = mailtoUrl;
};

export default api;
