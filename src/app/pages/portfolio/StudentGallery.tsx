import { useEffect, useState } from 'react';
import { Image as ImageIcon, Eye, Star, MessageSquare } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../context/LanguageContext';

interface PortfolioItem {
  id: string;
  student: string;
  title: string;
  category: string;
  date: string;
  score: number;
  feedback: string;
  status: 'Approved' | 'Pending' | 'Revision Required';
  imageUrl?: string;
}

export default function StudentGallery() {
  const { t } = useLanguage();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [filter, setFilter] = useState('All');
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGalleryItems();
  }, []);

  async function fetchGalleryItems() {
    setLoading(true);

    const { data, error } = await supabase
      .from('portfolio_items')
      .select(`
        id,
        title,
        description,
        file_url,
        portfolio_status,
        submitted_at,
        students(full_name),
        portfolio_feedback(score, feedback)
      `)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching gallery:', error.message);
      setLoading(false);
      return;
    }

    const mapped: PortfolioItem[] = (data || []).map((item: any) => {
      const feedback = Array.isArray(item.portfolio_feedback)
        ? item.portfolio_feedback[0]
        : item.portfolio_feedback;

      return {
        id: item.id,
        student: getStudentName(item.students, t),
        title: item.title || '-',
        category: getCategory(item.title, item.description),
        date: item.submitted_at
          ? new Date(item.submitted_at).toISOString().slice(0, 10)
          : '-',
        score: Number(feedback?.score || 0),
        feedback: feedback?.feedback || '',
        status: mapStatus(item.portfolio_status),
        imageUrl: item.file_url,
      };
    });

    setItems(mapped);
    setLoading(false);
  }

  async function updateStatus(
    id: string,
    status: 'approved' | 'revision_required'
  ) {
    const { error } = await supabase
      .from('portfolio_items')
      .update({ portfolio_status: status })
      .eq('id', id);

    if (error) {
      alert(t('portfolio.gallery.errorUpdateItem', { message: error.message }));
      return;
    }

    setSelectedItem(null);
    fetchGalleryItems();
  }

  const categories = ['All', ...Array.from(new Set(items.map((item) => item.category)))];

  const filteredItems =
    filter === 'All' ? items : items.filter((item) => item.category === filter);

  function categoryLabel(category: string) {
    switch (category) {
      case 'All':
        return t('portfolio.gallery.categoryAll');
      case 'Bridal':
        return t('portfolio.gallery.categoryBridal');
      case 'Editorial':
        return t('portfolio.gallery.categoryEditorial');
      case 'Natural':
        return t('portfolio.gallery.categoryNatural');
      case 'SFX':
        return t('portfolio.gallery.categorySfx');
      case 'Airbrush':
        return t('portfolio.gallery.categoryAirbrush');
      default:
        return t('portfolio.gallery.categoryPortfolio');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-[#284342]">{t('portfolio.gallery.title')}</h1>
        <p className="text-[#6b6b6b] mt-1">
          {t('portfolio.gallery.subtitle')}
        </p>
      </div>

      <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === category
                  ? 'bg-[#284342] text-[#e9da95]'
                  : 'bg-[#f8f8f6] text-[#284342]'
              }`}
            >
              {categoryLabel(category)}
            </button>
          ))}
        </div>

        {loading && (
          <div className="text-center text-[#6b6b6b] py-8">
            {t('portfolio.gallery.loading')}
          </div>
        )}

        {!loading && filteredItems.length === 0 && (
          <div className="text-center text-[#6b6b6b] py-8">
            {t('portfolio.gallery.empty')}
          </div>
        )}

        {!loading && filteredItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-square bg-gradient-to-br from-[#284342] to-[#6b8e8d] flex items-center justify-center overflow-hidden">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <ImageIcon size={64} className="text-[#e9da95] opacity-50" />
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-sm text-[#284342] mb-1">
                        {item.title}
                      </h3>
                      <p className="text-xs text-[#6b6b6b]">{t('portfolio.gallery.byStudent', { name: item.student })}</p>
                    </div>

                    <StatusBadge status={item.status} t={t} />
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs bg-[#e9da95]/20 text-[#284342] px-2 py-1 rounded">
                      {categoryLabel(item.category)}
                    </span>
                    <span className="text-xs text-[#6b6b6b]">{item.date}</span>
                  </div>

                  {item.score > 0 && (
                    <div className="flex items-center gap-2 mb-3">
                      <Star size={16} className="text-[#e9da95] fill-[#e9da95]" />
                      <span className="text-sm text-[#284342]">
                        {item.score}%
                      </span>
                    </div>
                  )}

                  {item.feedback && (
                    <div className="mb-3 p-2 bg-[#f8f8f6] rounded text-xs text-[#6b6b6b]">
                      <MessageSquare size={12} className="inline mr-1" />
                      {item.feedback}
                    </div>
                  )}

                  <button
                    onClick={() => setSelectedItem(item)}
                    className="w-full py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <Eye size={16} />
                    {t('payments.plans.viewDetails')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-[rgba(40,67,66,0.1)]">
              <h2 className="text-xl text-[#284342]">{selectedItem.title}</h2>
              <p className="text-sm text-[#6b6b6b] mt-1">
                {t('portfolio.gallery.byStudent', { name: selectedItem.student })}
              </p>
            </div>

            <div className="p-6">
              <div className="aspect-video bg-gradient-to-br from-[#284342] to-[#6b8e8d] rounded-lg flex items-center justify-center mb-6 overflow-hidden">
                {selectedItem.imageUrl ? (
                  <img
                    src={selectedItem.imageUrl}
                    alt={selectedItem.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <ImageIcon size={96} className="text-[#e9da95] opacity-50" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <Detail label={t('portfolio.gallery.category')} value={categoryLabel(selectedItem.category)} />
                <Detail label={t('portfolio.gallery.submissionDate')} value={selectedItem.date} />
                <Detail label={t('portfolio.feedback.score')} value={`${selectedItem.score}%`} />

                <div>
                  <p className="text-xs text-[#6b6b6b] mb-1">{t('payments.installments.colStatus')}</p>
                  <StatusBadge status={selectedItem.status} t={t} />
                </div>
              </div>

              {selectedItem.feedback && (
                <div className="mb-6">
                  <p className="text-xs text-[#6b6b6b] mb-2">
                    {t('portfolio.gallery.teacherFeedback')}
                  </p>
                  <div className="p-4 bg-[#f8f8f6] rounded-lg text-sm text-[#284342]">
                    {selectedItem.feedback}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-[rgba(40,67,66,0.1)] flex items-center gap-3">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-6 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors"
              >
                {t('payments.receipts.close')}
              </button>

              {selectedItem.status === 'Pending' && (
                <>
                  <button
                    onClick={() => updateStatus(selectedItem.id, 'approved')}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    {t('common.approve')}
                  </button>

                  <button
                    onClick={() =>
                      updateStatus(selectedItem.id, 'revision_required')
                    }
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    {t('portfolio.feedback.requestRevision')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function mapStatus(status: string): PortfolioItem['status'] {
  if (status === 'approved' || status === 'reviewed') return 'Approved';
  if (status === 'revision_required') return 'Revision Required';
  return 'Pending';
}

function getStudentName(student: any, t: (key: string) => string) {
  if (!student) return t('dashboard.fallback.unnamedStudent');
  if (Array.isArray(student)) return student[0]?.full_name || t('dashboard.fallback.unnamedStudent');
  return student.full_name || t('dashboard.fallback.unnamedStudent');
}

function getCategory(title: string, description: string) {
  const text = `${title || ''} ${description || ''}`.toLowerCase();

  if (text.includes('bridal')) return 'Bridal';
  if (text.includes('editorial')) return 'Editorial';
  if (text.includes('natural')) return 'Natural';
  if (text.includes('sfx') || text.includes('special effects')) return 'SFX';
  if (text.includes('airbrush')) return 'Airbrush';

  return 'Portfolio';
}

function StatusBadge({
  status,
  t,
}: {
  status: PortfolioItem['status'];
  t: (key: string) => string;
}) {
  const className =
    status === 'Approved'
      ? 'bg-green-100 text-green-700'
      : status === 'Pending'
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-red-100 text-red-700';

  const label =
    status === 'Approved'
      ? t('portfolio.gallery.statusApproved')
      : status === 'Pending'
      ? t('common.pending')
      : t('portfolio.gallery.statusRevisionRequired');

  return (
    <span className={`text-xs px-2 py-1 rounded-full ${className}`}>
      {label}
    </span>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[#6b6b6b] mb-1">{label}</p>
      <p className="text-sm text-[#284342]">{value}</p>
    </div>
  );
}