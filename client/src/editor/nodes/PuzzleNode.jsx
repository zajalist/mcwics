import React from 'react';
import { Puzzle, Diamond, Lock, MapPin, Eye, Zap, Type, Sigma, FlaskConical, BookOpen, Code } from 'lucide-react';
import { Handle, Position } from 'reactflow';

/** All engine-supported puzzle types, organised by folder category */
export const PUZZLE_TYPES = [
  // ── Primitives ──
  { value: 'choice',          label: 'Multiple Choice',     category: 'primitives' },
  { value: 'input_code',      label: 'Code / Text Input',   category: 'primitives' },
  { value: 'input_numeric',   label: 'Numeric Input',       category: 'primitives' },
  { value: 'multi_input',     label: 'Multi-Field Input',   category: 'primitives' },
  { value: 'debug_select',    label: 'Debug Select',        category: 'primitives' },
  { value: 'logic_match',     label: 'Logic Match',         category: 'primitives' },
  // ── Ciphers ──
  { value: 'cipher',          label: 'Cipher',              category: 'ciphers' },
  { value: 'emoji_cipher',    label: 'Emoji Cipher',        category: 'ciphers' },
  { value: 'ascii_cipher',    label: 'ASCII Cipher',        category: 'ciphers' },
  { value: 'binary_cipher',   label: 'Binary Cipher',       category: 'ciphers' },
  { value: 'qr_code',         label: 'QR Code',             category: 'ciphers' },
  // ── Location ──
  { value: 'gps_coordinate',      label: 'GPS Coordinate',       category: 'location' },
  { value: 'landmark_id',         label: 'Landmark ID',          category: 'location' },
  { value: 'directional_riddle',  label: 'Directional Riddle',   category: 'location' },
  // ── Perception ──
  { value: 'spot_difference', label: 'Spot the Difference',  category: 'perception' },
  { value: 'hidden_object',   label: 'Hidden Objects',       category: 'perception' },
  { value: 'audio_clue',      label: 'Audio Clue',           category: 'perception' },
  // ── Word & Language ──
  { value: 'word_puzzle',     label: 'Word Puzzle',          category: 'word' },
  // ── Math ──
  { value: 'latex_math',      label: 'LaTeX Math',           category: 'math' },
  // ── Science ──
  { value: 'embed_validator', label: 'Embed / PhET Sim',     category: 'science' },
  // ── Storytelling ──
  { value: 'narrative_clue',    label: 'Narrative Clue',      category: 'storytelling' },
  { value: 'found_document',    label: 'Found Document',      category: 'storytelling' },
  { value: 'red_herring',       label: 'Red Herring',         category: 'storytelling' },
  { value: 'multi_stage_chain', label: 'Multi-Stage Chain',   category: 'storytelling' },
  // ── Code ──
  { value: 'code_editor',     label: 'Code Editor',          category: 'code' },
];

/** Category metadata for the folder toolbar */
export const PUZZLE_CATEGORIES = [
  { id: 'primitives',   label: 'Primitives',       icon: Diamond,       color: '#3b82f6' },
  { id: 'ciphers',      label: 'Ciphers',          icon: Lock,          color: '#e8dcc8' },
  { id: 'location',     label: 'Location',         icon: MapPin,        color: '#10b981' },
  { id: 'perception',   label: 'Perception',       icon: Eye,           color: '#ec4899' },
  { id: 'io',           label: 'I/O',              icon: Zap,           color: '#8b5cf6' },
  { id: 'word',         label: 'Word & Language',   icon: Type,         color: '#06b6d4' },
  { id: 'math',         label: 'Math',             icon: Sigma,         color: '#ef4444' },
  { id: 'science',      label: 'Science',          icon: FlaskConical,  color: '#14b8a6' },
  { id: 'storytelling', label: 'Storytelling',     icon: BookOpen,      color: '#a855f7' },
  { id: 'code',         label: 'Code',             icon: Code,          color: '#22c55e' },
];

export function PuzzleNode({ data, selected }) {
  const title   = data?.story?.title || data?.location || data?.id;
  const next    = data?.nextNodeId;
  const puzzles = data?.puzzles || [];
  
  // Determine primary puzzle type for color coding
  const primaryPuzzle = puzzles[0];
  const puzzleType = PUZZLE_TYPES.find(pt => pt.value === primaryPuzzle?.type);
  const category = PUZZLE_CATEGORIES.find(cat => cat.id === puzzleType?.category);
  const categoryColor = category?.color || '#374E44';
  
  // Check for image/embed content
  const hasImage = primaryPuzzle && (primaryPuzzle.imageUrl || primaryPuzzle.imageUrlA || primaryPuzzle.imageUrlB);
  const hasEmbed = primaryPuzzle && primaryPuzzle.embed;
  const imageUrl = primaryPuzzle?.imageUrl || primaryPuzzle?.imageUrlA;

  return (
    <div 
      className={`editor-node puzzle-node ${!next ? 'invalid' : ''} ${selected ? 'selected' : ''}`}
      style={{ borderColor: categoryColor }}
    >
      <div className="node-header">
        <span className="node-type"><Puzzle size={14} /> Puzzle</span>
        <span className="node-id">{data?.id}</span>
      </div>
      <div className="node-title">{title}</div>
      {puzzles.length > 0 && (
        <div className="puzzle-tags">
          {puzzles.map((p, i) => {
            const pt = PUZZLE_TYPES.find(t => t.value === p.type);
            const cat = PUZZLE_CATEGORIES.find(c => c.id === pt?.category);
            return (
              <span 
                key={i} 
                className="puzzle-tag"
                style={{ 
                  backgroundColor: cat?.color ? `${cat.color}20` : undefined,
                  borderColor: cat?.color || '#3b82f6',
                  color: cat?.color || '#3b82f6'
                }}
              >
                {p.type || '?'}
              </span>
            );
          })}
        </div>
      )}
      {hasImage && imageUrl && (
        <div className="node-preview">
          <img src={imageUrl} alt="Preview" className="node-preview-img" />
        </div>
      )}
      {hasEmbed && (
        <div className="node-preview node-preview-embed">
          <span className="embed-icon">🔗</span>
          <span className="embed-text">{primaryPuzzle.embed.kind || 'Embed'}</span>
        </div>
      )}
      {puzzles.length === 0 && <div className="node-sub dim">No puzzles yet</div>}
      <div className="node-sub">Next: {next || '— (connect)'}</div>
      <Handle type="source" position={Position.Right} />
      <Handle type="target" position={Position.Left} />
      <Handle type="target" position={Position.Top} id="ai-input" style={{ background: '#f59e0b', width: 10, height: 10 }} />
    </div>
  );
}
