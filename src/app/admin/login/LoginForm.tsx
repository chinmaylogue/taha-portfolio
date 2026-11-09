"use client";

import { useActionState } from "react";
import { login } from "../actions";
import { input, primaryButton } from "../_components/ui";

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="mt-6 flex flex-col gap-3">
      <input
        name="password"
        type="password"
        required
        autoFocus
        autoComplete="current-password"
        placeholder="Password"
        className={input}
        aria-label="Password"
      />
      {state?.error && <p className="text-[12px] text-red-600">{state.error}</p>}
      <button type="submit" className={`${primaryButton} w-full py-2.5`} disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
