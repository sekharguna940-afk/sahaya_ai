import { useEffect, useMemo, useState } from 'react';
import { Sprout, CloudSun, Landmark, BarChart3, Bell, ShieldCheck, MessageSquareText, MapPin, Tractor, Leaf, AlertTriangle, ArrowRight, Save, Loader2, Plus, Pencil, Trash2, Gauge, Wind, Droplets, Calculator, Recycle, Wrench } from 'lucide-react';
import { getFarmerProfile, saveFarmerProfile, getFarmerCrops, addFarmerCrop, updateFarmerCrop, deleteFarmerCrop, getFarmerWeather, getFarmerSchemes, analyzeFarmerCrop, calculateFarmerWaterFootprint, getFarmerCases, createFarmerCase, askFarmerAssistant, getFarmerMarket, getFarmerNotifications } from '../../services/api';
import farmerSupportImage from '../../assets/farmer-support.jpg';
import './FarmerDashboard.css';

const overviewCards = [
    { title: 'My Farm', description: 'No farm information added yet.', icon: <Tractor size={18} /> },
    { title: 'My Crops', description: 'No crop information added yet.', icon: <Leaf size={18} /> },
    { title: 'Crop Disease Detection', description: 'Crop disease AI is currently unavailable.', icon: <AlertTriangle size={18} /> },
    { title: 'Weather', description: 'Live weather service is not configured.', icon: <CloudSun size={18} /> },
    { title: 'Government Schemes', description: 'Government information service unavailable.', icon: <Landmark size={18} /> },
    { title: 'Market Information', description: 'Live market information is currently unavailable.', icon: <BarChart3 size={18} /> },
    { title: 'Farmer Assistance Cases', description: 'No assistance cases created yet.', icon: <ShieldCheck size={18} /> },
    { title: 'AI Farmer Assistant', description: 'AI assistant unavailable.', icon: <MessageSquareText size={18} /> },
    { title: 'Notifications', description: 'No notifications available yet.', icon: <Bell size={18} /> },
    { title: 'Water Footprint', description: 'Estimate crop water needs and irrigation guidance.', icon: <Calculator size={18} /> },
    { title: 'Farm Resources', description: 'Exchange crop waste and find nearby equipment.', icon: <Recycle size={18} /> },
];

const quickActions = [
    'My Farm',
    'My Crops',
    'Weather',
    'Government Schemes',
    'Crop Health',
    'AI Assistant',
    'Water Planner',
    'Farm Resources',
];

const initialForm = {
    farmerName: '',
    phone: '',
    village: '',
    district: '',
    state: '',
    farmName: '',
    farmLocation: '',
    latitude: '',
    longitude: '',
    landArea: '',
    areaUnit: 'acres',
    soilType: '',
    irrigationType: '',
};

const initialCropForm = {
    cropName: '',
    variety: '',
    sowingDate: '',
    expectedHarvestDate: '',
    farmId: '',
    area: '',
    season: 'Kharif',
};

const initialCaseForm = {
    subject: '',
    category: 'Crop health',
    description: '',
    urgency: 'Normal',
};

const initialWaterForm = {
    crop: 'Rice',
    region: 'South India',
    area: '1',
    soil: 'Loamy',
    irrigation: 'Drip',
    rainfall: '10',
    temperature: '28',
    humidity: '65',
};

const resourceListings = [
    { type: 'Waste exchange', title: 'Rice straw bales', detail: 'Available for biogas and composting', location: 'Local exchange', icon: <Recycle size={18} /> },
    { type: 'Equipment rental', title: 'Mini power tiller', detail: 'Daily rental for small farms', location: 'Nearby provider', icon: <Wrench size={18} /> },
    { type: 'Equipment rental', title: 'Crop sprayer', detail: 'Battery-operated, field ready', location: 'Nearby provider', icon: <Wrench size={18} /> },
];

const FarmerDashboard = () => {
    const now = useMemo(() => new Date(), []);
    const [form, setForm] = useState(initialForm);
    const [cropForm, setCropForm] = useState(initialCropForm);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState('');
    const [cropStatus, setCropStatus] = useState('');
    const [crops, setCrops] = useState([]);
    const [cropLoading, setCropLoading] = useState(true);
    const [editingCropId, setEditingCropId] = useState(null);
    const [weather, setWeather] = useState(null);
    const [weatherLoading, setWeatherLoading] = useState(true);
    const [schemes, setSchemes] = useState([]);
    const [schemesLoading, setSchemesLoading] = useState(true);
    const [diseaseImage, setDiseaseImage] = useState(null);
    const [diseasePreview, setDiseasePreview] = useState('');
    const [diseaseResult, setDiseaseResult] = useState(null);
    const [diseaseStatus, setDiseaseStatus] = useState('');
    const [diseaseLoading, setDiseaseLoading] = useState(false);
    const [caseForm, setCaseForm] = useState(initialCaseForm);
    const [farmerCases, setFarmerCases] = useState([]);
    const [casesLoading, setCasesLoading] = useState(true);
    const [caseSaving, setCaseSaving] = useState(false);
    const [caseStatus, setCaseStatus] = useState('');
    const [assistantInput, setAssistantInput] = useState('');
    const [assistantMessages, setAssistantMessages] = useState([]);
    const [assistantLoading, setAssistantLoading] = useState(false);
    const [assistantStatus, setAssistantStatus] = useState('');
    const [marketPrices, setMarketPrices] = useState([]);
    const [marketLoading, setMarketLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [notificationsLoading, setNotificationsLoading] = useState(true);
    const [notificationStatus, setNotificationStatus] = useState('');
    const [waterForm, setWaterForm] = useState(initialWaterForm);
    const [waterEstimate, setWaterEstimate] = useState(null);
    const [waterLoading, setWaterLoading] = useState(false);
    const [waterStatus, setWaterStatus] = useState('');

    useEffect(() => {
        const loadProfile = async () => {
            const res = await getFarmerProfile();
            if (res?.profile) {
                setForm({ ...initialForm, ...res.profile });
            }
            setLoading(false);
        };

        const loadCrops = async () => {
            const res = await getFarmerCrops();
            setCrops(res?.crops || []);
            setCropLoading(false);
        };

        const loadWeather = async () => {
            const lat = Number(form.latitude || 0);
            const lon = Number(form.longitude || 0);
            if (!lat && !lon) {
                setWeather({ message: 'Live weather service is not configured.' });
                setWeatherLoading(false);
                return;
            }

            const res = await getFarmerWeather(lat, lon);
            setWeather(res?.weather || { message: res?.message || 'Live weather service is not configured.' });
            setWeatherLoading(false);
        };

        loadProfile();
        loadCrops();
        loadWeather();
    }, [form.latitude, form.longitude]);

    useEffect(() => {
        const loadSchemes = async () => {
            const res = await getFarmerSchemes({
                state: form.state,
                district: form.district,
                crop: crops[0]?.cropName || crops[0]?.crop_name || '',
            });
            setSchemes(res?.schemes || []);
            setSchemesLoading(false);
        };

        loadSchemes();
    }, [form.state, form.district, crops[0]?.cropName, crops[0]?.crop_name]);

    useEffect(() => {
        const loadCases = async () => {
            const res = await getFarmerCases();
            setFarmerCases(res?.cases || []);
            setCasesLoading(false);
        };

        loadCases();
    }, []);

    useEffect(() => {
        const loadMarket = async () => {
            const res = await getFarmerMarket({
                state: form.state,
                district: form.district,
                commodity: crops[0]?.cropName || crops[0]?.crop_name || '',
            });
            setMarketPrices(res?.prices || res?.markets || []);
            setMarketLoading(false);
        };

        loadMarket();
    }, [form.state, form.district, crops[0]?.cropName, crops[0]?.crop_name]);

    useEffect(() => {
        let socket;
        const loadNotifications = async () => {
            const res = await getFarmerNotifications();
            setNotifications(res?.notifications || []);
            setNotificationStatus(res?.success ? '' : res?.message || 'Real-time notifications are not configured.');
            setNotificationsLoading(false);

            const wsUrl = import.meta.env.VITE_FARMER_NOTIFICATIONS_WS_URL;
            if (!wsUrl) return;

            try {
                socket = new WebSocket(wsUrl);
                socket.onopen = () => {
                    const token = localStorage.getItem('civicai_token');
                    if (token) socket.send(JSON.stringify({ type: 'authenticate', token }));
                };
                socket.onmessage = (event) => {
                    try {
                        const notification = JSON.parse(event.data);
                        setNotifications((current) => {
                            const id = notification.id || notification.notification_id;
                            if (id && current.some((item) => (item.id || item.notification_id) === id)) return current;
                            return [notification, ...current];
                        });
                        setNotificationStatus('');
                    } catch {
                        setNotificationStatus('Received an invalid notification from the live service.');
                    }
                };
                socket.onerror = () => setNotificationStatus('Real-time notifications are unavailable.');
            } catch {
                setNotificationStatus('Real-time notifications are unavailable.');
            }
        };

        loadNotifications();
        return () => socket?.close();
    }, []);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((current) => ({ ...current, [name]: value }));
    };

    const handleWaterChange = (event) => {
        const { name, value } = event.target;
        setWaterForm((current) => ({ ...current, [name]: value }));
    };

    const handleWaterSubmit = async (event) => {
        event.preventDefault();
        setWaterLoading(true);
        setWaterStatus('');
        const result = await calculateFarmerWaterFootprint({
            cropType: waterForm.crop,
            region: waterForm.region,
            soilType: waterForm.soil,
            irrigationMethod: waterForm.irrigation,
            rainfall: waterForm.rainfall,
            temperature: waterForm.temperature,
            humidity: waterForm.humidity,
            area: waterForm.area,
        });
        if (result?.success) setWaterEstimate(result);
        else setWaterStatus(result?.message || 'Water footprint model is unavailable.');
        setWaterLoading(false);
    };

    const handleSave = async (event) => {
        event.preventDefault();
        setSaving(true);
        setStatus('');

        const res = await saveFarmerProfile(form);

        if (res?.success) {
            setStatus('Farm profile saved successfully.');
        } else {
            setStatus(res?.message || 'Farmer profile service is not configured.');
        }

        setSaving(false);
    };

    const handleCropChange = (event) => {
        const { name, value } = event.target;
        setCropForm((current) => ({ ...current, [name]: value }));
    };

    const refreshCrops = async () => {
        const res = await getFarmerCrops();
        setCrops(res?.crops || []);
    };

    const handleCropSubmit = async (event) => {
        event.preventDefault();
        setCropStatus('');

        const payload = { ...cropForm, farmId: cropForm.farmId || form.farmName || 'farm-default' };
        const res = editingCropId
            ? await updateFarmerCrop(editingCropId, payload)
            : await addFarmerCrop(payload);

        if (res?.success) {
            setCropStatus(editingCropId ? 'Crop updated successfully.' : 'Crop added successfully.');
            setCropForm(initialCropForm);
            setEditingCropId(null);
            await refreshCrops();
        } else {
            setCropStatus(res?.message || 'Farmer crop service is not configured.');
        }
    };

    const handleEditCrop = (crop) => {
        setEditingCropId(crop.id || crop.crop_id || crop._id);
        setCropForm({
            cropName: crop.cropName || crop.crop_name || '',
            variety: crop.variety || '',
            sowingDate: crop.sowingDate || crop.sowing_date || '',
            expectedHarvestDate: crop.expectedHarvestDate || crop.expected_harvest_date || '',
            farmId: crop.farmId || crop.farm_id || '',
            area: crop.area || '',
            season: crop.season || 'Kharif',
        });
    };

    const handleDeleteCrop = async (id) => {
        const res = await deleteFarmerCrop(id);
        if (res?.success) {
            setCropStatus('Crop deleted successfully.');
            await refreshCrops();
        } else {
            setCropStatus(res?.message || 'Farmer crop service is not configured.');
        }
    };

    const handleDiseaseImage = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setDiseaseImage(file);
        setDiseasePreview(URL.createObjectURL(file));
        setDiseaseResult(null);
        setDiseaseStatus('');
    };

    const handleDiseaseAnalyze = async (event) => {
        event.preventDefault();
        if (!diseaseImage) {
            setDiseaseStatus('Select a crop image before starting analysis.');
            return;
        }

        setDiseaseLoading(true);
        setDiseaseStatus('');
        const res = await analyzeFarmerCrop(diseaseImage, cropForm.cropName || crops[0]?.cropName || '');
        setDiseaseResult(res?.result || null);
        setDiseaseStatus(res?.success ? '' : res?.message || 'Crop disease AI service is not configured.');
        setDiseaseLoading(false);
    };

    const handleCaseChange = (event) => {
        const { name, value } = event.target;
        setCaseForm((current) => ({ ...current, [name]: value }));
    };

    const handleCaseSubmit = async (event) => {
        event.preventDefault();
        setCaseSaving(true);
        setCaseStatus('');
        const res = await createFarmerCase(caseForm);
        if (res?.success) {
            setCaseForm(initialCaseForm);
            setCaseStatus('Assistance case created successfully.');
            const refreshed = await getFarmerCases();
            setFarmerCases(refreshed?.cases || []);
        } else {
            setCaseStatus(res?.message || 'Farmer assistance service is not configured.');
        }
        setCaseSaving(false);
    };

    const handleAssistantSubmit = async (event) => {
        event.preventDefault();
        const message = assistantInput.trim();
        if (!message || assistantLoading) return;

        setAssistantInput('');
        setAssistantStatus('');
        setAssistantMessages((current) => [...current, { role: 'user', text: message }]);
        setAssistantLoading(true);

        const res = await askFarmerAssistant(message, {
            profile: form,
            crops,
            weather: weather && !weather.message ? weather : null,
        });

        if (res?.success && res.answer) {
            setAssistantMessages((current) => [...current, { role: 'assistant', text: res.answer }]);
        } else {
            setAssistantStatus(res?.message || 'AI farmer assistant is not configured.');
        }
        setAssistantLoading(false);
    };

    return (
        <div className="farmer-page">
            <div className="container">
                <header className="farmer-header">
                    <div>
                        <p className="section-kicker">Farmer support</p>
                        <h1>Welcome to SAHAYA AI</h1>
                        <p className="farmer-subtitle">Your intelligent farming assistance center.</p>
                    </div>
                    <div className="farmer-header-badge">
                        <Sprout size={16} />
                        <span>Farmer dashboard</span>
                    </div>
                </header>

                <section className="farmer-summary-card">
                    <div className="farmer-summary-copy">
                        <h2>Farmer operations overview</h2>
                        <p>{form.farmName ? `Farm profile ready for ${form.farmName}.` : 'No farm information added yet.'}</p>
                    </div>
                    <div className="farmer-summary-meta">
                        <span><MapPin size={14} /> {form.village ? `${form.village}, ${form.district || 'District not set'}` : 'Location not added'}</span>
                        <span>{now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                </section>

                <section className="farmer-image-banner">
                    <img src={farmerSupportImage} alt="Farmers working in agricultural fields" />
                    <div className="farmer-image-caption">
                        <p className="section-kicker">SAHAYA AI for farmers</p>
                        <h2>Support for every stage of farm work</h2>
                        <p>Keep your farm details, crop health, weather, schemes, and assistance requests together.</p>
                    </div>
                </section>

                <section className="farmer-quick-actions">
                    {quickActions.map((item) => (
                        <button key={item} type="button" className="farmer-quick-action">
                            <span>{item}</span>
                            <ArrowRight size={14} />
                        </button>
                    ))}
                </section>

                <section className="farmer-grid">
                    {overviewCards.map((card) => (
                        <article key={card.title} className="farmer-card">
                            <div className="farmer-card-head">
                                <div className="farmer-icon">{card.icon}</div>
                                <h3>{card.title}</h3>
                            </div>
                            <p>{card.description}</p>
                        </article>
                    ))}
                </section>

                <section className="farmer-form-card">
                    <div className="farmer-form-header">
                        <div>
                            <p className="section-kicker">My Farm</p>
                            <h2>Farm details</h2>
                        </div>
                    </div>

                    {loading ? (
                        <div className="farmer-loader"><Loader2 size={18} className="spin-icon" /> Loading profile...</div>
                    ) : (
                        <form className="farmer-form" onSubmit={handleSave}>
                            <div className="field-grid">
                                <label>
                                    <span>Farmer name</span>
                                    <input name="farmerName" value={form.farmerName} onChange={handleChange} placeholder="Farmer name" />
                                </label>
                                <label>
                                    <span>Phone</span>
                                    <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone number" />
                                </label>
                                <label>
                                    <span>Village</span>
                                    <input name="village" value={form.village} onChange={handleChange} placeholder="Village" />
                                </label>
                                <label>
                                    <span>District</span>
                                    <input name="district" value={form.district} onChange={handleChange} placeholder="District" />
                                </label>
                                <label>
                                    <span>State</span>
                                    <input name="state" value={form.state} onChange={handleChange} placeholder="State" />
                                </label>
                            </div>

                            <div className="field-grid farm-section-grid">
                                <label>
                                    <span>Farm name</span>
                                    <input name="farmName" value={form.farmName} onChange={handleChange} placeholder="Farm name" />
                                </label>
                                <label>
                                    <span>Farm location</span>
                                    <input name="farmLocation" value={form.farmLocation} onChange={handleChange} placeholder="Farm location" />
                                </label>
                                <label>
                                    <span>Latitude</span>
                                    <input name="latitude" value={form.latitude} onChange={handleChange} placeholder="Latitude" />
                                </label>
                                <label>
                                    <span>Longitude</span>
                                    <input name="longitude" value={form.longitude} onChange={handleChange} placeholder="Longitude" />
                                </label>
                                <label>
                                    <span>Land area</span>
                                    <input name="landArea" value={form.landArea} onChange={handleChange} placeholder="Land area" />
                                </label>
                                <label>
                                    <span>Area unit</span>
                                    <select name="areaUnit" value={form.areaUnit} onChange={handleChange}>
                                        <option value="acres">Acres</option>
                                        <option value="hectares">Hectares</option>
                                        <option value="kanals">Kanals</option>
                                        <option value="bigha">Bigha</option>
                                    </select>
                                </label>
                                <label>
                                    <span>Soil type</span>
                                    <input name="soilType" value={form.soilType} onChange={handleChange} placeholder="Soil type" />
                                </label>
                                <label>
                                    <span>Irrigation type</span>
                                    <input name="irrigationType" value={form.irrigationType} onChange={handleChange} placeholder="Irrigation type" />
                                </label>
                            </div>

                            {status && <div className="farmer-form-status">{status}</div>}

                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? <><Loader2 size={16} className="spin-icon" /> Saving...</> : <><Save size={16} /> Save farm details</>}
                            </button>
                        </form>
                    )}
                </section>

                <section className="farmer-form-card weather-card">
                    <div className="farmer-form-header">
                        <div>
                            <p className="section-kicker">Weather</p>
                            <h2>Farm weather</h2>
                        </div>
                    </div>

                    {weatherLoading ? (
                        <div className="farmer-loader"><Loader2 size={18} className="spin-icon" /> Loading weather...</div>
                    ) : weather?.message ? (
                        <div className="weather-empty">{weather.message}</div>
                    ) : (
                        <div className="weather-grid">
                            <div className="weather-main">
                                <div className="weather-condition-row">
                                    <CloudSun size={24} />
                                    <span>{weather?.condition || 'Weather data unavailable'}</span>
                                </div>
                                <div className="weather-temp">{weather?.temperature ?? '--'}°C</div>
                            </div>
                            <div className="weather-metrics">
                                <div className="weather-metric"><Gauge size={15} /><span>Feels like</span><strong>{weather?.feelsLike ?? '--'}°C</strong></div>
                                <div className="weather-metric"><Droplets size={15} /><span>Humidity</span><strong>{weather?.humidity ?? '--'}%</strong></div>
                                <div className="weather-metric"><Wind size={15} /><span>Wind</span><strong>{weather?.wind ?? '--'} km/h</strong></div>
                            </div>
                        </div>
                    )}
                </section>

                <section className="farmer-form-card disease-card">
                    <div className="farmer-form-header">
                        <div>
                            <p className="section-kicker">Crop health</p>
                            <h2>Crop disease detection</h2>
                        </div>
                    </div>

                    <form className="disease-form" onSubmit={handleDiseaseAnalyze}>
                        <label className="disease-upload">
                            <span>Upload a clear crop or leaf image</span>
                            <input type="file" accept="image/*" onChange={handleDiseaseImage} />
                        </label>
                        {diseasePreview && <img className="disease-preview" src={diseasePreview} alt="Selected crop" />}
                        {diseaseStatus && <div className="farmer-form-status">{diseaseStatus}</div>}
                        <button type="submit" className="btn btn-primary" disabled={diseaseLoading}>
                            {diseaseLoading ? <><Loader2 size={16} className="spin-icon" /> Analyzing...</> : <><AlertTriangle size={16} /> Analyze crop image</>}
                        </button>
                    </form>

                    {diseaseResult && (
                        <div className="disease-result">
                            <div>
                                <span>Detected condition</span>
                                <strong>{diseaseResult.condition || diseaseResult.label || 'Unclassified'}</strong>
                            </div>
                            <div>
                                <span>Confidence</span>
                                <strong>{diseaseResult.confidence != null ? `${Math.round(Number(diseaseResult.confidence) * 100)}%` : 'Not provided'}</strong>
                            </div>
                            <p>{diseaseResult.advice || diseaseResult.recommendation || 'Follow the verified guidance returned by the crop health service.'}</p>
                        </div>
                    )}
                </section>

                <section className="farmer-form-card water-card">
                    <div className="farmer-form-header">
                        <div>
                            <p className="section-kicker">Water footprint</p>
                            <h2>Plan irrigation needs</h2>
                        </div>
                        <Calculator size={20} className="section-icon" />
                    </div>

                    <form className="farmer-form" onSubmit={handleWaterSubmit}>
                        <div className="field-grid">
                            <label>
                                <span>Crop</span>
                                <select name="crop" value={waterForm.crop} onChange={handleWaterChange}>
                                    <option>Rice</option>
                                    <option>Maize</option>
                                    <option>Wheat</option>
                                    <option>Vegetables</option>
                                </select>
                            </label>
                            <label>
                                <span>Region</span>
                                <input name="region" value={waterForm.region} onChange={handleWaterChange} placeholder="South India" />
                            </label>
                            <label>
                                <span>Area (acres)</span>
                                <input type="number" min="0" step="0.1" name="area" value={waterForm.area} onChange={handleWaterChange} />
                            </label>
                            <label>
                                <span>Soil type</span>
                                <select name="soil" value={waterForm.soil} onChange={handleWaterChange}>
                                    <option>Loamy</option>
                                    <option>Sandy</option>
                                    <option>Clay</option>
                                </select>
                            </label>
                            <label>
                                <span>Irrigation method</span>
                                <select name="irrigation" value={waterForm.irrigation} onChange={handleWaterChange}>
                                    <option>Drip</option>
                                    <option>Sprinkler</option>
                                    <option>Flood</option>
                                </select>
                            </label>
                            <label>
                                <span>Rainfall (mm)</span>
                                <input type="number" min="0" name="rainfall" value={waterForm.rainfall} onChange={handleWaterChange} />
                            </label>
                            <label>
                                <span>Temperature (C)</span>
                                <input type="number" name="temperature" value={waterForm.temperature} onChange={handleWaterChange} />
                            </label>
                            <label>
                                <span>Humidity (%)</span>
                                <input type="number" min="0" max="100" name="humidity" value={waterForm.humidity} onChange={handleWaterChange} />
                            </label>
                        </div>
                        {waterStatus && <div className="farmer-form-status">{waterStatus}</div>}
                        <button type="submit" className="btn btn-primary" disabled={waterLoading}>
                            {waterLoading ? <><Loader2 size={16} className="spin-icon" /> Calculating...</> : <><Calculator size={16} /> Calculate water need</>}
                        </button>
                    </form>

                    {waterEstimate && <>
                        <div className="water-results" aria-live="polite">
                            <div><span>Total requirement</span><strong>{Number(waterEstimate.totalWater).toLocaleString('en-IN')} m3</strong></div>
                            <div><span>Weekly need</span><strong>{Number(waterEstimate.weeklyWater).toLocaleString('en-IN')} m3</strong></div>
                            <div><span>Daily target</span><strong>{Number(waterEstimate.dailyWater).toLocaleString('en-IN')} m3</strong></div>
                        </div>
                        <p className="helper-text">Prediction powered by the integrated Kisaan-Saathi water model. Adjust with local agronomist guidance.</p>
                    </>}
                </section>

                <section className="farmer-form-card resources-card">
                    <div className="farmer-form-header">
                        <div>
                            <p className="section-kicker">Farm resources</p>
                            <h2>Waste exchange and equipment rental</h2>
                        </div>
                        <Recycle size={20} className="section-icon" />
                    </div>
                    <div className="resource-list">
                        {resourceListings.map((resource) => (
                            <article key={resource.title} className="resource-row">
                                <div className="resource-icon">{resource.icon}</div>
                                <div>
                                    <span className="resource-type">{resource.type}</span>
                                    <strong>{resource.title}</strong>
                                    <p>{resource.detail}</p>
                                </div>
                                <button type="button" className="btn btn-secondary resource-action">{resource.location}<ArrowRight size={14} /></button>
                            </article>
                        ))}
                    </div>
                    <p className="helper-text">Listings are starter entries until a verified local marketplace API is connected.</p>
                </section>

                <section className="farmer-form-card cases-card">
                    <div className="farmer-form-header">
                        <div>
                            <p className="section-kicker">Farmer assistance</p>
                            <h2>Assistance cases</h2>
                        </div>
                    </div>

                    <form className="farmer-form" onSubmit={handleCaseSubmit}>
                        <div className="field-grid">
                            <label>
                                <span>Subject</span>
                                <input name="subject" value={caseForm.subject} onChange={handleCaseChange} placeholder="Describe the help you need" required />
                            </label>
                            <label>
                                <span>Category</span>
                                <select name="category" value={caseForm.category} onChange={handleCaseChange}>
                                    <option value="Crop health">Crop health</option>
                                    <option value="Weather damage">Weather damage</option>
                                    <option value="Government scheme">Government scheme</option>
                                    <option value="Market support">Market support</option>
                                    <option value="Other">Other</option>
                                </select>
                            </label>
                            <label>
                                <span>Urgency</span>
                                <select name="urgency" value={caseForm.urgency} onChange={handleCaseChange}>
                                    <option value="Normal">Normal</option>
                                    <option value="High">High</option>
                                    <option value="Critical">Critical</option>
                                </select>
                            </label>
                        </div>
                        <label>
                            <span>Details</span>
                            <textarea name="description" value={caseForm.description} onChange={handleCaseChange} placeholder="Add relevant details about your request" rows="4" required />
                        </label>
                        {caseStatus && <div className="farmer-form-status">{caseStatus}</div>}
                        <button type="submit" className="btn btn-primary" disabled={caseSaving}>
                            {caseSaving ? <><Loader2 size={16} className="spin-icon" /> Creating...</> : <><ShieldCheck size={16} /> Create assistance case</>}
                        </button>
                    </form>

                    <div className="case-list-wrapper">
                        {casesLoading ? (
                            <div className="farmer-loader"><Loader2 size={18} className="spin-icon" /> Loading cases...</div>
                        ) : farmerCases.length === 0 ? (
                            <div className="empty-state">No assistance cases created yet. Connect the farmer assistance backend to submit a request.</div>
                        ) : (
                            <div className="case-list">
                                {farmerCases.map((farmerCase) => (
                                    <article key={farmerCase.id || farmerCase.case_id} className="case-row">
                                        <div>
                                            <strong>{farmerCase.subject || 'Assistance case'}</strong>
                                            <span>{farmerCase.category || 'General support'} · {farmerCase.urgency || 'Normal'}</span>
                                        </div>
                                        <span className="case-status">{farmerCase.status || 'Open'}</span>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                <section className="farmer-form-card assistant-card">
                    <div className="farmer-form-header">
                        <div>
                            <p className="section-kicker">Farmer assistant</p>
                            <h2>Ask about your farm</h2>
                        </div>
                    </div>

                    <div className="assistant-messages" aria-live="polite">
                        {assistantMessages.length === 0 ? (
                            <div className="empty-state">Ask a question about your crops, weather, schemes, or farm operations.</div>
                        ) : (
                            assistantMessages.map((message, index) => (
                                <div key={`${message.role}-${index}`} className={`assistant-message ${message.role}`}>
                                    <span>{message.role === 'user' ? 'You' : 'SAHAYA AI'}</span>
                                    <p>{message.text}</p>
                                </div>
                            ))
                        )}
                    </div>

                    <form className="assistant-form" onSubmit={handleAssistantSubmit}>
                        <input value={assistantInput} onChange={(event) => setAssistantInput(event.target.value)} placeholder="Ask a farming question" aria-label="Ask the farmer assistant" />
                        <button type="submit" className="btn btn-primary" disabled={assistantLoading || !assistantInput.trim()}>
                            {assistantLoading ? <><Loader2 size={16} className="spin-icon" /> Thinking...</> : <><MessageSquareText size={16} /> Ask</>}
                        </button>
                    </form>
                    {assistantStatus && <div className="farmer-form-status">{assistantStatus}</div>}
                </section>

                <section className="farmer-form-card market-card">
                    <div className="farmer-form-header">
                        <div>
                            <p className="section-kicker">Market information</p>
                            <h2>Local crop prices</h2>
                        </div>
                    </div>

                    {marketLoading ? (
                        <div className="farmer-loader"><Loader2 size={18} className="spin-icon" /> Loading market prices...</div>
                    ) : marketPrices.length === 0 ? (
                        <div className="empty-state">Live market information is currently unavailable. Connect a verified market data source to show prices.</div>
                    ) : (
                        <div className="market-list">
                            {marketPrices.map((price) => (
                                <article key={price.id || `${price.commodity}-${price.market}`} className="market-row">
                                    <div>
                                        <strong>{price.commodity || price.crop || 'Commodity'}</strong>
                                        <span>{price.market || price.mandi || price.location || 'Market not specified'}</span>
                                    </div>
                                    <div className="market-price">
                                        <strong>{price.modalPrice || price.price || price.value || 'Not available'}</strong>
                                        <span>{price.unit || 'per unit'}{price.updatedAt ? ` · ${new Date(price.updatedAt).toLocaleDateString('en-IN')}` : ''}</span>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                <section className="farmer-form-card notifications-card">
                    <div className="farmer-form-header">
                        <div>
                            <p className="section-kicker">Notifications</p>
                            <h2>Farm updates</h2>
                        </div>
                        <Bell size={20} className="notifications-icon" />
                    </div>

                    {notificationsLoading ? (
                        <div className="farmer-loader"><Loader2 size={18} className="spin-icon" /> Loading notifications...</div>
                    ) : notifications.length === 0 ? (
                        <div className="empty-state">{notificationStatus || 'No notifications available yet.'}</div>
                    ) : (
                        <div className="notification-list">
                            {notifications.map((notification) => (
                                <article key={notification.id || notification.notification_id || `${notification.title}-${notification.createdAt}`} className="notification-row">
                                    <div className="notification-dot" />
                                    <div>
                                        <strong>{notification.title || notification.subject || 'Farm update'}</strong>
                                        <p>{notification.message || notification.body || 'New information is available.'}</p>
                                        {notification.createdAt && <span>{new Date(notification.createdAt).toLocaleString('en-IN')}</span>}
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                    {!notificationsLoading && notifications.length > 0 && notificationStatus && <div className="farmer-form-status">{notificationStatus}</div>}
                </section>

                <section className="farmer-form-card crop-management-card">
                    <div className="farmer-form-header">
                        <div>
                            <p className="section-kicker">My Crops</p>
                            <h2>Crop management</h2>
                        </div>
                    </div>

                    <form className="farmer-form" onSubmit={handleCropSubmit}>
                        <div className="field-grid">
                            <label>
                                <span>Crop name</span>
                                <input name="cropName" value={cropForm.cropName} onChange={handleCropChange} placeholder="Paddy" />
                            </label>
                            <label>
                                <span>Variety</span>
                                <input name="variety" value={cropForm.variety} onChange={handleCropChange} placeholder="BPT 5204" />
                            </label>
                            <label>
                                <span>Sowing date</span>
                                <input type="date" name="sowingDate" value={cropForm.sowingDate} onChange={handleCropChange} />
                            </label>
                            <label>
                                <span>Expected harvest date</span>
                                <input type="date" name="expectedHarvestDate" value={cropForm.expectedHarvestDate} onChange={handleCropChange} />
                            </label>
                            <label>
                                <span>Farm ID</span>
                                <input name="farmId" value={cropForm.farmId} onChange={handleCropChange} placeholder="Farm ID" />
                            </label>
                            <label>
                                <span>Area</span>
                                <input name="area" value={cropForm.area} onChange={handleCropChange} placeholder="2 acres" />
                            </label>
                            <label>
                                <span>Season</span>
                                <select name="season" value={cropForm.season} onChange={handleCropChange}>
                                    <option value="Kharif">Kharif</option>
                                    <option value="Rabi">Rabi</option>
                                    <option value="Zaid">Zaid</option>
                                </select>
                            </label>
                        </div>

                        {cropStatus && <div className="farmer-form-status">{cropStatus}</div>}

                        <div className="crop-actions-row">
                            <button type="submit" className="btn btn-primary">
                                {editingCropId ? <><Pencil size={16} /> Update crop</> : <><Plus size={16} /> Add crop</>}
                            </button>
                            {editingCropId && (
                                <button type="button" className="btn btn-secondary" onClick={() => { setEditingCropId(null); setCropForm(initialCropForm); setCropStatus(''); }}>
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>

                    <div className="crop-list-wrapper">
                        {cropLoading ? (
                            <div className="farmer-loader"><Loader2 size={18} className="spin-icon" /> Loading crops...</div>
                        ) : crops.length === 0 ? (
                            <div className="empty-state">No crop information added yet.</div>
                        ) : (
                            <div className="crop-list">
                                {crops.map((crop) => (
                                    <div key={crop.id || crop.crop_id || crop._id} className="crop-row">
                                        <div>
                                            <strong>{crop.cropName || crop.crop_name || 'Crop'}</strong>
                                            <span>{crop.variety || 'No variety provided'} · {crop.season || 'Season not set'}</span>
                                        </div>
                                        <div className="crop-meta">
                                            <span>{crop.area || 'Area not set'}</span>
                                            <span>{crop.sowingDate ? new Date(crop.sowingDate).toLocaleDateString('en-IN') : 'Sowing date not set'}</span>
                                        </div>
                                        <div className="crop-actions">
                                            <button type="button" className="icon-button" aria-label="Edit crop" onClick={() => handleEditCrop(crop)}>
                                                <Pencil size={14} />
                                            </button>
                                            <button type="button" className="icon-button danger" aria-label="Delete crop" onClick={() => handleDeleteCrop(crop.id || crop.crop_id || crop._id)}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                <section className="farmer-form-card schemes-card">
                    <div className="farmer-form-header">
                        <div>
                            <p className="section-kicker">Government schemes</p>
                            <h2>Farmer support schemes</h2>
                        </div>
                    </div>

                    {schemesLoading ? (
                        <div className="farmer-loader"><Loader2 size={18} className="spin-icon" /> Loading schemes...</div>
                    ) : schemes.length === 0 ? (
                        <div className="empty-state">Government information service unavailable. Connect the scheme index or backend API to enable recommendations.</div>
                    ) : (
                        <div className="schemes-list">
                            {schemes.map((scheme) => (
                                <article key={scheme.id || scheme.schemeId || scheme.name} className="scheme-card">
                                    <div className="scheme-header">
                                        <div>
                                            <p className="scheme-tag">{scheme.category || 'Government scheme'}</p>
                                            <h3>{scheme.name || 'Scheme'}</h3>
                                        </div>
                                        <span className="scheme-status">{scheme.status || 'Available'}</span>
                                    </div>
                                    <p>{scheme.summary || scheme.description || 'Official scheme details are not available yet.'}</p>
                                    <div className="scheme-meta">
                                        <span>{scheme.state || form.state || 'All states'}</span>
                                        <span>{scheme.benefit || scheme.amount || 'Check official source'}</span>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default FarmerDashboard;
