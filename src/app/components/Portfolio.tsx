import { useState } from 'react';
import { Search, Upload, Eye, Download, CheckCircle, XCircle, MessageSquare } from 'lucide-react';

interface PortfolioItem {
  id: number;
  studentName: string;
  title: string;
  category: 'Before/After' | 'Practical Work' | 'Assignment';
  submissionDate: string;
  status: 'Pending Review' | 'Approved' | 'Revision Needed';
  score: number | null;
  feedback: string | null;
  avatar: string;
}

const portfolioData: PortfolioItem[] = [
  {
    id: 1,
    studentName: 'Wong Xiao Ming',
    title: 'Bridal Makeup Transformation',
    category: 'Before/After',
    submissionDate: '2026-05-28',
    status: 'Approved',
    score: 92,
    feedback: 'Excellent blending technique and color selection',
    avatar: 'WX',
  },
  {
    id: 2,
    studentName: 'Tan Da Ai',
    title: 'Evening Glam Look',
    category: 'Practical Work',
    submissionDate: '2026-05-29',
    status: 'Pending Review',
    score: null,
    feedback: null,
    avatar: 'TD',
  },
  {
    id: 3,
    studentName: 'Lee Mei Ling',
    title: 'Hair Styling Portfolio',
    category: 'Assignment',
    submissionDate: '2026-05-27',
    status: 'Revision Needed',
    score: 78,
    feedback: 'Good effort, but needs improvement on volume techniques',
    avatar: 'LM',
  },
  {
    id: 4,
    studentName: 'Kavitha',
    title: 'Skincare Before/After',
    category: 'Before/After',
    submissionDate: '2026-05-30',
    status: 'Approved',
    score: 88,
    feedback: 'Clear documentation and professional presentation',
    avatar: 'KV',
  },
  {
    id: 5,
    studentName: 'Farah',
    title: 'Nail Art Collection',
    category: 'Practical Work',
    submissionDate: '2026-05-26',
    status: 'Approved',
    score: 95,
    feedback: 'Outstanding creativity and precision',
    avatar: 'FR',
  },
];

export default function Portfolio() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const filteredPortfolio = portfolioData.filter((item) => {
    const matchesSearch =
      item.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'All' || item.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return { bg: 'rgba(40, 67, 66, 0.1)', text: '#284342' };
      case 'Pending Review':
        return { bg: 'rgba(233, 218, 149, 0.3)', text: '#284342' };
      case 'Revision Needed':
        return { bg: 'rgba(212, 24, 61, 0.1)', text: '#d4183d' };
      default:
        return { bg: 'rgba(107, 107, 107, 0.1)', text: '#6b6b6b' };
    }
  };

  const pendingCount = portfolioData.filter((p) => p.status === 'Pending Review').length;
  const approvedCount = portfolioData.filter((p) => p.status === 'Approved').length;
  const revisionCount = portfolioData.filter((p) => p.status === 'Revision Needed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 style={{ color: '#284342' }}>Portfolio Management</h1>
          <p style={{ color: '#6b6b6b' }}>Review and manage student portfolio submissions</p>
        </div>
        <button
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-all hover:opacity-90"
          style={{ background: '#284342', color: '#e9da95' }}
        >
          <Upload className="w-5 h-5" />
          Upload Portfolio
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 border" style={{ borderColor: 'rgba(40, 67, 66, 0.1)' }}>
          <p className="text-sm mb-2" style={{ color: '#6b6b6b' }}>Total Submissions</p>
          <h2 style={{ color: '#284342' }}>{portfolioData.length}</h2>
        </div>
        <div className="bg-white rounded-xl p-6 border" style={{ borderColor: 'rgba(40, 67, 66, 0.1)' }}>
          <p className="text-sm mb-2" style={{ color: '#6b6b6b' }}>Pending Review</p>
          <h2 style={{ color: '#284342' }}>{pendingCount}</h2>
        </div>
        <div className="bg-white rounded-xl p-6 border" style={{ borderColor: 'rgba(40, 67, 66, 0.1)' }}>
          <p className="text-sm mb-2" style={{ color: '#6b6b6b' }}>Approved</p>
          <h2 style={{ color: '#284342' }}>{approvedCount}</h2>
        </div>
        <div className="bg-white rounded-xl p-6 border" style={{ borderColor: 'rgba(40, 67, 66, 0.1)' }}>
          <p className="text-sm mb-2" style={{ color: '#6b6b6b' }}>Needs Revision</p>
          <h2 style={{ color: '#d4183d' }}>{revisionCount}</h2>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl p-4 border" style={{ borderColor: 'rgba(40, 67, 66, 0.1)' }}>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#6b6b6b' }} />
            <input
              type="text"
              placeholder="Search portfolio items"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-lg border focus:outline-none focus:ring-1"
              style={{ borderColor: 'rgba(40, 67, 66, 0.2)' }}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-1"
            style={{ borderColor: 'rgba(40, 67, 66, 0.2)', color: '#284342' }}
          >
            <option>All</option>
            <option>Pending Review</option>
            <option>Approved</option>
            <option>Revision Needed</option>
          </select>
        </div>
      </div>

      {/* Portfolio Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPortfolio.map((item) => {
          const colors = getStatusColor(item.status);
          return (
            <div key={item.id} className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(40, 67, 66, 0.1)' }}>
              <div className="h-48 flex items-center justify-center" style={{ background: '#f8f8f6' }}>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-lg mx-auto mb-3 flex items-center justify-center" style={{ background: '#284342' }}>
                    <Upload className="w-8 h-8" style={{ color: '#e9da95' }} />
                  </div>
                  <p className="text-sm" style={{ color: '#6b6b6b' }}>Portfolio Image</p>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <h3 style={{ color: '#284342' }}>{item.title}</h3>
                    <span
                      className="px-2 py-1 rounded-md text-xs"
                      style={{ background: colors.bg, color: colors.text }}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: '#6b6b6b' }}>{item.category}</p>
                </div>

                <div className="flex items-center gap-3 pb-4 border-b" style={{ borderColor: 'rgba(40, 67, 66, 0.1)' }}>
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: '#284342', color: '#e9da95' }}
                  >
                    <span className="text-sm">{item.avatar}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm" style={{ color: '#284342' }}>{item.studentName}</p>
                    <p className="text-xs" style={{ color: '#6b6b6b' }}>Submitted {item.submissionDate}</p>
                  </div>
                </div>

                {item.score !== null && (
                  <div className="p-3 rounded-lg" style={{ background: '#f8f8f6' }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm" style={{ color: '#6b6b6b' }}>Score</span>
                      <span className="text-lg" style={{ color: '#284342' }}>{item.score}/100</span>
                    </div>
                  </div>
                )}

                {item.feedback && (
                  <div className="p-3 rounded-lg" style={{ background: '#f8f8f6' }}>
                    <div className="flex items-start gap-2 mb-1">
                      <MessageSquare className="w-4 h-4 flex-shrink-0" style={{ color: '#6b6b6b' }} />
                      <p className="text-sm" style={{ color: '#6b6b6b' }}>{item.feedback}</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition-all hover:opacity-90"
                    style={{ background: 'rgba(40, 67, 66, 0.1)', color: '#284342' }}
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  {item.status === 'Pending Review' && (
                    <button
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition-all hover:opacity-90"
                      style={{ background: '#284342', color: '#e9da95' }}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Review
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
