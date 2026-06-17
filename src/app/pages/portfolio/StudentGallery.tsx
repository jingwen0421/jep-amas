import { useState } from 'react';
import { Image as ImageIcon, Eye, Star, MessageSquare } from 'lucide-react';

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
  const items: PortfolioItem[] = [
    { id: 'P001', student: 'Jessica Lim', title: 'Bridal Makeup - Classic Elegance', category: 'Bridal', date: '2026-05-20', score: 92, feedback: 'Excellent color matching and blending', status: 'Approved' },
    { id: 'P002', student: 'Amanda Ng', title: 'Editorial Look - Bold & Dramatic', category: 'Editorial', date: '2026-05-18', score: 88, feedback: 'Creative use of colors, good execution', status: 'Approved' },
    { id: 'P003', student: 'Rachel Tan', title: 'Natural Glam - Everyday Beauty', category: 'Natural', date: '2026-05-15', score: 0, feedback: '', status: 'Pending' },
    { id: 'P004', student: 'Melissa Chong', title: 'Special Effects - Fantasy Character', category: 'SFX', date: '2026-05-12', score: 85, feedback: 'Good technique, needs more detail work', status: 'Revision Required' },
    { id: 'P005', student: 'Grace Lim', title: 'Airbrush Technique Showcase', category: 'Airbrush', date: '2026-05-10', score: 95, feedback: 'Outstanding airbrush skills', status: 'Approved' },
    { id: 'P006', student: 'Jennifer Wong', title: 'Portfolio Photoshoot', category: 'Photography', date: '2026-05-08', score: 90, feedback: 'Professional quality work', status: 'Approved' },
  ];

  const [filter, setFilter] = useState('All');
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);

  const filteredItems = filter === 'All' ? items : items.filter(item => item.category === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-[#284342]">Student Work Gallery</h1>
        <p className="text-[#6b6b6b] mt-1">View and review student portfolio submissions</p>
      </div>

      <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <button onClick={() => setFilter('All')} className={`px-4 py-2 rounded-lg transition-colors ${filter === 'All' ? 'bg-[#284342] text-[#e9da95]' : 'bg-[#f8f8f6] text-[#284342]'}`}>All</button>
          <button onClick={() => setFilter('Bridal')} className={`px-4 py-2 rounded-lg transition-colors ${filter === 'Bridal' ? 'bg-[#284342] text-[#e9da95]' : 'bg-[#f8f8f6] text-[#284342]'}`}>Bridal</button>
          <button onClick={() => setFilter('Editorial')} className={`px-4 py-2 rounded-lg transition-colors ${filter === 'Editorial' ? 'bg-[#284342] text-[#e9da95]' : 'bg-[#f8f8f6] text-[#284342]'}`}>Editorial</button>
          <button onClick={() => setFilter('Natural')} className={`px-4 py-2 rounded-lg transition-colors ${filter === 'Natural' ? 'bg-[#284342] text-[#e9da95]' : 'bg-[#f8f8f6] text-[#284342]'}`}>Natural</button>
          <button onClick={() => setFilter('SFX')} className={`px-4 py-2 rounded-lg transition-colors ${filter === 'SFX' ? 'bg-[#284342] text-[#e9da95]' : 'bg-[#f8f8f6] text-[#284342]'}`}>SFX</button>
          <button onClick={() => setFilter('Airbrush')} className={`px-4 py-2 rounded-lg transition-colors ${filter === 'Airbrush' ? 'bg-[#284342] text-[#e9da95]' : 'bg-[#f8f8f6] text-[#284342]'}`}>Airbrush</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-square bg-gradient-to-br from-[#284342] to-[#6b8e8d] flex items-center justify-center">
                <ImageIcon size={64} className="text-[#e9da95] opacity-50" />
              </div>
              
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-sm text-[#284342] mb-1">{item.title}</h3>
                    <p className="text-xs text-[#6b6b6b]">by {item.student}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    item.status === 'Approved' ? 'bg-green-100 text-green-700' :
                    item.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {item.status}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs bg-[#e9da95]/20 text-[#284342] px-2 py-1 rounded">{item.category}</span>
                  <span className="text-xs text-[#6b6b6b]">{item.date}</span>
                </div>

                {item.score > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <Star size={16} className="text-[#e9da95] fill-[#e9da95]" />
                    <span className="text-sm text-[#284342]">{item.score}%</span>
                  </div>
                )}

                {item.feedback && (
                  <div className="mb-3 p-2 bg-[#f8f8f6] rounded text-xs text-[#6b6b6b]">
                    <MessageSquare size={12} className="inline mr-1" />
                    {item.feedback}
                  </div>
                )}

                <button onClick={() => setSelectedItem(item)} className="w-full py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm flex items-center justify-center gap-2">
                  <Eye size={16} />
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-[rgba(40,67,66,0.1)]">
              <h2 className="text-xl text-[#284342]">{selectedItem.title}</h2>
              <p className="text-sm text-[#6b6b6b] mt-1">by {selectedItem.student}</p>
            </div>

            <div className="p-6">
              <div className="aspect-video bg-gradient-to-br from-[#284342] to-[#6b8e8d] rounded-lg flex items-center justify-center mb-6">
                <ImageIcon size={96} className="text-[#e9da95] opacity-50" />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-xs text-[#6b6b6b] mb-1">Category</p>
                  <p className="text-sm text-[#284342]">{selectedItem.category}</p>
                </div>
                <div>
                  <p className="text-xs text-[#6b6b6b] mb-1">Submission Date</p>
                  <p className="text-sm text-[#284342]">{selectedItem.date}</p>
                </div>
                <div>
                  <p className="text-xs text-[#6b6b6b] mb-1">Score</p>
                  <p className="text-sm text-[#284342]">{selectedItem.score}%</p>
                </div>
                <div>
                  <p className="text-xs text-[#6b6b6b] mb-1">Status</p>
                  <span className={`text-xs px-2 py-1 rounded-full inline-block ${
                    selectedItem.status === 'Approved' ? 'bg-green-100 text-green-700' :
                    selectedItem.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {selectedItem.status}
                  </span>
                </div>
              </div>

              {selectedItem.feedback && (
                <div className="mb-6">
                  <p className="text-xs text-[#6b6b6b] mb-2">Teacher Feedback</p>
                  <div className="p-4 bg-[#f8f8f6] rounded-lg text-sm text-[#284342]">
                    {selectedItem.feedback}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-[rgba(40,67,66,0.1)] flex items-center gap-3">
              <button onClick={() => setSelectedItem(null)} className="px-6 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors">
                Close
              </button>
              {selectedItem.status === 'Pending' && (
                <>
                  <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    Approve
                  </button>
                  <button className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                    Request Revision
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
