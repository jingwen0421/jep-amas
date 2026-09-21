import { useEffect, useState } from "react";

import {
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  CreditCard,
  Eye,
} from "lucide-react";

import {
  createDeal,
  updateDeal,
  deleteDeal,
  addPayment,
  getDealPayments,
  getCommissionSettings,
  saveDealCommissionRules,
} from "../../../services/crmService";
import { supabase } from "../../../lib/supabase";
import { useLanguage } from "../../../context/LanguageContext";
import { useConfirm } from "../../../context/ConfirmDialogContext";

const emptyDeal = {
  customer_name: "",
  owner_id: "",
  course: "",
  course_type: "",
  list_price: 0,
  discount_pct: 0,
  final_price: 0,
  lead_type: "company",
  signed_at: new Date().toISOString().substring(0, 10),
  commission_rule_ids: [] as string[],
};

export default function DealsSection({
  deals,
  salesPeople,
  currentUser,
  refresh,
}: any) {
  const { t } = useLanguage();
  const confirmDialog = useConfirm();

  const [showDealModal, setShowDealModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const [editingDeal, setEditingDeal] = useState<any>(null);
  const [selectedDeal, setSelectedDeal] = useState<any>(null);

  const [payments, setPayments] = useState<any[]>([]);
  const [commissionRules, setCommissionRules] = useState<any[]>([]);

  const [dealForm, setDealForm] = useState<{
    customer_name: string;
    owner_id: string;
    course: string;
    course_type: string;
    list_price: number;
    discount_pct: number;
    final_price: number;
    lead_type: string;
    signed_at: string;
    commission_rule_ids: string[];
  }>(emptyDeal);

  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    payment_type: "Full",
    installment_no: 1,
    payment_date: new Date().toISOString().substring(0, 10),
  });

  useEffect(() => {
    loadCommissionRules();
  }, []);

  async function loadCommissionRules() {
    const data = await getCommissionSettings();
    setCommissionRules(data || []);
  }

  function calculateFinalPrice(price: number, discount: number) {
    return Number(price - (price * discount) / 100).toFixed(2);
  }

  function openAddDeal() {
    setEditingDeal(null);

    setDealForm({
      ...emptyDeal,
      commission_rule_ids: [],
    });

    setShowDealModal(true);
  }

  async function openEditDeal(deal: any) {
    const { data, error } = await supabase
      .from("crm_deal_commission_rules")
      .select(`rule_id`)
      .eq("deal_id", deal.id);

    if (error) {
      console.error("Load commission rules error", error);
    }

    const selectedRuleIds = data?.map((item: any) => item.rule_id) || [];

    console.log("EDIT DEAL RULE IDS:", selectedRuleIds);

    setEditingDeal(deal);

    setDealForm({
      customer_name: deal.customer_name,
      owner_id: deal.owner_id,
      course: deal.course,
      course_type: deal.course_type,
      list_price: Number(deal.list_price),
      discount_pct: Number(deal.discount_pct),
      final_price: Number(deal.final_price),
      lead_type: deal.lead_type,
      signed_at: deal.signed_at,
      commission_rule_ids: selectedRuleIds,
    });

    setShowDealModal(true);
  }

  async function saveDeal() {
    if (!dealForm.customer_name) {
      alert(t('crm.deals.customerNameRequired'));
      return;
    }

    const { commission_rule_ids, ...dealData } = dealForm;

    let savedDeal: any;

    if (editingDeal) {
      savedDeal = await updateDeal(editingDeal.id, dealData);
    } else {
      savedDeal = await createDeal(dealData);
    }

    await saveDealCommissionRules(savedDeal.id, commission_rule_ids);

    setShowDealModal(false);
    refresh();
  }

  async function removeDeal(id: string) {
    if (!(await confirmDialog(t('crm.deals.confirmDeleteDeal'), { variant: 'danger' })))
      return;

    await deleteDeal(id);
    refresh();
  }

  // =====================================================
  // PAYMENT FUNCTIONS
  // =====================================================

  function openPayment(deal: any) {
    setSelectedDeal(deal);

    setPaymentForm({
      amount: 0,
      payment_type: "Full",
      installment_no: 1,
      payment_date: new Date().toISOString().substring(0, 10),
    });

    setShowPaymentModal(true);
  }

  async function savePayment() {
    if (!selectedDeal || paymentForm.amount <= 0) {
      alert(t('crm.deals.enterPaymentAmount'));
      return;
    }

    await addPayment({
      deal_id: selectedDeal.id,
      amount: Number(paymentForm.amount),
      payment_type: paymentForm.payment_type,
      installment_no:
        paymentForm.payment_type === "Full"
          ? 1
          : Number(paymentForm.installment_no),
      payment_date: paymentForm.payment_date,
    });

    setShowPaymentModal(false);
    refresh();
  }

  async function viewPayments(deal: any) {
    const data = await getDealPayments(deal.id);

    setPayments(data || []);
    setSelectedDeal(deal);
    setShowHistoryModal(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-[#284342]">
          {t('crm.deals.title')}
        </h2>

        <button
          onClick={openAddDeal}
          className="flex items-center gap-2 bg-[#284342] text-[#e9da95] px-5 py-3 rounded-xl"
        >
          <Plus size={18} />
          {t('crm.deals.addDeal')}
        </button>
      </div>

      <div className="bg-white border rounded-2xl overflow-hidden">
        <table className="w-full table-fixed">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 text-left">{t('crm.deals.colCustomer')}</th>
              <th className="text-left">{t('crm.deals.colCourse')}</th>
              <th className="text-left">{t('crm.deals.colPrice')}</th>
              <th className="text-left">{t('crm.deals.colOwner')}</th>
              <th className="text-center">{t('crm.deals.colAction')}</th>
            </tr>
          </thead>

          <tbody>
            {deals.map((deal: any) => (
              <tr key={deal.id} className="border-t hover:bg-gray-50">
                <td className="p-4">{deal.customer_name}</td>
                <td>{deal.course}</td>
                <td className="font-semibold">
                  RM {Number(deal.final_price || 0).toLocaleString()}
                </td>
                <td>{deal.owner?.full_name || "-"}</td>

                <td>
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => openPayment(deal)}
                      className="p-2 rounded-lg text-green-700 hover:bg-green-50"
                      title={t('crm.deals.addPayment')}
                    >
                      <CreditCard size={17} />
                    </button>

                    <button
                      onClick={() => viewPayments(deal)}
                      className="p-2 rounded-lg text-blue-700 hover:bg-blue-50"
                      title={t('crm.deals.paymentHistory')}
                    >
                      <Eye size={17} />
                    </button>

                    <button
                      onClick={() => openEditDeal(deal)}
                      className="p-2 rounded-lg hover:bg-gray-100"
                    >
                      <Edit size={17} />
                    </button>

                    <button
                      onClick={() => removeDeal(deal.id)}
                      className="p-2 rounded-lg text-red-500 hover:bg-red-50"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CREATE / EDIT DEAL */}

      {showDealModal && (
        <Modal
          title={editingDeal ? t('crm.deals.editDeal') : t('crm.deals.createDeal')}
          close={() => setShowDealModal(false)}
        >
          <div className="space-y-4">
            <label className="form-label">{t('crm.deals.customerName')}</label>

            <input
              className="input"
              value={dealForm.customer_name}
              onChange={(e) =>
                setDealForm({ ...dealForm, customer_name: e.target.value })
              }
            />

            <label className="form-label">{t('crm.deals.salespersonLabel')}</label>

            <select
              className="input"
              value={dealForm.owner_id}
              onChange={(e) =>
                setDealForm({ ...dealForm, owner_id: e.target.value })
              }
            >
              <option value="">{t('crm.deals.selectSalesperson')}</option>

              {salesPeople.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </select>

            <label className="form-label">{t('crm.deals.courseLabel')}</label>

            <input
              className="input"
              value={dealForm.course}
              onChange={(e) =>
                setDealForm({ ...dealForm, course: e.target.value })
              }
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">{t('crm.deals.listPriceLabel')}</label>

                <input
                  className="input"
                  type="number"
                  value={dealForm.list_price}
                  onChange={(e) => {
                    const price = Number(e.target.value);

                    setDealForm({
                      ...dealForm,
                      list_price: price,
                      final_price: Number(
                        calculateFinalPrice(price, dealForm.discount_pct)
                      ),
                    });
                  }}
                />
              </div>

              <div>
                <label className="form-label">{t('crm.deals.discountPercent')}</label>

                <input
                  className="input"
                  type="number"
                  value={dealForm.discount_pct}
                  onChange={(e) => {
                    const discount = Number(e.target.value);

                    setDealForm({
                      ...dealForm,
                      discount_pct: discount,
                      final_price: Number(
                        calculateFinalPrice(dealForm.list_price, discount)
                      ),
                    });
                  }}
                />
              </div>
            </div>

            <div>
              <label className="form-label">
                {t('crm.deals.applyCommissionRules')}
              </label>

              <div className="border rounded-xl p-4 space-y-2">
                {commissionRules.length === 0 && (
                  <p className="text-sm text-gray-500">
                    {t('crm.deals.noCommissionRules')}
                  </p>
                )}

                {commissionRules.map((rule: any) => (
                  <label key={rule.id} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={dealForm.commission_rule_ids.includes(rule.id)}
                      onChange={() => {
                        const exists = dealForm.commission_rule_ids.includes(
                          rule.id
                        );

                        setDealForm({
                          ...dealForm,
                          commission_rule_ids: exists
                            ? dealForm.commission_rule_ids.filter(
                                (id: string) => id !== rule.id
                              )
                            : [...dealForm.commission_rule_ids, rule.id],
                        });
                      }}
                    />

                    <span>{rule.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 font-semibold">
              {t('crm.deals.finalPriceLabel')}
              RM {Number(dealForm.final_price || 0).toLocaleString()}
            </div>

            <button onClick={saveDeal} className="btn-primary">
              <Save size={16} />
              {t('crm.deals.saveDeal')}
            </button>
          </div>
        </Modal>
      )}

      {/* =====================================================
      PAYMENT MODAL
      ===================================================== */}

      {showPaymentModal && (
        <Modal title={t('crm.deals.addPayment')} close={() => setShowPaymentModal(false)}>
          <div className="space-y-4">
            <label className="form-label">{t('crm.deals.amountRm')}</label>

            <input
              className="input"
              type="number"
              value={paymentForm.amount}
              onChange={(e) =>
                setPaymentForm({
                  ...paymentForm,
                  amount: Number(e.target.value),
                })
              }
            />

            <label className="form-label">{t('crm.deals.paymentTypeLabel')}</label>

            <select
              className="input"
              value={paymentForm.payment_type}
              onChange={(e) =>
                setPaymentForm({ ...paymentForm, payment_type: e.target.value })
              }
            >
              <option value="Full">{t('crm.deals.paymentTypeFull')}</option>
              <option value="Installment">
                {t('crm.deals.paymentTypeInstallment')}
              </option>
            </select>

            {paymentForm.payment_type === "Installment" && (
              <>
                <label className="form-label">
                  {t('crm.deals.installmentNumberLabel')}
                </label>

                <input
                  className="input"
                  type="number"
                  min="1"
                  value={paymentForm.installment_no}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      installment_no: Number(e.target.value),
                    })
                  }
                />
              </>
            )}

            <label className="form-label">{t('crm.deals.paymentDateLabel')}</label>

            <input
              className="input"
              type="date"
              value={paymentForm.payment_date}
              onChange={(e) =>
                setPaymentForm({
                  ...paymentForm,
                  payment_date: e.target.value,
                })
              }
            />

            <button onClick={savePayment} className="btn-primary">
              <Save size={16} />
              {t('crm.deals.savePayment')}
            </button>
          </div>
        </Modal>
      )}

      {/* =====================================================
      PAYMENT HISTORY MODAL
      ===================================================== */}

      {showHistoryModal && (
        <Modal
          title={t('crm.deals.paymentHistoryTitle', { name: selectedDeal?.customer_name })}
          close={() => setShowHistoryModal(false)}
        >
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">{t('crm.deals.colType')}</th>
                <th className="p-3 text-left">{t('crm.deals.colInstallment')}</th>
                <th className="p-3 text-left">{t('crm.deals.colAmount')}</th>
                <th className="p-3 text-left">{t('crm.deals.colDate')}</th>
              </tr>
            </thead>

            <tbody>
              {payments.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-5 text-center text-gray-500">
                    {t('crm.deals.noPaymentRecord')}
                  </td>
                </tr>
              )}

              {payments.map((payment: any) => (
                <tr key={payment.id} className="border-t">
                  <td className="p-3">{payment.payment_type}</td>
                  <td className="p-3">#{payment.installment_no}</td>
                  <td className="p-3">
                    RM {Number(payment.amount || 0).toLocaleString()}
                  </td>
                  <td className="p-3">{payment.payment_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Modal>
      )}
    </div>
  );
}

// =====================================================
// COMMON MODAL
// =====================================================

function Modal({ title, close, children }: any) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-xl max-h-[90vh] overflow-y-auto space-y-5">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-[#284342]">{title}</h2>

          <button onClick={close} className="p-2 rounded-lg hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
