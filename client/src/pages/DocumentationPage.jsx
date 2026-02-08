import React, { useState } from 'react';
import { BookOpen, Layers, Puzzle, GitFork, Rocket, Settings, Play, Users, ChevronDown, ChevronUp } from 'lucide-react';

export default function DocumentationPage() {
  const [openSection, setOpenSection] = useState('getting-started');

  const toggleSection = (id) => {
    setOpenSection(openSection === id ? null : id);
  };

  const sections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: Rocket,
      content: (
        <>
          <h3>Welcome to LockStep</h3>
          <p>LockStep is a collaborative scavenger hunt platform where you can create, host, and play interactive story-based adventures with friends, students, or team members.</p>
          
          <h4>Quick Start</h4>
          <ol>
            <li><strong>Play a Game:</strong> From the home page, click "Join Room" and enter a room code shared by a host, or "Create Room" to host your own session.</li>
            <li><strong>Explore Templates:</strong> Visit the "Discover" tab to browse community-created scenarios and templates.</li>
            <li><strong>Build Your Own:</strong> Open the "Editor" tab to create custom scavenger hunts with our node-based editor.</li>
          </ol>

          <h4>How Games Work</h4>
          <p>LockStep games are <strong>node-based adventures</strong> where players progress through connected story nodes:</p>
          <ul>
            <li><strong>Start Nodes:</strong> Set the scene and introduce the story</li>
            <li><strong>Puzzle Nodes:</strong> Challenge players with riddles, ciphers, math problems, and more</li>
            <li><strong>Choice Nodes:</strong> Let players make decisions that affect the story path</li>
            <li><strong>Endpoint Nodes:</strong> Conclude with win/fail conditions</li>
          </ul>
        </>
      )
    },
    {
      id: 'editor-basics',
      title: 'Node Editor Basics',
      icon: Layers,
      content: (
        <>
          <h3>Using the Node Editor</h3>
          <p>The LockStep Editor is a visual tool for building scavenger hunt scenarios. It uses a node-based system where each node represents a story beat, puzzle, or decision point.</p>

          <h4>Editor Layout</h4>
          <ul>
            <li><strong>Left Sidebar (Node Palette):</strong> Browse and add different node types by clicking folders</li>
            <li><strong>Center Canvas:</strong> Drag nodes from the palette or click to place them. Connect nodes by dragging from output handles to input handles</li>
            <li><strong>Right Sidebar (Properties):</strong> Edit selected node details, story text, puzzles, and validation rules</li>
          </ul>

          <h4>Basic Workflow</h4>
          <ol>
            <li><strong>Add a Start Node:</strong> Click the "Primitives" folder and select "Start Point" to place your first node</li>
            <li><strong>Write Your Story:</strong> Click the node, then edit the story text and title in the right sidebar</li>
            <li><strong>Add Puzzles:</strong> Browse puzzle categories (Ciphers, Math, Word Puzzles, etc.) and place nodes</li>
            <li><strong>Connect the Flow:</strong> Drag from the right handle of one node to the left handle of another to create connections</li>
            <li><strong>Set Global Settings:</strong> Click the Settings button in the toolbar to configure time limits and resource tracking</li>
            <li><strong>Test & Deploy:</strong> Use "Export JSON" to save your work, or "Deploy" to publish to Firebase</li>
          </ol>

          <h4>Keyboard Shortcuts</h4>
          <ul>
            <li><strong>F:</strong> Preview selected node</li>
            <li><strong>Delete/Backspace:</strong> Remove selected node or edge</li>
            <li><strong>Shift + Click:</strong> Multi-select nodes</li>
          </ul>
        </>
      )
    },
    {
      id: 'node-types',
      title: 'Node Types',
      icon: Puzzle,
      content: (
        <>
          <h3>Understanding Node Types</h3>

          <h4>Start Node (Purple)</h4>
          <p>Every scenario must have exactly one Start Node. This is where players begin their journey.</p>
          <ul>
            <li>Set the scene with story text</li>
            <li>Optionally add narration for audio playback</li>
            <li>Connect to your first puzzle or choice</li>
          </ul>

          <h4>Puzzle Nodes (Blue)</h4>
          <p>Challenge players with interactive puzzles. LockStep supports 9 puzzle categories with 30+ types:</p>
          <ul>
            <li><strong>Primitives:</strong> Multiple choice, text input, numeric, multi-input</li>
            <li><strong>Ciphers:</strong> Caesar, emoji, binary, ASCII art encoding</li>
            <li><strong>Location:</strong> GPS coordinates, landmark identification, directional riddles</li>
            <li><strong>Perception:</strong> Spot the difference, hidden objects, audio clues</li>
            <li><strong>Word & Language:</strong> Anagrams, word searches, crosswords</li>
            <li><strong>Math:</strong> LaTeX equations, logic puzzles</li>
            <li><strong>Science:</strong> Interactive simulations, experiments</li>
            <li><strong>Storytelling:</strong> Narrative clues, found documents</li>
            <li><strong>Code:</strong> Built-in code editor with execution</li>
          </ul>

          <h4>Choice Nodes (Beige)</h4>
          <p>Branch the story based on player decisions. Configure 2-4 choices, each connecting to different paths.</p>

          <h4>Endpoint Nodes (Green/Red)</h4>
          <p>Win or fail endings. Set the outcome message and final rewards.</p>
        </>
      )
    },
    {
      id: 'puzzle-configuration',
      title: 'Configuring Puzzles',
      icon: Settings,
      content: (
        <>
          <h3>Setting Up Puzzles</h3>

          <h4>Basic Configuration</h4>
          <p>When you select a puzzle node, the right sidebar shows:</p>
          <ul>
            <li><strong>Story Text:</strong> The scenario or clue players see</li>
            <li><strong>Narration (optional):</strong> Audio text for accessibility</li>
            <li><strong>Puzzle Configuration:</strong> Specific to the puzzle type</li>
            <li><strong>Validation:</strong> How to check answers (exact match, numeric tolerance, regex)</li>
            <li><strong>Hints:</strong> Optional help text</li>
          </ul>

          <h4>Cipher Puzzles</h4>
          <p>Use the built-in cipher generator:</p>
          <ol>
            <li>Enter the plaintext answer players should decode</li>
            <li>Select a cipher method (Caesar, binary, emoji, etc.)</li>
            <li>Click "Generate" to auto-create the encoded text</li>
            <li>The validation is automatically set to the plaintext answer</li>
          </ol>

          <h4>Multiple Choice</h4>
          <ul>
            <li>Add 2-6 options</li>
            <li>Mark the correct answer(s)</li>
            <li>Optionally show explanations after submission</li>
          </ul>

          <h4>Validation Modes</h4>
          <ul>
            <li><strong>Exact Match:</strong> Answer must match exactly (case-insensitive by default)</li>
            <li><strong>Numeric:</strong> For math problems with tolerance (e.g., ±0.01)</li>
            <li><strong>Contains:</strong> Answer contains specific keywords</li>
            <li><strong>Regex:</strong> Advanced pattern matching</li>
          </ul>
        </>
      )
    },
    {
      id: 'global-settings',
      title: 'Global Settings & Resources',
      icon: Settings,
      content: (
        <>
          <h3>Scenario-Wide Configuration</h3>

          <h4>Time Limits</h4>
          <p>Set a global time limit for the entire scavenge (in minutes). Set to 0 for no time limit. When time runs out, the game ends automatically.</p>

          <h4>Resource Variables</h4>
          <p>Track resources that decrease when players fail puzzles. Perfect for themed scenarios:</p>
          <ul>
            <li><strong>Submarine scenario:</strong> Track oxygen, power, hull integrity</li>
            <li><strong>Space station:</strong> Track fuel, life support, communications</li>
            <li><strong>Mystery game:</strong> Track investigation budget, credibility, leads</li>
          </ul>

          <p>Configure up to 2 resources with:</p>
          <ul>
            <li><strong>Label:</strong> Display name (e.g., "Water", "Energy")</li>
            <li><strong>Initial Value:</strong> Starting amount (e.g., 100)</li>
            <li><strong>Decrease on Fail:</strong> How much to subtract when a puzzle fails (e.g., -10)</li>
          </ul>

          <p>When a resource reaches 0, the game ends in failure.</p>
        </>
      )
    },
    {
      id: 'deployment',
      title: 'Saving & Deployment',
      icon: Rocket,
      content: (
        <>
          <h3>Publishing Your Scenario</h3>

          <h4>Export JSON</h4>
          <p>Save your work locally as a JSON file. This validates your scenario and ensures all required fields are complete. You can import JSON files later to continue editing.</p>

          <h4>Deploy to Firebase</h4>
          <p>Publish your scenario to make it available for others:</p>
          <ol>
            <li>Click the "Deploy" button in the editor toolbar</li>
            <li>Set a title and description</li>
            <li>Choose visibility: <strong>Public</strong> (visible in Discover tab) or <strong>Private</strong> (only you can see/edit)</li>
            <li>Click "Deploy" to upload</li>
          </ol>

          <p>After deployment, your scenario appears in:</p>
          <ul>
            <li><strong>Discover Tab:</strong> For public scenarios</li>
            <li><strong>My Scenarios:</strong> All your deployed scenarios (public and private)</li>
          </ul>

          <h4>Version Control</h4>
          <ul>
            <li>Each deployment updates the scenario in-place</li>
            <li>Keep local JSON backups for version history</li>
            <li>Fork other scenarios to create your own versions</li>
          </ul>
        </>
      )
    },
    {
      id: 'hosting-games',
      title: 'Hosting Games',
      icon: Users,
      content: (
        <>
          <h3>Running a Scavenge Session</h3>

          <h4>Creating a Room</h4>
          <ol>
            <li>From the home page, click "Create Room"</li>
            <li>Enter your name</li>
            <li>Select a scenario from the grid (template or your deployed scenario)</li>
            <li>Click "Create" to generate a room code</li>
          </ol>

          <h4>Inviting Players</h4>
          <p>Share the 6-character room code with participants. They can join by:</p>
          <ul>
            <li>Clicking "Join Room" on the home page</li>
            <li>Entering their name and the room code</li>
          </ul>

          <h4>Lobby Management</h4>
          <p>As the host, you can:</p>
          <ul>
            <li>See all connected players</li>
            <li>Kick players if needed</li>
            <li>Start the game when everyone is ready</li>
          </ul>

          <h4>During the Game</h4>
          <p>Monitor player progress in real-time:</p>
          <ul>
            <li>See which nodes players are on</li>
            <li>Track puzzle attempts and success rates</li>
            <li>Watch resource levels (if enabled)</li>
            <li>View the game graph to see the story flow</li>
          </ul>

          <h4>Best Practices</h4>
          <ul>
            <li>Test your scenario solo before hosting</li>
            <li>Brief players on the theme and any special mechanics</li>
            <li>Have backup hints ready for tough puzzles</li>
            <li>Use screen sharing for in-person groups</li>
          </ul>
        </>
      )
    },
    {
      id: 'advanced-tips',
      title: 'Advanced Tips & Tricks',
      icon: BookOpen,
      content: (
        <>
          <h3>Pro Tips for Better Scenarios</h3>

          <h4>Story Design</h4>
          <ul>
            <li><strong>Start Strong:</strong> Hook players immediately with compelling story text in the Start Node</li>
            <li><strong>Balance Difficulty:</strong> Mix easy and hard puzzles. Place harder puzzles after players have warmed up</li>
            <li><strong>Multiple Paths:</strong> Use choice nodes to create branching narratives with different endings</li>
            <li><strong>Fail States:</strong> Add failure endpoints to raise stakes (e.g., "You triggered the alarm!")</li>
          </ul>

          <h4>Puzzle Design</h4>
          <ul>
            <li><strong>Layer Clues:</strong> Hide clues in story text that point to puzzle answers</li>
            <li><strong>Progressive Hints:</strong> Start vague, get more specific with each hint</li>
            <li><strong>Variety Matters:</strong> Mix puzzle types to keep players engaged</li>
            <li><strong>Thematic Consistency:</strong> Match puzzle types to your story theme</li>
          </ul>

          <h4>Canvas Organization</h4>
          <ul>
            <li>Arrange nodes left-to-right to show progression</li>
            <li>Group related nodes together</li>
            <li>Use ReactFlow minimap (bottom-left) to navigate large scenarios</li>
            <li>Zoom with scroll wheel or touchpad</li>
          </ul>

          <h4>Testing</h4>
          <ul>
            <li>Use the F-key preview to quickly check node content</li>
            <li>Test all paths, not just the "happy path"</li>
            <li>Have someone else playtest to catch unclear clues</li>
            <li>Check validation rules carefully (especially regex)</li>
          </ul>

          <h4>Performance</h4>
          <ul>
            <li>Scenarios with 15-25 nodes work best for most groups</li>
            <li>Very large scenarios (50+ nodes) may have performance issues</li>
            <li>Keep story text concise for faster reading</li>
          </ul>
        </>
      )
    }
  ];

  return (
    <div className="page docs-page">
      <div className="docs-container">
        <div className="docs-header">
          <BookOpen size={48} strokeWidth={2} />
          <h1>LockStep Documentation</h1>
          <p className="docs-subtitle">
            Everything you need to create, host, and play collaborative scavenger hunts
          </p>
        </div>

        <div className="docs-content">
          {sections.map((section) => {
            const Icon = section.icon;
            const isOpen = openSection === section.id;
            
            return (
              <div key={section.id} className={`docs-section ${isOpen ? 'open' : ''}`}>
                <button
                  className="docs-section-header"
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="docs-section-title">
                    <Icon size={20} />
                    <span>{section.title}</span>
                  </div>
                  {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                
                {isOpen && (
                  <div className="docs-section-body">
                    {section.content}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="docs-footer">
          <p>
            Need more help? Visit the <button className="link-btn" onClick={() => window.location.href='/contact'}>Contact</button> page
            or check out our <a href="https://github.com/yourusername/lockstep" target="_blank" rel="noopener noreferrer">GitHub repository</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
