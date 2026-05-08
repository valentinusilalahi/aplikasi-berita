import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Edit,
  Trash2,
  Eye,
  Send,
  CheckCircle,
  AlertCircle,
  XCircle,
  Plus,
  Clock,
  User,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { newsService, NewsResponse } from '../api/newsService';
import { useFetch, useMutation } from '../hooks/useFetch';
import { useAuthStore } from '../store/authStore';

const CATEGORIES = ['All', 'Politics', 'Business', 'Technology', 'Sports', 'Entertainment', 'Health'];

const CATEGORY_COLORS: Record<string, string> = {
  Politics: 'bg-red-100 text-red-700',
  Business: 'bg-green-100 text-green-700',
  Technology: 'bg-blue-100 text-blue-700',
  Sports: 'bg-orange-100 text-orange-700',
  Entertainment: 'bg-purple-100 text-purple-700',
  Health: 'bg-teal-100 text-teal-700',
};

const STATUS_CONFIG: Record<string, { bg: string; dot: string; icon: any; label: string }> = {
  DRAFT: { bg: 'bg-gray-50 text-gray-600 border-gray-200', dot: 'bg-gray-400', icon: AlertCircle, label: 'Draft' },
  PENDING_REVIEW: { bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400', icon: Clock, label: 'Pending Review' },
  APPROVED: { bg: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-400', icon: CheckCircle, label: 'Approved' },
  REJECTED: { bg: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-400', icon: XCircle, label: 'Rejected' },
  PUBLISHED: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400', icon: CheckCircle, label: 'Published' },
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const truncateText = (text: string, maxLength: number) => {
  if (!text) return '';
  const stripped = text.replace(/<[^>]*>/g, '');
  return stripped.length > maxLength ? stripped.substring(0, maxLength) + '...' : stripped;
};

export const NewsListPage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [page, setPage] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('');

  const { data: newsData, isLoading } = useFetch(
    () =>
      newsService.getNewsList(
        page,
        10,
        selectedStatus || undefined,
        selectedCategory !== 'All' ? selectedCategory : undefined
      ),
    [page, selectedCategory, selectedStatus]
  );

  const deleteMutation = useMutation(
    (newsId: number) => newsService.deleteNews(newsId),
    {
      onSuccess: () => {
        toast.success('News deleted successfully!');
      },
    }
  );

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this news?')) {
      try {
        await deleteMutation.mutate(id);
      } catch {
        toast.error('Failed to delete news');
      }
    }
  };

  const newsItems: NewsResponse[] = newsData?.content || [];
  const totalPages = newsData?.totalPages || 0;
  const totalElements = newsData?.totalElements || 0;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">News Management</h1>
          <p className="text-gray-500 mt-1">{totalElements} article{totalElements !== 1 ? 's' : ''} total</p>
        </div>
        {user?.role !== 'REVIEWER' && (
          <button
            onClick={() => navigate('/news/create')}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition shadow-lg shadow-blue-600/25 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Article
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4 text-sm font-medium text-gray-500">
          <Filter className="w-4 h-4" />
          Filters
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => { setSelectedCategory(cat); setPage(0); }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); setPage(0); }}
            className="px-4 py-1.5 border border-gray-200 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="PUBLISHED">Published</option>
          </select>
        </div>
      </div>

      {/* News List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
              <div className="flex gap-4">
                <div className="w-32 h-24 bg-gray-200 rounded-lg flex-shrink-0"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : newsItems.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Articles Found</h3>
          <p className="text-gray-500 mb-6">
            {selectedCategory !== 'All' || selectedStatus
              ? 'Try adjusting your filters to see more results.'
              : 'Start writing your first article!'}
          </p>
          {user?.role !== 'REVIEWER' && (
            <button
              onClick={() => navigate('/news/create')}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition"
            >
              Create Article
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {newsItems.map((news) => {
            const statusCfg = STATUS_CONFIG[news.status] || STATUS_CONFIG.DRAFT;
            const catStyle = CATEGORY_COLORS[news.category] || 'bg-gray-100 text-gray-700';

            return (
              <div
                key={news.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-blue-200 transition-all duration-200 group"
              >
                <div className="flex">
                  {/* Color Stripe */}
                  <div
                    className={`w-1.5 flex-shrink-0 ${
                      news.status === 'PUBLISHED' ? 'bg-emerald-500'
                        : news.status === 'PENDING_REVIEW' ? 'bg-amber-500'
                        : news.status === 'APPROVED' ? 'bg-blue-500'
                        : news.status === 'REJECTED' ? 'bg-red-500'
                        : 'bg-gray-300'
                    }`}
                  ></div>

                  {/* Content */}
                  <div className="flex-1 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Tags */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${catStyle}`}>
                            {news.category}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusCfg.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`}></span>
                            {statusCfg.label}
                          </span>
                        </div>

                        {/* Title */}
                        <h3
                          className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors cursor-pointer line-clamp-1 mb-1.5"
                          onClick={() => navigate(`/news/${news.id}`)}
                        >
                          {news.title}
                        </h3>

                        {/* Excerpt */}
                        <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                          {truncateText(news.content, 200)}
                        </p>

                        {/* Meta */}
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" />
                            {news.createdBy?.username || 'Unknown'}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDate(news.createdAt)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Eye className="w-3.5 h-3.5" />
                            {(news.viewsCount || 0).toLocaleString()} views
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => navigate(`/news/${news.id}`)}
                          className="p-2 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {user?.role !== 'REVIEWER' && (news.status === 'DRAFT' || news.status === 'REJECTED') && (
                          <>
                            <button
                              onClick={() => navigate(`/news/${news.id}/edit`)}
                              className="p-2 hover:bg-amber-50 rounded-lg text-gray-400 hover:text-amber-600 transition"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => navigate(`/news/${news.id}`)}
                              className="p-2 hover:bg-emerald-50 rounded-lg text-gray-400 hover:text-emerald-600 transition"
                              title="Submit for Review"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {user?.role !== 'REVIEWER' && news.status === 'DRAFT' && (
                          <button
                            onClick={() => handleDelete(news.id)}
                            disabled={deleteMutation.isLoading}
                            className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-4">
          <p className="text-sm text-gray-500">
            Page <span className="font-semibold text-gray-900">{page + 1}</span> of{' '}
            <span className="font-semibold text-gray-900">{totalPages}</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="flex items-center gap-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages - 1}
              className="flex items-center gap-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
