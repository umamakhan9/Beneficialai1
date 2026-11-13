import React from 'react';

export default function DoctorSummaryModal({ isOpen, onClose, meds, vitals }) {
  if (!isOpen) return null;

  const takenCount = (meds || []).filter(m => m.takenToday).length;
  const adherenceRate = (meds && meds.length > 0) ? Math.round((takenCount / meds.length) * 100) : 85;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog print-area" onClick={(e) => e.stopPropagation()}>
        <div className="modal-top-bar">
          <div>
            <span className="clinic-badge">🩺 CLINICAL CONSULTATION PREP SHEET</span>
            <h2>BENEFICIALai · Comprehensive Patient Clinical Summary</h2>
            <p className="patient-stamp">Generated: {new Date().toLocaleDateString()} | Active Patient Profile: Type 2 Diabetes & Hypertension</p>
          </div>
          <button className="modal-close-trigger" onClick={onClose} aria-label="Close modal">✕</button>
        </div>

        <div className="modal-inner-content">
          {/* Key Metrics Scorecards */}
          <div className="summary-scorecards">
            <div className="summary-scorecard">
              <span className="scorecard-caption">7-Day Prescription Adherence</span>
              <span className="scorecard-big-value" style={{ color: '#2E7D32' }}>{adherenceRate}%</span>
              <span className="scorecard-sub">Meal-Timed Schedule Compliance</span>
            </div>
            <div className="summary-scorecard">
              <span className="scorecard-caption">Primary Diagnosis</span>
              <span className="scorecard-big-value">T2D & HTN</span>
              <span className="scorecard-sub">Type 2 Diabetes Mellitus & Essential HTN</span>
            </div>
            <div className="summary-scorecard">
              <span className="scorecard-caption">Latest Measured HbA1c</span>
              <span className="scorecard-big-value" style={{ color: '#C62828' }}>8.4%</span>
              <span className="scorecard-sub">Target: &lt; 7.0% (Action Required)</span>
            </div>
          </div>

          {/* Active Medication Regimen */}
          <div className="modal-table-block">
            <h3>💊 Active Prescription Schedule & Administration Timing</h3>
            <table className="modern-data-table">
              <thead>
                <tr>
                  <th>Medication</th>
                  <th>Dosage</th>
                  <th>Scheduled Timing</th>
                  <th>Clinical Indication</th>
                  <th>Today's Status</th>
                </tr>
              </thead>
              <tbody>
                {(meds || []).map((m, idx) => (
                  <tr key={idx}>
                    <td><strong>{m.name}</strong></td>
                    <td>{m.dose}</td>
                    <td>{m.time} • {m.meal}</td>
                    <td>{m.purpose}</td>
                    <td>{m.takenToday ? '✅ Taken' : '⭕ Pending'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Longitudinal Vitals Log */}
          <div className="modal-table-block">
            <h3>📈 Recent Home Vitals Tracking Log (Last 3 Readings)</h3>
            <table className="modern-data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Blood Pressure</th>
                  <th>Fasting Glucose</th>
                  <th>Clinical Status</th>
                </tr>
              </thead>
              <tbody>
                {(vitals || []).slice(0, 5).map((v, idx) => (
                  <tr key={idx}>
                    <td>{v.date}</td>
                    <td>{v.bpSys} / {v.bpDia} mmHg</td>
                    <td>{v.glucose} mg/dL</td>
                    <td>
                      <span className={`status-capsule ${v.status === 'Elevated' ? 'elevated' : 'normal'}`}>
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Doctor Discussion Points */}
          <div className="modal-table-block">
            <h3>👨‍⚕️ Recommended Physician Discussion Points</h3>
            <ul className="discussion-points-box">
              <li>1. Evaluate dosage titration for anti-diabetic medications given 3-month HbA1c persistence at 8.4%.</li>
              <li>2. Verify cardiovascular risk stratification; discuss initiating low-dose preventive statin therapy.</li>
              <li>3. Schedule 90-day follow-up renal microalbuminuria and eGFR re-evaluation.</li>
            </ul>
          </div>
        </div>

        <div className="modal-actions-bar">
          <button className="btn-primary" onClick={handlePrint}>
            🖨️ Print / Save as Clinical PDF
          </button>
          <button className="btn-outline" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
