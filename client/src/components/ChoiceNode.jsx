import React from 'react';
import socket from '../socket';

export default function ChoiceNode({ choices }) {
  const handleChoice = (choiceId) => {
    socket.emit('MAKE_CHOICE', { choiceId }, (res) => {
      if (res?.error) alert(res.error);
    });
  };

  if (!choices || choices.length === 0) return null;

  return (
    <div className="choice-node">
      <div className="puzzle-panel-header">⚡ Decision Point</div>
      <div className="choice-list">
        {choices.map(choice => (
          <button
            key={choice.id}
            className="choice-card"
            onClick={() => handleChoice(choice.id)}
          >
            {choice.label}
          </button>
        ))}
      </div>
    </div>
  );
}
