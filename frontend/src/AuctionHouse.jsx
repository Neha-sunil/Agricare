import React, { useState, useEffect, useRef } from 'react';
import API_URL from './apiConfig';

const PHASE = {
    DASHBOARD: 'dashboard',
    MY_LISTINGS: 'my_listings',
    CREATE_AUCTION: 'create_auction',
    MARKET_INTEL: 'market_intel',
    AUCTION_DETAIL: 'auction_detail'
};

const loc = {
    EN: {
        agentName: "Auction Expert AI", agentMode: "Market Intelligence Mode",
        welcome: "Welcome to the Auction Hall. I can help you sell your produce at the best market price.",
        navHall: "Auction Hall", navMy: "My Produce", btnNew: "New Listing",
        livePulse: "Live Market Pulse", assistance: "Market Assistance",
        perfIntel: "Performance Intelligence", highDemand: "High Demand", nearby: "Nearby Markets",
        liveAuctions: "Live Auctions", viewBids: "View Bids", backHall: "Back to Market",
        createTitle: "Create New Listing", cropName: "Crop Name", qty: "Quantity (kg)", grade: "Quality Grade", price: "Expected Base Price (per kg)", launch: "Launch Auction",
        myProduce: "Your Active Produce", currBid: "Current Bid", noBids: "No Bids", totalBids: "Total Bids", listDate: "Listing Date", analysis: "Market Analysis",
        saleStrat: "AI SELLING STRATEGY", genInsights: "Generate Insights", marketComp: "Market Comparison", listen: "Listening...",
        success: "Auction listed successfully! I'm now analyzing buyers for you.",
        voiceMarket: (p) => `The market value for Rice is ${p} Baht per kg.`,
        voiceSell: "Sure, let's create a new auction. What are you selling?",
        voiceTrending: (c) => `The trending crops today are ${c}.`,
        voicePrice: "I recommend setting a price slightly above the local average for Grade A produce.",
        voiceRetry: "I didn't quite get that. You can ask about market prices or say 'sell' to start."
    },
    TH: {
        agentName: "ผู้เชี่ยวชาญการประมูล AI", agentMode: "โหมดข้อมูลการตลาด",
        welcome: "ยินดีต้อนรับสู่หอประมูลค่ะ ฉันสามารถช่วยคุณขายผลผลิตในราคาตลาดที่ดีที่สุดได้ค่ะ",
        navHall: "หอประมูล", navMy: "ผลผลิตของฉัน", btnNew: "ลงรายการใหม่",
        livePulse: "ชีพจรตลาดสด", assistance: "ความช่วยเหลือด้านการตลาด",
        perfIntel: "อัจฉริยะด้านประสิทธิภาพ", highDemand: "ความต้องการสูง", nearby: "ตลาดใกล้เคียง",
        liveAuctions: "การประมูลสด", viewBids: "ดูการเสนอราคา", backHall: "กลับสู่ตลาด",
        createTitle: "สร้างรายการประมูลใหม่", cropName: "ชื่อพืช", qty: "ปริมาณ (กก.)", grade: "เกรดคุณภาพ", price: "ราคาฐานที่คาดหวัง (ต่อ กก.)", launch: "เริ่มการประมูล",
        myProduce: "ผลผลิตที่ใช้งานอยู่ของคุณ", currBid: "การเสนอราคาปัจจุบัน", noBids: "ยังไม่มีการเสนอราคา", totalBids: "การเสนอราคาทั้งหมด", listDate: "วันที่ลงรายการ", analysis: "การวิเคราะห์ตลาด",
        saleStrat: "กลยุทธ์การขาย AI", genInsights: "สร้างข้อมูลเชิงลึก", marketComp: "การเปรียบเทียบตลาด", listen: "กำลังฟัง...",
        success: "ลงรายการประมูลสำเร็จแล้วค่ะ! ฉันกำลังวิเคราะห์ผู้ซื้อให้คุณอยู่ค่ะ",
        voiceMarket: (p) => `ราคาตลาดของข้าวคือ ${p} บาทต่อกิโลกรัมค่ะ`,
        voiceSell: "ได้ค่ะ มาสร้างการประมูลใหม่กัน คุณต้องการขายอะไรคะ?",
        voiceTrending: (c) => `พืชยอดนิยมวันนี้คือ ${c} ค่ะ`,
        voicePrice: "ฉันแนะนำให้ตั้งราคาสูงกว่าค่าเฉลี่ยท้องถิ่นเล็กน้อยสำหรับผลผลิตเกรด A ค่ะ",
        voiceRetry: "ฉันไม่ค่อยเข้าใจค่ะ คุณสามารถถามเกี่ยวกับราคาตลาดหรือพูดว่า 'ขาย' เพื่อเริ่มต้นได้นะคะ"
    }
};

const AuctionHouse = ({ locale, onBack }) => {
    const [currentPhase, setCurrentPhase] = useState(PHASE.DASHBOARD);
    const [listings, setListings] = useState([]);
    const [myListings, setMyListings] = useState([]);
    const [marketData, setMarketData] = useState(null);
    const [selectedAuction, setSelectedAuction] = useState(null);
    const [aiRecommendation, setAiRecommendation] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [profileId] = useState(localStorage.getItem('farm_profile_id') || 'guest_farmer');
    
    // Form State
    const [formData, setFormData] = useState({
        crop_name: '', quantity: '', expected_price: '', quality_grade: 'A',
        location: 'Chachoengsao, TH', harvest_date: new Date().toISOString().split('T')[0]
    });

    const s = loc[locale];
    const [chatHistory, setChatHistory] = useState([]);
    const [assistantInput, setAssistantInput] = useState("");
    const chatEndRef = useRef(null);
    const [assistantMsg, setAssistantMsg] = useState(s.welcome);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, assistantMsg]);

    useEffect(() => {
        // Natural page scrolling enabled
    }, []);

    const [isListening, setIsListening] = useState(false);

    useEffect(() => {
        fetchMarketData();
        fetchListings();
        if (profileId) fetchMyListings();
    }, []);

    const fetchMarketData = async () => {
        try {
            const res = await fetch(`${API_URL}/api/auction/market-intelligence`);
            const data = await res.json();
            setMarketData(data);
        } catch (e) { console.error("Market Intel Error", e); }
    };

    const fetchListings = async () => {
        try {
            const res = await fetch(`${API_URL}/api/auction/list`);
            const data = await res.json();
            setListings(data);
        } catch (e) { console.error("Listings Error", e); }
    };

    const fetchMyListings = async () => {
        try {
            const res = await fetch(`${API_URL}/api/auction/my-listings/${profileId}`);
            const data = await res.json();
            setMyListings(data);
        } catch (e) { console.error("My Listings Error", e); }
    };

    const handleCreateAuction = async (e) => {
        e.preventDefault();
        setIsAnalyzing(true);
        try {
            const res = await fetch(`${API_URL}/api/auction/create`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, farm_profile_id: profileId, quantity: parseFloat(formData.quantity), expected_price: parseFloat(formData.expected_price) })
            });
            const data = await res.json();
            if (data.success) {
                speak(s.success);
                fetchMyListings();
                setCurrentPhase(PHASE.MY_LISTINGS);
            }
        } catch (e) { console.error("Create Error", e); }
        finally { setIsAnalyzing(false); }
    };

    const getRecommendation = async (auctionId) => {
        setIsAnalyzing(true);
        try {
            const res = await fetch(`${API_URL}/api/auction/recommendation/${auctionId}`);
            const data = await res.json();
            setAiRecommendation(data);
            speak(data.reason);
        } catch (e) { console.error("Rec Error", e); }
        finally { setIsAnalyzing(false); }
    };

    const speak = (text) => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = locale === 'EN' ? 'en-US' : 'th-TH';
        setAssistantMsg(text);
        window.speechSynthesis.speak(utterance);
    };

    const listen = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;
        const recognition = new SpeechRecognition();
        recognition.lang = locale === 'EN' ? 'en-US' : 'th-TH';
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (e) => {
            const transcript = e.results[0][0].transcript.toLowerCase();
            handleVoiceCommand(transcript);
        };
        recognition.start();
    };

    const handleVoiceCommand = (cmd) => {
        if (cmd.includes('market value') || cmd.includes('ราคาตลาด')) {
            const price = marketData?.market_prices[0]?.price || 'unknown';
            speak(s.voiceMarket(price));
        } else if (cmd.includes('sell') || cmd.includes('ขาย')) {
            setCurrentPhase(PHASE.CREATE_AUCTION);
            speak(s.voiceSell);
        } else if (cmd.includes('trending') || cmd.includes('ยอดนิยม')) {
            const crops = marketData?.high_demand_crops.map(c => c.crop).join(', ') || 'none';
            speak(s.voiceTrending(crops));
        } else if (cmd.includes('price') || cmd.includes('แนะนำราคา')) {
            speak(s.voicePrice);
        } else {
            handleGeneralQuery(cmd);
        }
    };

    const handleGeneralQuery = async (queryText) => {
        setChatHistory(p => [...p, { role: 'user', text: queryText }]);
        try {
            const res = await fetch(`${API_URL}/api/assistant/query`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ farm_profile_id: profileId, query_text: queryText })
            });
            const data = await res.json();
            setChatHistory(p => [...p, { role: 'ai', text: data.response }]);
            speak(data.response);
        } catch (e) {
            speak(locale === 'EN' ? "Market expert is offline." : "ผู้เชี่ยวชาญตลาดออฟไลน์อยู่ค่ะ");
        }
    };

    return (
        <div className="precare-overlay auction-hall-overlay">
            <div className="precare-container auction-container">
                
                {/* SIDEBAR: AI AGENT & MARKET TICKER */}
                <aside className="ai-sidebar auction-sidebar">
                    <div className="sidebar-header">
                        <div className={`avatar-glow ${isListening ? 'listening' : ''}`}>
                            <i className="fa-solid fa-gavel"></i>
                        </div>
                        <h2>{s.agentName}</h2>
                        <div className="badge-expert">{s.agentMode}</div>
                    </div>

                    <div className="chat-window auction-chat">
                        <div className="msg ai">
                            {assistantMsg}
                        </div>
                        {chatHistory.map((m, i) => (
                            <div key={i} className={`msg ${m.role}`}>
                                {m.text}
                            </div>
                        ))}
                        <div ref={chatEndRef}></div>
                    </div>

                    <div className="chat-input-area">
                        <div className="chat-input-wrapper">
                            <input 
                                type="text"
                                value={assistantInput}
                                onChange={(e) => setAssistantInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && assistantInput.trim() && (handleGeneralQuery(assistantInput), setAssistantInput(''))}
                                placeholder={locale === 'EN' ? "Ask about market..." : "ถามตลาด..."}
                            />
                            <button onClick={() => assistantInput.trim() && (handleGeneralQuery(assistantInput), setAssistantInput(''))}>
                                <i className="fa-solid fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>

                    {/* MARKET TICKER - Glassmorphism style */}
                    <div className="market-ticker-card">
                        <div className="ticker-header">
                            <span>{s.livePulse}</span>
                            <div className="pulse-dot"></div>
                        </div>
                        <div className="ticker-list">
                            {marketData?.market_prices.slice(0, 4).map((m, i) => (
                                <div key={i} className="ticker-item">
                                    <span className="crop-label">{m.crop}</span>
                                    <div className="price-area">
                                        <span className={`price ${m.trend}`}>฿{m.price}</span>
                                        <i className={`fa-solid fa-caret-${m.trend === 'up' ? 'up' : 'down'}`}></i>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="sidebar-footer">
                        <button className={`btn-voice-expert ${isListening ? 'active' : ''}`} onClick={listen}>
                            <i className={`fa-solid ${isListening ? 'fa-ear-listen' : 'fa-microphone'}`}></i> 
                            {isListening ? s.listen : s.assistance}
                        </button>
                        <button onClick={onBack} className="btn-exit-hall">
                            <i className="fa-solid fa-house"></i> {locale === 'EN' ? 'Return to Home' : 'กลับสู่หน้าหลัก'}
                        </button>
                    </div>
                </aside>

                {/* MAIN CONTENT AREA */}
                <main className="auction-main-content">
                    <header className="auction-header">
                        <div className="header-titles">
                            <h1>{s.navHall}</h1>
                            <p>{locale === 'EN' ? 'Connect your premium produce with global buyers.' : 'เชื่อมต่อผลผลิตคุณภาพของคุณกับผู้ซื้อทั่วโลก'}</p>
                        </div>
                        <div className="header-nav">
                            <button onClick={() => setCurrentPhase(PHASE.DASHBOARD)} className={`nav-chip ${currentPhase === PHASE.DASHBOARD ? 'active' : ''}`}>{s.navHall}</button>
                            <button onClick={() => setCurrentPhase(PHASE.MY_LISTINGS)} className={`nav-chip ${currentPhase === PHASE.MY_LISTINGS ? 'active' : ''}`}>{s.navMy}</button>
                            <button onClick={() => setCurrentPhase(PHASE.CREATE_AUCTION)} className="btn-launch-new"><i className="fa-solid fa-plus"></i> {s.btnNew}</button>
                        </div>
                    </header>

                    {/* PHASE: DASHBOARD */}
                    {currentPhase === PHASE.DASHBOARD && (
                        <div className="animate-slide-up">
                            {/* TOP STATS / TRENDS */}
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '25px' }}>
                                <div style={{ background: 'white', borderRadius: '25px', padding: '20px 25px', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                                    <h3 style={{ fontFamily: 'Outfit', fontSize: '1.2rem', marginBottom: '15px' }}><i className="fa-solid fa-chart-line" style={{ color: 'var(--primary)' }}></i> {s.perfIntel}</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                                        {marketData?.high_demand_crops.map((h, i) => (
                                            <div key={i} style={{ background: '#f0fff4', padding: '15px', borderRadius: '15px', border: '1px solid #dcfce7' }}>
                                                <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#16a34a', textTransform: 'uppercase' }}>{s.highDemand}</span>
                                                <h4 style={{ fontFamily: 'Outfit', fontSize: '1rem', margin: '4px 0' }}>{h.crop}</h4>
                                                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>{h.reason}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', borderRadius: '25px', padding: '20px 25px', color: 'white' }}>
                                    <h3 style={{ fontFamily: 'Outfit', fontSize: '1.2rem', marginBottom: '10px' }}>{s.nearby}</h3>
                                    {marketData?.nearby_opportunities.map((o, i) => (
                                        <div key={i} style={{ marginBottom: '10px', borderBottom: '1px solid #334155', pb: '8px' }}>
                                            <p style={{ fontWeight: 800, fontSize: '0.9rem', margin: '0 0 2px 0' }}>{o.zone}</p>
                                            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>Demand for <b>{o.top_crop}</b> is {o.demand_level}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* ACTIVE AUCTIONS GRID */}
                            <h2 style={{ fontFamily: 'Outfit', fontSize: '1.5rem', marginBottom: '15px' }}>{s.liveAuctions}</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
                                {listings.map((l, i) => (
                                    <div key={i} className="feature-card" style={{ textAlign: 'left', alignItems: 'flex-start', padding: '15px', minHeight: 'auto' }}>
                                        <div style={{ width: '100%', height: '140px', background: '#eee', borderRadius: '15px', marginBottom: '12px', overflow: 'hidden' }}>
                                            {l.image_url ? <img src={l.image_url} alt={l.crop_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ccc' }}><i className="fa-solid fa-image fa-2x"></i></div>}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '4px' }}>
                                            <span style={{ padding: '3px 8px', background: '#e0e7ff', color: '#4338ca', borderRadius: '50px', fontSize: '0.65rem', fontWeight: 900 }}>GRADE {l.quality_grade}</span>
                                            <span style={{ color: '#10b981', fontWeight: 900, fontSize: '0.9rem' }}>฿{l.current_highest_bid > 0 ? l.current_highest_bid : l.expected_price}/kg</span>
                                        </div>
                                        <h3 style={{ fontSize: '1rem', marginBottom: '2px' }}>{l.crop_name} ({l.quantity} {l.unit})</h3>
                                        <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '12px' }}><i className="fa-solid fa-location-dot"></i> {l.location}</p>
                                        <button onClick={() => { setSelectedAuction(l); setCurrentPhase(PHASE.AUCTION_DETAIL); }} className="btn-select" style={{ fontSize: '0.85rem', padding: '8px' }}>{s.viewBids}</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* PHASE: CREATE AUCTION */}
                    {currentPhase === PHASE.CREATE_AUCTION && (
                        <div className="animate-slide-up" style={{ maxWidth: '800px', margin: '0 auto' }}>
                            <div className="planner-card">
                                <h3><i className="fa-solid fa-plus-circle"></i> {s.createTitle}</h3>
                                <form onSubmit={handleCreateAuction}>
                                    <div className="input-grid">
                                        <div className="input-field">
                                            <label>{s.cropName}</label>
                                            <input type="text" placeholder="e.g. Jasmine Rice" value={formData.crop_name} onChange={e => setFormData({...formData, crop_name: e.target.value})} required />
                                        </div>
                                        <div className="input-field">
                                            <label>{s.qty}</label>
                                            <input type="number" placeholder="500" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} required />
                                        </div>
                                        <div className="input-field">
                                            <label>{s.grade}</label>
                                            <select value={formData.quality_grade} onChange={e => setFormData({...formData, quality_grade: e.target.value})}>
                                                <option value="A">Grade A (Premium)</option>
                                                <option value="B">Grade B (Standard)</option>
                                                <option value="C">Grade C (Industrial)</option>
                                            </select>
                                        </div>
                                        <div className="input-field">
                                            <label>{s.price}</label>
                                            <input type="number" placeholder="35" value={formData.expected_price} onChange={e => setFormData({...formData, expected_price: e.target.value})} required />
                                        </div>
                                    </div>
                                    <button type="submit" className="btn-big" disabled={isAnalyzing}>
                                        {isAnalyzing ? <div className="spinner"></div> : <><i className="fa-solid fa-rocket"></i> {s.launch}</>}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* PHASE: MY LISTINGS */}
                    {currentPhase === PHASE.MY_LISTINGS && (
                        <div className="animate-slide-up">
                            <h2 style={{ fontFamily: 'Outfit', marginBottom: '20px' }}>{s.myProduce}</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
                                {myListings.length === 0 && <p style={{ color: '#64748b' }}>No active listings yet. Start by creating one!</p>}
                                {myListings.map((l, i) => (
                                    <div key={i} className="feature-card" style={{ textAlign: 'left', alignItems: 'flex-start', padding: '25px', position: 'relative' }}>
                                        <div style={{ position: 'absolute', top: '20px', right: '20px', background: '#2ecc71', color: 'white', padding: '4px 12px', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 900 }}>{l.status.toUpperCase()}</div>
                                        <h3 style={{ fontSize: '1.4rem', marginBottom: '5px' }}>{l.crop_name}</h3>
                                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>{s.currBid}: <b style={{ color: 'var(--primary)', fontSize: '1.2rem' }}>฿{l.current_highest_bid > 0 ? l.current_highest_bid : s.noBids}</b></p>
                                        <div style={{ background: '#f1f5f9', padding: '15px', borderRadius: '15px', width: '100%', marginBottom: '20px' }}>
                                            <div style={{ display: 'flex', justifyBetween: 'center', fontSize: '0.8rem', mb: '5px' }}>
                                                <span>{s.totalBids}:</span>
                                                <span style={{ fontWeight: 800 }}>{l.total_bids}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyBetween: 'center', fontSize: '0.8rem' }}>
                                                <span>{s.listDate}:</span>
                                                <span>{new Date(l.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <button onClick={() => { setSelectedAuction(l); setCurrentPhase(PHASE.AUCTION_DETAIL); }} className="btn-big" style={{ padding: '12px', fontSize: '0.9rem', background: '#1e293b' }}>{s.analysis}</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* PHASE: AUCTION DETAIL & AI INSIGHTS */}
                    {currentPhase === PHASE.AUCTION_DETAIL && selectedAuction && (
                        <div className="animate-slide-up">
                            <button onClick={() => setCurrentPhase(PHASE.DASHBOARD)} style={{ marginBottom: '20px', background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 800, cursor: 'pointer' }}><i className="fa-solid fa-arrow-left"></i> {s.backHall}</button>
                            
                            <div className="dashboard-grid">
                                <div>
                                    <div style={{ background: 'white', borderRadius: '40px', padding: '40px', boxShadow: '0 20px 50px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
                                        <div style={{ display: 'flex', gap: '30px' }}>
                                            <div style={{ width: '150px', height: '150px', background: '#f8fafc', borderRadius: '30px', display: 'flex', alignItems: 'center', justify: 'center', fontSize: '3rem', color: 'var(--primary)' }}><i className="fa-solid fa-leaf"></i></div>
                                            <div>
                                                <h1 style={{ fontFamily: 'Outfit', fontSize: '2.5rem' }}>{selectedAuction.crop_name}</h1>
                                                <p style={{ fontSize: '1.2rem', color: '#64748b' }}>{selectedAuction.quantity} {selectedAuction.unit} • Grade {selectedAuction.quality_grade}</p>
                                                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                                    <span className="action-chip"><i className="fa-solid fa-calendar"></i> Harvested: {selectedAuction.harvest_date}</span>
                                                    <span className="action-chip"><i className="fa-solid fa-truck-fast"></i> Delivery: Ready</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* BIDS TABLE */}
                                    <div style={{ background: 'white', borderRadius: '40px', padding: '40px', boxShadow: '0 20px 50px rgba(0,0,0,0.05)' }}>
                                        <h3 style={{ fontFamily: 'Outfit', marginBottom: '20px' }}>{locale === 'EN' ? 'Live Buyer Bids' : 'ข้อมูลการเสนอซื้อสด'}</h3>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9' }}>
                                                    <th style={{ padding: '15px' }}>{locale === 'EN' ? 'Buyer' : 'ผู้ซื้อ'}</th>
                                                    <th style={{ padding: '15px' }}>{locale === 'EN' ? 'Bid Amount' : 'ราคาที่เสนอ'}</th>
                                                    <th style={{ padding: '15px' }}>{locale === 'EN' ? 'Time' : 'เวลา'}</th>
                                                    <th style={{ padding: '15px' }}>{locale === 'EN' ? 'Action' : 'การดำเนินการ'}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedAuction.total_bids === 0 ? (
                                                    <tr><td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>Waiting for first bid...</td></tr>
                                                ) : (
                                                    <tr>
                                                        <td style={{ padding: '15px', fontWeight: 700 }}>Central Logistics TH</td>
                                                        <td style={{ padding: '15px' }}><b style={{ color: 'var(--primary)' }}>฿{selectedAuction.current_highest_bid}</b></td>
                                                        <td style={{ padding: '15px' }}>2 {locale === 'EN' ? 'mins ago' : 'นาทีที่แล้ว'}</td>
                                                        <td style={{ padding: '15px' }}><button className="btn-select" style={{ padding: '8px 15px', fontSize: '0.8rem' }}>{locale === 'EN' ? 'Accept Bid' : 'ยอมรับราคา'}</button></td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* AI REPORT SIDEBAR */}
                                <div style={{ position: 'sticky', top: '20px' }}>
                                    <div className="result-card-ai" style={{ background: '#0f172a', color: 'white' }}>
                                        <div className="ai-badge">AI SELLING STRATEGY</div>
                                        {!aiRecommendation && (
                                            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                                <i className="fa-solid fa-wand-magic-sparkles fa-3x" style={{ color: '#2ecc71', marginBottom: '20px', opacity: 0.5 }}></i>
                                                <p>{locale === 'EN' ? 'AI is analyzing market volatility and buyer behaviors...' : 'AI กำลังวิเคราะห์ความผันผวนของตลาดและพฤติกรรมผู้ซื้อ...'}</p>
                                                <button onClick={() => getRecommendation(selectedAuction._id)} className="btn-green" style={{ width: '100%', marginTop: '20px' }}>{s.genInsights}</button>
                                            </div>
                                        )}
                                        {aiRecommendation && (
                                            <div className="animate-fade-in">
                                                <div style={{ background: 'rgba(46, 204, 113, 0.1)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(46, 204, 113, 0.3)', marginBottom: '20px' }}>
                                                    <label style={{ fontSize: '0.7rem', color: '#2ecc71', fontWeight: 900 }}>RECOMMENDATION</label>
                                                    <h3 style={{ fontFamily: 'Outfit', fontSize: '1.8rem', color: 'white' }}>{aiRecommendation.recommendation}</h3>
                                                </div>
                                                <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: '1.6', marginBottom: '20px' }}>{aiRecommendation.reason}</p>
                                                
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                                                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '15px' }}>
                                                        <label style={{ fontSize: '0.65rem', color: '#64748b' }}>SALE PROBABILITY</label>
                                                        <div style={{ fontWeight: 800 }}>{aiRecommendation.sale_probability}</div>
                                                    </div>
                                                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '15px' }}>
                                                        <label style={{ fontSize: '0.65rem', color: '#64748b' }}>PRICE RANGE</label>
                                                        <div style={{ fontWeight: 800 }}>฿{aiRecommendation.safe_selling_range[0]}-{aiRecommendation.safe_selling_range[1]}</div>
                                                    </div>
                                                </div>

                                                <div style={{ background: '#1e293b', padding: '20px', borderRadius: '20px' }}>
                                                    <h5 style={{ fontFamily: 'Outfit', color: '#2ecc71', mb: '5px' }}>Market Insight</h5>
                                                    <p style={{ fontSize: '0.85rem' }}>{aiRecommendation.expected_profit_insight}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div style={{ background: 'white', borderRadius: '30px', padding: '30px', marginTop: '20px', border: '1px solid #e2e8f0' }}>
                                        <h4 style={{ fontFamily: 'Outfit', color: '#64748b', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '15px' }}>{s.marketComp}</h4>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                            <span className="action-chip">Local: ฿26</span>
                                            <span className="action-chip">Online: ฿29</span>
                                            <span className="action-chip">Hub: ฿27.5</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default AuctionHouse;
