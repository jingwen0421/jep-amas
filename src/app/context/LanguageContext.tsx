import { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'zh';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.students': 'Student Management',
    'nav.courses': 'Course Management',
    'nav.classes': 'Class Management',
    'nav.attendance': 'Attendance',
    'nav.appointments': 'Appointments',
    'nav.payments': 'Payments',
    'nav.portfolio': 'Portfolio',
    'nav.certificates': 'Certificates',
    'nav.communications': 'Communications',
    'nav.survey': 'Survey & Feedback',
    'nav.reports': 'Reports',
    'nav.documents': 'Document Center',
    'nav.users': 'User Management',
    'nav.audit': 'Audit Logs',
    'nav.settings': 'Settings',

    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.export': 'Export',
    'common.download': 'Download',
    'common.view': 'View',
    'common.approve': 'Approve',
    'common.reject': 'Reject',
    'common.pending': 'Pending',
    'common.active': 'Active',
    'common.completed': 'Completed',
    'common.language': 'Language',

    // Login
    'login.title': 'JEP Image Makeup Academy',
    'login.subtitle': 'Academy Management & Administration System',
    'login.signIn': 'Sign In',
    'login.forgotPassword': 'Forgot your password?',

    // Dashboard
    'dashboard.welcome': 'Welcome back to JEP Image Makeup Academy',
    'dashboard.quickActions': 'Quick Actions',

    // Languages
    'language.english': 'English',
    'language.chinese': 'Chinese',
  },
  zh: {
    // Navigation
    'nav.dashboard': '仪表板',
    'nav.students': '学生管理',
    'nav.courses': '课程管理',
    'nav.classes': '班级管理',
    'nav.attendance': '出勤',
    'nav.appointments': '预约',
    'nav.payments': '付款',
    'nav.portfolio': '作品集',
    'nav.certificates': '证书',
    'nav.communications': '通讯',
    'nav.survey': '调查与反馈',
    'nav.reports': '报告',
    'nav.documents': '文档中心',
    'nav.users': '用户管理',
    'nav.audit': '审计日志',
    'nav.settings': '设置',

    // Common
    'common.save': '保存',
    'common.cancel': '取消',
    'common.edit': '编辑',
    'common.delete': '删除',
    'common.search': '搜索',
    'common.filter': '筛选',
    'common.export': '导出',
    'common.download': '下载',
    'common.view': '查看',
    'common.approve': '批准',
    'common.reject': '拒绝',
    'common.pending': '待处理',
    'common.active': '活跃',
    'common.completed': '已完成',
    'common.language': '语言',

    // Login
    'login.title': 'JEP形象化妆学院',
    'login.subtitle': '学院管理系统',
    'login.signIn': '登录',
    'login.forgotPassword': '忘记密码？',

    // Dashboard
    'dashboard.welcome': '欢迎回到JEP形象化妆学院',
    'dashboard.quickActions': '快速操作',

    // Languages
    'language.english': 'English',
    'language.chinese': '中文',
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.en] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
