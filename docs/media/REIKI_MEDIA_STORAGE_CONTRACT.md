# Reiki Yggdrasil — Media and Storage Contract

Status: v1.
Purpose: define how the debugger agent should reason about images, mandalas, private Storage refs, signed URLs, and export flows.

## Media source types

The agent must distinguish these source types before proposing a fix:

1. `storage://profile-cabinet-media/...`
   - Durable private Storage ref.
   - Safe to persist internally when scoped to the owner/profile flow.
   - Not safe as public visible text or public image URL.

2. Signed URL
   - Temporary display URL for private Storage objects.
   - Safe only in the correct authenticated context.
   - May expire and should not be treated as durable persisted state.

3. External public URL
   - Public image URL outside private Supabase Storage.
   - Can be displayed if expected by the current flow.
   - Should still be validated for safe rendering behavior.

4. `data:image...` preview
   - Temporary local/browser preview.
   - Useful before upload.
   - Must not be saved as durable persisted payload unless explicitly designed and reviewed.

## Known bucket

- `profile-cabinet-media`

Expected behavior:

- The bucket is private.
- Authenticated flows can upload and display through signed URLs.
- Public routes must not expose private refs.
- Saved Power Place/Mandala compositions should prefer durable refs over temporary previews.

## Debug checklist for missing images

Collect:

- route and viewport;
- user state: unauthenticated/authenticated/admin, without exposing identity;
- image role: center/client photo, goal photo, tradition image, object slot, underlay, material thumbnail, export image;
- source type: storage ref, signed URL, external URL, data preview;
- whether it appears immediately after upload;
- whether it appears after reload;
- whether it appears in print/download/export;
- whether browser console or Supabase response shows a safe error;
- relevant file and component/function.

## Public safety rules

Public pages must not render:

- raw `storage://profile-cabinet-media/...` refs;
- real signed URLs as durable saved content;
- private user filenames when they reveal sensitive information;
- private user data in thumbnails, alt text, or debug output.

Public pages may render:

- public-safe approved material cards;
- safe placeholders when a private image is unavailable;
- public/external image URLs when the data contract allows them.

## Profile workspace rules

Authenticated profile workspace may:

- show signed URLs for the current user/session;
- save durable storage refs;
- show temporary previews before upload/save;
- use placeholders when a signed URL cannot be resolved.

Authenticated profile workspace must not:

- silently persist temporary `data:image` previews;
- lose durable refs when switching tabs/formats;
- leak another user’s files;
- claim upload/save was verified unless a live authenticated session was tested.

## Print/download/export rules

For Power Place / Mandala export debugging, classify the export mode:

- browser print;
- HTML download fallback;
- image/PDF export if implemented;
- not implemented / needs verification.

Debug questions:

- Does export use visible state or persisted refs?
- Does it include private images safely?
- Does it degrade to readable metadata/placeholders when images cannot be embedded?
- Does it avoid leaking raw private refs?
- Does report text avoid claiming full PNG/JPEG export if only HTML fallback exists?

## Minimal fix patterns

Safe fixes usually:

- keep durable refs separate from display URLs;
- add resolver guards;
- filter `data:image` from saved payloads;
- show placeholders instead of leaking private refs;
- scope CSS/export layout fixes to the relevant component.

Unsafe fixes:

- making the bucket public without explicit approval;
- saving signed URLs as durable data;
- replacing private refs with base64 data indiscriminately;
- exposing Storage paths in public DOM;
- broadening RLS to bypass an auth bug.

## Completion standard

A media/storage fix is complete only when:

- upload/display/reload behavior is verified or marked `needs verification`;
- public/private boundary is preserved;
- export behavior is accurately reported;
- no secrets, private refs, or user data are leaked;
- route and viewport checks are documented.
