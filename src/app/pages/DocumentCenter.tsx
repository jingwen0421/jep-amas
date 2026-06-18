import { useEffect, useState } from 'react';
import { Folder, FileText, Download, Upload, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DocumentItem {
  id: string;
  name: string;
  type: string;
  category: string;
  uploadedBy: string;
  uploadedDate: string;
  size: string;
  fileUrl: string;
}

export default function DocumentCenter() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    documentType: 'Registration',
    fileUrl: '',
  });

  const categories = ['Registration', 'Receipts', 'Certificates', 'Assignments', 'Contracts'];

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function fetchDocuments() {
    setLoading(true);

    const { data, error } = await supabase
      .from('documents')
      .select(`
        id,
        document_type,
        file_url,
        uploaded_at,
        students(full_name),
        users(full_name)
      `)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error.message);
      setLoading(false);
      return;
    }

    const mapped: DocumentItem[] = (data || []).map((doc: any) => {
      const category = doc.document_type || 'Document';
      const fileName = getFileName(doc.file_url, category);

      return {
        id: doc.id,
        name: fileName,
        type: getFileType(doc.file_url),
        category,
        uploadedBy: getUploaderName(doc.users) || getStudentName(doc.students) || 'System',
        uploadedDate: doc.uploaded_at
          ? new Date(doc.uploaded_at).toISOString().slice(0, 10)
          : '-',
        size: '-',
        fileUrl: doc.file_url,
      };
    });

    setDocuments(mapped);
    setLoading(false);
  }

  async function uploadDocument() {
    if (!formData.fileUrl.trim()) {
      alert('Please enter a file URL.');
      return;
    }

    const { error } = await supabase.from('documents').insert({
      document_type: formData.documentType,
      file_url: formData.fileUrl,
      uploaded_at: new Date().toISOString(),
    });

    if (error) {
      alert(`Failed to upload document: ${error.message}`);
      return;
    }

    setFormData({
      documentType: 'Registration',
      fileUrl: '',
    });

    setShowModal(false);
    fetchDocuments();
  }

  const thisMonth = new Date().toISOString().slice(0, 7);

  const thisMonthCount = documents.filter((doc) =>
    doc.uploadedDate.startsWith(thisMonth)
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-[#284342]">Document Center</h1>
          <p className="text-[#6b6b6b] mt-1">
            Manage all academy documents and files
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors flex items-center gap-2"
        >
          <Upload size={20} />
          Upload Document
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SummaryCard
          icon={<FileText size={24} className="text-[#284342]" />}
          label="Total Documents"
          value={documents.length.toString()}
        />
        <SummaryCard label="Categories" value={categories.length.toString()} />
        <SummaryCard label="This Month" value={thisMonthCount.toString()} color="text-blue-700" />
        <SummaryCard label="Total Size" value="-" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {categories.map((category) => (
          <div
            key={category}
            className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)] hover:shadow-lg transition-shadow cursor-pointer"
          >
            <Folder size={48} className="text-[#e9da95] mb-3" />
            <h3 className="text-sm text-[#284342] mb-1">{category}</h3>
            <p className="text-xs text-[#6b6b6b]">
              {documents.filter((doc) => doc.category === category).length} files
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
          <h2 className="text-lg text-[#284342]">Recent Documents</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
              <tr>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Name</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Type</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Category</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Uploaded By</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Date</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Size</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[rgba(40,67,66,0.1)]">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-[#6b6b6b]">
                    Loading documents...
                  </td>
                </tr>
              )}

              {!loading && documents.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-[#6b6b6b]">
                    No documents found.
                  </td>
                </tr>
              )}

              {!loading &&
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-[#f8f8f6] transition-colors">
                    <td className="px-6 py-4 text-sm text-[#284342]">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-[#6b6b6b]" />
                        {doc.name}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">{doc.type}</td>

                    <td className="px-6 py-4">
                      <span className="text-xs px-2 py-1 rounded bg-[#e9da95]/20 text-[#284342]">
                        {doc.category}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">
                      {doc.uploadedBy}
                    </td>

                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">
                      {doc.uploadedDate}
                    </td>

                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">{doc.size}</td>

                    <td className="px-6 py-4">
                      <button
                        onClick={() => window.open(doc.fileUrl, '_blank')}
                        className="p-2 hover:bg-[#e9da95]/20 rounded-lg transition-colors"
                      >
                        <Download size={16} className="text-[#284342]" />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl text-[#284342]">Upload Document</h2>
              <button onClick={() => setShowModal(false)}>
                <X size={20} className="text-[#284342]" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#284342] mb-2">
                  Category
                </label>
                <select
                  value={formData.documentType}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      documentType: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                >
                  {categories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-[#284342] mb-2">
                  File URL
                </label>
                <input
                  type="text"
                  value={formData.fileUrl}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      fileUrl: e.target.value,
                    }))
                  }
                  placeholder="https://example.com/document.pdf"
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={uploadDocument}
                className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  color = 'text-[#284342]',
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <div>
          <p className="text-sm text-[#6b6b6b]">{label}</p>
          <p className={`text-2xl ${color}`}>{value}</p>
        </div>
      </div>
    </div>
  );
}

function getFileName(url: string, category: string) {
  if (!url) return `${category} Document`;

  const parts = url.split('/');
  return parts[parts.length - 1] || `${category} Document`;
}

function getFileType(url: string) {
  const lower = (url || '').toLowerCase();

  if (lower.endsWith('.pdf')) return 'PDF';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png')) return 'Image';
  if (lower.endsWith('.doc') || lower.endsWith('.docx')) return 'Word';
  if (lower.endsWith('.xls') || lower.endsWith('.xlsx')) return 'Excel';

  return 'File';
}

function getStudentName(student: any) {
  if (!student) return '';
  if (Array.isArray(student)) return student[0]?.full_name || '';
  return student.full_name || '';
}

function getUploaderName(user: any) {
  if (!user) return '';
  if (Array.isArray(user)) return user[0]?.full_name || '';
  return user.full_name || '';
}

