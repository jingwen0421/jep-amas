import { supabase } from '../lib/supabase';
import type { GeneratedReport, ReportRow } from '../utils/reportExporter';

export interface ReportFilters {
  reportType: string;
  startDate: string;
  endDate: string;
  course: string;
}

export async function generateReport(
  filters: ReportFilters
): Promise<GeneratedReport> {
  if (filters.reportType === 'attendance') return generateAttendanceReport();
  if (filters.reportType === 'payment') return generatePaymentReport();
  if (filters.reportType === 'enrollment') return generateEnrollmentReport();
  if (filters.reportType === 'portfolio') return generatePortfolioReport();
  if (filters.reportType === 'survey') return generateSurveyReport();
  if (filters.reportType === 'teacher') return generateTeacherReport();

  return generateAttendanceReport();
}

async function generateAttendanceReport(): Promise<GeneratedReport> {
  const { data } = await supabase.from('attendance').select(`
    attendance_status,
    marked_at,
    students(full_name),
    lessons(lesson_title)
  `);

  const rows: ReportRow[] =
    data?.map((item: any) => ({
      Student: getSingle(item.students)?.full_name || '-',
      Lesson: getSingle(item.lessons)?.lesson_title || '-',
      Status: formatText(item.attendance_status),
      Date: formatDate(item.marked_at),
    })) || [];

  const present = rows.filter((row) => row.Status === 'Present').length;
  const late = rows.filter((row) => row.Status === 'Late').length;
  const absent = rows.filter((row) => row.Status === 'Absent').length;

  return makeReport('Attendance Report', 'attendance', [
    { label: 'Total Records', value: rows.length.toString() },
    { label: 'Present', value: present.toString() },
    { label: 'Late', value: late.toString() },
    { label: 'Absent', value: absent.toString() },
  ], rows);
}

async function generatePaymentReport(): Promise<GeneratedReport> {
  const { data } = await supabase.from('payments').select(`
    amount_paid,
    payment_method,
    payment_reference,
    paid_at,
    students(full_name)
  `);

  const rows: ReportRow[] =
    data?.map((item: any) => ({
      Student: getSingle(item.students)?.full_name || '-',
      Amount: `RM ${Number(item.amount_paid || 0).toLocaleString()}`,
      Method: formatText(item.payment_method),
      Reference: item.payment_reference || '-',
      Date: formatDate(item.paid_at),
    })) || [];

  const total = data?.reduce(
    (sum: number, item: any) => sum + Number(item.amount_paid || 0),
    0
  );

  return makeReport('Payment Report', 'payment', [
    { label: 'Total Payments', value: rows.length.toString() },
    { label: 'Total Collected', value: `RM ${Number(total || 0).toLocaleString()}` },
  ], rows);
}

async function generateEnrollmentReport(): Promise<GeneratedReport> {
  const { data } = await supabase
    .from('students')
    .select('student_code, full_name, email, phone, status, created_at')
    .order('created_at', { ascending: false });

  const rows: ReportRow[] =
    data?.map((student: any) => ({
      'Student ID': student.student_code || '-',
      Name: student.full_name || '-',
      Email: student.email || '-',
      Phone: student.phone || '-',
      Status: formatText(student.status),
      'Registered Date': formatDate(student.created_at),
    })) || [];

  return makeReport('Enrollment Report', 'enrollment', [
    { label: 'Total Students', value: rows.length.toString() },
  ], rows);
}

async function generatePortfolioReport(): Promise<GeneratedReport> {
  const { data } = await supabase.from('portfolio_items').select(`
    title,
    portfolio_status,
    submitted_at,
    students(full_name),
    portfolio_feedback(score, feedback)
  `);

  const rows: ReportRow[] =
    data?.map((item: any) => {
      const feedback = getSingle(item.portfolio_feedback);

      return {
        Student: getSingle(item.students)?.full_name || '-',
        Title: item.title || '-',
        Status: formatText(item.portfolio_status),
        Score: feedback?.score ? `${feedback.score}%` : '-',
        Submitted: formatDate(item.submitted_at),
      };
    }) || [];

  const approved = rows.filter((row) =>
    ['Approved', 'Reviewed'].includes(String(row.Status))
  ).length;

  return makeReport('Portfolio Report', 'portfolio', [
    { label: 'Total Submissions', value: rows.length.toString() },
    { label: 'Approved / Reviewed', value: approved.toString() },
  ], rows);
}

async function generateSurveyReport(): Promise<GeneratedReport> {
  const { data } = await supabase.from('surveys').select(`
    rating,
    feedback,
    submitted_at,
    students(full_name),
    courses(course_name),
    teachers(full_name)
  `);

  const rows: ReportRow[] =
    data?.map((item: any) => ({
      Student: getSingle(item.students)?.full_name || '-',
      Course: getSingle(item.courses)?.course_name || '-',
      Teacher: getSingle(item.teachers)?.full_name || '-',
      Rating: item.rating || '-',
      Feedback: item.feedback || '-',
      Date: formatDate(item.submitted_at),
    })) || [];

  const avg =
    data && data.length > 0
      ? (
          data.reduce((sum: number, item: any) => sum + Number(item.rating || 0), 0) /
          data.length
        ).toFixed(1)
      : '0';

  return makeReport('Student Satisfaction Report', 'survey', [
    { label: 'Total Responses', value: rows.length.toString() },
    { label: 'Average Rating', value: `${avg}/5.0` },
  ], rows);
}

async function generateTeacherReport(): Promise<GeneratedReport> {
  const { data } = await supabase.from('teachers').select('*');

  const rows: ReportRow[] =
    data?.map((teacher: any) => ({
      Name: teacher.full_name || teacher.name || '-',
      Email: teacher.email || '-',
      Status: formatText(teacher.status),
    })) || [];

  return makeReport('Teacher Performance Report', 'teacher', [
    { label: 'Total Teachers', value: rows.length.toString() },
  ], rows);
}

function makeReport(
  title: string,
  reportType: string,
  summary: { label: string; value: string }[],
  rows: ReportRow[]
): GeneratedReport {
  return {
    title,
    reportType,
    generatedAt: new Date().toLocaleString(),
    summary,
    rows,
  };
}

function getSingle(value: any) {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] || null;
  return value;
}

function formatText(value?: string) {
  if (!value) return '-';

  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(date?: string) {
  if (!date) return '-';
  return new Date(date).toISOString().slice(0, 10);
}