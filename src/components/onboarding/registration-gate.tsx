"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  CheckCircle2,
  FileText,
  KeyRound,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const REQUIREMENTS = [
  {
    icon: Building2,
    text: "Ensure your business is legally registered, tax-compliant, and gather necessary documents such as business registration, TIN, and authorized representative.",
  },
  {
    icon: FileText,
    text: "Provide the required details for TIN validation, business information, and ownership information during registration.",
  },
  {
    icon: ShieldCheck,
    text: "Create an account on SanTrack, complete the application, upload the documents, and submit for approval.",
  },
  {
    icon: KeyRound,
    text: "Upon submission, you will receive login credentials to access the platform, track status, and collaborate with the regulator to complete the onboarding process.",
  },
];

interface RegistrationGateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProceed: () => void;
}

export function RegistrationGate({
  open,
  onOpenChange,
  onProceed,
}: RegistrationGateProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-lg">
        <DialogHeader className="text-left">
          <DialogTitle className="text-xl">
            What you should know before starting the Registration process
          </DialogTitle>
          <DialogDescription>
            Please review the requirements before proceeding.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {/* Icon */}
          <div className="mb-5 flex size-12 items-center justify-center rounded-xl bg-primary-light">
            <Sparkles className="size-6 text-primary" />
          </div>

          {/* Requirements list */}
          <ul className="space-y-4">
            {REQUIREMENTS.map((req, i) => {
              const Icon = req.icon;
              return (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-light">
                    <Icon className="size-3.5 text-primary" />
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/80">
                    {req.text}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex justify-center pt-2">
          <Button
            size="lg"
            onClick={() => {
              onOpenChange(false);
              onProceed();
            }}
            className="px-8"
          >
            Proceed to Registration Process
          </Button>
        </div>
      </DialogPopup>
    </Dialog>
  );
}
