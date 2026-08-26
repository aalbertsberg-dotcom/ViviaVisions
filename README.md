# ViviaVisions v1.7

**Every detail. Every option. Every vision.**

## v1.7 rebrand

- Rebranded the public platform, venue attribution, sign-in, admin POC, setup sheets, notifications, metadata and footer from Venue Visions to **ViviaVisions**.
- Updated the main wordmark to **ViviaVisions** while preserving the established VV mark.
- Added the new brand line to the homepage: **Every detail. Every option. Every vision.**
- Venue sites now use **Powered by ViviaVisions**.

Chandelier Oaks is now presented as the first configured venue implementation rather than a generic demo. Public venue facts, package structure, booking rules, couple portals and an initial Pinrose Prop Shop catalog are integrated into the venue-branded experience. Temporary access codes and local browser data remain only as current-build plumbing until production authentication/storage are added.

# ViviaVisions v1.6.1

ViviaVisions is now presented as a broader **event venue management & planning SaaS**, not wedding-only software.

## Public ViviaVisions
- Home
- Venues
- For Venues
- Sign In
- Public language uses events, clients and venue resources while each venue can use its own terminology.

## Configured venues

### Chandelier Oaks
- Wedding venue · Kiln, Mississippi
- Owner preview code: `123456`
- Sarah & John — `111111`
- Ashley & Mark — `222222`
- Jennifer & Matt — `333333`
- Public Chandelier Oaks details remain integrated; unconfirmed operational values remain illustrative.

### Juniper & Stone Estate
- Fictional wedding venue · Asheville, North Carolina
- Owner preview code: `246810`
- Olivia & James — `444444`
- Maya & Theo — `555555`
- Navy/copper branding, separate packages, spaces and Design Library.

### The Foundry at Rivergate
- Fictional multi-purpose event venue · Louisville, Kentucky
- Owner preview code: `975310`
- Northstar Health Leadership Summit — `666666`
- River City Foundation Gala — `777777`
- Charcoal/teal branding with corporate-event packages, spaces, AV/staging inventory and client terminology.

## Platform behavior
- Homepage Venue Portals panel now contains three venue choices plus **See ViviaVisions for your property**.
- Venue data remains isolated by venue.
- Wedding venues can use **wedding/couple** terminology.
- Multi-purpose venues can use **event/client** terminology.
- Client access stays under the venue URL.
- 2D layout remains the planning source of truth; AI Preview follows the structured 2D plan.
- Internal ViviaVisions Admin remains a proof of concept at `#/platform` with code `654321`.

## Browser-preview limitations
Authentication gates, uploads, messages and saved state are browser-local preview behavior. Production still needs secure backend authentication, tenant authorization, cloud storage, database persistence, notifications, AI calls and billing.

## Run locally
```powershell
cd C:\Users\aalbe\Documents\Dev\VenueVisions
npm install
npm run dev
```

## Publish update
```powershell
npm run build
git add .
git commit -m "Broaden ViviaVisions for event venues and add third venue"
git push
```


## v1.6.3
- Chandelier Oaks public venue experience is now venue-first with smaller tenant branding and subtle ViviaVisions attribution.
- Chandelier Oaks wedding package pricing matches the current public package page: $2,500 / $4,800 / $7,200 / $10,000 / $12,000.


## v1.6.4
- Removed duplicate Chandelier Oaks branding from the venue hero.
- Removed the duplicate Powered by ViviaVisions hero pill and configured-portal status copy.
- Chandelier Oaks hero now starts with “Plan your event at Chandelier Oaks.”
- “Powered by ViviaVisions” in venue headers links back to the ViviaVisions home page.
