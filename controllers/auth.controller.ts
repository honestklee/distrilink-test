import Cookies from 'js-cookie';
import { login as loginService } from '@/services/auth.service';
import { LoginPayload, UserSession } from '@/types/auth';

const SESSION_KEY = 'user_session';

export interface AuthErrorInfo {
  title: string;
  message: string;
  tips?: string[];
}

export class AuthController {
  /**
   * Orchestrate user login with input sanitization, API call, and cookie/session persistence
   */
  static async handleLogin(
    payload: LoginPayload
  ): Promise<{ success: boolean; user?: UserSession; error?: AuthErrorInfo }> {
    const username = payload.username?.trim();
    const password = payload.password?.trim();

    if (!username || !password) {
      return {
        success: false,
        error: {
          title: 'Kredensial Tidak Lengkap',
          message: 'Username dan password wajib diisi sebelum masuk.',
        },
      };
    }

    try {
      const user = await loginService({ username, password });
      
      // Save session in cookie and localStorage
      Cookies.set(SESSION_KEY, JSON.stringify(user), { expires: 1 });
      if (typeof window !== 'undefined') {
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      }

      return { success: true, user };
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : 'Login gagal, periksa kredensial Anda.';
      const isWrongCredential =
        rawMessage.toLowerCase().includes('salah') ||
        rawMessage.toLowerCase().includes('kredensial') ||
        rawMessage.toLowerCase().includes('credential') ||
        rawMessage.toLowerCase().includes('invalid');

      if (isWrongCredential) {
        return {
          success: false,
          error: {
            title: 'Username atau Password Tidak Sesuai',
            message:
              'Kombinasi username atau password yang Anda masukkan salah. Sistem tidak dapat menemukan akun yang sesuai.',
            tips: [
              'Pastikan huruf besar dan huruf kecil sudah benar (periksa apakah tombol Caps Lock aktif).',
              'Pastikan tidak ada spasi yang tidak disengaja sebelum atau sesudah teks.',
              'Anda dapat mencoba menggunakan akun demo di bawah untuk login instan.',
            ],
          },
        };
      }

      return {
        success: false,
        error: {
          title: 'Autentikasi Gagal',
          message: rawMessage,
        },
      };
    }
  }

  /**
   * Handle user logout
   */
  static handleLogout(): void {
    Cookies.remove(SESSION_KEY);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_KEY);
    }
  }

  /**
   * Retrieve current active session
   */
  static getCurrentSession(): UserSession | null {
    if (typeof window === 'undefined') return null;
    const session = Cookies.get(SESSION_KEY);
    if (!session) return null;
    try {
      return JSON.parse(session) as UserSession;
    } catch {
      return null;
    }
  }

  /**
   * Determine landing path based on RBAC role
   */
  static getRedirectPath(user?: UserSession | null): string {
    if (!user) return '/login';
    if (user.role === 'salesman') return '/dashboard/taking-order';
    return '/dashboard';
  }
}
