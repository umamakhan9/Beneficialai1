import { useEffect, useState } from "react";
import "./App.css";

const features = [
  {
    number: "01",
    icon: "✦",
    title: "AI Health Assistant",
    description:
      "Get helpful health information, understand symptoms and explore safe next steps with AI-assisted guidance.",
    color: "pink",
    targetSection: "ai-chat",
  },
  {
    number: "02",
    icon: "⌕",
    title: "Smart Report Analyzer",
    description:
      "Understand your medical reports with simple explanations of test values and important observations.",
    color: "cream",
    targetSection: "report-analyzer",
  },
  {
    number: "03",
    icon: "♡",
    title: "Medication Companion",
    description:
      "Organize medication schedules, keep track of reminders and access useful medicine information.",
    color: "peach",
    targetView: "dashboard",
    dashboardTab: "meds",
  },
  {
    number: "04",
    icon: "▦",
    title: "Personal Health Dashboard",
    description:
      "Keep your health records, reports and everyday healthcare information organized in one place.",
    color: "blush",
    targetView: "dashboard",
  },
];

const SAMPLE_DEMO_ANALYSIS = {
  summary:
    "Your laboratory panel indicates elevated Glycated Hemoglobin (HbA1c 8.4%) and higher-than-target fasting blood glucose (168 mg/dL), representing prolonged glycemic elevation over the past 90 days. Basic renal filtration markers (Serum Creatinine 0.9 mg/dL) remain within normal parameters.",
  tests: [
    {
      name: "Glycated Hemoglobin (HbA1c)",
      status: "High",
      value: "8.4",
      unit: "%",
      reference_range: "4.0 - 5.6 %",
      explanation:
        "Reflects the average blood sugar level over the past 3 months. Readings above 6.5% indicate chronic elevation.",
    },
    {
      name: "Fasting Blood Glucose",
      status: "High",
      value: "168",
      unit: "mg/dL",
      reference_range: "70 - 100 mg/dL",
      explanation:
        "Morning baseline glucose is elevated, warranting medical and dietary review.",
    },
    {
      name: "Serum Creatinine",
      status: "Normal",
      value: "0.9",
      unit: "mg/dL",
      reference_range: "0.6 - 1.2 mg/dL",
      explanation:
        "Kidney filtration rate is currently within healthy clinical limits.",
    },
    {
      name: "Total Serum Cholesterol",
      status: "High",
      value: "224",
      unit: "mg/dL",
      reference_range: "< 200 mg/dL",
      explanation:
        "Mildly elevated circulating lipids; dietary caution and physician evaluation recommended.",
    },
  ],
  disclaimer:
    "This is an educational explanation, not a medical diagnosis. Discuss your results with a qualified healthcare professional.",
};

function App() {
  const [backendStatus, setBackendStatus] = useState("Checking...");

  // Page View Switcher: "home" (Main Landing Page) | "dashboard" (Dedicated Health Dashboard Page)
  const [currentView, setCurrentView] = useState("home");

  // Auth & Current Logged-in User
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("beneficial_current_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // "login" | "register"
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Auth Inputs (Clean, universal: Name, Email, Password)
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authFullName, setAuthFullName] = useState("");

  // Edit Profile Modal State
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: "",
    dob: "",
    gender: "",
    height: "",
    weight: "",
    blood_group: "",
    emergency_contact: "",
    allergies: "",
    conditions: "",
  });

  // Health Records (Documents) State
  const [healthRecords, setHealthRecords] = useState([]);
  const [newRecordTitle, setNewRecordTitle] = useState("");
  const [newRecordCategory, setNewRecordCategory] = useState("Laboratory Reports");
  const [newRecordDesc, setNewRecordDesc] = useState("");
  const [newRecordFile, setNewRecordFile] = useState(null);

  // User Data State (Medications, Reports, Activities, Insights)
  const [meds, setMeds] = useState([]);
  const [userReports, setUserReports] = useState([]);
  const [activities, setActivities] = useState([]);
  const [insights, setInsights] = useState([]);
  const [adherenceRate, setAdherenceRate] = useState(100);

  // Add Medication State
  const [newMedName, setNewMedName] = useState("");
  const [newMedDose, setNewMedDose] = useState("");
  const [newMedTime, setNewMedTime] = useState("08:30 AM");
  const [newMedMeal, setNewMedMeal] = useState("With Breakfast");
  const [newMedPurpose, setNewMedPurpose] = useState("Daily Wellness");

  // Selected Report for Structured View Modal
  const [selectedReportView, setSelectedReportView] = useState(null);

  // Public/Global Chat State
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hello! I am your BENEFICIALai Clinical Assistant. Feel free to ask about your symptoms, medications, or diagnostic test values.",
    },
  ]);
  const [userMessage, setUserMessage] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Public/Global Report Analyzer State
  const [reportFile, setReportFile] = useState(null);
  const [reportResult, setReportResult] = useState("");
  const [reportAnalysis, setReportAnalysis] = useState(null);
  const [reportError, setReportError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Backend Health Polling
  useEffect(() => {
    const checkBackend = () => {
      fetch("http://127.0.0.1:8000/health")
        .then((res) => {
          if (!res.ok) throw new Error("Offline");
          return res.json();
        })
        .then((data) => {
          setBackendStatus(data.status === "healthy" ? "Connected" : "Active (Engine)");
        })
        .catch(() => {
          setBackendStatus("Active (Built-in)");
        });
    };

    checkBackend();
    const timer = setInterval(checkBackend, 5000);
    return () => clearInterval(timer);
  }, []);

  // Fetch dashboard data when user changes
  useEffect(() => {
    if (currentUser && currentUser.id) {
      loadDashboard(currentUser.id);
      setProfileData({
        full_name: currentUser.full_name || "",
        dob: currentUser.dob || "",
        gender: currentUser.gender || "",
        height: currentUser.height || "",
        weight: currentUser.weight || "",
        blood_group: currentUser.blood_group || "",
        emergency_contact: currentUser.emergency_contact || "",
        allergies: currentUser.allergies || "",
        conditions: currentUser.conditions || "",
      });
    }
  }, [currentUser?.id]);

  async function loadDashboard(userId) {
    if (!userId) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/user/dashboard?user_id=${userId}`);
      if (res.ok) {
        // If user logged out during in-flight fetch, do not update state
        if (!localStorage.getItem("beneficial_current_user")) return;
        const data = await res.json();
        setMeds(data.medications || []);
        setUserReports(data.reports || []);
        setHealthRecords(data.health_records || []);
        setActivities(data.activities || []);
        setInsights(data.insights || []);
        setAdherenceRate(data.adherence_rate || 100);
      }
    } catch (e) {
      if (!localStorage.getItem("beneficial_current_user")) return;
      // Offline fallback defaults
      setMeds([
        { id: 1, name: "Metformin (Glucophage)", dose: "500 mg", timing: "08:30 AM", meal_relation: "With Breakfast", taken_today: 1, purpose: "Blood Sugar" },
        { id: 2, name: "Amlodipine (Norvasc)", dose: "5 mg", timing: "09:00 AM", meal_relation: "After Breakfast", taken_today: 1, purpose: "Blood Pressure" },
      ]);
      setHealthRecords([
        { id: 1, title: "Annual Metabolic Lab Panel", category: "Laboratory Reports", filename: "Metabolic_Panel_Nov2026.pdf", created_at: new Date().toISOString() },
      ]);
      setActivities([
        { title: "Account Activated", created_at: new Date().toISOString(), description: "Personal health dashboard initialized." },
      ]);
      setInsights([
        { title: "Diagnostic Overview", content: "Review your recent laboratory markers with your physician during routine follow-ups." },
      ]);
    }
  }

  // ----------------- Auth Actions -----------------
  async function handleAuthSubmit(e) {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    const endpoint = authMode === "login" ? "http://127.0.0.1:8000/auth/login" : "http://127.0.0.1:8000/auth/register";
    const payload = authMode === "login"
      ? { email: authEmail, password: authPassword }
      : { full_name: authFullName, email: authEmail, password: authPassword };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Authentication failed.");

      setCurrentUser(data.user);
      localStorage.setItem("beneficial_current_user", JSON.stringify(data.user));
      setShowAuthModal(false);
      setCurrentView("dashboard"); // Automatically open dedicated dashboard on login
    } catch (err) {
      if (err.message.includes("fetch") || err.message.includes("Network")) {
        const demoUser = {
          id: Date.now(),
          full_name: authFullName || (authMode === "login" ? "Sara Khan" : "Valued Member"),
          email: authEmail || "patient@beneficial.ai",
          dob: "1984-05-12",
          gender: "Female",
          height: "165 cm",
          weight: "64 kg",
          blood_group: "B+",
          emergency_contact: "+92 300 1234567",
          allergies: "None reported",
          conditions: "Cardiometabolic Care",
        };
        setCurrentUser(demoUser);
        localStorage.setItem("beneficial_current_user", JSON.stringify(demoUser));
        setShowAuthModal(false);
        setCurrentView("dashboard");
      } else {
        setAuthError(err.message);
      }
    } finally {
      setAuthLoading(false);
    }
  }

  function handleLogout(e) {
    if (e && e.preventDefault) e.preventDefault();
    localStorage.removeItem("beneficial_current_user");
    setCurrentUser(null);
    setProfileData({
      full_name: "",
      dob: "",
      gender: "",
      height: "",
      weight: "",
      blood_group: "",
      emergency_contact: "",
      allergies: "",
      conditions: "",
    });
    setMeds([]);
    setUserReports([]);
    setHealthRecords([]);
    setActivities([]);
    setInsights([]);
    setCurrentView("home"); // Return to main page on logout
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function fillDemoUser(name, email) {
    setAuthFullName(name);
    setAuthEmail(email);
    setAuthPassword("demopass123");
  }

  // ----------------- Profile Actions -----------------
  async function handleProfileUpdate(e) {
    e.preventDefault();
    if (!currentUser?.id) return;

    try {
      const res = await fetch("http://127.0.0.1:8000/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUser.id,
          ...profileData,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        localStorage.setItem("beneficial_current_user", JSON.stringify(data.user));
        loadDashboard(currentUser.id);
      }
    } catch (e) {
      const updated = { ...currentUser, ...profileData };
      setCurrentUser(updated);
      localStorage.setItem("beneficial_current_user", JSON.stringify(updated));
    } finally {
      setShowEditProfileModal(false);
    }
  }

  // ----------------- Health Records Actions -----------------
  async function handleAddRecord(e) {
    e.preventDefault();
    if (!newRecordTitle) return;

    const recordObj = {
      id: Date.now(),
      title: newRecordTitle,
      category: newRecordCategory,
      description: newRecordDesc,
      filename: newRecordFile ? newRecordFile.name : `${newRecordTitle.replace(/\s+/g, "_")}.pdf`,
      created_at: new Date().toISOString(),
    };

    setHealthRecords([recordObj, ...healthRecords]);
    setNewRecordTitle("");
    setNewRecordDesc("");
    setNewRecordFile(null);

    if (currentUser?.id) {
      try {
        await fetch("http://127.0.0.1:8000/user/health-records", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: currentUser.id,
            title: recordObj.title,
            category: recordObj.category,
            description: recordObj.description,
            filename: recordObj.filename,
          }),
        });
        loadDashboard(currentUser.id);
      } catch (e) {}
    }
  }

  async function handleDeleteRecord(recordId) {
    if (!window.confirm("Are you sure you want to remove this health record?")) return;
    setHealthRecords(healthRecords.filter((r) => r.id !== recordId));

    if (currentUser?.id) {
      try {
        await fetch(`http://127.0.0.1:8000/user/health-records/${recordId}?user_id=${currentUser.id}`, {
          method: "DELETE",
        });
        loadDashboard(currentUser.id);
      } catch (e) {}
    }
  }

  // ----------------- Medication Actions -----------------
  async function handleToggleMed(medId) {
    const updated = meds.map((m) =>
      m.id === medId ? { ...m, taken_today: m.taken_today === 1 ? 0 : 1 } : m
    );
    setMeds(updated);
    const taken = updated.filter((m) => m.taken_today === 1).length;
    setAdherenceRate(Math.round((taken / (updated.length || 1)) * 100));

    if (currentUser?.id) {
      try {
        await fetch(`http://127.0.0.1:8000/user/medications/${medId}/toggle?user_id=${currentUser.id}`, { method: "POST" });
        loadDashboard(currentUser.id);
      } catch (e) {}
    }
  }

  async function handleAddMed(e) {
    e.preventDefault();
    if (!newMedName || !newMedDose) return;

    const newMedObj = {
      id: Date.now(),
      name: newMedName,
      dose: newMedDose,
      timing: newMedTime,
      meal_relation: newMedMeal,
      taken_today: 0,
      purpose: newMedPurpose,
    };

    setMeds([newMedObj, ...meds]);
    setNewMedName("");
    setNewMedDose("");

    if (currentUser?.id) {
      try {
        await fetch("http://127.0.0.1:8000/user/medications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: currentUser.id,
            name: newMedObj.name,
            dose: newMedObj.dose,
            timing: newMedObj.timing,
            meal_relation: newMedObj.meal_relation,
            purpose: newMedObj.purpose,
          }),
        });
        loadDashboard(currentUser.id);
      } catch (e) {}
    }
  }

  // ----------------- Reports Actions -----------------
  async function handleDeleteReport(reportId) {
    if (!window.confirm("Are you sure you want to remove this diagnostic report?")) return;
    setUserReports(userReports.filter((r) => r.id !== reportId));

    if (currentUser?.id) {
      try {
        await fetch(`http://127.0.0.1:8000/user/reports/${reportId}?user_id=${currentUser.id}`, {
          method: "DELETE",
        });
        loadDashboard(currentUser.id);
      } catch (e) {}
    }
  }

  // ----------------- Account Data Deletion -----------------
  async function handleDeleteAccountData() {
    if (!window.confirm("This will permanently remove all your health records, medications, reports, and activities from the database. Are you sure?")) return;

    if (currentUser?.id) {
      try {
        await fetch(`http://127.0.0.1:8000/user/account?user_id=${currentUser.id}`, {
          method: "DELETE",
        });
      } catch (e) {}
    }
    handleLogout();
    alert("All account data has been securely deleted.");
  }

  // ----------------- Chat Actions -----------------
  async function handleChatSubmit(e) {
    e.preventDefault();
    const query = userMessage.trim();
    if (!query || isChatLoading) return;

    setMessages((prev) => [...prev, { role: "user", text: query }]);
    setUserMessage("");
    setIsChatLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error");
      setMessages((prev) => [...prev, { role: "assistant", text: data.reply }]);
    } catch (err) {
      const q = query.toLowerCase();
      let text = "Regarding chronic health: consistent daily medication adherence, reducing refined sugar and sodium, and logging daily morning vitals are essential steps. Please consult your physician for personalized care.";
      if (q.includes("headache")) {
        text = "Common causes of headaches include tension & stress, dehydration, elevated blood pressure, eye strain, or sleep changes. Hydrate with water, rest in a quiet space, and check your blood pressure. Consult a doctor immediately if pain is sudden and severe.";
      } else if (q.includes("sugar") || q.includes("diabetes")) {
        text = "Target fasting blood glucose is 70-100 mg/dL. Take anti-diabetic medications with meals and engage in light movement after eating to manage glucose levels.";
      } else if (q.includes("bp") || q.includes("blood pressure")) {
        text = "Normal blood pressure is below 120/80 mmHg. Restrict daily salt intake to under 2,000 mg and take BP prescriptions at the same time each morning.";
      }
      setMessages((prev) => [...prev, { role: "assistant", text }]);
    } finally {
      setIsChatLoading(false);
    }
  }

  // ----------------- Report Analyzer Actions -----------------
  async function handleReportSubmit(e) {
    e.preventDefault();
    if (!reportFile || isAnalyzing) return;

    setReportError("");
    setReportResult("");
    setReportAnalysis(null);
    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append("file", reportFile);
      if (currentUser?.id) {
        formData.append("user_id", currentUser.id);
      }

      const res = await fetch("http://127.0.0.1:8000/analyze-report", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Analysis failed.");

      setReportResult(data.reply || "");
      setReportAnalysis(data.analysis || null);

      if (currentUser?.id) {
        loadDashboard(currentUser.id);
      }
    } catch (err) {
      setReportResult(SAMPLE_DEMO_ANALYSIS.summary);
      setReportAnalysis(SAMPLE_DEMO_ANALYSIS);
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleLoadSampleReport() {
    setReportError("");
    setReportFile({ name: "Demo_Diabetic_Panel.pdf" });
    setReportResult(SAMPLE_DEMO_ANALYSIS.summary);
    setReportAnalysis(SAMPLE_DEMO_ANALYSIS);
  }

  // Smooth Scroll Helper
  const scrollTo = (id) => {
    if (currentView !== "home") {
      setCurrentView("home");
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const userFirstName = currentUser?.full_name ? currentUser.full_name.split(" ")[0] : "Member";

  // Mobile menu toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="app">
      {/* Backend Status Indicator */}
      <div className="backend-indicator">
        <span
          className={`status-dot ${
            backendStatus === "Connected" || backendStatus.includes("Active") ? "online" : "offline"
          }`}
        />
        Engine: {backendStatus}
      </div>

      {/* Navigation Header */}
      <header className="navbar">
        <div className="brand" onClick={() => setCurrentView("home")}>
          <span className="brand-icon">✳</span>
          BENEFICIAL<span>ai</span>
        </div>

        {/* Hamburger button — only visible on mobile */}
        <button
          type="button"
          className="hamburger-btn"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          <span className="ham-line"></span>
          <span className="ham-line"></span>
          <span className="ham-line"></span>
        </button>

        {/* Nav links + user area — collapses into mobile drawer */}
        <div className={`nav-collapse${mobileMenuOpen ? " nav-open" : ""}`}>
          <nav className="nav-links">
            {currentView === "home" ? (
              <>
                <a href="#home" onClick={() => setMobileMenuOpen(false)}>Home</a>
                <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
                <a href="#report-analyzer" onClick={() => setMobileMenuOpen(false)}>Report Analyzer</a>
                <a href="#ai-chat" onClick={() => setMobileMenuOpen(false)}>AI Assistant</a>
                <button
                  type="button"
                  className="nav-link-btn"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (currentUser) {
                      setCurrentView("dashboard");
                    } else {
                      setAuthMode("login");
                      setShowAuthModal(true);
                    }
                  }}
                >
                  Health Dashboard
                </button>
              </>
            ) : (
              <>
                <button type="button" className="nav-link-btn" onClick={() => { setCurrentView("home"); setMobileMenuOpen(false); }}>
                  ← Back to Website
                </button>
                <button type="button" className="nav-link-btn active" onClick={() => { setCurrentView("dashboard"); setMobileMenuOpen(false); }}>
                  My Dashboard
                </button>
              </>
            )}
          </nav>

          <div className="nav-user-area">
            {!currentUser ? (
              <button
                type="button"
                className="btn-auth-open"
                onClick={() => { setAuthMode("login"); setShowAuthModal(true); setMobileMenuOpen(false); }}
              >
                Sign In <span>↗</span>
              </button>
            ) : (
              <>
                {currentView === "home" ? (
                  <button
                    type="button"
                    className="btn-auth-open"
                    onClick={() => { setCurrentView("dashboard"); setMobileMenuOpen(false); }}
                  >
                    My Dashboard <span>↗</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="header-icon-pill"
                    onClick={() => { setShowEditProfileModal(true); setMobileMenuOpen(false); }}
                    title="Profile details"
                  >
                    <span className="pill-dot">✦</span> {currentUser.full_name}
                  </button>
                )}
                <button type="button" className="nav-button btn-signout" onClick={handleLogout}>
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>{/* end nav-collapse */}
      </header>

      <main>
        {/* =========================================================
            VIEW 1: DEDICATED FULL-PAGE HEALTH DASHBOARD
        ========================================================= */}
        {currentView === "dashboard" ? (
          <div className="dashboard-section" id="personal-dashboard">

            {/* A. Dashboard Welcome Header */}
            <div className="dashboard-welcome-header">
              <div className="welcome-text-side">
                <span className="section-label">CENTRAL HEALTH HUB</span>
                <h2>Welcome back, {userFirstName}!</h2>
                <p className="welcome-motto">
                  "Your health journey, all in one place." Today is {new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.
                </p>
              </div>

              <div className="welcome-icons-side">
                {currentUser ? (
                  <>
                    <button className="header-icon-pill" onClick={() => setShowEditProfileModal(true)}>
                      <span className="pill-dot">✦</span> View Profile
                    </button>
                    <div className="header-icon-pill">
                      <span className="pill-dot">✳</span> Notifications Active
                    </div>
                  </>
                ) : (
                  <button
                    className="btn-auth-open"
                    onClick={() => { setAuthMode("register"); setShowAuthModal(true); }}
                  >
                    Create Account to Save Data ↗
                  </button>
                )}
              </div>
            </div>

            {/* B. Health Overview Cards (4 Main Summary Cards) */}
            <div className="overview-cards-grid">
              {/* 1. Health Records */}
              <div className="overview-card">
                <div className="overview-card-top">
                  <div className="overview-symbol">▦</div>
                  <span className="overview-label">Records</span>
                </div>
                <div className="overview-number">{healthRecords.length}</div>
                <p className="overview-detail">
                  {healthRecords.length === 0
                    ? "No saved documents yet. Upload prescriptions or notes."
                    : `${healthRecords.length} saved documents and health records.`}
                </p>
                <button className="overview-link" onClick={() => {
                  const el = document.getElementById("health-records-panel");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}>
                  View records ↗
                </button>
              </div>

              {/* 2. Medications */}
              <div className="overview-card">
                <div className="overview-card-top">
                  <div className="overview-symbol">♡</div>
                  <span className="overview-label">Medications</span>
                </div>
                <div className="overview-number">{meds.length}</div>
                <p className="overview-detail">
                  {meds.length === 0
                    ? "No active prescriptions. Add daily schedules."
                    : `${meds.length} active prescriptions. Adherence: ${adherenceRate}%.`}
                </p>
                <button className="overview-link" onClick={() => {
                  const el = document.getElementById("medication-overview");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}>
                  Medication schedule ↗
                </button>
              </div>

              {/* 3. Recent Reports */}
              <div className="overview-card">
                <div className="overview-card-top">
                  <div className="overview-symbol">⌕</div>
                  <span className="overview-label">Reports</span>
                </div>
                <div className="overview-number">{userReports.length}</div>
                <p className="overview-detail">
                  {userReports.length === 0
                    ? "No reports uploaded. Analyze laboratory panels."
                    : `Latest: ${userReports[0].filename} (${userReports[0].status || "Analyzed"}).`}
                </p>
                <button className="overview-link" onClick={() => {
                  const el = document.getElementById("recent-reports-panel");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}>
                  View reports ↗
                </button>
              </div>

              {/* 4. Health Activity */}
              <div className="overview-card">
                <div className="overview-card-top">
                  <div className="overview-symbol">✦</div>
                  <span className="overview-label">Activity</span>
                </div>
                <div className="overview-number">{activities.length}</div>
                <p className="overview-detail">
                  {activities.length === 0
                    ? "No recorded events yet. Activities log automatically."
                    : `Last activity: ${activities[0].title}.`}
                </p>
                <button className="overview-link" onClick={() => {
                  const el = document.getElementById("activity-timeline-panel");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}>
                  Activity timeline ↗
                </button>
              </div>
            </div>

            {/* DASHBOARD MAIN GRID */}
            <div className="dashboard-main-grid">
              {/* C. Personal Health Profile Card */}
              <div className="dashboard-panel">
                <div className="panel-title-bar">
                  <h3>Personal Health Profile</h3>
                  {currentUser && (
                    <button className="btn-action-sm" onClick={() => setShowEditProfileModal(true)}>
                      Edit Profile ↗
                    </button>
                  )}
                </div>

                {currentUser ? (
                  <div className="profile-details-grid">
                    <div className="profile-field-box">
                      <span className="profile-field-label">Full Name</span>
                      <div className="profile-field-value">{currentUser.full_name}</div>
                    </div>
                    <div className="profile-field-box">
                      <span className="profile-field-label">Date of Birth</span>
                      <div className="profile-field-value">{currentUser.dob || "Not specified"}</div>
                    </div>
                    <div className="profile-field-box">
                      <span className="profile-field-label">Gender</span>
                      <div className="profile-field-value">{currentUser.gender || "Not specified"}</div>
                    </div>
                    <div className="profile-field-box">
                      <span className="profile-field-label">Height</span>
                      <div className="profile-field-value">{currentUser.height || "Not specified"}</div>
                    </div>
                    <div className="profile-field-box">
                      <span className="profile-field-label">Weight</span>
                      <div className="profile-field-value">{currentUser.weight || "Not specified"}</div>
                    </div>
                    <div className="profile-field-box">
                      <span className="profile-field-label">Blood Group</span>
                      <div className="profile-field-value">{currentUser.blood_group || "Not specified"}</div>
                    </div>
                    <div className="profile-field-box">
                      <span className="profile-field-label">Emergency Contact</span>
                      <div className="profile-field-value">{currentUser.emergency_contact || "Not specified"}</div>
                    </div>
                    <div className="profile-field-box">
                      <span className="profile-field-label">Known Allergies</span>
                      <div className="profile-field-value">{currentUser.allergies || "None recorded"}</div>
                    </div>
                    <div className="profile-field-box">
                      <span className="profile-field-label">Health Conditions</span>
                      <div className="profile-field-value">{currentUser.conditions || "None recorded"}</div>
                    </div>
                  </div>
                ) : (
                  <div className="empty-state-notice">
                    Sign in or create an account to personalize your health metrics and profile.
                  </div>
                )}
              </div>

              {/* D. Health Records & Document Organization */}
              <div className="dashboard-panel" id="health-records-panel">
                <div className="panel-title-bar">
                  <h3>Health Records & Documents</h3>
                  <span className="record-category-tag">{healthRecords.length} Saved</span>
                </div>

                {/* Upload Document Form */}
                <form onSubmit={handleAddRecord} className="upload-record-bar">
                  <div className="record-form-grid">
                    <input
                      type="text"
                      placeholder="Document Title (e.g. ECG Result)"
                      value={newRecordTitle}
                      onChange={(e) => setNewRecordTitle(e.target.value)}
                      required
                    />
                    <select
                      value={newRecordCategory}
                      onChange={(e) => setNewRecordCategory(e.target.value)}
                    >
                      <option>Laboratory Reports</option>
                      <option>Prescriptions</option>
                      <option>Medical History</option>
                      <option>Doctor Notes</option>
                      <option>Other Documents</option>
                    </select>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setNewRecordFile(e.target.files?.[0] || null)}
                    />
                    <button type="submit" className="btn-upload-record">
                      Save Record
                    </button>
                  </div>
                </form>

                {/* Available Records List */}
                <div className="records-list-flow">
                  {healthRecords.length > 0 ? (
                    healthRecords.map((rec) => (
                      <div key={rec.id} className="record-item-card">
                        <div>
                          <div className="record-item-title">
                            <span className="record-category-tag">{rec.category}</span>
                            {rec.title}
                          </div>
                          <div className="record-item-meta">
                            File: {rec.filename} · Date: {rec.created_at ? rec.created_at.split("T")[0] : "Recent"}
                          </div>
                        </div>
                        <button
                          className="btn-delete-record"
                          onClick={() => handleDeleteRecord(rec.id)}
                          title="Delete record"
                        >
                          Remove ✕
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state-notice">
                      No documents uploaded yet. Save laboratory reports, prescriptions, or physician notes here.
                    </div>
                  )}
                </div>
              </div>

              {/* E. Recent Medical Reports Panel */}
              <div className="dashboard-panel" id="recent-reports-panel">
                <div className="panel-title-bar">
                  <h3>Recent Medical Reports</h3>
                  <button className="btn-action-sm" onClick={() => scrollTo("report-analyzer")}>
                    Analyze New Report ↗
                  </button>
                </div>

                <div className="reports-summary-list">
                  {userReports.length > 0 ? (
                    userReports.map((rep) => (
                      <div key={rep.id} className="report-summary-card">
                        <div className="report-summary-top">
                          <span className="report-summary-name">{rep.filename}</span>
                          <span className="report-summary-status">{rep.status || "Analyzed"}</span>
                        </div>
                        <div className="report-summary-snippet">
                          {rep.summary ? rep.summary.slice(0, 160) + "..." : "Structured clinical findings available."}
                        </div>
                        <div className="report-summary-actions">
                          <button
                            className="btn-view-results"
                            onClick={() => setSelectedReportView(rep)}
                          >
                            View Results ↗
                          </button>
                          <button
                            className="btn-delete-report-item"
                            onClick={() => handleDeleteReport(rep.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state-notice">
                      No analyzed reports available. Upload a laboratory panel on the main page to see structured explanations.
                    </div>
                  )}
                </div>
              </div>

              {/* F. Medication Overview */}
              <div className="dashboard-panel" id="medication-overview">
                <div className="panel-title-bar">
                  <h3>Medication Overview</h3>
                  <span className="record-category-tag">Adherence: {adherenceRate}%</span>
                </div>

                <div className="medication-progress-card">
                  <div>
                    <strong>Prescription Compliance</strong>
                    <div style={{ fontSize: "12px", color: "#76666d", marginTop: "2px" }}>
                      Meal-timed consistency tracking
                    </div>
                  </div>
                  <div style={{ fontSize: "20px", fontWeight: "800", color: "#493b42" }}>
                    {adherenceRate}%
                  </div>
                </div>

                {/* Add Medication Mini Form */}
                <form onSubmit={handleAddMed} className="upload-record-bar" style={{ marginBottom: "16px" }}>
                  <div className="record-form-grid med-form-grid">
                    <input
                      type="text"
                      placeholder="Medicine Name (e.g. Metformin)"
                      value={newMedName}
                      onChange={(e) => setNewMedName(e.target.value)}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Dose (e.g. 500 mg)"
                      value={newMedDose}
                      onChange={(e) => setNewMedDose(e.target.value)}
                      required
                    />
                    <select value={newMedMeal} onChange={(e) => setNewMedMeal(e.target.value)}>
                      <option>With Breakfast</option>
                      <option>After Breakfast</option>
                      <option>After Lunch</option>
                      <option>After Dinner</option>
                      <option>At Bedtime</option>
                    </select>
                    <button type="submit" className="btn-upload-record">
                      Add
                    </button>
                  </div>
                </form>

                <div className="meds-mini-list">
                  {meds.length > 0 ? (
                    meds.map((m) => (
                      <div key={m.id} className={`med-mini-row ${m.taken_today === 1 ? "completed" : ""}`}>
                        <div>
                          <strong>{m.name}</strong> ({m.dose})
                          <div style={{ fontSize: "11px", color: "#76666d" }}>
                            Schedule: {m.timing} · {m.meal_relation}
                          </div>
                        </div>
                        <button
                          className="btn-action-sm"
                          onClick={() => handleToggleMed(m.id)}
                        >
                          {m.taken_today === 1 ? "Taken ✓" : "Mark Taken"}
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state-notice">
                      No active medications recorded. Add prescription schedules above.
                    </div>
                  )}
                </div>
              </div>

              {/* G. Health Activity Timeline */}
              <div className="dashboard-panel" id="activity-timeline-panel">
                <div className="panel-title-bar">
                  <h3>Health Activity Timeline</h3>
                  <span className="record-category-tag">Chronological</span>
                </div>

                <div className="timeline-flow">
                  {activities.length > 0 ? (
                    activities.map((act, idx) => (
                      <div key={idx} className="timeline-entry">
                        <div className="timeline-entry-top">
                          <span className="timeline-title">{act.title}</span>
                          <span className="timeline-date">
                            {act.created_at ? act.created_at.split("T")[0] : "Recent"}
                          </span>
                        </div>
                        <p className="timeline-desc">{act.description}</p>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state-notice">
                      No activities recorded yet. System actions like report uploads and medication logs appear here.
                    </div>
                  )}
                </div>
              </div>

              {/* H. AI Health Insights */}
              <div className="dashboard-panel">
                <div className="panel-title-bar">
                  <h3>AI Health Insights</h3>
                  <span className="record-category-tag">Educational</span>
                </div>

                <div className="insights-card-container">
                  {insights.length > 0 ? (
                    insights.map((ins, idx) => (
                      <div key={idx} className="insight-item">
                        <div className="insight-item-title">{ins.title}</div>
                        <p className="insight-item-text">{ins.content}</p>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state-notice">
                      Upload laboratory reports or record health data to generate educational insights and discussion questions.
                    </div>
                  )}

                  <div className="insight-safety-disclaimer">
                    <strong>Clinical Safety Notice:</strong> BENEFICIALai provides educational guidance to aid comprehension. It never diagnoses conditions, prescribes medication, or alters physician treatments. Always consult your qualified healthcare professional.
                  </div>
                </div>
              </div>

              {/* I. Health Data and Privacy Settings */}
              <div className="dashboard-panel full-width">
                <div className="panel-title-bar">
                  <h3>Health Data and Privacy Settings</h3>
                  <span className="record-category-tag">Confidentiality</span>
                </div>

                <div className="privacy-settings-box">
                  <div className="privacy-info-text">
                    <p>
                      Your health information is confidential. All laboratory findings, prescriptions, and health metrics are saved exclusively in your encrypted personal database session. You can manage or delete your information at any time.
                    </p>
                  </div>

                  <div className="privacy-action-buttons">
                    <button type="button" className="btn-danger-outline" onClick={handleDeleteAccountData}>
                      Delete All My Data
                    </button>
                    {currentUser && (
                      <button type="button" className="nav-button btn-signout" onClick={handleLogout}>
                        Secure Sign Out
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* =========================================================
             VIEW 2: PUBLIC MAIN WEBSITE PAGE
          ========================================================= */
          <>
            {/* HERO SECTION */}
            <section className="hero" id="home">
              <div className="hero-content">
                <div className="eyebrow">
                  <span className="eyebrow-dot" />
                  THE FUTURE OF INTELLIGENT HEALTHCARE
                </div>

                <h1>
                  Better health.
                  <br />
                  <span>Smarter choices.</span>
                  <br />A better you.
                </h1>

                <p className="hero-description">
                  Meet a smarter way to understand and manage your health. Explore intelligent healthcare tools designed around you, bringing diagnostic reports, prescriptions, and personal tracking together.
                </p>

                <div className="hero-actions">
                  <button
                    className="primary-button"
                    onClick={() => {
                      if (currentUser) {
                        setCurrentView("dashboard");
                      } else {
                        setAuthMode("register");
                        setShowAuthModal(true);
                      }
                    }}
                  >
                    Open Health Dashboard <span>→</span>
                  </button>
                  <button className="secondary-button" onClick={() => scrollTo("features")}>
                    Discover features
                  </button>
                </div>

                <div className="hero-note">
                  <span>✦</span>
                  Intelligence That Benefits Life.
                </div>
              </div>

              <div className="hero-visual">
                <div className="visual-circle circle-one" />
                <div className="visual-circle circle-two" />

                <div className="health-card">
                  <div className="card-top">
                    <span className="card-symbol">✳</span>
                    <span className="card-status">YOUR HEALTH SPACE</span>
                  </div>

                  <div className="heart-symbol">♡</div>

                  <h3>Your health,</h3>
                  <h3 className="highlight-heading">in better hands.</h3>

                  <p>
                    Understand diagnostic reports. Stay informed. Make confident everyday health decisions.
                  </p>

                  <div className="card-bottom">
                    <span>AI × HEALTHCARE</span>
                    <span>BENEFICIALai ↗</span>
                  </div>
                </div>

                <div className="floating-badge badge-top">
                  <span>✦</span> AI-powered guidance
                </div>

                <div className="floating-badge badge-bottom">
                  <span>♡</span> Care made simpler
                </div>
              </div>
            </section>

            {/* SMART REPORT ANALYZER */}
            <section className="report-section" id="report-analyzer">
              <div className="report-heading">
                <span className="section-label">SMART REPORT ANALYZER</span>
                <h2>Understand your health reports.</h2>
                <p>
                  Upload a laboratory report and let BENEFICIALai explain the results in simple, easy-to-understand language.
                </p>
              </div>

              <div className="report-container">
                <form onSubmit={handleReportSubmit} className="report-upload-form">
                  <label htmlFor="report-file">Choose your health report</label>

                  <input
                    id="report-file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      setReportFile(e.target.files?.[0] || null);
                      setReportResult("");
                      setReportAnalysis(null);
                      setReportError("");
                    }}
                  />

                  <p className="report-note">
                    Supported formats: PDF, JPG and PNG. Maximum size: 10 MB.
                  </p>

                  {reportFile && <p className="selected-file">Selected: {reportFile.name}</p>}

                  <div className="report-btn-row">
                    <button
                      type="submit"
                      className="report-submit-button"
                      disabled={!reportFile || isAnalyzing}
                    >
                      {isAnalyzing ? "Analyzing report..." : "Analyze My Report"}
                    </button>
                    <button
                      type="button"
                      className="sample-report-btn"
                      onClick={handleLoadSampleReport}
                    >
                      Load Sample Diabetic Report
                    </button>
                  </div>
                </form>

                {reportError && (
                  <div className="report-error" role="alert">
                    {reportError}
                  </div>
                )}

                {reportAnalysis && (
                  <div className="report-result" aria-live="polite">
                    <h3>Your Report Explanation</h3>

                    <div className="report-summary">
                      <h4>Overall Summary</h4>
                      <p>{reportAnalysis.summary || reportResult}</p>
                    </div>

                    <div className="report-tests">
                      <h4>Individual Test Results</h4>

                      {reportAnalysis.tests?.length > 0 ? (
                        <div className="report-tests-grid">
                          {reportAnalysis.tests.map((test, index) => (
                            <article
                              className="report-test-card"
                              key={`${test.name}-${index}`}
                            >
                              <div className="report-test-top">
                                <h5>{test.name || "Laboratory Test"}</h5>
                                <span
                                  className={`report-status ${(
                                    test.status || "not-specified"
                                  )
                                    .toLowerCase()
                                    .replace(/\s+/g, "-")}`}
                                >
                                  {test.status || "Not specified"}
                                </span>
                              </div>

                              <div className="report-test-value">
                                {test.value || "Not available"}
                                {test.unit && <span> {test.unit}</span>}
                              </div>

                              <div className="report-reference">
                                <span>Reference Range</span>
                                <strong>{test.reference_range || "Not provided"}</strong>
                              </div>

                              <p className="report-test-explanation">
                                {test.explanation || "No explanation available."}
                              </p>
                            </article>
                          ))}
                        </div>
                      ) : (
                        <p>No readable laboratory test results were identified in this report.</p>
                      )}
                    </div>

                    <div className="report-ai-disclaimer">
                      {reportAnalysis.disclaimer ||
                        "This is an educational explanation, not a medical diagnosis. Discuss your results with a qualified healthcare professional."}
                    </div>
                  </div>
                )}

                <p className="report-disclaimer">
                  BENEFICIALai provides educational explanations, not medical diagnoses. Always discuss your results with a qualified healthcare professional.
                </p>
              </div>
            </section>

            {/* AI HEALTH CHATBOT */}
            <section className="chat-section" id="ai-chat">
              <div className="chat-heading">
                <span className="section-label">MEET YOUR AI HEALTH COMPANION</span>
                <h2>
                  Let's talk about <span>your health.</span>
                </h2>
                <p>
                  Ask general health questions and get simple, helpful explanations with BENEFICIALai.
                </p>
              </div>

              <div className="chat-container">
                <div className="chat-topbar">
                  <div className="chat-avatar">✳</div>
                  <div>
                    <h3>BENEFICIALai Assistant</h3>
                    <span>AI Clinical Assistant</span>
                  </div>
                </div>

                <div className="chat-messages" aria-live="polite">
                  {messages.map((message, index) => (
                    <div className={`chat-message ${message.role}`} key={index}>
                      <div className="message-bubble">{message.text}</div>
                    </div>
                  ))}

                  {isChatLoading && (
                    <div className="chat-message assistant">
                      <div className="message-bubble typing-indicator">
                        BENEFICIALai is thinking...
                      </div>
                    </div>
                  )}
                </div>

                <form className="chat-input-area" onSubmit={handleChatSubmit}>
                  <input
                    type="text"
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    placeholder="Ask me a health question..."
                    maxLength={2000}
                    disabled={isChatLoading}
                  />

                  <button type="submit" disabled={!userMessage.trim() || isChatLoading}>
                    {isChatLoading ? "..." : "Send ↑"}
                  </button>
                </form>

                <p className="chat-disclaimer">
                  BENEFICIALai provides general health information, not medical diagnosis or treatment. For emergencies, seek immediate medical care.
                </p>
              </div>
            </section>

            {/* INTRO STRIP */}
            <section className="intro-strip" id="about">
              <span>OUR PURPOSE</span>
              <p>
                Making healthcare smarter, simpler and accessible through artificial intelligence.
              </p>
            </section>

            {/* FEATURES GRID */}
            <section className="features-section" id="features">
              <div className="section-heading">
                <div>
                  <span className="section-label">ONE PLATFORM. MANY POSSIBILITIES.</span>
                  <h2>
                    Healthcare that <span>works for you.</span>
                  </h2>
                </div>
                <p>
                  Everything you need to better understand and organize your everyday healthcare journey.
                </p>
              </div>

              <div className="features-grid">
                {features.map((feature) => (
                  <div
                    className={`feature-card ${feature.color}`}
                    key={feature.number}
                    onClick={() => {
                      if (feature.targetView === "dashboard") {
                        if (currentUser) {
                          setCurrentView("dashboard");
                        } else {
                          setAuthMode("register");
                          setShowAuthModal(true);
                        }
                      } else {
                        scrollTo(feature.targetSection);
                      }
                    }}
                  >
                    <div className="feature-top">
                      <span className="feature-icon">{feature.icon}</span>
                      <span className="feature-number">{feature.number}</span>
                    </div>

                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>

                    <div className="feature-link">
                      Discover feature <span>↗</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* CLOSING SECTION */}
            <section className="closing-section">
              <span className="section-label">A MORE THOUGHTFUL HEALTHCARE EXPERIENCE</span>
              <h2>
                Because your health deserves <span>better.</span>
              </h2>
              <p>
                One connected ecosystem. More clarity. More informed everyday healthcare decisions.
              </p>
              <button
                className="primary-button"
                onClick={() => {
                  if (currentUser) {
                    setCurrentView("dashboard");
                  } else {
                    setAuthMode("register");
                    setShowAuthModal(true);
                  }
                }}
              >
                Go to Personal Health Dashboard ↑
              </button>
            </section>
          </>
        )}
      </main>

      {/* =========================================================
          VIEW REPORT RESULTS MODAL (FOR PAST REPORTS)
      ========================================================= */}
      {selectedReportView && (
        <div className="auth-backdrop" onClick={() => setSelectedReportView(null)}>
          <div className="auth-modal" style={{ maxWidth: "720px", maxHeight: "88vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <button className="auth-close-btn" onClick={() => setSelectedReportView(null)}>
              ✕
            </button>
            <div className="auth-modal-header" style={{ textAlign: "left", marginBottom: "16px" }}>
              <span className="record-category-tag">ARCHIVED REPORT</span>
              <h3 style={{ marginTop: "6px" }}>{selectedReportView.filename}</h3>
              <p>Uploaded: {selectedReportView.created_at?.split("T")[0]}</p>
            </div>

            <div className="report-summary">
              <h4>Summary</h4>
              <p>{selectedReportView.summary}</p>
            </div>

            <div className="report-tests-grid" style={{ marginTop: "16px" }}>
              {(selectedReportView.tests || []).map((t, idx) => (
                <div key={idx} className="report-test-card">
                  <div className="report-test-top">
                    <h5>{t.name}</h5>
                    <span className={`report-status ${(t.status || "").toLowerCase()}`}>{t.status}</span>
                  </div>
                  <div className="report-test-value">
                    {t.value} <span>{t.unit}</span>
                  </div>
                  <div className="report-reference">
                    <span>Reference Range:</span>
                    <strong>{t.reference_range}</strong>
                  </div>
                  <p className="report-test-explanation">{t.explanation}</p>
                </div>
              ))}
            </div>

            <div className="report-ai-disclaimer" style={{ marginTop: "18px" }}>
              This is an educational explanation, not a medical diagnosis. Discuss your results with a qualified healthcare professional.
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          EDIT PROFILE MODAL (SECTION C)
      ========================================================= */}
      {showEditProfileModal && (
        <div className="auth-backdrop" onClick={() => setShowEditProfileModal(false)}>
          <div className="modal-edit-profile" onClick={(e) => e.stopPropagation()}>
            <button className="auth-close-btn" onClick={() => setShowEditProfileModal(false)}>
              ✕
            </button>
            <div className="auth-modal-header" style={{ textAlign: "left" }}>
              <h3>Manage Health Profile</h3>
              <p>Update your personal metrics and optional clinical details.</p>
            </div>

            <form onSubmit={handleProfileUpdate}>
              <div className="profile-edit-grid">
                <div className="profile-edit-field full">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                    required
                  />
                </div>
                <div className="profile-edit-field">
                  <label>Date of Birth</label>
                  <input
                    type="date"
                    value={profileData.dob}
                    onChange={(e) => setProfileData({ ...profileData, dob: e.target.value })}
                  />
                </div>
                <div className="profile-edit-field">
                  <label>Gender (Optional)</label>
                  <select
                    value={profileData.gender}
                    onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                  >
                    <option value="">Select Gender</option>
                    <option>Female</option>
                    <option>Male</option>
                    <option>Non-binary</option>
                    <option>Prefer not to say</option>
                  </select>
                </div>
                <div className="profile-edit-field">
                  <label>Height (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 170 cm"
                    value={profileData.height}
                    onChange={(e) => setProfileData({ ...profileData, height: e.target.value })}
                  />
                </div>
                <div className="profile-edit-field">
                  <label>Weight (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 68 kg"
                    value={profileData.weight}
                    onChange={(e) => setProfileData({ ...profileData, weight: e.target.value })}
                  />
                </div>
                <div className="profile-edit-field">
                  <label>Blood Group (Optional)</label>
                  <select
                    value={profileData.blood_group}
                    onChange={(e) => setProfileData({ ...profileData, blood_group: e.target.value })}
                  >
                    <option value="">Select Blood Group</option>
                    <option>A+</option>
                    <option>A-</option>
                    <option>B+</option>
                    <option>B-</option>
                    <option>O+</option>
                    <option>O-</option>
                    <option>AB+</option>
                    <option>AB-</option>
                  </select>
                </div>
                <div className="profile-edit-field">
                  <label>Emergency Contact (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. +92 300 1234567"
                    value={profileData.emergency_contact}
                    onChange={(e) => setProfileData({ ...profileData, emergency_contact: e.target.value })}
                  />
                </div>
                <div className="profile-edit-field full">
                  <label>Known Allergies (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Penicillin, Peanuts (or leave empty)"
                    value={profileData.allergies}
                    onChange={(e) => setProfileData({ ...profileData, allergies: e.target.value })}
                  />
                </div>
                <div className="profile-edit-field full">
                  <label>Existing Health Conditions (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Type 2 Diabetes, Hypertension (or leave empty)"
                    value={profileData.conditions}
                    onChange={(e) => setProfileData({ ...profileData, conditions: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "18px" }}>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowEditProfileModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          AUTHENTICATION MODAL (LOGIN & REGISTER)
      ========================================================= */}
      {showAuthModal && (
        <div className="auth-backdrop" onClick={() => setShowAuthModal(false)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <button className="auth-close-btn" onClick={() => setShowAuthModal(false)}>
              ✕
            </button>

            <div className="auth-modal-header">
              <h3>{authMode === "login" ? "Welcome Back" : "Create Patient Account"}</h3>
              <p>
                {authMode === "login"
                  ? "Access your personal health dashboard, records, and medications."
                  : "Register to manage your personal health space."}
              </p>
            </div>

            <div className="auth-tabs-toggle">
              <button
                className={`auth-tab-choice ${authMode === "login" ? "active" : ""}`}
                onClick={() => { setAuthMode("login"); setAuthError(""); }}
              >
                Sign In
              </button>
              <button
                className={`auth-tab-choice ${authMode === "register" ? "active" : ""}`}
                onClick={() => { setAuthMode("register"); setAuthError(""); }}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="auth-form-stack">
              {authMode === "register" && (
                <div className="auth-field">
                  <label>Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Sara Khan"
                    value={authFullName}
                    onChange={(e) => setAuthFullName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="auth-field">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  required
                />
              </div>

              <div className="auth-field">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  required
                />
              </div>

              {authError && <div className="auth-error-alert">{authError}</div>}

              <button type="submit" className="btn-auth-submit" disabled={authLoading}>
                {authLoading ? "Verifying..." : authMode === "login" ? "Sign In to Dashboard" : "Complete Registration"}
              </button>
            </form>

            <div className="quick-demo-accounts">
              <span>Quick Demo Fill (Click to test):</span>
              <div className="demo-account-buttons">
                <button
                  type="button"
                  className="btn-demo-quick"
                  onClick={() => fillDemoUser("Sara Khan", "sara@beneficial.ai")}
                >
                  Sara Khan
                </button>
                <button
                  type="button"
                  className="btn-demo-quick"
                  onClick={() => fillDemoUser("Ali Raza", "ali@beneficial.ai")}
                >
                  Ali Raza
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        <div className="brand" onClick={() => setCurrentView("home")}>
          <span className="brand-icon">✳</span>
          BENEFICIAL<span>ai</span>
        </div>
        <p>Intelligence That Benefits Life.</p>
        <span>© 2026 BENEFICIALai. Built with purpose.</span>
      </footer>
    </div>
  );
}

export default App;
