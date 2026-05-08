import apiClient from './apiClient';

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  role: 'EDITOR' | 'REVIEWER' | 'ADMIN';
  active: boolean;
  createdAt: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role: string;
}

export interface UpdateUserRequest {
  email?: string;
  role?: string;
  active?: boolean;
}

export const userService = {
  getAll: async (): Promise<UserInfo[]> => {
    const response = await apiClient.get<UserInfo[]>('/users');
    return response.data;
  },

  getByRole: async (role: string): Promise<UserInfo[]> => {
    const response = await apiClient.get<UserInfo[]>(`/users/role/${role}`);
    return response.data;
  },

  create: async (data: CreateUserRequest): Promise<UserInfo> => {
    const response = await apiClient.post<UserInfo>('/users', data);
    return response.data;
  },

  update: async (id: number, data: UpdateUserRequest): Promise<UserInfo> => {
    const response = await apiClient.put<UserInfo>(`/users/${id}`, data);
    return response.data;
  },

  deactivate: async (id: number): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },

  resetPassword: async (id: number, newPassword: string): Promise<void> => {
    await apiClient.post(`/users/${id}/reset-password`, { newPassword });
  },
};

