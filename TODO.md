# TODO — Paleo Microhabitat

Refs: `D§n` = section of DESIGN.md. Mark `[x]` when done. Each task keeps the game runnable (`src/index.html` via file:///) and passes all tests.

## Group A — Foundation
- [x] A1. Delete unused `src/config/figures.js`; create `config/balance.js` (all tunables, D§16), `config/adaptations.js` (D§12), `config/strings.js`. Files: config/*, index.html
- [x] A2. `config/world.js`: hand-authored layout of 4 zones, 3 landmarks, shelters, obstacles, wet ground, food spots, sizes per D§18–19. 
- [x] A3. `systems/worldSystem.js` (slice `world`): seeded jitter, builds static layout into state; helper queries (inShelter, inWet, obstacle push-out). Tests.
- [x] A4. `systems/sessionSystem.js` (slice `session`): phase menu/running/ended, timer, START_RUN, SELECT_ADAPTATION, RESTART, RUN_WON, seed handling. Tests: timer win, restart new seed.
- [x] A5. `main.js`: fixed-step loop, pending-flag → dispatch drain, system orchestration, seed via Date.now().

## Group B — Rendering foundation (first visual check)
- [x] B1. `render/camera.js`: smooth follow, world↔screen, Y-compression, parallax layers.
- [x] B2. `render/` terrain + static prerender: ground, wet ground, puddle, bark, rocks; zone tonal variation.
- [x] B3. `render/` plants: lycopod/fern/horsetail stems, leaf canopies (shelters), depth sort, foreground occlusion fade.
- [x] B4. Placeholder creature drawers (player, NPC, predator, food) with procedural leg animation, shared style. Signature `(ctx, entity, t)`.
- [x] B5. **Scale checkpoint:** open in browser, screenshot, verify tiny-player feel before continuing.

## Group C — Player and needs
- [x] C1. `ui/inputHandler.js` + `SET_INPUT` (dispatch only on change, WASD/arrows, R).
- [x] C2. `systems/playerSystem.js` (slice `player`): movement, obstacle collision, sheltered flag, heading. Tests: adaptation speed effects.
- [x] C3. Energy and hydration drain, humidity factor, death causes (STARVED, DRIED OUT). Tests: items 1,3,4,5,6,8,15,16.
- [x] C4. `systems/foodSystem.js` (slice `food`): items, eat by contact, regrow, `EAT_FOOD`. Wet-ground hydration restore. Tests: food restores energy.

## Group D — Ecosystem
- [x] D1. `systems/npcSystem.js` (slice `npcs`): WANDER/SEEK_FOOD/EAT/FLEE/SEEK_SHELTER, steering, pauses, `NPC_DIED`, migration. Tests: NPC dies, NPCs move with player idle.
- [x] D2. `systems/predatorSystem.js` (slice `predator`): state machine, waypoints weighted to food, general targeting function D§7.1, scan, stickiness, lose-target, catch flags. 
- [x] D3. Predator tests: considers NPC, considers player, not always player, shelter and camouflage change range, player-death-from-predator (items 7,9–12,14).
- [x] D4. Cues: readable predator poses per state, NPC flee reaction, shadow, foliage shake, vignette pulse.
- [x] D5. **First ugly playable checkpoint** (brief §66): full loop works. Run headless simulation with player idle over several seeds to confirm predator picks NPCs in some runs and player in others; record stats.

## Group E — UI
- [x] E1. `ui/hud.js` (minimal bars, timer, trait, hidden/exposed, first-6-seconds hint).
- [x] E2. `ui/startScreen.js` (trait cards, humidity, START, preselected trait, live world behind).
- [x] E3. `ui/resultScreen.js` (D§25 fields, TRY AGAIN, CHANGE ADAPTATION, instant restart).

## Group F — Tests, tuning, polish
- [x] F1. Full-run determinism/replay test (item 18). Update `tests/index.html` for all files. Run in Node and browser.
- [x] F2. First balance pass to hit: predator encounter ~15–25 s, 75 s runs, each trait viable.
- [x] F3. Visual coherence pass (brief §59/§70): landmarks, shelter darkness, atmosphere, HUD subordinate. Optional procedural ambience.
- [x] F4. Browser validation checklist (brief §57), console clean, frame-rate check.
- [x] F5. README project section, `.gitignore`, git commits by category.

## Later (not started until approved)
- Deployment to static hosting (brief §73–76).
