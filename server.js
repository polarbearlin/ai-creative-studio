import express from 'express';
import cors from 'cors';
import Replicate from 'replicate';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import multer from 'multer';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join, extname, basename } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const PORT = 3002;

// Rate Limiting: 100 requests per 15 minutes
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests, please try again later.' }
});
app.use(limiter);

// Initializations
const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const fileManager = new GoogleAIFileManager(process.env.GOOGLE_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const geminiProModel = genAI.getGenerativeModel({ model: "models/gemini-3-pro-preview" }); // For Video Analysis (Gemini 3)

// Multer Setup
const upload = multer({ dest: 'uploads/' });
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}
if (!fs.existsSync('frames')) {
    fs.mkdirSync('frames');
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static('uploads'));
app.use('/frames', express.static('frames'));

app.post('/api/generate', async (req, res) => {
    try {
        let { prompt, aspectRatio = "3:2", model = "black-forest-labs/flux-schnell", image, numOutputs = 1, resolution = '1K' } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        console.log(`[Replicate] Generating with ${model}: ${prompt.substring(0, 50)}...`);
        if (image) console.log(`[Replicate] Image input provided (${image.substring(0, 20)}...)`);

        // ROUTING: Google Imagen Models (including Nano Banana Pro and Gemini Image)
        if (model.includes('imagen') || model.includes('banana') || model.includes('gemini-3-pro-image')) {
            return generateWithGoogleImagen(res, prompt, aspectRatio, model, numOutputs, resolution, image);
        }

        // Flux-schnell on Replicate often doesn't accept image inputs.
        // Switch to Flux Dev (or another Img2Img capable model) automatically.
        if (image && model.includes('flux-schnell')) {
            console.log('[Replicate] Switching to Flux Dev for Img2Img support.');
            model = "black-forest-labs/flux-dev";
        }

        // Construct input object
        const input = {
            prompt: prompt,
            aspect_ratio: aspectRatio,
            num_outputs: 1,
            output_format: "webp",
            output_quality: 90,
        };

        // Add image if provided (Img2Img)
        if (image) {
            input.image = image; // Replicate accepts Base64 or URL
            // Adjust strength/denoising_strength if supported by specific model, 
            // but for now we rely on default Img2Img behavior.
        }

        // Using dynamically selected model
        const output = await replicate.run(
            model,
            { input }
        );

        console.log('[DEBUG] Replicate Output:', JSON.stringify(output, null, 2));
        try {
            const fs = await import('fs');
            fs.writeFileSync('/tmp/debug_replicate.json', JSON.stringify(output, null, 2));
        } catch (e) {
            console.error('Failed to write debug file', e);
        }

        // Flux-schnell returns a FileOutput object (Stream) in newer SDKs
        let imageUrl = '';

        const getUrlFromItem = (item) => {
            if (item && typeof item.url === 'function') return item.url().href;
            if (item && item.url) return item.url;
            return String(item);
        };

        if (Array.isArray(output)) {
            imageUrl = getUrlFromItem(output[0]);
        } else {
            imageUrl = getUrlFromItem(output);
        }

        console.log('[Replicate] Final URL:', imageUrl);
        res.json({ success: true, url: imageUrl });

    } catch (error) {
        console.error('[Replicate] Error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate image' });
    }
});

/**
 * Magic Prompt Enhancer using Llama 3
 */
app.post('/api/enhance-prompt', async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

        console.log(`[Replicate] Enhancing prompt: ${prompt.substring(0, 50)}...`);

        const output = await replicate.run(
            "meta/meta-llama-3-8b-instruct",
            {
                input: {
                    prompt: `You are an expert AI art curator. Rewrite the user's simple prompt into a detailed, high-quality image generation prompt for Flux. Focus on lighting, texture, and composition. Keep it under 75 words. Output ONLY the new prompt, no "Here is..." or quotes.\n\nUser Prompt: ${prompt}`,
                    max_tokens: 150,
                    temperature: 0.7,
                    top_p: 0.9
                }
            }
        );

        // Llama 3 on Replicate usually returns an array of tokens/strings
        const enhancedPrompt = Array.isArray(output) ? output.join('') : String(output);

        console.log(`[Replicate] Enhanced: ${enhancedPrompt.substring(0, 50)}...`);
        res.json({ success: true, prompt: enhancedPrompt.trim() });
    } catch (error) {
        console.error('[Replicate] Enhancement Error:', error);
        res.status(500).json({ error: error.message || 'Failed to enhance prompt' });
    }
});

/**
 * Upscale Image using Real-ESRGAN
 */
app.post('/api/upscale', async (req, res) => {
    try {
        const { image } = req.body;
        if (!image) return res.status(400).json({ error: 'Image is required' });

        console.log(`[Replicate] Upscaling image...`);

        const output = await replicate.run(
            "nightmareai/real-esrgan:b3ef194191d13140337468c916c2c5b96dd0cb06dffc032a022a31807f6a5ea8",
            {
                input: {
                    image: image,
                    scale: 4,
                    face_enhance: true
                }
            }
        );

        // Real-ESRGAN usually returns a simple URL string or FileOutput
        let imageUrl = '';
        if (typeof output === 'object' && output.url) {
            imageUrl = output.url().href; // Handle FileOutput
        } else {
            imageUrl = String(output);
        }

        console.log('[Replicate] Upscaled URL:', imageUrl);
        res.json({ success: true, url: imageUrl });
    } catch (error) {
        console.error('[Replicate] Upscale Error Details:', error);
        // Log to a file we can easily read if needed
        const fs = require('fs');
        fs.appendFileSync('upscale_error.log', `${new Date().toISOString()} - ${error.message}\n`);

        res.status(500).json({ error: error.message || 'Failed to upscale image' });
    }
});

/**
 * Inspection Endpoint to Verify Model Capabilities
 */
app.get('/api/inspect-model', async (req, res) => {
    try {
        console.log("Fetching model details for nightmareai/real-esrgan...");
        const model = await replicate.models.get("nightmareai", "real-esrgan");
        const latestVersion = model.latest_version;

        console.log("Model Details:", {
            name: model.name,
            description: model.description,
            latestVersionId: latestVersion.id,
            schema: latestVersion.openapi_schema // This often contains input defs
        });

        res.json({
            success: true,
            name: model.name,
            description: model.description,
            latestVersionId: latestVersion.id,
            schema: latestVersion.openapi_schema
        });

    } catch (error) {
        console.error("Inspection Error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'Creative Studio API' });
});


/**
 * Magic Prompt Enhancer using Google Gemini
 */
app.post('/api/enhance-prompt', async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

        console.log(`[Gemini] Enhancing prompt: ${prompt.substring(0, 50)}...`);

        const enhancementPrompt = `Rewrite the following image generation prompt to be more descriptive, detailed, and artistic, high quality, optimized for Flux Dev. Keep it under 60 words. Directly return the new prompt text only. Prompt: "${prompt}"`;

        const result = await geminiModel.generateContent(enhancementPrompt);
        const response = await result.response;
        const text = response.text();

        console.log(`[Gemini] Enhanced: ${text.substring(0, 50)}...`);
        res.json({ success: true, prompt: text.trim() });

    } catch (error) {
        console.error('[Gemini] Enhance Error:', error);
        res.status(500).json({ error: 'Failed to enhance prompt', details: error.message });
    }
});


// Helper Function for Google Imagen
async function generateWithGoogleImagen(res, prompt, aspectRatio, modelName, numOutputs = 1, resolution = '1K', imageInput = null) {
    console.log(`[Google] Generating ${numOutputs} image(s) with ${modelName} at ${resolution}...`);
    if (imageInput) console.log(`[Google] Image input detected for editing/variation.`);

    try {
        const apiKey = process.env.GOOGLE_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1beta/${modelName}:predict?key=${apiKey}`;

        // Map Aspect Ratios to Imagen supported formats.
        const ratioMap = {
            "3:2": "4:3",
            "4:5": "3:4",
            "1:1": "1:1",
            "16:9": "16:9",
            "9:16": "9:16"
        };
        const safeRatio = ratioMap[aspectRatio] || "1:1";

        const instanceData = { prompt: prompt };

        // Handle Image Input (Base64)
        if (imageInput) {
            // Remove data URL prefix (e.g., "data:image/png;base64,")
            const base64Data = imageInput.replace(/^data:image\/\w+;base64,/, "");
            instanceData.image = { bytesBase64Encoded: base64Data };
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                instances: [instanceData],
                parameters: {
                    sampleCount: numOutputs,
                    aspectRatio: safeRatio
                    // Note: 'resolution' parameter isn't directly supported by this API version in this way (it's implicit in model/aspectRatio),
                    // but we log it. For true 4K, we would chain the upscaler.
                    // For now, we rely on the model's native high quality.
                }
            })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message || JSON.stringify(data.error));
        }

        if (!data.predictions || data.predictions.length === 0) {
            throw new Error("No image data returned from Google API");
        }

        // Handle multiple images
        let urls = data.predictions.map(pred => {
            const base64 = pred.bytesBase64Encoded;
            return `data:image/png;base64,${base64}`;
        });

        // 4K Upscaling Chain - DISABLED (Replicate Usage Stopped)
        if (resolution === '4K') {
            console.warn(`[Google] 4K requested but Replicate API is disabled. Returning native resolution.`);
        }

        res.json({ success: true, url: urls[0], urls: urls });

    } catch (error) {
        console.error('[Google] Generation Error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate with Google Imagen' });
    }
}

/**
 * Video Analysis Endpoint
 * Uploads video to Google -> Analyzes with Gemini 1.5 Pro -> Returns JSON scenes
 */
app.post('/api/analyze-video', upload.single('video'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No video file uploaded' });
        }

        console.log(`[Video] Analyzing ${req.file.originalname} (${req.file.size} bytes)...`);

        // 1. Upload to Google AI
        const uploadResult = await fileManager.uploadFile(req.file.path, {
            mimeType: req.file.mimetype,
            displayName: req.file.originalname,
        });

        console.log(`[Video] Uploaded to Google: ${uploadResult.file.uri}`);

        // 2. Wait for processing
        let file = await fileManager.getFile(uploadResult.file.name);
        while (file.state === "PROCESSING") {
            console.log("[Video] Processing...");
            await new Promise((resolve) => setTimeout(resolve, 2000));
            file = await fileManager.getFile(uploadResult.file.name);
        }

        if (file.state === "FAILED") {
            throw new Error("Video processing failed by Google");
        }

        console.log(`[Video] Processing complete. Asking Gemini Pro...`);

        // 3. Analyze with Gemini 1.5 Pro
        const prompt = `Analyze this video for a professional video editor. 
        Break it down into distinct scenes or shots. 
        For EACH scene, provide:
        1. "time": Start timestamp (e.g., "00:05").
        2. "description": A visual description.
        3. "img_prompt": A highly detailed Stable Diffusion/Flux prompt to recreate a single keyframe from this scene in 4K realism.
        4. "video_prompt": A prompt to regenerate this video clip using Sora/Veo.

        Return ONLY raw valid JSON array of objects. No markdown. Keys: time, description, img_prompt, video_prompt.`;

        const result = await geminiProModel.generateContent([
            {
                fileData: {
                    mimeType: file.mimeType,
                    fileUri: file.uri
                }
            },
            { text: prompt }
        ]);

        const text = result.response.text();
        const jsonString = text.replace(/```json|```/g, '').trim();
        const scenes = JSON.parse(jsonString);

        console.log(`[Video] Analysis complete: ${scenes.length} scenes found.`);

        // Clean up local temp file - DISABLED for Frame Extraction
        // fs.unlinkSync(req.file.path);

        // Return relative path for frontend to access (Note: this needs static serving setup)
        const videoFilename = req.file.filename;

        res.json({ success: true, scenes: scenes, videoFilename: videoFilename });

    } catch (error) {
        console.error('[Video] Analysis Error:', error);
        // Clean up local file on error ONLY
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ error: error.message || 'Failed to analyze video' });
    }
});

/**
 * Extract Frame from Video using ffmpeg
 */
app.post('/api/extract-frame', async (req, res) => {
    try {
        const { videoFilename, timestamp } = req.body;
        if (!videoFilename || !timestamp) {
            return res.status(400).json({ error: 'Missing videoFilename or timestamp' });
        }

        const videoPath = join(__dirname, 'uploads', videoFilename);
        if (!fs.existsSync(videoPath)) {
            return res.status(404).json({ error: 'Video file not found on server' });
        }

        // Convert timestamp (MM:SS) to seconds or keep as HH:MM:SS for ffmpeg
        // FFmpeg accepts "00:05" directly.

        const frameFilename = `${videoFilename}_${timestamp.replace(/:/g, '-')}.jpg`;
        const framePath = join(__dirname, 'frames', frameFilename);

        // Check if frame already exists
        if (fs.existsSync(framePath)) {
            return res.json({ success: true, url: `/frames/${frameFilename}` });
        }

        console.log(`[FFmpeg] Extracting frame at ${timestamp} from ${videoFilename}...`);

        // Command: ffmpeg -ss 00:05 -i video.mp4 -frames:v 1 -q:v 2 output.jpg -y
        const cmd = `ffmpeg -ss ${timestamp} -i "${videoPath}" -frames:v 1 -q:v 2 "${framePath}" -y`;

        await execAsync(cmd);

        console.log(`[FFmpeg] Frame saved to ${framePath}`);
        res.json({ success: true, url: `/frames/${frameFilename}` });

    } catch (error) {
        console.error('[FFmpeg] Error:', error);
        res.status(500).json({ error: 'Failed to extract frame' });
    }
});

/**
 * Generate Video with Google Veo (REST API)
 */
app.post('/api/generate-video', async (req, res) => {
    const { prompt, model: requestedModel } = req.body;
    // Use requested model or default to Veo 2.0
    const model = requestedModel || "models/veo-2.0-generate-001";
    // Using process.env
    const apiKey = process.env.GOOGLE_API_KEY;

    console.log(`[Veo] Starting generation with model: ${model}`);
    console.log(`[Veo] Prompt: ${prompt.substring(0, 50)}...`);

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/${model}:predictLongRunning?key=${apiKey}`;

        // Vertex AI / predictLongRunning format
        const body = {
            instances: [{ prompt: prompt }],
            parameters: {}
        };

        const initialRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const initialData = await initialRes.json();

        if (!initialRes.ok || initialData.error) {
            console.error("[Veo] Initial Request Error:", JSON.stringify(initialData, null, 2));
            throw new Error(initialData.error?.message || "Failed to start video generation");
        }

        // 2. Poll for Operation
        let operationName = initialData.name; // e.g., "operations/..."
        console.log(`[Veo] Operation started: ${operationName}`);

        let videoUri = null;
        let attempts = 0;
        const maxAttempts = 60; // 2 minutes approx

        while (!videoUri && attempts < maxAttempts) {
            await new Promise(r => setTimeout(r, 3000)); // Wait 3s
            attempts++;

            const opUrl = `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${apiKey}`;
            const opRes = await fetch(opUrl);
            const opData = await opRes.json();

            if (opData.error) throw new Error(opData.error.message);

            if (opData.done) {
                console.log(`[Veo] Operation Done. Full Response:`, JSON.stringify(opData, null, 2));

                // Check for Safety Filters (RAI)
                const videoResponse = opData.response?.generateVideoResponse;
                if (videoResponse?.raiMediaFilteredReasons?.length > 0) {
                    const reason = videoResponse.raiMediaFilteredReasons[0];
                    console.warn(`[Veo] Generation blocked by safety filter: ${reason}`);
                    throw new Error(`Google Safety Filter blocked this request: ${reason}`);
                }

                // Check where the result is hiding
                if (opData.response) {
                    // Try different paths
                    // 1. result.videoUri
                    // 2. result.uri
                    // 3. result (if it's a string)
                    // 4. metadata.outputUri (sometimes)
                    const resObj = opData.response;
                    if (resObj.result) {
                        videoUri = resObj.result.videoUri || resObj.result.uri || resObj.result;
                    }
                    // Veo REST API Structure (Confirmed)
                    if (resObj.generateVideoResponse?.generatedSamples?.[0]?.video?.uri) {
                        videoUri = resObj.generateVideoResponse.generatedSamples[0].video.uri;
                    }

                    // Sometimes it's directly in response?
                    if (!videoUri && resObj.videoUri) videoUri = resObj.videoUri;

                    if (videoUri && typeof videoUri === 'object') {
                        // If it's an object, maybe videoUri.uri?
                        videoUri = videoUri.uri || JSON.stringify(videoUri);
                    }
                }

                if (!videoUri) {
                    const debugInfo = JSON.stringify(opData, null, 2);
                    console.error("[Veo] Could not find videoUri. Full Data:", debugInfo);
                    throw new Error(`Video URI not found. Debug Data: ${debugInfo.substring(0, 500)}...`); // Return snippet to frontend
                } else {
                    console.log(`[Veo] Found Video URI: ${videoUri}`);
                }
            } else {
                if (attempts % 5 === 0) console.log(`[Veo] Still processing... (${attempts * 3}s)`);
            }
        }

        if (!videoUri) throw new Error("Timeout waiting for video generation");

        // IMPORTANT: The video URI from Generative Language API is private/authenticated.
        // We must append the API key for the frontend to be able to play/download it.
        if (videoUri.includes('generativelanguage.googleapis.com') && !videoUri.includes('key=')) {
            const separator = videoUri.includes('?') ? '&' : '?';
            videoUri = `${videoUri}${separator}key=${apiKey}`;
        }

        res.json({ success: true, videoUrl: videoUri });

    } catch (error) {
        console.error('[Veo] Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Serve Static Frontend (Vite Build)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.static(join(__dirname, 'dist')));

// SPA Catch-all: Send index.html for any unknown route
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
        return next();
    }
    res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
