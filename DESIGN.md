# DESIGN — Paleo Microhabitat (working title)

Status: **Phase 1 draft, awaiting approval.** No gameplay code exists yet.
Checked against `DESIGN_RULES.md` and `ARCHITECTURE.md` — see §28 for the checklist and the two places where the brief was adapted.

---

## 1. Premise

A scientifically *inspired* (not authoritative) simulation of a humid Carboniferous-like microhabitat. The player is a tiny arthropod-like creature. A single huge predator and several small creatures live in the same space and keep living whether or not the player does anything. Runs last ~75 seconds.

Wording rule for all in-game text: "inspired by", "simplified model". Never claim reconstruction accuracy.

## 2. Player fantasy

Small. Vulnerable. Observant. Not important to the world. The world was already running when the player arrived.

Test sentence: *"Something happened that surprised me, it happened because of rules, and I understood why."*

## 3. Core loop

```
OBSERVE → LEAVE SHELTER → FIND FOOD → BECOME EXPOSED → READ CREATURE BEHAVIOR
   → CONTINUE or RETREAT → EAT → RELOCATE or RETURN TO SAFETY → SURVIVE
```

Recurring decision: **safety vs opportunity.** Shelter reduces risk but does not feed or hydrate the player; food and moisture are outside it.

Goal hierarchy (DESIGN_RULES §4):
- Short-term: reach the next food / moist spot without being noticed.
- Mid-term: keep energy and moisture above zero.
- Long-term: survive until the ecosystem timer ends (75 s).

## 4. Session flow

```
START SCREEN ──START──▶ RUN (75 s) ──▶ RESULT SCREEN
   ▲  pick 1 of 3 adaptations            │ win: SURVIVED
   │  humidity shown                     │ loss: CAUGHT / STARVED / DRIED OUT
   └──── CHANGE ADAPTATION ◀─────────────┤
   └──── TRY AGAIN (same adaptation, new seed, instant restart) ◀─┘
```

State machine (`state.session.phase`): `menu → running → ended`. `R` or the TRY AGAIN button restarts in one step (no menus, no animation). Target restart time under 2 seconds.

## 5. Player

Small arthropod-like creature: segmented oval body, 6 short legs that scuttle, two antennae. Stats in state: `x, y, vx, vy, heading, energy (0–100), hydration (0–100), alive, sheltered, adaptation, foodEaten, timeSheltered, causeOfDeath`.

Controls: WASD or arrows, 8-way, instant response. No other buttons. `R` restarts. Mouse only for menu buttons.

## 6. Small autonomous creatures (NPCs)

6 at start. Each is a small, round-bodied, short-antennae grazer (distinct silhouette from the player: rounder, slower legs, no long antennae, lighter shell).

States: `WANDER, SEEK_FOOD, EAT, FLEE, SEEK_SHELTER, DEAD`. Priority each tick: danger → FLEE; hungry (energy < threshold) → SEEK_FOOD; otherwise WANDER with random pauses.

- **Danger** = predator within `NPC_DANGER_RADIUS` and predator in CHASE/TARGET/ATTACK or simply within ~half that radius. Flee direction = away from predator, biased toward nearest shelter (SEEK_SHELTER when a shelter is within reach).
- NPCs eat food, lose and regain energy like the player (simplified), and are ordinary predator prey.
- **Migration:** every ~`NPC_MIGRATION_INTERVAL` seconds, if the live population is below `NPC_COUNT`, one new NPC walks in from a world edge (seeded position). The ecosystem is not a fixed set of props, and the predator cannot permanently empty the map.
- NPCs never orbit or follow the player. They do not know the player exists, except that the player counts as a *moving thing* like any other (no reaction to the player at all in v1).

Steering only, no pathfinding. Obstacles (rocks, big stems) are circles; simple push-out plus sliding.

## 7. The predator

One creature ~10× the player's length: heavy armoured, many-legged, long body, large pincer-like mandibles. Slow, weighty search gait; visibly different chase gait.

States: `SEARCH → TARGET → CHASE → ATTACK → EAT → SATIATED → SEARCH`.

| State | Behaviour | Readable cue (no UI needed) |
|---|---|---|
| SEARCH | Walks between seeded waypoints at `PREDATOR_SPEED`. Scans every 0.25 s. | Slow, heavy leg cycle, head sways |
| TARGET | 0.6 s pause: turns body to the chosen prey. | Body rotates and freezes, antennae point at prey |
| CHASE | Pursues at `PREDATOR_CHASE_SPEED`. Re-evaluates: gives up if target lost > `PREDATOR_LOSE_TARGET_TIME`, hides in shelter beyond range, or chase exceeds `PREDATOR_MAX_CHASE_TIME`. | Fast leg cycle, low body, dust |
| ATTACK | Within `PREDATOR_ATTACK_RANGE`: fast lunge, prey is caught. | Short strike animation |
| EAT | Stationary `PREDATOR_FEED_DURATION`. | Head-down feeding motion |
| SATIATED | Slow patrol for `PREDATOR_COOLDOWN`, does not scan for prey. | Slower gait, no head sway |

Predator waypoints are seeded random points, **weighted toward food patches** (a general "animals gather where food is" rule, *not* toward the player). This makes encounters common without scripting them.

### 7.1 Target selection (the systemic core)

There is one function, used identically for every candidate:

```
candidates = all prey entities that are alive        // NPCs AND the player, one list
for each candidate c:
    effectiveRange = PREDATOR_DETECTION_RANGE
                     × (c.sheltered ? SHELTER_DETECTION_MULTIPLIER : 1)
                     × c.detectionMultiplier            // 1 for NPCs, camouflage <1 for player
    if distance(predator, c) > effectiveRange:  skip     // not noticed
    score = distance(predator, c) / effectiveRange       // lower = more noticeable
choose the candidate with the lowest score (ties broken by seeded PRNG)
```

Rules that keep it honest:
- The predator has **no `isPlayer` check** in targeting. The player is simply an entry in the prey list with a `detectionMultiplier`. A unit test asserts that with an NPC nearer than the player the NPC is chosen, and with the player nearer the player is chosen.
- Being *sheltered* shrinks the range for everybody (NPCs too), so NPCs that run into a leaf are also safer.
- Movement is not a factor in v1 (keeps the rule one sentence long).
- Target stickiness: once chosen, the predator keeps the target until caught, lost, or `PREDATOR_MAX_CHASE_TIME`. It does not swap to a different prey mid-chase in v1.
- The predator starts at the far side of the world from the player and spends its first `PREDATOR_INITIAL_DELAY` seconds in SEARCH (so the first 10 s are safe by geometry, not by a script).

Why NPCs can be chosen instead of the player: they are in the same list, they are often nearer, and they gather at food, where the predator is drawn.

## 8. Food

~`FOOD_COUNT` = 10 food items: soft spore clusters / fungal beads with a soft warm glow (readable, not neon loot). Two tiers: **low-value near cover** (`FOOD_ENERGY_SMALL`), **high-value in the open** (`FOOD_ENERGY_LARGE`). Food is consumed on contact by the player or an NPC. Consumed food regrows after `FOOD_REGROW_TIME` in the same place, so the map keeps functioning. Food is never placed in the starting shelter.

## 9. Shelter

3–4 shelters, each a large leaf canopy / bark arch / root cavity drawn as a dark, dense area with a shadow. A creature is `sheltered` while inside the shelter's circle. Effect: predator detection range × `SHELTER_DETECTION_MULTIPLIER` (~0.3), and creatures in shelter are drawn under the canopy. Shelter **does not restore anything**, and there is no food inside the player's main shelter. Downside is time: energy and moisture keep draining while hiding.

Also: predator physically can reach a shelter's edge, so a shelter is a lower-risk place, not an invulnerable one.

## 10. Energy

`energy` 0–100. Drain per second: `PLAYER_ENERGY_DRAIN` (base) + `PLAYER_MOVE_ENERGY_MULTIPLIER × speedFraction`. Food restores `FOOD_ENERGY_*` (clamped to 100). At 0 → death, cause **STARVED**. Formula is linear and unit-tested.

## 11. Hydration and humidity

`hydration` 0–100. Loss per second = `PLAYER_HYDRATION_DRAIN × humidityFactor`, where `humidityFactor = 1 + (HUMIDITY_REFERENCE − humidity) / 100 × HUMIDITY_SENSITIVITY`. Higher humidity → slower loss. At 0 → death, cause **DRIED OUT**.

Hydration is restored by standing in **wet ground** (shallow puddle edges and damp mud, marked with a darker glossy tint and ripple). Wet ground is in the open, so hydration is a second reason to leave shelter (in addition to food) and it is the puddle-landmark's gameplay role.

Humidity is a single number shown before the run (default 78 %). Not randomised in v1, so "change one variable" means the adaptation. Config only.

## 12. Adaptations (pick exactly one before a run)

Presented as biological traits with a plain sentence and a small body-part icon, no numbers, no rarity.

| Trait | Text on start screen | Effect (config) |
|---|---|---|
| LONG LEGS | Move faster. Burn energy faster. | speed ×1.3, movement energy ×1.5 |
| CAMOUFLAGE | Harder for predators to notice. | player `detectionMultiplier` ×0.55 |
| MOISTURE RETENTION | Lose moisture more slowly. Move a little slower. | hydration loss ×0.55, speed ×0.9 |

Anti-degenerate check: Camouflage is not a "hide forever" trait (drain continues, and shrunken range still lets a predator notice a player standing right beside it). Legs cost energy; Retention costs speed. Each has a situation where it is best (open dash / long shelter waits / dry stretch).

## 13. Win / lose

- **Win — SURVIVED:** timer reaches `SESSION_DURATION` (75 s) with the player alive.
- **Loss — CAUGHT:** predator reaches attack range of the player while targeting the player.
- **Loss — STARVED:** energy 0. **Loss — DRIED OUT:** hydration 0.
Cause is always stated on the result screen. No arbitrary instant death: the predator must first TARGET (0.6 s tell), then CHASE; the player's speed is above the predator's *search* speed and roughly equal to its *chase* speed × 0.9 for a short distance, so a chase can be survived by reaching shelter or the target changing (see §29 risk 2).

## 14. Autonomy check (priority #1)

With the player standing still for the full run, the following must still happen: NPCs wander, eat, pause; food is consumed and regrows; predator searches, targets an NPC, chases, catches, eats, becomes satiated, resumes; migration spawns replacements. There is no code path that reads `player` to decide whether the predator or NPCs act, other than the generic prey list.

## 15. Determinism and architecture mapping (repo rules)

- All randomness via `store.prng.next()`; only `main.js` calls `Date.now()` for the seed. "Try again" uses a new seed; the seed is shown on the result screen so a run can be re-created.
- Fixed `FIXED_DT = 1/60`. `store.tick()` first.
- **Discrete events (dispatched, logged):** `START_RUN`, `SET_INPUT` (move vector, dispatched only when it changes), `SELECT_ADAPTATION`, `EAT_FOOD`, `NPC_DIED`, `PLAYER_DIED`, `RUN_WON`, `RESTART`.
- **Continuous sim (`update()`, not logged):** movement, drains, AI, timers.
- `update()` never dispatches. It writes a flag (e.g. `state.predator.pendingCatch = id`). `main.js` reads pending flags at the start of the next tick and dispatches the event. One action mutates one slice.
- State slices, one system file each: `session`, `player`, `npcs`, `predator`, `food`, `world` (static layout copied at start: shelters, obstacles, wet ground; seeded). Cross-slice *reads* are allowed for AI; writes only to own slice.
- Rendering and HUD read `store.state` and never write it. UI uses `dispatch()` and `subscribeTo()` only.
- Replay = `{ seed, history }`. Because inputs are logged, a run replays identically.

Planned files (all IIFE + `window` globals, no modules):
```
src/config/  balance.js  adaptations.js  world.js  strings.js
src/systems/ sessionSystem.js playerSystem.js npcSystem.js predatorSystem.js foodSystem.js worldSystem.js
src/render/  camera.js  draw*.js (terrain, plants, creatures, shelter, fx)
src/ui/      inputHandler.js hud.js startScreen.js resultScreen.js
```
`src/config/figures.js` (unused Tetris leftover from the template) will be deleted in the first implementation task.

## 16. Configuration (all in `config/balance.js`)

`SESSION_DURATION 75`, `PLAYER_SPEED`, `PLAYER_ENERGY_DRAIN`, `PLAYER_MOVE_ENERGY_MULTIPLIER`, `PLAYER_HYDRATION_DRAIN`, `FOOD_ENERGY_VALUE (SMALL/LARGE)`, `FOOD_COUNT`, `FOOD_REGROW_TIME`, `NPC_COUNT`, `NPC_SPEED`, `NPC_FLEE_SPEED`, `NPC_MIGRATION_INTERVAL`, `PREDATOR_SPEED`, `PREDATOR_CHASE_SPEED`, `PREDATOR_DETECTION_RANGE`, `PREDATOR_ATTACK_RANGE`, `PREDATOR_FEED_DURATION`, `PREDATOR_COOLDOWN`, `PREDATOR_INITIAL_DELAY`, `PREDATOR_LOSE_TARGET_TIME`, `PREDATOR_MAX_CHASE_TIME`, `HUMIDITY`, `SHELTER_DETECTION_MULTIPLIER`, `LONG_LEGS_SPEED_MULTIPLIER`, `LONG_LEGS_ENERGY_MULTIPLIER`, `CAMOUFLAGE_DETECTION_MULTIPLIER`, `MOISTURE_RETENTION_HYDRATION_MULTIPLIER`, `MOISTURE_RETENTION_SPEED_MULTIPLIER`. "Make the predator slower" = one number.

## 17. Rendering decision: 2.5D Canvas (not true 3D)

`ARCHITECTURE.md` and `AGENTS.md` forbid ES modules, bundlers and external dependencies, and require `file:///` opening. Current three.js releases ship only as ES modules; vendoring an old classic-script build would break the "no external dependencies" rule and add ~600 KB. True 3D would also cost time without helping the "I am tiny" test. **Repository rules win → 2.5D Canvas 2D.**

2.5D techniques that deliver scale:
- 3/4 top-down view, world Y compressed (~0.75) so the ground reads as receding.
- Depth sorting by Y so tall things (stems, leaves) overlap creatures.
- Parallax: foreground stems and leaf edges move faster than the ground (`parallax 1.15–1.4`).
- Large soft blob shadows, fog/haze gradient, subtle stem sway.
- Camera follows the player smoothly with slight lead; zoom fixed.

Visual representation is isolated in `render/`, so later clay sprites replace the procedural drawings without touching simulation.

## 18. Scale system

World ≈ 3200 × 2200 units (much larger than the ~1100 × 700 view). Reference sizes (units ≈ pixels at default zoom):

| Thing | Size | Gameplay role |
|---|---|---|
| Player | 22 long | — |
| NPC | 18 long | prey |
| Predator | ~230 long | threat |
| Leaf canopy | 350–600 wide | shelter, occluder |
| Fallen branch | 900 × 90 | wall / corridor / bridge |
| Rock | 250–450 | landmark, obstacle |
| Puddle | 500–700 | landmark, wet ground |
| Fern/lycopod stem | 60 wide, taller than screen | vertical divider, foreground occluder |

Several objects extend past the viewport edge. The screenshot test: a viewer must not be able to read the scene as a human-sized character on ordinary scenery.

## 19. Environment layout

Asymmetrical zones, no grid:
- **Home hollow** (player start): dense canopy, dark, no food. Landmark: **Great Root Arch**.
- **Transition belt:** partly shaded, small food, fallen-branch corridor.
- **Wet basin:** large **puddle** landmark, wet ground, high-value food, wide open.
- **Rock ridge:** big **rock** landmark, cliffs with a shelter hollow at its base; predator patrol path passes here.

Layout is a hand-authored config (`config/world.js`) with small seeded jitter, so it feels natural but the four zones/3 landmarks are guaranteed.

## 20. Camera and occlusion

Close 3/4 view; smooth follow (lerp ~0.08); tiny screen shake only when the predator is within ~300 units and moving (≤2 px). Foreground leaves/stems drawn after creatures; when the player is beneath one it fades to ~45 % opacity so the player is never hidden. This is what makes it feel like being *inside* vegetation.

## 21. Visual language

- Palette: earthy, wet, muted, deep. Value hierarchy: ground (mid-dark brown-olive) < wet soil (darker, glossy) < water (blue-grey teal, low saturation) < bark (warm dark) < vegetation (varied greens plus rust/ochre) < creatures (lighter, carry rim light).
- Motifs: lycopod-scale bark texture, fern fronds, horsetail segmented stems, spore beads. No garden flowers, no lawn, no fantasy mushrooms.
- Silhouettes by **shape and motion, not colour**: player = long oval + antennae, quick scuttle; NPC = round, short, hesitant; predator = huge, low, armoured, mandibles.
- Light: open ground brighter, sheltered ground darker; big soft plant shadows; haze increases with distance from the camera centre.
- Food: warm cream-amber glow with a slow pulse (not neon).
- PEGI 7: catching is soft. The caught creature is scooped up, flashes, and disappears in a puff of spores; no gore, no cruelty. Predator "eats" is a head-down feeding motion off-contact. Result text says "caught", not a graphic description.

## 22. Danger communication

Ecological cues first: NPCs scatter; foliage near the predator shakes; a large shadow crosses the ground; predator gait changes with state; ambient tone lowers. Small UI support only: a subtle edge vignette pulse when the predator is TARGET/CHASE within range of the *player*. No warning banners.

## 23. HUD (minimal)

```
┌──────────────────────────────────────────────┐
│ ENERGY ▮▮▮▮▯   MOISTURE ▮▮▮▯▯        0:47    │  top strip, thin, translucent
│                                              │
│                 (world)                      │
│                                              │
│ trait: CAMOUFLAGE           HIDDEN | EXPOSED │  bottom corners, small text + icon
└──────────────────────────────────────────────┘
```
Bars have icons and text labels, not colour alone. HUD < ~8 % of the screen. Hints ("WASD") appear as a small line in the first 6 seconds only, no modal tutorial.

## 24. Start screen

Title PALEO MICROHABITAT, one sentence ("You are a tiny creature in an ecosystem that does not care about you."), HUMIDITY: 78 %, three trait cards (LONG LEGS / CAMOUFLAGE / MOISTURE RETENTION, plain-language effects), START button (also Enter). One trait preselected so the game can be started with a single click. A faint live ecosystem plays behind the menu, which reinforces "the world runs without me".

## 25. Result screen

Compact "experiment" summary, not a score:
```
SURVIVED / CAUGHT / STARVED / DRIED OUT
Survival 01:04   Food eaten 4   Time sheltered 31 s
Predator kills 2   Trait Camouflage   Humidity 78%   Seed 123456
CHANGE ONE VARIABLE AND TRY AGAIN
[ TRY AGAIN ]  [ CHANGE ADAPTATION ]
```
Optional small line: predator encounters (times it entered TARGET/CHASE against the player).

## 26. Educational potential

Structure of a run: hypothesis (pick a trait) → change one variable → run → observe → compare. Result screen keeps the run stats comparable. No quizzes, no lectures. Later: "What do you expect?" prompt, run history, humidity as a second variable.

## 27. Audio

Optional and last. A small WebAudio-generated ambience (low hum, drips, footsteps) generated procedurally, no files. Skipped if it threatens the schedule.

## 28. Design-rules checklist

| Rule | Status |
|---|---|
| §0 consistency | Single source of truth in config; no dead sections. |
| §1 affordances | Dark dense cover = shelter; glowing beads = food; glossy dark patch = wet. Same treatment for player/NPC. |
| §2 combinatorial | 5 entity kinds; stories come from combining shelter × food × predator × traits. Only one predator, one NPC type. |
| §3 core loop / progress | Loop is replayable in 75 s; "progress" is knowledge (trait comparison), not stat growth. Difficulty waves: safe start, first predator pass, satiated valley, second pass. |
| §4 goals | See §3. |
| §5 anti-degenerate | Hiding forever loses to drain; predator satiation windows and NPC targets make bolting workable; each trait has trade-offs. |
| §6 agency | Player choices (trait, when to leave, where to go) change the result; randomness is readable via predator tells. |
| §7 no slogan-only fun | Tension = drain forcing exposure against 0.6 s tell + chase. Surprise = predator picks the nearest noticeable prey. |
| §8 PEGI 7 | Soft, abstract catching (see §21). |
| §9 multiplayer | Single-player. |

Adaptations of the source brief because of repo rules:
1. **True 3D is not used** (§17): repo forbids ES modules/deps.
2. **"Predator eats prey" is shown softly** for PEGI 7.
Also flagged: `DESIGN_RULES` "Completeness Gate" asks for UI/UX/state diagrams; §4, §7, §23 and §25 provide them in text form. No player-visible screenshots exist yet, so the visual claims (§18–§21) must be verified in the first playable build.

## 29. Known risks

1. **Scale illusion fails** if the world is empty at default zoom. Mitigation: large occluding foreground, fixed camera, size table §18, first visual pass before balance.
2. **Chase feels unfair or too easy.** Mitigation: 0.6 s TARGET tell, predator chase speed ≈ player speed with Long Legs faster, config-only tuning, max chase time.
3. **Predator rarely picks NPCs** (or always picks the player). Mitigation: NPC count 6, waypoints weighted to food patches, logged selection reasons in a debug overlay (`?debug` only).
4. **Predator never appears** in 75 s runs. Mitigation: start position and initial delay in config; average path length tuned so the first pass occurs around 15–25 s.
5. **Determinism drift** from floating-point or order of iteration. Mitigation: fixed `dt`, arrays iterated in id order, replay test.

## 30. Testing plan

Runs via `tests/index.html` and the Node one-liner from the README. Suites cover the 18 items in the brief: energy drain, food restore, hydration drain, humidity modifier, each adaptation effect, shelter and camouflage detection multipliers, predator can choose NPC / player / not always player, NPC death, three player death causes, timer win, PRNG determinism and full-run replay. Browser checks per the brief §57.

## 31. Performance

≈ 8 creatures, ≈ 60 static objects, one canvas. Trivial. Pre-render static ground and large plants to an offscreen canvas at start. Avoid per-frame allocation in `render`.

## 32. Assets

No third-party content. All art is procedural Canvas drawing, isolated in `render/` (creature drawers take `(ctx, entity, t)` so hand-made sprites can replace them). `THIRD_PARTY_NOTICES.md` is not needed. Mikrorayon is a scope reference only; nothing is copied.

## 33. Explicitly out of scope (v1)

Open world, multiple biomes/eras, evolution and genetics, editors, skill trees, crafting, inventory, weapons, quests, dialogue, base building, multiplayer, accounts, backend, database, day/night, weather, fluids, complex physics, achievements, monetisation, photorealism, campaign, encyclopedia.
