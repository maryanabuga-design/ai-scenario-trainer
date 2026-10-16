# Image prompts for the 3D pictures

Prompts for the pictures that replace the dashed "3D" placeholders (see `DESIGN.md`, Media3D). Every
prompt starts with the shared style prefix, then the subject. The pictures are optional: the app
shows a placeholder until a file with the right name is in `public/heroes/`.

## Shared style prefix

Use this at the start of every prompt:

> Soft matte clay 3D render, rounded friendly shapes, faceless wooden-mannequin figures, warm
> olive-green and sand colours, soft studio light, gentle shadow, no text, no logos, no weapons,
> calm and educational.

## Home

### hero-training

Prefix + "a faceless wooden-mannequin trainee in an olive safety vest standing next to a large
clipboard with a checklist, transparent background, centered, 1:1".

- File: `public/heroes/hero-training.webp`
- Size: 800x800 WebP, at most 60 KB
- Shown in the Home hero card as the 80x80 tile (`Media3D` variant `tile`)

### icon-miniquiz

Prefix + "a small stack of question cards with a stopwatch on top, matte clay look, transparent
background, centered, 1:1".

- File: `public/heroes/icon-miniquiz.webp`
- Size: 384x384 WebP, at most 30 KB
- Shown in the Home Mini-quiz row as the 72x72 icon (`Media3D` variant `row`)

To use a picture, add the file and set its path in `homeImages` in `lib/home.ts`.

## Scenes (one picture per scene, not per step)

A scene is a place or moment that several consecutive steps share; every step of a scene shows the
same picture. A new scene starts about every 5 steps. Each entry gives the scene id (the `scene`
field of the steps), the steps it covers, one sentence about the scene and the text to paste after
the shared style prefix. Pictures are 4:3 WebP files in `public/scenarios/<scene id>.webp`
(at most 80 KB); until a file exists the step shows the dashed "3D" placeholder, and its `image.src`
in the content file stays empty. The first scene of each topic is the priority set.

### S1 Responding to an alarm

All four S1 scenes are the priority set for this topic; `s01-sc1` is the first one to make.

**s01-sc1** (priority) — steps 1 to 5 (`q-scn-s01-001` to `q-scn-s01-005`).
A second-floor training room as an alarm sounds and the participants stand up.
Paste after the prefix: "a wooden-mannequin presenter in an olive vest in a bright second-floor
training room, fourteen faceless wooden mannequins standing up from tables with laptops and bags,
an alarm bell on the wall, calm and orderly, 4:3".

**s01-sc2** — steps 6 to 10 (`q-scn-s01-006` to `q-scn-s01-010`).
A corridor with an open elevator and a stairwell door as participants head towards the exit.
Paste after the prefix: "a long office corridor with an open elevator and a stairwell door at the
end, a group of faceless wooden mannequins walking towards the stairs, one on the phone, one with a
bandaged ankle, 4:3".

**s01-sc3** — steps 11 to 15 (`q-scn-s01-011` to `q-scn-s01-015`).
A stairwell landing with a colleague in a wheelchair and a warden in a green vest nearby.
Paste after the prefix: "a narrow stairwell landing, a faceless wooden mannequin in a wheelchair
waiting calmly, a warden mannequin in a green vest a few steps away, other mannequins passing down
the stairs holding the handrail, 4:3".

**s01-sc4** — steps 16 to 20 (`q-scn-s01-016` to `q-scn-s01-020`).
An empty open-plan office in the evening with one lit desk and a flashing alarm light.
Paste after the prefix: "an empty open-plan office in the evening, one lit desk with a laptop and
a headset, a flashing red alarm light on the ceiling, one wooden mannequin standing up to leave, 4:3".

### Scenes of the other topics

The existing steps of S2, S4, S5 and S6 already carry one scene each (`s02-sc1`, `s04-sc1`,
`s05-sc1`, `s06-sc1`); their prompts are written when each topic is expanded.
