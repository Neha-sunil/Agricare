import React, { useState, useRef, useEffect } from 'react';
import API_URL from './apiConfig';

const loc = {
    EN: {
        agentTitle: "Post-Harvest Expert AI", agentSub: "Minimize losses, Maximize profit",
        welcome: "Welcome to Post-Harvest Expert AI. I'll help you minimize losses & maximize profit.",
        btnBack: "Back to Dashboard", aiResult: "AI Analysis Result", upload: "Upload Harvest Image",
        waitAnalysis: "AI is analyzing your produce...", expAdvice: "Expert Advice:",
        retry: "Analysis failed. Please check your connection.",
        dashTitle: "Post-Harvest Analysis Dashboard", 
        recTitle: "Crop Recommendations",
        sections: {
            readiness: "Readiness Check", harvesting: "Harvesting Guide", grading: "Quality Grading",
            damage: "Damage Detection", cleaning: "Cleaning & Sorting", drying: "Drying & Curing",
            storage: "Storage Specs", spoilage: "Spoilage Check", packaging: "Packaging Guide",
            transport: "Transport Guide", shelflife: "Shelf Life", decision: "Market Decision"
        }
    },
    TH: {
        agentTitle: "ผู้เชี่ยวชาญหลังการเก็บเกี่ยว AI", agentSub: "ลดการสูญเสีย เพิ่มกำไรสูงสุด",
        welcome: "ยินดีต้อนรับสู่ AI ผู้เชี่ยวชาญหลังการเก็บเกี่ยวค่ะ ฉันจะช่วยคุณลดการสูญเสียและเพิ่มกำไรให้ได้มากที่สุดนะคะ",
        btnBack: "กลับสู่แดชบอร์ด", aiResult: "ผลการวิเคราะห์โดย AI", upload: "อัปโหลดรูปภาพผลผลิต",
        waitAnalysis: "AI กำลังวิเคราะห์ผลผลิต...", expAdvice: "คำแนะนำจากผู้เชี่ยวชาญ:",
        retry: "การวิเคราะห์ล้มเหลว โปรดตรวจสอบการเชื่อมต่อของคุณ",
        dashTitle: "แดชบอร์ดหลังการเก็บเกี่ยว", 
        recTitle: "คำแนะนำสำหรับพืช",
        sections: {
            readiness: "ตรวจสอบความพร้อม", harvesting: "คู่มือการเก็บเกี่ยว", grading: "การคัดเกรดคุณภาพ",
            damage: "ตรวจจับความเสียหาย", cleaning: "ทำความสะอาดและคัดแยก", drying: "ตากและบ่ม",
            storage: "การเก็บรักษา", spoilage: "ตรวจสอบการเน่าเสีย", packaging: "บรรจุภัณฑ์",
            transport: "การขนส่ง", shelflife: "อายุการเก็บรักษา", decision: "การตลาด"
        }
    }
};

const POST_HARVEST_SECTIONS = [
    { id: 1, key: 'readiness', endpoint: 'check-readiness', type: 'camera', color: '#0ea5e9', icon: 'fa-calendar-check' },
    { id: 2, key: 'grading', endpoint: 'grade-quality', type: 'camera', color: '#f59e0b', icon: 'fa-medal' },
    { id: 3, key: 'damage', endpoint: 'detect-damage', type: 'camera', color: '#ef4444', icon: 'fa-magnifying-glass-chart' },
    { id: 4, key: 'spoilage', endpoint: 'detect-spoilage', type: 'camera', color: '#8b5cf6', icon: 'fa-virus-covid' },
    
    { id: 5, key: 'harvesting', endpoint: 'harvesting-guidance', type: 'info', color: '#10b981', icon: 'fa-hand-holding-hand' },
    { id: 6, key: 'cleaning', endpoint: 'cleaning-sorting', type: 'info', color: '#06b6d4', icon: 'fa-soap' },
    { id: 7, key: 'drying', endpoint: 'drying-curing', type: 'info', color: '#f97316', icon: 'fa-sun' },
    { id: 8, key: 'storage', endpoint: 'storage-specs', type: 'info', color: '#6366f1', icon: 'fa-warehouse' },
    { id: 9, key: 'packaging', endpoint: 'packaging-guidance', type: 'info', color: '#ec4899', icon: 'fa-box-open' },
    { id: 10, key: 'transport', endpoint: 'transport-guidance', type: 'info', color: '#475569', icon: 'fa-truck-fast' },
    { id: 11, key: 'shelflife', endpoint: 'shelf-life', type: 'info', color: '#14b8a6', icon: 'fa-clock-rotate-left' },
    { id: 12, key: 'decision', endpoint: 'market-decision', type: 'info', color: '#d946ef', icon: 'fa-gavel' },
];

const PostHarvest = ({ locale, onBack, onGoToAuction }) => {
    const s = loc[locale] || loc['EN'];
    const [cropName] = useState(localStorage.getItem('farmer_crop') || 'Rice');
    const [profileId] = useState(localStorage.getItem('farm_profile_id') || 'guest_farmer');
    
    const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
    const [isFetchingInfo, setIsFetchingInfo] = useState(true);
    
    const [imageResults, setImageResults] = useState({});
    const [infoResults, setInfoResults] = useState({});
    
    const [assistantMsg, setAssistantMsg] = useState(s.welcome);
    const [chatHistory, setChatHistory] = useState([]);
    const [assistantInput, setAssistantInput] = useState("");
    const [cropGrade, setCropGrade] = useState("Grade A");
    const [detectedPhase, setDetectedPhase] = useState(null);
    const [phaseResult, setPhaseResult] = useState(null);
    const chatEndRef = useRef(null);
    const [previewImage, setPreviewImage] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, assistantMsg]);

    const speak = (text) => {
        window.speechSynthesis.cancel();
        setAssistantMsg(text);
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = locale === 'EN' ? 'en-US' : 'th-TH';
        window.speechSynthesis.speak(utterance);
    };

    useEffect(() => {
        // Fetch all info recommendations for crop
        const fetchAllInfo = async () => {
            setIsFetchingInfo(true);
            const infoSections = POST_HARVEST_SECTIONS.filter(sec => sec.type === 'info');
            
            const resultsObj = {};
            await Promise.all(infoSections.map(async (sec) => {
                try {
                    let url = `${API_URL}/api/post-harvest/${sec.endpoint}?crop=${cropName}`;
                    if (sec.key === 'decision') url += `&grade=${cropGrade}`;
                    
                    const res = await fetch(url);
                    const data = await res.json();
                    resultsObj[sec.key] = data;
                } catch(e) {
                    console.error("Error fetching", sec.key, e);
                }
            }));
            
            setInfoResults(resultsObj);
            setIsFetchingInfo(false);
        };
        fetchAllInfo();
    }, [cropName, cropGrade]);

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => setPreviewImage(e.target.result);
        reader.readAsDataURL(file);

        setIsAnalyzingImage(true);
        speak(s.waitAnalysis);

        // FIRST: Validate that image is from an agricultural field
        const validateFormData = new FormData();
        validateFormData.append('file', file);
        validateFormData.append('crop', cropName);

        try {
            const validateRes = await fetch(`${API_URL}/api/post-harvest/validate-field`, {
                method: 'POST',
                body: validateFormData
            });
            const validationResult = await validateRes.json();

            // If validation fails, stop and inform user
            if (!validationResult.valid) {
                setIsAnalyzingImage(false);
                speak(validationResult.recommendation || "This image does not appear to be from an agricultural field. Please upload a clear farm/crop image.");
                setImageResults({
                    validation_error: {
                        error: validationResult.error || "Image validation failed",
                        recommendation: validationResult.recommendation,
                        analysis: validationResult.analysis,
                        confidence: validationResult.confidence
                    }
                });
                return;
            }

            // If valid, proceed with analysis
            const imageSections = POST_HARVEST_SECTIONS.filter(sec => sec.type === 'camera');
            
            const resultsObj = {};
            let spokenText = [];

            await Promise.all(imageSections.map(async (sec) => {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('crop', cropName);
                try {
                    const res = await fetch(`${API_URL}/api/post-harvest/${sec.endpoint}`, {
                        method: 'POST',
                        body: formData
                    });
                    const data = await res.json();
                    resultsObj[sec.key] = data;
                    
                    // Collect key highlights for voice summary
                    if (sec.key === 'readiness' && data.status) spokenText.push(data.status);
                    if (sec.key === 'grading' && data.grade) {
                        spokenText.push(`Grade ${data.grade}`);
                        setCropGrade(data.grade);
                    }
                    if (sec.key === 'spoilage' && data.spoilage_detected) spokenText.push("Spoilage warning");
                } catch(e) {
                    console.error("Analysis failed", sec.key);
                }
            }));

            // Detect current phase
            const phaseFormData = new FormData();
            phaseFormData.append('file', file);
            phaseFormData.append('crop', cropName);
            try {
                const phaseRes = await fetch(`${API_URL}/api/post-harvest/detect-phase`, {
                    method: 'POST',
                    body: phaseFormData
                });
                const phaseData = await phaseRes.json();
                if (phaseData.detected_phase) {
                    setDetectedPhase(phaseData.detected_phase.toLowerCase());
                    setPhaseResult(phaseData);
                    spokenText.push(`Currently in ${phaseData.detected_phase} phase. ${phaseData.further_steps}`);
                }
            } catch(e) { console.error("Phase detection failed"); }

            setImageResults(resultsObj);
            setIsAnalyzingImage(false);
            if (spokenText.length > 0) {
                speak(`Analysis complete. Highlights: ${spokenText.join(', ')}.`);
            }
        } catch(e) {
            setIsAnalyzingImage(false);
            console.error("Validation or analysis error:", e);
            speak(s.retry);
        }
    };

    const listen = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;
        const recognition = new SpeechRecognition();
        recognition.lang = locale === 'EN' ? 'en-US' : 'th-TH';
        recognition.onstart = () => setAssistantMsg(locale === 'EN' ? "Listening..." : "กำลังฟัง...");
        recognition.onresult = (e) => {
            const transcript = e.results[0][0].transcript.toLowerCase();
            handleGeneralQuery(transcript);
        };
        recognition.start();
    };

    const handleGeneralQuery = async (queryText) => {
        setChatHistory(p => [...p, { role: 'user', text: queryText }]);
        try {
            const res = await fetch(`${API_URL}/api/assistant/query`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ farm_profile_id: profileId, query_text: queryText, lang: locale })
            });
            const data = await res.json();
            setChatHistory(p => [...p, { role: 'ai', text: data.response }]);
            speak(data.spoken_summary || data.response);
        } catch (e) {
            speak(locale === 'EN' ? "Expert is offline." : "ผู้เชี่ยวชาญออฟไลน์อยู่ค่ะ");
        }
    };

    return (
        <div className="post-harvest-overlay" style={{ background: '#f8fafc', minHeight: '100vh', display: 'flex', transition: 'all 0.5s ease' }}>
            {/* Sidebar Navigation */}
            <aside className="post-harvest-sidebar">
                <style>{`
                    .post-harvest-sidebar { width: 340px; background: white; border-right: 1px solid #e2e8f0; display: flex; flex-direction: column; padding: 30px; height: 100vh; position: sticky; top: 0; }
                    @media (max-width: 1024px) {
                        .post-harvest-sidebar { width: 100%; height: auto; position: relative; border-right: none; border-bottom: 1px solid #e2e8f0; }
                        .post-harvest-overlay { flex-direction: column; }
                    }
                    .info-card { padding: 20px; background: white; border-radius: 20px; box-shadow: 0 5px 15px rgba(0,0,0,0.02); border: 1px solid #f1f5f9; }
                    .info-card h4 { margin: 0 0 15px 0; display: flex; alignItems: center; gap: 10px; font-family: Outfit; font-size: 1.1rem; }
                    .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
                    
                    .animate-fade-in { animation: fadeIn 0.5s ease; }
                    .animate-slide-up { animation: slideUp 0.6s ease; }
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                    .scanning-bar {
                        position: absolute; width: 100%; height: 5px; background: rgba(16, 185, 129, 0.5);
                        top: 0; left: 0; animation: scan 2s linear infinite; box-shadow: 0 0 15px #10b981;
                    }
                    @keyframes scan { 0% { top: 0; } 100% { top: 100%; } }
                    .pulse { animation: pulse 2s infinite; }
                    @keyframes pulse { 0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); } 70% { transform: scale(1.05); box-shadow: 0 0 0 20px rgba(16, 185, 129, 0); } 100% { transform: scale(1); } }
                    .spinner { width: 40px; height: 40px; border: 4px solid #f1f5f9; border-top: 4px solid #10b981; border-radius: 50%; animation: spin 1s linear infinite; }
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    .highlight-phase {
                        border: 2px solid transparent !important;
                        animation: glow pulse 2s infinite;
                    }
                    @keyframes glow { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }
                `}</style>
                <div style={{ marginBottom: '40px' }}>
                    <div className="logo" style={{ fontSize: '1.6rem', marginBottom: '10px' }}>
                        <i className="fa-solid fa-wheat-awn" style={{ color: '#10b981' }}></i> AgriCare <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Post-Harvest</span>
                    </div>
                    <div style={{ background: '#f1f5f9', padding: '15px', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <i className="fa-solid fa-seedling" style={{ color: '#10b981' }}></i>
                        <span style={{ fontWeight: 800 }}>{cropName}</span>
                    </div>
                </div>

                <div className="chat-window" style={{ flex: 1, overflowY: 'auto', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px', paddingRight: '5px' }}>
                    <div className="assistant-orb" style={{ display: 'flex', alignItems: 'flex-start', gap: '15px', background: '#f8fafc', padding: '15px', borderRadius: '20px', border: '1px solid #e2e8f0', marginBottom: '10px' }}>
                        <div className={`orb ${isAnalyzingImage ? 'pulse' : ''}`} style={{ width: '40px', height: '40px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                            <i className="fa-solid fa-robot"></i>
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>{assistantMsg}</p>
                        </div>
                    </div>

                    {chatHistory.map((m, i) => (
                        <div key={i} className={`msg ${m.role}`} style={{ 
                            padding: '12px 15px', borderRadius: '15px', fontSize: '0.85rem', fontWeight: 600, 
                            background: m.role === 'user' ? 'var(--primary)' : '#f8fafc',
                            color: m.role === 'user' ? 'white' : 'inherit',
                            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                            maxWidth: '90%'
                        }}>
                            {m.text}
                        </div>
                    ))}
                    <div ref={chatEndRef}></div>
                </div>

                <div className="chat-input-wrapper" style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    <button onClick={listen} style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#e2e8f0', color: '#64748b', border: 'none', cursor: 'pointer' }}>
                        <i className="fa-solid fa-microphone"></i>
                    </button>
                    <input 
                        type="text"
                        value={assistantInput}
                        onChange={(e) => setAssistantInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && assistantInput.trim() && (handleGeneralQuery(assistantInput), setAssistantInput(''))}
                        placeholder={locale === 'EN' ? "Message AI..." : "พิมพ์ข้อความ..."}
                        style={{ flex: 1, padding: '10px 15px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.85rem' }}
                    />
                    <button 
                        onClick={() => assistantInput.trim() && (handleGeneralQuery(assistantInput), setAssistantInput(''))}
                        style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer' }}
                    >
                        <i className="fa-solid fa-paper-plane" style={{ fontSize: '0.9rem' }}></i>
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
                    <button onClick={onGoToAuction} style={{ padding: '14px', borderRadius: '12px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', boxShadow: '0 5px 15px rgba(245, 158, 11, 0.3)', transition: '0.3s' }}>
                        {locale === 'EN' ? "Proceed to Auction Hall" : "ไปที่หอประมูล"} <i className="fa-solid fa-gavel"></i>
                    </button>
                    <button onClick={onBack} style={{ padding: '12px', borderRadius: '12px', background: '#f1f5f9', border: 'none', fontWeight: 800, cursor: 'pointer', color: '#64748b' }}>
                        <i className="fa-solid fa-arrow-left"></i> {s.btnBack}
                    </button>
                </div>
            </aside>

            {/* Main Workspace */}
            <main style={{ flex: 1, padding: '40px 50px', height: '100vh', overflowY: 'auto' }}>
                <header style={{ marginBottom: '40px' }}>
                    <h1 style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '2.5rem', margin: 0 }}>{s.dashTitle}</h1>
                    <p style={{ color: '#64748b', fontSize: '1.1rem' }}>{locale === 'EN' ? `Comprehensive pipeline for your ${cropName} post-harvest.` : `ระบบอัจฉริยะช่วยเหลือคุณในเรื่อง ${cropName} หลังการเก็บเกี่ยว`}</p>
                </header>

                {/* IMAGE ANALYSIS DASHBOARD */}
                <section style={{ marginBottom: '50px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ fontFamily: 'Outfit', fontSize: '1.8rem', color: '#1e293b', margin: 0 }}>
                            <i className="fa-solid fa-camera-retro" style={{ color: '#0ea5e9', marginRight: '10px' }}></i>
                            {locale === 'EN' ? "Vision Analysis" : "การวิเคราะห์ภาพถ่าย"}
                        </h2>
                        
                        <button onClick={() => fileInputRef.current.click()} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '50px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 5px 15px rgba(16, 185, 129, 0.3)' }}>
                            <i className="fa-solid fa-cloud-arrow-up"></i> {s.upload}
                        </button>
                        <input type="file" hidden ref={fileInputRef} onChange={handleFileUpload} accept="image/*" />
                    </div>

                    {!previewImage ? (
                        <div onClick={() => fileInputRef.current.click()} style={{ height: '200px', background: 'white', borderRadius: '25px', border: '3px dashed #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <i className="fa-solid fa-image" style={{ fontSize: '3rem', color: '#cbd5e1', marginBottom: '15px' }}></i>
                            <p style={{ fontWeight: 700, color: '#94a3b8' }}>{s.upload}</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '30px' }}>
                            <div style={{ width: '300px', flexShrink: 0, position: 'relative', borderRadius: '25px', overflow: 'hidden', height: 'fit-content' }}>
                                <img src={previewImage} style={{ width: '100%', display: 'block', border: '4px solid white', borderRadius: '25px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }} alt="Produce" />
                                {isAnalyzingImage && <div className="scanning-bar"></div>}
                            </div>
                            
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {/* Primary Phase Detection Box */}
                                {phaseResult && (
                                    <div className="animate-slide-up" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', padding: '25px', borderRadius: '25px', boxShadow: '0 15px 35px rgba(16, 185, 129, 0.2)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                                            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '12px' }}>
                                                <i className="fa-solid fa-microchip" style={{ fontSize: '1.2rem' }}></i>
                                            </div>
                                            <div>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 900, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px' }}>AI Current Phase Detection</span>
                                                <h3 style={{ margin: 0, fontFamily: 'Outfit', fontSize: '1.8rem', textTransform: 'capitalize' }}>{phaseResult.detected_phase}</h3>
                                            </div>
                                        </div>
                                        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.2)' }}>
                                            <h5 style={{ margin: '0 0 5px 0', fontSize: '0.9rem', fontWeight: 900 }}>🚀 RECOMMENDED FURTHER STEPS:</h5>
                                            <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600, lineHeight: 1.4 }}>{phaseResult.further_steps}</p>
                                        </div>
                                        <p style={{ margin: '10px 0 0 0', fontSize: '0.8rem', opacity: 0.8, fontStyle: 'italic' }}>Reasoning: {phaseResult.reasoning}</p>
                                    </div>
                                )}

                                <div className="dashboard-grid">
                                    {/* Validation Error Alert */}
                                    {imageResults.validation_error && (
                                        <div style={{ 
                                            gridColumn: '1 / -1',
                                            background: '#fee2e2', 
                                            border: '2px solid #ef4444',
                                            borderRadius: '15px',
                                            padding: '20px',
                                            marginBottom: '20px'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                                                <i className="fa-solid fa-triangle-exclamation" style={{ color: '#dc2626', fontSize: '1.5rem', marginTop: '5px' }}></i>
                                                <div style={{ flex: 1 }}>
                                                    <h4 style={{ margin: '0 0 10px 0', color: '#991b1b', fontSize: '1.1rem' }}>Image Validation Failed</h4>
                                                    <p style={{ margin: '0 0 10px 0', color: '#7f1d1d', fontSize: '0.95rem', fontWeight: 600 }}>
                                                        {imageResults.validation_error.error}
                                                    </p>
                                                    <p style={{ margin: '0 0 10px 0', color: '#991b1b', fontSize: '0.9rem' }}>
                                                        <strong>Analysis:</strong> {imageResults.validation_error.analysis}
                                                    </p>
                                                    <div style={{ 
                                                        background: '#fecaca', 
                                                        padding: '10px 12px', 
                                                        borderRadius: '8px',
                                                        fontSize: '0.9rem',
                                                        fontWeight: 700,
                                                        color: '#7f1d1d'
                                                    }}>
                                                        ✓ Recommendation: {imageResults.validation_error.recommendation}
                                                    </div>
                                                    <p style={{ margin: '10px 0 0 0', fontSize: '0.8rem', opacity: 0.7 }}>
                                                        Confidence: {(imageResults.validation_error.confidence * 100).toFixed(0)}%
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Readiness Card */}
                                    <div className="info-card" style={{ borderLeft: '4px solid #0ea5e9' }}>
                                        <h4 style={{ color: '#0ea5e9' }}><i className="fa-solid fa-calendar-check"></i> {s.sections.readiness}</h4>
                                        {isAnalyzingImage ? <div className="spinner" style={{ margin: '20px auto' }}></div> : imageResults.readiness ? (
                                            <div>
                                                <div style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '5px' }}>{imageResults.readiness.status}</div>
                                                <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '10px' }}>{imageResults.readiness.analysis}</p>
                                                <div style={{ background: '#f0f9ff', padding: '10px', borderRadius: '10px', fontSize: '0.85rem', color: '#0369a1', fontWeight: 600 }}>{imageResults.readiness.recommendation}</div>
                                            </div>
                                        ) : <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Awaiting image...</p>}
                                    </div>
                                    
                                    {/* Grading Card */}
                                    <div className="info-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                                        <h4 style={{ color: '#f59e0b' }}><i className="fa-solid fa-medal"></i> {s.sections.grading}</h4>
                                        {isAnalyzingImage ? <div className="spinner" style={{ margin: '20px auto' }}></div> : imageResults.grading ? (
                                            <div>
                                                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#f59e0b', marginBottom: '5px' }}>{imageResults.grading.grade}</div>
                                                <span style={{ padding: '5px 12px', background: '#fef3c7', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 800, color: '#b45309' }}>Market Est: {imageResults.grading.market_value_estimate}</span>
                                            </div>
                                        ) : <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Awaiting image...</p>}
                                    </div>
                                    
                                    {/* Damage Card */}
                                    <div className="info-card" style={{ borderLeft: '4px solid #ef4444' }}>
                                        <h4 style={{ color: '#ef4444' }}><i className="fa-solid fa-magnifying-glass-chart"></i> {s.sections.damage}</h4>
                                        {isAnalyzingImage ? <div className="spinner" style={{ margin: '20px auto' }}></div> : imageResults.damage ? (
                                            <div>
                                                <div style={{ fontWeight: 800, fontSize: '1.2rem', color: imageResults.damage.damage_found ? '#ef4444' : '#10b981', marginBottom: '10px' }}>
                                                    {imageResults.damage.damage_found ? "Damage Detected!" : "Pristine Produce"}
                                                </div>
                                                <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                                                    {(imageResults.damage.defects || []).slice(0,2).map(d => (
                                                        <li key={d} style={{ fontSize: '0.85rem', padding: '6px 10px', background: '#fee2e2', color: '#b91c1c', borderRadius: '6px', marginBottom: '5px' }}>• {d}</li>
                                                    ))}
                                                    {imageResults.damage.defects?.length === 0 && <li style={{ fontSize: '0.85rem', color: '#64748b' }}>No defects found.</li>}
                                                </ul>
                                            </div>
                                        ) : <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Awaiting image...</p>}
                                    </div>
                                    
                                    {/* Spoilage Card */}
                                    <div className="info-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
                                        <h4 style={{ color: '#8b5cf6' }}><i className="fa-solid fa-virus-covid"></i> {s.sections.spoilage}</h4>
                                        {isAnalyzingImage ? <div className="spinner" style={{ margin: '20px auto' }}></div> : imageResults.spoilage ? (
                                            <div style={{ padding: '15px', background: imageResults.spoilage.spoilage_detected ? '#fef2f2' : '#f0fdf4', borderRadius: '15px' }}>
                                                <h5 style={{ margin: '0 0 5px 0', fontSize: '1.1rem', color: imageResults.spoilage.spoilage_detected ? '#b91c1c' : '#15803d' }}>
                                                    {imageResults.spoilage.spoilage_detected ? "Spoilage Warning" : "Clear"}
                                                </h5>
                                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>{imageResults.spoilage.emergency_action || "Produce is safe."}</p>
                                            </div>
                                        ) : <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Awaiting image...</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                <hr style={{ border: 'none', borderTop: '2px dashed #e2e8f0', margin: '40px 0' }} />

                {/* INFO / CROP RECOMMENDATIONS DASHBOARD */}
                <section>
                    <h2 style={{ fontFamily: 'Outfit', fontSize: '1.8rem', color: '#1e293b', marginBottom: '25px' }}>
                        <i className="fa-solid fa-book-open" style={{ color: '#10b981', marginRight: '10px' }}></i>
                        {s.recTitle}
                    </h2>
                    
                    {isFetchingInfo ? (
                        <div style={{ textAlign: 'center', padding: '50px' }}>
                            <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
                            <p style={{ fontWeight: 800, color: '#64748b' }}>{s.fetching}</p>
                        </div>
                    ) : (
                        <div className="dashboard-grid">
                            {POST_HARVEST_SECTIONS.filter(sec => sec.type === 'info').map(sec => {
                                const data = infoResults[sec.key];
                                if (!data) return null;
                                
                                // Format the data intelligently
                                let primaryValue = '';
                                let secondaryText = '';
                                let lists = [];
                                
                                if (sec.key === 'harvesting') { primaryValue = data.best_time; secondaryText = data.handling_tips?.join(', '); lists = data.precautions; }
                                else if (sec.key === 'cleaning') { primaryValue = data.cleaning_method; lists = data.sorting_criteria; secondaryText = data.separation_advice; }
                                else if (sec.key === 'drying') { primaryValue = `Moisture: ${data.moisture_target}`; secondaryText = data.method; lists = data.duration ? [data.duration] : []; }
                                else if (sec.key === 'storage') { primaryValue = `${data.ideal_temp}, ${data.ideal_humidity}`; secondaryText = data.storage_type; lists = [data.ventilation, data.max_duration].filter(Boolean); }
                                else if (sec.key === 'packaging') { primaryValue = data.packaging_type; secondaryText = data.padding ? `Padding: ${data.padding}` : ''; lists = data.inner_lining ? [`Lining: ${data.inner_lining}`] : []; }
                                else if (sec.key === 'transport') { primaryValue = data.vehicle_type; secondaryText = data.stacking_limit ? `Stacking: ${data.stacking_limit}` : ''; lists = [data.handling_care].filter(Boolean); }
                                else if (sec.key === 'shelflife') { primaryValue = `${data.estimated_days} days`; secondaryText = data.spoilage_period; lists = data.quality_retention_tips; }
                                else if (sec.key === 'decision') { primaryValue = data.decision; secondaryText = data.estimated_profitability; lists = [data.strategic_reason].filter(Boolean); }
                                
                                return (
                                    <div 
                                        key={sec.id} 
                                        className={`info-card ${detectedPhase === sec.key ? 'highlight-phase' : ''}`} 
                                        style={{ 
                                            borderTop: `4px solid ${sec.color}`,
                                            transform: detectedPhase === sec.key ? 'scale(1.02)' : 'scale(1)',
                                            boxShadow: detectedPhase === sec.key ? `0 10px 30px ${sec.color}20` : '0 5px 15px rgba(0,0,0,0.02)',
                                            borderColor: detectedPhase === sec.key ? sec.color : '#f1f5f9',
                                            transition: '0.3s'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                            <h4 style={{ color: sec.color, margin: 0 }}><i className={`fa-solid ${sec.icon}`}></i> {s.sections[sec.key]}</h4>
                                            {detectedPhase === sec.key && <span style={{ background: sec.color, color: 'white', padding: '2px 10px', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 900 }}>AI DETECTED PHASE</span>}
                                        </div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>{primaryValue || "Checking..."}</div>
                                        {secondaryText && <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 10px 0' }}>{secondaryText}</p>}
                                        
                                        {lists && Array.isArray(lists) && lists.length > 0 && (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '10px' }}>
                                                {lists.slice(0,3).map((item, i) => (
                                                    <span key={i} style={{ padding: '4px 8px', background: `${sec.color}15`, color: sec.color, borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>{item}</span>
                                                ))}
                                            </div>
                                        )}
                                        
                                        {/* Speak Button */}
                                        <button onClick={() => speak(Object.values(data).filter(v => typeof v === 'string').join('. '))} style={{ border: 'none', background: 'transparent', color: '#cbd5e1', cursor: 'pointer', marginTop: '15px', padding: 0 }}>
                                            <i className="fa-solid fa-volume-high"></i> Listen
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default PostHarvest;
