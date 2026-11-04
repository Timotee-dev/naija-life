# NAIJA LIFE: how the game works

This guide walks through the whole codebase. It assumes you know React basics. You don't need any game-dev experience.

---

## 1. Run it

```bash
npm install
npm run dev
```

Open http://localhost:5173. `npm run build` makes a production build in `dist/` that you can host on Netlify or Vercel.

While `npm run dev` is running, open the browser console and type `__naija`. That gives you the live game state for debugging. For example, `__naija.runtime.player` shows where you are standing. This hook only exists in development, not in the built game.

---

## 2. What's in this version (Phase 1 + core of Phase 2)

| Spec area | What works now |
|---|---|
| World | One dense Yaba neighbourhood: 4 named roads, 15 public places you can use, 4 homes, 4 bus stops, a football pitch, a night-time suya stall, and neighbours' houses |
| Character creation | Name, gender, skin tone, face, hairstyle, hair colour, beard, top, bottom, colours, footwear, accessory, height, build, plus 5 starting backgrounds |
| Movement | Walk, run, jump, collide with buildings, third-person camera (drag to turn, scroll or pinch to zoom), touch joystick on phones |
| Interaction | Contextual prompts: ENTER, GO HOME, TALK, BOARD, VISIT |
| Needs | Health, hunger, energy, happiness, hygiene, social. They drain over time; you collapse gently if you ignore them |
| Money | Cash and bank, ATM, transaction history, credit and debit alerts, salary, freelance pay, rent |
| Food | Buka, fast food, supermarket items, suya at night, roasted corn, cooking noodles at home |
| Housing | 4 homes (Uncle's couch, hostel, single room, self-con), weekly rent, landlord reminders, eviction |
| Transport | Walking, danfo (₦300, bus stops only), keke (anywhere, cash), GidiRide app (bank), plus live traffic you can be hit by |
| Smartphone | Messages (family group, landlord, work, friends), NaijaTrust bank, GidiRide, Map with waypoints, Profile, Diary, Settings and save |
| NPCs | 11 named people with daily routines, relationship levels and real effects (friends give discounts); 14 passers-by |
| Nigerian life | NEPA cuts and generators, fuel prices, family money requests, the danfo conductor with no change, market bargaining, viewing centre, church, burglar-proof windows, black roof tanks |
| Day and night | Continuous clock, moving sun, street lamps, windows that only glow where there's power |
| Saving | Autosave every minute, 3 manual slots, Continue and Load on the main menu |

Not in this version, as planned: jobs marketplace, full university system, businesses, dating, driving your own car, weather, sound, multiplayer. Those are Phases 3–5.

---

## 3. The big idea: two kinds of data

The most important design choice in the code is that **there are two kinds of data**, and they live in different places.

**1. The saved game (`Sim`, in `game/types.ts`).** Your money, needs, home, messages, relationships and the clock. It changes a few times a second at most. It lives in the **zustand store** (`game/store.ts`), so React re-renders the HUD when it changes. It's plain data, so saving is just `JSON.stringify`.

**2. Live frame data (`runtime`, in `game/runtime.ts`).** Your exact position, the camera angle, where every car and NPC is *right now*. It changes **60 times a second**. If this were React state, the whole UI would re-render 60 times a second and the game would crawl. So it's a plain object that the 3D code writes to and reads from directly.

```
3D components (60 fps)  ──write──▶  runtime  ◀──read── minimap, prompts
                                       │
          SimClock, 4× a second ───────┘──▶ store.tick() ──▶ Sim ──▶ HUD re-renders
```

When in doubt: if it needs saving, it goes in `Sim`. If it changes every frame, it goes in `runtime`.

---

## 4. Folder map

```
src/
├── App.tsx                 Picks the screen: menu, character creator, or game
├── index.css               All the styling
├── game/                   Rules and data. No 3D here, no React components.
│   ├── types.ts            Shape of everything. START HERE.
│   ├── constants.ts        Walk speed, jump height, how fast time flows
│   ├── utils.ts            Money formatting, clock helpers, seeded random
│   ├── runtime.ts          Live frame data (see section 3)
│   ├── store.ts            The zustand store: the Sim + every player action
│   ├── input.ts            Keyboard and touch input
│   ├── data/               Content you can edit without touching logic
│   │   ├── map.ts          Roads, buildings, bus stops
│   │   ├── places.ts       Every place and every action inside it
│   │   ├── npcs.ts         Named NPCs: look, routine, lines
│   │   ├── backgrounds.ts  The 5 starting lives + the 4 homes
│   │   ├── items.ts        Things in your bag
│   │   ├── clothes.ts      What the market sells
│   │   └── appearance.ts   Skin tones, colours, hairstyles
│   └── systems/
│       ├── sim.ts          Needs drain, money, rent, NEPA, daily events
│       ├── interact.ts     Finds the nearest door or person for the prompt
│       ├── collision.ts    Keeps you out of walls
│       └── save.ts         localStorage save slots
├── three/                  Everything inside the 3D <Canvas>
│   ├── Scene.tsx           Puts the world together + the game clock
│   ├── World.tsx           Ground, roads, buildings, lamps, trees, stops
│   ├── Person.tsx          One character model, used for you and every NPC
│   ├── Player.tsx          Your movement, jumping, traffic hits
│   ├── Npcs.tsx            Named NPCs and passers-by
│   ├── Traffic.tsx         Danfos, kekes, cars, okadas
│   ├── CameraRig.tsx       Third-person camera
│   ├── DayNight.tsx        Sun, sky, lamps, NEPA window lights
│   ├── textures.ts         Facades, signs and road paint, drawn in code
│   └── placements.ts       Where lamps and trees go
└── ui/                     Normal React screens and overlays
    ├── MainMenu.tsx, CharacterCreator.tsx, GameScreen.tsx
    ├── Hud.tsx, Minimap.tsx, MapCanvas.ts
    ├── PlacePanel.tsx      Inside a building (+ clothes, barber, ATM)
    ├── DialogPanel.tsx     Talking to an NPC
    ├── StopPanel.tsx       Danfo and keke
    ├── Phone.tsx           All the phone apps
    ├── Inventory.tsx, PauseMenu.tsx, SettingsPanel.tsx, TouchControls.tsx
    └── ErrorBoundary.tsx   If a panel crashes, you get a message, not a blank screen
```

---

## 5. How one moment of play flows

Say you walk up to Mama Nkechi's Buka and buy amala.

1. **`Player.tsx`** reads your keys every frame, moves you, and pushes you out of walls (`collision.ts`). It writes your position to `runtime.player`.
2. About 8 times a second it calls `store.updatePrompt()`. That uses **`interact.ts`** to find the closest door, stop or person, and shows **[E] ENTER Mama Nkechi's Buka**.
3. You press **E**. `input.ts` calls `store.interact()`, which opens the place panel. Time pauses while any panel is open.
4. **`PlacePanel.tsx`** lists the buka's actions from **`data/places.ts`**, showing price, time and why something isn't available.
5. You click amala. `store.doAction("buka", "amala")`:
   - checks it's open and affordable,
   - takes ₦1,800 (cash if you have it, otherwise transfer),
   - moves the clock forward 25 minutes with `passTime()` (needs drain, events can fire),
   - runs the action: hunger +55, happiness +4,
   - saves the new Sim and shows the result line.
6. The HUD re-renders with your new money and hunger.

Every activity in the game works this way: an action is just **price + time + effect**.

---

## 6. Time and needs (`systems/sim.ts`)

- The clock is **game minutes since Day 1, midnight**. Day 1 is a Monday. One real second = one game minute at Normal speed, so a day lasts about 24 real minutes.
- `passTime(sim, minutes, mode)` moves time in 15-minute steps. Each step drains needs and checks for events.
- **Mode** changes the drain: `work` drains energy faster, `sleep` stops energy drain and slows hunger, `rest` is in between.
- **Health** drops only when you're starving or exhausted, and heals slowly otherwise. **Happiness** drifts toward the average of your other needs.
- When needs hit zero, the game is gentle (the spec asked for that): at zero energy you doze off on a bench and lose a little cash; at zero health you wake up at the clinic.

**Daily events** fire in `newDay()`: fuel price changes, the family group posts, money requests, rent reminders and eviction, missed shifts and lectures, Tunde's weekend invites, and the student allowance on Mondays. **NEPA** flips on and off at random times. When it's off, windows go dark except buildings with a generator, and sleeping without light is worse.

---

## 7. The 3D side, quickly

- **Everything is built from boxes, spheres and cylinders.** There are no 3D model files. `Person.tsx` builds a person from about 20 shapes. Legs and arms are groups that rotate around the hip and shoulder to walk.
- **Textures are drawn on a `<canvas>` in code** (`textures.ts`): painted walls with rain stains, windows with burglar-proof bars, shop signs, yellow-and-black kerbs, Ankara prints. Each facade has a second "glow" texture, so DayNight can light up just the windows at night.
- **Instancing**: the 61 street lamps and 37 trees are drawn with `instancedMesh`, which means one draw call for all of them instead of one each.
- **Shadows** come from one sun light that follows you, so the shadow area stays small and sharp.
- **The camera** sits on a sphere around you. Dragging changes the angle, scrolling changes the distance. Your movement is relative to where the camera faces.

---

## 8. Recipes: add things yourself

### Add a new food to the buka
In `data/places.ts`, inside `buka.actions`, add:
```ts
meal("ofada", "Ofada rice & ayamase", 2500, 58, 6, ["The ayamase pepper woke your ancestors."]),
```
That's it. Price, hunger, happiness and the result line.

### Add a whole new place (example: a cyber café)
1. **`data/map.ts`**: add a building with `place: "cyber"`, a position, size, colour, `facing` (which side the door is on), and a `sign`. Make sure it doesn't overlap a road; the comments show where the roads are.
2. **`data/places.ts`**: add `cyber: { id: "cyber", name: "...", kind: "...", hours: [8, 22], desc: "...", actions: [...] }`.

The door prompt, the minimap, the phone's Map and GidiRide destinations all pick it up automatically.

### Add a new NPC
In `data/npcs.ts`, copy an entry and change the `id`, `name`, `appearance` and `schedule`. The schedule returns where they stand for a given weekday (0 = Monday) and hour, or `null` when they're indoors. Lines can use `{name}` for the player's name.

### Change how the game feels
- `constants.ts`: walk and run speed, jump, how fast time flows.
- `systems/sim.ts`: the `DRAIN` numbers control how quickly needs fall.
- `data/backgrounds.ts`: starting money and rent.

---

## 9. What to build next (Phase 3)

1. **Jobs marketplace in the phone**: apply, interview, get hired, with performance and promotions. The Yaba Mart shift is the pattern to copy.
2. **University system**: courses, assignments, exams and CGPA. The lecture action and the course rep messages are the starting point.
3. **Businesses**: rent a shop at Alhaji Properties, set prices, hire staff, earn daily revenue.
4. **Relationships**: dating, friendship events, and NPCs who text you first.
5. **Sound**: Lagos traffic ambience, danfo horns, generator hum when NEPA goes. Use the Web Audio API and start sound from a button click.
6. **Driving**: get into a car and drive it with the same controller, but with car physics.
7. **Backend**: when you want accounts and cloud saves, a Django + DRF API can store the `Sim` JSON as-is.
