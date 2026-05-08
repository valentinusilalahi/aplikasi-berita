import apiClient from './apiClient';

export interface DashboardAnalytics {
  totalNewsPublished: number;
  totalViews: number;
  averageEngagementRate: number;
  averageSentimentScore: number;
  pendingReview: number;
  rejectedNews: number;
  categoryStats: Array<{
    category: string;
    count: number;
    views: number;
    averageEngagement: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    published: number;
    views: number;
    averageSentiment: number;
  }>;
}

export interface NewsAnalytics {
  id: number;
  newsId: number;
  views: number;
  shares: number;
  comments: number;
  likes: number;
  engagementRate: number;
  sentimentScore: number;
  keywordAnalysis: string;
}

export interface QuarterlyReport {
  id: number;
  quarter: number;
  year: number;
  summary: string;
  recommendations: string;
  policyInsights: string;
  totalNewsPublished: number;
  totalViews: number;
  averageEngagementRate: number;
  averageSentimentScore: number;
  topCategories: string;
  topKeywords: string;
  createdByUsername: string;
  createdAt: string;
}

export const analyticsService = {
  getDashboardAnalytics: async (): Promise<DashboardAnalytics> => {
    const response = await apiClient.get<DashboardAnalytics>('/analytics/dashboard');
    return response.data;
  },

  getNewsAnalytics: async (newsId: number): Promise<NewsAnalytics> => {
    const response = await apiClient.get<NewsAnalytics>(`/analytics/news/${newsId}`);
    return response.data;
  },

  generateQuarterlyReport: async (quarter: number, year: number): Promise<QuarterlyReport> => {
    const response = await apiClient.post<QuarterlyReport>(
      '/analytics/quarterly/generate',
      { quarter, year }
    );
    return response.data;
  },

  getQuarterlyReport: async (quarter: number, year: number): Promise<QuarterlyReport> => {
    const response = await apiClient.get<QuarterlyReport>(
      `/analytics/quarterly/${quarter}/${year}`
    );
    return response.data;
  },

  getYearlyReports: async (year: number): Promise<QuarterlyReport[]> => {
    const response = await apiClient.get<QuarterlyReport[]>(
      `/analytics/quarterly/year/${year}`
    );
    return response.data;
  },

  getRecentReports: async (limit = 4): Promise<QuarterlyReport[]> => {
    const response = await apiClient.get<QuarterlyReport[]>(
      `/analytics/quarterly/recent?limit=${limit}`
    );
    return response.data;
  },
};
