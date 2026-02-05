import dotenv from 'dotenv';
dotenv.config();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = "models/imagen-4.0-fast-generate-001";
const URL = `https://generativelanguage.googleapis.com/v1beta/${MODEL}:predict?key=${GOOGLE_API_KEY}`;

async function test() {
    console.log("Testing Model:", MODEL);
    console.log("URL:", URL.replace(GOOGLE_API_KEY, "HIDDEN_KEY"));

    const payload = {
        instances: [{ prompt: "A cute cat" }],
        parameters: { sampleCount: 1, aspectRatio: "1:1" }
    };

    try {
        const res = await fetch(URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        console.log("Status:", res.status, res.statusText);
        const text = await res.text();
        console.log("Raw Response:", text.substring(0, 500) + "...");

        const data = JSON.parse(text);
        if (data.predictions) console.log("SUCCESS: Got predictions");
        if (data.error) console.log("API ERROR:", data.error);

    } catch (e) {
        console.error("CRASH:", e);
    }
}

test();
