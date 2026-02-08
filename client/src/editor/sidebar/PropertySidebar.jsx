import React from 'react';
import { Rocket, Puzzle, Zap, Trophy, Skull, Video, X } from 'lucide-react';
import { MAX_CHOICES } from '../nodes/ChoiceNode';
import { PUZZLE_TYPES } from '../nodes/PuzzleNode';

export function PropertySidebar({ selected, onUpdate, onDelete }) {
  if (!selected) {
    return (
      <div className="editor-sidebar">
        <div className="sidebar-header">Properties</div>
        <p className="sidebar-empty">Select a node to edit its properties.</p>
        <div className="sidebar-legend">
          <div className="legend-row"><span className="dot dot-start" /> Start Node (scenario intro)</div>
          <div className="legend-row"><span className="dot dot-puzzle" /> Puzzle Node</div>
          <div className="legend-row"><span className="dot dot-choice" /> Choice Node</div>
          <div className="legend-row"><span className="dot dot-win" /> Win Node (good ending)</div>
          <div className="legend-row"><span className="dot dot-fail" /> Fail Node (bad ending)</div>
        </div>
      </div>
    );
  }

  const data = selected.data || {};
  const type = selected.type;
  const isPuzzle  = type === 'puzzle_node';
  const isChoice  = type === 'choice_node';
  const isWin     = type === 'win_node';
  const isFail    = type === 'fail_node';
  const isStart   = type === 'start_node';
  const isTerminal = isWin || isFail;
  const hasNext    = isPuzzle || isStart;

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
  const TYPE_ICONS = { start_node: Rocket, puzzle_node: Puzzle, choice_node: Zap, win_node: Trophy, fail_node: Skull };
  const TYPE_LABELS = { start_node: 'Start', puzzle_node: 'Puzzle', choice_node: 'Choice', win_node: 'Win', fail_node: 'Fail' };
  const TypeIcon = TYPE_ICONS[type];
  const typeBadge = TYPE_LABELS[type] || type;

  return (
    <div className="editor-sidebar">
      <div className="sidebar-header">
        <span>{TypeIcon && <TypeIcon size={14} />} {typeBadge} — {selected.id}</span>
        <button className="btn btn-sm btn-danger" onClick={onDelete}>Delete</button>
      </div>

      {/* ── common fields ── */}
      <div className="form-group">
        <label className="label">ID</label>
        <input className="input" value={data.id || ''} onChange={e => set('id', e.target.value)} />
      </div>
      <div className="form-group">
        <label className="label">Location</label>
        <input className="input" value={data.location || ''} onChange={e => set('location', e.target.value)} />
      </div>

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

      {/* ── terminal node hint ── */}
      {isTerminal && (
        <div className="section">
          <p className="sidebar-hint">{isWin ? 'This is a terminal win node — the scenario ends here with a victory.' : 'This is a terminal fail node — the scenario ends here with a defeat.'}</p>

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
    </div>
  );
}
