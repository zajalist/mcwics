import React from 'react';

export default function RoleCluePanel({ roleClues, myRole }) {
  if (!roleClues || roleClues.length === 0) return null;

  const myClues = roleClues.filter(c => c.roleId === myRole);

  if (myClues.length === 0) {
    return (
      <div className="role-clue-panel">
        <div className="role-clue-header">🔒 Role Intel</div>
        <p className="no-clue">No clues for your role on this node. Help your team!</p>
      </div>
    );
  }

  return (
    <div className="role-clue-panel">
      <div className="role-clue-header">
        🔓 Intel for <span className="role-highlight">{myRole}</span>
      </div>
      {myClues.map((clue, i) => (
        <div key={i} className="role-clue">
          <p>{clue.text}</p>
        </div>
      ))}
    </div>
  );
}
