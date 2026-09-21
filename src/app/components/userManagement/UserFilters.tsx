import { Search } from 'lucide-react';
import { roles, translateRole } from '../../utils/userHelpers';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
  searchTerm: string;
  roleFilter: string;
  statusFilter: string;

  setSearchTerm: (value: string) => void;
  setRoleFilter: (value: string) => void;
  setStatusFilter: (value: string) => void;
}

export default function UserFilters({
  searchTerm,
  roleFilter,
  statusFilter,
  setSearchTerm,
  setRoleFilter,
  setStatusFilter,
}: Props) {
  const { t } = useLanguage();

  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
      <div className="flex flex-col lg:flex-row gap-4">

        <div className="flex-1 relative">

          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6b6b]"
          />

          <input
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(e.target.value)
            }
            placeholder={t('userManagement.filters.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] focus:outline-none focus:ring-2 focus:ring-[#284342]"
          />

        </div>

        <select
          value={roleFilter}
          onChange={(e) =>
            setRoleFilter(e.target.value)
          }
          className="px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)]"
        >
          <option value="all">
            {t('userManagement.filters.allRoles')}
          </option>

          {roles.map((role) => (
            <option
              key={role}
              value={role}
            >
              {translateRole(role, t)}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value)
          }
          className="px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)]"
        >
          <option value="all">
            {t('userManagement.filters.allStatus')}
          </option>

          <option value="active">
            {t('common.active')}
          </option>

          <option value="inactive">
            {t('common.inactive')}
          </option>
        </select>

      </div>
    </div>
  );
}