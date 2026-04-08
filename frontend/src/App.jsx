import React, { useState, useEffect, useRef } from 'react';
import PreCare from './PreCare.jsx';
import PostHarvest from './PostHarvest.jsx';
import AuctionHouse from './AuctionHouse.jsx';
import API_URL from './apiConfig';

const locStrings = {
  EN: {
    titleSelect: "Farmer Registration", 
    subSelect: "Select your preferred interaction mode to begin:",
    optVoice: "Voice Guidance", optCall: "AI Call", optManual: "Manual",
    vaStart: "Start Voice Guidance", vaRepeat: "Repeat Question", vaStop: "Stop Guidance",
    vaListening: "LISTENING...", vaReady: "Ready to help you register.",
    lblFullName: "Full Name", lblPhone: "Phone Number", lblLandArea: "Land Area (Acres)", lblCrop: "Crop Type", lblTerrain: "Terrain Type",
    formTitle: "Registration Details", btnSubmit: "Complete Registration",
    intro: "Hello! I will help you complete your registration.",
    q1: "Great! First, what is your full name?",
    q15: "Got it. And how many acres of land do you have?",
    q2: "Thank you. And what is your phone number?",
    q3: "Got it. What type of crop are you growing?",
    q4: "Almost done. What is your terrain type?",
    done: "Thank you. Your registration details have been completed.",
    retry: "I'm sorry, I didn't catch that. Could you please repeat?",
    navHome: "Home", navPreCare: "Pre-Care", navPostHarvest: "Post-Harvest", navAuction: "Auction Hall", navAbout: "About", btnRegister: "Register Now",
    heroBadge: "🌱 Empowering Thai Farmers",
    heroTitle: "Smart Crop Care for Small-Scale Farmers in Thailand",
    heroSub: "Get simple guidance for crop selection, pre-care, disease monitoring, harvest, storage, and post-harvest management.",
    btnExplorePre: "Explore Pre-Care", btnPostAI: "Post-Harvest AI", btnGetGuidance: "Get Guidance"
  },
  TH: {
    titleSelect: "ลงทะเบียนเกษตรกร", 
    subSelect: "เลือกรูปแบบการใช้งานเพื่อเริ่มต้น:",
    optVoice: "เสียงนำทาง", optCall: "โทรสาย AI", optManual: "ลงทะเบียนเอง",
    vaStart: "เริ่มการนำทางด้วยเสียง", vaRepeat: "ฟังซ้ำ", vaStop: "หยุด",
    vaListening: "กำลังฟัง...", vaReady: "พร้อมช่วยคุณลงทะเบียนแล้วค่ะ",
    lblFullName: "ชื่อ-นามสกุล", lblPhone: "เบอร์โทรศัพท์", lblLandArea: "ขนาดพื้นที่ (ไร่)", lblCrop: "ชนิดพืช", lblTerrain: "ลักษณะดิน",
    formTitle: "ข้อมูลการลงทะเบียน", btnSubmit: "เสร็จสิ้นการลงทะเบียน",
    intro: "สวัสดีค่ะ ฉันจะช่วยคุณลงทะเบียนนะคะ",
    q1: "เริ่มแรก ขอทราบชื่อ-นามสกุลของคุณค่ะ",
    q2: "ขอบคุณค่ะ ขอทราบเบอร์โทรศัพท์ด้วยนะคะ",
    q15: "กี่ไร่คะ? ขอทราบขนาดพื้นที่ฟาร์มของคุณด้วยค่ะ",
    q3: "ปลูกพืชชนิดไหนอยู่คะ?",
    q4: "ลักษณะดินเป็นอย่างไรคะ?",
    done: "ขอบคุณค่ะ การลงทะเบียนของคุณเสร็จสมบูรณ์แล้ว",
    retry: "ขออภัยค่ะ ฉันไม่ได้ยิน ช่วยพูดอีกครั้งนะคะ?",
    navHome: "หน้าแรก", navPreCare: "การเตรียมตัว", navPostHarvest: "หลังการเก็บเกี่ยว", navAuction: "หอประมูล", navAbout: "เกี่ยวกับเรา", btnRegister: "ลงทะเบียน",
    heroBadge: "🌱 เสริมพลังเกษตรกรไทย",
    heroTitle: "การดูแลพืชอัจฉริยะสำหรับเกษตรกรรายย่อยในประเทศไทย",
    heroSub: "รับคำแนะนำง่ายๆ สำหรับการเลือกพืช การดูแลก่อนปลูก การเฝ้าระวังโรค การเก็บเกี่ยว การเก็บรักษา และการจัดการหลังการเก็บเกี่ยว",
    btnExplorePre: "สำรวจการเตรียมตัว", btnPostAI: "AI หลังการเก็บเกี่ยว", btnGetGuidance: "รับคำแนะนำ"
  }
};

const qOrder = [
  { id: 'fullName', key: 'q1', label: 'lblFullName', placeholder: 'Your full name' },
  { id: 'phone', key: 'q2', label: 'lblPhone', placeholder: 'Your phone number' },
  { id: 'landArea', key: 'q15', label: 'lblLandArea', placeholder: 'e.g. 5.5' },
  { id: 'cropType', key: 'q3', label: 'lblCrop', placeholder: 'e.g. Rice' },
  { id: 'terrainType', key: 'q4', label: 'lblTerrain', placeholder: 'e.g. Clay' }
];

function App() {
  const [locale, setLocale] = useState('EN');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [activeMode, setActiveMode] = useState(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [vaText, setVaText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("...");
  const [isFlowRunning, setIsFlowRunning] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', phone: '', landArea: '', cropType: '', terrainType: '' });
  const [locationData, setLocationData] = useState({ latitude: 0, longitude: 0, temperature: 25, humidity: 60, rainfall: 800 });
  const [isLocating, setIsLocating] = useState(false);
  const [showPreCare, setShowPreCare] = useState(false); 
  const [showPostHarvest, setShowPostHarvest] = useState(false); 
  const [showAuction, setShowAuction] = useState(false);

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocationData({
          latitude, longitude,
          temperature: 28 + Math.random() * 5,
          humidity: 70 + Math.random() * 15,
          rainfall: 1200 + Math.random() * 500
        });
        setIsLocating(false);
      },
      (err) => { console.error("Location Error:", err); setIsLocating(false); }
    );
  };

  const recognitionRef = useRef(null);
  const synth = window.speechSynthesis;

  useEffect(() => { setVaText(locStrings[locale].vaReady); }, [locale]);

  const openModal = () => { 
    setIsModalOpen(true); setActiveStep(1); setActiveMode(null); setIsFlowRunning(false); 
    setCurrentQIndex(0); setVaText(locStrings[locale].vaReady); detectLocation();
  };
  const closeModal = () => { setIsModalOpen(false); stopVoiceFlow(); };

  const initMode = (mode) => {
    setActiveMode(mode); setActiveStep(2);
    if (mode === 'manual') setActiveStep(3);
  };

  const speak = (text, callback) => {
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale === 'EN' ? 'en-US' : 'th-TH';
    utterance.onend = callback;
    synth.speak(utterance);
  };

  const startVoiceFlow = () => {
    setIsFlowRunning(true); setCurrentQIndex(0);
    speak(locStrings[locale].intro, () => askQuestion(0));
  };

  const askQuestion = (index) => {
    if (index >= qOrder.length) {
      speak(locStrings[locale].done, () => { setActiveStep(3); stopVoiceFlow(); });
      return;
    }
    setCurrentQIndex(index);
    const q = qOrder[index];
    const text = locStrings[locale][q.key];
    setVaText(text);
    speak(text, () => listen(q.id, index));
  };

  const listen = (fieldId, index) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = locale === 'EN' ? 'en-US' : 'th-TH';
    recognitionRef.current = recognition;
    setIsListening(true);
    setTranscript("...");
    recognition.onresult = (event) => {
      const result = event.results[0][0].transcript;
      setTranscript(`"${result}"`);
      setFormData(prev => ({ ...prev, [fieldId]: result }));
      setIsListening(false);
      setTimeout(() => askQuestion(index + 1), 1200);
    };
    recognition.onerror = () => { setIsListening(false); if (isFlowRunning) speak(locStrings[locale].retry, () => listen(fieldId, index)); };
    recognition.start();
  };

  const stopVoiceFlow = () => { setIsFlowRunning(false); synth.cancel(); if (recognitionRef.current) recognitionRef.current.abort(); setIsListening(false); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      full_name: formData.fullName, phone: formData.phone, location: "Chachoengsao, Thailand",
      land_area: parseFloat(formData.landArea) || 0.0, terrain_type: formData.terrainType,
      irrigation_system: "Standard Drip", soil_type: "Loamy Mix", season: "Rainy Season",
      water_availability: "High", preferred_language: locale,
      latitude: locationData.latitude, longitude: locationData.longitude,
      temperature: locationData.temperature, humidity: locationData.humidity, rainfall: locationData.rainfall
    };

    try {
      const res = await fetch(`${API_URL}/api/precare/profile`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('farm_profile_id', data.farm_profile_id);
        alert(`Registration Successful! ID: ${data.farm_profile_id}`);
        closeModal(); setShowPreCare(true);
      }
    } catch (err) { alert("Backend Error Connection Failed."); }
  };

  const s = locStrings[locale];

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="logo" onClick={() => { setShowPreCare(false); setShowPostHarvest(false); setShowAuction(false); }}>
          <i className="fa-solid fa-leaf"></i> AgriCare <span>Thailand</span>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div className="lang-switch" style={{ marginRight: '15px' }}>
            <button className={`lang-btn ${locale === 'EN' ? 'active' : ''}`} onClick={() => setLocale('EN')}>EN</button>
            <button className={`lang-btn ${locale === 'TH' ? 'active' : ''}`} onClick={() => setLocale('TH')}>TH</button>
          </div>
          <div className="nav-links">
            <a href="#" onClick={() => { setShowPreCare(false); setShowPostHarvest(false); setShowAuction(false); }}>{s.navHome}</a>
            <a href="#" className="nav-precare-link" onClick={(e) => { e.preventDefault(); setShowPreCare(true); setShowPostHarvest(false); setShowAuction(false); }} style={{color: 'var(--primary)', fontWeight: '800', background: 'var(--light-green)', padding: '8px 16px', borderRadius: '50px', marginRight: '10px'}}>{s.navPreCare}</a>
            <a href="#" className="nav-postharvest-link" onClick={(e) => { e.preventDefault(); setShowPostHarvest(true); setShowPreCare(false); setShowAuction(false); }} style={{color: '#6366f1', fontWeight: '800', background: '#e0e7ff', padding: '8px 16px', borderRadius: '50px', marginRight: '10px'}}>{s.navPostHarvest}</a>
            <a href="#" className="nav-auction-link" onClick={(e) => { e.preventDefault(); setShowAuction(true); setShowPreCare(false); setShowPostHarvest(false); }} style={{color: '#f39c12', fontWeight: '800', background: '#fef3c7', padding: '8px 16px', borderRadius: '50px'}}>{s.navAuction}</a>
            {!showPreCare && !showPostHarvest && !showAuction && <a href="#" className="btn-nav-reg" onClick={openModal}>{s.btnRegister}</a>}
          </div>
        </div>
      </nav>

      {showPreCare ? (
        <PreCare locale={locale} onBack={() => setShowPreCare(false)} onGoToPostHarvest={() => { setShowPreCare(false); setShowPostHarvest(true); }} />
      ) : showPostHarvest ? (
        <PostHarvest locale={locale} onBack={() => setShowPostHarvest(false)} onGoToAuction={() => { setShowPostHarvest(false); setShowAuction(true); }} />
      ) : showAuction ? (
        <AuctionHouse locale={locale} onBack={() => setShowAuction(false)} />
      ) : (
        <>
          <header className="hero">
            <div className="hero-content">
              <div className="hero-badge">{s.heroBadge}</div>
              <h1>{s.heroTitle}</h1>
              <p>{s.heroSub}</p>
              <div className="hero-btns">
                <button className="btn-hero btn-green" onClick={() => setShowPreCare(true)}>{s.btnExplorePre}</button>
                <button className="btn-hero btn-orange" onClick={() => setShowPostHarvest(true)}>{s.btnPostAI}</button>
                <button className="btn-hero btn-secondary" onClick={() => setShowAuction(true)} style={{background: '#1e293b', color: 'white'}}>{s.navAuction}</button>
              </div>
            </div>
            <div className="hero-visual">
              <div className="visual-blob"></div>
              <div className="floating-card card-1 shadow-md">
                <i className="fa-solid fa-droplet"></i>
                <div>Irrigation <span>Optimal level</span></div>
              </div>
              <div className="floating-card card-2 shadow-lg">
                <i className="fa-solid fa-thermometer-half"></i>
                <div>28°C <span>Perfect for Rice</span></div>
              </div>
            </div>
          </header>
        </>
      )}

      {/* GLOBAL FOOTER: Always Visible at Bottom */}
      <footer className="main-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <i className="fa-solid fa-leaf"></i> AgriCare <span>Thailand</span>
          </div>
          <p>© 2026 Smart Agriculture Solutions. All rights reserved.</p>
          <div className="footer-links">
            <a href="#">Privacy Policy</a> <a href="#">Terms of Service</a> <a href="#">Contact Us</a>
          </div>
        </div>
      </footer>

      <div className={`modal-overlay ${isModalOpen ? 'active' : ''}`} onClick={(e) => e.target.classList.contains('modal-overlay') && closeModal()}>
        <div className="modal-content">
          <div className="modal-header">
            <div className="logo" style={{ fontSize: '1.4rem' }}>
              <i className="fa-solid fa-leaf"></i> AgriCare <span>TH</span>
            </div>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <div className="lang-switch">
                <button className={`lang-btn ${locale === 'EN' ? 'active' : ''}`} onClick={() => setLocale('EN')}>EN</button>
                <button className={`lang-btn ${locale === 'TH' ? 'active' : ''}`} onClick={() => setLocale('TH')}>TH</button>
              </div>
              <div className="modal-close" onClick={closeModal}><i className="fa-solid fa-xmark"></i></div>
            </div>
          </div>
          <div className="modal-inner-wrapper">
            <div className="steps-nav">
              <div className={`step-pill ${activeStep >= 1 ? 'active' : ''}`}>Step 1</div>
              <div className={`step-pill ${activeStep >= 2 ? 'active' : ''}`}>Step 2</div>
              <div className={`step-pill ${activeStep >= 3 ? 'active' : ''}`}>Step 3</div>
            </div>
            {activeStep === 1 && (
              <div className="mode-selection">
                <h1>{s.titleSelect}</h1>
                <div className="options-grid">
                  <div className="option-card" onClick={() => initMode('voice')}><i className="fa-solid fa-microphone-lines"></i><span>{s.optVoice}</span></div>
                  <div className="option-card" onClick={() => initMode('call')}><i className="fa-solid fa-phone-volume"></i><span>{s.optCall}</span></div>
                  <div className="option-card" onClick={() => initMode('manual')}><i className="fa-solid fa-keyboard"></i><span>{s.optManual}</span></div>
                </div>
              </div>
            )}
            {activeStep === 2 && activeMode === 'voice' && (
              <div className="voice-assistant-card">
                <div className="speech-msg-box"><h3>AgriCare Assistant</h3><p>"{vaText}"</p></div>
                <div className={`listening-indicator ${isListening ? 'active' : ''}`}><div className="dot"></div><div className="dot"></div><div className="dot"></div></div>
                <div className="transcript-preview">{transcript}</div>
                <div className="voice-controls">
                  {!isFlowRunning ? <button className="btn-voice" onClick={startVoiceFlow}>Start</button> : <button className="btn-voice" onClick={stopVoiceFlow}>Stop</button>}
                </div>
              </div>
            )}
            {(activeStep === 3 || (activeMode === 'voice' && activeStep === 2)) && (
              <div className="registration-form active">
                <form onSubmit={handleSubmit}>
                  <div className="form-grid">
                    {qOrder.map(q => (
                      <div className="input-box" key={q.id}>
                        <label>{s[q.label]}</label>
                        <input type="text" name={q.id} value={formData[q.id]} onChange={(e) => setFormData({...formData, [e.target.name]: e.target.value})} required />
                      </div>
                    ))}
                  </div>
                  <button type="submit" className="btn-ready">{s.btnSubmit}</button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
