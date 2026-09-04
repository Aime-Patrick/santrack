"use client";

import { useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { RegistrationGate } from "@/components/onboarding/registration-gate";

export default function RegisterPage() {
  const [gateOpen, setGateOpen] = useState(true);

  return (
    <>
      <AuthShell>
        <RegisterForm />
      </AuthShell>
      <RegistrationGate
        open={gateOpen}
        onOpenChange={setGateOpen}
        onProceed={() => setGateOpen(false)}
      />
    </>
  );
}
