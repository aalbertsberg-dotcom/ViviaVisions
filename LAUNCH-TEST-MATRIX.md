# ViviaVisions launch test matrix

Use this after migration 009 is applied.

## Platform admin
1. Sign in to VV Admin.
2. Open **Production Check**.
3. Runtime, current-session RLS and all-tenant integrity checks should all pass.

## Venue owner / staff
1. Sign in to the live venue portal.
2. Open `https://viviavisions.com/#/access-check`.
3. Every RLS row should pass.
4. Confirm the account sees only its assigned venue events and clients.

## Primary client
1. Open the real invitation and sign in.
2. Confirm only that wedding opens.
3. Open `https://viviavisions.com/#/access-check`.
4. Every RLS row should pass.
5. Confirm inventory, media, design and messages stay in that event.

## Partner client
Repeat the primary-client test with the secondary email/account.

## Revoked client
1. Revoke the client from Access Details.
2. Attempt to reopen the wedding with that account.
3. Access must be denied.
4. VV Admin → Production Check should still show zero revoked bridge links.

## Demo showcase
1. Open Chandelier Oaks while signed out.
2. Confirm Sarah & John, Ashley & Mark, Jennifer & Matt remain visible as clearly labeled demos.
3. Confirm the real Couple Portal contains no Demo Events selector.
4. Confirm demo codes 111111, 222222 and 333333 still work.

## Desktop/mobile
GitHub Actions runs Playwright against both desktop Chrome and an iPhone-sized viewport:
- during the Quality workflow
- again against `https://viviavisions.com` after a Pages deployment

Production Smoke should be green before calling a release complete.