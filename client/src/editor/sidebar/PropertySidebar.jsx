import React, { useState } from 'react';
import { Rocket, Puzzle, Zap, Flag, Video, X, Wand2 } from 'lucide-react';
import { MAX_CHOICES } from '../nodes/ChoiceNode';
import { PUZZLE_TYPES } from '../nodes/PuzzleNode';
import { CIPHER_METHODS, BINARY_METHOD, ASCII_METHOD, EMOJI_METHOD } from '../../utils/cipherUtils';
import { WORD_MODES, generateWordPuzzle } from '../../utils/wordUtils';

/* ── Cipher Generator sub-component ── */
function CipherGenerator({ puzzle, pIdx, updatePuzzle }) {
  const [plaintext, setPlaintext] = useState(puzzle.validation?.answer || '');
  const [method, setMethod] = useState('caesar3');

  const getMethods = () => {
    if (puzzle.type === 'binary_cipher') return [BINARY_METHOD];
    if (puzzle.type === 'ascii_cipher') return [ASCII_METHOD];
    if (puzzle.type === 'emoji_cipher') return [EMOJI_METHOD];
    return CIPHER_METHODS;
  };

  const handleGenerate = () => {
    if (!plaintext.trim()) return;
    const methods = getMethods();
    const m = methods.find(cm => cm.id === method) || methods[0];
    const encoded = m.encode(plaintext.trim());
    updatePuzzle(pIdx, 'encodedText', encoded);
    updatePuzzle(pIdx, 'validation', { mode: 'exact', answer: plaintext.trim() });
    updatePuzzle(pIdx, 'hint', m.hint || '');
    updatePuzzle(pIdx, 'cipherMethod', m.id);
  };

  const methods = getMethods();

  return (
    <div className="puzzle-config">
      <div className="cipher-gen-row">
        <input className="input" placeholder="Plaintext answer (what players decode)" value={plaintext} onChange={e => setPlaintext(e.target.value)} />
        {methods.length > 1 && (
          <select className="input" value={method} onChange={e => setMethod(e.target.value)} style={{ maxWidth: 140 }}>
            {methods.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        )}
        <button className="btn btn-xs" onClick={handleGenerate} title="Generate encoded text">
          <Wand2 size={12} /> Generate
        </button>
      </div>
      <textarea className="input" rows={3} placeholder="Encoded text (auto-generated or manual)" value={puzzle.encodedText || ''} onChange={e => updatePuzzle(pIdx, 'encodedText', e.target.value)} />
      <input className="input" placeholder="Decoded answer (exact)" value={puzzle.validation?.answer || ''} onChange={e => updatePuzzle(pIdx, 'validation', { mode: 'exact', answer: e.target.value })} />
      <input className="input" placeholder="Hint (optional)" value={puzzle.hint || ''} onChange={e => updatePuzzle(pIdx, 'hint', e.target.value)} />
    </div>
  );
}

/* ── Word Puzzle Generator sub-component ── */
function WordPuzzleGenerator({ puzzle, pIdx, updatePuzzle }) {
  const [answer, setAnswer] = useState(puzzle.validation?.answer || '');
  const [mode, setMode] = useState(puzzle.wordMode || 'anagram');

  const handleGenerate = () => {
    if (!answer.trim()) return;
    const result = generateWordPuzzle(answer.trim(), mode);
    updatePuzzle(pIdx, 'validation', { mode: 'exact', answer: answer.trim() });
    updatePuzzle(pIdx, 'scrambledText', result.scrambledText);
    updatePuzzle(pIdx, 'wordMode', mode);
    if (result.tiles) {
      updatePuzzle(pIdx, 'tiles', result.tiles);
    } else {
      updatePuzzle(pIdx, 'tiles', null);
    }
  };

  return (
    <div className="puzzle-config">
      <input className="input" placeholder="Answer word/phrase" value={answer} onChange={e => setAnswer(e.target.value)} />
      <div className="cipher-gen-row">
        <select className="input" value={mode} onChange={e => setMode(e.target.value)}>
          {WORD_MODES.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
        <button className="btn btn-xs" onClick={handleGenerate} title="Generate scrambled puzzle">
          <Wand2 size={12} /> Generate
        </button>
      </div>
      <input className="input" placeholder="Scrambled / clue text (auto or manual)" value={puzzle.scrambledText || ''} onChange={e => updatePuzzle(pIdx, 'scrambledText', e.target.value)} />
      {puzzle.tiles && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Tiles: {puzzle.tiles.join(' ')}
        </div>
      )}
      <input className="input" placeholder="Hint (optional)" value={puzzle.hint || ''} onChange={e => updatePuzzle(pIdx, 'hint', e.target.value)} />
    </div>
  );
}

export function PropertySidebar({ selected, onUpdate, onDelete, embedded, globalSettings, onUpdateGlobalSettings }) {
  if (!selected) {
    if (embedded) return null;
    return (
      <div className="editor-sidebar">
        <div className="sidebar-content">
          <div className="sidebar-header">Properties</div>
          <p className="sidebar-empty">Select a node to edit its properties.</p>
          <div className="sidebar-legend">
            <div className="legend-row"><span className="dot dot-start" /> Start Node (scenario intro)</div>
            <div className="legend-row"><span className="dot dot-puzzle" /> Puzzle Node</div>
            <div className="legend-row"><span className="dot dot-choice" /> Choice Node</div>
            <div className="legend-row"><span className="dot dot-ai" /> AI Generator Node</div>
            <div className="legend-row"><span className="dot dot-endpoint" /> Endpoint (win / fail ending)</div>
          </div>
        </div>
      </div>
    );
  }

  const data = selected.data || {};
  const type = selected.type;
  const isPuzzle    = type === 'puzzle_node';
  const isChoice    = type === 'choice_node';
  const isEndpoint  = type === 'endpoint_node' || type === 'win_node' || type === 'fail_node';
  const isStart     = type === 'start_node';
  const isAI        = type === 'ai_node';
  const hasNext     = isPuzzle || isStart;
  const hasStory    = isStart || isPuzzle || isChoice || isEndpoint;

  /* ── helpers ── */
  const set = (key, value) => onUpdate({ [key]: value });

  const setStoryField = (field, value) => {
    const story = { ...(data.story || { title: '', text: '', narrationText: '' }), [field]: value };
    onUpdate({ story });
  };

  /* ── choice helpers ── */
  const updateChoice = (idx, field, value) => {
    const choices = (data.choices || []).map((c, i) => i === idx ? { ...c, [field]: value } : c);
    onUpdate({ choices });
  };
  const addChoice = () => {
    const choices = [...(data.choices || [])];
    if (choices.length >= MAX_CHOICES) return;
    choices.push({ id: `${data.id}_C${choices.length + 1}`, label: 'New Choice', nextNodeId: '' });
    onUpdate({ choices });
  };
  const removeChoice = (idx) => {
    onUpdate({ choices: (data.choices || []).filter((_, i) => i !== idx) });
  };

  /* ── role clue helpers ── */
  const updateRoleClue = (idx, field, value) => {
    const roleClues = (data.roleClues || []).map((rc, i) => i === idx ? { ...rc, [field]: value } : rc);
    onUpdate({ roleClues });
  };
  const addRoleClue = (roleId) => {
    onUpdate({ roleClues: [...(data.roleClues || []), { roleId, text: '' }] });
  };
  const removeRoleClue = (idx) => {
    onUpdate({ roleClues: (data.roleClues || []).filter((_, i) => i !== idx) });
  };

  /* ── puzzle helpers ── */
  const puzzles = data.puzzles || [];

  const addPuzzle = (puzzleType) => {
    const id = `${data.id}_P${puzzles.length + 1}`;
    const base = { id, type: puzzleType, prompt: '', effectsOnSuccess: [], effectsOnFail: [] };

    if (puzzleType === 'choice' || puzzleType === 'debug_select') {
      base.options = [{ id: `${id}_O1`, label: 'Option 1', isCorrect: true }];
    }
    if (puzzleType === 'input_code') {
      base.validation = { mode: 'exact', answer: '' };
    }
    if (puzzleType === 'input_numeric') {
      base.validation = { target: 0, tolerance: 0.5 };
    }
    if (puzzleType === 'multi_input') {
      base.validation = { fields: [{ id: 'field1', mode: 'exact', answer: '' }] };
    }
    if (puzzleType === 'logic_match') {
      base.validation = { mode: 'exact', answer: '' };
    }
    if (puzzleType === 'embed_validator') {
      base.embed = { kind: 'phet', url: '', instructions: '' };
      base.validator = { fields: [] };
    }
    if (puzzleType === 'debug_select') {
      base.code = { language: 'js', boilerplate: '', question: '' };
    }

    onUpdate({ puzzles: [...puzzles, base] });
  };

  const updatePuzzle = (idx, field, value) => {
    const updated = puzzles.map((p, i) => i === idx ? { ...p, [field]: value } : p);
    onUpdate({ puzzles: updated });
  };

  const removePuzzle = (idx) => {
    onUpdate({ puzzles: puzzles.filter((_, i) => i !== idx) });
  };

  const updatePuzzleOption = (pIdx, oIdx, field, value) => {
    const p = { ...puzzles[pIdx] };
    p.options = (p.options || []).map((o, i) => i === oIdx ? { ...o, [field]: value } : o);
    const updated = puzzles.map((pp, i) => i === pIdx ? p : pp);
    onUpdate({ puzzles: updated });
  };

  const addPuzzleOption = (pIdx) => {
    const p = { ...puzzles[pIdx] };
    const opts = [...(p.options || [])];
    opts.push({ id: `${p.id}_O${opts.length + 1}`, label: 'New Option', isCorrect: false });
    p.options = opts;
    const updated = puzzles.map((pp, i) => i === pIdx ? p : pp);
    onUpdate({ puzzles: updated });
  };

  const removePuzzleOption = (pIdx, oIdx) => {
    const p = { ...puzzles[pIdx] };
    p.options = (p.options || []).filter((_, i) => i !== oIdx);
    const updated = puzzles.map((pp, i) => i === pIdx ? p : pp);
    onUpdate({ puzzles: updated });
  };

  /* ── label for node type ── */
  const TYPE_ICONS = { start_node: Rocket, puzzle_node: Puzzle, choice_node: Zap, endpoint_node: Flag, win_node: Flag, fail_node: Flag };
  const TYPE_LABELS = { start_node: 'Start', puzzle_node: 'Puzzle', choice_node: 'Choice', endpoint_node: 'Endpoint', win_node: 'Endpoint', fail_node: 'Endpoint' };
  const TypeIcon = TYPE_ICONS[type];
  const typeBadge = TYPE_LABELS[type] || type;

  return (
    <div className={embedded ? 'sidebar-embedded' : 'editor-sidebar'}>
      {!embedded && (
      <div className="sidebar-header">
        <span>{TypeIcon && <TypeIcon size={14} />} {typeBadge} — {selected.id}</span>
        <button className="btn btn-sm btn-danger" onClick={onDelete}>Delete</button>
      </div>
      )}

      {/* ── common fields ── */}
      <div className="form-group">
        <label className="label">ID</label>
        <input className="input" value={data.id || ''} onChange={e => set('id', e.target.value)} />
      </div>
      <div className="form-group">
        <label className="label">Location</label>
        <input className="input" value={data.location || ''} onChange={e => set('location', e.target.value)} />
      </div>

      {hasStory && (
        <>
          <div className="form-group">
            <label className="label">Story Title</label>
            <input className="input" value={data.story?.title || ''} onChange={e => setStoryField('title', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="label">Story Text</label>
            <textarea className="input" rows={3} value={data.story?.text || ''} onChange={e => setStoryField('text', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="label">Narration</label>
            <textarea className="input" rows={2} value={data.story?.narrationText || ''} onChange={e => setStoryField('narrationText', e.target.value)} />
          </div>
        </>
      )}

      {/* ── next node ID for puzzle / start ── */}
      {hasNext && (
        <div className="form-group">
          <label className="label">Next Node ID</label>
          <input className="input" value={data.nextNodeId || ''} onChange={e => set('nextNodeId', e.target.value)} placeholder="Connect or type target node ID" />
        </div>
      )}

      {/* ── start node hint ── */}
      {isStart && (
        <div className="section">
          <p className="sidebar-hint">This is the scenario start node. It displays an intro story/briefing before the first puzzle. Every scenario must begin with exactly one Start node.</p>
        </div>
      )}

      {/* ── puzzle-specific ── */}
      {isPuzzle && (
        <>
          <div className="section">
            <div className="section-title">Role Clues</div>
            {(data.roleClues || []).map((rc, idx) => (
              <div key={idx} className="role-clue-row">
                <select className="input role-select" value={rc.roleId || 'builder'} onChange={e => updateRoleClue(idx, 'roleId', e.target.value)}>
                  <option value="builder">builder</option>
                  <option value="pathfinder">pathfinder</option>
                  <option value="decoder">decoder</option>
                  <option value="coordinator">coordinator</option>
                </select>
                <input className="input" value={rc.text || ''} onChange={e => updateRoleClue(idx, 'text', e.target.value)} placeholder="Clue text…" />
                <button className="btn btn-xs btn-ghost" onClick={() => removeRoleClue(idx)}><X size={12} /></button>
              </div>
            ))}
            <div className="role-actions">
              <button className="btn btn-xs" onClick={() => addRoleClue('builder')}>+ Builder</button>
              <button className="btn btn-xs" onClick={() => addRoleClue('pathfinder')}>+ Pathfinder</button>
              <button className="btn btn-xs" onClick={() => addRoleClue('decoder')}>+ Decoder</button>
            </div>
          </div>

          {/* ── Puzzles section ── */}
          <div className="section">
            <div className="section-title">Puzzles ({puzzles.length})</div>
            {puzzles.map((p, pIdx) => (
              <div key={p.id || pIdx} className="puzzle-edit-block">
                <div className="puzzle-edit-header">
                  <select className="input" value={p.type || ''} onChange={e => updatePuzzle(pIdx, 'type', e.target.value)}>
                    <option value="" disabled>Select type…</option>
                    {PUZZLE_TYPES.map(pt => <option key={pt.value} value={pt.value}>{pt.label}</option>)}
                  </select>
                  <button className="btn btn-xs btn-ghost" onClick={() => removePuzzle(pIdx)}><X size={12} /></button>
                </div>

                <input className="input puzzle-prompt" value={p.prompt || ''} placeholder="Prompt text" onChange={e => updatePuzzle(pIdx, 'prompt', e.target.value)} />

                {/* ── type-specific config ── */}
                {(p.type === 'choice' || p.type === 'debug_select') && (
                  <div className="puzzle-options">
                    {p.type === 'debug_select' && (
                      <>
                        <textarea className="input" rows={3} placeholder="Code boilerplate" value={p.code?.boilerplate || ''} onChange={e => updatePuzzle(pIdx, 'code', { ...(p.code || {}), boilerplate: e.target.value })} />
                        <input className="input" placeholder="Question" value={p.code?.question || ''} onChange={e => updatePuzzle(pIdx, 'code', { ...(p.code || {}), question: e.target.value })} />
                      </>
                    )}
                    <div className="option-label-row">Options:</div>
                    {(p.options || []).map((o, oIdx) => (
                      <div key={oIdx} className="option-row">
                        <input type="checkbox" checked={!!o.isCorrect} onChange={e => updatePuzzleOption(pIdx, oIdx, 'isCorrect', e.target.checked)} title="Correct?" />
                        <input className="input" value={o.label || ''} onChange={e => updatePuzzleOption(pIdx, oIdx, 'label', e.target.value)} />
                        <button className="btn btn-xs btn-ghost" onClick={() => removePuzzleOption(pIdx, oIdx)}><X size={12} /></button>
                      </div>
                    ))}
                    <button className="btn btn-xs" onClick={() => addPuzzleOption(pIdx)}>+ Option</button>
                  </div>
                )}

                {p.type === 'input_code' && (
                  <div className="puzzle-config">
                    <input className="input" placeholder="Answer (exact)" value={p.validation?.answer || ''} onChange={e => updatePuzzle(pIdx, 'validation', { ...(p.validation || {}), mode: 'exact', answer: e.target.value })} />
                    <input className="input" type="number" placeholder="Attempts (0=unlimited)" value={p.attemptsAllowed || ''} onChange={e => updatePuzzle(pIdx, 'attemptsAllowed', parseInt(e.target.value) || 0)} />
                  </div>
                )}

                {p.type === 'input_numeric' && (
                  <div className="puzzle-config">
                    <input className="input" type="number" placeholder="Target" value={p.validation?.target ?? ''} onChange={e => updatePuzzle(pIdx, 'validation', { ...(p.validation || {}), target: parseFloat(e.target.value) || 0 })} />
                    <input className="input" type="number" placeholder="Tolerance" value={p.validation?.tolerance ?? ''} onChange={e => updatePuzzle(pIdx, 'validation', { ...(p.validation || {}), tolerance: parseFloat(e.target.value) || 0 })} />
                  </div>
                )}

                {p.type === 'logic_match' && (
                  <div className="puzzle-config">
                    <input className="input" placeholder="Correct answer (exact)" value={p.validation?.answer || ''} onChange={e => updatePuzzle(pIdx, 'validation', { mode: 'exact', answer: e.target.value })} />
                  </div>
                )}

                {p.type === 'multi_input' && (
                  <div className="puzzle-config">
                    <p className="sidebar-hint">Multi-input fields are edited in the exported JSON for now.</p>
                  </div>
                )}

                {p.type === 'embed_validator' && (
                  <div className="puzzle-config">
                    <input className="input" placeholder="Embed URL" value={p.embed?.url || ''} onChange={e => updatePuzzle(pIdx, 'embed', { ...(p.embed || {}), url: e.target.value })} />
                    <input className="input" placeholder="Instructions" value={p.embed?.instructions || ''} onChange={e => updatePuzzle(pIdx, 'embed', { ...(p.embed || {}), instructions: e.target.value })} />
                  </div>
                )}

                {/* ── Cipher types ── */}
                {['cipher', 'emoji_cipher', 'ascii_cipher', 'binary_cipher'].includes(p.type) && (
                  <CipherGenerator puzzle={p} pIdx={pIdx} updatePuzzle={updatePuzzle} />
                )}

                {p.type === 'qr_code' && (
                  <div className="puzzle-config">
                    <input className="input" placeholder="QR Code image URL" value={p.imageUrl || ''} onChange={e => updatePuzzle(pIdx, 'imageUrl', e.target.value)} />
                    <input className="input" placeholder="Decoded answer (exact)" value={p.validation?.answer || ''} onChange={e => updatePuzzle(pIdx, 'validation', { mode: 'exact', answer: e.target.value })} />
                    <input className="input" placeholder="Hint (optional)" value={p.hint || ''} onChange={e => updatePuzzle(pIdx, 'hint', e.target.value)} />
                  </div>
                )}

                {/* ── Location types ── */}
                {['gps_coordinate', 'landmark_id'].includes(p.type) && (
                  <div className="puzzle-config">
                    {(p.type === 'landmark_id') && (
                      <input className="input" placeholder="Image URL" value={p.imageUrl || ''} onChange={e => updatePuzzle(pIdx, 'imageUrl', e.target.value)} />
                    )}
                    <input className="input" placeholder="Answer (exact)" value={p.validation?.answer || ''} onChange={e => updatePuzzle(pIdx, 'validation', { mode: 'exact', answer: e.target.value })} />
                    <input className="input" placeholder="Map/Direction hint" value={p.mapHint || ''} onChange={e => updatePuzzle(pIdx, 'mapHint', e.target.value)} />
                    <div className="option-label-row">Map Coordinates (optional — shows embedded map)</div>
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      <input className="input" type="number" step="any" placeholder="Latitude" value={p.coordinates?.lat || ''} onChange={e => updatePuzzle(pIdx, 'coordinates', { ...(p.coordinates || {}), lat: parseFloat(e.target.value) || 0, lng: p.coordinates?.lng || 0 })} />
                      <input className="input" type="number" step="any" placeholder="Longitude" value={p.coordinates?.lng || ''} onChange={e => updatePuzzle(pIdx, 'coordinates', { ...(p.coordinates || {}), lat: p.coordinates?.lat || 0, lng: parseFloat(e.target.value) || 0 })} />
                    </div>
                    {p.coordinates?.lat && p.coordinates?.lng && (
                      <div style={{ marginTop: 4, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)' }}>
                        <iframe
                          src={`https://www.openstreetmap.org/export/embed.html?bbox=${p.coordinates.lng-0.02},${p.coordinates.lat-0.015},${p.coordinates.lng+0.02},${p.coordinates.lat+0.015}&layer=mapnik&marker=${p.coordinates.lat},${p.coordinates.lng}`}
                          style={{ width: '100%', height: 150, border: 'none' }}
                          title="Map Preview"
                          loading="lazy"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* ── Directional Riddle ── */}
                {p.type === 'directional_riddle' && (
                  <div className="puzzle-config">
                    <div className="option-label-row">Grid Size & Directions</div>
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      <input className="input" type="number" placeholder="Grid size (e.g. 5)" value={p.gridSize || ''} onChange={e => updatePuzzle(pIdx, 'gridSize', parseInt(e.target.value) || 5)} style={{ maxWidth: 80 }} />
                      <input className="input" placeholder="Start label (e.g. Town Hall)" value={p.startLabel || ''} onChange={e => updatePuzzle(pIdx, 'startLabel', e.target.value)} />
                    </div>
                    <textarea className="input" rows={3} placeholder="Directions (one per line, e.g. N 2, E 3, S 1)" value={p.directions || ''} onChange={e => updatePuzzle(pIdx, 'directions', e.target.value)} />
                    <input className="input" placeholder="Goal label / answer (e.g. Library)" value={p.validation?.answer || ''} onChange={e => updatePuzzle(pIdx, 'validation', { mode: 'exact', answer: e.target.value })} />
                    <input className="input" placeholder="Map hint (optional)" value={p.mapHint || ''} onChange={e => updatePuzzle(pIdx, 'mapHint', e.target.value)} />
                    <div className="option-label-row">Map Coordinates (optional)</div>
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      <input className="input" type="number" step="any" placeholder="Latitude" value={p.coordinates?.lat || ''} onChange={e => updatePuzzle(pIdx, 'coordinates', { ...(p.coordinates || {}), lat: parseFloat(e.target.value) || 0, lng: p.coordinates?.lng || 0 })} />
                      <input className="input" type="number" step="any" placeholder="Longitude" value={p.coordinates?.lng || ''} onChange={e => updatePuzzle(pIdx, 'coordinates', { ...(p.coordinates || {}), lat: p.coordinates?.lat || 0, lng: parseFloat(e.target.value) || 0 })} />
                    </div>
                  </div>
                )}

                {/* ── Perception types ── */}
                {p.type === 'spot_difference' && (
                  <div className="puzzle-config">
                    <input className="input" placeholder="Image A URL" value={p.imageUrlA || ''} onChange={e => updatePuzzle(pIdx, 'imageUrlA', e.target.value)} />
                    <input className="input" placeholder="Image B URL" value={p.imageUrlB || ''} onChange={e => updatePuzzle(pIdx, 'imageUrlB', e.target.value)} />
                    <input className="input" placeholder="Answer (describe difference)" value={p.validation?.answer || ''} onChange={e => updatePuzzle(pIdx, 'validation', { mode: 'exact', answer: e.target.value })} />
                  </div>
                )}

                {p.type === 'hidden_object' && (
                  <div className="puzzle-config">
                    <input className="input" placeholder="Image URL" value={p.imageUrl || ''} onChange={e => updatePuzzle(pIdx, 'imageUrl', e.target.value)} />
                    <input className="input" placeholder="Answer (what to find)" value={p.validation?.answer || ''} onChange={e => updatePuzzle(pIdx, 'validation', { mode: 'exact', answer: e.target.value })} />
                  </div>
                )}

                {p.type === 'audio_clue' && (
                  <div className="puzzle-config">
                    <input className="input" placeholder="Audio URL (.mp3, .wav)" value={p.audioUrl || ''} onChange={e => updatePuzzle(pIdx, 'audioUrl', e.target.value)} />
                    <input className="input" placeholder="Answer (exact)" value={p.validation?.answer || ''} onChange={e => updatePuzzle(pIdx, 'validation', { mode: 'exact', answer: e.target.value })} />
                  </div>
                )}

                {/* ── Word puzzle ── */}
                {p.type === 'word_puzzle' && (
                  <WordPuzzleGenerator puzzle={p} pIdx={pIdx} updatePuzzle={updatePuzzle} />
                )}

                {/* ── LaTeX Math ── */}
                {p.type === 'latex_math' && (
                  <div className="puzzle-config">
                    <textarea className="input" rows={2} placeholder="LaTeX expression (e.g. \\frac{x}{2} = 5)" value={p.latexExpression || ''} onChange={e => updatePuzzle(pIdx, 'latexExpression', e.target.value)} />
                    <input className="input" placeholder="Answer (exact)" value={p.validation?.answer || ''} onChange={e => updatePuzzle(pIdx, 'validation', { mode: 'exact', answer: e.target.value })} />
                    <input className="input" placeholder="Hint (optional)" value={p.hint || ''} onChange={e => updatePuzzle(pIdx, 'hint', e.target.value)} />
                  </div>
                )}

                {/* ── Narrative / Found Document ── */}
                {['narrative_clue', 'found_document'].includes(p.type) && (
                  <div className="puzzle-config">
                    <textarea className="input" rows={4} placeholder="Narrative / document text" value={p.narrativeText || ''} onChange={e => updatePuzzle(pIdx, 'narrativeText', e.target.value)} />
                    <input className="input" placeholder="Image URL (optional)" value={p.imageUrl || ''} onChange={e => updatePuzzle(pIdx, 'imageUrl', e.target.value)} />
                    <input className="input" placeholder="Answer (exact)" value={p.validation?.answer || ''} onChange={e => updatePuzzle(pIdx, 'validation', { mode: 'exact', answer: e.target.value })} />
                    <input className="input" placeholder="Hint (optional)" value={p.hint || ''} onChange={e => updatePuzzle(pIdx, 'hint', e.target.value)} />
                  </div>
                )}

                {/* ── Red Herring ── */}
                {p.type === 'red_herring' && (
                  <div className="puzzle-config">
                    <textarea className="input" rows={3} placeholder="Misleading text / decoy clue" value={p.narrativeText || ''} onChange={e => updatePuzzle(pIdx, 'narrativeText', e.target.value)} />
                    <p className="sidebar-hint">Red herrings auto-solve — they're decoys to distract players.</p>
                  </div>
                )}

                {/* ── Multi-Stage Chain ── */}
                {p.type === 'multi_stage_chain' && (
                  <div className="puzzle-config">
                    <div className="option-label-row">Stages:</div>
                    {(p.stages || []).map((stage, sIdx) => (
                      <div key={sIdx} className="option-row">
                        <span style={{ minWidth: 20, textAlign: 'center' }}>{sIdx + 1}</span>
                        <input className="input" value={stage.prompt || ''} placeholder="Stage prompt" onChange={e => {
                          const stages = [...(p.stages || [])];
                          stages[sIdx] = { ...stages[sIdx], prompt: e.target.value };
                          updatePuzzle(pIdx, 'stages', stages);
                        }} />
                        <button className="btn btn-xs btn-ghost" onClick={() => {
                          updatePuzzle(pIdx, 'stages', (p.stages || []).filter((_, i) => i !== sIdx));
                        }}><X size={12} /></button>
                      </div>
                    ))}
                    <button className="btn btn-xs" onClick={() => {
                      updatePuzzle(pIdx, 'stages', [...(p.stages || []), { prompt: `Stage ${(p.stages || []).length + 1}`, placeholder: 'Answer…' }]);
                    }}>+ Add Stage</button>
                    <input className="input" placeholder="Final answer (exact)" value={p.validation?.answer || ''} onChange={e => updatePuzzle(pIdx, 'validation', { mode: 'exact', answer: e.target.value })} />
                  </div>
                )}

                {/* ── Code Editor ── */}
                {p.type === 'code_editor' && (
                  <div className="puzzle-config">
                    <select className="input" value={p.language || 'javascript'} onChange={e => updatePuzzle(pIdx, 'language', e.target.value)}>
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                    </select>
                    <textarea className="input" rows={3} placeholder="Boilerplate code" value={p.boilerplate || ''} onChange={e => updatePuzzle(pIdx, 'boilerplate', e.target.value)} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem' }} />
                    <input className="input" placeholder="Expected answer (exact)" value={p.validation?.answer || ''} onChange={e => updatePuzzle(pIdx, 'validation', { mode: 'exact', answer: e.target.value })} />
                    <input className="input" type="number" placeholder="Hidden test count" value={p.hiddenTestCount || ''} onChange={e => updatePuzzle(pIdx, 'hiddenTestCount', parseInt(e.target.value) || 0)} />
                  </div>
                )}
              </div>
            ))}
            <div className="puzzle-add-row">
              <select id="puzzle-type-add" className="input" defaultValue="">
                <option value="" disabled>Add puzzle…</option>
                {PUZZLE_TYPES.map(pt => <option key={pt.value} value={pt.value}>{pt.label}</option>)}
              </select>
              <button className="btn btn-xs" onClick={() => {
                const sel = document.getElementById('puzzle-type-add');
                if (sel.value) { addPuzzle(sel.value); sel.value = ''; }
              }}>+ Add</button>
            </div>
          </div>

          {/* ── AI Integration (optional) ── */}
          <div className="section">
            <div className="section-title">AI Integration (Optional)</div>
            <div className="form-group">
              <label className="label">AI Prompt</label>
              <textarea
                className="input"
                rows={3}
                value={data.aiPrompt || ''}
                onChange={e => set('aiPrompt', e.target.value)}
                placeholder="Optional: Describe AI-generated content to enhance this puzzle...&#10;&#10;Example: Generate an image of a mysterious locked door with ancient symbols"
              />
              <p className="sidebar-hint">
                Use AI-generated content from an AI Generator node, or specify a custom prompt here to generate content at deploy time.
              </p>
            </div>
          </div>
        </>
      )}

      {/* ── choice-specific ── */}
      {isChoice && (
        <div className="section">
          <div className="section-title">Choices</div>
          {(data.choices || []).map((c, idx) => (
            <div key={c.id || idx} className="choice-row">
              <span className="choice-idx">{idx + 1}</span>
              <input className="input" value={c.label || ''} placeholder="Label" onChange={e => updateChoice(idx, 'label', e.target.value)} />
              <input className="input" value={c.nextNodeId || ''} placeholder="nextNodeId" onChange={e => updateChoice(idx, 'nextNodeId', e.target.value)} />
              <button className="btn btn-xs btn-ghost" onClick={() => removeChoice(idx)}><X size={12} /></button>
            </div>
          ))}
          {(data.choices || []).length < MAX_CHOICES ? (
            <button className="btn btn-xs" onClick={addChoice}>+ Add Choice ({(data.choices || []).length}/{MAX_CHOICES})</button>
          ) : (
            <p className="sidebar-hint">Max {MAX_CHOICES} choices reached.</p>
          )}
        </div>
      )}

      {/* ── endpoint node config ── */}
      {isEndpoint && (
        <div className="section">
          <div className="form-group">
            <label className="label">Outcome</label>
            <select className="input" value={data.outcome || 'win'} onChange={e => set('outcome', e.target.value)}>
              <option value="win">Win (Good Ending)</option>
              <option value="fail">Fail (Bad Ending)</option>
            </select>
          </div>

          <p className="sidebar-hint">
            {(data.outcome || 'win') === 'win'
              ? 'This endpoint marks a successful game completion.'
              : 'This endpoint marks a game failure / bad ending.'}
          </p>

          <div className="form-group">
            <label className="label"><Video size={14} /> End Screen Media (optional)</label>
            <input
              className="input"
              value={data.mediaUrl || ''}
              onChange={e => set('mediaUrl', e.target.value)}
              placeholder="URL to .mp4, .gif, or image"
            />
            <p className="sidebar-hint">Paste a URL to an MP4, GIF, or image. It will display on the end screen for some fun flair.</p>
            {data.mediaUrl && (
              <div className="media-preview">
                {data.mediaUrl.match(/\.mp4/i)
                  ? <video src={data.mediaUrl} muted autoPlay loop style={{ maxWidth: '100%', borderRadius: 8 }} />
                  : <img src={data.mediaUrl} alt="preview" style={{ maxWidth: '100%', borderRadius: 8 }} />
                }
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── AI generator config ── */}
      {isAI && (
        <div className="section">
          <div className="section-title">AI Generator Configuration</div>
          <div className="form-group">
            <label className="label">AI Prompt (Required) *</label>
            <textarea
              className="input"
              rows={4}
              value={data.aiConfig?.prompt || ''}
              onChange={e => set('aiConfig', { ...(data.aiConfig || {}), prompt: e.target.value })}
              placeholder="Describe what you want the AI to generate...\n\nExample: Generate 3 mysterious images of an abandoned laboratory with cryptic symbols on the walls"
            />
            {!(data.aiConfig?.prompt || '').trim() && (
              <p className="sidebar-hint" style={{ color: '#ef4444' }}>⚠️ Prompt is required for AI generation</p>
            )}
          </div>

          <div className="form-group">
            <label className="label">Generate Content Types</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={(data.aiConfig?.generates || []).includes('images')}
                  onChange={e => {
                    const generates = data.aiConfig?.generates || [];
                    const updated = e.target.checked
                      ? [...generates, 'images']
                      : generates.filter(g => g !== 'images');
                    set('aiConfig', { ...(data.aiConfig || {}), generates: updated });
                  }}
                />
                <span>Images</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={(data.aiConfig?.generates || []).includes('videos')}
                  onChange={e => {
                    const generates = data.aiConfig?.generates || [];
                    const updated = e.target.checked
                      ? [...generates, 'videos']
                      : generates.filter(g => g !== 'videos');
                    set('aiConfig', { ...(data.aiConfig || {}), generates: updated });
                  }}
                />
                <span>Videos</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={(data.aiConfig?.generates || []).includes('text')}
                  onChange={e => {
                    const generates = data.aiConfig?.generates || [];
                    const updated = e.target.checked
                      ? [...generates, 'text']
                      : generates.filter(g => g !== 'text');
                    set('aiConfig', { ...(data.aiConfig || {}), generates: updated });
                  }}
                />
                <span>Text</span>
              </label>
            </div>
            {(data.aiConfig?.generates || []).length === 0 && (
              <p className="sidebar-hint" style={{ color: '#f59e0b', marginTop: '0.5rem' }}>⚠️ Select at least one content type to generate</p>
            )}
          </div>

          <div className="form-group">
            <label className="label">Target Puzzle Node (Optional)</label>
            <input
              className="input"
              value={data.aiConfig?.targetPuzzleId || ''}
              onChange={e => set('aiConfig', { ...(data.aiConfig || {}), targetPuzzleId: e.target.value })}
              placeholder="P_XXX — leave blank to use manually"
            />
            <p className="sidebar-hint">
              Optional: Specify a puzzle node ID to automatically apply generated content to.
              Leave blank to manually use generated content elsewhere.
            </p>
          </div>

          <p className="sidebar-hint" style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            ℹ️ AI generation happens at <strong>deploy time</strong>. When you press Deploy, this node will call the API to generate content based on your prompt. The generated content is cached in the database and won't appear in the game JSON.
          </p>
        </div>
      )}
    </div>
  );
}
