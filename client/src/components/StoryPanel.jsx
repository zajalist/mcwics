import React from 'react';

export default function StoryPanel({ story, location }) {
  if (!story) return null;

  return (
    <div className="story-panel">
      <div className="story-location">📍 {location}</div>
      <h2 className="story-title">{story.title}</h2>
      <p className="story-text">{story.text}</p>
      {story.narrationText && (
        <p className="story-narration">
          <em>{story.narrationText}</em>
        </p>
      )}
    </div>
  );
}
