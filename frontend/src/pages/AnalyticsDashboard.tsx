import { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, FileText, Eye, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { analyticsService } from '../api/analyticsService';
import { useFetch, useMutation } from '../hooks/useFetch';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export const AnalyticsDashboard = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedQuarter, setSelectedQuarter] = useState(1);

  // Fetch dashboard analytics
  const { data: dashboardData, isLoading: dashboardLoading } = useFetch(
    () => analyticsService.getDashboardAnalytics(),
    []
  );

  // Fetch recent reports
  const { data: reports, isLoading: reportsLoading } = useFetch(
    () => analyticsService.getRecentReports(4),
    []
  );

  // Generate report mutation
  const generateReportMutation = useMutation(
    () => analyticsService.generateQuarterlyReport(selectedQuarter, selectedYear),
    {
      onSuccess: () => {
        toast.success('Quarterly report generated successfully!');
        setShowReportModal(false);
      },
    }
  );

  const handleGenerateReport = async () => {
    try {
      await generateReportMutation.mutate(undefined as any);
    } catch (error) {
      toast.error('Failed to generate report');
    }
  };

  if (dashboardLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <button
          onClick={() => setShowReportModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Generate Quarterly Report
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<FileText className="w-5 h-5" />}
          title="Total Published"
          value={dashboardData?.totalNewsPublished || 0}
          trend={12}
        />
        <MetricCard
          icon={<Eye className="w-5 h-5" />}
          title="Total Views"
          value={dashboardData?.totalViews || 0}
          trend={8}
        />
        <MetricCard
          icon={<MessageSquare className="w-5 h-5" />}
          title="Avg Engagement"
          value={`${(dashboardData?.averageEngagementRate || 0).toFixed(2)}%`}
          trend={-2}
        />
        <MetricCard
          icon={<TrendingUp className="w-5 h-5" />}
          title="Avg Sentiment"
          value={`${(dashboardData?.averageSentimentScore || 0.5).toFixed(2)}/1.0`}
          trend={5}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dashboardData?.monthlyTrends || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="published" stroke="#3B82F6" name="Published" />
              <Line type="monotone" dataKey="views" stroke="#10B981" name="Views" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Category Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dashboardData?.categoryStats || []}
                dataKey="count"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {(dashboardData?.categoryStats || []).map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Category Performance */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Category Performance
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboardData?.categoryStats || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="views" fill="#3B82F6" name="Views" />
              <Bar dataKey="averageEngagement" fill="#10B981" name="Avg Engagement" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pending Status */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Overview</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Pending Review</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <span className="font-bold text-gray-900">{dashboardData?.pendingReview || 0}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Rejected</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="font-bold text-gray-900">{dashboardData?.rejectedNews || 0}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Published</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="font-bold text-gray-900">{dashboardData?.totalNewsPublished || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Quarterly Reports</h3>
        {reportsLoading ? (
          <div className="text-center text-gray-500">Loading reports...</div>
        ) : (reports || []).length === 0 ? (
          <div className="text-center text-gray-500">No reports generated yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Published
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Views
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Engagement
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Sentiment
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {(reports || []).map((report) => (
                  <tr key={report.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      Q{report.quarter} {report.year}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {report.totalNewsPublished}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{report.totalViews}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {report.averageEngagementRate.toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {report.averageSentimentScore.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button className="text-blue-600 hover:text-blue-700 font-medium">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generate Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Generate Quarterly Report
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quarter
                </label>
                <select
                  value={selectedQuarter}
                  onChange={(e) => setSelectedQuarter(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>Q1</option>
                  <option value={2}>Q2</option>
                  <option value={3}>Q3</option>
                  <option value={4}>Q4</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year
                </label>
                <input
                  type="number"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowReportModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateReport}
                disabled={generateReportMutation.isLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400"
              >
                {generateReportMutation.isLoading ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  trend: number;
}

const MetricCard = ({ icon, title, value, trend }: MetricCardProps) => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
        {icon}
      </div>
    </div>
    <div className="flex items-center gap-1 mt-3">
      {trend > 0 ? (
        <TrendingUp className="w-4 h-4 text-green-600" />
      ) : (
        <TrendingDown className="w-4 h-4 text-red-600" />
      )}
      <span className={trend > 0 ? 'text-green-600' : 'text-red-600'}>
        {Math.abs(trend)}% {trend > 0 ? 'increase' : 'decrease'}
      </span>
    </div>
  </div>
);
