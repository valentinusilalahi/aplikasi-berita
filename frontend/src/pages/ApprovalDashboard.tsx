import { useState } from 'react';
import { CheckCircle, XCircle, Eye, Send, User, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { newsService, NewsResponse } from '../api/newsService';
import { useFetch, useMutation } from '../hooks/useFetch';

export const ApprovalDashboard = () => {
  const [selectedNews, setSelectedNews] = useState<NewsResponse | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => {
    setRefreshKey((k) => k + 1);
    setSelectedNews(null);
  };

  // Fetch pending news
  const { data: pendingNews, isLoading } = useFetch(
    () => newsService.getNewsList(0, 20, 'PENDING_REVIEW'),
    [refreshKey]
  );

  // Fetch approved news (ready to publish)
  const { data: approvedNews } = useFetch(
    () => newsService.getNewsList(0, 20, 'APPROVED'),
    [refreshKey]
  );

  // Approve mutation
  const approveMutation = useMutation(
    (newsId: number) => newsService.approveNews(newsId, { approve: true }),
    {
      onSuccess: () => {
        toast.success('News approved!');
        refresh();
      },
    }
  );

  // Reject mutation
  const rejectMutation = useMutation(
    (newsId: number) =>
      newsService.approveNews(newsId, {
        approve: false,
        rejectionReason,
      }),
    {
      onSuccess: () => {
        toast.success('News rejected!');
        refresh();
        setShowRejectModal(false);
        setRejectionReason('');
      },
    }
  );

  const handleApprove = async (newsId: number) => {
    try {
      await approveMutation.mutate(newsId);
    } catch {
      toast.error('Failed to approve news');
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    try {
      if (selectedNews) {
        await rejectMutation.mutate(selectedNews.id);
      }
    } catch {
      toast.error('Failed to reject news');
    }
  };

  const handlePublish = async (newsId: number) => {
    try {
      await newsService.publishNews(newsId);
      toast.success('News published!');
      refresh();
    } catch {
      toast.error('Failed to publish news');
    }
  };

  const pendingItems: NewsResponse[] = pendingNews?.content || [];
  const approvedItems: NewsResponse[] = approvedNews?.content || [];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Approval Queue</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel: Pending + Approved lists */}
        <div className="lg:col-span-1 space-y-6">
          {/* Pending News */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="border-b border-gray-100 p-5">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                Pending Review ({pendingItems.length})
              </h2>
            </div>

            {isLoading ? (
              <div className="p-6 text-center">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
              </div>
            ) : pendingItems.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">
                No news pending review
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                {pendingItems.map((news) => (
                  <div
                    key={news.id}
                    onClick={() => setSelectedNews(news)}
                    className={`p-4 cursor-pointer transition ${
                      selectedNews?.id === news.id
                        ? 'bg-blue-50 border-l-4 border-blue-600'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm">
                      {news.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {news.createdBy?.username || 'Unknown'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(news.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Approved (ready to publish) */}
          {approvedItems.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="border-b border-gray-100 p-5">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                  Ready to Publish ({approvedItems.length})
                </h2>
              </div>
              <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
                {approvedItems.map((news) => (
                  <div key={news.id} className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 line-clamp-1 text-sm">
                        {news.title}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">
                        {news.createdBy?.username || 'Unknown'}
                      </p>
                    </div>
                    <button
                      onClick={() => handlePublish(news.id)}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition flex items-center gap-1 flex-shrink-0"
                    >
                      <Send className="w-3 h-3" />
                      Publish
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right panel: News Detail */}
        <div className="lg:col-span-2">
          {selectedNews ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-semibold border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    {selectedNews.status.replace('_', ' ')}
                  </span>
                  <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">
                    {selectedNews.category}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedNews.title}</h2>

                <div className="flex flex-wrap gap-6 mt-4 pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Author</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">
                      {selectedNews.createdBy?.username || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Submitted</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">
                      {new Date(selectedNews.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Content</h3>
                <div className="text-gray-700 whitespace-pre-wrap leading-relaxed prose prose-sm max-w-none">
                  {selectedNews.content}
                </div>
              </div>

              {/* Attachments */}
              {selectedNews.attachments && selectedNews.attachments.length > 0 && (
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Attachments ({selectedNews.attachments.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedNews.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <span className="text-sm text-gray-700">
                          {att.fileName} ({(att.fileSize / 1024 / 1024).toFixed(2)}MB)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="p-6 flex gap-3 bg-gray-50">
                <button
                  onClick={() => handleApprove(selectedNews.id)}
                  disabled={approveMutation.isLoading}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition disabled:bg-emerald-400 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </div>

              {/* Reject Modal */}
              {showRejectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Reject News</h3>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Provide rejection reason..."
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => {
                          setShowRejectModal(false);
                          setRejectionReason('');
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleReject}
                        disabled={rejectMutation.isLoading}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:bg-red-400"
                      >
                        {rejectMutation.isLoading ? 'Rejecting...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center">
              <Eye className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Select a News Article</h3>
              <p className="text-gray-500 text-sm">Click on an article from the left panel to review it</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
