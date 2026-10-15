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
