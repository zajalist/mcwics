import React, { useState } from 'react';
import { Mail, MessageCircle, HelpCircle, ChevronDown, ChevronUp, Github, ExternalLink } from 'lucide-react';

export default function ContactPage() {
  const [openFAQ, setOpenFAQ] = useState(null);

  const toggleFAQ = (id) => {
    setOpenFAQ(openFAQ === id ? null : id);
  };

  const faqs = [
    {
      id: 'what-is-lockstep',
      question: 'What is LockStep?',
      answer: 'LockStep is a web-based platform for creating and hosting collaborative scavenger hunts. It combines storytelling with interactive puzzles to create engaging team experiences perfect for education, team building, and social events.'
    },
    {
      id: 'free-to-use',
      question: 'Is LockStep free to use?',
      answer: 'Yes! LockStep is completely free and open-source. You can create unlimited scenarios, host unlimited games, and invite as many players as you want.'
    },
    {
      id: 'how-many-players',
      question: 'How many players can join a game?',
      answer: 'There is no hard limit, but we recommend 2-15 players per session for the best experience. Larger groups may experience performance issues depending on server capacity.'
    },
    {
      id: 'mobile-support',
      question: 'Does LockStep work on mobile devices?',
      answer: 'Yes! Players can join games from any device with a web browser. However, the node editor works best on desktop/laptop computers with a larger screen.'
    },
    {
      id: 'offline-mode',
      question: 'Can I run LockStep offline or locally?',
      answer: 'Yes! LockStep is open-source. You can clone the repository, install dependencies, and run both the client and server locally. This is perfect for offline events or custom deployments.'
    },
    {
      id: 'save-progress',
      question: 'Can players save their progress?',
      answer: 'Currently, game sessions are live and not persistent. If players disconnect, they can rejoin using the same room code while the game is active. We\'re exploring save/resume features for future updates.'
    },
    {
      id: 'time-limit',
      question: 'How long do games typically last?',
      answer: 'It depends on the scenario! Most template scenarios take 20-45 minutes. As a creator, you can set a global time limit or let games run indefinitely. We recommend 30-60 minutes for most use cases.'
    },
    {
      id: 'custom-puzzles',
      question: 'Can I create custom puzzle types?',
      answer: 'The current version supports 30+ built-in puzzle types across 9 categories. Custom puzzle types require code modifications, but you can combine existing types creatively to achieve unique challenges.'
    },
    {
      id: 'data-privacy',
      question: 'What data does LockStep collect?',
      answer: 'LockStep collects minimal data: player names (displayed during games), deployed scenario content (if you choose to publish), and optional Firebase authentication info. We don\'t track gameplay data or personal information beyond what\'s necessary for the game to function.'
    },
    {
      id: 'commercial-use',
      question: 'Can I use LockStep for commercial purposes?',
      answer: 'Yes! LockStep is open-source software. You\'re free to use it for educational, commercial, or personal purposes. If you build something cool with it, we\'d love to hear about it!'
    },
    {
      id: 'contribute',
      question: 'How can I contribute to LockStep?',
      answer: 'We welcome contributions! Visit our GitHub repository to report bugs, request features, or submit pull requests. You can also help by creating template scenarios, writing documentation, or sharing feedback.'
    },
    {
      id: 'troubleshooting',
      question: 'What if I encounter technical issues?',
      answer: 'First, check that both the client (port 5173) and server (port 3001) are running. Clear your browser cache and try again. If issues persist, email us with details about the problem, browser version, and any error messages.'
    }
  ];

  return (
    <div className="page contact-page">
      <div className="contact-container">
        <div className="contact-header">
          <Mail size={48} strokeWidth={2} />
          <h1>Get in Touch</h1>
          <p className="contact-subtitle">
            Questions, feedback, or just want to say hi? We're here to help!
          </p>
        </div>

        <div className="contact-sections">
          {/* Contact Info */}
          <section className="contact-card">
            <div className="contact-card-header">
              <MessageCircle size={24} />
              <h2>Contact Information</h2>
            </div>
            <div className="contact-card-body">
              <div className="contact-method">
                <Mail size={20} />
                <div>
                  <strong>Email</strong>
                  <a href="mailto:zejbadr@gmail.com" className="contact-link">
                    zejbadr@gmail.com
                  </a>
                  <p className="contact-desc">
                    For questions, bug reports, feature requests, or collaboration inquiries
                  </p>
                </div>
              </div>

              <div className="contact-method">
                <Github size={20} />
                <div>
                  <strong>GitHub</strong>
                  <a href="https://github.com/yourusername/lockstep" target="_blank" rel="noopener noreferrer" className="contact-link">
                    github.com/yourusername/lockstep
                  </a>
                  <p className="contact-desc">
                    Report issues, contribute code, or browse the source
                  </p>
                </div>
              </div>

              <div className="contact-method">
                <ExternalLink size={20} />
                <div>
                  <strong>Documentation</strong>
                  <a href="/docs" className="contact-link">
                    View Full Documentation
                  </a>
                  <p className="contact-desc">
                    Comprehensive guides for creating and hosting scavenger hunts
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="contact-card">
            <div className="contact-card-header">
              <HelpCircle size={24} />
              <h2>Frequently Asked Questions</h2>
            </div>
            <div className="contact-card-body">
              <div className="faq-list">
                {faqs.map((faq) => {
                  const isOpen = openFAQ === faq.id;
                  return (
                    <div key={faq.id} className={`faq-item ${isOpen ? 'open' : ''}`}>
                      <button
                        className="faq-question"
                        onClick={() => toggleFAQ(faq.id)}
                      >
                        <span>{faq.question}</span>
                        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                      {isOpen && (
                        <div className="faq-answer">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>

        <div className="contact-footer">
          <p>
            <strong>About LockStep:</strong> Built for collaborative learning and team bonding. 
            Open-source, free to use, and designed with educators and community organizers in mind.
          </p>
        </div>
      </div>
    </div>
  );
}
