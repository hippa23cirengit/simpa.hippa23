import { ResetPasswordForm } from "@/components/reset-password-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Atur Ulang Password - SIMPA HIPPA Cirengit",
  description: "Halaman pembuatan kata sandi baru akun SIMPA HIPPA Cirengit.",
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const token = typeof resolvedParams.token === "string" ? resolvedParams.token : "";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100">
      <div className="w-full max-w-md">
        <ResetPasswordForm token={token} />
      </div>
    </div>
  );
}
