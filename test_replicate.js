import Replicate from 'replicate';
import dotenv from 'dotenv';
dotenv.config();

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

async function run() {
    try {
        console.log("Running...");
        const output = await replicate.run(
            "black-forest-labs/flux-schnell",
            {
                input: {
                    prompt: "test standalone",
                    go_fast: true,
                    megapixels: "1"
                }
            }
        );
        console.log("Result (Raw):", output);
        if (Array.isArray(output) && output[0]) {
            console.log("Item Type:", typeof output[0]);
            console.log("Item Constructor:", output[0].constructor.name);
            console.log("Item content:", output[0]);
            if (output[0].url) console.log("Item URL property:", output[0].url);
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

run();
