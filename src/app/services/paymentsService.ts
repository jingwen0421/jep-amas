import { supabase } from '../lib/supabase';

// ==================== SHARED NORMALIZERS ====================
// Every payments page independently re-derives student/course info from
// the same Supabase join shapes (a joined column comes back as an object
// or an array depending on the query) — these were copy-pasted 2-4x each
// across PaymentPlans/Installments/Receipts/OutstandingBalances with tiny
// drifts between copies. Centralized here so there's one implementation.

export function getSingle(value: any) {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] || null;
  return value;
}

export function getStudentName(student: any) {
  const s = getSingle(student);
  return s?.full_name || 'Unnamed Student';
}

export function getStudentUserId(student: any): string | null {
  return getSingle(student)?.user_id || null;
}

export function getStudentEmail(student: any): string | null {
  return getSingle(student)?.email || null;
}

export function getStudentPhone(student: any): string | null {
  return getSingle(student)?.phone || null;
}

export function getCourseNameFromEnrollment(enrollment: any) {
  const actualEnrollment = getSingle(enrollment);
  const batch = getSingle(actualEnrollment?.class_batches);
  const course = getSingle(batch?.courses);
  return course?.course_name || '-';
}

export function formatPaymentMethod(method: string) {
  if (method === 'cash') return 'Cash';
  if (method === 'bank_transfer') return 'Bank Transfer';
  if (method === 'card') return 'Card';
  if (method === 'ewallet') return 'E-Wallet';
  return method;
}

export function formatCurrency(amount: number) {
  return `RM ${amount.toLocaleString()}`;
}

export function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

// ==================== INSTALLMENTS ====================

export interface InstallmentSchedule {
  id: string;
  paymentPlanId: string;
  studentId: string;
  student: string;
  studentUserId: string | null;
  studentEmail: string | null;
  studentPhone: string | null;
  course: string;
  totalFee: number;
  installmentNumber: number;
  totalInstallments: number;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'Paid' | 'Pending' | 'Overdue';
}

function mapInstallmentStatus(status: string, dueDate: string): InstallmentSchedule['status'] {
  if (String(status).toLowerCase() === 'paid') return 'Paid';
  if (dueDate && new Date(dueDate) < startOfToday()) return 'Overdue';
  return 'Pending';
}

export async function fetchInstallmentsWithDetails(studentIdFilter?: string) {
  let query = supabase
    .from('installments')
    .select(`
      id,
      payment_plan_id,
      amount,
      due_date,
      paid_date,
      status,
      payment_plans!inner(
        id,
        student_id,
        final_amount,
        status,
        students(user_id, full_name, email, phone),
        enrollments(
          class_batches(
            courses(course_name)
          )
        ),
        installments(id, due_date)
      )
    `)
    .order('due_date', { ascending: true });

  if (studentIdFilter) {
    query = query.eq('payment_plans.student_id', studentIdFilter);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching installments:', error.message);
    return { data: [] as InstallmentSchedule[], error };
  }

  const mapped: InstallmentSchedule[] = (data || []).map((item: any) => {
    const plan = getSingle(item.payment_plans);
    const allInstallments = plan?.installments || [];

    const sortedInstallments = [...allInstallments].sort((a: any, b: any) =>
      String(a.due_date).localeCompare(String(b.due_date))
    );

    const installmentIndex = sortedInstallments.findIndex(
      (inst: any) => inst.id === item.id
    );

    return {
      id: item.id,
      paymentPlanId: item.payment_plan_id,
      studentId: plan?.student_id || '',
      student: getStudentName(plan?.students),
      studentUserId: getStudentUserId(plan?.students),
      studentEmail: getStudentEmail(plan?.students),
      studentPhone: getStudentPhone(plan?.students),
      course: getCourseNameFromEnrollment(plan?.enrollments),
      totalFee: Number(plan?.final_amount || 0),
      installmentNumber: installmentIndex >= 0 ? installmentIndex + 1 : 1,
      totalInstallments: sortedInstallments.length || 1,
      amount: Number(item.amount || 0),
      dueDate: item.due_date || '-',
      paidDate: item.paid_date ? item.paid_date.slice(0, 10) : undefined,
      status: mapInstallmentStatus(item.status, item.due_date),
    };
  });

  return { data: mapped, error: null };
}

export async function updatePaymentPlanStatus(paymentPlanId: string) {
  const { data } = await supabase
    .from('installments')
    .select('status, due_date')
    .eq('payment_plan_id', paymentPlanId);

  const rows = data || [];
  const allPaid = rows.length > 0 && rows.every((item: any) => item.status === 'paid');

  const hasOverdue = rows.some((item: any) => {
    if (item.status === 'paid') return false;
    if (!item.due_date) return false;
    return new Date(item.due_date) < startOfToday();
  });

  const newStatus = allPaid ? 'paid' : hasOverdue ? 'overdue' : 'partial';

  await supabase
    .from('payment_plans')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', paymentPlanId);
}

// ==================== OUTSTANDING BALANCES ====================

export interface OutstandingBalance {
  id: string;
  studentId: string;
  student: string;
  studentUserId: string | null;
  studentEmail: string | null;
  phone: string;
  course: string;
  totalFee: number;
  paidAmount: number;
  outstandingAmount: number;
  lastPaymentDate: string;
  nextDueDate: string;
  daysOverdue: number;
  status: 'Pending' | 'Overdue' | 'Critical';
}

function calculateDaysOverdue(dueDate: string) {
  if (!dueDate) return 0;

  const today = new Date();
  const due = new Date(dueDate);
  const diff = today.getTime() - due.getTime();

  if (diff <= 0) return 0;

  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export async function fetchOutstandingBalances(
  studentIdFilter?: string,
  includeZeroOutstanding = false
) {
  let query = supabase
    .from('payment_plans')
    .select(`
      id,
      student_id,
      final_amount,
      original_fee,
      students!payment_plans_student_id_fkey(user_id, full_name, phone, email),
      enrollments!payment_plans_enrollment_id_fkey(
        class_batches(
          courses(course_name)
        )
      ),
      installments(
        amount,
        due_date,
        paid_date,
        status
      )
    `)
    .order('created_at', { ascending: false });

  if (studentIdFilter) {
    query = query.eq('student_id', studentIdFilter);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching outstanding balances:', error.message);
    return { data: [] as OutstandingBalance[], error };
  }

  const mapped: OutstandingBalance[] = (data || [])
    .map((plan: any) => {
      const installments = plan.installments || [];
      const totalFee = Number(plan.final_amount || plan.original_fee || 0);

      const paidAmount = installments
        .filter((item: any) => String(item.status).toLowerCase() === 'paid')
        .reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);

      const outstandingAmount = Math.max(totalFee - paidAmount, 0);

      const paidInstallments = installments
        .filter((item: any) => item.paid_date)
        .sort((a: any, b: any) =>
          String(b.paid_date).localeCompare(String(a.paid_date))
        );

      const lastPaymentDate = paidInstallments[0]?.paid_date
        ? String(paidInstallments[0].paid_date).slice(0, 10)
        : '-';

      const unpaidInstallments = installments
        .filter((item: any) => String(item.status).toLowerCase() !== 'paid')
        .sort((a: any, b: any) =>
          String(a.due_date).localeCompare(String(b.due_date))
        );

      const nextDueDate = unpaidInstallments[0]?.due_date || '-';

      const overdueDays = unpaidInstallments.map((item: any) =>
        calculateDaysOverdue(item.due_date)
      );

      const daysOverdue = Math.max(0, ...overdueDays);

      let status: OutstandingBalance['status'] = 'Pending';

      if (daysOverdue > 30) status = 'Critical';
      else if (daysOverdue > 0) status = 'Overdue';

      return {
        id: plan.id,
        studentId: plan.student_id,
        student: getStudentName(plan.students),
        studentUserId: getStudentUserId(plan.students),
        studentEmail: getStudentEmail(plan.students),
        phone: getStudentPhone(plan.students) || '',
        course: getCourseNameFromEnrollment(plan.enrollments),
        totalFee,
        paidAmount,
        outstandingAmount,
        lastPaymentDate,
        nextDueDate,
        daysOverdue,
        status,
      };
    })
    .filter((item: OutstandingBalance) =>
      includeZeroOutstanding ? item.totalFee > 0 : item.outstandingAmount > 0
    );

  return { data: mapped, error: null };
}

// ==================== RECEIPTS ====================

export interface PaymentReceiptDetails {
  id: string;
  paymentId: string;
  receiptNumber: string;
  receiptUrl: string;
  student: string;
  studentUserId: string | null;
  studentEmail: string | null;
  course: string;
  amount: number;
  paymentMethod: string;
  paymentReference: string;
  paidAt: string;
  date: string;
  issuedBy: string;
  status: 'Issued' | 'Void';
}

function getPaymentPlanFromReceipt(payment: any) {
  const installment = getSingle(payment?.installments);
  return getSingle(installment?.payment_plans);
}

export async function fetchReceiptsWithDetails(studentIdFilter?: string) {
  let query = supabase
    .from('receipts')
    .select(`
      id,
      payment_id,
      receipt_number,
      receipt_url,
      issued_at,
      payments!inner(
        id,
        student_id,
        amount_paid,
        payment_method,
        payment_reference,
        paid_at,
        installments(
          payment_plans(
            students(user_id, full_name, email),
            enrollments(
              class_batches(
                courses(course_name)
              )
            )
          )
        )
      )
    `)
    .order('issued_at', { ascending: false });

  if (studentIdFilter) {
    query = query.eq('payments.student_id', studentIdFilter);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching receipts:', error.message);
    return { data: [] as PaymentReceiptDetails[], error };
  }

  const mapped: PaymentReceiptDetails[] = (data || []).map((receipt: any) => {
    const payment = getSingle(receipt.payments);
    const plan = getPaymentPlanFromReceipt(payment);

    return {
      id: receipt.id,
      paymentId: receipt.payment_id || payment?.id || '',
      receiptNumber: receipt.receipt_number || '-',
      receiptUrl: receipt.receipt_url || '',
      student: getStudentName(plan?.students),
      studentUserId: getStudentUserId(plan?.students),
      studentEmail: getStudentEmail(plan?.students),
      course: getCourseNameFromEnrollment(plan?.enrollments),
      amount: Number(payment?.amount_paid || 0),
      paymentMethod: formatPaymentMethod(payment?.payment_method || '-'),
      paymentReference: payment?.payment_reference || '-',
      paidAt: payment?.paid_at
        ? new Date(payment.paid_at).toISOString().slice(0, 10)
        : '-',
      date: receipt.issued_at
        ? new Date(receipt.issued_at).toISOString().slice(0, 10)
        : '-',
      issuedBy: 'Finance Staff',
      status: 'Issued',
    };
  });

  return { data: mapped, error: null };
}

// ==================== PAYMENT PLANS ====================

export interface InstallmentItem {
  id: string;
  amount: number;
  dueDate: string;
  paidDate: string;
  status: string;
}

export interface PaymentPlan {
  id: string;
  enrollmentId: string;
  studentId: string;
  student: string;
  studentUserId: string | null;
  studentEmail: string | null;
  studentPhone: string | null;
  course: string;
  originalFee: number;
  discountAmount: number;
  totalFee: number;
  paidAmount: number;
  planType: 'Full Payment' | 'Installments' | 'Deposit + Balance';
  rawPlanType: string;
  installments: number;
  nextPayment: string;
  nextAmount: number;
  status: 'Active' | 'Completed' | 'Overdue';
  installmentDetails: InstallmentItem[];
}

export interface EnrollmentOption {
  id: string;
  studentId: string;
  studentName: string;
  courseName: string;
  courseFee: number;
  hasEnrollment: boolean;
}

function mapPlanType(type: string): PaymentPlan['planType'] {
  if (type === 'full_payment') return 'Full Payment';
  if (type === 'deposit_balance') return 'Deposit + Balance';
  return 'Installments';
}

function mapPaymentStatus(status: string, installments: any[]): PaymentPlan['status'] {
  if (String(status).toLowerCase() === 'paid') return 'Completed';

  const hasOverdue = (installments || []).some(
    (item: any) =>
      String(item.status).toLowerCase() !== 'paid' &&
      item.due_date &&
      new Date(item.due_date) < startOfToday()
  );

  if (hasOverdue) return 'Overdue';

  return 'Active';
}

export function formatInstallmentStatus(status: string, dueDate: string) {
  if (String(status).toLowerCase() === 'paid') return 'Paid';
  if (dueDate && new Date(dueDate) < startOfToday()) return 'Overdue';
  return 'Pending';
}

export async function fetchPaymentPlansWithDetails(studentIdFilter?: string) {
  let planQuery = supabase
    .from('payment_plans')
    .select(`
      id,
      enrollment_id,
      student_id,
      original_fee,
      discount_amount,
      final_amount,
      plan_type,
      status,
      created_at
    `)
    .order('created_at', { ascending: false });

  if (studentIdFilter) {
    planQuery = planQuery.eq('student_id', studentIdFilter);
  }

  const { data: planRows, error: planError } = await planQuery;

  if (planError) {
    console.error('Error fetching payment plans:', planError.message);
    return { data: [] as PaymentPlan[], error: planError };
  }

  const paymentPlans = planRows || [];

  const studentIds = Array.from(
    new Set(paymentPlans.map((plan: any) => plan.student_id).filter(Boolean))
  );

  const enrollmentIds = Array.from(
    new Set(paymentPlans.map((plan: any) => plan.enrollment_id).filter(Boolean))
  );

  const planIds = paymentPlans.map((plan: any) => plan.id);

  const [studentsRes, enrollmentsRes, installmentsRes] = await Promise.all([
    studentIds.length > 0
      ? supabase
          .from('students')
          .select('id, full_name, user_id, email, phone')
          .in('id', studentIds)
      : Promise.resolve({ data: [], error: null }),

    enrollmentIds.length > 0
      ? supabase
          .from('enrollments')
          .select('id, batch_id')
          .in('id', enrollmentIds)
      : Promise.resolve({ data: [], error: null }),

    planIds.length > 0
      ? supabase
          .from('installments')
          .select('id, payment_plan_id, amount, due_date, paid_date, status')
          .in('payment_plan_id', planIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (studentsRes.error) {
    console.error('Error fetching payment students:', studentsRes.error.message);
  }

  if (enrollmentsRes.error) {
    console.error('Error fetching payment enrollments:', enrollmentsRes.error.message);
  }

  if (installmentsRes.error) {
    console.error('Error fetching installments:', installmentsRes.error.message);
  }

  const enrollmentRows = enrollmentsRes.data || [];
  const batchIds = Array.from(
    new Set(enrollmentRows.map((item: any) => item.batch_id).filter(Boolean))
  );

  const { data: batchRows, error: batchError } =
    batchIds.length > 0
      ? await supabase
          .from('class_batches')
          .select('id, course_id')
          .in('id', batchIds)
      : { data: [], error: null };

  if (batchError) {
    console.error('Error fetching class batches:', batchError.message);
  }

  const courseIds = Array.from(
    new Set((batchRows || []).map((item: any) => item.course_id).filter(Boolean))
  );

  const { data: courseRows, error: courseError } =
    courseIds.length > 0
      ? await supabase
          .from('courses')
          .select('id, course_name')
          .in('id', courseIds)
      : { data: [], error: null };

  if (courseError) {
    console.error('Error fetching courses:', courseError.message);
  }

  const studentMap = new Map(
    (studentsRes.data || []).map((student: any) => [student.id, student])
  );

  const enrollmentMap = new Map(
    enrollmentRows.map((enrollment: any) => [enrollment.id, enrollment])
  );

  const batchMap = new Map((batchRows || []).map((batch: any) => [batch.id, batch]));

  const courseMap = new Map((courseRows || []).map((course: any) => [course.id, course]));

  const installmentsByPlan = new Map<string, any[]>();

  (installmentsRes.data || []).forEach((installment: any) => {
    const list = installmentsByPlan.get(installment.payment_plan_id) || [];
    list.push(installment);
    installmentsByPlan.set(installment.payment_plan_id, list);
  });

  const mapped: PaymentPlan[] = paymentPlans.map((plan: any) => {
    const installmentRows = (installmentsByPlan.get(plan.id) || []).sort(
      (a: any, b: any) => String(a.due_date).localeCompare(String(b.due_date))
    );

    const student = studentMap.get(plan.student_id);

    const enrollment = enrollmentMap.get(plan.enrollment_id);
    const batch = batchMap.get(enrollment?.batch_id);
    const course = courseMap.get(batch?.course_id);

    const originalFee = Number(plan.original_fee || 0);
    const discountAmount = Number(plan.discount_amount || 0);
    const totalFee = Number(plan.final_amount || originalFee - discountAmount);

    const paidAmount = installmentRows
      .filter((item: any) => String(item.status).toLowerCase() === 'paid')
      .reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);

    const unpaidInstallments = installmentRows.filter(
      (item: any) => String(item.status).toLowerCase() !== 'paid'
    );

    const next = unpaidInstallments[0];

    return {
      id: plan.id,
      enrollmentId: plan.enrollment_id || '',
      studentId: plan.student_id || '',
      student: student?.full_name || 'Unnamed Student',
      studentUserId: student?.user_id || null,
      studentEmail: student?.email || null,
      studentPhone: student?.phone || null,
      course: course?.course_name || '-',
      originalFee,
      discountAmount,
      totalFee,
      paidAmount,
      planType: mapPlanType(plan.plan_type),
      rawPlanType: plan.plan_type || 'full_payment',
      installments: installmentRows.length,
      nextPayment: next?.due_date || '-',
      nextAmount: Number(next?.amount || 0),
      status: mapPaymentStatus(plan.status, installmentRows),
      installmentDetails: installmentRows.map((item: any) => ({
        id: item.id,
        amount: Number(item.amount || 0),
        dueDate: item.due_date || '-',
        paidDate: item.paid_date ? String(item.paid_date).slice(0, 10) : '-',
        status: formatInstallmentStatus(item.status, item.due_date),
      })),
    };
  });

  return { data: mapped, error: null };
}

export async function fetchEnrollmentOptions() {
  const { data: students, error: studentError } = await supabase
    .from('students')
    .select('id, full_name, status')
    .in('status', ['active', 'completed'])
    .order('full_name', { ascending: true });

  if (studentError) {
    console.error('Error fetching students for payment plan:', studentError.message);
    return { data: [] as EnrollmentOption[], error: studentError };
  }

  const studentRows = students || [];
  const studentIds = studentRows.map((student: any) => student.id);

  const { data: enrollmentRows, error: enrollmentError } =
    studentIds.length > 0
      ? await supabase
          .from('enrollments')
          .select('id, student_id, batch_id, enrollment_status')
          .in('student_id', studentIds)
      : { data: [], error: null };

  if (enrollmentError) {
    console.error('Error fetching enrollments for payment plan:', enrollmentError.message);
  }

  const batchIds = Array.from(
    new Set((enrollmentRows || []).map((item: any) => item.batch_id).filter(Boolean))
  );

  const { data: batchRows, error: batchError } =
    batchIds.length > 0
      ? await supabase
          .from('class_batches')
          .select('id, course_id')
          .in('id', batchIds)
      : { data: [], error: null };

  if (batchError) {
    console.error('Error fetching batches for payment plan:', batchError.message);
  }

  const courseIds = Array.from(
    new Set((batchRows || []).map((item: any) => item.course_id).filter(Boolean))
  );

  const { data: courseRows, error: courseError } =
    courseIds.length > 0
      ? await supabase
          .from('courses')
          .select('id, course_name, course_fee')
          .in('id', courseIds)
      : { data: [], error: null };

  if (courseError) {
    console.error('Error fetching courses for payment plan:', courseError.message);
  }

  const enrollmentByStudent = new Map<string, any>();

  (enrollmentRows || []).forEach((enrollment: any) => {
    const existing = enrollmentByStudent.get(enrollment.student_id);

    if (!existing || enrollment.enrollment_status === 'active') {
      enrollmentByStudent.set(enrollment.student_id, enrollment);
    }
  });

  const batchMap = new Map((batchRows || []).map((batch: any) => [batch.id, batch]));
  const courseMap = new Map((courseRows || []).map((course: any) => [course.id, course]));

  const mapped: EnrollmentOption[] = studentRows.map((student: any) => {
    const enrollment = enrollmentByStudent.get(student.id);
    const batch = batchMap.get(enrollment?.batch_id);
    const course = courseMap.get(batch?.course_id);

    return {
      id: enrollment?.id || '',
      studentId: student.id,
      studentName: student.full_name || 'Unnamed Student',
      courseName: course?.course_name || 'No Course Linked',
      courseFee: Number(course?.course_fee || 0),
      hasEnrollment: Boolean(enrollment?.id),
    };
  });

  return { data: mapped, error: null };
}

export function buildInstallmentRows({
  paymentPlanId,
  finalAmount,
  planType,
  installmentCount,
  firstDueDate,
}: {
  paymentPlanId: string;
  finalAmount: number;
  planType: string;
  installmentCount: number;
  firstDueDate: string;
}) {
  const count = planType === 'full_payment' ? 1 : Math.max(2, installmentCount);
  const amount = Math.round((finalAmount / count) * 100) / 100;
  const rows = [];

  for (let index = 0; index < count; index += 1) {
    const dueDate = new Date(firstDueDate);
    dueDate.setMonth(dueDate.getMonth() + index);

    rows.push({
      payment_plan_id: paymentPlanId,
      amount:
        index === count - 1
          ? Math.round((finalAmount - amount * (count - 1)) * 100) / 100
          : amount,
      due_date: dueDate.toISOString().slice(0, 10),
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  return rows;
}
