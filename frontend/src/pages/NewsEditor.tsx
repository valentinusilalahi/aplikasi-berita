import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, Send, X, Upload, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { newsService } from '../api/newsService';
import { useMutation, useFetch } from '../hooks/useFetch';

const CATEGORIES = ['Politics', 'Business', 'Technology', 'Sports', 'Entertainment', 'Health', 'Other'];

export const NewsEditor = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const newsId = id ? Number(id) : null;
  const isEditing = newsId !== null && !isNaN(newsId);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: CATEGORIES[0],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Fetch existing news if editing
  const { data: newsData, isLoading: isLoadingNews } = useFetch(
    isEditing ? () => newsService.getNews(newsId!) : () => Promise.resolve(null),
    [newsId, isEditing],
    false
  );

  // Load existing data when editing
  useEffect(() => {
    if (isEditing && newsData) {
      setFormData({
        title: newsData.title,
        content: newsData.content,
        category: newsData.category,
      });
    }
  }, [newsData, isEditing]);

  // Create mutation
  const createMutation = useMutation(
    () => newsService.createNews(formData),
    {
      onSuccess: (data) => {
        toast.success('News created successfully!');
        navigate(`/news/${data.id}`);
      },
    }
  );

  // Update mutation
  const updateMutation = useMutation(
    () => newsService.updateNews(newsId!, formData),
    {
      onSuccess: (data) => {
        toast.success('News updated successfully!');
        navigate(`/news/${data.id}`);
      },
    }
  );

  // Submit for review mutation
  const submitMutation = useMutation(
    () => newsService.submitForReview(newsId!),
    {
      onSuccess: () => {
        toast.success('News submitted for review!');
        navigate('/news');
      },
    }
  );

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    } else if (formData.content.length < 50) {
      newErrors.content = 'Content must be at least 50 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveDraft = async () => {
    if (!validateForm()) return;

    try {
      if (isEditing) {
        await updateMutation.mutate(undefined as any);
      } else {
        await createMutation.mutate(undefined as any);
      }
    } catch (error) {
      toast.error('Failed to save news');
    }
  };

  const handleSubmitReview = async () => {
    if (!validateForm()) return;

    try {
      if (!isEditing) {
        await createMutation.mutate(undefined as any);
        // After create, the onSuccess handler navigates away
      } else {
        await updateMutation.mutate(undefined as any);
        await submitMutation.mutate(undefined as any);
      }
    } catch (error) {
      toast.error('Failed to submit news');
    }
  };

  if (isLoadingNews) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600">Loading news...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md">
        {/* Header */}
        <div className="border-b border-gray-200 p-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit News' : 'Create News'}
          </h1>
          <button
            onClick={() => navigate('/news')}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter news title"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.title && (
              <div className="flex items-center mt-1 text-red-500 text-sm">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.title}
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="Enter news content (minimum 50 characters)"
              rows={10}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm ${
                errors.content ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.content && (
              <div className="flex items-center mt-1 text-red-500 text-sm">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.content}
              </div>
            )}
            <p className="text-gray-500 text-sm mt-1">
              {formData.content.length} characters
            </p>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attachments
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <label className="cursor-pointer">
                <span className="text-blue-600 hover:text-blue-700 font-medium">
                  Click to upload
                </span>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  multiple
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                />
              </label>
              <p className="text-gray-500 text-sm mt-1">
                or drag and drop (PDF, DOC, TXT, JPG, PNG up to 50MB)
              </p>
            </div>

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="text-sm text-gray-700 truncate">
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
                    </span>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 p-6 flex gap-3 justify-end">
          <button
            onClick={() => navigate('/news')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveDraft}
            disabled={createMutation.isLoading || updateMutation.isLoading}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition disabled:bg-gray-400 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save as Draft
          </button>
          <button
            onClick={handleSubmitReview}
            disabled={createMutation.isLoading || updateMutation.isLoading || submitMutation.isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-blue-400 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Submit for Review
          </button>
        </div>
      </div>
    </div>
  );
};
