---
target: "https://deeyu-hcmut.github.io/ (homepage/events/about/news)"
total_score: 21
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "url:https://deeyu-hcmut.github.io/"
timestamp: 2026-10-17T14-06-44Z
slug: deeyu-hcmut-github-io
---
Method: dual-agent (A: a582edf8e9c84130e · B: a6e361367933327c2)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Loading/saving states exist; theme toggle & filters give no transition feedback |
| 2 | Match System / Real World | 3 | Vietnamese domain terms correct; icon choices (Cpu, GraduationCap, Flame) are generic tech iconography, not Đoàn-Hội specific |
| 3 | User Control and Freedom | 2 | Delete confirmations are irreversible with no undo; filter reset buried as tiny text link |
| 4 | Consistency and Standards | 3 | Card/button language consistent (strength); view-mode toggle/filter layout shifts structure between Events and News |
| 5 | Error Prevention | 2 | Banner-URL field takes any string with no validation; max-participants can be set below current registrations with only a soft warning |
| 6 | Recognition Rather Than Recall | 3 | Nav items are text+icon; 5-6 nav items risk crowding |
| 7 | Flexibility and Efficiency of Use | 1 | No keyboard shortcuts, no bulk admin actions, no saved filters |
| 8 | Aesthetic and Minimalist Design | 2 | Hero stacks badge-pulse + glow blobs + gradient text + bottom fade for one message; homepage then drops into a near-empty void |
| 9 | Error Recovery | 2 | Error messages are plain Vietnamese but generic catch-alls ("Không lưu được, thử lại") with no specific cause |
| 10 | Help and Documentation | 0 | No help, onboarding, or tooltips beyond native `title` attrs |

**Total: 21/40 — Acceptable** (53%)

## Design Specificity Verdict

**LLM assessment:** Reads as a Tailwind component-kit over a dark-SaaS template, not an interface authored for a Vietnamese student-union portal. The hero is the "gradient-on-dark-navy + blurred blob glows + centered gradient-text headline + pill badges + dual CTA" pattern seen on countless AI-generated SaaS landing pages, with no reference to student life, the university, or Đoàn-Hội visual language. Palette is generic indigo/blue-600→indigo-600, identical to a thousand dashboard templates. Cards, buttons, and badges all share the same rounded-xl/2xl/3xl + border + shadow-xs recipe everywhere with no distinct identity for this org — no Youth Union red/gold, no civic iconography, no student-specific photography direction (the event-create form even hardcodes a random Unsplash stock photo as the default banner). Competent assembly, not product-specific design.

**Deterministic scan:** `impeccable detect --json src/` → exit 2, 6 findings, 5 confirmed real:
- **gradient-text** (`HeroSection.tsx:52`) — `bg-clip-text` gradient on the H1's "ĐIỆN - ĐIỆN TỬ" span
- **bounce-easing** (`Navbar.tsx:191`) — `animate-bounce` on the notification-count badge
- **side-tab** (`NewsFeed.tsx:580`) — `border-l-4 border-blue-600` accent card, a classic AI-tell
- **overused-font** (`index.css:62`) — 'Open Sans' body font
- **codex-grid-background** (`index.css:115`) — tiled hairline-grid decorative background, labeled in its own comment as a generic "Tech Background Effect"
- 1 false positive: **gray-on-color** at `App.tsx:275` — detector conflated an unrelated `dark:text-slate-100` (page text) with `selection:bg-blue-600` (an unrelated `::selection` pseudo-class), not a real contrast pairing.

No console errors on any of 4 routes; no horizontal-overflow bugs at 1474px or the narrowest achievable width (~563-571px, this Linux box's window-manager floor prevented a true ≤400px phone test).

## Overall Impression

The "AI slop" read is real and has a name: five independently-flagged template tells (gradient text, bounce easing, side-tab accent card, generic body font, decorative tiled grid) sit on top of a generic SaaS hero pattern, with zero visual reference to the Youth Union or the university. But part of what makes the genericness so visible right now is that two of four main pages (About, News) are completely empty in production, and the one seeded event has a placeholder description of literally "a" — so there's no real content yet to give the site a personality. The dead, generic chrome is the only thing currently on screen.

## What's Working

- **Event card's quota progress bar** (gradient fill shifting blue→orange→amber as slots fill) is genuinely product-specific — it speaks directly to "will I get a spot," the real anxiety of event registration.
- **Consistent component vocabulary** — every modal/badge/button shares the same radius/border/shadow language; nothing feels bolted-on, even though the vocabulary itself is generic.
- **Dark/light theme implementation** is clean: respects OS preference, persists choice, no flash-of-wrong-theme.

## Priority Issues

**[P0] Core content pages are empty in production, and the one seeded event has a placeholder description ("a")**
- Why it matters: generic chrome is maximally visible when there's no real content anchoring it — part of the "AI slop" feeling is a content vacuum, not purely a visual-design problem.
- Fix: populate the real BCH roster and at least a few real news posts, replace/remove the "a" demo event, before judging any further visual polish.
- Suggested command: `/impeccable harden`

**[P1] Hero and five confirmed template tells read as generic AI-generated SaaS, with no Đoàn-Hội/university identity**
- Why it matters: it's the first thing every visitor sees; it currently signals "generic dashboard template" in a civic/student context where trust and belonging matter.
- Fix: replace the blur-blob gradient hero, gradient-text heading, bounce-easing badge, side-tab accent card, generic Open Sans pairing, and tiled grid background with a visual language actually tied to this org — its red/gold, the crest, real photography of Khoa Điện-Điện tử student life — rather than abstract color blobs.
- Suggested command: `/impeccable bolder` (identity injection) + `/impeccable distill` (remove the 5 confirmed tells)

**[P1] Homepage has massive dead space between hero and footer when content is sparse**
- Why it matters: a single event card floating alone in a ~1400px-wide dark section, followed by an empty-state block, reads as broken/unfinished and reinforces the template feel.
- Fix: constrain/center sparse sections responsively instead of reserving a full-width grid track for one card, or build a stats/featured section that holds its shape regardless of item count.
- Suggested command: `/impeccable layout`

**[P2] No reassurance copy at the event-registration CTA**
- Why it matters: registration is the highest-stakes action on the site; a nervous first-timer gets no indication a QR ticket is coming.
- Fix: one line of microcopy under "Đăng ký ngay" ("Nhận vé điện tử QR ngay sau khi đăng ký") plus a clearer success confirmation.
- Suggested command: `/impeccable clarify`

**[P2] Admin edit/delete icons are always visible on public event/news cards for any staff role**
- Why it matters: adds clutter and accidental-destructive-click risk for staff who are just browsing, not managing.
- Fix: gate behind a "manage mode" toggle or move into a card overflow menu.
- Suggested command: `/impeccable distill`

## Persona Red Flags

**Jordan (First-Timer):** Lands on a jargon-heavy campaign badge ("Kỷ nguyên Chuyển đổi số Đoàn - Hội 2026") before anything concrete; the only visible event describes itself as "a" — no way to tell if the site is broken or just empty, with zero contextual help anywhere (heuristic 10 scored 0). Likely abandons, assuming the site isn't finished.

**Riley (Stress-Tester):** Found the "a" placeholder description immediately — a real, live edge-case failure. Also: the max-participants field can be set below current registrations with only a soft warning (not a hard block), and the banner-URL field accepts any string with no image-load validation before submit.

**Casey (Mobile-User):** Could not be verified at a true phone width (environment capped resize at ~571-1482px), but from source: the mobile drawer duplicates the theme toggle and stacks a redundant "Tra cứu Hoạt động" button already in the nav list just above it. The bottom nav's 4th slot swaps between "Điểm danh" (staff) and "Tổ chức" (student) depending on role, risking a motor-memory mistap after a role change.

## Minor Observations

- Three independent looping animations (ping dot, pulse flame icon, bounce notification bell) compete on one viewport at once.
- Default event banner hardcodes a random Unsplash stock-photo URL — guarantees generic imagery ships unless every event creator manually replaces it.
- Placeholder contact email `doanhoi.fee@university.edu.vn` in the event-create default looks like unfinished template content that could leak into a real event if never overridden.

## Questions to Consider

- If About and News are empty right now, is "AI slop" actually the visual design, or is it that generic chrome is the only thing visible because there's no real content yet to give the site a personality?
- What would the hero look like using only this org's own colors, the crest, and real photos of Khoa Điện-Điện tử students — with zero gradient blobs allowed?
- Does a public Events page need an admin-style grid/list/calendar view toggle, or is that an internal-tool feature that leaked into the student-facing surface?
