import React, { useState } from 'react';

const QUICK_QUESTIONS = [
  "What steps should I take if morning blood glucose exceeds 180 mg/dL?",
  "What should I do if I missed my morning blood pressure pill?",
  "Can you explain the clinical difference between HbA1c and daily Fasting Blood Sugar?",
  "What are the recommended daily sodium limits for hypertensive patients?"
];

export default function ChatAssistant() {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Hello! I am your BENEFICIALai Clinical Assistant. Feel free to ask about your prescribed medications, blood glucose targets, dietary cautions, or how to interpret abnormal lab findings."
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async (queryText) => {
    const textToSend = queryText || inputVal;
    if (!textToSend.trim()) return;

    const userMsg = { sender: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend, language: 'english' })
      });

      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      setMessages((prev) => [...prev, { sender: 'bot', text: data.reply }]);
    } catch (err) {
      const fallbackReplies = {
        "glucose": "If morning fasting blood glucose frequently exceeds 160-180 mg/dL: Ensure anti-diabetic medication (e.g. Metformin) is taken consistently with meals, cut high-glycemic carbohydrates at dinner, engage in light post-dinner movement, and bring your longitudinal logs to your physician.",
        "default": "Consistent adherence to your meal-timed prescriptions and monitoring daily glucose and blood pressure trends are vital for preventing chronic complications. Always check in with your physician for personalized care adjustments."
      };
      const textLower = textToSend.toLowerCase();
      const reply = textLower.includes('glucose') || textLower.includes('sugar') ? fallbackReplies.glucose : fallbackReplies.default;
      setMessages((prev) => [...prev, { sender: 'bot', text: reply }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="chat" className="card-panel">
      <div className="panel-header">
        <div className="panel-icon-circle">💬</div>
        <div>
          <h2>AI Clinical Health Assistant</h2>
          <p>
            Instant conversational guidance on medications, dosage schedules, dietary cautions, and chronic care management.
          </p>
        </div>
      </div>

      {/* Suggested Quick Question Chips */}
      <div className="quick-inquiries">
        {QUICK_QUESTIONS.map((q, idx) => (
          <button 
            key={idx} 
            className="inquiry-chip" 
            onClick={() => sendMessage(q)}
          >
            💡 {q}
          </button>
        ))}
      </div>

      {/* Chat Messages Console */}
      <div className="chat-console-box">
        {messages.map((m, idx) => (
          <div key={idx} className={`message-node ${m.sender}`}>
            <span className="sender-stamp">{m.sender === 'user' ? 'You' : '🌸 BENEFICIALai Assistant'}</span>
            <p>{m.text}</p>
          </div>
        ))}
        {loading && (
          <div className="message-node bot">
            <span className="sender-stamp">🌸 BENEFICIALai Assistant</span>
            <p>Analyzing clinical knowledge base...</p>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="chat-sender-form">
        <input 
          type="text" 
          placeholder="Ask a question about your chronic medications, dosage timings, or lab tests..." 
          value={inputVal} 
          onChange={(e) => setInputVal(e.target.value)} 
        />
        <button type="submit" className="btn-primary" disabled={loading}>
          Send Inquiry
        </button>
      </form>
    </section>
  );
}
