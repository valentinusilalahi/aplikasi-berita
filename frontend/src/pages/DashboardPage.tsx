import { useNavigate } from 'react-router-dom';
import {
  Eye,
  Clock,
  TrendingUp,
  FileText,
  ChevronRight,
  User,
  Bookmark,
  Flame,
} from 'lucide-react';
import { newsService, NewsResponse } from '../api/newsService';
import { useFetch } from '../hooks/useFetch';
import { useAuthStore } from '../store/authStore';

const CATEGORY_COLORS: Record<string, string> = {
  Politics: 'bg-red-100 text-red-700',
  Business: 'bg-green-100 text-green-700',
  Technology: 'bg-blue-100 text-blue-700',
  Sports: 'bg-orange-100 text-orange-700',
  Entertainment: 'bg-purple-100 text-purple-700',
  Health: 'bg-teal-100 text-teal-700',
};

const getCategoryStyle = (category: string) =>
  CATEGORY_COLORS[category] || 'bg-gray-100 text-gray-700';

const STATUS_CONFIG: Record<string, { bg: string; dot: string; label: string }> = {
  DRAFT: { bg: 'bg-gray-50 text-gray-600', dot: 'bg-gray-400', label: 'Draft' },
  PENDING_REVIEW: { bg: 'bg-amber-50 text-amber-700', dot: 'bg-amber-400', label: 'Pending Review' },
  APPROVED: { bg: 'bg-blue-50 text-blue-700', dot: 'bg-blue-400', label: 'Approved' },
  REJECTED: { bg: 'bg-red-50 text-red-700', dot: 'bg-red-400', label: 'Rejected' },
  PUBLISHED: { bg: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-400', label: 'Published' },
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const truncateText = (text: string, maxLength: number) => {
  if (!text) return '';
  const stripped = text.replace(/<[^>]*>/g, '');
  return stripped.length > maxLength ? stripped.substring(0, maxLength) + '...' : stripped;
};

export const DashboardPage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  // Fetch published news for display
  const { data: publishedData, isLoading: loadingLatest } = useFetch(
    () => newsService.getNewsList(0, 10, 'PUBLISHED'),
    []
  );

  const allNews: NewsResponse[] = publishedData?.content || [];
  const featuredNews = allNews[0];
  const sideNews = allNews.slice(1, 4);
  const remainingNews = allNews.slice(4);

  const totalPublished = publishedData?.totalElements || 0;
  const totalViews = allNews.reduce((sum, n) => sum + (n.viewsCount || 0), 0);

  const stats = [
    { label: 'Published Articles', value: totalPublished, icon: FileText, color: 'text-blue-600 bg-blue-50' },
    { label: 'Total Views', value: totalViews, icon: Eye, color: 'text-purple-600 bg-purple-50' },
    { label: 'Avg Views', value: totalPublished > 0 ? Math.round(totalViews / totalPublished) : 0, icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
  ];

  if (loadingLatest) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 h-96 bg-gray-200 rounded-xl"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'},{' '}
            <span className="text-blue-600">{user?.username}</span>
          </h1>
          <p className="text-gray-500 mt-1">Here's what's happening with your news today.</p>
        </div>
        {user?.role !== 'REVIEWER' && (
          <button
            onClick={() => navigate('/news/create')}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition shadow-lg shadow-blue-600/25 flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Write Article
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stat.value.toLocaleString()}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Featured + Side News */}
      {allNews.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Featured Article */}
          {featuredNews && (
            <div
              className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer group hover:shadow-lg transition-all duration-300"
              onClick={() => navigate(`/news/${featuredNews.id}`)}
            >
              {/* Featured Image Placeholder */}
              <div className="relative h-64 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-4 left-4 w-32 h-32 border-2 border-white rounded-full"></div>
                  <div className="absolute bottom-8 right-8 w-48 h-48 border-2 border-white rounded-full"></div>
                  <div className="absolute top-1/2 left-1/2 w-24 h-24 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                </div>
                <div className="text-center z-10">
                  <Flame className="w-12 h-12 text-white/80 mx-auto mb-2" />
                  <span className="text-white/90 text-sm font-medium">Featured Article</span>
                </div>
                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${STATUS_CONFIG[featuredNews.status]?.bg || 'bg-gray-50 text-gray-600'}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[featuredNews.status]?.dot || 'bg-gray-400'}`}
                    ></span>
                    {STATUS_CONFIG[featuredNews.status]?.label || featuredNews.status}
                  </span>
                </div>
                {/* Category */}
                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getCategoryStyle(featuredNews.category)}`}>
                    {featuredNews.category}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-3">
                  {featuredNews.title}
                </h2>
                <p className="text-gray-600 leading-relaxed line-clamp-3 mb-4">
                  {truncateText(featuredNews.content, 250)}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <User className="w-4 h-4" />
                      <span>{featuredNews.createdBy?.username || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>{formatDate(featuredNews.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <Eye className="w-4 h-4" />
                    <span>{featuredNews.viewsCount || 0} views</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Side News */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-blue-600" />
              Latest Articles
            </h3>
            {sideNews.map((news) => (
              <div
                key={news.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all duration-200 group"
                onClick={() => navigate(`/news/${news.id}`)}
              >
                <div className="flex items-start gap-3">
                  {/* Mini color indicator */}
                  <div
                    className={`w-1 h-full min-h-[60px] rounded-full flex-shrink-0 ${
                      news.status === 'PUBLISHED'
                        ? 'bg-emerald-400'
                        : news.status === 'PENDING_REVIEW'
                        ? 'bg-amber-400'
                        : news.status === 'APPROVED'
                        ? 'bg-blue-400'
                        : news.status === 'REJECTED'
                        ? 'bg-red-400'
                        : 'bg-gray-300'
                    }`}
                  ></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getCategoryStyle(news.category)}`}>
                        {news.category}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium">
                        {STATUS_CONFIG[news.status]?.label}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-1.5">
                      {news.title}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {news.createdBy?.username || 'Unknown'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(news.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {news.viewsCount || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* View All Button */}
            <button
              onClick={() => navigate('/news')}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition"
            >
              View All Articles
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Articles Yet</h3>
          <p className="text-gray-500 mb-6">Start creating your first news article to see it here.</p>
          {user?.role !== 'REVIEWER' && (
            <button
              onClick={() => navigate('/news/create')}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition"
            >
              Create First Article
            </button>
          )}
        </div>
      )}

      {/* More Articles Grid */}
      {remainingNews.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            More Articles
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {remainingNews.map((news) => (
              <div
                key={news.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all duration-200 group"
                onClick={() => navigate(`/news/${news.id}`)}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${getCategoryStyle(news.category)}`}>
                    {news.category}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_CONFIG[news.status]?.bg}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[news.status]?.dot}`}></span>
                    {STATUS_CONFIG[news.status]?.label}
                  </span>
                </div>
                <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                  {news.title}
                </h4>
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                  {truncateText(news.content, 120)}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {news.createdBy?.username || 'Unknown'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(news.createdAt)}
                    </span>
                  </div>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {news.viewsCount || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};




