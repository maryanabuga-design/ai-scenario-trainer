# Release plan (not executed)

Everything below is a plan. Nothing in it has been done.

## What goes live
- Live now: production build `205c4b5` (`main`).
- To publish: the branch `ui-desktop` (it contains the Next.js patch and the whole responsive instructor). `ui-v2` holds the same patch as a separate commit; `ui-desktop` is not based on that commit, so one of the two patch commits is dropped or merged away in the sequence below.

## Order
1. Freeze: no new work on `ui-desktop`; `git status` clean; `npm run lint`, `npm run typecheck`, `npx vitest run`, `npm run build` all pass; `npm run test:visual` shows zero differences; `npm run test:responsive` passes; the full end-to-end suite passes.
2. Update `ui-v2`: fast-forward or merge `ui-desktop` into `ui-v2` (see the dry run in the report for which one is clean). Push `ui-v2`.
3. Open the Vercel preview of that push (previews are protected by a Vercel login: use the owner's account). Check it: `/build.json` shows the new commit; sign in as the demo student and the demo instructor; one pass at 390 px and one at 1440 px.
4. Merge `ui-v2` into `main` with a fast-forward and push `main`. Vercel's Git integration deploys `main` to production (public, no login).
5. After the deploy: `https://ai-scenario-trainer.vercel.app/build.json` shows the new commit; smoke checks at 360, 430, 1280 and 1440 px with the demo student and instructor (Welcome, sign-in with `482913`, `/join/QT-A7K2`, Home, Materials, a practice quiz with the answer sheet, results, Ask AI, every instructor screen); no console errors, no 404 for images or fonts, no sideways scroll.

## Rollback
- Fastest: in the Vercel dashboard, open Deployments, pick the previous production deployment (`205c4b5`) and choose Promote to Production (or Instant Rollback). No code change is needed and it takes seconds.
- Source rollback: `git revert -m 1 <merge commit>` on `main` (or revert the range) and push; or reset `main` to `205c4b5` only if nobody else has pulled it.
- After a rollback check `/build.json` shows `205c4b5` again.

## Notes
- Production is public; previews are not. Nothing secret exists in the app (no environment variables, no keys).
- The first `next` run after a security notice can exit with an upgrade nudge; the build is retried once. This is a message, not a failure.
