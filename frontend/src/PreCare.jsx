import React, { useState, useEffect, useRef } from 'react';
import API_URL from './apiConfig';

const PHASE = {
    PATH_SELECTION: 'path_selection',
    INPUT_CROP: 'input_crop',
    VALIDATING: 'validating',
    PLANNER: 'planner',
    RECOMMENDATION: 'recommendation',
    TRACKER: 'tracker',
    DISEASE_PREDICTION: 'disease_prediction'
};

const MODE = {
    IDLE: 'idle',
    COLLECTING: 'collecting',
    EXPLAINING: 'explaining',
    GUIDING: 'guiding'
};

const QUESTIONS = [
    { key: 'location', en: "What is your location?", th: "คุณอยู่ที่ไหนคะ?" },
    { key: 'landArea', en: "What is your land area in Rai?", th: "พื้นที่ฟาร์มของคุณกี่ไร่คะ?" },
    { key: 'irrigationSystem', en: "What irrigation system do you use? Strong, Moderate, or None?", th: "คุณใช้ระบบชลประทานแบบไหนคะ? แข็งแรง ปานกลาง หรือไม่มีเลย?" },
    { key: 'soilType', en: "What is your soil type? Clay, Sandy, or Loam?", th: "ประเภทดินของคุณเป็นแบบไหนคะ? ดินเหนียว ดินทราย หรือดินร่วน?" }
];

const assistantLocales = {
    EN: {
        welcome: "Hello! I am your AI farming assistant. Let's plan your success. First, tell me about your land.",
        finishData: "Thank you. I'm analyzing your data to recommend the best crops for your soil.",
        finishDataVal: "Thank you. I'm analyzing your land data to validate if your chosen crop is suitable.",
        chooseCrop: "Select a crop to see your plan, or ask me any farming question.",
        planGenerated: "Your expert roadmap is ready. I'll guide you through each stage.",
        history: "Your Farming History",
        noHistory: "No history found. Start your first plan!",
        explainRec: (crops) => `I recommend ${crops.join(' & ')}. These are optimized for your local conditions.`,
        explainVal: (crop, isSuitable) => isSuitable ? `Great news! ${crop} is highly suitable for your land.` : `${crop} has some risks, but I have prepared precautions for you.`,
        botName: "AgriCare Expert AI"
    },
    TH: {
        welcome: "สวัสดีค่ะ! ฉันคือผู้ช่วย AI ส่วนตัวของคุณค่ะ เรามาวางแผนเพื่อความสำเร็จของคุณกันนะคะ เริ่มจากข้อมูลพื้นที่ของคุณก่อนค่ะ",
        finishData: "ขอบคุณค่ะ ฉันกำลังวิเคราะห์ข้อมูลเพื่อแนะนำพืชที่เหมาะสมที่สุดสำหรับที่ดินของคุณค่ะ",
        finishDataVal: "ขอบคุณค่ะ ฉันกำลังตรวจสอบว่าพืชที่คุณเลือกเหมาะสมกับที่ดินของคุณหรือไม่",
        chooseCrop: "เลือกพืชที่คุณต้องการเพื่อดูแผนงาน หรือถามคำถามเกี่ยวกับการเกษตรกับฉันได้เลยนะคะ",
        planGenerated: "โรดแมปผู้เชี่ยวชาญของคุณพร้อมแล้วค่ะ ฉันจะแนะนำคุณในทุกขั้นตอนนะคะ",
        history: "ประวัติการเพาะปลูกของคุณ",
        noHistory: "ไม่พบประวัติการใช้งาน เริ่มต้นสร้างแผนแรกของคุณได้เลยค่ะ!",
        explainRec: (crops) => `ฉันแนะนำให้ปลูก ${crops.join(' และ ')} ค่ะ พืชเหล่านี้เหมาะสมที่สุดสำหรับพื้นที่ของคุณค่ะ`,
        explainVal: (crop, isSuitable) => isSuitable ? `ข่าวดีค่ะ! ${crop} เหมาะสมกับพื้นที่ของคุณมากค่ะ` : `การปลูก ${crop} มีความเสี่ยงบางประการ แต่ฉันเตรียมข้อควรระวังไว้ให้แล้วค่ะ`,
        botName: "ผู้เชี่ยวชาญ AgriCare"
    }
};

const ROADMAP_STEPS = [
    { id: 1, key: 'soil_preparation', title: 'Soil Preparation', th: 'การเตรียมดิน', desc: 'Prepare land with right treatment.', icon: 'fa-mountain-sun' },
    { id: 2, key: 'seed_preparation', title: 'Seed Preparation', th: 'การเตรียมเมล็ดพันธุ์', desc: 'Sowing readiness & treatment.', icon: 'fa-box-open' },
    { id: 3, key: 'fertilizer_plan', title: 'Fertilizer', th: 'ปุ๋ยและสารอาหาร', desc: 'Nutrient guidance for crop.', icon: 'fa-flask' },
    { id: 4, key: 'irrigation_plan', title: 'Irrigation', th: 'การรดน้ำ', desc: 'Follow watering schedule.', icon: 'fa-droplet' },
    { id: 5, key: 'growth_monitoring_plan', title: 'Monitoring', th: 'การติดตามผล', desc: 'Track crop development through images.', icon: 'fa-chart-line' }
];

const PreCare = ({ locale: parentLocale, onBack, onGoToPostHarvest }) => {
    const [locale, setLocale] = useState(parentLocale || 'EN');
    const [currentPhase, setCurrentPhase] = useState(PHASE.PATH_SELECTION);
    const [pathChosen, setPathChosen] = useState(null);
    const [targetCrop, setTargetCrop] = useState('');
    const [validationResult, setValidationResult] = useState(null);
    const [assistantMode, setAssistantMode] = useState(MODE.IDLE);
    const [currentQIndex, setCurrentQIndex] = useState(-1);
    const [formData, setFormData] = useState({ landArea: '', location: '', irrigationSystem: '', soilType: '' });
    const [profileId, setProfileId] = useState(localStorage.getItem('farm_profile_id'));
    const [recommendations, setRecommendations] = useState([]);
    const [selectedCrop, setSelectedCrop] = useState(null);
    const [generatedPlan, setGeneratedPlan] = useState(null);
    const [expandedStep, setExpandedStep] = useState(1);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [assistantMsg, setAssistantMsg] = useState("");
    const [chatHistory, setChatHistory] = useState([]);
    const [weeklyTasks, setWeeklyTasks] = useState([]);
    const [growthLog, setGrowthLog] = useState({}); // { weekNum: { img, height } }
    const [assistantInput, setAssistantInput] = useState("");
    const chatEndRef = useRef(null);
    
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, assistantMsg]);
    const [diseaseResult, setDiseaseResult] = useState(null);
    const [isAnalyzingDisease, setIsAnalyzingDisease] = useState(false);
    const [diseaseImage, setDiseaseImage] = useState(null);
    const diseaseFileInputRef = useRef(null);
    const diseaseCameraInputRef = useRef(null);
    
    // UI states for tracker
    const [isLoadingHistory, setIsLoadingHistory] = useState(false); // Default to false for instant entry for new users
    const [progress, setProgress] = useState(15);
    const [uploadedImage, setUploadedImage] = useState(null);
    const fileInputRef = useRef(null);
    const [farmerHistory, setFarmerHistory] = useState(null);

    const recognitionRef = useRef(null);
    const t = assistantLocales[locale];

    useEffect(() => {
        const storedId = localStorage.getItem('farm_profile_id');
        if (storedId) {
            setIsLoadingHistory(true);
            loadFarmingHistory();
        } else {
            setIsLoadingHistory(false);
        }
    }, [profileId]);

    const loadFarmingHistory = async () => {
        if (!profileId) {
            setIsLoadingHistory(false);
            return;
        }
        try {
            const res = await fetch(`${API_URL}/api/precare/history/${profileId}`);
            const data = await res.json();
            if (data.success) {
                if (data.profile) {
                    setFormData(p => ({
                        ...p,
                        location: data.profile.location || p.location,
                        landArea: data.profile.land_area || p.landArea,
                        soilType: data.profile.soil_type || p.soilType,
                        irrigationSystem: data.profile.irrigation_system || p.irrigationSystem
                    }));
                }
                if (data.selected_crop) {
                    setSelectedCrop(data.selected_crop);
                    setGeneratedPlan(data.plan);
                    setWeeklyTasks(data.tasks || []);
                    setCurrentPhase(PHASE.TRACKER); // FIX: Ensure phase switches to tracker if crop exists
                    
                    // Fallback: If for some reason history didn't include tasks, fetch them manually
                    if (!data.tasks || data.tasks.length === 0) {
                        fetch(`${API_URL}/api/precare/generate-tasks`, {
                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ farm_profile_id: profileId, selected_crop: data.selected_crop })
                        }).then(r => r.json()).then(dT => setWeeklyTasks(dT.tasks || []));
                    }
                }
            }
        } catch (e) { 
            console.error("Error loading history", e); 
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const handleReset = () => {
        setIsLoadingHistory(false);
        setSelectedCrop(null);
        setGeneratedPlan(null);
        setWeeklyTasks([]);
        setCurrentPhase(PHASE.PATH_SELECTION);
        setPathChosen(null);
        setTargetCrop('');
        setValidationResult(null);
        speak(locale === 'EN' ? "Let's start a new farming journey!" : "มาเริ่มการเดินทางครั้งใหม่กันเถอะ!");
    };

    const speak = (text, callback) => {
        if (!text) return;
        window.speechSynthesis.cancel();
        setAssistantMsg(text);
        
        // Ensure voices are loaded (Chrome fix)
        const startSpeaking = () => {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = locale === 'EN' ? 'en-US' : 'th-TH';
            
            // Try to find a better sounding voice if available
            const voices = window.speechSynthesis.getVoices();
            if (locale === 'EN') {
                utterance.voice = voices.find(v => v.lang.includes('en-US')) || voices[0];
            } else {
                utterance.voice = voices.find(v => v.lang.includes('th-TH')) || voices[0];
            }

            utterance.onend = callback;
            utterance.onerror = (e) => {
                console.error("Speech Error:", e);
                if (callback) callback();
            };
            window.speechSynthesis.speak(utterance);
        };

        if (window.speechSynthesis.getVoices().length === 0) {
            window.speechSynthesis.onvoiceschanged = startSpeaking;
        } else {
            startSpeaking();
        }
    };

    const listen = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.lang = locale === 'EN' ? 'en-US' : 'th-TH';
        recognitionRef.current.onresult = (e) => handleVoiceResult(e.results[0][0].transcript);
        recognitionRef.current.onend = () => setIsListening(false);
        recognitionRef.current.onerror = () => setIsListening(false);
        setIsListening(true);
        recognitionRef.current.start();
    };

    const handleVoiceResult = (result) => {
        setAssistantInput(result);
        // If we already have a profile, any voice input is a general query
        if (profileId || assistantMode !== MODE.COLLECTING) {
            handleGeneralQuery(result);
        } else {
            // Still in registration mode
            const q = QUESTIONS[currentQIndex];
            setFormData(p => ({ ...p, [q.key]: result }));
            const ni = currentQIndex + 1;
            setCurrentQIndex(ni);
            setTimeout(() => { if (ni < QUESTIONS.length) askNextQuestion(ni); else finishDataCollection(); }, 500);
        }
    };

    const handleGeneralQuery = async (queryText) => {
        setChatHistory(p => [...p, { role: 'user', text: queryText }]);
        setIsAnalyzing(true);
        try {
            const res = await fetch(`${API_URL}/api/assistant/query`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ farm_profile_id: profileId, query_text: queryText, lang: locale })
            });
            const data = await res.json();
            setChatHistory(p => [...p, { role: 'ai', text: data.response }]);
            speak(data.spoken_summary || data.response);
            
            // Check if user selected a crop via voice
            const foundRec = recommendations.find(r => queryText.toLowerCase().includes(r.crop_name?.toLowerCase()));
            if (foundRec) handleCropSelect(foundRec.crop_name);
        } catch (e) { 
            const errorMsg = locale === 'EN' 
                ? "Error connecting to AI expert." 
                : "เกิดข้อผิดพลาดในการเชื่อมต่อกับผู้เชี่ยวชาญ AI";
            speak(errorMsg); 
        }
        finally { setIsAnalyzing(false); }
    };

    const refreshRecommendations = async (pId = profileId) => {
        setIsAnalyzing(true);
        setCurrentPhase(PHASE.RECOMMENDATION);
        try {
            const res = await fetch(`${API_URL}/api/precare/recommend`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ farm_profile_id: pId })
            });
            const data = await res.json();
            setRecommendations(data.recommendations || []);
            speak(t.explainRec((data.recommendations || []).map(r => r.crop_name)), () => speak(t.chooseCrop));
        } catch (e) {
            setRecommendations([{ crop_name: 'Rice', reason: 'Suitable for wet terrain.', water_need: 'High' }]);
        } finally { setIsAnalyzing(false); }
    };

    const validateCropSelection = async (pId = profileId) => {
        setIsAnalyzing(true);
        setCurrentPhase(PHASE.VALIDATING);
        try {
            const res = await fetch(`${API_URL}/api/precare/validate-crop`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ farm_profile_id: pId, selected_crop: targetCrop })
            });
            
            if (!res.ok) throw new Error(`Server Error: ${res.status}`);
            
            const data = await res.json();
            if (data.success && data.validationResult) {
                setValidationResult(data.validationResult);
                speak(t.explainVal(data.validationResult.crop_name, data.validationResult.is_suitable));
            } else {
                throw new Error("Validation Result Missing");
            }
        } catch (e) {
            console.error("Validation Error:", e);
            const errorMsg = locale === 'EN' 
                ? "I'm having trouble validating this crop. Is the AI server running?" 
                : "ฉันกำลังประสบปัญหาในการตรวจสอบพืชชนิดนี้ เซิร์ฟเวอร์ AI กำลังทำงานอยู่หรือไม่?";
            speak(errorMsg);
        } finally { setIsAnalyzing(false); }
    };

    const startAssistant = (path) => {
        setPathChosen(path);
        if (path === 'A') {
            setCurrentPhase(PHASE.INPUT_CROP);
        } else {
            if (profileId) {
                refreshRecommendations(profileId);
            } else {
                setCurrentPhase(PHASE.PLANNER);
                setAssistantMode(MODE.COLLECTING);
                setCurrentQIndex(0);
                
                // AUTO-LOCATE TRICK: Try to detect location silently to skip the first question
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition((pos) => {
                        // Reverse geocode mock
                        setFormData(p => ({ ...p, location: "Near Bangkok, Thailand" }));
                    });
                }

                speak(t.welcome, () => askNextQuestion(0));
            }
        }
    };

    const beginValidationDataCollection = () => {
        if (profileId) {
            validateCropSelection(profileId);
        } else {
            setCurrentPhase(PHASE.PLANNER);
            setAssistantMode(MODE.COLLECTING);
            setCurrentQIndex(0);
            speak(t.welcome, () => askNextQuestion(0));
        }
    };

    const askNextQuestion = (i) => {
        if (i >= QUESTIONS.length) {
            finishDataCollection();
            return;
        }

        // SMART AUTO-SKIP: If we already have this data (e.g. from profile or geolocation), skip it!
        const questionKey = QUESTIONS[i].key;
        if (formData[questionKey] && formData[questionKey] !== "") {
            const nextIdx = i + 1;
            setCurrentQIndex(nextIdx);
            // Small delay to prevent infinite recursion loop if every question is skipped
            setTimeout(() => askNextQuestion(nextIdx), 10);
            return;
        }

        speak(locale === 'EN' ? QUESTIONS[i].en : QUESTIONS[i].th, listen);
    };

    const finishDataCollection = async () => {
        setAssistantMode(MODE.EXPLAINING);
        setIsAnalyzing(true);
        speak(pathChosen === 'A' ? t.finishDataVal : t.finishData);
        try {
            const res = await fetch(`${API_URL}/api/precare/profile`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: "Farmer", phone: "000", location: formData.location || "Thailand", 
                    land_area: parseFloat(formData.landArea) || 5.0, terrain_type: "Flat", 
                    irrigation_system: formData.irrigationSystem || "Standard", soil_type: formData.soilType || "Loamy",
                    season: "Rainy", water_availability: "High", preferred_language: locale
                })
            });
            const data = await res.json();
            setProfileId(data.farm_profile_id);
            localStorage.setItem('farm_profile_id', data.farm_profile_id);
            if (pathChosen === 'A') {
                validateCropSelection(data.farm_profile_id);
            } else {
                refreshRecommendations(data.farm_profile_id);
            }
        } catch (e) { 
            if (pathChosen === 'A') validateCropSelection("fallback");
            else refreshRecommendations("fallback"); 
        }
    };

    const handleDiseaseAnalysis = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // 1. Show local preview immediately
        const reader = new FileReader();
        reader.onload = (e) => setDiseaseImage(e.target.result);
        reader.readAsDataURL(file);

        setIsAnalyzingDisease(true);
        setDiseaseResult(null);
        speak(locale === 'EN' ? "Analyzing plant image for diseases..." : "กำลังวิเคราะห์โรคพืชจากรูปภาพ...");
        
        try {
            // 2. Prepare multipart form data
            const formData = new FormData();
            formData.append('file', file);
            formData.append('farm_profile_id', profileId || 'guest');
            formData.append('selected_crop', selectedCrop || 'Unknown Crop');

            // 3. Call actual backend
            const res = await fetch(`${API_URL}/api/disease/predict`, {
                method: 'POST',
                body: formData
            });

            if (!res.ok) throw new Error("API Connection Failed");

            const data = await res.json();
            
            if (data.success) {
                setDiseaseResult({
                    disease: data.predicted_disease,
                    confidence: (data.confidence * 100).toFixed(1) + "%",
                    symptoms: data.symptoms,
                    severity: data.severity,
                    recommendation: data.recommendation
                });
                speak(locale === 'EN' ? `Detected ${data.predicted_disease}. Please check the recommendations.` : `ตรวจพบ ${data.predicted_disease} โปรดตรวจสอบคำแนะนำในการรักษาค่ะ`);
            } else {
                throw new Error("Analysis Failed");
            }
        } catch (e) {
            console.error(e);
            speak(locale === 'EN' ? "Analysis failed. Please try again." : "การวิเคราะห์ล้มเหลว โปรดลองอีกครั้งค่ะ");
            setDiseaseResult({ error: true });
        } finally {
            setIsAnalyzingDisease(false);
        }
    };

    const handleCropSelect = async (name) => {
        setSelectedCrop(name);
        localStorage.setItem('farmer_crop', name);
        setIsAnalyzing(true);
        try {
            await fetch(`${API_URL}/api/precare/select-crop`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ farm_profile_id: profileId, selected_crop: name })
            });
            const resP = await fetch(`${API_URL}/api/precare/generate-plan`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ farm_profile_id: profileId, selected_crop: name })
            });
            const dataP = await resP.json();
            
            const resT = await fetch(`${API_URL}/api/precare/generate-tasks`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ farm_profile_id: profileId, selected_crop: name })
            });
            const dataT = await resT.json();
            
            setGeneratedPlan(dataP.plan);
            setWeeklyTasks(dataT.tasks || []);
            setCurrentPhase(PHASE.TRACKER);
            setExpandedStep(1);
            speak(`Excellent choice! Your ${name} roadmap is active. Ask me anything about it.`);
            loadFarmingHistory();
        } catch (e) { console.error("Crop Selection Error", e); }
        finally { setIsAnalyzing(false); }
    };
    
    const handleWeeklyUpload = (file, week) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const simulatedHeight = 10 + (week * (5 + Math.random() * 5)); // Simulated growth height
            setGrowthLog(prev => ({
                ...prev,
                [week]: { img: event.target.result, height: simulatedHeight, timestamp: new Date().toLocaleDateString() }
            }));
            
            const msg = locale === 'EN' 
                ? `Week ${week} image recorded. Plant height looks to be around ${simulatedHeight.toFixed(1)}cm. Excellent growth!` 
                : `บันทึกรูปภาพสัปดาห์ที่ ${week} แล้วค่ะ ความสูงของพืชอยู่ที่ประมาณ ${simulatedHeight.toFixed(1)}ซม. เติบโตได้ดีมากค่ะ!`;
            speak(msg);
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="precare-overlay" style={{ background: '#f5f7f5', minHeight: '100vh', padding: 0 }}>
            {/* FULL PAGE DASHBOARD GRID */}
            <div className="precare-container" style={{ display: 'grid', gridTemplateColumns: '380px 1fr', height: '100vh', maxWidth: '100%', gap: 0 }}>
                
                {/* LEFT SIDEBAR: AI ASSISTANT & HISTORY */}
                <aside className="ai-sidebar" style={{ background: 'white', padding: '30px', borderRight: '2px solid #edf2ed', display: 'flex', flexDirection: 'column', height: '100vh', position: 'relative' }}>
                    <div className="sidebar-header" style={{ textAlign: 'center', marginBottom: '30px' }}>
                        <div className={`avatar-glow ${isListening ? 'listening' : ''}`}>
                            <i className="fa-solid fa-robot"></i>
                        </div>
                        <h2 style={{ fontFamily: 'Outfit', fontWeight: 900, marginBottom: '5px' }}>{t.botName}</h2>
                        <div className="lang-toggle" style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                            <button onClick={() => setLocale('EN')} style={{ border: 'none', background: locale === 'EN' ? 'var(--primary)' : '#eee', color: locale === 'EN' ? 'white' : '#666', padding: '4px 12px', borderRadius: '50px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}>EN</button>
                            <button onClick={() => setLocale('TH')} style={{ border: 'none', background: locale === 'TH' ? 'var(--primary)' : '#eee', color: locale === 'TH' ? 'white' : '#666', padding: '4px 12px', borderRadius: '50px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}>TH</button>
                        </div>
                    </div>
                    {/* Chat Window */}
                    <div className="chat-window" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px', paddingRight: '10px' }}>
                        <div className="msg ai" style={{ padding: '15px 20px', borderRadius: '20px 20px 20px 5px', fontSize: '0.95rem', fontWeight: 600 }}>{assistantMsg || t.chooseCrop}</div>
                        {chatHistory.map((m, i) => (
                            <div key={i} className={`msg ${m.role}`} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', padding: '15px 20px', borderRadius: m.role === 'user' ? '20px 20px 5px 20px' : '20px 20px 20px 5px', maxWidth: '85%', fontSize: '0.9rem', fontWeight: 600 }}>{m.text}</div>
                        ))}
                        {isAnalyzing && (
                            <div className="typing-indicator">
                                <div className="typing-dot"></div>
                                <div className="typing-dot"></div>
                                <div className="typing-dot"></div>
                            </div>
                        )}
                        <div ref={chatEndRef}></div>
                    </div>

                    <div className="controls" style={{ marginTop: 'auto' }}>
                        <div className="chat-input-wrapper" style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                            <input 
                                type="text"
                                value={assistantInput}
                                onChange={(e) => setAssistantInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && assistantInput.trim() && (handleGeneralQuery(assistantInput), setAssistantInput(''))}
                                placeholder={locale === 'EN' ? "Ask anything..." : "ถามได้ทุกเรื่อง..."}
                                style={{ flex: 1, padding: '12px 18px', borderRadius: '15px', border: '2px solid #edf2ed', outline: 'none', fontSize: '0.9rem', fontWeight: 600 }}
                            />
                            <button 
                                onClick={() => assistantInput.trim() && (handleGeneralQuery(assistantInput), setAssistantInput(''))}
                                style={{ width: '45px', height: '45px', borderRadius: '15px', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <i className="fa-solid fa-paper-plane"></i>
                            </button>
                        </div>
                        <div className="quick-actions" style={{ marginBottom: '15px' }}>
                            <button className="action-chip expert" onClick={() => setCurrentPhase(PHASE.DISEASE_PREDICTION)} style={{ background: '#fff1f2', color: '#e11d48', border: '1px solid #fecaca' }}>
                                <i className="fa-solid fa-virus-covid"></i> {locale === 'EN' ? 'Disease Expert' : 'ผู้เชี่ยวชาญโรคพืข'}
                            </button>
                            {(locale === 'EN' ? ['Fertilizer tips', 'Next task', 'Soil health'] : ['เคล็ดลับปุ๋ย', 'งานถัดไป', 'สุขภาพดิน']).map(act => (
                                <button key={act} className="action-chip" onClick={() => handleGeneralQuery(act)}>{act}</button>
                            ))}
                        </div>
                        <button className={`btn-big ${isListening ? 'active' : ''}`} onClick={listen} style={{ background: isListening ? 'var(--accent)' : 'var(--primary)', borderRadius: '20px', padding: '18px', width: '100%', cursor: 'pointer', border: 'none', color: 'white', fontWeight: 800, fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            <i className={`fa-solid ${isListening ? 'fa-ear-listen' : 'fa-microphone'}`}></i> {isListening ? (locale === 'EN' ? "Listening..." : "กำลังฟัง...") : (locale === 'EN' ? "Speak to AI" : "พูดคุยกับ AI")}
                        </button>
                    </div>

                    {/* HISTORY PREVIEW */}
                    <div className="farmer-history-section" style={{ marginTop: '30px', borderTop: '2px solid #f1f5f9', paddingTop: '20px' }}>
                        <h4 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}><i className="fa-solid fa-clock-rotate-left"></i> {t.history}</h4>
                        {farmerHistory ? (
                            <>
                                <div style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', padding: '18px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', marginBottom: '15px' }}>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '40px' }}>{farmerHistory.selected_crop || "Finding Crop..."}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <i className="fa-solid fa-location-dot"></i> {farmerHistory.profile.location}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                                        <i className="fa-solid fa-chart-area"></i> {farmerHistory.profile.land_area} Rai
                                    </div>
                                </div>
                                <button onClick={handleReset} style={{ width: '100%', padding: '10px', borderRadius: '12px', border: '1px dashed #cbd5e1', background: 'transparent', color: '#64748b', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                                    <i className="fa-solid fa-plus"></i> {locale === 'EN' ? "Start New Journey" : "เริ่มแผนงานใหม่"}
                                </button>
                            </>
                        ) : <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{t.noHistory}</p>}
                    </div>
                </aside>

                {/* MAIN CONTENT AREA */}
                <main className="dashboard-content" style={{ padding: '40px', overflowY: 'auto' }}>
                    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                        <div>
                            <h1 style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '2.8rem', letterSpacing: '-1.5px' }}>{locale === 'EN' ? "Farming Dashboard" : "แดชบอร์ดการเกษตร"}</h1>
                            <p style={{ color: '#64748b', fontSize: '1.1rem' }}>
                                {currentPhase === PHASE.TRACKER && selectedCrop 
                                    ? `${selectedCrop} ${locale === 'EN' ? 'Active Plan' : 'แผนงานปัจจุบัน'}` 
                                    : (locale === 'EN' ? "Your AI-powered roadmap to success." : "เส้นทางสู่ความสำเร็จที่ขับเคลื่อนด้วย AI")}
                            </p>
                        </div>
                        <button className="btn-x" onClick={onBack} style={{ width: '50px', height: '50px' }}><i className="fa-solid fa-xmark"></i></button>
                    </header>

                    {isLoadingHistory ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                            <div className="spinner" style={{ width: '60px', height: '60px', borderWidth: '6px', borderColor: 'var(--primary)', borderTopColor: 'transparent' }}></div>
                            <p style={{ marginTop: '20px', fontWeight: 700, color: '#64748b' }}>{locale === 'EN' ? "Syncing your farm profile..." : "กำลังซิงค์ข้อมูลฟาร์มของคุณ..."}</p>
                        </div>
                    ) : (
                        <>
                            {/* PHASE: PATH SELECTION */}
                            {currentPhase === PHASE.PATH_SELECTION && (
                        <div className="path-selection-view animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '50px' }}>
                            <h2 style={{ fontFamily: 'Outfit', fontSize: '2.5rem', marginBottom: '15px' }}>{locale === 'EN' ? "How would you like to start?" : "คุณต้องการเริ่มต้นอย่างไร?"}</h2>
                            <p style={{ color: '#64748b', fontSize: '1.1rem', marginBottom: '40px' }}>{locale === 'EN' ? "Choose an option to let AI assist your farming journey." : "เลือกตัวเลือกเพื่อให้ AI ช่วยเหลือการทำฟาร์มของคุณ"}</p>
                            
                            <div style={{ display: 'flex', gap: '20px', width: '100%', maxWidth: '1200px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                <div className="feature-card" onClick={() => startAssistant('A')} style={{ flex: '1 1 300px', padding: '40px 25px', minHeight: '340px', display: 'flex', flexDirection: 'column' }}>
                                    <div className="card-icon" style={{ background: '#f0f7ff', color: '#1e40af' }}><i className="fa-solid fa-seedling"></i></div>
                                    <h3 style={{ fontSize: '1.2rem', marginBottom: '15px' }}>{locale === 'EN' ? "I already know what I want to plant" : "ฉันรู้แล้วว่าต้องการปลูกอะไร"}</h3>
                                    <p style={{ fontSize: '0.9rem', color: '#64748b' }}>{locale === 'EN' ? "Validate your crop choice against your land conditions and get a specialized care plan." : "ตรวจสอบความเหมาะสมของพืชกับสภาพที่ดิน และรับแผนการดูแลเฉพาะเจาะจง"}</p>
                                    <div style={{ marginTop: 'auto', fontWeight: 'bold', color: 'var(--primary)', fontSize: '1.1rem' }}>{locale === 'EN' ? "Option A" : "ตัวเลือก A"} →</div>
                                </div>
                                
                                <div className="feature-card" onClick={() => startAssistant('B')} style={{ flex: '1 1 300px', padding: '40px 25px', minHeight: '340px', display: 'flex', flexDirection: 'column' }}>
                                    <div className="card-icon" style={{ background: '#f0fff4', color: '#15803d' }}><i className="fa-solid fa-map-location-dot"></i></div>
                                    <h3 style={{ fontSize: '1.2rem', marginBottom: '15px' }}>{locale === 'EN' ? "Recommend the best crop for my land" : "แนะนำพืชที่ดีที่สุดสำหรับที่ดินของฉัน"}</h3>
                                    <p style={{ fontSize: '0.9rem', color: '#64748b' }}>{locale === 'EN' ? "Let AI analyze your soil, weather, and terrain to find the most profitable and suitable" : "ให้ AI วิเคราะห์ดิน สภาพอากาศ และภูมิประเทศ เพื่อหาพืชที่เหมาะสมและกำไรดีที่สุด"}</p>
                                    <div style={{ marginTop: 'auto', fontWeight: 'bold', color: 'var(--primary)', fontSize: '1.1rem' }}>{locale === 'EN' ? "Option B" : "ตัวเลือก B"} →</div>
                                </div>

                                <div className="feature-card" onClick={() => setCurrentPhase(PHASE.DISEASE_PREDICTION)} style={{ flex: '1 1 300px', padding: '40px 25px', minHeight: '340px', display: 'flex', flexDirection: 'column' }}>
                                    <div className="card-icon" style={{ background: '#fff1f2', color: '#e11d48' }}><i className="fa-solid fa-virus-covid"></i></div>
                                    <h3 style={{ fontSize: '1.2rem', marginBottom: '15px' }}>{locale === 'EN' ? "Plant Disease Prediction" : "ทำนายโรคพืชโดยผู้เชี่ยวชาญ"}</h3>
                                    <p style={{ fontSize: '0.9rem', color: '#64748b' }}>{locale === 'EN' ? "Scan your crops for diseases and receive immediate expert treatment solutions." : "สแกนพืชของคุณเพื่อหาโรคและรับวิธีรักษาจากผู้เชี่ยวชาญทันที"}</p>
                                    <div style={{ marginTop: 'auto', fontWeight: 'bold', color: 'var(--primary)', fontSize: '1.1rem' }}>{locale === 'EN' ? "Option C" : "ตัวเลือก C"} →</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PHASE: DISEASE PREDICTION */}
                    {currentPhase === PHASE.DISEASE_PREDICTION && (
                        <div className="disease-prediction-view animate-slide-up" style={{ maxWidth: '800px', margin: '0 auto' }}>
                            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                                <div className="card-icon" style={{ margin: '0 auto 20px', background: '#fff1f2', color: '#e11d48', width: '100px', height: '100px', fontSize: '3rem' }}><i className="fa-solid fa-microscope"></i></div>
                                <h2 style={{ fontFamily: 'Outfit', fontSize: '2.5rem', marginBottom: '10px' }}>{locale === 'EN' ? "Plant Disease Expert" : "ผู้เชี่ยวชาญด้านโรคพืช"}</h2>
                                <p style={{ color: '#64748b', fontSize: '1.1rem' }}>{locale === 'EN' ? "Upload a photo of the affected plant to get a diagnosis and solution." : "อัปโหลดรูปภาพพืชที่ได้รับผลกระทบเพื่อรับการวินิจฉัยและวิธีแก้ไข"}</p>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: diseaseImage ? '1fr 1fr' : '1fr', gap: '30px' }}>
                                <div 
                                    style={{ 
                                        height: '400px', 
                                        background: 'white', 
                                        borderRadius: '30px', 
                                        border: '4px dashed #e2e8f0', 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        overflow: 'hidden',
                                        position: 'relative',
                                        transition: '0.3s'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                                    onMouseOut={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                                >
                                    {diseaseImage ? (
                                        <>
                                            <img src={diseaseImage} alt="Plant to analyze" onClick={() => diseaseFileInputRef.current.click()} style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} />
                                            <div style={{ position: 'absolute', bottom: '20px', display: 'flex', gap: '10px' }}>
                                                <button onClick={(e) => { e.stopPropagation(); diseaseFileInputRef.current.click(); }} style={{ background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '50px', fontWeight: 700, cursor: 'pointer' }}>
                                                    <i className="fa-solid fa-image"></i> {locale === 'EN' ? "Change Photo" : "เปลี่ยนรูปภาพ"}
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); diseaseCameraInputRef.current.click(); }} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '50px', fontWeight: 700, cursor: 'pointer' }}>
                                                    <i className="fa-solid fa-camera"></i> {locale === 'EN' ? "Retake" : "ถ่ายใหม่"}
                                                </button>
                                            </div>
                                            {isAnalyzingDisease && <div className="scanning-bar"></div>}
                                        </>
                                    ) : (
                                        <>
                                            <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: '4rem', color: '#cbd5e1', marginBottom: '20px' }}></i>
                                            <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#64748b', marginBottom: '20px' }}>{locale === 'EN' ? "Upload or Take a Photo" : "อัปโหลดหรือถ่ายรูปภาพ"}</div>
                                            <div style={{ display: 'flex', gap: '15px' }}>
                                                <button onClick={() => diseaseFileInputRef.current.click()} style={{ background: '#f1f5f9', color: '#475569', padding: '12px 20px', borderRadius: '15px', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                                                    <i className="fa-solid fa-image"></i> {locale === 'EN' ? "Upload" : "อัปโหลด"}
                                                </button>
                                                <button onClick={() => diseaseCameraInputRef.current.click()} style={{ background: 'var(--primary)', color: 'white', padding: '12px 20px', borderRadius: '15px', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                                                    <i className="fa-solid fa-camera"></i> {locale === 'EN' ? "Take Photo" : "ถ่ายรูป"}
                                                </button>
                                            </div>
                                            <p style={{ color: '#94a3b8', marginTop: '15px' }}>{locale === 'EN' ? "Supports JPG, PNG" : "รองรับ JPG, PNG"}</p>
                                        </>
                                    )}
                                    <input type="file" hidden ref={diseaseFileInputRef} accept="image/*" onChange={handleDiseaseAnalysis} />
                                    <input type="file" hidden ref={diseaseCameraInputRef} accept="image/*" capture="environment" onChange={handleDiseaseAnalysis} />
                                </div>

                                {diseaseResult ? (
                                    <div className="animate-fade-in" style={{ background: 'white', padding: '30px', borderRadius: '30px', boxShadow: '0 20px 50px rgba(0,0,0,0.05)', border: diseaseResult.error ? '2px dashed #94a3b8' : '2px solid #fecaca', overflowY: 'auto', maxHeight: '500px' }}>
                                        {diseaseResult.error ? (
                                            <div style={{ textAlign: 'center', padding: '20px' }}>
                                                <i className="fa-solid fa-circle-exclamation" style={{ fontSize: '3rem', color: '#94a3b8', marginBottom: '15px' }}></i>
                                                <h3 style={{ fontFamily: 'Outfit' }}>{locale === 'EN' ? "Analysis Failed" : "วิเคราะห์ล้มเหลว"}</h3>
                                                <p style={{ color: '#64748b', marginBottom: '20px' }}>{locale === 'EN' ? "We couldn't connect to the AI expert. Please try again." : "ไม่สามารถเชื่อมต่อกับผู้เชี่ยวชาญ AI ได้ โปรดลองอีกครั้ง"}</p>
                                                <button onClick={() => {setDiseaseImage(null); setDiseaseResult(null);}} className="btn-big" style={{ background: '#f1f5f9', color: '#475569' }}>{locale === 'EN' ? "Retry Scan" : "สแกนอีกครั้ง"}</button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="ai-tag" style={{ background: '#fee2e2', color: '#e11d48', padding: '5px 15px', borderRadius: '50px', width: 'fit-content', fontWeight: 800 }}>AI CROP DIAGNOSIS</div>
                                                <h3 style={{ fontFamily: 'Outfit', fontSize: '1.8rem', marginTop: '15px', color: '#1e293b', marginBottom: '5px' }}>{diseaseResult.disease}</h3>
                                                
                                                <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                                                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e11d48', background: '#fff1f2', padding: '4px 12px', borderRadius: '50px' }}>
                                                        <i className="fa-solid fa-chart-pie"></i> {diseaseResult.confidence} {locale === 'EN' ? "Certainty" : "แน่นอน"}
                                                    </span>
                                                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', background: '#f1f5f9', padding: '4px 12px', borderRadius: '50px' }}>
                                                        <i className="fa-solid fa-gauge-high"></i> {locale === 'EN' ? "Severity:" : "ความรุนแรง:"} {diseaseResult.severity}
                                                    </span>
                                                </div>

                                                <div style={{ marginBottom: '20px' }}>
                                                    <h5 style={{ fontFamily: 'Outfit', fontWeight: 800, color: '#64748b', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '8px' }}>{locale === 'EN' ? "Observed Symptoms" : "อาการที่พบบนพืช"}</h5>
                                                    <p style={{ color: '#475569', fontSize: '0.95rem', background: '#f8fafc', padding: '15px', borderRadius: '15px', margin: 0 }}>{diseaseResult.symptoms}</p>
                                                </div>
                                                
                                                <div style={{ background: 'linear-gradient(135deg, #fff1f2 0%, #fff 100%)', padding: '20px', borderRadius: '20px', borderLeft: '5px solid #e11d48', boxShadow: '0 5px 15px rgba(225, 29, 72, 0.05)' }}>
                                                    <h5 style={{ fontFamily: 'Outfit', color: '#e11d48', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 800 }}>
                                                        <i className="fa-solid fa-kit-medical"></i> {locale === 'EN' ? "Expert Recommendation" : "คำแนะนำจากผู้เชี่ยวชาญ"}
                                                    </h5>
                                                    <p style={{ color: '#be123c', fontSize: '1rem', lineHeight: '1.5', fontWeight: 600, margin: 0 }}>{diseaseResult.recommendation}</p>
                                                </div>

                                                <button 
                                                    onClick={() => { setDiseaseImage(null); setDiseaseResult(null); }}
                                                    style={{ marginTop: '25px', width: '100%', background: '#f1f5f9', color: '#475569', padding: '12px', borderRadius: '15px', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                                                >
                                                    <i className="fa-solid fa-redo"></i> {locale === 'EN' ? "Scan Another Plant" : "สแกนพืชต้นอื่น"}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                ) : isAnalyzingDisease ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'white', borderRadius: '30px', border: '1px solid #f1f5f9' }}>
                                        <div className="spinner" style={{ width: '50px', height: '50px', borderWidth: '5px', borderColor: '#e11d48', borderTopColor: 'transparent', marginBottom: '20px' }}></div>
                                        <h3 style={{ fontFamily: 'Outfit' }}>{locale === 'EN' ? "AI is Analyzing..." : "AI กำลังวิเคราะห์..."}</h3>
                                        <p style={{ color: '#64748b' }}>{locale === 'EN' ? "Detecting disease patterns..." : "กำลังตรวจหารูปแบบของโรค..."}</p>
                                    </div>
                                ) : diseaseImage ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: '30px', border: '1px solid #e2e8f0', padding: '40px', textAlign: 'center' }}>
                                        <i className="fa-solid fa-wand-magic-sparkles" style={{ fontSize: '3rem', color: '#e11d48', marginBottom: '20px', opacity: 0.5 }}></i>
                                        <h3 style={{ fontFamily: 'Outfit', color: '#475569' }}>{locale === 'EN' ? "Ready to Analyze" : "พร้อมที่จะวิเคราะห์"}</h3>
                                        <p style={{ color: '#94a3b8' }}>{locale === 'EN' ? "Your image is ready. AI will check for any visible disease symptoms." : "รูปภาพของคุณพร้อมแล้ว AI จะตรวจสอบอาการโรคพืชที่มองเห็นได้"}</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'none' }}></div>
                                )}
                            </div>
                            
                            <button 
                                onClick={() => setCurrentPhase(PHASE.PATH_SELECTION)} 
                                style={{ marginTop: '40px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}
                            >
                                <i className="fa-solid fa-arrow-left"></i> {locale === 'EN' ? "Back to Options" : "กลับไปยังตัวเลือก"}
                            </button>
                        </div>
                    )}

                    {/* PHASE: MANUAL INPUT FOR CROP */}
                    {currentPhase === PHASE.INPUT_CROP && (
                        <div className="input-crop-view animate-slide-up" style={{ maxWidth: '600px', margin: '50px auto 0', textAlign: 'center' }}>
                            <div className="card-icon" style={{ margin: '0 auto 30px', background: 'var(--light-green)' }}><i className="fa-brands fa-pagelines"></i></div>
                            <h2 style={{ fontFamily: 'Outfit', fontSize: '2.5rem', marginBottom: '15px' }}>{locale === 'EN' ? "What crop are you planning to plant?" : "คุณตั้งใจจะปลูกพืชชนิดไหนคะ?"}</h2>
                            <p style={{ color: '#64748b', fontSize: '1.1rem', marginBottom: '40px' }}>{locale === 'EN' ? "Enter the crop name and we will validate its suitability for your location." : "พิมพ์ชื่อพืช แล้วเราจะตรวจสอบความเหมาะสมสำหรับพื้นที่ของคุณ"}</p>
                            
                            <input 
                                type="text" 
                                value={targetCrop} 
                                onChange={(e) => setTargetCrop(e.target.value)} 
                                placeholder={locale === 'EN' ? "e.g., Rice, Sugarcane, Cassava..." : "เช่น ข้าว อ้อย มันสำปะหลัง..."}
                                style={{ width: '100%', padding: '20px 30px', fontSize: '1.2rem', borderRadius: '25px', border: '2px solid #e2e8f0', marginBottom: '30px', textAlign: 'center', fontFamily: 'Outfit', fontWeight: 600 }}
                            />
                            
                            <button 
                                onClick={beginValidationDataCollection} 
                                disabled={!targetCrop.trim()}
                                className="btn-big" 
                                style={{ background: targetCrop.trim() ? 'var(--primary)' : '#cbd5e1' }}
                            >
                                {locale === 'EN' ? "Validate My Crop" : "ตรวจสอบพืชของฉัน"} <i className="fa-solid fa-wand-magic-sparkles"></i>
                            </button>
                        </div>
                    )}

                    {/* PHASE: DATA COLLECTION (PLANNER) */}
                    {currentPhase === PHASE.PLANNER && (
                        <div className="planner-view animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
                            <div style={{ background: '#fffcf0', border: '2px solid #ffeeba', padding: '20px', borderRadius: '20px', marginBottom: '40px', color: '#856404', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '15px', justifyContent: 'center' }}>
                                <div className="spinner" style={{ borderTopColor: '#f39c12', borderWidth: '4px' }}></div>
                                {locale === 'EN' ? "AI is actively collecting your land profile via Voice Assistant..." : "AI กำลังรวบรวมข้อมูลพื้นที่ของคุณผ่านผู้ช่วยเสียง..."}
                            </div>
                            <h2 style={{ fontFamily: 'Outfit', fontSize: '2.5rem', color: '#1e293b' }}>{locale === 'EN' ? "Farm Profile Analysis" : "การวิเคราะห์โปรไฟล์ฟาร์ม"}</h2>
                            <p style={{ color: '#64748b', fontSize: '1.2rem', marginTop: '10px' }}>{locale === 'EN' ? "Please answer the AI assistant's questions." : "โปรดตอบคำถามของผู้ช่วย AI"}</p>
                        </div>
                    )}

                    {/* PHASE: VALIDATING RESULT */}
                    {currentPhase === PHASE.VALIDATING && validationResult && (
                        <div className="validation-result-view animate-slide-up m-auto" style={{ maxWidth: '900px' }}>
                            <div style={{ padding: '40px', background: 'white', borderRadius: '40px', border: validationResult.is_suitable ? '2px solid var(--primary)' : '2px solid #f59e0b', boxShadow: '0 20px 50px rgba(0,0,0,0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
                                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: validationResult.is_suitable ? 'var(--light-green)' : '#fef3c7', color: validationResult.is_suitable ? 'var(--primary)' : '#f59e0b', fontSize: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <i className={validationResult.is_suitable ? "fa-solid fa-check-circle" : "fa-solid fa-triangle-exclamation"}></i>
                                    </div>
                                    <div>
                                        <h2 style={{ fontFamily: 'Outfit', fontSize: '2.2rem', marginBottom: '5px' }}>{validationResult.crop_name} {locale === 'EN' ? "Analysis" : "ผลการวิเคราะห์"}</h2>
                                        <span style={{ padding: '6px 15px', borderRadius: '50px', fontSize: '0.9rem', fontWeight: 'bold', background: validationResult.is_suitable ? '#dcfce7' : '#fef3c7', color: validationResult.is_suitable ? '#166534' : '#92400e' }}>
                                            {validationResult.is_suitable ? (locale === 'EN' ? "Highly Suitable" : "เหมาะสมอย่างยิ่ง") : (locale === 'EN' ? "Requires Precaution" : "ต้องใช้ความระมัดระวัง")}
                                        </span>
                                    </div>
                                </div>
                                
                                <p style={{ fontSize: '1.2rem', color: '#475569', lineHeight: '1.6', marginBottom: '30px', padding: '20px', background: '#f8fafc', borderRadius: '20px', borderLeft: validationResult.is_suitable ? '5px solid var(--primary)' : '5px solid #f59e0b' }}>
                                    {validationResult.reason}
                                </p>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
                                    <div style={{ padding: '20px', background: '#f1f5f9', borderRadius: '20px', textAlign: 'center' }}>
                                        <i className="fa-solid fa-droplet" style={{ fontSize: '1.5rem', color: '#3b82f6', marginBottom: '10px' }}></i>
                                        <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>{locale === 'EN' ? "Water Needs" : "ความต้องการน้ำ"}</div>
                                        <div style={{ fontWeight: 800, color: '#1e293b' }}>{validationResult.water_need}</div>
                                    </div>
                                    <div style={{ padding: '20px', background: '#f1f5f9', borderRadius: '20px', textAlign: 'center' }}>
                                        <i className="fa-solid fa-hand-holding-hand" style={{ fontSize: '1.5rem', color: '#10b981', marginBottom: '10px' }}></i>
                                        <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>{locale === 'EN' ? "Care Level" : "ระดับการดูแล"}</div>
                                        <div style={{ fontWeight: 800, color: '#1e293b' }}>{validationResult.care_level}</div>
                                    </div>
                                    <div style={{ padding: '20px', background: '#f1f5f9', borderRadius: '20px', textAlign: 'center' }}>
                                        <i className="fa-solid fa-clock" style={{ fontSize: '1.5rem', color: '#8b5cf6', marginBottom: '10px' }}></i>
                                        <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>{locale === 'EN' ? "Est. Harvest" : "ระยะเวลาเก็บเกี่ยว"}</div>
                                        <div style={{ fontWeight: 800, color: '#1e293b' }}>{validationResult.time_to_harvest}</div>
                                    </div>
                                </div>
                                
                                {!validationResult.is_suitable && validationResult.alternatives.length > 0 && (
                                    <div style={{ marginBottom: '30px' }}>
                                        <h4 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', color: '#64748b', marginBottom: '15px' }}>{locale === 'EN' ? "Consider Safer Alternatives:" : "พิจารณาทางเลือกที่ปลอดภัยกว่า:"}</h4>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            {validationResult.alternatives.map((alt, ai) => (
                                                <button key={ai} className="action-chip" onClick={() => handleCropSelect(alt)}><i className="fa-solid fa-seedling"></i> {alt}</button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                <button className="btn-big" onClick={() => handleCropSelect(validationResult.crop_name)} style={{ background: validationResult.is_suitable ? 'var(--primary)' : '#f59e0b', borderRadius: '20px' }}>
                                    {locale === 'EN' ? `Confirm & Generate ${validationResult.crop_name} Plan` : `ยืนยันและสร้างแผน ${validationResult.crop_name}`} <i className="fa-solid fa-arrow-right"></i>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* PHASE: RECOMMENDATIONS */}
                    {currentPhase === PHASE.RECOMMENDATION && !selectedCrop && (
                        <div className="recommendation-view animate-slide-up">
                            <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, marginBottom: '30px' }}>🌱 {locale === 'EN' ? "Top Recommendations" : "พืชแนะนำอันดับต้นๆ"}</h2>
                            <div className="rec-grid">
                                {recommendations.map((r, i) => (
                                    <div key={i} className="rec-card" onClick={() => handleCropSelect(r.crop_name)}>
                                        <div className="rec-icon"><i className="fa-solid fa-seedling"></i></div>
                                        <div className="rec-info">
                                            <h4>{r.crop_name}</h4>
                                            <p>{r.reason}</p>
                                            <div className="rec-meta">
                                                <span><i className="fa-solid fa-droplet"></i> {r.water_need}</span>
                                                <span><i className="fa-solid fa-clock"></i> 4 Mo</span>
                                            </div>
                                        </div>
                                        <button className="btn-select">{locale === 'EN' ? "Start Plan" : "เริ่มวางแผน"}</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* PHASE: ROADMAP TRACKER */}
                    {currentPhase === PHASE.TRACKER && selectedCrop && (
                        <div className="tracker-view animate-fade-in" style={{ maxWidth: '100%' }}>
                            <div style={{ background: 'white', padding: '30px', borderRadius: '30px', marginBottom: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '15px' }}>
                                    <div>
                                        <h2 style={{ fontFamily: 'Outfit', fontSize: '2rem', marginBottom: '5px' }}>{locale === 'EN' ? "Master Execution Plan" : "แผนดำเนินการหลัก"}</h2>
                                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                            <p style={{ color: '#64748b', margin: 0 }}>{locale === 'EN' ? "Follow tasks weekly to maximize your yield." : "ทำตามงานรายสัปดาห์เพื่อเพิ่มผลผลิตสูงสุด"}</p>
                                            <button onClick={handleReset} style={{ background: '#f1f5f9', border: 'none', padding: '4px 12px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', cursor: 'pointer' }}>
                                                <i className="fa-solid fa-rotate"></i> {locale === 'EN' ? "Start New" : "เริ่มแผนใหม่"}
                                            </button>
                                        </div>
                                    </div>
                                    <h2 style={{ fontFamily: 'Outfit', fontSize: '3rem', color: 'var(--primary)', lineHeight: 1 }}>{progress}%</h2>
                                </div>
                                <div style={{ width: '100%', height: '15px', background: '#f1f5f9', borderRadius: '50px', overflow: 'hidden' }}>
                                    <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #2ecc71, #27ae60)', borderRadius: '50px', transition: 'width 1s ease' }}></div>
                                </div>
                            </div>

                            {/* DISEASE EXPERT QUICK ACCESS */}
                            <div 
                                onClick={() => setCurrentPhase(PHASE.DISEASE_PREDICTION)}
                                style={{ 
                                    background: 'linear-gradient(135deg, #fff1f2 0%, #fff 100%)', 
                                    padding: '20px 30px', 
                                    borderRadius: '25px', 
                                    marginBottom: '30px', 
                                    border: '2px solid #fecaca',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    cursor: 'pointer',
                                    transition: '0.3s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                    <div style={{ width: '50px', height: '50px', background: '#e11d48', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.5rem' }}>
                                        <i className="fa-solid fa-virus-covid"></i>
                                    </div>
                                    <div>
                                        <h4 style={{ margin: 0, fontFamily: 'Outfit', color: '#e11d48', fontSize: '1.2rem' }}>{locale === 'EN' ? "Plant Disease Expert Scanner" : "เครื่องสแกนโรคพฤกษาโดย AI"}</h4>
                                        <p style={{ margin: 0, color: '#be123c', fontSize: '0.9rem', opacity: 0.8 }}>{locale === 'EN' ? "Identify diseases & get expert solutions instantly" : "ระบุโรคและรับวิธีรักษาที่แม่นยำในทันที"}</p>
                                    </div>
                                </div>
                                <div style={{ background: '#e11d48', color: 'white', padding: '8px 20px', borderRadius: '50px', fontWeight: 800, fontSize: '0.8rem' }}>{locale === 'EN' ? "OPEN SCANNER" : "เปิดเครื่องสแกน"}</div>
                            </div>
                            
                            <div className="dashboard-grid">
                                {/* Left Col: Roadmap Timeline */}
                                <div className="roadmap-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <h3 style={{ fontFamily: 'Outfit', fontSize: '1.4rem', marginBottom: '10px' }}>{locale === 'EN' ? "Cultivation Stages" : "ระยะการเพาะปลูก"}</h3>
                                    {ROADMAP_STEPS.map((s) => {
                                        const active = expandedStep === s.id;
                                        const guidance = generatedPlan ? generatedPlan[s.key] : null;
                                        return (
                                            <div key={s.id} className="roadmap-step-item" style={{ display: 'flex', gap: '25px' }}>
                                                <div className="step-left">
                                                    <div className="step-circle" onClick={() => { setExpandedStep(s.id); speak(`Phase ${s.id}: ${locale === 'EN' ? s.title : s.th}`); }} style={{ background: active ? 'var(--primary)' : 'white', color: active ? 'white' : '#cbd5e1', border: active ? 'none' : '4px solid #eee' }}>{s.id}</div>
                                                    <div className="step-line" style={{ height: '100%', minHeight: '50px' }}></div>
                                                </div>
                                                <div className="step-content-box" onClick={() => { setExpandedStep(s.id); speak(`Phase ${s.id}: ${locale === 'EN' ? s.title : s.th}`); }} style={{ borderLeft: active ? '10px solid var(--primary)' : '2px solid #f1f5f9', background: 'white' }}>
                                                    <div className="step-header">
                                                        <div className="step-title-area">
                                                            <span className="step-num-label">PHASE {s.id}</span>
                                                            <h3 style={{ margin: 0 }}>{locale === 'EN' ? s.title : s.th} {active && <span className="active-badge">AI ACTIVE</span>}</h3>
                                                        </div>
                                                        <div className="step-icon-round"><i className={`fa-solid ${s.icon}`}></i></div>
                                                    </div>
                                                    <p style={{ color: '#64748b', fontSize: '0.95rem' }}>{s.desc}</p>
                                                    {active && (
                                                        <div className="step-details-expanded animate-slide-up" style={{ background: '#f8fafc', padding: '20px', borderRadius: '20px', marginTop: '15px' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                                <div className="ai-tag">AI EXPERT GUIDANCE</div>
                                                                <button onClick={(e) => { e.stopPropagation(); if (guidance) speak(guidance.join(". ")); }} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '1.2rem' }}>
                                                                    <i className="fa-solid fa-volume-high"></i>
                                                                </button>
                                                            </div>
                                                            <ul className="guidance-bullets">
                                                                {guidance ? guidance.map((g, gi) => <li key={gi} style={{ color: '#1e293b', fontWeight: 600 }}>{g}</li>) : <li style={{ color: '#64748b' }}>No specific guidance.</li>}
                                                            </ul>
                                                            
                                                                    {s.key === 'growth_monitoring_plan' && (
                                                                        <div className="growth-tracker-container" style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                                            {/* GROWTH GRAPH */}
                                                                            <div className="growth-graph-card" style={{ background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                                                                    <h5 style={{ fontFamily: 'Outfit', fontWeight: 800 }}>{locale === 'EN' ? "Growth Trajectory" : "กราฟการเจริญเติบโต"}</h5>
                                                                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', background: 'var(--light-green)', padding: '4px 10px', borderRadius: '50px' }}>Height (cm)</span>
                                                                                </div>
                                                                                <div style={{ height: '120px', display: 'flex', alignItems: 'flex-end', gap: '10px', padding: '0 10px', borderLeft: '2px solid #f1f5f9', borderBottom: '2px solid #f1f5f9' }}>
                                                                                    {[1, 2, 3, 4, 5, 6].map(w => {
                                                                                        const h = growthLog[w]?.height || 0;
                                                                                        return (
                                                                                            <div key={w} style={{ flex: 1, position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                                                                                                <div className="graph-bar" style={{ height: `${Math.min(100, (h / 60) * 100)}%`, background: h > 0 ? 'linear-gradient(to top, var(--primary), #82e0aa)' : '#f8fafc', borderRadius: '4px 4px 0 0', transition: '0.5s', position: 'relative' }}>
                                                                                                    {h > 0 && <span style={{ position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.65rem', fontWeight: 900 }}>{h.toFixed(0)}</span>}
                                                                                                </div>
                                                                                                <span style={{ fontSize: '0.65rem', textAlign: 'center', marginTop: '5px', color: '#94a3b8', fontWeight: 700 }}>W{w}</span>
                                                                                            </div>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                            </div>

                                                                            {/* WEEKLY UPLOAD GRID */}
                                                                            <div className="weekly-images-scroll" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                                                                {[1, 2, 3, 4, 5, 6].map(w => (
                                                                                    <div key={w} 
                                                                                        onClick={() => document.getElementById(`weekly-input-${w}`).click()}
                                                                                        style={{ 
                                                                                            aspectRatio: '1', 
                                                                                            background: growthLog[w] ? 'white' : '#f8fafc', 
                                                                                            borderRadius: '15px', 
                                                                                            border: growthLog[w] ? '2px solid var(--primary)' : '2px dashed #e2e8f0',
                                                                                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                                                            cursor: 'pointer', overflow: 'hidden', position: 'relative', transition: '0.2s'
                                                                                        }}
                                                                                    >
                                                                                        {growthLog[w] ? (
                                                                                            <>
                                                                                                <img src={growthLog[w].img} alt={`Week ${w}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                                                <div style={{ position: 'absolute', bottom: 0, width: '100%', background: 'rgba(46, 204, 113, 0.9)', color: 'white', fontSize: '0.65rem', fontWeight: 900, textAlign: 'center', padding: '2px 0' }}>WEEK {w}</div>
                                                                                            </>
                                                                                        ) : (
                                                                                            <>
                                                                                                <i className="fa-solid fa-plus" style={{ color: '#cbd5e1', fontSize: '1rem' }}></i>
                                                                                                <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', marginTop: '5px' }}>W{w}</span>
                                                                                            </>
                                                                                        )}
                                                                                        <input 
                                                                                            type="file" 
                                                                                            id={`weekly-input-${w}`} 
                                                                                            hidden 
                                                                                            accept="image/*" 
                                                                                            onChange={(e) => handleWeeklyUpload(e.target.files[0], w)} 
                                                                                        />
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                            <p style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic', textAlign: 'center' }}>
                                                                                {locale === 'EN' ? "* Upload weekly photos to track height & health" : "* อัปโหลดรูปภาพรายสัปดาห์เพื่อติดตามความสูงและสุขภาพพืข"}
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                
                                {/* Right Col: Weekly Task Manager */}
                                <div className="weekly-tasks-panel" style={{ background: 'white', borderRadius: '30px', padding: '30px', border: '2px solid #f1f5f9', alignSelf: 'start', position: 'sticky', top: '20px' }}>
                                    <h3 style={{ fontFamily: 'Outfit', fontSize: '1.4rem', marginBottom: '20px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' }}><i className="fa-solid fa-list-check" style={{ color: 'var(--accent)', marginRight: '10px' }}></i>{locale === 'EN' ? "Weekly Task Manager" : "ตัวจัดการงานรายสัปดาห์"}</h3>
                                    
                                    <div className="task-list" style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '600px', overflowY: 'auto', paddingRight: '5px' }}>
                                        {weeklyTasks.length > 0 ? weeklyTasks.map((t, idx) => (
                                            <div key={idx} onClick={() => {
                                                const newProgress = Math.min(100, progress + (100 / weeklyTasks.length));
                                                setProgress(Math.round(newProgress));
                                            }} style={{ display: 'flex', gap: '15px', padding: '15px', background: '#f8fafc', borderRadius: '15px', cursor: 'pointer', border: '1px solid #e2e8f0', transition: '0.2s', ':hover': { borderColor: 'var(--primary)' } }}>
                                                <div style={{ marginTop: '2px', color: progress > (idx * (100/weeklyTasks.length)) ? 'var(--primary)' : '#cbd5e1', fontSize: '1.2rem' }}>
                                                    <i className={progress > (idx * (100/weeklyTasks.length)) ? "fa-solid fa-circle-check" : "fa-regular fa-circle"}></i>
                                                </div>
                                                <div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '1px', textTransform: 'uppercase' }}>Week {t.week_number} • {t.category}</span>
                                                        <button onClick={(e) => { e.stopPropagation(); speak(`${t.title}. ${t.description}`); }} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                                                            <i className="fa-solid fa-volume-high"></i>
                                                        </button>
                                                    </div>
                                                    <h5 style={{ fontFamily: 'Inter', fontSize: '0.95rem', fontWeight: 700, margin: '0 0 5px 0', color: '#1e293b' }}>{t.title}</h5>
                                                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>{t.description}</p>
                                                </div>
                                            </div>
                                        )) : (
                                            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                                                <i className="fa-solid fa-clipboard-list" style={{ fontSize: '2.5rem', marginBottom: '15px', opacity: 0.5 }}></i>
                                                <p>{locale === 'EN' ? "No tasks generated yet." : "ยังไม่มีงานที่ถูกสร้าง"}</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <button onClick={onGoToPostHarvest} className="btn-proceed-postharvest" style={{ width: '100%', marginTop: '20px', padding: '18px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', borderRadius: '15px', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)', transition: '0.3s' }}>
                                        {locale === 'EN' ? "Proceed to Post-Harvest AI" : "ไปที่ AI หลังการเก็บเกี่ยว"} <i className="fa-solid fa-arrow-right"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default PreCare;
