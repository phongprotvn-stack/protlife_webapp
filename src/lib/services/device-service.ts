import { supabase } from '@/lib/supabase/client';

export interface UserDevice {
  id: string;
  user_id: string;
  device_name: string;
  login_method: string;
  last_active: string;
  created_at: string;
}

const DEVICE_ID_KEY = 'protlife-device-id';

/**
 * Record a successful login by inserting into user_devices table.
 * Stores the new device record's ID in localStorage for "current device" detection.
 */
export async function recordDeviceLogin(userId: string, method: string): Promise<void> {
  try {
    const deviceName = navigator.userAgent;
    const { data, error } = await supabase
      .from('user_devices')
      .insert({
        user_id: userId,
        device_name: deviceName,
        login_method: method,
        last_active: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) throw error;
    if (data?.id) {
      localStorage.setItem(DEVICE_ID_KEY, data.id);
    }
  } catch (e: any) {
    // Silently fail — device logging should never block login
    console.warn('[device-service] Failed to record device login:', e?.message);
  }
}

/**
 * Fetch all devices for the current user, newest first.
 */
export async function getUserDevices(): Promise<UserDevice[]> {
  const { data, error } = await supabase
    .from('user_devices')
    .select('*')
    .order('last_active', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Delete a device record.
 */
export async function deleteDevice(deviceId: string): Promise<void> {
  const { error } = await supabase
    .from('user_devices')
    .delete()
    .eq('id', deviceId);

  if (error) throw error;
}

/**
 * Delete all devices except the specified one (current device).
 */
export async function deleteOtherDevices(currentDeviceId: string): Promise<void> {
  const { error } = await supabase
    .from('user_devices')
    .delete()
    .neq('id', currentDeviceId);

  if (error) throw error;
}

/**
 * Get the stored current device ID from localStorage.
 */
export function getCurrentDeviceId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(DEVICE_ID_KEY);
}

/**
 * Format user agent string into a short readable name.
 */
export function formatDeviceName(ua: string): string {
  let os = '';
  let browser = '';

  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS X') || ua.includes('Macintosh')) os = 'macOS';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('Linux')) os = 'Linux';
  else os = 'Unknown';

  if (ua.includes('Edg/') || ua.includes('Edge/')) browser = 'Edge';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Safari/')) browser = 'Safari';
  else if (ua.includes('OPR/') || ua.includes('Opera/')) browser = 'Opera';
  else browser = 'Unknown';

  // Determine device type
  let deviceType = os;
  if (ua.includes('iPhone')) deviceType = 'iPhone';
  else if (ua.includes('iPad')) deviceType = 'iPad';
  else if (ua.includes('Android') && ua.includes('Mobile') === false) deviceType = 'Android Tablet';
  else if (ua.includes('Android')) deviceType = 'Android Phone';
  else if (ua.includes('Windows') && ua.includes('ARM')) deviceType = 'Windows (ARM)';

  const shortUa = `${deviceType} · ${browser}`;
  // Max 50 chars to avoid super long names
  return shortUa.length > 50 ? shortUa.slice(0, 47) + '...' : shortUa;
}

/**
 * Get a simple icon for a device based on user agent.
 */
export function getDeviceIcon(ua: string): string {
  if (ua.includes('iPhone') || ua.includes('iPad')) return '📱';
  if (ua.includes('Android') && ua.includes('Mobile')) return '📱';
  if (ua.includes('Android')) return '📟';
  if (ua.includes('Macintosh') || ua.includes('Mac OS')) return '💻';
  if (ua.includes('Windows')) return '🖥️';
  if (ua.includes('Linux')) return '🐧';
  return '📱';
}
