# PROJECT_SPEC.md — Multiplayer Narrative Puzzle Web App (JSON-driven)  
**Working title:** *LockStep* (rename anytime)  
**Team size:** 3 devs  
**Core promise:** A co-op, narrative escape-room web app where players solve engineering + coding puzzles under pressure. Multiplayer creates community-building through role-based clues and shared consequences.

---

## 0) Canonical rule (for Cursor/Claude)
This file is the **source of truth**.  
If code changes conflict with this spec, **update the code to match the spec**, not the other way around.

**Cursor/Claude guardrails (IMPORTANT):**
- Do **NOT** refactor or touch files outside your assigned area unless explicitly instructed in this spec.
- Do **NOT** rename files or move folders unless a section below says to.
- Prefer additive changes. Avoid “cleanup refactors.”
- Keep JSON-driven behavior: scenarios must load from JSON, not hardcoded.

---

## 1) MVP Scope (what we will ship)
### Scenarios (2)
1. **Submarine Escape** (timed, oxygen/water meters)
2. **AI Dystopia** (alert + password attempts)

### Session length
- 20–35 minutes per scenario
- 6 puzzle rooms per scenario (+ 1 red herring room)

### Multiplayer
- Kahoot-style join code
- 3 players minimum supported (our team size), scalable to 6 later
- Shared room state (server authoritative)

### PHET embed
We choose **Option B**: embed PHET for immersion, but validate success using **our own UI validator** (inputs + tolerance checks). No cross-origin success signals required.

---

## 2) Game Design Pillars (community building)
- **Roles** create information asymmetry: each player sees unique clues.
- **Shared meters**: mistakes affect everyone (oxygen/water/alert/attempts).
- **Branching decisions**: at least 2 major choices per scenario.
- **Fair red herrings**: tempting but punish with meters, not instant resets.

---

## 3) Roles (generalized, works for any scenario)
Roles are scenario-agnostic: they represent *how you contribute*.

### 3.1 Roles (MVP = 3 roles)
We will support exactly 3 roles for MVP (because we are 3 devs and 3 players):
1. **Builder**  
   - Solves: circuits, calibration, “restore power”, system config puzzles  
   - Sees: diagrams, component labels, system states  

2. **Pathfinder**  
   - Solves: map/route choices, door graphs, navigation constraints  
   - Sees: floor plan, exit constraints, danger warnings  

3. **Decoder**  
   - Solves: ciphers, pattern/log interpretation, code debugging prompts  
   - Sees: logs, hidden text, partial codes  

> Optional later: Coordinator (resource stabilizer). Not MVP.

### 3.2 Role implementation
Each node can include `roleClues[]`.  
Clients only render clues matching the player’s role.

We do **not** implement free movement. “Starting location” is flavor text per role.

---

## 4) Multiplayer Room Flow (Kahoot-style)
### 4.1 Create room
1. Host clicks **Create**
2. Select scenario: Submarine / AI
3. Server generates a **6-character code**
4. Host enters **Lobby** with code visible
5. Others join with code
6. Host clicks **Start**
7. Roles chosen in lobby; if not, auto-assign by join order.

### 4.2 Join room
1. Player clicks **Join**
2. Enters code + display name
3. Joins lobby
4. Select role (Builder/Pathfinder/Decoder)
5. Wait for host Start

### 4.3 Server authoritative room state
Room state fields (minimum):
- `roomCode`
- `scenarioId`
- `players[]` = { id, name, role, connected, isHost }
- `currentNodeId`
- `globals.vars` (oxygen/water OR alert/attempts)
- `solvedPuzzles[]`
- `checkpointNodeId` (optional)
- `timeRemainingSeconds` (submarine only)

---

## 5) JSON-driven game engine
### 5.1 Content files
- `/scenarios/mvp.json` (contains roles + both scenarios)

### 5.2 Node types
- `puzzle_node`
- `choice_node`
- `win_node`
- `fail_node` (optional; can be implicit via failConditions)

### 5.3 Puzzle types (MVP)
- `choice`
- `input_code`
- `input_numeric`
- `multi_input`
- `debug_select` (minor code fix using provided boilerplate + options)
- `logic_match` (simple selection)
- `embed_validator` (PHET shown + user enters measured values)

### 5.4 Effects system
Supported ops:
- `{ op: "add", var: "oxygen", value: -10 }`
- `{ op: "set", var: "doorAUnlocked", value: true }`

### 5.5 Fail conditions
Each scenario declares fail conditions that end the game (GAME_OVER).

---

## 6) Scenarios (MVP narratives + puzzle maps)
We ship **exactly** what is authored in `/scenarios/mvp.json`.

### 6.1 Submarine Escape
Globals: `timerSeconds`, `oxygen`, `water`  
Fail: oxygen <= 0 OR water >= 100 OR timer expires

Rooms:
- A1 Wake Alarm Bay (breaker order)
- A2 Power Relay (PHET + validator)
- A3 Pressure Hatch Code (decode to keypad)
- A4 Flooded Junction (debug_select code fix)
- A5 Vent Fork (branch)
- A_RH1 Vent Trap (red herring penalty)
- A6 Final Escape Lock (combine tokens)
- A_WIN (win node)

### 6.2 AI Dystopia
Globals: `alert`, `attemptsLeft`  
Fail: alert >= 100 OR attemptsLeft <= 0

Rooms:
- B1 Entry Route (branch)
- B_RH1 Honeytrap Hall (red herring penalty)
- B2 Camera Loop (debug_select code fix)
- B3 Simulated Data Vault (logic filter for key)
- B4 Password Gate (limited attempts)
- B5 Ethics Firewall (shutdown order)
- B6 Final Shutdown (multi_input tokens)
- B_WIN (win node)

---

## 7) Tech Stack (suggested)
- Frontend: React + Vite
- Backend: Node + Express (or Next API routes)
- Realtime: Socket.io
- JSON: loaded on server and sent to clients at start

> Keep it minimal. Don’t add auth.

---

## 8) Work Split (3-person, minimize merge conflicts)
We will split by **folders**, not functions.
**Rule:** Each dev owns their area. Others do not touch it.

### DEV A — Multiplayer + Server (Networking Owner)
**Owns:** `/server/**` (ONLY)  
**Responsibilities:**
- Socket.io server
- Room creation/joining
- Room code generation
- Lobby state + role selection
- Server-authoritative state updates
- Broadcast `ROOM_UPDATED` after every mutation
- Timer tick (submarine)
- Fail condition checks (server side)

**DO NOT TOUCH (A):**
- `/client/**`
- `/scenarios/**`

**Interfaces A must expose:**
- Socket events listed in this spec
- RoomState shape used by client

---

### DEV B — Frontend UI (React Owner)
**Owns:** `/client/**` (ONLY)  
**Responsibilities:**
- Create/Join page
- Lobby UI (code display, player list, role selection)
- Game UI layout:
  - story + media panel
  - global meters panel
  - role clue panel
  - puzzle panel
- Render puzzle components based on puzzle type
- Submit answers/choices to server

**DO NOT TOUCH (B):**
- `/server/**`
- `/scenarios/**`

**Frontend must treat scenario JSON as data** (no hardcoded puzzles).

---

### DEV C — Content + Engine Schema (JSON/Design Owner)
**Owns:** `/scenarios/**` and `/docs/**` (ONLY)  
**Responsibilities:**
- Maintain `/scenarios/mvp.json`
- Define JSON schema rules in `/docs/SCHEMA.md`
- Ensure puzzles are fun + balanced
- Ensure roleClues are meaningful for each node
- Ensure red herrings are fair and return to main line
- Verify that each puzzle has validation + effects

**DO NOT TOUCH (C):**
- `/server/**`
- `/client/**`

> Dev C may propose new puzzle types, but must coordinate with Dev B (UI) and Dev A (validation path) before adding.

---

## 9) No-merge-conflict protocol (must follow)
- Each dev works only in their folder.
- Shared changes go through a single “integration” PR where each dev merges sequentially.
- Do not reformat code globally.
- Do not run “organize imports” across the repo.
- JSON file edits: only Dev C edits `/scenarios/mvp.json`.

---

## 10) Cursor/Claude instructions (paste into prompts)
When using Cursor/Claude, always include:
- “Only edit files in: [your owned folder].”
- “Do not refactor outside scope.”
- “Follow PROJECT_SPEC.md; do not invent new flows.”
- “Do not rename files.”

Example prompt (Dev B):
> Update the Lobby UI to show room code + player list + role selection. Only edit /client/**. Do not touch /server/** or /scenarios/**. Follow PROJECT_SPEC.md.

---

## 11) Definition of Done (MVP)
- Create room → join with code → lobby → start
- Roles assigned
- Node progression works from JSON
- Puzzles validate and apply effects
- Red herring routes work and return
- Win node renders victory screen
- Fail conditions trigger GAME_OVER with reason
- PHET embed displays and validator input gates success

---

## 12) Files we will include in repo
- `PROJECT_SPEC.md` (this file)
- `/scenarios/mvp.json` (content + both scenarios)
- `/docs/SCHEMA.md` (JSON schema rules)
- `/docs/PUZZLE_AUTHORING_GUIDE.md` (how to add rooms/puzzles safely)

---

## 13) Notes on safety
We will not implement real hacking or teach exploit techniques.
“SQL injection” is simulated as a puzzle vibe (fake terminal + logic filter).

---

## 14) Next steps checklist (sequence)
1. Dev C finalizes `/scenarios/mvp.json` (already drafted)
2. Dev A builds server rooms + events
3. Dev B builds UI pages + puzzle renderer
4. Integrate: connect UI to server events
5. Playtest and adjust penalties/tolerances
