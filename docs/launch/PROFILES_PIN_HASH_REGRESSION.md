# Profiles PIN hash privilege regression

Run on production project `hlpojfurfldvcxfxhveg` after pin-hash grant migrations.

```sql
SELECT has_column_privilege('anon'::name, 'public.profiles'::regclass, 'pin_hash', 'SELECT') AS anon_pin,
       has_column_privilege('authenticated'::name, 'public.profiles'::regclass, 'pin_hash', 'SELECT') AS auth_pin,
       has_column_privilege('anon'::name, 'public.profiles'::regclass, 'admin_pin_hash', 'SELECT') AS anon_admin,
       has_column_privilege('authenticated'::name, 'public.profiles'::regclass, 'admin_pin_hash', 'SELECT') AS auth_admin,
       has_column_privilege('service_role'::name, 'public.profiles'::regclass, 'pin_hash', 'SELECT') AS service_pin,
       has_column_privilege('anon'::name, 'public.profiles'::regclass, 'full_name', 'SELECT') AS anon_name,
       has_column_privilege('authenticated'::name, 'public.profiles'::regclass, 'has_pin_set', 'SELECT') AS auth_has_pin;
```

**Expected:**

| Column | anon | authenticated | service_role |
|--------|------|---------------|--------------|
| pin_hash SELECT | false | false | true |
| admin_pin_hash SELECT | false | false | true |
| full_name / has_pin_set SELECT | true | true | true |

PIN login must continue via `yike_pin_login_lookup` (SECURITY DEFINER) or service_role admin client — never via anon/authenticated `select pin_hash`.
