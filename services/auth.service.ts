import { LoginPayload, UserSession } from "@/types/auth";
import demoAccounts from "@/data/demo-accounts.json";
import { getStoredSalesReps } from "./sales.service";
import { api } from "@/lib/api";
import axios from "axios";

// ---------------------------------------------------------------------------
// DummyJSON credential mapping
// Every local demo account is paired with a verified DummyJSON user credential.
// Credentials verified via: POST https://dummyjson.com/auth/login
//
// Known valid DummyJSON users (verified):
//   id=1  emilys      / emilyspass     (Emily Johnson)
//   id=2  michaelw    / michaelwpass   (Michael Williams)
//   id=3  sophiab     / sophiabpass    (Sophia Brown)
//   id=4  jamesd      / jamesdpass     (James Davis)    ← salesman fallback
//   id=7  alexanderj  / alexanderjpass (Alexander Jones) ← sales_budi
// ---------------------------------------------------------------------------
const DUMMYJSON_CREDENTIALS: Record<string, { username: string; password: string }> = {
  spv_bandungkota:  { username: "emilys",     password: "emilyspass"    },
  spv_bandungbarat: { username: "michaelw",   password: "michaelwpass"  },
  spv_cimahi:       { username: "sophiab",    password: "sophiabpass"   },
  sales_budi:       { username: "alexanderj", password: "alexanderjpass" }, // fixed: was alexanderw (invalid)
};

// Fallback for salesman accounts without an explicit mapping.
// Uses jamesd so the name/avatar returned makes sense for a salesman role.
const SALESMAN_FALLBACK = { username: "jamesd", password: "jamesdpass" };

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

/**
 * Try calling DummyJSON; on ANY failure silently return null so the caller
 * can fall back to a local token.  This prevents network issues from blocking
 * login for non-critical accounts.
 */
async function tryDummyJsonLogin(
  username: string,
  password: string
): Promise<DummyJsonAuthResponse | null> {
  try {
    return await callDummyJsonLogin(username, password);
  } catch {
    return null;
  }
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
    // Accept the account's configured password or the universal demo shortcut
    const isValidLocalPass =
      password === matchedPreset.password ||
      password === "password123";

    if (!isValidLocalPass) {
      throw new Error(
        "Username atau password yang Anda masukkan salah. Silakan periksa kembali atau gunakan akun Supervisor / Salesman yang tersedia."
      );
    }

    // --- Hit DummyJSON API with the mapped (or fallback) credential ---
    const mapped = DUMMYJSON_CREDENTIALS[matchedPreset.username];
    const credential = mapped ?? SALESMAN_FALLBACK;

    // For supervisor accounts we surface API errors; for salesman we use graceful fallback.
    const isSupervisor = matchedPreset.role === "supervisor";
    let apiData: DummyJsonAuthResponse | null = null;

    if (isSupervisor) {
      // Supervisors must reach the API — surface any real errors
      try {
        apiData = await callDummyJsonLogin(credential.username, credential.password);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.data?.message) {
          throw new Error(err.response.data.message);
        }
        throw new Error("Gagal terhubung ke server autentikasi. Periksa koneksi internet Anda.");
      }
    } else {
      // Salesman preset — graceful fallback if API is unreachable
      apiData = await tryDummyJsonLogin(credential.username, credential.password);
    }

    const names = matchedPreset.name.split(" ");
    return {
      id:           apiData?.id ?? matchedPreset.username,
      username:     matchedPreset.username,       // keep local username for RBAC routing
      // Always use the local account's display name — the API name (e.g. "Alexander")
      // is from the mapped DummyJSON credential and must not override the real user name.
      firstName:    names[0],
      lastName:     names.slice(1).join(" ") || "User",
      email:        apiData?.email,
      gender:       apiData?.gender,
      image:        apiData?.image || `https://dummyjson.com/icon/${credential.username}/128`,
      role:         matchedPreset.role as "supervisor" | "salesman",
      area:         matchedPreset.area,
      salesmanId:   (matchedPreset as { salesmanId?: string }).salesmanId || undefined,
      // Tokens come from DummyJSON (real JWT), fall back to local token if offline
      accessToken:  apiData?.accessToken  || `local_token_${Date.now()}`,
      refreshToken: apiData?.refreshToken || undefined,
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
      throw new Error("Password akun salesman tidak sesuai. Silakan periksa kembali.");
    }

    // Hit DummyJSON API with salesman fallback credential to get a real token.
    // Completely non-blocking — local accounts still work if the network is down.
    const apiData = await tryDummyJsonLogin(
      SALESMAN_FALLBACK.username,
      SALESMAN_FALLBACK.password
    );

    const names = matchedRep.name.split(" ");
    return {
      id:           matchedRep.id,
      username:     matchedRep.username || matchedRep.name.toLowerCase().replace(/\s+/g, "_"),
      // Always use the registered local name — not the DummyJSON fallback name (e.g. "James Davis")
      firstName:    names[0],
      lastName:     names.slice(1).join(" ") || "Sales",
      email:        apiData?.email,
      gender:       apiData?.gender,
      image:        apiData?.image || `https://dummyjson.com/icon/${SALESMAN_FALLBACK.username}/128`,
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
