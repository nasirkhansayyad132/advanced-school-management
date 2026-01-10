import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  logout: async () => {
    await api.post('/auth/logout');
  },
  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Teacher Dashboard API
export const teacherApi = {
  getDashboard: async (date?: string) => {
    const response = await api.get('/teacher/dashboard', { params: { date } });
    return response.data;
  },
  getClassStudents: async (classId: string) => {
    const response = await api.get(`/teacher/classes/${classId}/students`);
    return response.data;
  },
};

// Attendance API
export const attendanceApi = {
  getState: async (classId: string, date: string, session: string) => {
    const response = await api.get(`/attendance/${classId}/${date}/${session}`);
    return response.data;
  },
  submit: async (data: {
    idempotencyKey: string;
    classId: string;
    date: string;
    session: string;
    records: Array<{
      studentId: string;
      status: string;
      earlyLeave?: { time: string; reason: string };
      notes?: string;
    }>;
    clientCreatedAt: string;
  }) => {
    const response = await api.post('/attendance/sync', data, {
      headers: {
        'X-Idempotency-Key': data.idempotencyKey,
      },
    });
    return response.data;
  },
};
