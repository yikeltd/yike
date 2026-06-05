"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";

export function SignupForm({
  isAgent,
  title,
  subtitle,
}: {
  isAgent: boolean;
  title: string;
  subtitle: string;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agentType, setAgentType] = useState("independent");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone,
          role: isAgent ? "agent" : "user",
        },
      },
    });
    if (authError) {
      setLoading(false);
      setError(authError.message);
      return;
    }
    if (data.user && isAgent) {
      await supabase
        .from("profiles")
        .update({
          role: "agent",
          agent_type: agentType,
          whatsapp: whatsapp || phone,
          phone,
          full_name: fullName,
        })
        .eq("id", data.user.id);
    }
    setLoading(false);
    router.push(isAgent ? "/agent" : "/");
    router.refresh();
  }

  return (
    <AuthShell
      title={title}
      subtitle={subtitle}
      footer={
        <p className="text-sm text-muted">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-semibold text-gold-dark">
            Sign in
          </Link>
          {!isAgent && (
            <>
              {" · "}
              <Link
                href="/auth/signup?role=agent"
                className="font-semibold text-gold-dark"
              >
                List properties
              </Link>
            </>
          )}
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          placeholder="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="h-12 rounded-xl"
        />
        <Input
          placeholder="Phone (e.g. 08012345678)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          className="h-12 rounded-xl"
        />
        {isAgent && (
          <>
            <Input
              placeholder="WhatsApp number"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              required
              className="h-12 rounded-xl"
            />
            <Select
              value={agentType}
              onChange={(e) => setAgentType(e.target.value)}
              className="h-12 rounded-xl"
            >
              <option value="independent">Independent agent</option>
              <option value="agency">Agency</option>
              <option value="landlord">Landlord</option>
            </Select>
          </>
        )}
        <Input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="h-12 rounded-xl"
        />
        <Input
          type="password"
          placeholder="Password (min 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
          className="h-12 rounded-xl"
        />
        {error && (
          <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
        <Button type="submit" fullWidth size="lg" disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthShell>
  );
}
