import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Rocket, X, ChevronDown, FolderOpen, Diamond, GripVertical, Plus, Play, Puzzle, GitFork, Trophy, Skull, AlertTriangle, CheckCircle2, Eye, Settings, Sparkles } from 'lucide-react';
import ReactFlow, {
  Background, Controls, MiniMap, Panel,
  addEdge, applyNodeChanges, applyEdgeChanges,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import './editor.css';

import { PuzzleNode, PUZZLE_TYPES, PUZZLE_CATEGORIES } from './nodes/PuzzleNode';
import { ChoiceNode, MAX_CHOICES } from './nodes/ChoiceNode';
import { EndpointNode } from './nodes/EndpointNode';
import { StartNode }  from './nodes/StartNode';
import { AINode } from './nodes/AINode';
import { PropertySidebar } from './sidebar/PropertySidebar';
import { exportToMvpJson, importFromMvpJson, validateGraph } from './utils/transform';
import DeployModal from './DeployModal';
import { executeAIEnhancement, listGeminiModels } from '../services/ai';

/* ── node type registry ── */
const nodeTypes = {
  start_node:    StartNode,
  puzzle_node:   PuzzleNode,
  choice_node:   ChoiceNode,
  endpoint_node: EndpointNode,
  ai_node:       AINode,
  // legacy (kept for backward compat with loaded scenarios)
  win_node:      EndpointNode,
  fail_node:     EndpointNode,
};

const defaultEdgeOptions = {
  animated: true,
  markerEnd: { type: MarkerType.ArrowClosed },
  style: { stroke: '#3b82f6' },
};

/* ── helpers ── */
let _counter = 0;
const uid = (prefix) => `${prefix}${++_counter}`;

function makeNode(type, extraPos = 0, options = {}) {
  const id = uid(type === 'start_node' ? 'S' : type === 'choice_node' ? 'C' : type === 'endpoint_node' ? 'E' : type === 'ai_node' ? 'AI' : 'P');
  const x = 120 + extraPos * 70;
  const y = 260;
  const story = { title: '', text: '', narrationText: '' };

  const dataByType = {
    start_node:    { id, location: 'Scenario Intro', story: { ...story, title: 'Mission Briefing' }, nextNodeId: '' },
    puzzle_node:   { id, location: 'New Puzzle', story, roleClues: [], puzzles: [], nextNodeId: '', backgroundImageUrl: '' },
    choice_node:   { id, location: 'New Choice', story, choices: [{ id: `${id}_C1`, label: 'Option 1', nextNodeId: '' }] },
    endpoint_node: { id, location: options.outcome === 'fail' ? 'Defeat' : 'Victory', outcome: options.outcome || 'win', story: { ...story, title: options.outcome === 'fail' ? 'Game Over' : 'You Win' }, mediaUrl: '' },
    ai_node:       { id, location: 'AI Enhancer', aiConfig: { prompt: '', enhances: ['improveText', 'addImages'] }, targetPuzzleId: '' },
  };

  const node = { id, type, position: { x, y }, data: dataByType[type] || dataByType.puzzle_node };

  // If a puzzle type was specified (from folder toolbar), pre-add a puzzle of that type
  if (type === 'puzzle_node' && options.puzzleType) {
    const pt = options.puzzleType;
    const puzzleId = `${id}_P1`;
    const puzzle = { id: puzzleId, type: pt, prompt: '', effectsOnSuccess: [], effectsOnFail: [] };
    // Type-specific defaults
    if (pt === 'choice' || pt === 'debug_select') {
      puzzle.options = [{ id: `${puzzleId}_O1`, label: 'Option 1', isCorrect: true }];
    }
    if (pt === 'input_code' || pt === 'logic_match') {
      puzzle.validation = { mode: 'exact', answer: '' };
    }
    if (pt === 'input_numeric') {
      puzzle.validation = { target: 0, tolerance: 0.5 };
    }
    if (pt === 'multi_input') {
      puzzle.validation = { fields: [{ id: 'field1', mode: 'exact', answer: '' }] };
    }
    if (pt === 'embed_validator') {
      puzzle.embed = { kind: 'phet', url: '', instructions: '' };
      puzzle.validator = { fields: [] };
    }
    if (pt === 'debug_select') {
      puzzle.code = { language: 'js', boilerplate: '', question: '' };
    }
    // Cipher types
    if (['cipher', 'emoji_cipher', 'ascii_cipher', 'binary_cipher'].includes(pt)) {
      puzzle.encodedText = '';
      puzzle.validation = { mode: 'exact', answer: '' };
    }
    if (pt === 'qr_code') {
      puzzle.imageUrl = '';
      puzzle.validation = { mode: 'exact', answer: '' };
    }
    // Location
    if (['gps_coordinate', 'landmark_id'].includes(pt)) {
      puzzle.validation = { mode: 'exact', answer: '' };
      if (pt === 'landmark_id') puzzle.imageUrl = '';
    }
    if (pt === 'directional_riddle') {
      puzzle.validation = { mode: 'exact', answer: '' };
      puzzle.gridSize = 5;
      puzzle.startLabel = 'Start';
      puzzle.directions = 'N 2\nE 3\nS 1';
    }
    // Perception
    if (pt === 'spot_difference') {
      puzzle.imageUrlA = '';
      puzzle.imageUrlB = '';
      puzzle.validation = { mode: 'exact', answer: '' };
    }
    if (pt === 'hidden_object') {
      puzzle.imageUrl = '';
      puzzle.validation = { mode: 'exact', answer: '' };
    }
    if (pt === 'audio_clue') {
      puzzle.audioUrl = '';
      puzzle.validation = { mode: 'exact', answer: '' };
    }
    // Word
    if (pt === 'word_puzzle') {
      puzzle.scrambledText = '';
      puzzle.wordMode = 'anagram';
      puzzle.tiles = null;
      puzzle.validation = { mode: 'exact', answer: '' };
    }
    // Math
    if (pt === 'latex_math') {
      puzzle.latexExpression = '';
      puzzle.validation = { mode: 'exact', answer: '' };
    }
    // Storytelling
    if (['narrative_clue', 'found_document'].includes(pt)) {
      puzzle.narrativeText = '';
      puzzle.validation = { mode: 'exact', answer: '' };
    }
    if (pt === 'red_herring') {
      puzzle.narrativeText = '';
      // Red herring auto-solves on server
    }
    if (pt === 'multi_stage_chain') {
      puzzle.stages = [{ prompt: 'Stage 1', placeholder: 'Answer…' }];
      puzzle.validation = { mode: 'exact', answer: '' };
    }
    // Code
    if (pt === 'code_editor') {
      puzzle.language = 'javascript';
      puzzle.boilerplate = '';
      puzzle.visibleTests = [];
      puzzle.hiddenTestCount = 0;
      puzzle.validation = { mode: 'exact', answer: '' };
    }

    node.data.puzzles = [puzzle];
    const ptLabel = PUZZLE_TYPES.find(p => p.value === pt)?.label || pt;
    node.data.location = ptLabel + ' Puzzle';
  }

  return node;
}

function applyAiEnhancementToNode(node, enhanced) {
  const data = { ...(node.data || {}) };
  const story = data.story || { title: '', text: '', narrationText: '' };
  const looksJsonish = (value) => {
    if (typeof value !== 'string') return false;
    const trimmed = value.trim();
    if (!trimmed) return false;
    if (trimmed.startsWith('```')) return true;
    return trimmed.startsWith('{') || trimmed.startsWith('[');
  };

  if (enhanced && typeof enhanced.story === 'object' && enhanced.story !== null) {
    data.story = { ...story, ...enhanced.story };
  }

  if (Array.isArray(enhanced?.puzzles) && enhanced.puzzles.some(p => p && typeof p.type === 'string')) {
    data.puzzles = enhanced.puzzles;
  }

  if (Array.isArray(enhanced?.roleClues) && enhanced.roleClues.some(rc => rc && typeof rc.roleId === 'string')) {
    data.roleClues = enhanced.roleClues;
  }

  if (typeof enhanced?.location === 'string' && enhanced.location.trim()) {
    data.location = enhanced.location.trim();
  }

  if (typeof enhanced?.improvedText === 'string' && enhanced.improvedText.trim() && !looksJsonish(enhanced.improvedText)) {
    data.story = { ...(data.story || story), text: enhanced.improvedText };
  }

  if (Array.isArray(enhanced?.imageDescriptions)) {
    data.aiImageDescriptions = enhanced.imageDescriptions;
  }

  if (Array.isArray(enhanced?.videoDescriptions)) {
    data.aiVideoDescriptions = enhanced.videoDescriptions;
  }

  return { ...node, data };
}

/* helper: describe what a palette entry creates */
function describeItem(item) {
  if (item.nodeType === 'start_node')    return 'The entry point of your scenario. Players begin here.';
  if (item.nodeType === 'choice_node')   return 'Presents branching options to the players.';
  if (item.nodeType === 'endpoint_node' && item.outcome === 'win')  return 'Marks a winning conclusion of the scenario.';
  if (item.nodeType === 'endpoint_node' && item.outcome === 'fail') return 'Marks a losing/failure conclusion of the scenario.';
  if (item.nodeType === 'puzzle_node' && !item.puzzleType) return 'A blank puzzle node. Add puzzle types after inserting.';
  // puzzle type descriptions
  const descs = {
    choice: 'Multiple-choice question with selectable options.',
    input_code: 'Free-text or code input validated against an answer.',
    input_numeric: 'Numeric input with configurable tolerance.',
    multi_input: 'Multiple input fields each with their own validation.',
    debug_select: 'Select the correct line in a code snippet.',
    logic_match: 'Logic/pattern matching puzzle.',
    cipher: 'Decode a cipher-encoded message.', emoji_cipher: 'Decode emoji-based cipher.',
    ascii_cipher: 'Decode ASCII art cipher.', binary_cipher: 'Decode binary-encoded text.',
    qr_code: 'Scan or decode a QR code image.',
    gps_coordinate: 'Enter GPS coordinates to solve.', landmark_id: 'Identify a landmark from an image.',
    directional_riddle: 'Follow directional clues to find an answer.',
    spot_difference: 'Find differences between two images.',
    hidden_object: 'Find hidden objects in an image.', audio_clue: 'Listen to audio and answer.',
    word_puzzle: 'Unscramble or solve a word puzzle.',
    latex_math: 'Solve a LaTeX-rendered math problem.',
    embed_validator: 'Interactive embed (e.g. PhET simulation).',
    narrative_clue: 'Read narrative text and answer a question.',
    found_document: 'Examine a found document for clues.',
    red_herring: 'A decoy puzzle — auto-solves on the server.',
    multi_stage_chain: 'Multi-step puzzle solved in sequence.',
    code_editor: 'Write and test code in a built-in editor.',
  };
  return descs[item.puzzleType] || 'Puzzle node with pre-configured type.';
}

/* ── Node Palette (left sidebar) ── */
function NodePalette({ onAddNode, onPreviewItem }) {
  const [hoveredFolder, setHoveredFolder] = useState(null);
  const [flyoutStyle, setFlyoutStyle] = useState({});
  const folderRefs = useRef({});
  const hoverTimer = useRef(null);

  // Build palette data with metadata for drag/click
  const primitiveItems = [
    { label: 'Start Point',       nodeType: 'start_node',    Icon: Play,     color: '#8b5cf6' },
    { label: 'Puzzle',            nodeType: 'puzzle_node',   Icon: Puzzle,   color: '#3b82f6' },
    { label: 'Choice',            nodeType: 'choice_node',   Icon: GitFork,  color: '#e8dcc8' },
    { label: 'AI Enhancer',       nodeType: 'ai_node',       Icon: Sparkles, color: '#f59e0b' },
    { label: 'Endpoint (Win)',    nodeType: 'endpoint_node', outcome: 'win',  Icon: Trophy, color: '#10b981' },
    { label: 'Endpoint (Fail)',   nodeType: 'endpoint_node', outcome: 'fail', Icon: Skull,  color: '#ef4444' },
  ];
  const ioItems = [
    { label: '(Work in Progress)', nodeType: null },
  ];

  const allFolders = useMemo(() => [
    { id: 'primitives', label: 'Primitives', Icon: Diamond, items: primitiveItems },
    ...PUZZLE_CATEGORIES.filter(c => c.id !== 'primitives').map(cat => ({
      id: cat.id, label: cat.label, Icon: cat.icon,
      items: cat.id === 'io'
        ? ioItems
        : PUZZLE_TYPES.filter(pt => pt.category === cat.id).map(pt => ({
            label: pt.label, nodeType: 'puzzle_node', puzzleType: pt.value,
          })),
    })),
  ], []);

  // position the flyout using fixed coords
  const showFlyout = useCallback((folderId) => {
    const el = folderRefs.current[folderId];
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setFlyoutStyle({ position: 'fixed', top: rect.top, left: rect.right + 2 });
    setHoveredFolder(folderId);
  }, []);

  const handleFolderEnter = useCallback((folderId) => {
    clearTimeout(hoverTimer.current);
    showFlyout(folderId);
  }, [showFlyout]);

  const handleFolderLeave = useCallback(() => {
    hoverTimer.current = setTimeout(() => setHoveredFolder(null), 120);
  }, []);

  const handleFlyoutEnter = useCallback(() => {
    clearTimeout(hoverTimer.current);
  }, []);

  const handleFlyoutLeave = useCallback(() => {
    hoverTimer.current = setTimeout(() => setHoveredFolder(null), 120);
  }, []);

  // Drag start — store item data on dataTransfer
  const handleDragStart = useCallback((e, item) => {
    e.dataTransfer.setData('application/lockstep-palette', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  // Click — show center modal preview with a temp node
  const handleItemClick = useCallback((item, folder) => {
    if (!item.nodeType) return;
    onPreviewItem(item, folder);
    setHoveredFolder(null);
  }, [onPreviewItem]);

  const currentFlyout = allFolders.find(f => f.id === hoveredFolder);

  return (
    <div className="node-palette">
      <div className="palette-folders">
        {allFolders.map(folder => (
          <div
            key={folder.id}
            className={`palette-folder ${hoveredFolder === folder.id ? 'active' : ''}`}
            ref={el => folderRefs.current[folder.id] = el}
            onMouseEnter={() => handleFolderEnter(folder.id)}
            onMouseLeave={handleFolderLeave}
          >
            <div className="palette-folder-btn">
              <folder.Icon size={13} />
              <span>{folder.label}</span>
              <ChevronDown size={11} className="palette-arrow" />
            </div>
          </div>
        ))}
      </div>

      {/* ── flyout (fixed position, on top of everything) ── */}
      {currentFlyout && (
        <div
          className="palette-flyout"
          style={flyoutStyle}
          onMouseEnter={handleFlyoutEnter}
          onMouseLeave={handleFlyoutLeave}
        >
          <div className="palette-flyout-title">{currentFlyout.label}</div>
          {currentFlyout.items.map((item, i) => (
            <div
              key={i}
              className={`palette-flyout-item ${!item.nodeType ? 'disabled' : ''}`}
              draggable={!!item.nodeType}
              onDragStart={(e) => handleDragStart(e, item)}
              onClick={() => handleItemClick(item, currentFlyout)}
            >
              {item.nodeType && <GripVertical size={11} className="drag-grip" />}
              {item.Icon && <item.Icon size={13} style={{ color: item.color || 'inherit', flexShrink: 0 }} />}
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── component ── */
export default function EditorPage({ initialScenario, existingDocId: propDocId, onNavigate }) {
  const [nodes, setNodes]     = useState([]);
  const [edges, setEdges]     = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [errors, setErrors]   = useState([]);
  const [showDeploy, setShowDeploy] = useState(false);
  const [docId, setDocId]     = useState(propDocId || null);
  const [aiRuns, setAiRuns]   = useState({});
  const [aiSessionKeys, setAiSessionKeys] = useState({});
  const [aiModelsByNode, setAiModelsByNode] = useState({});
  const [aiModelsLoading, setAiModelsLoading] = useState({});
  const [fallbackModels, setFallbackModels] = useState(null);
  const [fallbackModelsLoading, setFallbackModelsLoading] = useState(false);
  const [fallbackCredits, setFallbackCredits] = useState(3);
  const [palettePreview, setPalettePreview] = useState(null); // { item, folder }
  const [previewData, setPreviewData] = useState(null);       // temp node data
  const [showNodePreview, setShowNodePreview] = useState(false); // F-key preview mode
  const [showGlobalSettings, setShowGlobalSettings] = useState(false); // global settings modal
  const [globalSettings, setGlobalSettings] = useState({
    timeLimit: 0,
    resources: [
      { id: 'water', label: 'Water', initialValue: 100, decreaseOnFail: 10, continuousIncrease: 0.15 },
      { id: 'oxygen', label: 'Oxygen', initialValue: 100, decreaseOnFail: 10, continuousIncrease: 0 }
    ]
  });
  const fileRef               = useRef(null);

  /* ── load initial scenario from props (e.g. from Browse → Edit) ── */
  useEffect(() => {
    if (initialScenario?.scenarioJson) {
      try {
        const { nodes: n, edges: e, globalSettings: gs } = importFromMvpJson(initialScenario.scenarioJson);
        _counter = n.length + 10;
        setNodes(n);
        setEdges(e);
        if (gs) setGlobalSettings(gs);
        setSelectedId(null);
        setErrors([]);
        // Clear autosave after loading a scenario
        localStorage.removeItem('lockstep_editor_autosave');
      } catch { /* ignore bad data */ }
    } else {
      // Try to restore from autosave if no initial scenario
      try {
        const autosave = localStorage.getItem('lockstep_editor_autosave');
        if (autosave) {
          const parsed = JSON.parse(autosave);
          if (parsed.nodes && parsed.edges) {
            setNodes(parsed.nodes);
            setEdges(parsed.edges);
            if (parsed.globalSettings) setGlobalSettings(parsed.globalSettings);
            _counter = parsed.nodes.length + 10;
          }
        }
      } catch { /* ignore corrupted autosave */ }
    }
  }, []); // run once on mount

  /* ── Autosave to localStorage whenever editor state changes ── */
  useEffect(() => {
    // Only autosave if there's content and no initial scenario (draft mode)
    if (nodes.length > 0 && !initialScenario?.scenarioJson) {
      const autosaveData = {
        nodes,
        edges,
        globalSettings,
        timestamp: Date.now()
      };
      localStorage.setItem('lockstep_editor_autosave', JSON.stringify(autosaveData));
    }
  }, [nodes, edges, globalSettings, initialScenario]);

  /* derived selected node — always fresh from nodes array */
  const selected = useMemo(() => nodes.find(n => n.id === selectedId) || null, [nodes, selectedId]);

  const lockedNodeIds = useMemo(() => {
    const locked = new Set();
    Object.values(aiRuns).forEach(run => {
      if (run?.status === 'running' && run?.targetId) locked.add(run.targetId);
    });
    return locked;
  }, [aiRuns]);

  const isNodeLocked = useCallback((nodeId) => lockedNodeIds.has(nodeId), [lockedNodeIds]);

  /* ── Clipboard state for copy/paste/cut ── */
  const [clipboard, setClipboard] = useState(null);
  const [copiedNodeId, setCopiedNodeId] = useState(null);

  /* ── Keyboard shortcuts: F (preview), Ctrl+C/X/V/D (copy/cut/paste/duplicate) ── */
  useEffect(() => {
    const handleKeyDown = (e) => {
      const active = document.activeElement;
      const isTyping = !!active && (
        active.tagName === 'INPUT' ||
        active.tagName === 'TEXTAREA' ||
        active.tagName === 'SELECT' ||
        active.isContentEditable
      );

      // F-key preview
      if (e.key === 'f' || e.key === 'F') {
        if (selected && !showNodePreview && !isTyping) {
          e.preventDefault();
          setShowNodePreview(true);
        }
      }
      if (e.key === 'Escape' && showNodePreview) {
        setShowNodePreview(false);
      }

      // Ctrl+C: Copy selected node
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && !isTyping && selected) {
        e.preventDefault();
        if (isNodeLocked(selected.id)) return;
        setClipboard({ ...selected });
        setCopiedNodeId(selected.id);
        // Visual feedback
        setTimeout(() => setCopiedNodeId(null), 1000);
      }

      // Ctrl+X: Cut selected node
      if ((e.ctrlKey || e.metaKey) && e.key === 'x' && !isTyping && selected) {
        e.preventDefault();
        if (isNodeLocked(selected.id)) return;
        setClipboard({ ...selected });
        setCopiedNodeId(selected.id);
        deleteSelected();
      }

      // Ctrl+V: Paste from clipboard
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && !isTyping && clipboard) {
        e.preventDefault();
        const newNode = { 
          ...clipboard, 
          id: uid(clipboard.type === 'start_node' ? 'S' : clipboard.type === 'choice_node' ? 'C' : clipboard.type === 'endpoint_node' ? 'E' : clipboard.type === 'ai_node' ? 'AI' : 'P'),
          position: { 
            x: clipboard.position.x + 40, 
            y: clipboard.position.y + 40 
          },
          data: { 
            ...clipboard.data, 
            id: uid(clipboard.type === 'start_node' ? 'S' : clipboard.type === 'choice_node' ? 'C' : clipboard.type === 'endpoint_node' ? 'E' : clipboard.type === 'ai_node' ? 'AI' : 'P')
          }
        };
        setNodes(nds => [...nds, newNode]);
        setSelectedId(newNode.id);
        setCopiedNodeId(null);
      }

      // Ctrl+D: Duplicate selected node
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && !isTyping && selected) {
        e.preventDefault();
        if (isNodeLocked(selected.id)) return;
        const newNode = { 
          ...selected, 
          id: uid(selected.type === 'start_node' ? 'S' : selected.type === 'choice_node' ? 'C' : selected.type === 'endpoint_node' ? 'E' : selected.type === 'ai_node' ? 'AI' : 'P'),
          position: { 
            x: selected.position.x + 40, 
            y: selected.position.y + 40 
          },
          data: { 
            ...selected.data, 
            id: uid(selected.type === 'start_node' ? 'S' : selected.type === 'choice_node' ? 'C' : selected.type === 'endpoint_node' ? 'E' : selected.type === 'ai_node' ? 'AI' : 'P')
          }
        };
        setNodes(nds => [...nds, newNode]);
        setSelectedId(newNode.id);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selected, showNodePreview, clipboard, isNodeLocked, deleteSelected]);

  /* ── React Flow handlers (use built-in apply helpers) ── */
  const onNodesChange = useCallback((changes) => {
    const filtered = changes.filter(change => {
      if (!isNodeLocked(change.id)) return true;
      return !['position', 'dimensions', 'remove'].includes(change.type);
    });
    setNodes(nds => applyNodeChanges(filtered, nds));
  }, [isNodeLocked]);

  const onEdgesChange = useCallback((changes) => {
    setEdges(eds => applyEdgeChanges(changes, eds));
  }, []);

  const onConnect = useCallback((params) => {
    if (isNodeLocked(params.source) || isNodeLocked(params.target)) return;
    // Remove any existing edge from the same source handle (prevent 1→many)
    setEdges(eds => {
      const filtered = eds.filter(e =>
        !(e.source === params.source && (e.sourceHandle || null) === (params.sourceHandle || null))
      );
      return addEdge({ ...params, ...defaultEdgeOptions }, filtered);
    });
    
    // Update node data based on connection type
    setNodes(nds => nds.map(n => {
      // Source node updates
      if (n.id === params.source) {
        // AI node connecting to puzzle node
        if (n.type === 'ai_node' && params.targetHandle === 'ai-input') {
          return { ...n, data: { ...n.data, targetPuzzleId: params.target } };
        }
        // Regular flow connections
        if (n.type === 'puzzle_node' || n.type === 'start_node') {
          return { ...n, data: { ...n.data, nextNodeId: params.target } };
        }
        // choice node — per-choice handle (id = "choice-<idx>")
        if (n.type === 'choice_node' && params.sourceHandle?.startsWith('choice-')) {
          const idx = parseInt(params.sourceHandle.split('-')[1], 10);
          const choices = (n.data.choices || []).map((c, i) =>
            i === idx ? { ...c, nextNodeId: params.target } : c
          );
          return { ...n, data: { ...n.data, choices } };
        }
      }
      
      // Target node updates (currently none needed for puzzle nodes)
      // AI connections are tracked via AI node's targetPuzzleId
      
      return n;
    }));
  }, [isNodeLocked]);

  const onNodeClick = useCallback((_evt, node) => {
    setSelectedId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedId(null);
  }, []);

  /* ── data updates from sidebar ── */
  const updateSelectedData = useCallback((updates) => {
    if (!selectedId || isNodeLocked(selectedId)) return;
    setNodes(nds => nds.map(n => n.id === selectedId ? { ...n, data: { ...n.data, ...updates } } : n));
  }, [selectedId, isNodeLocked]);

  /* ── delete selected node + its edges ── */
  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    if (isNodeLocked(selectedId)) return;
    setNodes(nds => nds.filter(n => n.id !== selectedId));
    setEdges(eds => eds.filter(e => e.source !== selectedId && e.target !== selectedId));
    setSelectedId(null);
  }, [selectedId, isNodeLocked]);

  const handleAiSessionKeyChange = useCallback((aiNodeId, value) => {
    setAiSessionKeys(prev => ({ ...prev, [aiNodeId]: value }));
  }, []);

  const handleListModels = useCallback(async (aiNodeId) => {
    const apiKey = (aiSessionKeys[aiNodeId] || '').trim();
    if (!apiKey) {
      setAiModelsByNode(prev => ({
        ...prev,
        [aiNodeId]: { error: 'Enter an API key to list models for your account.' }
      }));
      return;
    }

    setAiModelsLoading(prev => ({ ...prev, [aiNodeId]: true }));
    try {
      const models = await listGeminiModels({ apiKey });
      setAiModelsByNode(prev => ({
        ...prev,
        [aiNodeId]: { items: models }
      }));
      const firstModel = models[0]?.normalizedName || models[0]?.name;
      if (firstModel) {
        setNodes(nds => nds.map(n => {
          if (n.id !== aiNodeId) return n;
          const aiConfig = n.data?.aiConfig || {};
          if (aiConfig.model) return n;
          return { ...n, data: { ...n.data, aiConfig: { ...aiConfig, model: firstModel } } };
        }));
      }
    } catch (error) {
      setAiModelsByNode(prev => ({
        ...prev,
        [aiNodeId]: { error: error.message || 'Failed to list models.' }
      }));
    } finally {
      setAiModelsLoading(prev => ({ ...prev, [aiNodeId]: false }));
    }
  }, [aiSessionKeys]);

  const ensureFallbackModels = useCallback(async () => {
    if (fallbackModelsLoading) return fallbackModels || [];
    if (fallbackModels && fallbackModels.length > 0) return fallbackModels;

    setFallbackModelsLoading(true);
    try {
      const models = await listGeminiModels();
      const normalized = models.map(m => m.normalizedName || m.name).filter(Boolean);
      setFallbackModels(normalized);
      return normalized;
    } catch (error) {
      setFallbackModels([]);
      return [];
    } finally {
      setFallbackModelsLoading(false);
    }
  }, [fallbackModels, fallbackModelsLoading]);

  const handleAIPlay = useCallback(async (aiNodeId) => {
    const aiNode = nodes.find(n => n.id === aiNodeId);
    if (!aiNode) return;

    const prompt = aiNode.data?.aiConfig?.prompt?.trim();
    if (!prompt) {
      setAiRuns(prev => ({ ...prev, [aiNodeId]: { status: 'error', message: 'Add instructions first.' } }));
      return;
    }

    const targetId = aiNode.data?.targetPuzzleId?.trim();
    if (!targetId) {
      setAiRuns(prev => ({ ...prev, [aiNodeId]: { status: 'error', message: 'Connect a puzzle node.' } }));
      return;
    }

    const targetNode = nodes.find(n => n.id === targetId);
    if (!targetNode) {
      setAiRuns(prev => ({ ...prev, [aiNodeId]: { status: 'error', message: 'Target node missing.' } }));
      return;
    }

    if (targetNode.type !== 'puzzle_node') {
      setAiRuns(prev => ({ ...prev, [aiNodeId]: { status: 'error', message: 'Target must be a puzzle node.' } }));
      return;
    }

    const sessionKey = (aiSessionKeys[aiNodeId] || '').trim();
    const selectedModel = aiNode.data?.aiConfig?.model || '';

    const runEnhancement = async ({ apiKey, usingFallback, modelFallbacks }) => {
      setAiRuns(prev => ({
        ...prev,
        [aiNodeId]: {
          status: 'running',
          targetId,
          message: usingFallback
            ? `Enhancing ${targetId} (shared credits)...`
            : `Enhancing ${targetId}...`
        }
      }));

      const result = await executeAIEnhancement(aiNode.data, targetNode.data, {
        apiKey,
        model: selectedModel || undefined,
        modelFallbacks
      });
      if (!result?.success) throw new Error(result?.error || 'AI enhancement failed');

      const enhanced = result.data || {};
      setNodes(nds => nds.map(n => n.id === targetId ? applyAiEnhancementToNode(n, enhanced) : n));

      setAiRuns(prev => ({
        ...prev,
        [aiNodeId]: { status: 'success', targetId, message: `Updated ${targetId}.` }
      }));
    };

    try {
      if (sessionKey) {
        const sessionModels = aiModelsByNode[aiNodeId]?.items || [];
        const sessionFallbacks = sessionModels.map(m => m.normalizedName || m.name).filter(Boolean);
        if (sessionFallbacks.length === 0 && !selectedModel) {
          throw new Error('No available models. Click "List Models" and select one.');
        }
        await runEnhancement({
          apiKey: sessionKey,
          usingFallback: false,
          modelFallbacks: sessionFallbacks
        });
        return;
      }

      if (fallbackCredits <= 0) {
        setAiRuns(prev => ({
          ...prev,
          [aiNodeId]: { status: 'error', targetId, message: 'Shared credits exhausted. Enter your own API key.' }
        }));
        return;
      }

      const fallbackList = await ensureFallbackModels();
      if (fallbackList.length === 0 && !selectedModel) {
        throw new Error('No available fallback models. Configure a model with your own API key.');
      }
      setFallbackCredits(prev => Math.max(0, prev - 1));
      await runEnhancement({
        apiKey: null,
        usingFallback: true,
        modelFallbacks: fallbackList
      });
    } catch (error) {
      if (sessionKey && fallbackCredits > 0) {
        const fallbackList = await ensureFallbackModels();
        if (fallbackList.length === 0 && !selectedModel) {
          setAiRuns(prev => ({
            ...prev,
            [aiNodeId]: { status: 'error', targetId, message: 'No available fallback models.' }
          }));
          return;
        }
        setFallbackCredits(prev => Math.max(0, prev - 1));
        try {
          await runEnhancement({
            apiKey: null,
            usingFallback: true,
            modelFallbacks: fallbackList
          });
          return;
        } catch (fallbackError) {
          setAiRuns(prev => ({
            ...prev,
            [aiNodeId]: { status: 'error', targetId, message: fallbackError.message || 'AI failed.' }
          }));
          return;
        }
      }

      setAiRuns(prev => ({
        ...prev,
        [aiNodeId]: { status: 'error', targetId, message: error.message || 'AI failed.' }
      }));
    }
  }, [nodes, aiSessionKeys, fallbackCredits, aiModelsByNode, ensureFallbackModels]);

  /* Add selected prop to nodes for styling */
  const nodesWithSelection = useMemo(() => {
    return nodes.map(node => ({
      ...node,
      selected: node.id === selectedId,
      className: node.id === copiedNodeId ? 'copied-flash' : '',
      data: node.type === 'ai_node'
        ? { ...node.data, aiRuntime: aiRuns[node.id], onPlay: handleAIPlay }
        : node.data,
    }));
  }, [nodes, selectedId, copiedNodeId, aiRuns, handleAIPlay]);

  /* ── add node ── */
  const addNode = useCallback((type, options = {}) => {
    const n = makeNode(type, nodes.length, options);
    setNodes(nds => [...nds, n]);
    setSelectedId(n.id);
  }, [nodes.length]);

  /* ── drop from palette ── */
  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('application/lockstep-palette');
    if (!raw) return;
    try {
      const item = JSON.parse(raw);
      if (!item.nodeType) return;
      const opts = {};
      if (item.outcome) opts.outcome = item.outcome;
      if (item.puzzleType) opts.puzzleType = item.puzzleType;
      const n = makeNode(item.nodeType, 0, opts);
      
      // Get the drop position relative to the ReactFlow canvas
      const reactFlowBounds = e.currentTarget.getBoundingClientRect();
      n.position = {
        x: e.clientX - reactFlowBounds.left,
        y: e.clientY - reactFlowBounds.top
      };
      
      setNodes(nds => [...nds, n]);
      setSelectedId(n.id);
    } catch { /* ignore bad data */ }
  }, []);

  /* ── palette click preview ── */
  const handlePreviewItem = useCallback((item, folder) => {
    const opts = {};
    if (item.outcome) opts.outcome = item.outcome;
    if (item.puzzleType) opts.puzzleType = item.puzzleType;
    const tempNode = makeNode(item.nodeType, 0, opts);
    setPalettePreview({ item, folder });
    setPreviewData(tempNode.data);
  }, []);

  const handlePreviewInsert = useCallback(() => {
    if (!palettePreview || !previewData) return;
    const { item } = palettePreview;
    const opts = {};
    if (item.outcome) opts.outcome = item.outcome;
    if (item.puzzleType) opts.puzzleType = item.puzzleType;
    const n = makeNode(item.nodeType, 0, opts);
    n.data = { ...n.data, ...previewData };
    setNodes(nds => [...nds, { ...n, position: { x: 120 + nds.length * 70, y: 260 } }]);
    setSelectedId(n.id);
    setPalettePreview(null);
    setPreviewData(null);
  }, [palettePreview, previewData]);

  const closePreview = useCallback(() => {
    setPalettePreview(null);
    setPreviewData(null);
  }, []);

  /* ── validation ── */
  const runValidation = useCallback(() => {
    return validateGraph(nodes, edges);
  }, [nodes, edges]);

  /* ── export (blocked if validation fails) ── */
  const handleExport = useCallback(() => {
    const errs = runValidation();
    setErrors(errs);
    if (errs.length > 0) return;

    const json = exportToMvpJson(nodes, edges);
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'mvp-export.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges, runValidation]);

  /* ── import ── */
  const handleImport = useCallback((evt) => {
    const file = evt.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result);
        const { nodes: n, edges: e, globalSettings: gs } = importFromMvpJson(json);
        _counter = n.length + 10; // avoid id clashes
        setNodes(n);
        setEdges(e);
        if (gs) setGlobalSettings(gs);
        setSelectedId(null);
        setErrors([]);
      } catch {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
    evt.target.value = ''; // allow re-import of same file
  }, []);

  /* ── deploy to Firestore ── */
  const handleDeploy = useCallback(() => {
    const errs = runValidation();
    setErrors(errs);
    if (errs.length > 0) return;
    setShowDeploy(true);
  }, [runValidation]);

  /* ── render ── */
  const validationSummary = errors.length > 0 ? errors : null;

  /* ── live readiness checklist ── */
  const readinessChecks = useMemo(() => {
    const checks = [];
    const startNodes = nodes.filter(n => n.type === 'start_node');
    const winNodes = nodes.filter(n =>
      n.type === 'win_node' || (n.type === 'endpoint_node' && n.data.outcome === 'win')
    );
    const puzzleNodes = nodes.filter(n => n.type === 'puzzle_node');
    const connectedIds = new Set();
    for (const e of edges) { connectedIds.add(e.source); connectedIds.add(e.target); }
    const orphans = nodes.length > 1
      ? nodes.filter(n => !connectedIds.has(n.id))
      : [];
    const unconnectedPuzzle = puzzleNodes.filter(n => !n.data.nextNodeId);
    const unconnectedStart = startNodes.filter(n => !n.data.nextNodeId);

    checks.push({ ok: startNodes.length === 1, label: startNodes.length === 1 ? 'Start node' : startNodes.length === 0 ? 'Add a Start node' : 'Only 1 Start node allowed' });
    checks.push({ ok: winNodes.length >= 1, label: winNodes.length >= 1 ? 'Win endpoint' : 'Add a Win endpoint' });
    checks.push({ ok: orphans.length === 0, label: orphans.length === 0 ? 'All nodes connected' : `${orphans.length} orphan node(s)` });
    checks.push({ ok: unconnectedStart.length === 0 && unconnectedPuzzle.length === 0, label: unconnectedStart.length === 0 && unconnectedPuzzle.length === 0 ? 'All nodes have next' : `${unconnectedStart.length + unconnectedPuzzle.length} node(s) need connections` });

    return checks;
  }, [nodes, edges]);

  const allReady = readinessChecks.every(c => c.ok);

  return (
    <div className="editor-page">
      {/* ── header bar ── */}
      <div className="editor-header">
        <div className="editor-header-left">
          {onNavigate && (
            <button className="btn btn-sm btn-ghost" onClick={() => onNavigate('home')}>← Back</button>
          )}
          <h1>LockStep Scenario Editor</h1>
          {selected && (
            <span className="preview-hint-badge" title="Press F to preview this node">
              <Eye size={12} /> Press F
            </span>
          )}
        </div>
        <div className="editor-actions">
          <button className="btn btn-sm" onClick={() => setShowGlobalSettings(true)}>
            <Settings size={14} /> Settings
          </button>
          <label className="btn btn-sm file-btn">
            Import
            <input ref={fileRef} type="file" accept=".json,application/json" onChange={handleImport} />
          </label>
          <button className="btn btn-sm" onClick={handleExport}>Export JSON</button>
          <div className="toolbar-sep"></div>
          <button className="btn btn-sm btn-deploy" onClick={handleDeploy}><Rocket size={14} /> Deploy</button>
        </div>
      </div>

      {/* ── validation banner ── */}
      {validationSummary && (
        <div className="validation-banner">
          <button className="banner-close" onClick={() => setErrors([])} aria-label="Dismiss"><X size={16} /></button>
          <strong>Cannot export — fix these issues:</strong>
          <ul>{validationSummary.map((e, i) => <li key={i}>{e}</li>)}</ul>
        </div>
      )}

      {/* ── body ── */}
      <div className="editor-body">
        <NodePalette 
          onAddNode={addNode} 
          onPreviewItem={handlePreviewItem}
        />
        <div className="editor-canvas">
          <ReactFlow
            nodes={nodesWithSelection}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onDragOver={onDragOver}
            onDrop={onDrop}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            fitView
            snapToGrid
            snapGrid={[16, 16]}
            deleteKeyCode={['Backspace', 'Delete']}
            multiSelectionKeyCode="Shift"
          >
            <Background variant="dots" gap={16} size={1} color="#c0977a" />
            <Controls position="bottom-left" />
            <MiniMap
              pannable
              zoomable
              nodeColor={(n) => {
                if (n.type === 'start_node') return '#a371f7';
                if (n.type === 'endpoint_node' || n.type === 'win_node')  return n.data?.outcome === 'fail' ? '#e85d52' : '#4a6b54';
                if (n.type === 'fail_node') return '#e85d52';
                if (n.type === 'choice_node') return '#e8dcc8';
                return '#374E44';
              }}
              style={{ background: '#3d3a31' }}
            />
            <Panel position="top-right">
              <div className="readiness-widget">
                <div className="readiness-header">
                  {allReady ? <CheckCircle2 size={14} style={{ color: '#4a6b54' }} /> : <AlertTriangle size={14} style={{ color: '#f59e0b' }} />}
                  <span>{allReady ? 'Ready to export' : 'Not ready'}</span>
                </div>
                <div className="readiness-checks">
                  {readinessChecks.map((c, i) => (
                    <div key={i} className={`readiness-item ${c.ok ? 'ok' : 'missing'}`}>
                      <span className="readiness-dot">{c.ok ? '✓' : '○'}</span>
                      <span>{c.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
            <Panel position="bottom-right">
              <div className="shortcuts-panel">
                <div className="shortcuts-title">⌨️ Shortcuts</div>
                <div className="shortcuts-list">
                  <div className="shortcut-item">
                    <kbd>Ctrl+C</kbd>
                    <span>Copy</span>
                  </div>
                  <div className="shortcut-item">
                    <kbd>Ctrl+X</kbd>
                    <span>Cut</span>
                  </div>
                  <div className="shortcut-item">
                    <kbd>Ctrl+V</kbd>
                    <span>Paste</span>
                  </div>
                  <div className="shortcut-item">
                    <kbd>Ctrl+D</kbd>
                    <span>Duplicate</span>
                  </div>
                  <div className="shortcut-item">
                    <kbd>F</kbd>
                    <span>Preview</span>
                  </div>
                  <div className="shortcut-item">
                    <kbd>Del</kbd>
                    <span>Delete</span>
                  </div>
                </div>
              </div>
            </Panel>
          </ReactFlow>
        </div>

        <PropertySidebar
          selected={selected}
          onUpdate={updateSelectedData}
          onDelete={deleteSelected}
          globalSettings={globalSettings}
          onUpdateGlobalSettings={setGlobalSettings}
          aiSessionKey={selected ? aiSessionKeys[selected.id] : ''}
          onAiSessionKeyChange={(value) => selected && handleAiSessionKeyChange(selected.id, value)}
          aiModels={selected ? aiModelsByNode[selected.id] : null}
          onListModels={() => selected && handleListModels(selected.id)}
          aiModelsLoading={selected ? !!aiModelsLoading[selected.id] : false}
          fallbackCredits={fallbackCredits}
          aiRuntime={selected ? aiRuns[selected.id] : null}
        />
      </div>

      {/* ── node preview modal (F-key) —— */}
      {showNodePreview && selected && (
        <div className="preview-modal-overlay" onClick={() => setShowNodePreview(false)}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="preview-modal-header">
              <div className="preview-modal-title">
                <Eye size={18} />
                Node Preview — {selected.data?.story?.title || selected.data?.location || selected.id}
              </div>
              <button className="preview-close" onClick={() => setShowNodePreview(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="preview-modal-body">
              <div className="preview-info">
                <strong>Type:</strong> {selected.type?.replace('_', ' ') || 'Unknown'}
              </div>
              {selected.data?.story?.text && (
                <div className="preview-section">
                  <div className="preview-label">Story Text:</div>
                  <div className="preview-content">{selected.data.story.text}</div>
                </div>
              )}
              {selected.data?.story?.narrationText && (
                <div className="preview-section">
                  <div className="preview-label">Narration:</div>
                  <div className="preview-content narration">{selected.data.story.narrationText}</div>
                </div>
              )}
              {selected.type === 'puzzle_node' && selected.data?.puzzles?.length > 0 && (
                <div className="preview-section">
                  <div className="preview-label">Puzzles ({selected.data.puzzles.length}):</div>
                  {selected.data.puzzles.map((p, i) => (
                    <div key={i} className="preview-puzzle">
                      <div className="preview-puzzle-type">{p.type || 'Unknown'}</div>
                      {p.prompt && <div className="preview-puzzle-prompt">{p.prompt}</div>}
                      {p.imageUrl && <img src={p.imageUrl} alt="Puzzle" className="preview-puzzle-img" />}
                      {p.embed && (
                        <div className="preview-embed-info">
                          🔗 {p.embed.kind}: {p.embed.url || 'No URL'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {selected.type === 'choice_node' && selected.data?.choices?.length > 0 && (
                <div className="preview-section">
                  <div className="preview-label">Choices:</div>
                  {selected.data.choices.map((c, i) => (
                    <div key={i} className="preview-choice">
                      {i + 1}. {c.label || 'Unlabeled'}
                    </div>
                  ))}
                </div>
              )}
              <div className="preview-hint">
                <strong>Hint:</strong> Press <kbd>F</kbd> anytime to preview a selected node. Press <kbd>Esc</kbd> to close.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── deploy modal ── */}
      {showDeploy && (
        <DeployModal
          scenarioJson={exportToMvpJson(nodes, edges, globalSettings)}
          existingDocId={docId}
          nodes={nodes}
          edges={edges}
          onClose={() => setShowDeploy(false)}
          onDeployed={(id) => { setDocId(id); alert('Scenario deployed successfully!'); }}
        />
      )}

      {/* ── palette preview modal (center overlay) ── */}
      {palettePreview && previewData && (
        <div className="palette-modal-overlay" onClick={closePreview}>
          <div className="palette-modal" onClick={e => e.stopPropagation()}>
            <div className="palette-modal-header">
              <div>
                <span className="palette-modal-title">{palettePreview.item.label}</span>
                <span className="palette-modal-cat">{palettePreview.folder.label}</span>
              </div>
              <button className="btn-xs btn-ghost" onClick={closePreview}><X size={16} /></button>
            </div>
            <p className="palette-modal-desc">{describeItem(palettePreview.item)}</p>
            <div className="palette-modal-body">
              <PropertySidebar
                selected={{ id: previewData.id, type: palettePreview.item.nodeType, data: previewData }}
                onUpdate={(updates) => setPreviewData(d => ({ ...d, ...updates }))}
                onDelete={closePreview}
                embedded
              />
            </div>
            <div className="palette-modal-footer">
              <button className="btn btn-sm" onClick={closePreview}>Cancel</button>
              <button className="btn btn-sm btn-primary" onClick={handlePreviewInsert}>
                <Plus size={14} /> Insert Node
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Global Settings Modal ── */}
      {showGlobalSettings && (
        <div className="preview-modal-overlay" onClick={() => setShowGlobalSettings(false)}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="preview-modal-header">
              <div className="preview-modal-title">
                <Settings size={18} />
                Global Settings
              </div>
              <button className="preview-close" onClick={() => setShowGlobalSettings(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="preview-modal-body">
              <div className="form-group">
                <label className="label">Time Limit (minutes, 0 = no limit)</label>
                <input
                  type="number"
                  className="input"
                  value={globalSettings?.timeLimit || 0}
                  onChange={e => setGlobalSettings({ ...globalSettings, timeLimit: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>

              <div className="form-group">
                <label className="label">Resource Variables</label>
                <p className="sidebar-hint" style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                  Track resources that change based on failures and/or time. Maximum 2 resources.
                </p>
                {(globalSettings?.resources || []).map((resource, idx) => (
                  <div key={resource.id} style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(74,69,60,0.3)', borderRadius: '4px' }}>
                    <div className="resource-row" style={{ marginBottom: '0.5rem' }}>
                      <input
                        className="input"
                        placeholder="Label (e.g., Water)"
                        value={resource.label}
                        onChange={e => {
                          const updated = [...(globalSettings?.resources || [])];
                          updated[idx] = { ...resource, label: e.target.value };
                          setGlobalSettings({ ...globalSettings, resources: updated });
                        }}
                        style={{ flex: 2 }}
                      />
                      <input
                        type="number"
                        className="input"
                        placeholder="Initial"
                        value={resource.initialValue}
                        onChange={e => {
                          const updated = [...(globalSettings?.resources || [])];
                          updated[idx] = { ...resource, initialValue: parseInt(e.target.value) || 0 };
                          setGlobalSettings({ ...globalSettings, resources: updated });
                        }}
                        style={{ flex: 1 }}
                      />
                      <button
                        className="btn btn-xs btn-ghost"
                        onClick={() => {
                          const updated = (globalSettings?.resources || []).filter((_, i) => i !== idx);
                          setGlobalSettings({ ...globalSettings, resources: updated });
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                    <div className="resource-row">
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Fail Penalty</label>
                        <input
                          type="number"
                          className="input"
                          placeholder="-Δ fail"
                          value={resource.decreaseOnFail}
                          onChange={e => {
                            const updated = [...(globalSettings?.resources || [])];
                            updated[idx] = { ...resource, decreaseOnFail: parseInt(e.target.value) || 0 };
                            setGlobalSettings({ ...globalSettings, resources: updated });
                          }}
                        />
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Time Increase (per sec)</label>
                        <input
                          type="number"
                          className="input"
                          placeholder="+Δ time"
                          step="0.01"
                          value={resource.continuousIncrease || 0}
                          onChange={e => {
                            const updated = [...(globalSettings?.resources || [])];
                            updated[idx] = { ...resource, continuousIncrease: parseFloat(e.target.value) || 0 };
                            setGlobalSettings({ ...globalSettings, resources: updated });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  className="btn btn-xs"
                  onClick={() => {
                    const newId = `resource${(globalSettings?.resources || []).length + 1}`;
                    setGlobalSettings({
                      ...globalSettings,
                      resources: [...(globalSettings?.resources || []), { id: newId, label: 'Resource', initialValue: 100, decreaseOnFail: 10, continuousIncrease: 0 }]
                    });
                  }}
                  disabled={(globalSettings?.resources || []).length >= 2}
                  style={{ marginTop: '0.5rem' }}
                >
                  + Add Resource
                </button>
              </div>
            </div>
            <div className="palette-modal-footer">
              <button className="btn btn-sm btn-primary" onClick={() => setShowGlobalSettings(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
