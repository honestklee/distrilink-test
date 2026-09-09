import { LoginPayload, UserSession } from "@/types/auth";
import demoAccounts from "@/data/demo-accounts.json";
import { getStoredSalesReps } from "./sales.service";

export async function login(payload: LoginPayload): Promise<UserSession> {
  const username = payload.username?.trim().toLowerCase();
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

  // 1. Check preset demo accounts
  const matchedPreset = demoAccounts.find(
    (acc) =>
      acc.username.toLowerCase() === username ||
      (acc.username === "spv_bandungkota" && (username === "emilys" || username === "spv_bdg_kota")) ||
      (acc.username === "spv_bandungbarat" && (username === "michaelw" || username === "spv_bdg_barat")) ||
      (acc.username === "spv_cimahi" && (username === "sophiab" || username === "spv_cmh")) ||
      (acc.username === "sales_budi" && (username === "budi" || username === "salesman"))
  );

  if (matchedPreset) {
    // Valid if password matches or matches default password123 or dummyjson passwords
    const isValidPass =
      password === matchedPreset.password ||
      password === "password123" ||
      password === "emilyspass" ||
      password === "michaelwpass" ||
      password === "sophiabpass";

    if (isValidPass) {
      const names = matchedPreset.name.split(" ");
      return {
        id: matchedPreset.username,
        username: matchedPreset.username,
        firstName: names[0],
        lastName: names.slice(1).join(" ") || "User",
        role: matchedPreset.role as "supervisor" | "salesman",
        area: matchedPreset.area,
        salesmanId: (matchedPreset as { salesmanId?: string }).salesmanId || undefined,
        accessToken: `local_token_${Date.now()}`,
        image:
          matchedPreset.role === "supervisor"
            ? "https://dummyjson.com/icon/emilys/128"
            : "https://dummyjson.com/icon/michaelw/128",
      };
    }
  }

  // 2. Check dynamically registered salesmen in LocalStorage
  const storedReps = getStoredSalesReps();
  const matchedRep = storedReps.find(
    (rep) =>
      (rep.username && rep.username.toLowerCase() === username) ||
      rep.id.toLowerCase() === username ||
      rep.name.toLowerCase() === username ||
      rep.name.toLowerCase().replace(/\s+/g, "_") === username ||
      rep.phone.replace(/[^0-9]/g, "") === username.replace(/[^0-9]/g, "")
  );

  if (matchedRep) {
    const expectedPassword = matchedRep.password || "password123";
    if (password !== expectedPassword && password !== "password123") {
      throw new Error("Password akun salesman tidak sesuai. Silakan periksa kembali.");
    }

    const names = matchedRep.name.split(" ");
    return {
      id: matchedRep.id,
      username: matchedRep.username || matchedRep.name.toLowerCase().replace(/\s+/g, "_"),
      firstName: names[0],
      lastName: names.slice(1).join(" ") || "Sales",
      role: "salesman",
      area: matchedRep.area,
      salesmanId: matchedRep.id,
      accessToken: `local_token_${Date.now()}`,
      image: "https://dummyjson.com/icon/michaelw/128",
    };
  }

  throw new Error(
    "Username atau password yang Anda masukkan salah. Silakan periksa kembali atau gunakan akun Supervisor / Salesman yang tersedia."
  );
}
