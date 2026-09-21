import {
  Eye,
  Edit,
  Lock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { SystemUser } from '../../types/user';
import { getInitials, translateRole } from '../../utils/userHelpers';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
  users: SystemUser[];
  loading: boolean;
  totalUsers: number;
  onView: (user: SystemUser) => void;
  onEdit: (user: SystemUser) => void;
  onToggleStatus: (user: SystemUser) => void;
}

export default function UserTable({
  users,
  loading,
  totalUsers,
  onView,
  onEdit,
  onToggleStatus,
}: Props) {
  const { t } = useLanguage();
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const totalPages = Math.max(Math.ceil(users.length / pageSize), 1);

  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return users.slice(start, start + pageSize);
  }, [users, page]);

  function goPrevious() {
    setPage((current) => Math.max(current - 1, 1));
  }

  function goNext() {
    setPage((current) => Math.min(current + 1, totalPages));
  }

  return (
    <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
      <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)] flex items-center justify-between">
        <div>
          <h2 className="text-lg text-[#284342]">{t('userManagement.table.title')}</h2>
          <p className="text-xs text-[#6b6b6b] mt-1">
            {t('userManagement.table.subtitle')}
          </p>
        </div>

        <p className="text-sm text-[#6b6b6b]">
          {t('userManagement.table.showing', { shown: users.length, total: totalUsers })}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
            <tr>
              <th className="px-6 py-4 text-left text-sm text-[#284342]">
                {t('userManagement.table.col.user')}
              </th>
              <th className="px-6 py-4 text-left text-sm text-[#284342]">
                {t('userManagement.table.col.role')}
              </th>
              <th className="px-6 py-4 text-left text-sm text-[#284342]">
                {t('userManagement.table.col.created')}
              </th>
              <th className="px-6 py-4 text-left text-sm text-[#284342]">
                {t('userManagement.table.col.lastUpdated')}
              </th>
              <th className="px-6 py-4 text-left text-sm text-[#284342]">
                {t('userManagement.table.col.status')}
              </th>
              <th className="px-6 py-4 text-left text-sm text-[#284342]">
                {t('userManagement.table.col.actions')}
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[rgba(40,67,66,0.1)]">
            {loading && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-10 text-center text-[#6b6b6b]"
                >
                  {t('userManagement.table.loading')}
                </td>
              </tr>
            )}

            {!loading && users.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-10 text-center text-[#6b6b6b]"
                >
                  {t('userManagement.table.empty')}
                </td>
              </tr>
            )}

            {!loading &&
              paginatedUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-[#f8f8f6] transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#e9da95]/30 flex items-center justify-center text-[#284342] text-sm">
                        {getInitials(user.name)}
                      </div>

                      <div>
                        <p className="text-sm text-[#284342]">{user.name}</p>
                        <p className="text-xs text-[#6b6b6b] mt-1">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="text-xs px-3 py-1 rounded-full bg-[#e9da95]/20 text-[#284342]">
                      {translateRole(user.rawRole, t)}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-sm text-[#6b6b6b]">
                    {user.createdAt}
                  </td>

                  <td className="px-6 py-4 text-sm text-[#6b6b6b]">
                    {user.lastUpdated}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`text-xs px-3 py-1 rounded-full ${
                        user.status === 'Active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {user.status === 'Active' ? t('common.active') : t('common.inactive')}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onView(user)}
                        className="p-2 hover:bg-[#e9da95]/20 rounded-lg transition-colors"
                        title={t('common.view')}
                      >
                        <Eye size={16} className="text-[#284342]" />
                      </button>

                      <button
                        onClick={() => onEdit(user)}
                        className="p-2 hover:bg-[#e9da95]/20 rounded-lg transition-colors"
                        title={t('common.edit')}
                      >
                        <Edit size={16} className="text-[#284342]" />
                      </button>

                      <button
                        onClick={() => onToggleStatus(user)}
                        className="p-2 hover:bg-[#e9da95]/20 rounded-lg transition-colors"
                        title={t('userManagement.table.toggleStatus')}
                      >
                        <Lock size={16} className="text-[#284342]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {!loading && users.length > pageSize && (
        <div className="p-4 border-t border-[rgba(40,67,66,0.1)] flex items-center justify-between">
          <p className="text-sm text-[#6b6b6b]">
            {t('userManagement.table.page', { page, totalPages })}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={goPrevious}
              disabled={page === 1}
              className="px-3 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              onClick={goNext}
              disabled={page === totalPages}
              className="px-3 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}