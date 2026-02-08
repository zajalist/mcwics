SCENARIO_EDITOR_SPEC.md — Node-Based JSON Generator
1) Objective
Create a visual Node-Based Editor page (/editor) that allows the team to visually map out scenarios, link puzzles, and export the final mvp.json file. This replaces manual JSON editing and ensures structural integrity (e.g., no "dead-end" nodes or broken links).

2) Ownership & Folder Rules
Following the PROJECT_SPEC.md work split:

DEV B (Frontend UI): Owns the creation of the Editor React components, the visual canvas, and the property sidebars.

DEV C (Content/Engine): Defines the "Node Schemas" and validation rules to ensure the exported JSON matches the engine's requirements.

3) Core Features (MVP Editor)
3.1 The Canvas (reactflow)
Interface: Use reactflow (or xyflow) for the node-based interface.

Nodes: Custom components representing puzzle_node, choice_node, win_node, and fail_node.

Edges: Visual lines representing logical flow.

An edge from a puzzle_node sets the nextNodeId.

Edges from a choice_node map to specific choices[].nextNodeId entries.

3.2 Property Panel (Side Drawer)
When a node is selected, a sidebar must allow editing of the JSON fields:

Identity: id (slug), location name.

Story: story.title, story.text, and story.narrationText.

Role Clues: A dynamic list where clues can be added/removed for specific roles (builder, pathfinder, decoder).

Puzzle Config: * Dropdown for type (choice, input_code, debug_select, etc.).

Conditional inputs: e.g., if input_code, show answer; if debug_select, show boilerplate and options.

Effects: Add/Edit/Delete effectsOnSuccess and effectsOnFail.

4) JSON Structure Reference
The editor must export an object matching the format provided in the project root. Key Mapping Logic:

Node ID: The ReactFlow node ID should be the id in the JSON.

Connections: If Node A is connected to Node B, Node A's nextNodeId property is updated to Node B's ID.

5) Implementation Requirements (For Claude)
5.1 Export/Import
Export: A button to serialize the current canvas state into the final mvp.json format and trigger a browser download.

Import: A "Load JSON" button that parses an existing mvp.json, creates the nodes, and uses a basic layout engine (like dagre) to position them if coordinates are missing.

5.2 Validation System
Highlight nodes in Red if they violate engine rules:

puzzle_node is missing a nextNodeId connection.

input_code puzzle has no answer.

An effect modifies a variable (e.g., "oxygen") that isn't defined in the globals.vars list.