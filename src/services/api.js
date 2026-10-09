/**
 * api.js — CivicAI Frontend API Service Layer.
 *
 * Every function calls the real backend API via apiClient.
 * If the API is unreachable, each function falls back to mock data
 * so the frontend never breaks during local development.
 */

import { api, uploadToS3 } from './apiClient';
import {
    mockComplaints,
    mockDashboardStats,
    mockUser,
} from '../data/mockData';

// ─────────────────────────────────────────────────────────────────────────────
//  Auth
// ─────────────────────────────────────────────────────────────────────────────

export async function login(phone) {
    try {
        const res = await api.post('/auth/send-otp', { phone });
        return res;
    } catch (err) {
        console.error('API Error in login:', err.message);
        throw err;
    }
}

export async function verifyOtp(phone, otp) {
    try {
        const res = await api.post('/auth/verify-otp', { phone, otp });
        if (res.token) {
            localStorage.setItem('civicai_token', res.token);
        }
        return res;
    } catch (err) {
        console.error('API Error in verifyOtp:', err.message);
        throw err;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Farmer profile & farm details
// ─────────────────────────────────────────────────────────────────────────────

export async function getFarmerProfile() {
    try {
        const res = await api.get('/api/farmer/profile');
        return res;
    } catch (err) {
        console.warn('Farmer profile service not configured:', err.message);
        return {
            success: false,
            message: 'Farmer profile service is not configured.',
            profile: null,
        };
    }
}

export async function saveFarmerProfile(profile) {
    try {
        const res = await api.patch('/api/farmer/profile', profile);
        return res;
    } catch (err) {
        console.warn('Farmer profile save unavailable:', err.message);
        return {
            success: false,
            message: 'Farmer profile service is not configured.',
        };
    }
}

export async function getFarmerCrops() {
    try {
        const res = await api.get('/api/farmer/crops');
        return res;
    } catch (err) {
        console.warn('Farmer crop service not configured:', err.message);
        return {
            success: false,
            message: 'Farmer crop service is not configured.',
            crops: [],
        };
    }
}

export async function addFarmerCrop(crop) {
    try {
        const res = await api.post('/api/farmer/crops', crop);
        return res;
    } catch (err) {
        console.warn('Add crop unavailable:', err.message);
        return {
            success: false,
            message: 'Farmer crop service is not configured.',
        };
    }
}

export async function updateFarmerCrop(id, crop) {
    try {
        const res = await api.patch(`/api/farmer/crops/${id}`, crop);
        return res;
    } catch (err) {
        console.warn('Update crop unavailable:', err.message);
        return {
            success: false,
            message: 'Farmer crop service is not configured.',
        };
    }
}

export async function deleteFarmerCrop(id) {
    try {
        const res = await api.delete(`/api/farmer/crops/${id}`);
        return res;
    } catch (err) {
        console.warn('Delete crop unavailable:', err.message);
        return {
            success: false,
            message: 'Farmer crop service is not configured.',
        };
    }
}

export async function getFarmerWeather(latitude, longitude) {
    try {
        const res = await api.get('/api/farmer/weather', { latitude, longitude });
        return res;
    } catch (err) {
        console.warn('Farmer weather service unavailable:', err.message);
        const realtimeUrl = import.meta.env.VITE_CROP_DETECTION_URL;
        if (realtimeUrl && latitude && longitude) {
            try {
                const response = await fetch(`${realtimeUrl.replace(/\/$/, '')}/weather?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}`);
                if (!response.ok) throw new Error(`Weather service returned ${response.status}`);
                return await response.json();
            } catch (weatherErr) {
                console.warn('Real-time weather unavailable:', weatherErr.message);
            }
        }
        return {
            success: false,
            message: 'Live weather service is not configured.',
            weather: null,
        };
    }
}

export async function getFarmerSchemes(filters = {}) {
    try {
        const res = await api.get('/api/farmer/schemes', filters);
        return res;
    } catch (err) {
        console.warn('Farmer schemes service unavailable:', err.message);
        return {
            success: false,
            message: 'Government information service unavailable.',
            schemes: [],
        };
    }
}

export async function analyzeFarmerCrop(imageFile, cropName = '') {
    const realtimeUrl = import.meta.env.VITE_CROP_DETECTION_URL;
    if (realtimeUrl) {
        try {
            const body = new FormData();
            body.append('file', imageFile);
            const response = await fetch(`${realtimeUrl.replace(/\/$/, '')}/predict`, {
                method: 'POST',
                body,
            });
            if (!response.ok) throw new Error(`Crop detector returned ${response.status}`);
            return await response.json();
        } catch (err) {
            console.warn('Real-time crop detector unavailable:', err.message);
        }
    }
    try {
        const presign = await api.post('/api/farmer/crop-disease/presign', {
            fileName: imageFile.name,
            fileType: imageFile.type,
        });
        const uploadUrl = presign?.upload_url || presign?.uploadUrl;
        const s3Key = presign?.s3_key || presign?.s3Key;
        if (!uploadUrl || !s3Key) {
            throw new Error('Could not get crop image upload URL');
        }

        await uploadToS3(uploadUrl, imageFile);
        return await api.post('/api/farmer/crop-disease/analyze', { s3Key, cropName });
    } catch (err) {
        console.warn('Farmer crop disease service unavailable:', err.message);
        return {
            success: false,
            message: 'Crop disease AI service is not configured.',
            result: null,
        };
    }
}

export async function calculateFarmerWaterFootprint(payload) {
    const realtimeUrl = import.meta.env.VITE_CROP_DETECTION_URL;
    if (!realtimeUrl) {
        return { success: false, message: 'Configure VITE_CROP_DETECTION_URL for the water footprint model.' };
    }
    try {
        const response = await fetch(`${realtimeUrl.replace(/\/$/, '')}/calculate-water-footprint`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.detail || `Water model returned ${response.status}`);
        return result;
    } catch (err) {
        console.warn('Water footprint model unavailable:', err.message);
        return { success: false, message: err.message || 'Water footprint model is unavailable.' };
    }
}

export async function getFarmerCases() {
    try {
        return await api.get('/api/farmer/cases');
    } catch (err) {
        console.warn('Farmer cases service unavailable:', err.message);
        return {
            success: false,
            message: 'Farmer assistance service is not configured.',
            cases: [],
        };
    }
}

export async function createFarmerCase(caseDetails) {
    try {
        return await api.post('/api/farmer/cases', caseDetails);
    } catch (err) {
        console.warn('Farmer case creation unavailable:', err.message);
        return {
            success: false,
            message: 'Farmer assistance service is not configured.',
        };
    }
}

export async function askFarmerAssistant(message, context = {}) {
    try {
        return await api.post('/api/farmer/assistant', { message, context });
    } catch (err) {
        console.warn('Farmer assistant service unavailable:', err.message);
        return {
            success: false,
            message: 'AI farmer assistant is not configured.',
            answer: null,
        };
    }
}

export async function getFarmerMarket(filters = {}) {
    try {
        return await api.get('/api/farmer/market', filters);
    } catch (err) {
        console.warn('Farmer market service unavailable:', err.message);
        return {
            success: false,
            message: 'Live market information is currently unavailable.',
            prices: [],
        };
    }
}

export async function getFarmerNotifications() {
    try {
        return await api.get('/api/farmer/notifications');
    } catch (err) {
        console.warn('Farmer notifications service unavailable:', err.message);
        return {
            success: false,
            message: 'Real-time notifications are not configured.',
            notifications: [],
        };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Complaints — Read
// ─────────────────────────────────────────────────────────────────────────────

export async function getComplaints(filters = {}) {
    try {
        const res = await api.get('/complaints', filters);
        return res;
    } catch (err) {
        console.warn('API unreachable — using mock complaints:', err.message);
        let results = [...mockComplaints];
        if (filters.status) {
            results = results.filter((c) => c.status === filters.status);
        }
        if (filters.category) {
            const mappedCats = {
                'road_issue': ['road_issue', 'pothole'],
                'waste': ['waste', 'garbage'],
                'lighting': ['lighting', 'streetlight', 'broken_streetlight'],
            };
            const validCats = mappedCats[filters.category] || [filters.category];
            results = results.filter((c) => validCats.includes(c.category));
        }
        if (filters.severity) {
            results = results.filter((c) => c.severity === filters.severity);
        }
        return {
            success: true,
            complaints: results,
            total: results.length,
            pagination: { page: 1, limit: 20, total: results.length, pages: 1 },
        };
    }
}

export async function getComplaintById(id) {
    try {
        const res = await api.get(`/complaints/${id}`);
        return res;
    } catch (err) {
        console.warn('API unreachable — using mock complaint:', err.message);
        const complaint = mockComplaints.find((c) => c.id === id);
        if (!complaint) {
            return { success: false, error: 'Complaint not found' };
        }
        return { success: true, complaint };
    }
}

export async function getNearbyComplaints(lat, lng, radius = 500) {
    try {
        const res = await api.get('/complaints/nearby', { lat, lng, radius });
        return res;
    } catch (err) {
        console.warn('API unreachable — using mock nearby:', err.message);
        return { success: true, complaints: mockComplaints.slice(0, 5), total: 5 };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Complaints — Write
// ─────────────────────────────────────────────────────────────────────────────

export async function upvoteComplaint(id) {
    try {
        const res = await api.post(`/complaints/${id}/upvote`);
        return res;
    } catch (err) {
        console.warn('API unreachable — using mock upvote:', err.message);
        return { success: true, upvotes: 24, newPriorityScore: 86 };
    }
}

export async function submitComplaint(data) {
    try {
        const res = await api.post('/complaints', {
            category: data.analysis?.category,
            subCategory: data.analysis?.subCategory,
            severity: data.analysis?.severity,
            confidence: data.analysis?.confidence,
            description: data.analysis?.description,
            department: data.analysis?.department,
            priorityScore: data.analysis?.priorityScore,
            userNote: data.userNote,
            userName: data.userName,
            userPhone: data.userPhone,
            s3Key: data.s3Key,
            s3Keys: data.s3Key ? [data.s3Key] : [],
            latitude: data.latitude,
            longitude: data.longitude,
            address: data.address,
        });
        return res;
    } catch (err) {
        console.error('API Error in submitComplaint:', err.message);
        throw err;
    }
}

export async function requestEmergency(data) {
    const res = await api.post('/complaints', {
        requestType: 'emergency',
        description: data.description,
        userName: data.userName,
        userPhone: data.userPhone,
        s3Key: data.s3Key,
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
    });
    return res;
}

export async function updateEmergencyLocation(id, location) {
    return api.patch(`/complaints/${id}/status`, {
        status: 'submitted',
        ...location,
    });
}

export async function updateComplaintStatus(id, status, notes) {
    try {
        const res = await api.patch(`/complaints/${id}/status`, { status, notes });
        return res;
    } catch (err) {
        console.warn('API unreachable — using mock status update:', err.message);
        return { success: true, message: `Complaint ${id} updated to ${status}` };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Image Upload & AI Analysis
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get a presigned S3 upload URL from the generate_upload_url Lambda.
 *
 * Lambda returns snake_case: { incident_id, upload_url, s3_key }
 *
 * @param {string} fileName — original file name
 * @param {string} fileType — MIME type (e.g. image/jpeg)
 * @returns {{ incident_id, upload_url, s3_key }}
 */
export async function getUploadUrl(fileName, fileType) {
    try {
        const res = await api.post('/upload/presign', { fileName, fileType });
        return res;
    } catch (err) {
        console.warn('API unreachable — no presigned URL available:', err.message);
        return null;
    }
}

/**
 * Full image analysis flow:
 *   1. Request presigned S3 URL
 *   2. Upload image directly to S3
 *   3. S3 ObjectCreated event triggers process_image Lambda automatically
 *   4. Poll for the processed result in DynamoDB
 *
 * Falls back to mock analysis if any step fails.
 */
export async function analyzeImage(imageFile) {
    let presign = null;
    try {
        // Step 1 — Get presigned upload URL from generate_upload_url Lambda
        presign = await getUploadUrl(imageFile.name, imageFile.type);
        const uploadUrl = presign?.upload_url || presign?.uploadUrl;
        const uploadKey = presign?.s3_key || presign?.s3Key || presign?.s3_keys?.[0] || presign?.s3Keys?.[0];
        if (!presign || !uploadUrl || !uploadKey) {
            throw new Error('Could not get upload URL');
        }

        // Step 2 — Upload image directly to S3 (no Lambda payload limit)
        await uploadToS3(uploadUrl, imageFile);

        // Step 3 — The S3 ObjectCreated event triggers process_image Lambda
        //          automatically. We poll for the result to appear in DynamoDB.
        const result = await pollForResult(presign.incident_id);

        if (result) {
            let cat = result.category;
            let sub = result.category;

            if (!cat || cat.toLowerCase() === 'unknown') {
                const dept = (result.department || '').toLowerCase();
                if (dept.includes('road')) {
                    cat = 'road_issue';
                    sub = 'pothole';
                } else if (dept.includes('sanitation')) {
                    cat = 'waste';
                    sub = 'garbage_accumulation';
                } else if (dept.includes('electrical')) {
                    cat = 'lighting';
                    sub = 'broken_streetlight';
                } else if (dept.includes('water')) {
                    cat = 'water';
                    sub = 'pipe_leakage';
                }
            }

            return {
                success: true,
                analysis: {
                    category: cat || 'road_issue',
                    subCategory: sub || 'pothole',
                    severity: result.severity || 'medium',
                    confidence: parseFloat(result.confidence) || 0.85,
                    description: result.description || '',
                    priorityScore: result.priorityScore || 70,
                    department: result.department || 'PWD',
                    estimatedResolutionTime: result.estimatedResolutionTime || '2-3 days',
                    suggestedActions: result.suggestedActions || [
                        'Inspect the reported area',
                        'Assign to nearest field worker',
                        'Schedule repair within SLA',
                    ],
                },
                s3Key: uploadKey,
                incidentId: presign.incident_id,
            };
        }

        // If polling timed out, still return success with the presign data
        // The Lambda may still be processing — complaint will appear later
        throw new Error('Processing timed out — result will appear shortly');
    } catch (err) {
        console.warn('Image analysis API failed — using mock analysis:', err.message);
        return {
            success: true,
            analysis: {
                category: 'road_issue',
                subCategory: 'pothole',
                severity: 'high',
                confidence: 0.92,
                description:
                    'Large pothole detected on main road causing traffic disruption. The pothole measures approximately 2x3 feet with a depth of 6 inches. Immediate repair recommended to prevent vehicle damage.',
                priorityScore: 78,
                department: 'PWD',
                estimatedResolutionTime: '2-3 days',
                suggestedActions: [
                    'Fill pothole with asphalt',
                    'Place warning cones around area',
                    'Divert traffic if needed',
                ],
            },
            s3Key: presign?.s3_key || presign?.s3Key || presign?.s3_keys?.[0] || presign?.s3Keys?.[0] || null,
            incidentId: presign?.incident_id || null,
        };
    }
}

/**
 * Poll for a complaint result after S3 upload triggers the Lambda.
 * Tries up to 10 times with 2-second intervals (max ~20 seconds).
 *
 * @param {string} incidentId — UUID of the complaint
 * @returns {object|null} — processed complaint or null if timeout
 */
async function pollForResult(incidentId) {
    const maxAttempts = 20;
    const delayMs = 3000;

    for (let i = 0; i < maxAttempts; i++) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        try {
            const res = await api.get(`/complaints/${incidentId}`);
            // Record exists and has been processed (has severity field)
            if (res && res.incident_id && res.severity) {
                return res;
            }
        } catch {
            // Not ready yet — keep polling
        }
    }
    return null;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Dashboard & Worker
// ─────────────────────────────────────────────────────────────────────────────

export async function getDashboardStats() {
    try {
        const res = await api.get('/dashboard/stats');
        return res;
    } catch (err) {
        console.warn('API unreachable — using mock dashboard stats:', err.message);
        return { success: true, stats: mockDashboardStats };
    }
}

export async function getWorkerAssignments() {
    try {
        const res = await api.get('/worker/assignments');
        return res;
    } catch (err) {
        console.warn('API unreachable — using mock worker assignments:', err.message);
        const assignments = mockComplaints.filter(
            (c) => c.status === 'assigned' || c.status === 'in_progress'
        );
        return { success: true, assignments };
    }
}
