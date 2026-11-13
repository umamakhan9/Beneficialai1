import React from 'react';

export default function Hero({ onScrollTo }) {
  return (
    <section className="hero-section">
      <div className="hero-pill-badge">
        🎯 Real-World Problem Solved: Post-Discharge Health Literacy & Adherence
      </div>

      <h1 className="hero-main-title">
        Transforming Complex Lab Diagnostics into <br />
        <span className="highlight-gradient">Actionable Chronic Self-Care.</span>
      </h1>

      <p className="hero-lead-text">
        Over 60% of patients with Type 2 Diabetes, Hypertension, and Chronic Kidney Disease cannot comprehend dense medical lab sheets. Compounded by confusing multi-drug schedules, 45% face preventable complications and emergency readmissions. BENEFICIALai bridges this gap with multimodal AI triage, plain-language insights, and automated medication schedules.
      </p>

      {/* Statistics Ribbon */}
      <div className="metrics-ribbon">
        <div className="metric-item">
          <span className="metric-number">60%+</span>
          <span className="metric-desc">Patients Face Diagnostic Illiteracy</span>
        </div>
        <div className="metric-item">
          <span className="metric-number">45%</span>
          <span className="metric-desc">Medication Non-Adherence Risk</span>
        </div>
        <div className="metric-item">
          <span className="metric-number">100%</span>
          <span className="metric-desc">Multimodal AI Triage & Verification</span>
        </div>
      </div>

      <div className="hero-actions">
        <button className="btn-primary" onClick={() => onScrollTo('analyzer')}>
          🔬 Analyze Lab Report
        </button>
        <button className="btn-secondary" onClick={() => onScrollTo('meds')}>
          💊 Daily Medication Companion
        </button>
      </div>
    </section>
  );
}
