import React, { useState, useEffect } from 'react';

const INITIAL_VITALS = [
  { id: 1, date: '2026-11-10', bpSys: 124, bpDia: 82, glucose: 132, status: 'Normal' },
  { id: 2, date: '2026-11-11', bpSys: 142, bpDia: 92, glucose: 178, status: 'Elevated' },
  { id: 3, date: '2026-11-12', bpSys: 128, bpDia: 84, glucose: 145, status: 'Normal' }
];

export default function VitalsTracker({ onVitalsUpdated }) {
  const [vitals, setVitals] = useState(() => {
    const saved = localStorage.getItem('beneficial_vitals_en');
    return saved ? JSON.parse(saved) : INITIAL_VITALS;
  });

  const [newEntry, setNewEntry] = useState({
    bpSys: '',
    bpDia: '',
    glucose: ''
  });

  useEffect(() => {
    localStorage.setItem('beneficial_vitals_en', JSON.stringify(vitals));
    if (onVitalsUpdated) {
      onVitalsUpdated(vitals);
    }
  }, [vitals]);

  const handleAddLog = (e) => {
    e.preventDefault();
    if (!newEntry.glucose || !newEntry.bpSys) return;

    const sys = parseInt(newEntry.bpSys);
    const glu = parseInt(newEntry.glucose);
    const status = (sys >= 140 || glu >= 160) ? 'Elevated' : 'Normal';

    const entry = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      bpSys: sys,
      bpDia: parseInt(newEntry.bpDia) || 80,
      glucose: glu,
      status
    };

    setVitals([entry, ...vitals]);
    setNewEntry({ bpSys: '', bpDia: '', glucose: '' });
  };

  return (
    <section id="vitals" className="card-panel">
      <div className="panel-header">
        <div className="panel-icon-circle">📈</div>
        <div>
          <h2>Longitudinal Vitals & Sugar Tracker</h2>
          <p>
            Log daily fasting blood glucose and blood pressure trends to facilitate early clinical intervention and data-backed consultations.
          </p>
        </div>
      </div>

      {/* Entry Strip */}
      <form onSubmit={handleAddLog} className="vitals-entry-strip">
        <div className="vitals-field">
          <label>Systolic BP</label>
          <div className="input-unit-shell">
            <input 
              type="number" 
              placeholder="120" 
              value={newEntry.bpSys} 
              onChange={(e) => setNewEntry({...newEntry, bpSys: e.target.value})} 
              required 
            />
            <span className="unit-label">mmHg</span>
          </div>
        </div>

        <div className="vitals-field">
          <label>Diastolic BP</label>
          <div className="input-unit-shell">
            <input 
              type="number" 
              placeholder="80" 
              value={newEntry.bpDia} 
              onChange={(e) => setNewEntry({...newEntry, bpDia: e.target.value})} 
            />
            <span className="unit-label">mmHg</span>
          </div>
        </div>

        <div className="vitals-field">
          <label>Fasting Blood Sugar</label>
          <div className="input-unit-shell">
            <input 
              type="number" 
              placeholder="110" 
              value={newEntry.glucose} 
              onChange={(e) => setNewEntry({...newEntry, glucose: e.target.value})} 
              required 
            />
            <span className="unit-label">mg/dL</span>
          </div>
        </div>

        <button type="submit" className="btn-primary">
          📝 Log Reading
        </button>
      </form>

      {/* Historical Data Table */}
      <div className="vitals-table-shell">
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
            {vitals.map((v) => (
              <tr key={v.id}>
                <td>{v.date}</td>
                <td><strong>{v.bpSys} / {v.bpDia}</strong> mmHg</td>
                <td><strong>{v.glucose}</strong> mg/dL</td>
                <td>
                  <span className={`status-capsule ${v.status === 'Elevated' ? 'elevated' : 'normal'}`}>
                    {v.status === 'Elevated' ? '⚠️ Elevated' : '✅ Optimal'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
