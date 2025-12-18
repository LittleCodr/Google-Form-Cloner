# Google Forms-Style Collector

Custom React + Firebase application for creating branded Hindi-first forms, collecting responses from the public, and reviewing submissions through a lightweight admin dashboard secured by a passcode.

## Stack

- React 19 + TypeScript + Vite
- Firebase v11 (Firestore)
- Modern CSS, mobile-first layout (no UI library)

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure Firebase credentials (see below).
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   ```

## Firebase Configuration

1. Create a Firebase project (or reuse `forms-react-app`).
2. Enable Firestore in *Native* mode.
3. Copy your web app credentials and set them as Vite env variables in `.env.local` (file is ignored by git):
   ```bash
   VITE_FIREBASE_API_KEY=AIza...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   VITE_FIREBASE_MEASUREMENT_ID=...
   ```
   These values automatically populate `src/services/firebase.ts`.
4. Deploy the Firestore rules ([firestore.rules](firestore.rules)) so the app can write/read responses.

### Firestore Rules

```
firebase deploy --only firestore:rules
```

Rules must be deployed for Firestore to accept reads/writes. The current policy opens the database for friction-free testing—replace with stricter rules before production. Re-run the same command whenever [firestore.rules](firestore.rules) changes.

### Seed Demo Data

Use the bundled script to populate sample forms and responses for quick UI verification:

```bash
npm run seed
```

The script reads environment values from `.env.local` (falls back to the default config if variables are missing) and syncs placeholder documents so the `forms/{formId}/responses` subcollections exist. It does **not** insert any responses unless you explicitly pass the optional flag:

```bash
npm run seed -- --with-demo-responses
```

That flag is handy for local UI testing; keep it off in real environments so all responses come from actual submissions. Tweak the payloads inside [scripts/seedFirestore.mjs](scripts/seedFirestore.mjs) before re-running if you want to change copy or add more forms.

## Form Configuration

- All public/admin tiles and questions are defined locally in [src/data/forms.ts](src/data/forms.ts).
- Each form entry follows the structure:

```ts
{
  id: 'form-id',
  title: 'शीर्षक',
  description: 'विवरण',
  order: 1,
  fields: [/* see schema below */]
}
```

### Field Schema (`fields` array)

```json
{
  "id": "question-1",
  "label": "आपका नाम",
  "helperText": "पूरा नाम लिखें",
  "type": "short_text", // short_text | long_text | radio | checkbox
  "required": true,
  "options": [
    { "id": "opt-a", "label": "विकल्प A", "value": "A" }
  ] // only for radio / checkbox
}
```

- `short_text`: single-line input
- `long_text`: multi-line textarea
- `radio`: single choice (requires `options`)
- `checkbox`: multi choice, stores an array

### Firestore Data Model

- Responses are stored in the Firestore subcollection path `forms/{formId}/responses`.
- Each response document contains:
  ```json
  {
    "answers": {
      "field_id": "user input"
    },
    "submittedAt": <server timestamp>
  }
  ```
- Form definitions are **not** read from Firestore; the UI always depends on [src/data/forms.ts](src/data/forms.ts).

### Sample Field Layout

```json
{
  "title": "कक्षा 10 पंजीकरण",
  "description": "शैक्षणिक वर्ष 2025-26",
  "order": 1,
  "fields": [
    { "id": "student_name", "label": "छात्र का नाम", "type": "short_text", "required": true },
    { "id": "guardian_contact", "label": "अभिभावक का मोबाइल", "type": "short_text", "required": true },
    {
      "id": "transport",
      "label": "यातायात सुविधा",
      "type": "radio",
      "options": [
        { "id": "bus", "label": "बस", "value": "bus" },
        { "id": "self", "label": "स्वयं", "value": "self" }
      ]
    }
  ]
}
```

## Admin Access

- Admin routes: `/admin`, `/admin/dashboard`, `/admin/form/:formId`
- Passcode (hardcoded): **140608**
- Passcode stored in `localStorage` after success for convenience

## Adding or Updating Forms

1. Edit [src/data/forms.ts](src/data/forms.ts).
2. Duplicate an existing form object, update the `id`, `title`, metadata, and `fields` array.
3. To control tile order, adjust the numeric `order` value (lower numbers appear first).
4. Use stable `id`/`value` pairs for choice options—these are persisted with responses.

The public homepage and admin dashboard re-render automatically using this local configuration. Only responses travel to Firestore.

## Viewing Responses

- Public users submit forms at `/form/:formId`.
- Responses save to `forms/{formId}/responses` with timestamp.
- Admin unlocks the dashboard using the passcode and sees per-form tables with questions sourced from [src/data/forms.ts](src/data/forms.ts).
- Tables are read-only; any cleanup must happen directly in Firestore.

## Deployment Notes

- `npm run build` outputs to `dist/`; host anywhere (Firebase Hosting, Netlify, etc.).
- Ensure environment variables are present on the hosting platform.
- Protect the admin slug (`/admin`) by sharing the passcode privately.

## Project Structure (Key Files)

- [src/pages](src/pages) – Public forms, admin dashboard, response table
- [src/services](src/services) – Firebase init plus Firestore read/write helpers for responses
- [src/data/forms.ts](src/data/forms.ts) – Central source of truth for form definitions
- [src/contexts/AdminContext.tsx](src/contexts/AdminContext.tsx) – Passcode session handling
- [firestore.rules](firestore.rules) – Recommended Firestore security rules

Feel free to customize styling in `src/App.css` while keeping the layout responsive and touch-friendly.
