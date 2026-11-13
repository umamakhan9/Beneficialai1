import React, { useState, useEffect } from 'react';

const INITIAL_MEDICATIONS = [
  { id: 1, name: 'Glucophage (Metformin)', dose: '500 mg', time: '08:30 AM', meal: 'With Breakfast', takenToday: true, purpose: 'Glycemic Regulation' },
  { id: 2, name: 'Amlodipine (Norvasc)', dose: '5 mg', time: '09:00 AM', meal: 'After Breakfast', takenToday: true, purpose: 'Blood Pressure Control' },
  { id: 3, name: 'Januvia (Sitagliptin)', dose: '50 mg', time: '01:30 PM', meal: 'After Lunch', takenToday: false, purpose: 'Postprandial Glucose' },
  { id: 4, name: 'Lipiget (Atorvastatin)', dose: '20 mg', time: '09:00 PM', meal: 'After Dinner', takenToday: false, purpose: 'Lipid & Arterial Health' }
];

export default function MedicationCompanion({ onMedsUpdated }) {
  const [meds, setMeds] = useState(() => {
    const saved = localStorage.getItem('beneficial_meds_en');
    return saved ? JSON.parse(saved) : INITIAL_MEDICATIONS;
  });

  const [newMed, setNewMed] = useState({
    name: '',
    dose: '',
    time: '08:00 AM',
    meal: 'After Breakfast',
    purpose: ''
  });

  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    localStorage.setItem('beneficial_meds_en', JSON.stringify(meds));
    if (onMedsUpdated) {
      onMedsUpdated(meds);
    }
  }, [meds]);

  const toggleTaken = (id) => {
    setMeds(meds.map(m => m.id === id ? { ...m, takenToday: !m.takenToday } : m));
  };

  const deleteMed = (id) => {
    setMeds(meds.filter(m => m.id !== id));
  };

  const handleAddMed = (e) => {
    e.preventDefault();
    if (!newMed.name || !newMed.dose) return;

    const item = {
      id: Date.now(),
      name: newMed.name,
      dose: newMed.dose,
      time: newMed.time || '08:00 AM',
      meal: newMed.meal,
      takenToday: false,
      purpose: newMed.purpose || 'Chronic Care Maintenance'
    };

    setMeds([...meds, item]);
    setNewMed({ name: '', dose: '', time: '08:00 AM', meal: 'After Breakfast', purpose: '' });
    setShowAddForm(false);
  };

  const takenCount = meds.filter(m => m.takenToday).length;
  const adherenceRate = meds.length > 0 ? Math.round((takenCount / meds.length) * 100) : 0;

  return (
    <section id="meds" className="card-panel">
      <div className="panel-header">
        <div className="panel-icon-circle">💊</div>
        <div>
          <h2>Smart Medication Companion</h2>
          <p>
            Meal-timed prescription adherence companion engineered to eliminate polypharmacy errors and missed doses.
          </p>
        </div>
      </div>

      {/* Adherence Scorecard */}
      <div className="compliance-scorecard">
        <div className="scorecard-header">
          <span className="scorecard-title">Daily Adherence Compliance</span>
          <span className="scorecard-percent">{adherenceRate}%</span>
        </div>

        <div className="scorecard-track">
          <div 
            className="scorecard-bar" 
            style={{ 
              width: `${adherenceRate}%`, 
              backgroundColor: adherenceRate >= 75 ? '#2E7D32' : (adherenceRate >= 50 ? '#E65100' : '#C62828') 
            }}
          />
        </div>

        <span className="scorecard-footnote">
          {takenCount} of {meds.length} scheduled doses completed today
        </span>
      </div>

      {/* Medication List */}
      <div className="meds-flow">
        {meds.map((med) => (
          <div key={med.id} className={`med-entry-row ${med.takenToday ? 'completed' : ''}`}>
            <div className="med-entry-left">
              <button 
                onClick={() => toggleTaken(med.id)} 
                className={`round-checkbox ${med.takenToday ? 'active' : ''}`}
                aria-label={med.takenToday ? 'Mark as pending' : 'Mark as completed'}
              >
                {med.takenToday ? '✓' : ''}
              </button>
              <div>
                <div className="med-title-group">
                  <span className="med-title">{med.name}</span>
                  <span className="med-dose-pill">{med.dose}</span>
                </div>
                <div className="med-sub-details">
                  <span>⏰ {med.time}</span>
                  <span>🍽️ {med.meal}</span>
                  {med.purpose && <span>🎯 {med.purpose}</span>}
                </div>
              </div>
            </div>

            <div className="med-entry-actions">
              <button 
                className={`status-toggle-btn ${med.takenToday ? 'taken' : 'pending'}`}
                onClick={() => toggleTaken(med.id)}
              >
                {med.takenToday ? '✅ Taken' : '⭕ Take Dose'}
              </button>
              <button 
                onClick={() => deleteMed(med.id)} 
                className="btn-delete-icon" 
                title="Remove Medication"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Medication Action */}
      {!showAddForm ? (
        <button className="btn-open-med-modal" onClick={() => setShowAddForm(true)}>
          ➕ Add Scheduled Prescription
        </button>
      ) : (
        <form onSubmit={handleAddMed} className="med-creation-form">
          <h4>➕ New Medication Details</h4>
          <div className="form-2col-grid">
            <div className="input-block">
              <label>Medication Brand / Generic Name</label>
              <input 
                type="text" 
                placeholder="e.g., Metformin, Amlodipine" 
                value={newMed.name} 
                onChange={(e) => setNewMed({...newMed, name: e.target.value})} 
                required 
              />
            </div>
            <div className="input-block">
              <label>Dosage</label>
              <input 
                type="text" 
                placeholder="e.g., 500 mg, 1 tablet" 
                value={newMed.dose} 
                onChange={(e) => setNewMed({...newMed, dose: e.target.value})} 
                required 
              />
            </div>
            <div className="input-block">
              <label>Scheduled Timing</label>
              <input 
                type="text" 
                placeholder="08:00 AM" 
                value={newMed.time} 
                onChange={(e) => setNewMed({...newMed, time: e.target.value})} 
              />
            </div>
            <div className="input-block">
              <label>Meal Relation</label>
              <select 
                value={newMed.meal} 
                onChange={(e) => setNewMed({...newMed, meal: e.target.value})}
              >
                <option>Before Breakfast (Fasting)</option>
                <option>With Breakfast</option>
                <option>After Breakfast</option>
                <option>After Lunch</option>
                <option>After Dinner</option>
                <option>At Bedtime</option>
              </select>
            </div>
            <div className="input-block span-2">
              <label>Clinical Target / Indication</label>
              <input 
                type="text" 
                placeholder="e.g., Blood Sugar Regulation, Hypertension" 
                value={newMed.purpose} 
                onChange={(e) => setNewMed({...newMed, purpose: e.target.value})} 
              />
            </div>
          </div>
          <div className="form-button-row">
            <button type="submit" className="btn-primary">
              Save Medication
            </button>
            <button type="button" className="btn-outline" onClick={() => setShowAddForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
