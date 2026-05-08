import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Send,
  XCircle,
  Eye,
  User,
  Calendar,
  MessageSquare,
  ThumbsUp,
  Share2,
  BarChart3,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { newsService } from '../api/newsService';
import { useFetch, useMutation } from '../hooks/useFetch';
import { useAuthStore } from '../store/authStore';

const CATEGORY_COLORS: Record<string, string> = {
  Politics: 'bg-red-100 text-red-700',
  Business: 'bg-green-100 text-green-700',
  Technology: 'bg-blue-100 text-blue-700',
  Sports: 'bg-orange-100 text-orange-700',
  Entertainment: 'bg-purple-100 text-purple-700',
  Health: 'bg-teal-100 text-teal-700',
};

const STATUS_CONFIG: Record<string, { bg: string; dot: string; label: string }> = {
  DRAFT: { bg: 'bg-gray-50 text-gray-600 border-gray-200', dot: 'bg-gray-400', label: 'Draft' },
  PENDING_REVIEW: { bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400', label: 'Pending Review' },
  APPROVED: { bg: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-400', label: 'Approved' },
  REJECTED: { bg: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-400', label: 'Rejected' },
  PUBLISHED: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400', label: 'Published' },
};

export const NewsDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const user = useAuthStore((state) => state.user);
  const newsId = Number(id);

  const { data: news, isLoading } = useFetch(
    () => (isNaN(newsId) ? Promise.reject('Invalid ID') : newsService.getNews(newsId)),
    [id],
    true
  );

  const submitMutation = useMutation(
    () => newsService.submitForReview(newsId),
    {
      onSuccess: () => {
        toast.success('Submitted for review!');
        navigate('/news');
      },
    }
  );

  if (isNaN(newsId)) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <p className="text-gray-500">Invalid news ID.</p>
        <button onClick={() => navigate('/news')} className="mt-4 text-blue-600 hover:underline">
          Back to News
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!news) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <p className="text-gray-500">News not found.</p>
        <button onClick={() => navigate('/news')} className="mt-4 text-blue-600 hover:underline">
          Back to News
        </button>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[news.status] || STATUS_CONFIG.DRAFT;
  const catStyle = CATEGORY_COLORS[news.category] || 'bg-gray-100 text-gray-700';
  const canEdit =
    (user?.role === 'EDITOR' || user?.role === 'ADMIN') &&
    (news.status === 'DRAFT' || news.status === 'REJECTED');
  const canSubmit = canEdit;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Article Card */}
      <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header gradient */}
        <div className="h-2 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600"></div>

        <div className="p-8">
          {/* Tags */}
          <div className="flex items-center gap-3 mb-4">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${catStyle}`}>
              {news.category}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusCfg.bg}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`}></span>
              {statusCfg.label}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-4">{news.title}</h1>

          {/* Meta */}
          <div className="flex items-center gap-5 text-sm text-gray-500 pb-6 border-b border-gray-100">
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4" />
              {news.createdBy?.username || 'Unknown'}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {news.createdAt
                ? new Date(news.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : '—'}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              {(news.viewsCount || 0).toLocaleString()} views
            </span>
          </div>

          {/* Content */}
          <div className="py-6 prose prose-gray max-w-none leading-relaxed text-gray-700 whitespace-pre-wrap">
            {news.content}
          </div>

          {/* Rejection Reason */}
          {news.status === 'REJECTED' && news.rejectionReason && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center gap-2 text-red-700 font-semibold text-sm mb-1">
                <XCircle className="w-4 h-4" />
                Rejection Reason
              </div>
              <p className="text-red-600 text-sm">{news.rejectionReason}</p>
            </div>
          )}

          {/* Reviewed By */}
          {news.reviewedBy && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-blue-700 text-sm">
                <span className="font-semibold">Reviewed by:</span> {news.reviewedBy.username}
              </p>
            </div>
          )}

          {/* Analytics */}
          {news.analytics && (
            <div className="mt-6 p-5 bg-gray-50 rounded-xl">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <Eye className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-gray-900">{news.analytics.views}</p>
                  <p className="text-xs text-gray-500">Views</p>
                </div>
                <div className="text-center">
                  <ThumbsUp className="w-5 h-5 text-green-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-gray-900">{news.analytics.likes}</p>
                  <p className="text-xs text-gray-500">Likes</p>
                </div>
                <div className="text-center">
                  <MessageSquare className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-gray-900">{news.analytics.comments}</p>
                  <p className="text-xs text-gray-500">Comments</p>
                </div>
                <div className="text-center">
                  <Share2 className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-gray-900">{news.analytics.shares}</p>
                  <p className="text-xs text-gray-500">Shares</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {(canEdit || canSubmit) && (
          <div className="border-t border-gray-100 px-8 py-4 flex items-center justify-end gap-3 bg-gray-50">
            {canEdit && (
              <button
                onClick={() => navigate(`/news/${news.id}/edit`)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition flex items-center gap-2 text-sm"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            )}
            {canSubmit && (
              <button
                onClick={() => submitMutation.mutate(undefined as any)}
                disabled={submitMutation.isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2 text-sm disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                Submit for Review
              </button>
            )}
          </div>
        )}
      </article>
    </div>
  );
};


