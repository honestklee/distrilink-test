import axios from "axios";
import { api } from "@/lib/api";
import { LoginPayload, UserSession } from "@/types/auth";

export async function login(payload: LoginPayload): Promise<UserSession> {
  const username = payload.username?.trim();
  const password = payload.password?.trim();

  if (!username && !password) {
    throw new Error("Username dan password wajib diisi sebelum masuk.");
  }
  if (!username) {
    throw new Error("Username wajib diisi.");
  }
  if (!password) {
    throw new Error("Password wajib diisi.");
  }

  try {
    const response = await api.post<UserSession>("/auth/login", {
      username,
      password,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const serverMessage = error.response?.data?.message;
      if (
        serverMessage === "Invalid credentials" ||
        error.response?.status === 400 ||
        error.response?.status === 401
      ) {
        throw new Error(
          "Username atau password yang Anda masukkan salah. Silakan periksa kembali kombinasi huruf besar/kecil (Caps Lock) atau gunakan akun demo yang tersedia."
        );
      }
      if (serverMessage) {
        throw new Error(serverMessage);
      }
      if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
        throw new Error("Waktu koneksi habis. Silakan periksa koneksi internet Anda.");
      }
      if (!error.response) {
        throw new Error("Gagal terhubung ke server autentikasi. Periksa koneksi internet Anda.");
      }
    }
    const message =
      error instanceof Error ? error.message : "Login gagal, periksa kredensial Anda.";
    throw new Error(message);
  }
}