"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";

export function SignupForm({ isAgent }: { isAgent: boolean }) {
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
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <Input
        placeholder="Full name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        required
      />
      <Input
        placeholder="Phone (e.g. 08012345678)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        required
      />
      {isAgent && (
        <>
          <Input
            placeholder="WhatsApp number"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            required
          />
          <Select
            value={agentType}
            onChange={(e) => setAgentType(e.target.value)}
          >
            <option value="independent">Independent agent</option>
            <option value="agency">Agency</option>
            <option value="landlord">Landlord</option>
          </Select>
        </>
      )}
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        type="password"
        placeholder="Password (min 6 characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        minLength={6}
        required
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" fullWidth disabled={loading}>
        {loading ? "Creating account…" : "Sign up"}
      </Button>
      <p className="text-center text-sm text-muted">
        Have an account?{" "}
        <Link href="/auth/login" className="text-primary">
          Log in
        </Link>
      </p>
    </form>
  );
}
