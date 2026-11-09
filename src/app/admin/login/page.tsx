import { redirect } from "next/navigation";
import { isAdminConfigured, isAuthenticated } from "@/lib/cms/auth";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  if (await isAuthenticated()) redirect("/admin");

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-8">
        <h1 className="text-lg font-bold tracking-tight text-neutral-900">Sign in</h1>
        <p className="mt-1 text-[13px] text-neutral-500">Manage the portfolio&apos;s content.</p>
        {isAdminConfigured() ? (
          <LoginForm />
        ) : (
          <p className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12px] leading-relaxed text-amber-800">
            The admin is disabled. Set <code>ADMIN_PASSWORD</code> in <code>.env.local</code> (or your hosting
            environment) and restart the server.
          </p>
        )}
      </div>
    </div>
  );
}
