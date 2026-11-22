# Raid, administration and chat notifications

## Publish the app

The browser uses `gacha/game.js`; `gacha/boot.js` loads the saved Firebase config before mounting it. `gacha/raid.js` adds the cooperative Raid entry to the home mode carousel and opens the three-player room/combat screen. The new admin window appears only when the signed-in Firebase token has the `admin` claim.

## Publish Firebase rules

In Firebase Console → Realtime Database → **Rules**, publish the complete repository file `database.rules.json`. The Raid, admin config, and per-account push endpoint paths will otherwise return permission errors. Git push does not publish these rules.

## Enable admin access and push notifications in Cloudflare

The worker source is `worker/src/index.js`; deploy it to the existing `chibi-auth` Worker. Configure these values in Cloudflare Worker settings:

- `GUILD_ID`: the Discord server ID.
- `ADMIN_IDS`: comma-separated Discord user IDs that may edit game data.
- `ALLOWED_ORIGINS`: `https://saucestar.github.io`.
- `FIREBASE_DATABASE_URL`: already set in `worker/wrangler.toml`.
- `VAPID_PUBLIC_KEY`: already set in `worker/wrangler.toml`.
- `VAPID_CONTACT`: a contact email for push services.
- Secrets `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY`: the existing Firebase service account values.
- Secret `VAPID_PRIVATE_JWK`: the matching P-256 private key JSON. Keep it only as a Cloudflare secret; never commit it.

The app sends no message contents to the Worker. It validates the sender and group membership, then sends a generic notification; the encrypted chat text stays end-to-end encrypted.

## Admin editor

After the user ID is in `ADMIN_IDS`, sign out and back in to refresh the Firebase custom claim. The **ADMIN** button edits character base stats, types, passives, psych/badge power and target, and enemy HP/attack/level. Changes are saved at `gameConfig/v1`; stable character IDs remain in saves and team loadouts.
