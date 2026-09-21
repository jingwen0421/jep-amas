import { useEffect, useState } from 'react';
import { Folder, FileText, Download, Upload, X, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../context/LanguageContext';

const UPLOADER_FALLBACK = '__system__';

interface DocumentItem {
  id: string;
  name: string | null;
  type: string;
  category: string;
  uploadedBy: string;
  uploadedDate: string;
  size: string;
  fileUrl: string;
}

const CATEGORY_KEYS: Record<string, string> = {
  Registration: 'documentCenter.category.registration',
  Receipts: 'documentCenter.category.receipts',
  Certificates: 'documentCenter.category.certificates',
  Assignments: 'documentCenter.category.assignments',
  Contracts: 'documentCenter.category.contracts',
};

function translateCategory(category: string, t: (key: string) => string) {
  const key = CATEGORY_KEYS[category];
  return key ? t(key) : category;
}

const FILE_TYPE_KEYS: Record<string, string> = {
  PDF: 'documentCenter.fileType.pdf',
  Image: 'documentCenter.fileType.image',
  Word: 'documentCenter.fileType.word',
  Excel: 'documentCenter.fileType.excel',
  File: 'documentCenter.fileType.file',
};

function translateFileType(type: string, t: (key: string) => string) {
  const key = FILE_TYPE_KEYS[type];
  return key ? t(key) : type;
}

export default function DocumentCenter() {
  const { t } = useLanguage();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [formData, setFormData] = useState({
    documentType: 'Registration',
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
          file_name,
          file_size,
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

      return {
        id: doc.id,
        name: doc.file_name || null,
        type: getFileType(doc.file_url),
        category,
        uploadedBy: getUploaderName(doc.users) || getStudentName(doc.students) || UPLOADER_FALLBACK,
        uploadedDate: doc.uploaded_at
          ? new Date(doc.uploaded_at).toISOString().slice(0, 10)
          : '-',
        size: formatFileSize(doc.file_size),
        fileUrl: doc.file_url,
      };
    });

    setDocuments(mapped);
    setLoading(false);
  }

  async function uploadDocument() {
    if (!file) {
      alert(t('documentCenter.error.selectFile'));
      return;
    }

    setUploading(true);

    const safeName = file.name.replace(/\s+/g, '_');
    const filePath = `${formData.documentType}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from('academy-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      setUploading(false);
      alert(t('documentCenter.error.uploadFailed', { message: uploadError.message }));
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from('academy-documents')
      .getPublicUrl(filePath);

    const { error: insertError } = await supabase.from('documents').insert({
      document_type: formData.documentType,
      file_url: publicUrlData.publicUrl,
      file_name: file.name,
      file_size: file.size,
      uploaded_at: new Date().toISOString(),
    });

    if (insertError) {
      setUploading(false);
      alert(t('documentCenter.error.recordFailed', { message: insertError.message }));
      return;
    }

    await supabase.from('audit_logs').insert({
      user_id: null,
      action: 'Document Uploaded',
      module: 'Document Center',
      target_id: filePath,
      old_data: null,
      new_data: {
        document_type: formData.documentType,
        file_name: file.name,
        file_url: publicUrlData.publicUrl,
      },
      created_at: new Date().toISOString(),
    });

    setUploading(false);
    setFile(null);
    setFormData({ documentType: 'Registration' });
    setShowModal(false);
    fetchDocuments();
  }

  const thisMonth = new Date().toISOString().slice(0, 7);

  const thisMonthCount = documents.filter((doc) =>
    doc.uploadedDate.startsWith(thisMonth)
  ).length;

  const filteredDocuments =
    selectedCategory === 'All'
      ? documents
      : documents.filter((doc) => doc.category === selectedCategory);

  const totalSizeLabel = '-';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-[#284342]">{t('documentCenter.title')}</h1>
          <p className="text-[#6b6b6b] mt-1">
            {t('documentCenter.subtitle')}
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors flex items-center gap-2"
        >
          <Upload size={20} />
          {t('documentCenter.uploadDocument')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SummaryCard
          icon={<FileText size={24} className="text-[#284342]" />}
          label={t('documentCenter.stat.totalDocuments')}
          value={documents.length.toString()}
        />
        <SummaryCard label={t('documentCenter.stat.categories')} value={categories.length.toString()} />
        <SummaryCard label={t('documentCenter.stat.thisMonth')} value={thisMonthCount.toString()} color="text-blue-700" />
        <SummaryCard label={t('documentCenter.stat.totalSize')} value={totalSizeLabel} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {categories.map((category) => (
          <div
              key={category}
              onClick={() =>
                setSelectedCategory(selectedCategory === category ? 'All' : category)
              }
              className={`bg-white rounded-xl p-6 border transition-shadow cursor-pointer ${
                selectedCategory === category
                  ? 'border-[#284342] shadow-lg'
                  : 'border-[rgba(40,67,66,0.1)] hover:shadow-lg'
              }`}
            >
            <Folder size={48} className="text-[#e9da95] mb-3" />
            <h3 className="text-sm text-[#284342] mb-1">{translateCategory(category, t)}</h3>
            <p className="text-xs text-[#6b6b6b]">
              {t('documentCenter.fileCount', { count: documents.filter((doc) => doc.category === category).length })}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
          <h2 className="text-lg text-[#284342]">
            {selectedCategory === 'All'
              ? t('documentCenter.recentDocuments')
              : t('documentCenter.categoryDocuments', { category: translateCategory(selectedCategory, t) })}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
              <tr>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">{t('documentCenter.col.name')}</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">{t('documentCenter.col.type')}</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">{t('documentCenter.col.category')}</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">{t('documentCenter.col.uploadedBy')}</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">{t('documentCenter.col.date')}</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">{t('documentCenter.col.size')}</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">{t('documentCenter.col.actions')}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[rgba(40,67,66,0.1)]">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-[#6b6b6b]">
                    {t('documentCenter.loading')}
                  </td>
                </tr>
              )}

              {!loading && filteredDocuments.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-[#6b6b6b]">
                    {t('documentCenter.empty')}
                  </td>
                </tr>
              )}

              {!loading &&
                filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-[#f8f8f6] transition-colors">
                    <td className="px-6 py-4 text-sm text-[#284342]">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-[#6b6b6b]" />
                        {doc.name || t('documentCenter.categoryDocumentFallback', { category: translateCategory(doc.category, t) })}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">{translateFileType(doc.type, t)}</td>

                    <td className="px-6 py-4">
                      <span className="text-xs px-2 py-1 rounded bg-[#e9da95]/20 text-[#284342]">
                        {translateCategory(doc.category, t)}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">
                      {doc.uploadedBy === UPLOADER_FALLBACK ? t('documentCenter.systemFallback') : doc.uploadedBy}
                    </td>

                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">
                      {doc.uploadedDate}
                    </td>

                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">{doc.size}</td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => window.open(doc.fileUrl, '_blank')}
                          className="p-2 hover:bg-[#e9da95]/20 rounded-lg transition-colors"
                          title={t('common.view')}
                        >
                          <Eye size={16} className="text-[#284342]" />
                        </button>

                        <button
                          onClick={() => window.open(doc.fileUrl, '_blank')}
                          className="p-2 hover:bg-[#e9da95]/20 rounded-lg transition-colors"
                          title={t('common.download')}
                        >
                          <Download size={16} className="text-[#284342]" />
                        </button>
                      </div>
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
              <h2 className="text-xl text-[#284342]">{t('documentCenter.uploadDocument')}</h2>
              <button onClick={() => setShowModal(false)}>
                <X size={20} className="text-[#284342]" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#284342] mb-2">
                  {t('documentCenter.col.category')}
                </label>
                <select
                  value={filteredDocuments.length.toString()}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      documentType: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>{translateCategory(category, t)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-[#284342] mb-2">
                  {t('documentCenter.selectFile')}
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                />
                {file && (
                  <p className="text-xs text-[#6b6b6b] mt-2">
                    {t('documentCenter.selected', { name: file.name })}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors"
              >
                {t('common.cancel')}
              </button>

              <button
                onClick={uploadDocument}
                disabled={uploading}
                className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors disabled:opacity-60"
              >
                {uploading ? t('documentCenter.uploading') : t('documentCenter.upload')}
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

  try {
    const cleanUrl = decodeURIComponent(url.split('?')[0]);
    const parts = cleanUrl.split('/');
    return parts[parts.length - 1] || `${category} Document`;
  } catch {
    return `${category} Document`;
  }
}

function getFileType(url: string) {
  const lower = (url || '').toLowerCase().split('?')[0];

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

function formatFileSize(size?: number) {
  if (!size) return '-';

  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}