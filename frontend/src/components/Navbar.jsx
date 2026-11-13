import React from 'react';

export default function Navbar({ onOpenDoctorSummary }) {
  return (
    <header className="navbar">
      <div className="nav-brand">
        <div className="brand-icon-box">🌸</div>
        <div className="brand-info">
          <span className="brand-title">BENEFICIALai</span>
          <span className="brand-subtitle">Intelligence That Benefits Life</span>
        </div>
      </div>

      <div className="nav-controls">
        <span className="hackathon-badge">🏆 DSH Hacks V2 · AI × Healthcare</span>

        <button className="btn-doctor-prep" onClick={onOpenDoctorSummary}>
          📋 Doctor Visit Summary
        </button>
      </div>
    </header>
  );
}
