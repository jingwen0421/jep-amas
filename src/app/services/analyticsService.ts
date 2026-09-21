import { supabase } from '../lib/supabase';

export interface DashboardAnalytics {
  activeStudents: number;
  activeCourses: number;
  activeClasses: number;
  revenueThisMonth: number;
  attendanceRate: number;
  outstandingFees: number;
  satisfactionScore: string;
  portfolioCompleted: number;
  collectedRate: number;
}

export interface ChartPoint {
  monthIndex: number;
  value: number;
}

export interface BusinessInsight {
  titleKey: string;
  descriptionKey: string;
  descriptionParams?: Record<string, string | number>;
}

export async function getDashboardAnalytics(): Promise<{
  stats: DashboardAnalytics;
  revenueTrend: ChartPoint[];
  studentGrowth: ChartPoint[];
  attendanceTrend: ChartPoint[];
  insights: BusinessInsight[];
}> {
  const [
    studentsRes,
    coursesRes,
    lessonsRes,
    attendanceRes,
    paymentPlansRes,
    paymentsRes,
    portfolioRes,
    surveyRes,
  ] = await Promise.all([
    supabase.from('students').select('id, status, created_at'),
    supabase.from('courses').select('id', { count: 'exact', head: true }),
    supabase.from('lessons').select('id', { count: 'exact', head: true }),
    supabase.from('attendance').select('attendance_status, marked_at'),
    supabase.from('payment_plans').select(`
      final_amount,
      installments(amount, status)
    `),
    supabase.from('payments').select('amount_paid, paid_at'),
    supabase.from('portfolio_items').select('portfolio_status'),
    supabase.from('surveys').select('rating'),
  ]);

  const students = studentsRes.data || [];
  const attendance = attendanceRes.data || [];
  const paymentPlans = paymentPlansRes.data || [];
  const payments = paymentsRes.data || [];
  const portfolioItems = portfolioRes.data || [];
  const surveys = surveyRes.data || [];

  const activeStudents = students.filter(
    (s: any) => String(s.status).toLowerCase() === 'active'
  ).length;

  const activeCourses = coursesRes.count || 0;
  const activeClasses = lessonsRes.count || 0;

  const presentCount = attendance.filter((a: any) =>
    ['present', 'late'].includes(String(a.attendance_status).toLowerCase())
  ).length;

  const attendanceRate =
    attendance.length > 0
      ? Math.round((presentCount / attendance.length) * 100)
      : 0;

  const totalFees = paymentPlans.reduce(
    (sum: number, plan: any) => sum + Number(plan.final_amount || 0),
    0
  );

  const totalPaid = paymentPlans.reduce((sum: number, plan: any) => {
    const installments = plan.installments || [];

    const paid = installments
      .filter((item: any) => String(item.status).toLowerCase() === 'paid')
      .reduce((acc: number, item: any) => acc + Number(item.amount || 0), 0);

    return sum + paid;
  }, 0);

  const outstandingFees = Math.max(totalFees - totalPaid, 0);

  const collectedRate =
    totalFees > 0 ? Math.round((totalPaid / totalFees) * 100) : 0;

  const currentMonth = new Date().toISOString().slice(0, 7);

  const revenueThisMonth = payments
    .filter((payment: any) => {
      if (!payment.paid_at) return false;
      return String(payment.paid_at).slice(0, 7) === currentMonth;
    })
    .reduce(
      (sum: number, payment: any) => sum + Number(payment.amount_paid || 0),
      0
    );

  const approvedPortfolio = portfolioItems.filter((item: any) =>
    ['approved', 'reviewed'].includes(
      String(item.portfolio_status).toLowerCase()
    )
  ).length;

  const portfolioCompleted =
    portfolioItems.length > 0
      ? Math.round((approvedPortfolio / portfolioItems.length) * 100)
      : 0;

  const avgRating =
    surveys.length > 0
      ? (
          surveys.reduce(
            (sum: number, item: any) => sum + Number(item.rating || 0),
            0
          ) / surveys.length
        ).toFixed(1)
      : '0';

  const stats: DashboardAnalytics = {
    activeStudents,
    activeCourses,
    activeClasses,
    revenueThisMonth,
    attendanceRate,
    outstandingFees,
    satisfactionScore: `${avgRating}/5.0`,
    portfolioCompleted,
    collectedRate,
  };

  return {
    stats,
    revenueTrend: buildMonthlyRevenue(payments),
    studentGrowth: buildStudentGrowth(students),
    attendanceTrend: buildAttendanceTrend(attendance),
    insights: buildBusinessInsights(stats),
  };
}

export async function getCourses() {
  const { data, error } = await supabase
    .from('courses')
    .select('id, course_name')
    .order('course_name');

  if (error) {
    console.error('Error fetching courses:', error.message);
    return [];
  }

  return data || [];
}

export async function getGeneratedReports() {
  const { data, error } = await supabase
    .from('generated_reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching report history:', error.message);
    return [];
  }

  return data || [];
}

function buildMonthlyRevenue(payments: any[]): ChartPoint[] {
  const months = getLastSixMonths();

  return months.map((month) => ({
    monthIndex: month.monthIndex,
    value: payments
      .filter(
        (payment) =>
          payment.paid_at && String(payment.paid_at).slice(0, 7) === month.key
      )
      .reduce(
        (sum, payment) => sum + Number(payment.amount_paid || 0),
        0
      ),
  }));
}

function buildStudentGrowth(students: any[]): ChartPoint[] {
  const months = getLastSixMonths();

  return months.map((month) => ({
    monthIndex: month.monthIndex,
    value: students.filter(
      (student) =>
        student.created_at && String(student.created_at).slice(0, 7) <= month.key
    ).length,
  }));
}

function buildAttendanceTrend(attendance: any[]): ChartPoint[] {
  const months = getLastSixMonths();

  return months.map((month) => {
    const records = attendance.filter(
      (item) =>
        item.marked_at && String(item.marked_at).slice(0, 7) === month.key
    );

    if (records.length === 0) {
      return {
        monthIndex: month.monthIndex,
        value: 0,
      };
    }

    const attended = records.filter((item) =>
      ['present', 'late'].includes(
        String(item.attendance_status).toLowerCase()
      )
    ).length;

    return {
      monthIndex: month.monthIndex,
      value: Math.round((attended / records.length) * 100),
    };
  });
}

function buildBusinessInsights(stats: DashboardAnalytics): BusinessInsight[] {
  const insights: BusinessInsight[] = [];

  insights.push({
    titleKey: 'reports.insights.revenueTitle',
    descriptionKey: 'reports.insights.revenueDesc',
    descriptionParams: { amount: stats.revenueThisMonth.toLocaleString() },
  });

  insights.push({
    titleKey: 'reports.insights.attendanceTitle',
    descriptionKey: 'reports.insights.attendanceDesc',
    descriptionParams: { rate: stats.attendanceRate },
  });

  insights.push({
    titleKey: 'reports.insights.outstandingTitle',
    descriptionKey: 'reports.insights.outstandingDesc',
    descriptionParams: { amount: stats.outstandingFees.toLocaleString() },
  });

  insights.push({
    titleKey: 'reports.insights.portfolioTitle',
    descriptionKey: 'reports.insights.portfolioDesc',
    descriptionParams: { rate: stats.portfolioCompleted },
  });

  return insights;
}

function getLastSixMonths() {
  const result = [];

  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);

    result.push({
      key: date.toISOString().slice(0, 7),
      monthIndex: date.getMonth(),
    });
  }

  return result;
}