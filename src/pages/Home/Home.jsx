import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Camera, MapPin, Zap, Shield, TrendingUp, Cpu, Send, BarChart3, ArrowRight, ImagePlus, FileText, LocateFixed, Siren, FileWarning, Sprout, Building2, Users, Sparkles, CheckCircle2, Clock, ClipboardList, X, Loader2 } from 'lucide-react';
import { getNearbyComplaints, getUploadUrl, requestEmergency, updateEmergencyLocation } from '../../services/api';
import { uploadToS3 } from '../../services/apiClient';
import { StatusBadge, SeverityBadge, CategoryTag, TimeAgo } from '../../components/Shared/Shared';
import heroImage from '../../assets/hero-ai-city.png';
import './Home.css';
const Home = () => {
    const [nearby, setNearby] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sosOpen, setSosOpen] = useState(false);
    const [emergencyNote, setEmergencyNote] = useState('');
    const [emergencyLocation, setEmergencyLocation] = useState({ latitude: null, longitude: null, address: '' });
    const [emergencySending, setEmergencySending] = useState(false);
    const [emergencyResult, setEmergencyResult] = useState(null);
    const [emergencyPhoto, setEmergencyPhoto] = useState(null);
    const [emergencyPhotoPreview, setEmergencyPhotoPreview] = useState(null);
    const [trackingEmergency, setTrackingEmergency] = useState(false);
    useEffect(() => {
        getNearbyComplaints(18.52, 73.85).then((res) => {
            setNearby(res.complaints);
            setLoading(false);
        });
    }, []);
    const openEmergency = () => {
        setSosOpen(true);
        setEmergencyResult(null);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                setEmergencyLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    address: `${position.coords.latitude.toFixed(4)}°N, ${position.coords.longitude.toFixed(4)}°E`,
                });
            }, () => setEmergencyLocation({ ...emergencyLocation, address: 'Location permission not granted' }));
        }
    };
    const sendEmergency = async () => {
        setEmergencySending(true);
        try {
            const user = JSON.parse(localStorage.getItem('civicai_user') || '{}');
            let s3Key = null;
            if (emergencyPhoto) {
                const presign = await getUploadUrl(emergencyPhoto.name, emergencyPhoto.type);
                const uploadUrl = presign?.upload_url || presign?.uploadUrl;
                s3Key = presign?.s3_key || presign?.s3Key;
                if (!uploadUrl || !s3Key) throw new Error('Could not upload emergency photo');
                await uploadToS3(uploadUrl, emergencyPhoto);
            }
            const result = await requestEmergency({
                description: emergencyNote,
                userName: user.name,
                userPhone: user.phone,
                s3Key,
                ...emergencyLocation,
            });
            setEmergencyResult(result);
            setTrackingEmergency(Boolean(result.complaintId));
            setEmergencyNote('');
        } catch (error) {
            setEmergencyResult({ error: error.data?.error || error.message || 'Could not send emergency request' });
        } finally {
            setEmergencySending(false);
        }
    };
    useEffect(() => {
        if (!trackingEmergency || !emergencyResult?.complaintId || !navigator.geolocation) return undefined;
        const watchId = navigator.geolocation.watchPosition(async (position) => {
            const location = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                address: `${position.coords.latitude.toFixed(4)}°N, ${position.coords.longitude.toFixed(4)}°E`,
            };
            setEmergencyLocation(location);
            try {
                await updateEmergencyLocation(emergencyResult.complaintId, location);
            } catch (error) {
                console.warn('Live emergency location update failed:', error.message);
            }
        }, () => setTrackingEmergency(false), { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 });
        return () => navigator.geolocation.clearWatch(watchId);
    }, [trackingEmergency, emergencyResult?.complaintId]);
    return (
        <div className="home-page">
            <section className="hero">
                <div className="container">
                    <div className="hero-inner">
                        <div className="hero-text animate-fade-in">
                            <div className="hero-badge"><Sparkles size={14} /> AI-powered community assistance</div>
                            <h1>Community care,<br /><span>intelligently connected.</span></h1>
                            <p className="hero-desc">
                                Report problems, get assistance, connect with verified responders, and track resolution
                                from one intelligent platform.
                            </p>
                            <div className="hero-actions">
                                <Link to="/submit" className="btn btn-primary btn-lg">
                                    <Camera size={16} /> Report an Issue
                                </Link>
                                <button type="button" className="btn btn-outline btn-lg" onClick={openEmergency}>
                                    <Siren size={16} /> Emergency SOS
                                </button>
                            </div>
                            {sosOpen && <div className="sos-panel">
                                <div className="sos-panel-header"><div><strong>Emergency Assistance</strong><span>Send your location to the administrator response queue.</span></div><button type="button" onClick={() => setSosOpen(false)} aria-label="Close emergency form"><X size={18} /></button></div>
                                {emergencyResult?.success ? <div className="sos-success"><CheckCircle2 size={18} /><span>Request sent. Case ID: <strong>{emergencyResult.complaintId}</strong>{trackingEmergency && <small> Live location sharing is active.</small>}</span></div> : <>
                                    {emergencyResult?.error && <div className="sos-error">{emergencyResult.error}</div>}
                                    <textarea value={emergencyNote} onChange={(event) => setEmergencyNote(event.target.value)} placeholder="What emergency help do you need?" rows="3" />
                                    <label className="sos-photo"><Camera size={15} /> <span>{emergencyPhoto ? emergencyPhoto.name : 'Add a photo for responders'}</span><input type="file" accept="image/*" capture="environment" onChange={(event) => { const file = event.target.files?.[0]; if (file) { setEmergencyPhoto(file); setEmergencyPhotoPreview(URL.createObjectURL(file)); } }} /></label>
                                    {emergencyPhotoPreview && <img className="sos-photo-preview" src={emergencyPhotoPreview} alt="Emergency evidence preview" />}
                                    {!emergencyPhoto && <small className="sos-photo-required">Add a photo before sending. It will be shared with responders.</small>}
                                    <div className="sos-location"><MapPin size={15} /> {emergencyLocation.address || 'Requesting your location...'}</div>
                                    <button type="button" className="btn btn-danger" onClick={sendEmergency} disabled={emergencySending || !emergencyNote.trim() || !emergencyPhoto}>{emergencySending ? <Loader2 size={16} className="spin-icon" /> : <Siren size={16} />} Send Emergency Request</button>
                                </>}
                            </div>}
                        </div>
                        <div className="hero-image animate-fade-in">
                            <img
                                src={heroImage}
                                alt="Pune Smart City"
                                className="hero-img"
                                onError={(e) => {
                                    e.target.src = 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=600&h=400&fit=crop';
                                }}
                            />
                        </div>
                    </div>
                    <div className="hero-trust animate-fade-in">
                        {[
                            { icon: <Sparkles size={15} />, label: 'AI powered' },
                            { icon: <Clock size={15} />, label: 'Real-time updates' },
                            { icon: <CheckCircle2 size={15} />, label: 'Verified responders' },
                            { icon: <Shield size={15} />, label: 'Secure & role-based' },
                        ].map((item) => <span key={item.label}>{item.icon}{item.label}</span>)}
                    </div>
                </div>
            </section>
            <section className="quick-report-section">
                <div className="container">
                    <div className="quick-report-card">
                        <div className="quick-report-copy">
                            <span className="quick-report-kicker">Quick assistance</span>
                            <h2>Report a problem</h2>
                            <p>Tell SAHAYA what you need help with.</p>
                        </div>
                        <div className="quick-report-actions">
                            <Link to="/submit" className="quick-report-action quick-report-action-primary">
                                <span className="quick-report-action-icon"><ImagePlus size={19} /></span>
                                <span><strong>Upload Photo</strong><small>Show us the problem</small></span>
                                <ArrowRight size={16} />
                            </Link>
                            <Link to="/submit" className="quick-report-action">
                                <span className="quick-report-action-icon"><LocateFixed size={19} /></span>
                                <span><strong>Use My Location</strong><small>Find the issue location</small></span>
                                <ArrowRight size={16} />
                            </Link>
                            <Link to="/submit" className="quick-report-action">
                                <span className="quick-report-action-icon"><FileText size={19} /></span>
                                <span><strong>Describe Issue</strong><small>Tell us what happened</small></span>
                                <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
            <section className="capabilities-section">
                <div className="container">
                    <div className="section-header"><span className="section-kicker">One connected platform</span><h2>Support for everyday needs and urgent moments.</h2><p>SAHAYA brings civic services, assistance and community response into one clear experience.</p></div>
                    <div className="capabilities-grid">
                        {[
                            { icon: <FileWarning size={20} />, title: 'Civic Issues', desc: 'Report potholes, garbage, streetlights, road damage and other local problems.' },
                            { icon: <Siren size={20} />, title: 'Emergency Assistance', desc: 'Quickly share your location and request emergency assistance.' },
                            { icon: <Sprout size={20} />, title: 'Farmer Support', desc: 'Get AI-powered crop, farming and government scheme assistance in real time.', soon: true },
                            { icon: <Building2 size={20} />, title: 'Government Services', desc: 'Find verified information about public services and government schemes.', soon: true },
                            { icon: <Users size={20} />, title: 'Volunteer & NGO Support', desc: 'Connect authorized community volunteers and NGOs with assistance requests.', soon: true },
                            { icon: <Sparkles size={20} />, title: 'AI Assistant', desc: 'Understand your request using text, voice and image input.', soon: true },
                        ].map((item) => <div key={item.title} className="capability-card"><div className="capability-icon">{item.icon}</div><div><div className="capability-title-row"><h3>{item.title}</h3>{item.soon && <span>Coming soon</span>}</div><p>{item.desc}</p></div></div>)}
                    </div>
                </div>
            </section>
            <section className="how-section">
                <div className="container">
                    <div className="section-header">
                            <span className="section-kicker">Connected response</span>
                            <h2>How SAHAYA AI works</h2>
                            <p>From the moment a request is submitted to the moment it is resolved, SAHAYA keeps users and authorized responders connected.</p>
                    </div>
                    <div className="steps-grid">
                        {[
                            { icon: <Camera size={24} />, num: '01', title: 'Report', desc: 'Share a photo, location or description of what happened.' },
                            { icon: <Cpu size={24} />, num: '02', title: 'AI Analysis', desc: 'SAHAYA understands the request and assesses its priority.' },
                            { icon: <Send size={24} />, num: '03', title: 'Smart Routing', desc: 'The request reaches the right department or service team.' },
                            { icon: <Users size={24} />, num: '04', title: 'Verified Responder', desc: 'An authorized responder accepts and acts on the case.' },
                            { icon: <Clock size={24} />, num: '05', title: 'Real-Time Updates', desc: 'Citizens can follow progress as the case moves forward.' },
                            { icon: <CheckCircle2 size={24} />, num: '06', title: 'Resolution', desc: 'The work is completed and shared for citizen verification.' },
                        ].map((s, i) => (
                            <div key={i} className="step-card animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                                <div className="step-num">{s.num}</div>
                                <div className="step-icon">{s.icon}</div>
                                <h3>{s.title}</h3>
                                <p>{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            <section className="features-section">
                <div className="container">
                    <div className="section-header">
                        <h2>Platform Features</h2>
                        <p>Built for Indian cities, powered by advanced AI</p>
                    </div>
                    <div className="features-grid">
                        {[
                            { icon: <Cpu size={20} />, title: 'AI Vision Detection', desc: '92%+ accuracy in detecting potholes, garbage, broken streetlights, and more' },
                            { icon: <MapPin size={20} />, title: 'GPS Auto-Detect', desc: 'Precise location tagging with automatic ward and sector mapping' },
                            { icon: <Zap size={20} />, title: 'Priority Scoring', desc: 'Dynamic 0-100 scoring based on severity, location, and community votes' },
                            { icon: <Send size={20} />, title: 'Smart Routing', desc: 'Automatic department assignment — PWD, Sanitation, Electrical, Water Supply' },
                            { icon: <BarChart3 size={20} />, title: 'Live Dashboard', desc: 'Real-time analytics for municipal administrators and department heads' },
                            { icon: <Shield size={20} />, title: 'Secure & Reliable', desc: 'Government-grade infrastructure with end-to-end data encryption' },
                        ].map((f, i) => (
                            <div key={i} className="feature-card animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                                <div className="feature-icon">{f.icon}</div>
                                <div>
                                    <h4>{f.title}</h4>
                                    <p>{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            <section className="nearby-section">
                <div className="container">
                    <div className="section-header-row">
                        <div>
                            <span className="section-kicker">Live case view</span>
                            <h2>Central Issue & Assistance Center</h2>
                            <p>Nearby cases from the connected civic network</p>
                        </div>
                        <Link to="/my-complaints" className="btn btn-secondary btn-sm">
                            View My Cases <ArrowRight size={12} />
                        </Link>
                    </div>
                    {loading ? (
                        <div className="loader-wrapper"><div className="loader-spinner" /></div>
                    ) : (
                        <div className="nearby-grid">
                            {nearby.map((c) => (
                                <Link key={c.id} to={`/complaint/${c.id}`} className="complaint-card card card-glow">
                                    <div className="cc-header">
                                        <CategoryTag category={c.category} />
                                        <StatusBadge status={c.status} />
                                    </div>
                                    <p className="cc-desc">{c.description}</p>
                                    <div className="cc-meta">
                                        <span className="cc-meta-item"><MapPin size={13} /> {c.address.split(',')[0]}</span>
                                        <span className="cc-meta-item"><TrendingUp size={12} /> {c.upvotes}</span>
                                        <TimeAgo date={c.createdAt} />
                                    </div>
                                    <div className="cc-footer">
                                        <SeverityBadge severity={c.severity} />
                                        <span className="cc-priority">Priority: <strong>{c.priorityScore}</strong></span>
                                    </div>
                                </Link>
                            ))}
                            {!loading && nearby.length === 0 && <div className="home-empty-state"><ClipboardList size={24} /><strong>No active cases yet.</strong><span>New assistance requests will appear here when available.</span></div>}
                        </div>
                    )}
                </div>
            </section>
            <section className="cta-section">
                <div className="container">
                    <div className="cta-box">
                        <h2>Help Improve Your City</h2>
                        <p>Join thousands of citizens across India making their city cleaner, safer, and smarter.</p>
                        <Link to="/submit" className="btn btn-primary btn-lg">
                            <Camera size={16} /> Report an Issue Now
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};
export default Home;
