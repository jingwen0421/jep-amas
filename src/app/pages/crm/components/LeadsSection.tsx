import { useState } from "react";

import {
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  Search,
  RefreshCw,
  Briefcase,
} from "lucide-react";

import {
  createLead,
  updateLead,
  deleteLead,
} from "../../../services/crmService";

import ConvertDealModal from "./ConvertDealModal";
import { useLanguage } from "../../../context/LanguageContext";
import { useConfirm } from "../../../context/ConfirmDialogContext";

const STATUS = [
  "New",
  "Contacted",
  "Interested",
  "Demo Scheduled",
  "Converted",
  "Lost",
];

const SOURCES = [
  "Company Lead",
  "Self Generated",
  "Walk In",
  "Referral",
];

function statusLabel(status: string, t: (key: string) => string) {
  switch (status) {
    case "New":
      return t('crm.status.new');
    case "Contacted":
      return t('crm.status.contacted');
    case "Interested":
      return t('crm.status.interested');
    case "Demo Scheduled":
      return t('crm.status.demoScheduled');
    case "Converted":
      return t('crm.status.converted');
    case "Lost":
      return t('crm.status.lost');
    default:
      return status;
  }
}

function sourceLabel(source: string, t: (key: string) => string) {
  switch (source) {
    case "Company Lead":
      return t('crm.leadSource.companyLead');
    case "Self Generated":
      return t('crm.leadSource.selfGenerated');
    case "Walk In":
      return t('crm.leadSource.walkIn');
    case "Referral":
      return t('crm.leadSource.referral');
    default:
      return source;
  }
}

export default function LeadsSection({
  leads,
  salesPeople,
  currentUser,
  refresh,
}: any) {
  const { t } = useLanguage();
  const confirmDialog = useConfirm();

  const isAdmin = ["admin", "super_admin"].includes(currentUser?.role);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showUnassigned, setShowUnassigned] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showConvert, setShowConvert] = useState<any>(null);
  const [editing, setEditing] = useState<any>(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    source: "Company Lead",
    owner_id: "",
    status: "New",
    note: "",
  });

  function openAdd() {
    setEditing(null);

    setForm({
      name: "",
      phone: "",
      source: "Company Lead",
      owner_id: isAdmin ? "" : currentUser.id,
      status: "New",
      note: "",
    });

    setShowModal(true);
  }

  function openEdit(lead: any) {
    setEditing(lead);

    setForm({
      name: lead.name,
      phone: lead.phone,
      source: lead.source,
      owner_id: lead.owner_id,
      status: lead.status,
      note: lead.note || "",
    });

    setShowModal(true);
  }

  async function save() {
    if (!form.name) {
      alert(t('crm.leads.customerNameRequired'));
      return;
    }

    if (editing) {
      await updateLead(editing.id, form);
    } else {
      await createLead({
        ...form,
        owner_id: isAdmin ? form.owner_id : currentUser.id,
      });
    }

    setShowModal(false);
    refresh();
  }

  async function remove(id: string) {
    if (!(await confirmDialog(t('crm.leads.confirmDeleteLead'), { variant: 'danger' })))
      return;

    await deleteLead(id);
    refresh();
  }

  async function changeStatus(id: string, status: string) {
    await updateLead(id, { status });
    refresh();
  }

  // =====================================================
  // FILTER
  // =====================================================

  const filtered = leads.filter((lead: any) => {
    const searchMatch =
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.phone.includes(search);

    const statusMatch = filter === "All" || lead.status === filter;

    const unassignedMatch = !showUnassigned || lead.owner_id === null;

    return searchMatch && statusMatch && unassignedMatch;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-[#284342]">
          {t('crm.leads.title')}
        </h2>

        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-[#284342] text-[#e9da95] px-5 py-3 rounded-xl"
        >
          <Plus size={18} />
          {t('crm.leads.addLead')}
        </button>
      </div>

      <div className="bg-white border rounded-2xl p-4 flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-3 text-gray-400" />

          <input
            className="w-full border rounded-xl pl-10 py-3"
            placeholder={t('crm.leads.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="border rounded-xl px-4 py-3"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="All">{t('crm.leads.statusAll')}</option>

          {STATUS.map((status) => (
            <option key={status} value={status}>
              {statusLabel(status, t)}
            </option>
          ))}
        </select>

        {isAdmin && (
          <button
            onClick={() => setShowUnassigned(!showUnassigned)}
            className={`px-4 py-3 rounded-xl border text-sm font-medium ${
              showUnassigned
                ? "bg-[#284342] text-[#e9da95]"
                : "hover:bg-gray-100"
            }`}
          >
            {t('crm.leads.unassignedFilter')}
          </button>
        )}

        <button onClick={refresh} className="p-3 rounded-xl hover:bg-gray-100">
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="bg-white border rounded-2xl overflow-hidden">
        <table className="w-full table-fixed">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-[20%] p-4 text-left text-sm">
                {t('crm.leads.colCustomer')}
              </th>
              <th className="w-[15%] text-left text-sm">
                {t('crm.leads.colPhone')}
              </th>
              <th className="w-[15%] text-left text-sm">
                {t('crm.leads.colSource')}
              </th>
              <th className="w-[15%] text-left text-sm">
                {t('crm.leads.colStatus')}
              </th>
              <th className="w-[15%] text-left text-sm">
                {t('crm.leads.colOwner')}
              </th>
              <th className="w-[20%] text-center text-sm">
                {t('crm.leads.colAction')}
              </th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((lead: any) => (
              <tr key={lead.id} className="border-t hover:bg-gray-50">
                <td className="p-4 truncate">{lead.name}</td>
                <td className="truncate">{lead.phone}</td>
                <td>{sourceLabel(lead.source, t)}</td>

                <td>
                  <select
                    value={lead.status}
                    onChange={(e) => changeStatus(lead.id, e.target.value)}
                    className="border rounded-lg px-2 py-1 text-sm"
                  >
                    {STATUS.map((status) => (
                      <option key={status} value={status}>
                        {statusLabel(status, t)}
                      </option>
                    ))}
                  </select>
                </td>

                <td>
                  {lead.owner?.full_name ? (
                    lead.owner.full_name
                  ) : (
                    <span className="text-red-500 text-sm">
                      {t('crm.leads.unassignedLabel')}
                    </span>
                  )}
                </td>

                <td>
                  <div className="flex justify-center gap-2">
                    {lead.status !== "Converted" && (
                      <button
                        onClick={() => setShowConvert(lead)}
                        className="p-2 rounded-lg text-green-700 hover:bg-green-50"
                        title={t('crm.leads.convertToDeal')}
                      >
                        <Briefcase size={16} />
                      </button>
                    )}

                    <button
                      onClick={() => openEdit(lead)}
                      className="p-2 rounded-lg hover:bg-gray-100"
                    >
                      <Edit size={16} />
                    </button>

                    <button
                      onClick={() => remove(lead.id)}
                      className="p-2 rounded-lg text-red-500 hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* =====================================================
      ADD / EDIT MODAL
      ===================================================== */}

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl p-8 space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-[#284342]">
                {editing ? t('crm.leads.editLead') : t('crm.leads.addLead')}
              </h3>

              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="form-label">{t('crm.leads.customerName')}</label>

              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label">{t('crm.leads.phoneLabel')}</label>

              <input
                className="input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label">{t('crm.leads.leadSourceLabel')}</label>

              <select
                className="input"
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
              >
                {SOURCES.map((source) => (
                  <option key={source} value={source}>
                    {sourceLabel(source, t)}
                  </option>
                ))}
              </select>
            </div>

            {/* ================================
            ADMIN ONLY ASSIGN SALES
            ================================ */}

            {isAdmin && (
              <div>
                <label className="form-label">{t('crm.leads.salespersonLabel')}</label>

                <select
                  className="input"
                  value={form.owner_id}
                  onChange={(e) => setForm({ ...form, owner_id: e.target.value })}
                >
                  <option value="">{t('crm.leads.unassignedLabel')}</option>

                  {salesPeople.map((person: any) => (
                    <option key={person.id} value={person.id}>
                      {person.full_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="form-label">{t('crm.leads.statusLabel')}</label>

              <select
                className="input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {STATUS.map((status) => (
                  <option key={status} value={status}>
                    {statusLabel(status, t)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">{t('crm.leads.notesLabel')}</label>

              <textarea
                className="input"
                rows={3}
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </div>

            <button onClick={save} className="btn-primary">
              <Save size={17} />
              {t('crm.leads.saveLead')}
            </button>
          </div>
        </div>
      )}

      {/* =====================================================
      CONVERT TO DEAL
      ===================================================== */}

      {showConvert && (
        <ConvertDealModal
          lead={showConvert}
          salesPeople={salesPeople}
          close={() => setShowConvert(null)}
          refresh={refresh}
        />
      )}
    </div>
  );
}
