import axios from 'axios';

const API_BASE_URL = 'http://localhost'; // EC2 URL로 변경 필요

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const imageApi = {
  // 모든 이미지 조회
  getAll: async () => {
    const response = await api.get('/images');
    return response.data;
  },

  // 특정 이미지 조회
  getById: async (id: number) => {
    const response = await api.get(`/images/${id}`);
    return response.data;
  },

  // 이미지 업로드
  upload: async (files: File[]) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('photos', file);
    });
    
    const response = await api.post('/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // 이미지 수정
  update: async (id: number, file: File) => {
    const formData = new FormData();
    formData.append('photo', file);
    
    const response = await api.put(`/images/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // 이미지 삭제
  delete: async (id: number) => {
    const response = await api.delete(`/images/${id}`);
    return response.data;
  },
};