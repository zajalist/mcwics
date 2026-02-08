import React, { useCallback, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  Background, Controls, MiniMap, Panel,
  addEdge, applyNodeChanges, applyEdgeChanges,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import './editor.css';

import { PuzzleNode } from './nodes/PuzzleNode';
import { ChoiceNode, MAX_CHOICES } from './nodes/ChoiceNode';
import { WinNode }    from './nodes/WinNode';
import { FailNode }   from './nodes/FailNode';
import { StartNode }  from './nodes/StartNode';
import { PropertySidebar } from './sidebar/PropertySidebar';
import { exportToMvpJson, importFromMvpJson, validateGraph } from './utils/transform';

/* ── node type registry ── */
const nodeTypes = {
  start_node:  StartNode,
  puzzle_node: PuzzleNode,
  choice_node: ChoiceNode,
  win_node:    WinNode,
  fail_node:   FailNode,
};

const defaultEdgeOptions = {
  animated: true,
  markerEnd: { type: MarkerType.ArrowClosed },
  style: { stroke: '#3b82f6' },
};

/* ── helpers ── */
let _counter = 0;
const uid = (prefix) => `${prefix}${++_counter}`;

function makeNode(type, extraPos = 0) {
  const id = uid(type === 'start_node' ? 'S' : type === 'choice_node' ? 'C' : type === 'win_node' ? 'W' : type === 'fail_node' ? 'F' : 'P');
  const x = 120 + extraPos * 70;
  const y = 260;
  const story = { title: '', text: '', narrationText: '' };

  const dataByType = {
    start_node:   { id, location: 'Scenario Intro', story: { ...story, title: 'Mission Briefing' }, nextNodeId: '' },
    puzzle_node:  { id, location: 'New Puzzle', story, roleClues: [], puzzles: [], nextNodeId: '' },
    choice_node:  { id, location: 'New Choice', story, choices: [{ id: `${id}_C1`, label: 'Option 1', nextNodeId: '' }] },
    win_node:     { id, location: 'Victory', story: { ...story, title: 'You Win' } },
    fail_node:    { id, location: 'Defeat',  story: { ...story, title: 'Game Over' } },
  };

  return { id, type, position: { x, y }, data: dataByType[type] || dataByType.puzzle_node };
}

/* ── component ── */
export default function EditorPage() {
  const [nodes, setNodes]     = useState([]);
  const [edges, setEdges]     = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [errors, setErrors]   = useState([]);
  const fileRef               = useRef(null);

  /* derived selected node — always fresh from nodes array */
  const selected = useMemo(() => nodes.find(n => n.id === selectedId) || null, [nodes, selectedId]);

  /* ── React Flow handlers (use built-in apply helpers) ── */
  const onNodesChange = useCallback((changes) => {
    setNodes(nds => applyNodeChanges(changes, nds));
  }, []);

  const onEdgesChange = useCallback((changes) => {
    setEdges(eds => applyEdgeChanges(changes, eds));
  }, []);

  const onConnect = useCallback((params) => {
    setEdges(eds => addEdge({ ...params, ...defaultEdgeOptions }, eds));
    setNodes(nds => nds.map(n => {
      if (n.id !== params.source) return n;
      // start / puzzle node — single nextNodeId
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
      return n;
    }));
  }, []);

  const onNodeClick = useCallback((_evt, node) => {
    setSelectedId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedId(null);
  }, []);

  /* ── data updates from sidebar ── */
  const updateSelectedData = useCallback((updates) => {
    setNodes(nds => nds.map(n => n.id === selectedId ? { ...n, data: { ...n.data, ...updates } } : n));
  }, [selectedId]);

  /* ── delete selected node + its edges ── */
  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    setNodes(nds => nds.filter(n => n.id !== selectedId));
    setEdges(eds => eds.filter(e => e.source !== selectedId && e.target !== selectedId));
    setSelectedId(null);
  }, [selectedId]);

  /* ── add node ── */
  const addNode = useCallback((type) => {
    const n = makeNode(type, nodes.length);
    setNodes(nds => [...nds, n]);
    setSelectedId(n.id);
  }, [nodes.length]);

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
        const { nodes: n, edges: e } = importFromMvpJson(json);
        _counter = n.length + 10; // avoid id clashes
        setNodes(n);
        setEdges(e);
        setSelectedId(null);
        setErrors([]);
      } catch {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
    evt.target.value = ''; // allow re-import of same file
  }, []);

  /* ── render ── */
  const validationSummary = errors.length > 0 ? errors : null;

  return (
    <div className="editor-page">
      {/* ── header bar ── */}
      <div className="editor-header">
        <h1>LockStep Scenario Editor</h1>
        <div className="editor-actions">
          <button className="btn btn-sm btn-start" onClick={() => addNode('start_node')}>+ Start</button>
          <button className="btn btn-sm" onClick={() => addNode('puzzle_node')}>+ Puzzle</button>
          <button className="btn btn-sm" onClick={() => addNode('choice_node')}>+ Choice</button>
          <button className="btn btn-sm btn-win" onClick={() => addNode('win_node')}>+ Win</button>
          <button className="btn btn-sm btn-fail" onClick={() => addNode('fail_node')}>+ Fail</button>
          <span className="toolbar-sep" />
          <label className="btn btn-sm file-btn">
            Import
            <input ref={fileRef} type="file" accept=".json,application/json" onChange={handleImport} />
          </label>
          <button className="btn btn-sm btn-primary" onClick={handleExport}>Export JSON</button>
        </div>
      </div>

      {/* ── validation banner ── */}
      {validationSummary && (
        <div className="validation-banner">
          <button className="banner-close" onClick={() => setErrors([])} aria-label="Dismiss">✕</button>
          <strong>Cannot export — fix these issues:</strong>
          <ul>{validationSummary.map((e, i) => <li key={i}>{e}</li>)}</ul>
        </div>
      )}

      {/* ── body ── */}
      <div className="editor-body">
        <div className="editor-canvas">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            fitView
            snapToGrid
            snapGrid={[16, 16]}
            deleteKeyCode={['Backspace', 'Delete']}
            multiSelectionKeyCode="Shift"
          >
            <Background variant="dots" gap={16} size={1} color="#1e293b" />
            <Controls position="bottom-left" />
            <MiniMap
              pannable
              zoomable
              nodeColor={(n) => {
                if (n.type === 'start_node') return '#8b5cf6';
                if (n.type === 'win_node')  return '#10b981';
                if (n.type === 'fail_node') return '#ef4444';
                if (n.type === 'choice_node') return '#f59e0b';
                return '#3b82f6';
              }}
              style={{ background: '#0a0e17' }}
            />
            <Panel position="top-right">
              <div className="hint">Drag to connect nodes. Delete/Backspace to remove selected.</div>
            </Panel>
          </ReactFlow>
        </div>

        <PropertySidebar
          selected={selected}
          onUpdate={updateSelectedData}
          onDelete={deleteSelected}
        />
      </div>
    </div>
  );
}
