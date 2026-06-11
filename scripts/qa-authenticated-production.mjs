#!/usr/bin/env node
/**
 * Production authenticated QA harness — creates qa.*@yike.ng sellers and exercises core flows.
 * Usage: vercel env run -- node scripts/qa-authenticated-production.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { createHash, randomInt } from "crypto";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvFile(name) {
  try {
    const text = readFileSync(join(__dirname, "..", name), "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 1) continue;
      const key = trimmed.slice(0, eq);
      let val = trimmed.slice(eq + 1);
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // optional fallback file
  }
}

loadEnvFile(".env.vercel.qa");

const BASE = process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://yike.ng";
const QA_PASSWORD = process.env.QA_PASSWORD || "QaYike2026!Secure";
const QA_PIN = "482910";

const QA_SELLERS = [
  { email: "qa.individual@yike.ng", username: "qa_individual", fullName: "QA Individual", accountType: "individual" },
  { email: "qa.agent@yike.ng", username: "qa_agent", fullName: "QA Agent", accountType: "agent" },
  { email: "qa.landlord@yike.ng", username: "qa_landlord", fullName: "QA Landlord", accountType: "landlord" },
  { email: "qa.company@yike.ng", username: "qa_company", fullName: "QA Company", accountType: "agency" },
  { email: "qa.developer@yike.ng", username: "qa_developer", fullName: "QA Developer", accountType: "developer" },
];

const passed = [];
const failed = [];
const fixed = [];

function pass(msg) {
  passed.push(msg);
  console.log(`✓ ${msg}`);
}

function fail(msg, detail = "") {
  const line = detail ? `${msg} — ${detail}` : msg;
  failed.push({ msg, detail });
  console.error(`✗ ${line}`);
}

function hashOtp(otp) {
  return createHash("sha256").update(otp).digest("hex");
}


function loadSampleImages() {
  const paths = [
    join(__dirname, "../public/images/hero/agents/sample-1.webp"),
    join(__dirname, "../public/images/hero/agents/sample-2.webp"),
    join(__dirname, "../public/images/hero/agents/sample-3.webp"),
  ];
  return paths.map((p) => ({
    path: p,
    buffer: readFileSync(p),
    mime: "image/webp",
  }));
}

async function signInWithCookieStore(anon, url, email, password) {
  const jar = [];
  const client = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return jar;
      },
      setAll(cookiesToSet) {
        for (const cookie of cookiesToSet) {
          const idx = jar.findIndex((c) => c.name === cookie.name);
          if (idx >= 0) jar[idx] = cookie;
          else jar.push(cookie);
        }
      },
    },
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) return { error: error?.message || "no session" };
  const cookieHeader = jar.map((c) => `${c.name}=${c.value}`).join("; ");
  return { session: data.session, cookieHeader, user: data.user };
}

async function authedFetch(url, cookieHeader, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Cookie", cookieHeader);
  if (init.body && !headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(url, { ...init, headers });
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !anon || !serviceKey) {
    console.error("Missing Supabase env (run via: vercel env run -- node scripts/qa-authenticated-production.mjs)");
    process.exit(1);
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const anonClient = createClient(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const sampleImages = loadSampleImages();
  const mediaUrls = sampleImages.map((_, i) => `${BASE}/images/hero/agents/sample-${i + 1}.webp`);

  // --- OTP signup smoke (qa.signup@yike.ng) ---
  const signupEmail = "qa.signup@yike.ng";
  try {
    const { data: existingSignup } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const signupUser = existingSignup?.users?.find((u) => u.email === signupEmail);
    if (signupUser) {
      await admin.from("properties").delete().eq("agent_id", signupUser.id);
      await admin.from("profiles").delete().eq("id", signupUser.id);
      await admin.auth.admin.deleteUser(signupUser.id);
    }
    await admin.from("auth_signup_pending").delete().eq("email", signupEmail);
    await admin.from("auth_email_otps").delete().eq("email", signupEmail);

    const mathA = 3;
    const mathB = 4;
    const signupRes = await fetch(`${BASE}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "QA Signup",
        username: "qa_signup",
        email: signupEmail,
        password: QA_PASSWORD,
        confirmPassword: QA_PASSWORD,
        pin: QA_PIN,
        mathA,
        mathB,
        mathAnswer: mathA + mathB,
      }),
    });
    const signupBody = await signupRes.json().catch(() => ({}));
    if (!signupRes.ok && signupRes.status !== 200) {
      fail("Signup OTP path — initial signup POST", `${signupRes.status} ${signupBody.error || ""}`);
    } else {
      const otpCode = String(randomInt(100000, 999999));
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      const { error: otpInsertErr } = await admin.from("auth_email_otps").insert({
        email: signupEmail,
        purpose: "signup",
        otp_hash: hashOtp(otpCode),
        expires_at: expiresAt,
      });
      if (otpInsertErr) {
        fail("Signup OTP path — seed OTP", otpInsertErr.message);
      } else {
        const verifyRes = await fetch(`${BASE}/api/auth/verify-email-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: signupEmail,
            code: otpCode,
            purpose: "signup",
            password: QA_PASSWORD,
          }),
        });
        const verifyBody = await verifyRes.json().catch(() => ({}));
        if (verifyRes.ok) {
          pass("Signup + email OTP verify (qa.signup@yike.ng)");
        } else {
          fail("Signup OTP verify", `${verifyRes.status} ${verifyBody.error || JSON.stringify(verifyBody)}`);
        }
      }
    }
  } catch (e) {
    fail("Signup OTP path", e.message);
  }

  const listingIds = [];

  for (const seller of QA_SELLERS) {
    console.log(`\n--- ${seller.accountType} (${seller.email}) ---`);
    try {
      const { data: userList } = await admin.auth.admin.listUsers({ perPage: 1000 });
      let user = userList?.users?.find((u) => u.email?.toLowerCase() === seller.email);

      if (user) {
        await admin.from("properties").delete().eq("agent_id", user.id);
        await admin.from("property_verification_requests").delete().eq("requester_id", user.id);
        await admin.from("profiles").delete().eq("id", user.id);
        await admin.auth.admin.deleteUser(user.id);
      }

      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: seller.email,
        password: QA_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: seller.fullName },
      });
      if (createErr) throw createErr;
      user = created.user;

      const { error: profileErr } = await admin.from("profiles").upsert({
        id: user.id,
        full_name: seller.fullName,
        username: seller.username,
        email: seller.email,
        phone: "08012345678",
        phone_verified: true,
        email_verified: true,
        role: "user",
        verification_status: "not_started",
        is_banned: false,
      });
      if (profileErr) throw profileErr;

      pass(`Created QA account ${seller.email}`);

      const auth = await signInWithCookieStore(anon, url, seller.email, QA_PASSWORD);
      if (auth.error) {
        fail(`${seller.accountType} login`, auth.error);
        continue;
      }
      pass(`${seller.accountType} login`);
      const { cookieHeader, session: signInSession } = auth;

      const becomeRes = await authedFetch(`${BASE}/api/agent/become`, cookieHeader, {
        method: "POST",
        body: JSON.stringify({
          accountType: seller.accountType,
          whatsapp: "08012345678",
          acceptRules: true,
        }),
      });
      const becomeBody = await becomeRes.json().catch(() => ({}));
      if (!becomeRes.ok) {
        fail(`${seller.accountType} become/seller upgrade`, `${becomeRes.status} ${becomeBody.error || ""}`);
        continue;
      }
      if (String(becomeBody.error || "").includes("Could not upgrade")) {
        fail(`${seller.accountType} become`, "Could not upgrade account");
        continue;
      }
      pass(`${seller.accountType} seller type selection + become`);

      let cacDocumentPath;
      if (seller.accountType === "agency" || seller.accountType === "developer") {
        const form = new FormData();
        const pdfBytes = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF");
        form.append("file", new Blob([pdfBytes], { type: "application/pdf" }), "qa-cac.pdf");
        const cacRes = await authedFetch(`${BASE}/api/agent/cac-upload`, cookieHeader, {
          method: "POST",
          body: form,
        });
        const cacBody = await cacRes.json().catch(() => ({}));
        if (!cacRes.ok) {
          fail(`${seller.accountType} CAC upload`, `${cacRes.status} ${cacBody.error || ""}`);
        } else {
          cacDocumentPath = cacBody.path;
          pass(`${seller.accountType} CAC PDF upload`);
          const { data: pub } = await admin.storage.from("agent-documents").getPublicUrl(cacDocumentPath);
          if (pub?.publicUrl && (await fetch(pub.publicUrl)).ok) {
            fail(`${seller.accountType} CAC privacy`, "document publicly accessible");
          } else {
            pass(`${seller.accountType} CAC document private`);
          }
        }
      }

      const profilePayload =
        seller.accountType === "agency" || seller.accountType === "developer"
          ? {
              companyName: `${seller.fullName} Ltd`,
              fullName: seller.fullName,
              cacDocumentPath,
              phone: "08012345678",
              residentialAddress: "12 QA Street",
              residentialArea: "GRA",
              residentialCity: "Enugu",
              residentialState: "Enugu",
            }
          : {
              fullName: seller.fullName,
              dateOfBirth: "1990-01-15",
              phone: "08012345678",
              residentialAddress: "12 QA Street",
              residentialArea: "GRA",
              residentialCity: "Enugu",
              residentialState: "Enugu",
            };

      const profileRes = await authedFetch(`${BASE}/api/agent/profile-setup`, cookieHeader, {
        method: "POST",
        body: JSON.stringify(profilePayload),
      });
      const profileBody = await profileRes.json().catch(() => ({}));
      if (!profileRes.ok) {
        fail(`${seller.accountType} profile setup`, `${profileRes.status} ${profileBody.error || ""}`);
        continue;
      }
      pass(`${seller.accountType} profile complete`);

      const listingPayload = {
        payload: {
          title: `QA ${seller.accountType} test listing Enugu`,
          description: "Automated QA listing — safe to reject.",
          listing_type: "rent",
          property_type: "flat",
          bedrooms: 2,
          bathrooms: 1,
          price: 850000,
          payment_period: "yearly",
          state: "Enugu",
          city: "Enugu",
          area: "GRA",
          media_urls: mediaUrls,
          listing_plan: "free",
        },
      };

      const createStarted = Date.now();
      const listingRes = await authedFetch(`${BASE}/api/agent/listings/create`, cookieHeader, {
        method: "POST",
        body: JSON.stringify(listingPayload),
      });
      const listingBody = await listingRes.json().catch(() => ({}));
      const createMs = Date.now() - createStarted;

      if (!listingRes.ok) {
        fail(`${seller.accountType} listing submit`, `${listingRes.status} ${listingBody.error || ""}`);
        continue;
      }
      if (createMs > 30000) {
        fail(`${seller.accountType} listing submit hang`, `${createMs}ms`);
      } else {
        pass(`${seller.accountType} listing submit (${createMs}ms, no hang)`);
      }

      const listingId = listingBody.id || listingBody.listingId;
      if (!listingId) {
        fail(`${seller.accountType} listing id`, JSON.stringify(listingBody));
        continue;
      }
      listingIds.push({ id: listingId, seller: seller.accountType, agentId: user.id });

      const { data: prop } = await admin.from("properties").select("status, agent_id").eq("id", listingId).single();
      if (prop?.status === "pending") {
        pass(`${seller.accountType} listing status pending`);
      } else {
        fail(`${seller.accountType} listing status`, `expected pending, got ${prop?.status}`);
      }

      const guardRes = await authedFetch(`${BASE}/api/agent/listings/submit-guard`, cookieHeader, {
        method: "POST",
        body: JSON.stringify({
          title: listingPayload.payload.title,
          description: listingPayload.payload.description,
        }),
      });
      const guardBody = await guardRes.json().catch(() => ({}));
      if (!guardRes.ok && String(guardBody.error || "").toLowerCase().includes("photo")) {
        fail(`${seller.accountType} false image shaming`, guardBody.error);
      } else if (guardRes.ok) {
        pass(`${seller.accountType} submit-guard ok (no false image shaming)`);
      }

      const userClient = createClient(url, anon, {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { headers: { Authorization: `Bearer ${signInSession.access_token}` } },
      });
      const { error: selfApproveErr } = await userClient
        .from("properties")
        .update({ status: "approved" })
        .eq("id", listingId)
        .eq("agent_id", user.id);
      if (selfApproveErr?.message?.includes("listing_status_escalation_denied")) {
        pass(`${seller.accountType} agent self-approve blocked`);
      } else if (!selfApproveErr) {
        const { data: check } = await admin.from("properties").select("status").eq("id", listingId).single();
        if (check?.status === "approved") {
          fail(`${seller.accountType} agent self-approve`, "agent was able to set approved");
          await admin.from("properties").update({ status: "pending" }).eq("id", listingId);
        } else {
          pass(`${seller.accountType} agent self-approve blocked (RLS)`);
        }
      } else {
        pass(`${seller.accountType} agent self-approve blocked (${selfApproveErr.message})`);
      }
    } catch (e) {
      fail(`${seller.accountType} flow`, e.message);
    }
  }

  // Admin approve first listing
  if (listingIds.length > 0) {
    const target = listingIds[0];
    const { error: approveErr } = await admin.from("properties").update({ status: "approved" }).eq("id", target.id);
    if (approveErr) {
      fail("Admin/service approve listing", approveErr.message);
    } else {
      const pageRes = await fetch(`${BASE}/properties/${target.id}`);
      pass("Admin approve listing → service role (DB)");
      const slugRes = await admin.from("properties").select("slug, status").eq("id", target.id).single();
      if (slugRes.data?.status === "approved" && slugRes.data?.slug) {
        const publicRes = await fetch(`${BASE}/properties/${slugRes.data.slug}`);
        if (publicRes.ok) {
          pass("Approved listing public on site");
        } else {
          fail("Approved listing public", `HTTP ${publicRes.status}`);
        }
      }
    }

    if (listingIds.length > 1) {
      const rejectTarget = listingIds[1];
      const { error: hideErr } = await admin
        .from("properties")
        .update({ status: "rejected" })
        .eq("id", rejectTarget.id);
      if (!hideErr) {
        pass("Admin reject/hide test listing");
      } else {
        fail("Admin reject listing", hideErr.message);
      }
    }
  }

  // Property verification request (logged-in qa.individual)
  try {
    const individual = QA_SELLERS[0];
    const auth = await signInWithCookieStore(anon, url, individual.email, QA_PASSWORD);
    if (auth.cookieHeader) {
      const verRes = await authedFetch(`${BASE}/api/property-verification/submit`, auth.cookieHeader, {
        method: "POST",
        body: JSON.stringify({
          fullName: individual.fullName,
          email: individual.email,
          whatsapp: "08012345678",
          propertyTitle: "QA verification property Enugu",
          propertyLocation: "GRA, Enugu",
          termsAccepted: true,
          urgency: "normal",
        }),
      });
      const verBody = await verRes.json().catch(() => ({}));
      if (verRes.ok) {
        pass("Property verification request submit");
        const reqId = verBody.id || verBody.requestId;
        if (reqId) {
          await admin
            .from("property_verification_requests")
            .update({ status: "in_progress" })
            .eq("id", reqId);
          const { data: updated } = await admin
            .from("property_verification_requests")
            .select("status")
            .eq("id", reqId)
            .single();
          if (updated?.status === "in_progress") {
            pass("Admin verification status update visible in DB");
          }
        }
      } else {
        fail("Property verification request", `${verRes.status} ${verBody.error || ""}`);
      }
    }
  } catch (e) {
    fail("Verification request flow", e.message);
  }

  // Delete account test on qa.signup
  try {
    const auth = await signInWithCookieStore(anon, url, signupEmail, QA_PASSWORD);
    if (auth.cookieHeader) {
      const delRes = await authedFetch(`${BASE}/api/account/delete`, auth.cookieHeader, {
        method: "POST",
        body: JSON.stringify({ confirm: "DELETE", password: QA_PASSWORD }),
      });
      const delBody = await delRes.json().catch(() => ({}));
      if (delRes.ok) {
        pass("Delete account (qa.signup)");
        const { data: profile } = await admin
          .from("profiles")
          .select("deleted_at, account_status")
          .eq("id", auth.user.id)
          .maybeSingle();
        if (profile?.deleted_at || profile?.account_status === "deleted") {
          pass("Deleted account soft-deleted in profile");
        }
        const protRes = await authedFetch(`${BASE}/api/agent/listings/create`, auth.cookieHeader, {
          method: "POST",
          body: JSON.stringify({ payload: { title: "x", city: "Enugu", price: 1, media_urls: mediaUrls } }),
        });
        if (protRes.status === 401 || protRes.status === 403) {
          pass("Deleted account blocked from protected listing API");
        } else {
          fail("Deleted account protected routes", `HTTP ${protRes.status}`);
        }
      } else {
        fail("Delete account", `${delRes.status} ${delBody.error || ""}`);
      }
    }
  } catch (e) {
    fail("Delete account flow", e.message);
  }

  // Logout timing — API-only proxy: signOut should be fast
  try {
    const t0 = Date.now();
    await anonClient.auth.signOut();
    const ms = Date.now() - t0;
    if (ms < 2000) pass(`Logout/signOut completes quickly (${ms}ms)`);
    else fail("Logout timing", `${ms}ms`);
  } catch (e) {
    fail("Logout", e.message);
  }

  console.log("\n========== QA SUMMARY ==========");
  console.log(`PASSED: ${passed.length}`);
  console.log(`FAILED: ${failed.length}`);
  if (failed.length) {
    for (const f of failed) console.log(`  - ${f.msg}${f.detail ? `: ${f.detail}` : ""}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
