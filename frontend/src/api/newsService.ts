import apiClient from './apiClient';

export interface CreateNewsRequest {
  title: string;
  content: string;
  category: string;
}

export interface UpdateNewsRequest {
  title: string;
  content: string;
  category: string;
}

export interface ApproveNewsRequest {
  approve: boolean;
  rejectionReason?: string;
}

export interface NewsResponse {
  id: number;
  title: string;
  content: string;
  category: string;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'PUBLISHED';
  createdBy: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
  reviewedBy?: {
    id: number;
    username: string;
  };
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  viewsCount: number;
  engagementScore: number;
  attachments: Array<{
    id: number;
    fileName: string;
    fileType: string;
    fileSize: number;
    createdAt: string;
  }>;
  analytics?: {
    views: number;
    shares: number;
    comments: number;
    likes: number;
    engagementRate: number;
    sentimentScore: number;
    keywordAnalysis: string;
  };
}

export interface NewsListResponse {
  content: NewsResponse[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
  pageSize: number;
}

export const newsService = {
  createNews: async (data: CreateNewsRequest): Promise<NewsResponse> => {
    const response = await apiClient.post<NewsResponse>('/news', data);
    return response.data;
  },

  updateNews: async (id: number, data: UpdateNewsRequest): Promise<NewsResponse> => {
    const response = await apiClient.put<NewsResponse>(`/news/${id}`, data);
    return response.data;
  },

  getNews: async (id: number): Promise<NewsResponse> => {
    const response = await apiClient.get<NewsResponse>(`/news/${id}`);
    return response.data;
  },

  getNewsList: async (
    page = 0,
    size = 10,
    status?: string,
    category?: string,
    sortBy = 'createdAt',
    direction = 'DESC'
  ): Promise<any> => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy,
      direction,
    });

    if (status) params.append('status', status);
    if (category) params.append('category', category);

    const response = await apiClient.get(`/news?${params.toString()}`);
    return response.data;
  },

  getMyNews: async (page = 0, size = 10): Promise<any> => {
    const response = await apiClient.get(`/news/my-news?page=${page}&size=${size}`);
    return response.data;
  },

  submitForReview: async (id: number): Promise<NewsResponse> => {
    const response = await apiClient.post<NewsResponse>(`/news/${id}/submit-review`, {});
    return response.data;
  },

  approveNews: async (id: number, data: ApproveNewsRequest): Promise<NewsResponse> => {
    const response = await apiClient.post<NewsResponse>(`/news/${id}/approve`, data);
    return response.data;
  },

  publishNews: async (id: number): Promise<NewsResponse> => {
    const response = await apiClient.post<NewsResponse>(`/news/${id}/publish`, {});
    return response.data;
  },

  deleteNews: async (id: number): Promise<void> => {
    await apiClient.delete(`/news/${id}`);
  },

  uploadAttachment: async (newsId: number, file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post(
      `/news/${newsId}/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  getNewsStats: async (id: number): Promise<any> => {
    const response = await apiClient.get(`/news/${id}/stats`);
    return response.data;
  },
};
