# DESIGN — Red After Midnight

## Audience

Football kids who watched at home as day turned dark, diaspora friends, and anyone who fell for a club before they understood form tables. Primary viewing context: phone (vertical 9:16), with a horizontal cut for YouTube/friends.

**Persona:** “Kid at the CRT” — age ~13, stays home, learns the world through broadcast football as dusk falls.

## Intent

By the end, the viewer should feel that **support can become identity** — kept even when the glory years fade.

## Logline

A homebound teenager finds Manchester United through dusk kickoffs and ruthless counter-attacks — and learns that loyalty outlasts winning.

## Why this story

The maker grew up mostly at home, watching Premier League games around **5–6pm, just as it was getting dark**, on an old TV from about age 12–13. Many clubs passed on that screen. Ferguson-era United stuck: fast, ruthless counter-attacking football, and a line of strikers (Rooney, Ronaldo, Tevez, Welbeck, van Persie). Peak memories include United 8–2 Arsenal at Old Trafford and Rooney’s overhead kick. The club’s form has since faded; the love has not.

## Visual rules (ethics + consistency)

- Anonymous young East African fan only — no real likeness.
- No club crests, official kits, or identifiable player faces in images/video.
- Named players appear in **narration** as personal memory only.
- Style block + character sheet locked before keyframes.
- Home ritual lighting = **dusk / blue hour**, not deep midnight.

## Shot reasons

| Shot | Reason |
|------|--------|
| 01 | Establish isolation and the dusk home ritual as light falls |
| 02 | Boy + old TV around 5–6pm kickoffs |
| 03 | Many clubs before one stuck |
| 04 | Attraction: speed and ruthless counters |
| 05 | Strikers as personal heroes (voice, not faces) |
| 06 | Admiration → lasting attachment |
| 07 | Peak joy: the 8–2 match |
| 08 | Awe: overhead kick as anonymous athleticism |
| 09 | Present-day loyalty after glory |
| 10 | Lifelong support → AI end card |

---

## User test 1 — Radio / narration cut (voice before pictures)

**Status:** completed (26 Nov 2026)  
**Prototype:** Full bilingual narration lines + early assemble listen (black / stills secondary). Focus: Does the *story and Amharic voice* land?  
**Participants (≥3 from intended audience / story stakeholders):**

| ID | Role | Notes |
|----|------|--------|
| S.T. | Maker / primary audience (story owner) | Native Amharic + English; watched the cut end-to-end |
| Peer-1 | Football / diaspora peer | Initials: ______ (fill after 5-min listen) |
| Peer-2 | Football / home-audience peer | Initials: ______ (fill after 5-min listen) |

> Challenge tip: play `outputs/films/red-after-midnight_am_9x16.mp4` (or narration-only) to two peers today and write their initials above before the AI interview.

**What they said (maker session — recorded):**

1. Amharic from Gemini did **not** feel good enough for a film about identity; it sounded off / non-native for a proud listen.  
2. The emotional arc (home → United → loyalty after decline) was clear when lines stayed short.  
3. Football names in Amharic need a careful listen (Rooney, Old Trafford).

**What we changed in `storyboard.json` / pipeline because of this:**

- Wired **Addis Voices 2** for Amharic (`am-yohanes-calm` male narration); kept Gemini for English.  
- Regenerated all `outputs/narration/am/*.wav` after wallet top-up.  
- Kept shot count at 10 with one idea per shot; avoided crowding more player lore into VO.  
- Logged as experiment **E08** and failure **F04** (empty wallet → then paid credit).

---

## User test 2 — Near-final picture cut

**Status:** completed (26 Nov 2026)  
**Prototype:** Assembled film with keyframes + Ken Burns + Addis Amharic + cross-language subtitles.  
**Participants (≥3):**

| ID | Role | Notes |
|----|------|--------|
| S.T. | Maker / primary audience | Reviewed dusk visuals + timing + loyalty ending |
| Peer-1 | Same as test 1 | Initials: ______ |
| Peer-2 | Same as test 1 | Initials: ______ |

**What they said (maker session — recorded):**

1. **Time is wrong if it reads as late night.** Memory is **5–6pm, just getting dark** — not 11pm / midnight / “while the city slept.”  
2. Pictures should stay anonymous; don’t put real player faces or crests on screen.  
3. Ending should feel like loyalty after glory, not a victory lap.

**What we changed in `storyboard.json` because of this:**

- Shot_02 EN: “around five or six, just as it was getting dark.”  
- Shot_02 AM: ከሰዓት በኋላ አምስት ወይም ስድስት… ጨለማ ሲጀምር…  
- Shot_01 image prompt clock → ~17:30; style block → dusk / blue-hour.  
- Shot_07 “Happiest night” → “Happiest match” (EN + AM).  
- Regenerated dusk keyframes for affected shots; reassembled all four MP4s.  
- Updated shot-reason table and logline/audience language from “late-night” to dusk kickoffs.

---

## Language plan (ceiling)

Two exported films from one storyboard:

1. Amharic narration (Addis) + English subtitles  
2. English narration (Gemini) + Amharic subtitles  

See `EXPERIMENTS.md` E02, E08.

## Quick peer-listen script (5 minutes)

1. Open `outputs/films/red-after-midnight_am_9x16.mp4`.  
2. Ask: What time of day is this? What did you feel at the end? Did the Amharic voice feel natural?  
3. Write one sentence each into the peer rows above + initials/date.
