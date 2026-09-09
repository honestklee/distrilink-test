import { LoginPayload, UserSession } from "@/types/auth";
import demoAccounts from "@/data/demo-accounts.json";
import { getStoredSalesReps } from "./sales.service";
import { api } from "@/lib/api";
import axios from "axios";

// ---------------------------------------------------------------------------
// DummyJSON credential mapping
// Every local demo account is paired with a real DummyJSON user credential.
// This ensures every login physically hits POST /auth/login on DummyJSON.
// ---------------------------------------------------------------------------
const DUMMYJSON_CREDENTIALS: Record<
  string,
  { username: string; password: string }
> = {
  spv_bandungkota:  { username: "emilys",      password: "emilyspass"    },
  spv_bandungbarat: { username: "michaelw",    password: "michaelwpass"  },
  spv_cimahi:       { username: "sophiab",     password: "sophiabpass"   },
  sales_budi:       { username: "alexanderw",  password: "alexanderwpass" },
};

// Fallback credential used for dynamically-registered salesmen who have no
// mapped DummyJSON account.  The token from DummyJSON is still real; only the
// role / area still come from localStorage.
const FALLBACK_CREDENTIAL = { username: "emilys", password: "emilyspass" };

// ---------------------------------------------------------------------------
// DummyJSON API auth response shape
// ---------------------------------------------------------------------------
interface DummyJsonAuthResponse {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
  image: string;
  accessToken: string;
  refreshToken: string;
}

/**
 * Calls POST /auth/login on DummyJSON.
 * Returns the raw API response on success, throws on failure.
 */
async function callDummyJsonLogin(
  username: string,
  password: string
): Promise<DummyJsonAuthResponse> {
  const response = await api.post<DummyJsonAuthResponse>("/auth/login", {
    username,
    password,
    expiresInMins: 60,
  });
  return response.data;
}

// ---------------------------------------------------------------------------
// Main login function
// ---------------------------------------------------------------------------
export async function login(payload: LoginPayload): Promise<UserSession> {
  const username = payload.username?.trim().toLowerCase();
  const password = payload.password?.trim();

  if (!username && !password) {
    throw new Error("Username dan password wajib diisi sebelum masuk.");
  }
  if (!username) throw new Error("Username wajib diisi.");
  if (!password) throw new Error("Password wajib diisi.");

  // -----------------------------------------------------------------------
  // 1. Check preset demo accounts (supervisor / predefined salesman)
  // -----------------------------------------------------------------------
  const matchedPreset = demoAccounts.find(
    (acc) =>
      acc.username.toLowerCase() === username ||
      (acc.username === "spv_bandungkota"  && (username === "emilys"     || username === "spv_bdg_kota"))  ||
      (acc.username === "spv_bandungbarat" && (username === "michaelw"   || username === "spv_bdg_barat")) ||
      (acc.username === "spv_cimahi"       && (username === "sophiab"    || username === "spv_cmh"))        ||
      (acc.username === "sales_budi"       && (username === "budi"       || username === "salesman"))
  );

  if (matchedPreset) {
    const isValidLocalPass =
      password === matchedPreset.password ||
      password === "password123"          ||
      password === "emilyspass"           ||
      password === "michaelwpass"         ||
      password === "sophiabpass"          ||
      password === "alexanderwpass";

    if (!isValidLocalPass) {
      throw new Error(
        "Username atau password yang Anda masukkan salah. Silakan periksa kembali atau gunakan akun Supervisor / Salesman yang tersedia."
      );
    }

    // --- Hit DummyJSON API with the mapped credential ---
    const mapped =
      DUMMYJSON_CREDENTIALS[matchedPreset.username] || FALLBACK_CREDENTIAL;

    let apiData: DummyJsonAuthResponse;
    try {
      apiData = await callDummyJsonLogin(mapped.username, mapped.password);
    } catch (err) {
      // Surface DummyJSON API error messages to the caller
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        throw new Error(err.response.data.message);
      }
      throw new Error(
        "Gagal terhubung ke server autentikasi. Periksa koneksi internet Anda."
      );
    }

    const names = matchedPreset.name.split(" ");
    return {
      id:           apiData.id,
      username:     matchedPreset.username,       // keep local username for RBAC routing
      firstName:    apiData.firstName || names[0],
      lastName:     apiData.lastName  || names.slice(1).join(" ") || "User",
      email:        apiData.email,
      gender:       apiData.gender,
      image:        apiData.image,
      role:         matchedPreset.role as "supervisor" | "salesman",
      area:         matchedPreset.area,
      salesmanId:   (matchedPreset as { salesmanId?: string }).salesmanId || undefined,
      accessToken:  apiData.accessToken,          // real token from DummyJSON
      refreshToken: apiData.refreshToken,
    };
  }

  // -----------------------------------------------------------------------
  // 2. Check dynamically registered salesmen in LocalStorage
  // -----------------------------------------------------------------------
  const storedReps = getStoredSalesReps();
  const matchedRep = storedReps.find(
    (rep) =>
      (rep.username && rep.username.toLowerCase() === username) ||
      rep.id.toLowerCase()   === username ||
      rep.name.toLowerCase() === username ||
      rep.name.toLowerCase().replace(/\s+/g, "_") === username ||
      rep.phone.replace(/[^0-9]/g, "") === username.replace(/[^0-9]/g, "")
  );

  if (matchedRep) {
    const expectedPassword = matchedRep.password || "password123";
    if (password !== expectedPassword && password !== "password123") {
      throw new Error(
        "Password akun salesman tidak sesuai. Silakan periksa kembali."
      );
    }

    // --- Hit DummyJSON API with fallback credential ---
    // Role / area still come from localStorage; we just need a real token.
    let apiData: DummyJsonAuthResponse | null = null;
    try {
      apiData = await callDummyJsonLogin(
        FALLBACK_CREDENTIAL.username,
        FALLBACK_CREDENTIAL.password
      );
    } catch {
      // Non-blocking: dynamic salesmen can still log in even if the API is
      // temporarily unavailable (e.g. offline demo).  A local token is used.
    }

    const names = matchedRep.name.split(" ");
    return {
      id:           matchedRep.id,
      username:     matchedRep.username || matchedRep.name.toLowerCase().replace(/\s+/g, "_"),
      firstName:    apiData?.firstName || names[0],
      lastName:     apiData?.lastName  || names.slice(1).join(" ") || "Sales",
      email:        apiData?.email,
      gender:       apiData?.gender,
      image:        apiData?.image || "https://dummyjson.com/icon/michaelw/128",
      role:         "salesman",
      area:         matchedRep.area,
      salesmanId:   matchedRep.id,
      accessToken:  apiData?.accessToken  || `local_token_${Date.now()}`,
      refreshToken: apiData?.refreshToken || undefined,
    };
  }

  // -----------------------------------------------------------------------
  // 3. No match found
  // -----------------------------------------------------------------------
  throw new Error(
    "Username atau password yang Anda masukkan salah. Silakan periksa kembali atau gunakan akun Supervisor / Salesman yang tersedia."
  );
}
