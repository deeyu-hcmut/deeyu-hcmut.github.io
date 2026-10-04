import React, { useState } from 'react';
import { 
  Newspaper, 
  Search, 
  Tag, 
  Calendar, 
  Eye, 
  User, 
  ArrowRight, 
  Share2, 
  Plus, 
  Check, 
  X,
  Sparkles,
  BookOpen,
  Pencil,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { NewsItem, NewsCategory, Role } from '../types';
import { sizedImage } from '../utils/image';

interface NewsFeedProps {
  newsList: NewsItem[];
  currentRole: Role;
  onCreateNews: (item: Partial<NewsItem>) => void;
  onUpdateNews: (newsId: string, patch: Partial<NewsItem>) => Promise<void>;
  onDeleteNews: (item: NewsItem) => Promise<void>;
}

export const NewsFeed: React.FC<NewsFeedProps> = ({ newsList, currentRole, onCreateNews, onUpdateNews, onDeleteNews }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [isCreatingModal, setIsCreatingModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // New News form state
  const [newTitle, setNewTitle] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<NewsCategory>('HOAT_DONG_KHOA');
  const [newTags, setNewTags] = useState('FEE, Tuổi trẻ');
  const [newCover, setNewCover] = useState('https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80');

  const canEditNews = currentRole === 'SUPER_ADMIN' || currentRole === 'EDITOR';
  // The create form doubles as the edit form when this is set
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [savingNews, setSavingNews] = useState(false);
  const [newsFormError, setNewsFormError] = useState<string | null>(null);
  const [deletingNews, setDeletingNews] = useState<NewsItem | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const openCreateNews = () => {
    setEditingNews(null);
    setNewsFormError(null);
    setNewTitle('');
    setNewSummary('');
    setNewContent('');
    setNewCategory('HOAT_DONG_KHOA');
    setNewTags('FEE, Tuổi trẻ');
    setNewCover('https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80');
    setIsCreatingModal(true);
  };

  const openEditNews = (item: NewsItem) => {
    setSelectedNews(null);
    setEditingNews(item);
    setNewsFormError(null);
    setNewTitle(item.title);
    setNewSummary(item.summary);
    setNewContent(item.content);
    setNewCategory(item.category);
    setNewTags(item.tags.join(', '));
    setNewCover(item.coverImage);
    setIsCreatingModal(true);
  };

  const closeNewsForm = () => {
    if (savingNews) return;
    setIsCreatingModal(false);
    setEditingNews(null);
  };

  const askDeleteNews = (item: NewsItem) => {
    setSelectedNews(null);
    setDeleteError(null);
    setDeletingNews(item);
  };

  const handleConfirmDeleteNews = async () => {
    if (!deletingNews) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await onDeleteNews(deletingNews);
      setDeletingNews(null);
    } catch (err: any) {
      setDeleteError(err?.message || 'Không xoá được bài viết. Vui lòng thử lại.');
    } finally {
      setDeleteBusy(false);
    }
  };

  const categories = [
    { id: 'ALL', label: 'Tất cả Bản tin' },
    { id: 'HOAT_DONG_KHOA', label: 'Hoạt động Đoàn - Hội' },
    { id: 'CUOC_THI_NCKH', label: 'Cuộc thi & NCKH' },
    { id: 'PHONG_TRAO_SINH_VIEN', label: 'Phong trào & Tình nguyện' },
    { id: 'HOC_BONG_DOANH_NGHIEP', label: 'Học bổng & Doanh nghiệp' },
    { id: 'THONG_BAO_HOC_THUAT', label: 'Thông báo Học vụ' },
  ];

  // Extract all unique tags
  const allTags = Array.from(new Set(newsList.flatMap(n => n.tags)));

  const filteredNews = newsList.filter(item => {
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesSearch = 
      searchQuery === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTag = !selectedTag || item.tags.includes(selectedTag);

    return matchesCategory && matchesSearch && matchesTag;
  });

  const featuredArticle = newsList.find(n => n.featured) || newsList[0];

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const catObj = categories.find(c => c.id === newCategory);

    if (editingNews) {
      setSavingNews(true);
      setNewsFormError(null);
      try {
        await onUpdateNews(editingNews.id, {
          title: newTitle.trim(),
          summary: newSummary,
          content: newContent,
          category: newCategory,
          categoryName: catObj ? catObj.label : editingNews.categoryName,
          tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
          coverImage: newCover.trim() || editingNews.coverImage,
        });
        setIsCreatingModal(false);
        setEditingNews(null);
      } catch (err: any) {
        setNewsFormError(err?.message || 'Không lưu được thay đổi. Vui lòng thử lại.');
      } finally {
        setSavingNews(false);
      }
      return;
    }
    onCreateNews({
      title: newTitle,
      summary: newSummary,
      content: newContent,
      category: newCategory,
      categoryName: catObj ? catObj.label : 'Hoạt động',
      tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
      coverImage: newCover.trim() || undefined,
      author: 'Ban Truyền thông Đoàn - Hội Khoa',
      authorRole: 'Ban Truyền thông'
    });

    setIsCreatingModal(false);
    setNewTitle('');
    setNewSummary('');
    setNewContent('');
  };

  const handleShare = (news: NewsItem) => {
    navigator.clipboard.writeText(`${window.location.origin}/#news-${news.slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="py-10 bg-slate-50 dark:bg-slate-950 min-h-[75vh]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 pb-8 border-b border-slate-200 dark:border-slate-700">
          <div>
            <div className="flex items-center space-x-3">
              <span className="p-3 rounded-2xl bg-blue-100/80 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-400/30 shadow-2xs">
                <Newspaper className="w-6 h-6" />
              </span>
              <div>
                <h2 className="font-tech text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                  BẢNG TIN & HOẠT ĐỘNG ĐOÀN - HỘI
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">Cập nhật tin tức phong trào, học bổng doanh nghiệp, thông báo và cuộc thi NCKH khoa Điện - Điện tử</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Search Bar */}
            <div className="relative flex-1 sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="news-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tin tức, từ khóa, tag..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 shadow-2xs focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Create News Button (Admin/Editor) */}
            {(currentRole === 'SUPER_ADMIN' || currentRole === 'EDITOR') && (
              <button
                id="create-news-btn"
                onClick={openCreateNews}
                className="flex items-center space-x-2 px-4 py-3 rounded-2xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-600/20 whitespace-nowrap cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Đăng tin mới</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Filters */}
        <div className="mt-6 flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              id={`cat-filter-${cat.id}`}
              onClick={() => {
                setSelectedCategory(cat.id);
                setSelectedTag(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id && !selectedTag
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700 shadow-sm'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Popular Tags List */}
        <div className="mt-3 flex items-center space-x-2 overflow-x-auto pb-1">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center whitespace-nowrap font-medium">
            <Tag className="w-3 h-3 mr-1 text-slate-400" />
            Tags:
          </span>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                selectedTag === tag 
                  ? 'bg-orange-500 text-white font-bold' 
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-300 border border-slate-200 dark:border-slate-700 shadow-2xs'
              }`}
            >
              #{tag}
            </button>
          ))}
          {selectedTag && (
            <button 
              onClick={() => setSelectedTag(null)} 
              className="text-[10px] text-rose-600 dark:text-rose-300 hover:underline ml-2 whitespace-nowrap font-semibold"
            >
              (Bỏ lọc tag)
            </button>
          )}
        </div>

        {/* Featured Article Card (if no search active) */}
        {!searchQuery && !selectedTag && selectedCategory === 'ALL' && featuredArticle && (
          <div 
            id="featured-news-banner"
            onClick={() => setSelectedNews(featuredArticle)}
            className="mt-8 rounded-3xl overflow-hidden border border-blue-200 dark:border-blue-400/30 bg-white dark:bg-slate-900 cursor-pointer group hover:border-blue-400 hover:shadow-xl transition-all shadow-sm"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
              <div className="lg:col-span-7 relative h-56 sm:h-72 lg:h-96 overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img 
                  src={featuredArticle.coverImage} 
                  alt={featuredArticle.title}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent lg:hidden" />
                <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-extrabold tracking-wider uppercase shadow-md">
                  Tiêu điểm Tuần
                </span>
                {canEditNews && (
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); openEditNews(featuredArticle); }}
                      className="p-2 rounded-xl bg-slate-900/80 text-white hover:bg-blue-600 border border-white/20 backdrop-blur-md transition-colors"
                      aria-label="Sửa bài viết"
                      title="Sửa bài viết"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); askDeleteNews(featuredArticle); }}
                      className="p-2 rounded-xl bg-slate-900/80 text-rose-300 hover:bg-rose-600 hover:text-white border border-white/20 backdrop-blur-md transition-colors"
                      aria-label="Xoá bài viết"
                      title="Xoá bài viết"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 mb-3">
                    <span className="px-2.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-400/30">
                      {featuredArticle.categoryName}
                    </span>
                    <span>•</span>
                    <span className="flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      {new Date(featuredArticle.publishedAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  <h3 className="font-tech text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors leading-snug">
                    {featuredArticle.title}
                  </h3>

                  <p className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                    {featuredArticle.summary}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-400/30 flex items-center justify-center text-blue-600 dark:text-blue-300">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{featuredArticle.author}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{featuredArticle.authorRole}</p>
                    </div>
                  </div>

                  <span className="flex items-center space-x-1 text-xs font-bold text-blue-600 dark:text-blue-300 group-hover:translate-x-1 transition-transform">
                    <span>Đọc tiếp</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* News Grid */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Danh sách Tin tức ({filteredNews.length})
            </h3>
          </div>

          {filteredNews.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <Newspaper className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Không tìm thấy bài viết phù hợp với tiêu chí lọc.</p>
              <button
                onClick={() => { setSelectedCategory('ALL'); setSearchQuery(''); setSelectedTag(null); }}
                className="mt-3 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-400/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
              >
                Đặt lại bộ lọc
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNews.map((news) => (
                <article
                  key={news.id}
                  id={`news-card-${news.id}`}
                  onClick={() => setSelectedNews(news)}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-400/30 hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden group cursor-pointer shadow-sm"
                >
                  <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img 
                      src={sizedImage(news.coverImage, 800)} 
                      alt={news.title}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {canEditNews && (
                      <div className="absolute top-3 right-3 flex gap-2">
                        <button
                      onClick={(e) => { e.stopPropagation(); openEditNews(news); }}
                      className="p-2 rounded-xl bg-slate-900/80 text-white hover:bg-blue-600 border border-white/20 backdrop-blur-md transition-colors"
                      aria-label="Sửa bài viết"
                      title="Sửa bài viết"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                        <button
                      onClick={(e) => { e.stopPropagation(); askDeleteNews(news); }}
                      className="p-2 rounded-xl bg-slate-900/80 text-rose-300 hover:bg-rose-600 hover:text-white border border-white/20 backdrop-blur-md transition-colors"
                      aria-label="Xoá bài viết"
                      title="Xoá bài viết"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/90 dark:bg-slate-900/90 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-400/30 backdrop-blur-sm shadow-xs">
                        {news.categoryName}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{new Date(news.publishedAt).toLocaleDateString('vi-VN')}</span>
                        <span>•</span>
                        <span className="flex items-center">
                          <Eye className="w-3 h-3 mr-1 text-slate-400" />
                          {news.views} lượt xem
                        </span>
                      </div>

                      <h4 className="font-tech text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors line-clamp-2 leading-snug">
                        {news.title}
                      </h4>

                      <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                        {news.summary}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {news.tags.slice(0, 3).map((t, idx) => (
                          <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                            #{t}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[150px]">
                          Bởi {news.author}
                        </span>
                        <span className="text-blue-600 dark:text-blue-300 font-bold group-hover:translate-x-0.5 transition-transform flex items-center">
                          Chi tiết <ArrowRight className="w-3 h-3 ml-1" />
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Modal: Read News Article Detail */}
        {selectedNews && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
              
              {/* Modal Header */}
              <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-400/30">
                    {selectedNews.categoryName}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {new Date(selectedNews.publishedAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {canEditNews && (
                    <>
                      <button
                      onClick={(e) => { e.stopPropagation(); openEditNews(selectedNews); }}
                      className="p-1.5 rounded-lg bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-300 border border-slate-200 dark:border-slate-700"
                      aria-label="Sửa bài viết"
                      title="Sửa bài viết"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                      <button
                      onClick={(e) => { e.stopPropagation(); askDeleteNews(selectedNews); }}
                      className="p-1.5 rounded-lg bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700"
                      aria-label="Xoá bài viết"
                      title="Xoá bài viết"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    </>
                  )}
                  <button
                    onClick={() => handleShare(selectedNews)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-300" /> : <Share2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-300" />}
                    <span>{copied ? 'Đã sao chép link' : 'Chia sẻ'}</span>
                  </button>

                  <button
                    onClick={() => setSelectedNews(null)}
                    className="p-1.5 rounded-lg bg-slate-200/70 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Content Scrollable */}
              <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
                <h1 className="font-tech text-xl sm:text-3xl font-extrabold text-slate-950 dark:text-slate-100 leading-snug">
                  {selectedNews.title}
                </h1>

                <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400 pb-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-400/30 flex items-center justify-center text-blue-700 dark:text-blue-300">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">{selectedNews.author}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{selectedNews.authorRole}</p>
                  </div>
                </div>

                <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                  <img 
                    src={selectedNews.coverImage} 
                    alt={selectedNews.title} 
                    referrerPolicy="no-referrer"
                    decoding="async"
                    className="w-full max-h-80 object-cover"
                  />
                </div>

                {/* Summary block */}
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border-l-4 border-blue-600 text-blue-900 dark:text-blue-200 text-sm font-medium leading-relaxed">
                  {selectedNews.summary}
                </div>

                {/* Article Body */}
                <div className="text-slate-700 dark:text-slate-200 text-sm sm:text-base leading-relaxed space-y-4 whitespace-pre-line">
                  {selectedNews.content}
                </div>

                {/* Tags in modal */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center flex-wrap gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center">
                    <Tag className="w-3.5 h-3.5 mr-1" />
                    Chủ đề:
                  </span>
                  {selectedNews.tags.map((t, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-slate-200 dark:border-slate-700">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Confirm news deletion */}
        {deletingNews && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => !deleteBusy && setDeletingNews(null)}>
            <div
              role="alertdialog"
              aria-labelledby="delete-news-title"
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex items-start space-x-3">
                <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300 flex-shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 id="delete-news-title" className="font-tech text-lg font-bold text-slate-900 dark:text-slate-100">Xoá bài viết này?</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200 break-words">{deletingNews.title}</p>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Bài viết sẽ bị gỡ khỏi trang. Không thể hoàn tác.</p>
                  {deleteError && (
                    <p className="mt-3 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-400/30 rounded-lg px-3 py-2">{deleteError}</p>
                  )}
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setDeletingNews(null)}
                  disabled={deleteBusy}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 disabled:opacity-50"
                >
                  Huỷ
                </button>
                <button
                  id="confirm-delete-news-btn"
                  onClick={handleConfirmDeleteNews}
                  disabled={deleteBusy}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60 flex items-center space-x-1.5"
                >
                  {deleteBusy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  <span>{deleteBusy ? 'Đang xoá…' : 'Xoá bài viết'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Create News Article */}
        {isCreatingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700 mb-4">
                <h3 className="font-tech text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                  {editingNews ? <Pencil className="w-5 h-5 text-blue-600 dark:text-blue-300" /> : <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-300" />}
                  <span>{editingNews ? 'Sửa bài viết' : 'Đăng Tin tức Mới (Ban Truyền thông)'}</span>
                </h3>
                <button onClick={closeNewsForm} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Tiêu đề bài viết *</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="VD: Khởi động Cuộc thi Robot Tự hành FEE Robocon 2026..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Chuyên mục *</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as NewsCategory)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="HOAT_DONG_KHOA">Hoạt động Đoàn - Hội</option>
                      <option value="CUOC_THI_NCKH">Cuộc thi & NCKH</option>
                      <option value="PHONG_TRAO_SINH_VIEN">Phong trào & Tình nguyện</option>
                      <option value="HOC_BONG_DOANH_NGHIEP">Học bổng & Doanh nghiệp</option>
                      <option value="THONG_BAO_HOC_THUAT">Thông báo Học vụ</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Tags (cách nhau bởi dấu phẩy)</label>
                    <input
                      type="text"
                      value={newTags}
                      onChange={(e) => setNewTags(e.target.value)}
                      placeholder="Vi mạch, Robocon, ĐRL +10..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Tóm tắt ngắn gọn *</label>
                  <textarea
                    rows={2}
                    required
                    value={newSummary}
                    onChange={(e) => setNewSummary(e.target.value)}
                    placeholder="Tóm tắt ngắn hiển thị trên thẻ bài viết..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Nội dung chi tiết *</label>
                  <textarea
                    rows={5}
                    required
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Nhập nội dung đầy đủ bài viết..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Ảnh bìa (link ảnh)</label>
                  <input
                    type="url"
                    value={newCover}
                    onChange={(e) => setNewCover(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {newsFormError && (
                  <p className="text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-400/30 rounded-lg px-3 py-2">{newsFormError}</p>
                )}


                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={closeNewsForm}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={savingNews}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-sm disabled:opacity-60"
                  >
                    {editingNews ? (savingNews ? 'Đang lưu…' : 'Lưu thay đổi') : 'Đăng bản tin'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
