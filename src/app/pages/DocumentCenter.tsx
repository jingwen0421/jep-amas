import { Folder, FileText, Download, Upload } from 'lucide-react';

interface Document {
  id: string;
  name: string;
  type: string;
  category: string;
  uploadedBy: string;
  uploadedDate: string;
  size: string;
}

export default function DocumentCenter() {
  const documents: Document[] = [
    {
      id: 'DOC001',
      name: 'Student Registration Form - Jessica Lim.pdf',
      type: 'PDF',
      category: 'Registration',
      uploadedBy: 'Admin',
      uploadedDate: '2026-01-15',
      size: '245 KB',
    },
    {
      id: 'DOC002',
      name: 'Payment Receipt - RCP-2026-001.pdf',
      type: 'PDF',
      category: 'Receipts',
      uploadedBy: 'Finance Staff',
      uploadedDate: '2026-05-15',
      size: '128 KB',
    },
    {
      id: 'DOC003',
      name: 'Course Completion Certificate - Grace Lim.pdf',
      type: 'PDF',
      category: 'Certificates',
      uploadedBy: 'Admin',
      uploadedDate: '2026-05-30',
      size: '312 KB',
    },
    {
      id: 'DOC004',
      name: 'Assignment Submission - Editorial Makeup.jpg',
      type: 'Image',
      category: 'Assignments',
      uploadedBy: 'Amanda Ng',
      uploadedDate: '2026-05-28',
      size: '2.1 MB',
    },
  ];

  const categories = ['Registration', 'Receipts', 'Certificates', 'Assignments', 'Contracts'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-[#284342]">Document Center</h1>
          <p className="text-[#6b6b6b] mt-1">Manage all academy documents and files</p>
        </div>
        <button className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors flex items-center gap-2">
          <Upload size={20} />
          Upload Document
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <div className="flex items-center gap-3 mb-2">
            <FileText size={24} className="text-[#284342]" />
            <div>
              <p className="text-sm text-[#6b6b6b]">Total Documents</p>
              <p className="text-2xl text-[#284342]">{documents.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <p className="text-sm text-[#6b6b6b] mb-2">Categories</p>
          <p className="text-3xl text-[#284342]">{categories.length}</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <p className="text-sm text-[#6b6b6b] mb-2">This Month</p>
          <p className="text-3xl text-blue-700">
            {documents.filter((d) => d.uploadedDate.startsWith('2026-05') || d.uploadedDate.startsWith('2026-06')).length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <p className="text-sm text-[#6b6b6b] mb-2">Total Size</p>
          <p className="text-3xl text-[#284342]">2.8 MB</p>
        </div>
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
              {documents.filter((d) => d.category === category).length} files
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
              {documents.map((doc) => (
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
                  <td className="px-6 py-4 text-sm text-[#6b6b6b]">{doc.uploadedBy}</td>
                  <td className="px-6 py-4 text-sm text-[#6b6b6b]">{doc.uploadedDate}</td>
                  <td className="px-6 py-4 text-sm text-[#6b6b6b]">{doc.size}</td>
                  <td className="px-6 py-4">
                    <button className="p-2 hover:bg-[#e9da95]/20 rounded-lg transition-colors">
                      <Download size={16} className="text-[#284342]" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
