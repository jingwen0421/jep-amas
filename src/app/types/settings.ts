export interface AcademySettings {
  id: string;
  academyName: string;
  logoUrl: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  primaryColor: string;
  accentColor: string;
  status: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  channel: 'whatsapp' | 'email';
  subject?: string;
  content: string;
}