import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lupa Password - SIMPA HIPPA Cirengit",
  description: "Halaman pemulihan kata sandi akun SIMPA HIPPA Cirengit.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100">
      <div className="w-full max-w-md">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
