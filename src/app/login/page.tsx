"use client";

import { useEffect } from "react";
import { syncDatabaseFromServer } from "@/common/lib/mock-db";
import { clearSession } from "@/common/lib/auth";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  // Bersihkan session sebelumnya dan sinkronisasi database saat halaman dimuat
  useEffect(() => {
    clearSession();
    syncDatabaseFromServer();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100">
      <div className="w-full max-w-4xl">
        <LoginForm />
      </div>
    </div>
  );
}
