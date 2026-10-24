"use server";

import { GetRecentLoginsUseCase } from "../use-cases/get-recent-logins.use-case";

const getRecentLoginsUseCase = new GetRecentLoginsUseCase();

export interface RecentLoginItem {
  npa: string;
  name: string;
  role: string;
  timestamp: number;
}

export interface GetRecentLoginsActionResult {
  success: boolean;
  logins: RecentLoginItem[];
  error?: string;
}

export async function getRecentLoginsAction(
  limit: number = 5
): Promise<GetRecentLoginsActionResult> {
  try {
    const logins = await getRecentLoginsUseCase.execute(limit);
    return {
      success: true,
      logins,
    };
  } catch (error: any) {
    console.error("[AUTH] Gagal mengambil recent logins:", error);
    return {
      success: false,
      logins: [],
      error: error.message || "Gagal memuat aktivitas login.",
    };
  }
}
