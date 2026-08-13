import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { User } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const TOKEN_EXPIRY = '7d';

export function generateToken(user: User): string {
  return jwt.sign(
    { id: user.id, email: user.email, is_admin: user.is_admin },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function getTokenFromCookies(): string | null {
  try {
    const cookieStore = cookies();
    return cookieStore.get('token')?.value || null;
  } catch {
    return null;
  }
}

export function setTokenCookie(token: string): void {
  try {
    const cookieStore = cookies();
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
  } catch (error) {
    console.error('Error setting token cookie:', error);
  }
}

export function clearTokenCookie(): void {
  try {
    const cookieStore = cookies();
    cookieStore.delete('token');
  } catch (error) {
    console.error('Error clearing token cookie:', error);
  }
}
