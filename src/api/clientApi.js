import api from './axios';

// جلب جميع العملاء
// src/api/clientApi.js
export const getAllClients = async (params = {}) => {
  const response = await api.get('/clients', { params });
  return response.data;
};

export const getClientById = async (id) => {
  const response = await api.get(`/clients/${id}`);
  return response.data;
};

export const getSimpleClients = async ()=> {
  try {
    // هذا هو المسار الجديد الذي أضفناه في الـ backend
    const { data } = await api.get('/clients/simple');
    return data; // (الـ backend يعيدها جاهزة كـ [{ value: '..', label: '..' }])
  } catch (error) {
    console.error('Error fetching simple clients list:', error);
    throw new Error(error.response?.data?.message || 'فشل في جلب قائمة العملاء');
  }
};

// إنشاء عميل جديد
export const createClient = async (clientData) => {
  const response = await api.post('/clients', clientData);
  return response.data;
};

// تحديث بيانات العميل
export const updateClient = async (id, updates) => {
  const response = await api.put(`/clients/${id}`, updates);
  return response.data;
};

export const analyzeClientIdentity = async (base64Image, documentType) => {
  const response = await api.post("/clients/analyze-identity", { // تأكد من المسار حسب الـ router لديك
    base64Image,
    documentType
  });
  return response.data; 
};

// حذف عميل
export const deleteClient = async (id) => {
  await api.delete(`/clients/${id}`);
};