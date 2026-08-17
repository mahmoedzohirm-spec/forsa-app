// ============================================
// ❌ تم إلغاء التوكن نهائياً
// ============================================

import { User } from '@/types';

// توليد توكن (ملغي)
export function generateToken(user: User): string {
  console.warn('⚠️ generateToken تم استدعاؤها ولكن التوكن ملغي');
  return 'dummy-token-removed';
}

// التحقق من التوكن (ملغي - دائماً يرجع payload وهمي)
export function verifyToken(token: string): any {
  console.warn('⚠️ verifyToken تم استدعاؤها ولكن التوكن ملغي');
  return { id: 1, email: 'admin@example.com', is_admin: true };
}

// جلب التوكن من الكوكيز (ملغي - دائماً null)
export async function getTokenFromCookies(): Promise<string | null> {
  console.warn('⚠️ getTokenFromCookies تم استدعاؤها ولكن التوكن ملغي');
  return null;
}

// تعيين التوكن في الكوكيز (ملغي - لا يفعل شيئاً)
export async function setTokenCookie(token: string): Promise<void> {
  console.warn('⚠️ setTokenCookie تم استدعاؤها ولكن التوكن ملغي');
}

// حذف التوكن من الكوكيز (ملغي - لا يفعل شيئاً)
export async function clearTokenCookie(): Promise<void> {
  console.warn('⚠️ clearTokenCookie تم استدعاؤها ولكن التوكن ملغي');
}

// دالة جديدة للتحقق من حالة المستخدم (دائماً true)
export function isAuthenticated(): boolean {
  return true;
}

// دالة جديدة لجلب المستخدم الحالي (دائماً admin)
export function getCurrentUser(): User {
  return {
    id: 1,
    email: 'mahmoedzohir@admin.com',
    is_admin: true,
    name: 'Admin',
    created_at: new Date().toISOString(), // ✅ أضفنا هذا الحقل المطلوب
  };
}
