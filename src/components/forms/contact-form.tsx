"use client";

import { useState } from "react";
import { MessageCircle, Mail, MapPin, Phone } from "lucide-react";
import { YIKE_SUPPORT_PHONE_DISPLAY } from "@/lib/constants";
import { getYikeSupportWhatsAppUrl } from "@/lib/support";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import {
  HumanVerifyField,
  readHumanVerifyFromForm,
} from "@/components/forms/human-verify-field";

export function WhatsAppSupportCard() {
  return (
    <a
      href={getYikeSupportWhatsAppUrl()}
      target="_blank"
      rel="noopener noreferrer"
      className="pressable flex items-center gap-3 rounded-2xl bg-[#25D366]/10 p-4 text-sm font-semibold text-navy ring-1 ring-[#25D366]/20"
    >
      <MessageCircle className="h-5 w-5 shrink-0 text-[#25D366]" />
      <div>
        <p>WhatsApp support (business hours)</p>
        <p className="mt-0.5 text-xs font-normal text-muted">
          Fastest way to reach us — we aim to reply within a few hours.
        </p>
      </div>
    </a>
  );
}

export function ContactForm() {
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [verifyOk, setVerifyOk] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const check = readHumanVerifyFromForm(form);
    if (!check.ok) {
      setError(check.error ?? "Verification failed.");
      return;
    }

    const name = (form.get("name") as string).trim();
    const email = (form.get("email") as string).trim();
    const subject = (form.get("subject") as string).trim();
    const message = (form.get("message") as string).trim();

    if (!name || !email || !message) {
      setError("Name, email and message are required.");
      return;
    }

    const body = encodeURIComponent(
      `From: ${name}\nEmail: ${email}\n\n${message}`
    );
    const mailSubject = encodeURIComponent(subject || `Yike contact from ${name}`);
    window.location.href = `mailto:hello@yike.ng?subject=${mailSubject}&body=${body}`;
    setDone(true);
  }

  if (done) {
    return (
      <div className="rounded-2xl bg-gold/10 p-8 text-center">
        <p className="text-lg font-bold text-navy">Opening your email app…</p>
        <p className="mt-2 text-sm text-muted">
          If nothing opens, email us directly at hello@yike.ng
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold text-muted">Your name *</span>
          <Input name="name" required className="mt-1.5" placeholder="Full name" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-muted">Email *</span>
          <Input
            name="email"
            type="email"
            required
            className="mt-1.5"
            placeholder="you@email.com"
          />
        </label>
      </div>
      <label className="block">
        <span className="text-xs font-semibold text-muted">Subject</span>
        <Input name="subject" className="mt-1.5" placeholder="How can we help?" />
      </label>
      <label className="block">
        <span className="text-xs font-semibold text-muted">Message *</span>
        <Textarea
          name="message"
          required
          rows={5}
          className="mt-1.5"
          placeholder="Tell us about your enquiry…"
        />
      </label>
      <HumanVerifyField onValidChange={setVerifyOk} />
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" fullWidth disabled={!verifyOk}>
        Send message
      </Button>
    </form>
  );
}

export function ContactSidebar() {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-float">
        <Mail className="mt-0.5 h-5 w-5 text-gold-dark" />
        <div>
          <p className="text-sm font-bold text-navy">Email</p>
          <a href="mailto:hello@yike.ng" className="text-sm text-gold-dark">
            hello@yike.ng
          </a>
          <p className="mt-1 text-xs text-muted">We aim to reply within a few hours.</p>
        </div>
      </div>
      <div className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-float">
        <Phone className="mt-0.5 h-5 w-5 text-gold-dark" />
        <div>
          <p className="text-sm font-bold text-navy">Phone</p>
          <a
            href={`tel:${YIKE_SUPPORT_PHONE_DISPLAY.replace(/\s/g, "")}`}
            className="text-sm text-gold-dark"
          >
            {YIKE_SUPPORT_PHONE_DISPLAY}
          </a>
        </div>
      </div>
      <div className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-float">
        <MapPin className="mt-0.5 h-5 w-5 text-gold-dark" />
        <div>
          <p className="text-sm font-bold text-navy">Coverage</p>
          <p className="text-sm text-muted">
            Lagos, Abuja, Aba, Enugu, Owerri, Port Harcourt — all Nigerian states
          </p>
        </div>
      </div>
    </div>
  );
}
