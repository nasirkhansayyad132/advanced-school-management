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

// Students API
export const studentsApi = {
  getAll: async (params?: { page?: number; limit?: number; classId?: string; search?: string; isActive?: boolean }) => {
    const response = await api.get('/students', { params });
    return response.data;
  },
  getOne: async (id: string) => {
    const response = await api.get(`/students/${id}`);
    return response.data;
  },
  create: async (data: {
    admissionNo: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    classId: string;
    bloodGroup?: string;
    address?: string;
    guardians?: Array<{ name: string; phone: string; relationship: string }>;
    medicalInfo?: string;
  }) => {
    const response = await api.post('/students', data);
    return response.data;
  },
  update: async (id: string, data: Partial<{
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    classId: string;
    bloodGroup: string;
    address: string;
    guardians: Array<{ name: string; phone: string; relationship: string }>;
    medicalInfo: string;
    isActive: boolean;
  }>) => {
    const response = await api.patch(`/students/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/students/${id}`);
    return response.data;
  },
  search: async (query: string) => {
    const response = await api.get('/students/search', { params: { q: query } });
    return response.data;
  },
};

// Teachers API
export const teachersApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await api.get('/teachers', { params });
    return response.data;
  },
  getOne: async (id: string) => {
    const response = await api.get(`/teachers/${id}`);
    return response.data;
  },
  create: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    phone?: string;
    address?: string;
    qualification?: string;
    dateOfJoining?: string;
  }) => {
    const response = await api.post('/teachers', data);
    return response.data;
  },
  update: async (id: string, data: Partial<{
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    qualification: string;
    isActive: boolean;
  }>) => {
    const response = await api.patch(`/teachers/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/teachers/${id}`);
    return response.data;
  },
  getClasses: async (id: string) => {
    const response = await api.get(`/teachers/${id}/classes`);
    return response.data;
  },
  assignClass: async (id: string, data: { classId: string; isPrimary?: boolean }) => {
    const response = await api.post(`/teachers/${id}/assignments`, data);
    return response.data;
  },
};

// Classes API
export const classesApi = {
  getAll: async (params?: { page?: number; limit?: number; academicYear?: string; isActive?: boolean }) => {
    const response = await api.get('/classes', { params });
    return response.data;
  },
  getOne: async (id: string) => {
    const response = await api.get(`/classes/${id}`);
    return response.data;
  },
  create: async (data: {
    name: string;
    section?: string;
    grade: string;
    academicYear: string;
  }) => {
    const response = await api.post('/classes', data);
    return response.data;
  },
  update: async (id: string, data: Partial<{
    name: string;
    section: string;
    grade: string;
    isActive: boolean;
  }>) => {
    const response = await api.patch(`/classes/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/classes/${id}`);
    return response.data;
  },
  getStudents: async (id: string) => {
    const response = await api.get(`/classes/${id}/students`);
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
