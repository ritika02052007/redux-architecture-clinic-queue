# PROMPTS.md

**Project:** Redux Architecture | Clinic Queue (QueueFlow)
**Client:** Clinic Queue System
**Stack:** React 18, Vite, Redux Toolkit, Vitest, Testing Library, ESLint
**Approach:** AI-assisted, spec-driven development. I acted as Product Manager and directed the AI assistant with structured, phased prompts.

---

## Prompt Strategy

1. **Specification first.** The ticket and TRD were converted into explicit acceptance criteria before any code was requested.
2. **One complete master prompt.** Role, stack, folder structure, features, unhappy paths, NFRs, design tokens, phases and rules were given in a single prompt to keep output consistent.
3. **Test-driven phases.** The prompt requires tests to be written before implementation, then design, then lint/build, then documentation.
4. **Constraints as guardrails.** Hard rules (no rogue hex colors, sanitize before state, no hardcoded secrets) were written into the prompt so the AI could not drift from the brief.
5. **Verification through iteration.** Each result was reviewed against the Definition of Done, and issues were fed back as precise, evidence-based prompts.

---

## Prompt 1: Requirements Analysis

**Prompt:**
> Analyzed the Slack message and Technical Requirements Document (user stories, unhappy path, NFRs, Redux Toolkit constraint, design handoff, Definition of Done) and asked the AI to break down the full scope and an execution plan.

**Purpose:** Convert a generic ticket into a concrete product and an ordered plan.

**Outcome:**
- Defined the product as a digital patient queue for clinic floor staff.
- Mapped every happy-path, unhappy-path and NFR item to a concrete implementation location.
- Established the build order: setup, tests, implementation, styling, lint and build, documentation, deployment.

---

## Prompt 2: Master Build Prompt

**Prompt:**

```
ROLE
You are a senior front-end engineer doing strict Test-Driven Development. I am the Product Manager. Build the project below end to end, in the exact order of the PHASES section. Do not skip ahead.

PROJECT
Client: "Clinic Queue System". Their floor staff currently run patient queues on paper and Excel, which causes data loss and slowdowns. Build "QueueFlow", a digital patient queue dashboard that staff can open and use instantly. The product's visible name in the UI is "Redux Architecture | Clinic Queue" and the console analytics message must use "Redux Architecture".

TECH STACK (fixed)
- React + Vite, JavaScript (no TypeScript)
- Redux Toolkit (configureStore, createSlice, createAsyncThunk, createSelector) with react-redux (useSelector, useDispatch). ALL app state goes through the Redux store.
- Vitest + @testing-library/react + @testing-library/user-event + jsdom
- ESLint (zero warnings, no unused imports)
- Plain CSS with CSS variables (no UI libraries, no Tailwind, no component kits)
- No real API keys, no real patient data anywhere

FOLDER STRUCTURE
src/
  app/store.js
  features/queue/queueSlice.js, queueSelectors.js, queueApi.js (fake async API with setTimeout latency and random failure option)
  features/ui/uiSlice.js (toasts, filters, search text)
  components/ (Header, PatientForm, QueueList, QueueCard, SearchFilterBar, StatsBar, EmptyState, Spinner, SkeletonCard, Toast)
  utils/sanitize.js, validate.js, analytics.js
  styles/tokens.css, base.css, components.css
  tests/ (all test files)
PROMPTS.md (repo root)
README.md

CORE FEATURES (happy path)
1. Add a patient to the queue: full name, reason for visit, priority (Routine / Urgent / Emergency).
2. Live queue list. Emergency sorts first, then Urgent, then Routine, then by arrival time. Each card shows queue number, name, reason, priority pill, wait time, status.
3. Actions per patient: "Call next" (a global button that moves the first waiting patient to "In consultation"), "Complete" and "Remove".
4. Search by name or reason, plus filter by priority and status.
5. Stats bar: total waiting, in consultation, completed today, average wait time.
6. Data is structured consistently: every patient object has { id, queueNumber, name, reason, priority, status, createdAt }.
7. Persist state to localStorage inside a try/catch (store middleware or a subscribe), and rehydrate safely if the stored data is missing or corrupted.

UNHAPPY PATH (mandatory)
- Empty states: if the queue, a search result, or a filter result is empty, show a friendly EmptyState with the text "No data found" and a helpful hint. Never a blank screen.
- Bad connectivity: all add/call/complete/remove operations go through createAsyncThunk calling the fake API (800-1500ms latency, configurable ~15% failure rate). Show a Spinner or SkeletonCards during loading. On failure, show an error toast with a "Retry" button, and keep the existing data intact. The app must never crash. Add an ErrorBoundary around the app.
- Invalid inputs: if name or reason is empty, too short (<2 chars), too long, or contains only symbols, block submission, add a red border and an inline error message under each offending field, set aria-invalid="true" and aria-describedby, and move focus to the first invalid field.
- Detect offline state with navigator.onLine and show an "Offline" banner. Queue the action and show a clear message.

NON-FUNCTIONAL REQUIREMENTS
- Accessibility: target 100% Lighthouse Accessibility. Semantic landmarks (header, main, nav), every input has a visible <label>, every icon-only button has aria-label, all interactive elements are keyboard navigable with a visible focus ring, aria-live="polite" region for toasts and list updates, color contrast AA or better, skip-to-content link, honor prefers-reduced-motion by disabling all animations.
- Telemetry simulation: analytics.js exports track(action). On every completed primary action (add, call next, complete, remove) it does console.log("[Analytics] User interacted with Redux Architecture: <action>").
- Security: sanitize.js strips or escapes HTML tags, script content, event-handler attributes, and javascript: URLs, and trims whitespace. Sanitize ALL text inputs BEFORE they are stored in Redux state (use a reducer "prepare" callback or sanitize before dispatch). Never use dangerouslySetInnerHTML.

DESIGN SYSTEM AND DYNAMIC STYLE
Strict clean monochromatic corporate look. Define the ONLY colors once in tokens.css as CSS variables, and reference only variables everywhere else (no hex colors outside tokens.css):
--ink-950:#0A0A0A; --ink-900:#171717; --ink-800:#262626; --ink-700:#404040; --ink-500:#737373; --ink-400:#A3A3A3; --ink-300:#D4D4D4; --ink-200:#E5E5E5; --ink-100:#F5F5F5; --white:#FFFFFF;
plus one single semantic token --danger:#B91C1C used ONLY for invalid-input red outlines and error text.
Spacing scale only in 8px/16px/32px steps (use variables --space-1:8px, --space-2:16px, --space-4:32px). Radius 12px for cards, 999px for pills. Font: system UI stack, with a clear type scale.
Make the interface feel alive and polished while staying monochrome:
- Hero header with a subtle animated gradient built from the grayscale tokens and a live clock with the date.
- Cards animate in with a staggered fade-and-slide-up; removing a card animates out (fade + collapse); reordering uses smooth layout transitions (use the FLIP technique or CSS transitions).
- Cards lift on hover (translateY + soft shadow), buttons have a press/scale effect and a smooth ripple or fill transition.
- Priority pills are distinguished by shape, weight and fill intensity using only grayscale (Emergency = solid dark with a pulsing ring, Urgent = outlined bold, Routine = light fill), never by hue.
- Animated number counters in the stats bar, and a progress ring or bar showing the share of completed patients.
- Shimmer skeleton loaders while loading, slide-in toasts with auto-dismiss and a progress line.
- Smooth focus-ring animation, animated form field label and error shake (reduced when prefers-reduced-motion).
- Fully responsive (mobile first, 360px to 1440px), grid layout: form and stats on the left or top, queue on the right or bottom.
- All animations use CSS transitions or keyframes only (no animation library), 150-300ms, with easing, and are wrapped in a prefers-reduced-motion check.

PHASES (follow strictly, and stop after each to report)
PHASE 1: Scaffold the project, install dependencies, configure Vitest and ESLint. Create the folder structure with empty files only.
PHASE 2: Write the COMPLETE test suite first. No implementation. Tests must cover: queueSlice reducers (add, call next, complete, remove, priority sorting), sanitize (script tags, onerror attributes, javascript: URLs), validate (empty, short, symbols-only, valid), empty state rendering ("No data found") for empty queue, empty search and empty filter, loading indicator during pending thunks, error toast and retry on rejected thunk, invalid form blocking with aria-invalid and error messages, analytics console.log on each primary action, localStorage corruption fallback, and accessibility checks (labels, aria-labels, keyboard operation of buttons). Run the tests and show that they FAIL.
PHASE 3: Implement the code until all tests pass. Show the passing results.
PHASE 4: Apply the full design system and dynamic styles above. Re-run tests to confirm nothing broke.
PHASE 5: Run ESLint (must be zero warnings, no unused imports), fix everything, run a production build, and give me a manual verification checklist for: empty state, Slow 3G throttling, failed request and retry, invalid form, keyboard-only navigation, and Lighthouse accessibility.
PHASE 6: Write README.md (setup, scripts, architecture explanation of the store and slices, deployment steps for Vercel or Netlify) and PROMPTS.md.

RULES
- Never write implementation code before the tests exist and fail.
- If any error occurs, do not patch blindly. Explain the cause, revert that approach and try a different method.
- Do not add features, libraries or colors outside this spec.
- Keep components small and readable, with comments only where logic is non-obvious.
- Do not hardcode secrets or personal data.

DEFINITION OF DONE
Compiles and runs without fatal errors; ESLint has zero warnings; all tests pass; every happy and unhappy path works; Lighthouse Accessibility is 100; PROMPTS.md is in the root; no API keys or PII in the source; the project is ready to push to GitHub and deploy.

Start with PHASE 1 now.
```

**Purpose:** Give the AI complete context so that architecture, behavior, security, accessibility and styling follow the brief exactly.

**Outcome:**
- Central Redux store with `queue` and `ui` feature slices, using `useSelector` and `useDispatch`.
- Async thunks (add, call next, complete, remove) backed by a simulated API with latency and random failures.
- Priority-based queue with search, filters and live statistics.
- Sanitizing, validation and analytics utilities.
- Components for header, patient form, stats, filters, queue cards, empty state, spinner and error toast with retry.
- Monochrome design system defined entirely through CSS variables.
- Vitest test suite and README.

---

## Prompt 3: UI and Interaction Review

**Prompt:**
> Requested a live preview of the interface to review layout, states and interactions before finalizing.

**Purpose:** Validate the visual design and user flows against the acceptance criteria early.

**Outcome:** Reviewed the empty state, loading state, simulated failure with Retry, form validation, priority ordering, search and filters in the browser.

---

## Prompt 4: Design Constraint Validation

**Prompt:**
> Checked the design handoff requirement ("clean, monochromatic corporate design system, no rogue hex colors, consistent 16px/32px padding") against the implementation.

**Purpose:** Make sure styling stays inside the brief while still feeling polished.

**Outcome:**
- All colors come from tokens in `tokens.css`, with a single `--danger` token reserved for invalid-input red.
- Spacing uses 8/16/32px steps.
- Motion is limited to CSS transitions and keyframes, with `prefers-reduced-motion` support.

---

## Prompt 5: Dependency Resolution

**Prompt:**
> Provided the exact console output for a React hook error caused by multiple React copies resolving in the project, and asked for a fix.

**Purpose:** Ensure a single React instance across `react`, `react-dom` and `react-redux`.

**Outcome:**
- Added `resolve.dedupe` for `react`, `react-dom` and `react-redux` in `vite.config.js`.
- Verified dependency versions with `npm ls react react-dom react-redux`.
- Installed and ran the project from its own folder so Vite resolves packages from the project's `node_modules`.

---

## Prompt 6: Documentation and Delivery

**Prompt:**
> Requested the repository name and description, a professional README intro, and this prompt log.

**Purpose:** Prepare the repository for review and deployment.

**Outcome:** Repository name `clinic-queue-redux`, description, topics, README introduction and this `PROMPTS.md`.

---

## Requirement Coverage

| Requirement | Implementation |
|---|---|
| Redux Toolkit store and feature slices | `src/app/store.js`, `features/queue/queueSlice.js`, `features/ui/uiSlice.js` |
| `useSelector` / `useDispatch` | `src/components/Components.jsx` |
| Empty state ("No data found") | `EmptyState` for empty queue, search and filters |
| Loading indicator on async work | `Spinner`, driven by `queue.status` |
| Error handling with retry | Rejected thunks, error toast, `retryFailed` |
| Invalid input handling | `validate.js` and `PatientForm` (red outline, inline message, `aria-invalid`, focus on first error) |
| XSS protection | `sanitize.js`, applied before data enters state |
| Telemetry simulation | `analytics.js`, logged after each primary action |
| Accessibility | Labels, ARIA attributes, skip link, live region, focus ring, reduced motion |
| Design system | `styles/tokens.css`, `styles/components.css` |
| Persistence with safe fallback | `load()` and `persist()` in `store.js` |
| Offline handling | Offline banner and failed-request messaging |

---

## Key Takeaways

- A single, detailed, phased prompt produced more consistent and reviewable output than many short prompts.
- Encoding constraints (design tokens, security rules, definition of done) in the prompt kept the result aligned with the brief.
- Feeding back exact evidence (console output) gave fast, precise fixes.