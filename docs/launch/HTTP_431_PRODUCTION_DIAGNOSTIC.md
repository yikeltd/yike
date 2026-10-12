# HTTP 431 Production Diagnostic

This checklist is intentionally operational. The repository can prevent known
cookie handling regressions, but it cannot establish a Traefik or Coolify root
cause without runtime evidence.

1. Test the site in a clean browser, then in an incognito browser.
2. Compare logged-out and logged-in requests in browser DevTools.
3. Record the byte size and names of the `Cookie` request header.
4. Record every `Set-Cookie` header after login, refresh, and redirects.
5. Confirm only the current Supabase session cookies are present for `yike.ng`.
6. Check Traefik access/error logs at the timestamp of each 431 response.
7. Inspect Coolify proxy/header-size settings and compare with Traefik defaults.
8. Test the application service directly from the Coolify network, then through
   the public proxy, to isolate proxy versus application behavior.
9. Compare a fresh account with an account that has repeatedly signed in.
10. Capture the findings without recording cookie values, access tokens, or
    personal data in tickets or logs.

Do not mark this incident resolved until the same authenticated browser flow
passes through the public proxy without a 431 response.
