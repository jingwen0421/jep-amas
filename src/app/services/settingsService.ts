import { supabase } from '../lib/supabase';
import type { AcademySettings } from '../types/settings';
import { defaultAcademySettings } from '../utils/settingsHelpers';

export async function getAcademySettings(): Promise<AcademySettings> {
  const { data, error } = await supabase
    .from('academies')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) return defaultAcademySettings;

  return {
    id: data.id,
    academyName: data.academy_name || defaultAcademySettings.academyName,
    logoUrl: data.logo_url || '',
    phone: data.phone || '',
    email: data.email || '',
    address: data.address || '',
    website: data.website || '',
    primaryColor: data.primary_color || '#284342',
    accentColor: data.accent_color || '#e9da95',
    status: data.status || 'active',
  };
}

export async function saveAcademySettings(settings: AcademySettings) {
  const payload = {
    academy_name: settings.academyName,
    logo_url: settings.logoUrl || null,
    phone: settings.phone || null,
    email: settings.email || null,
    address: settings.address || null,
    website: settings.website || null,
    primary_color: settings.primaryColor,
    accent_color: settings.accentColor,
    status: settings.status,
    updated_at: new Date().toISOString(),
  };

  if (settings.id) {
    const { error } = await supabase
      .from('academies')
      .update(payload)
      .eq('id', settings.id);

    if (error) throw error;
    return;
  }

  const { error } = await supabase.from('academies').insert(payload);
  if (error) throw error;
}