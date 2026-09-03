import { supabase } from '../lib/supabase';

// Mirrors a student's portfolio upload into Google Drive via the
// `drive-sync` Edge Function. Fire-and-forget from the caller's
// perspective — a Drive failure should never block or roll back the
// student's portfolio submission, which has already succeeded by the
// time this runs.
export async function syncPortfolioItem(portfolioItemId: string) {
  const { data, error } = await supabase.functions.invoke('drive-sync', {
    body: { portfolioItemId },
  });

  if (error) {
    return { success: false, error: error.message || 'Failed to reach the Drive sync service.' };
  }

  if (data?.error) {
    return { success: false, error: data.error as string };
  }

  return { success: true, driveFileId: data?.driveFileId as string | undefined };
}
