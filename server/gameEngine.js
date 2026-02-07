// ── Game Engine ─────────────────────────────────────────────
// JSON-driven puzzle validation, effects, node progression.
// Server-authoritative: all answers validated here.

class GameEngine {
  constructor(scenarioData) {
    this.scenarioData = scenarioData;
    this.roles = scenarioData.roles || [];
  }

  // ── Initialize game state from scenario globals ───────
  initGameState(room, scenario) {
    room.gameState = {
      currentNodeId: scenario.startNodeId,
      vars: JSON.parse(JSON.stringify(scenario.globals.vars)), // deep clone
      solvedPuzzles: [],
      failReason: null,
      timeRemainingSeconds: scenario.globals.timerSeconds || null,
      puzzleAttempts: {} // puzzleId → attempts used
    };

    // Apply autoEffects on first node if any
    const startNode = this._getNode(room, scenario.startNodeId);
    if (startNode && startNode.autoEffects) {
      this._applyEffects(room, startNode.autoEffects);
    }
  }

  // ── Get scenario for room ────────────────────────────
  _getScenario(room) {
    return this.scenarioData.scenarios.find(s => s.scenarioId === room.scenarioId);
  }

  // ── Get node by id ───────────────────────────────────
  _getNode(room, nodeId) {
    const scenario = this._getScenario(room);
    if (!scenario) return null;
    return scenario.nodes.find(n => n.id === nodeId) || null;
  }

  // ── Get current node ─────────────────────────────────
  getCurrentNode(room) {
    if (!room.gameState) return null;
    return this._getNode(room, room.gameState.currentNodeId);
  }

  // ── Apply effects array to game state ────────────────
  _applyEffects(room, effects) {
    if (!effects || !Array.isArray(effects)) return;
    for (const eff of effects) {
      if (eff.op === 'add') {
        if (room.gameState.vars[eff.var] === undefined) room.gameState.vars[eff.var] = 0;
        room.gameState.vars[eff.var] += eff.value;
      } else if (eff.op === 'set') {
        room.gameState.vars[eff.var] = eff.value;
      }
    }
  }

  // ── Validate puzzle answer ───────────────────────────
  _validateAnswer(puzzle, answer, room) {
    const pType = puzzle.type;

    if (pType === 'choice') {
      // answer = selected option id
      const chosen = puzzle.options.find(o => o.id === answer);
      return chosen ? chosen.isCorrect === true : false;
    }

    if (pType === 'input_code') {
      const val = puzzle.validation;
      if (val.mode === 'exact') {
        return String(answer).trim() === String(val.answer).trim();
      }
      if (val.mode === 'computed') {
        // Evaluate the expression using game vars
        const vars = room.gameState.vars;
        try {
          // Build a safe evaluation context with game vars
          const keys = Object.keys(vars);
          const values = keys.map(k => vars[k]);
          const fn = new Function(...keys, `return ${val.expression};`);
          const expected = fn(...values);
          return String(answer).trim() === String(expected).trim();
        } catch {
          // Fall back to example if expression fails
          return String(answer).trim() === String(val.example).trim();
        }
      }
      if (val.mode === 'varEquals') {
        const expected = room.gameState.vars[val.var];
        return String(answer).trim() === String(expected).trim();
      }
      return false;
    }

    if (pType === 'input_numeric') {
      const val = puzzle.validation;
      const num = parseFloat(answer);
      if (isNaN(num)) return false;
      if (val.target !== undefined && val.tolerance !== undefined) {
        return Math.abs(num - val.target) <= val.tolerance;
      }
      if (val.min !== undefined && num < val.min) return false;
      if (val.max !== undefined && num > val.max) return false;
      return true;
    }

    if (pType === 'multi_input') {
      // answer = { token1: "...", token2: "...", ... }
      if (!puzzle.validation || !puzzle.validation.fields) return false;
      for (const field of puzzle.validation.fields) {
        const submitted = answer?.[field.id];
        if (field.mode === 'exact') {
          if (String(submitted || '').trim().toUpperCase() !== String(field.answer).trim().toUpperCase()) {
            return false;
          }
        }
      }
      return true;
    }

    if (pType === 'debug_select') {
      const chosen = puzzle.options.find(o => o.id === answer);
      return chosen ? chosen.isCorrect === true : false;
    }

    if (pType === 'logic_match') {
      const val = puzzle.validation;
      if (val.mode === 'exact') {
        return String(answer).trim() === String(val.answer).trim();
      }
      return false;
    }

    if (pType === 'embed_validator') {
      // answer = { vout: 12.1, current: 0.25, ... }
      if (!puzzle.validator || !puzzle.validator.fields) return false;
      for (const field of puzzle.validator.fields) {
        const submitted = parseFloat(answer?.[field.id]);
        if (isNaN(submitted)) return false;
        if (field.target !== undefined && field.tolerance !== undefined) {
          if (Math.abs(submitted - field.target) > field.tolerance) return false;
        }
        if (field.max !== undefined && submitted > field.max) return false;
        if (field.min !== undefined && submitted < field.min) return false;
      }
      return true;
    }

    return false;
  }

  // ── Submit answer for a puzzle ───────────────────────
  submitAnswer(room, puzzleId, answer) {
    const node = this.getCurrentNode(room);
    if (!node) return { error: 'No current node' };

    // Find puzzle in current node
    const puzzle = node.puzzles?.find(p => p.id === puzzleId);
    if (!puzzle) return { error: 'Puzzle not found on current node' };

    // Already solved?
    if (room.gameState.solvedPuzzles.includes(puzzleId)) {
      return { error: 'Already solved', correct: true };
    }

    // Track attempts
    if (!room.gameState.puzzleAttempts[puzzleId]) {
      room.gameState.puzzleAttempts[puzzleId] = 0;
    }
    room.gameState.puzzleAttempts[puzzleId]++;

    const correct = this._validateAnswer(puzzle, answer, room);

    if (correct) {
      room.gameState.solvedPuzzles.push(puzzleId);
      this._applyEffects(room, puzzle.effectsOnSuccess);
      return { correct: true, message: 'Correct!' };
    } else {
      this._applyEffects(room, puzzle.effectsOnFail);

      const attemptsUsed = room.gameState.puzzleAttempts[puzzleId];
      const maxAttempts = puzzle.attemptsAllowed || Infinity;
      const remaining = maxAttempts - attemptsUsed;

      if (remaining <= 0 && maxAttempts !== Infinity) {
        // Force-advance past the puzzle (mark solved to unblock, but with penalty already applied)
        room.gameState.solvedPuzzles.push(puzzleId);
        return { correct: false, message: 'Out of attempts! Moving on with penalty.', exhausted: true };
      }

      return {
        correct: false,
        message: `Wrong answer.${maxAttempts !== Infinity ? ` ${remaining} attempt(s) left.` : ''}`,
        attemptsRemaining: remaining
      };
    }
  }

  // ── Make a choice on a choice_node ───────────────────
  makeChoice(room, choiceId) {
    const node = this.getCurrentNode(room);
    if (!node || node.type !== 'choice_node') {
      return { error: 'Current node is not a choice node' };
    }

    const choice = node.choices?.find(c => c.id === choiceId);
    if (!choice) return { error: 'Choice not found' };

    // Apply choice effects
    if (choice.effects) {
      this._applyEffects(room, choice.effects);
    }

    // Move to the choice's target node
    room.gameState.currentNodeId = choice.nextNodeId;

    // Apply autoEffects on new node
    const newNode = this.getCurrentNode(room);
    if (newNode && newNode.autoEffects) {
      this._applyEffects(room, newNode.autoEffects);
    }

    return { ok: true, nextNodeId: choice.nextNodeId };
  }

  // ── Advance to next node ─────────────────────────────
  advanceNode(room) {
    const node = this.getCurrentNode(room);
    if (!node) return { error: 'No current node' };

    // For puzzle nodes: only advance if all puzzles solved (or node has no puzzles)
    if (node.type === 'puzzle_node' && node.puzzles && node.puzzles.length > 0) {
      const allSolved = node.puzzles.every(p => room.gameState.solvedPuzzles.includes(p.id));
      if (!allSolved) return { error: 'Not all puzzles solved' };
    }

    if (!node.nextNodeId) {
      return { error: 'No next node (terminal)' };
    }

    room.gameState.currentNodeId = node.nextNodeId;

    // Apply autoEffects on new node
    const newNode = this.getCurrentNode(room);
    if (newNode && newNode.autoEffects) {
      this._applyEffects(room, newNode.autoEffects);
    }

    return { ok: true, nextNodeId: node.nextNodeId };
  }

  // ── Check fail conditions ────────────────────────────
  checkFailConditions(room) {
    const scenario = this._getScenario(room);
    if (!scenario || !scenario.globals.failConditions) return false;

    for (const cond of scenario.globals.failConditions) {
      if (cond.type === 'timerExpired') {
        if (room.gameState.timeRemainingSeconds !== null && room.gameState.timeRemainingSeconds <= 0) {
          room.gameState.failReason = cond.reason;
          return true;
        }
        continue;
      }
      const val = room.gameState.vars[cond.var];
      if (val === undefined) continue;
      if (cond.type === 'lte' && val <= cond.value) {
        room.gameState.failReason = cond.reason;
        return true;
      }
      if (cond.type === 'gte' && val >= cond.value) {
        room.gameState.failReason = cond.reason;
        return true;
      }
    }
    return false;
  }

  // ── Build safe client state (strip answers) ──────────
  buildClientState(room) {
    const scenario = this._getScenario(room);
    const node = this.getCurrentNode(room);

    // Strip answer data from puzzles before sending to client
    let clientNode = null;
    if (node) {
      clientNode = JSON.parse(JSON.stringify(node));
      if (clientNode.puzzles) {
        for (const p of clientNode.puzzles) {
          // Remove validation answers
          if (p.validation) {
            delete p.validation.answer;
            delete p.validation.expression;
            delete p.validation.example;
          }
          if (p.validator) {
            for (const f of p.validator.fields) {
              delete f.target;
              delete f.tolerance;
            }
          }
          // Keep options (they're needed for display), but don't reveal isCorrect
          if (p.options) {
            for (const o of p.options) {
              delete o.isCorrect;
            }
          }
        }
      }
    }

    return {
      roomCode: room.roomCode,
      scenarioId: room.scenarioId,
      scenarioTitle: scenario?.title || '',
      phase: room.phase,
      players: room.players.map(p => ({
        id: p.id,
        name: p.name,
        role: p.role,
        connected: p.connected,
        isHost: p.isHost
      })),
      gameState: room.gameState ? {
        currentNodeId: room.gameState.currentNodeId,
        vars: { ...room.gameState.vars },
        solvedPuzzles: [...room.gameState.solvedPuzzles],
        timeRemainingSeconds: room.gameState.timeRemainingSeconds,
        puzzleAttempts: { ...room.gameState.puzzleAttempts }
      } : null,
      currentNode: clientNode,
      roles: this.roles.filter(r => ['builder', 'pathfinder', 'decoder'].includes(r.id))
    };
  }
}

module.exports = { GameEngine };
