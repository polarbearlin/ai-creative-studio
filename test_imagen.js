import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyDkOgyk1i_oDIYLz1GCtlRwtxRczh-NmTk");

async function testImagen() {
    try {
        console.log("Testing Imagen 4 (imagen-4.0-generate-001)...");
        // Standard Gemini models use getGenerativeModel
        // For Imagen, sometimes it's different. Let's try the standard way first.
        const model = genAI.getGenerativeModel({ model: "models/imagen-4.0-generate-001" });

        // Imagen usually takes a prompt directly.
        // Note: The SDK might not fully support Imagen 4 on the free tier or standard key yet, 
        // but the model list says it's there.
        // We'll try generateContent (which might fail if it expects 'predict')
        // If this fails, we will try the REST API approach for predict.

        const result = await model.generateContent("A futuristic city at sunset, cinematic lighting, 8k");
        console.log("Response:", result.response);
    } catch (error) {
        console.error("SDK Error:", error.message);
        if (error.message.includes("404") || error.message.includes("not supported")) {
            console.log("SDK method might be wrong. Trying REST API...");
            await testRestApi();
        }
    }
}

async function testRestApi() {
    // Fallback to raw fetch for 'predict' method
    const apiKey = "AIzaSyDkOgyk1i_oDIYLz1GCtlRwtxRczh-NmTk";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`;

    const body = {
        instances: [{ prompt: "A futuristic city at sunset" }],
        parameters: { sampleCount: 1, aspectRatio: "1:1" }
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await response.json();
        console.log("REST API Response:", JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("REST API Error:", err);
    }
}

testImagen();
