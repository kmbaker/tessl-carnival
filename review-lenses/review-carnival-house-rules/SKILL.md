---
name: review-carnival-house-rules
description: Review a change to a carnival game for the house rules in AGENTS.md that make a game belong on the midway, registering where the midway finds it, reporting scores through the shared scores module, and drawing with the carnival's theme. Use as one lens in a code review run on changes under src/games/.
---

# Review lens: Carnival House Rules

Review changes to the games under `src/games/` for house rules 1 to 3 in the root `AGENTS.md`: what makes a game show up on the midway, keep its scores where the midway can read them, and look like it belongs.

## Scope

- **Registration** Whether a game lives where the midway finds it: its own folder `src/games/<game-id>/`, a `game.ts` there whose default export is its `CarnivalGame`, and an `id` equal to the folder name. `src/games/index.ts` only looks at `./*/game.ts`, so a game anywhere else, or in a file with another name, never gets a booth.
- **Scores** Whether a game reports a finished round through `recordScore(game.id, score)` imported from `src/carnival`, once per round, rather than reading or writing local storage itself or keeping its own high score table that the midway's booth card and the scores module cannot see.
- **Theme** Whether a game takes its colours, fonts and sizes from `theme` and `canvasFont` in `src/carnival/theme.ts`, rather than a hex colour, an `rgb()` or `rgba()` literal, a named CSS colour, or a font string of its own that stops matching the rest of the midway when the theme changes.

## Method

Start from each changed file under `src/games/` and read it against house rules 1 to 3 in the root `AGENTS.md`. Read `src/carnival/index.ts`, `src/carnival/scores.ts` and `src/carnival/theme.ts` for what the shared modules offer before calling something missing.

For a new or moved game, check the folder, the file name and the default export together, then compare the exported `id` with the folder name.

For scores, follow the round from the place it ends to the `recordScore` call: check it runs once per round, with the game's own `id`, and not on every frame or on every hit.

For drawing, read each `fillStyle`, `strokeStyle`, `shadowColor`, `font` and gradient stop the change sets, and each size it hard-codes where `theme` has a value for it.

## Threshold

Report a game that breaks rule 1, 2 or 3 in code the change adds or alters.

Be accurate about the consequence. A game that `src/games/index.ts` cannot see, because it sits outside `src/games/<game-id>/game.ts`, gets no booth and nobody can reach it. A `game.ts` with no default export, or an `id` that differs from its folder name, makes `src/games/index.ts` throw when it loads: the whole midway fails to load and `src/games/index.test.ts` fails, so `npm run check` already catches these and they are not worth a finding on their own. A score kept outside `recordScore` loses nothing for the round being played, but the midway never shows it.

Do not report:

- Code outside `src/games/`. `src/carnival/` defines the theme and the scores, and `src/midway/palette.ts` builds the map's scenery colours on purpose.
- A value derived from the theme, such as an alpha, a lighter shade or a size computed from a `theme` value.
- Literal colours, strings or scores in `game.test.ts`, which are test data.
- Anything lint, the type-checker or the tests already enforce.
- Rules 4 to 7 in `AGENTS.md`, which this lens does not check.

## Reporting

- Name the house rule by number, the file and the line, and what the game does instead.
- State the consequence for the midway or the player as it actually is, from the Threshold above, not a worse one.
- State the fix in the carnival's own terms: the folder or file to move the game to, the `recordScore(game.id, score)` call and where the round ends, or the `theme` key or `canvasFont` size to use. If the theme has no value that fits, say so: adding one is a change to `src/carnival/` and belongs in its own pull request.
