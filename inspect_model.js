import Replicate from "replicate";

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

async function inspect() {
    try {
        console.log("Fetching model details for nightmareai/real-esrgan...");
        // We can fetch the model version to see its schema
        const model = await replicate.models.get("nightmareai", "real-esrgan");
        console.log("Model Name:", model.name);
        console.log("Description:", model.description);

        const latestVersion = model.latest_version;
        console.log("Latest Version ID:", latestVersion.id);

        // Note: Replicate Node SDK might not expose the full OpenAPI schema directly in this call, 
        // but usually we can infer inputs from documentation or try a dry run.
        // However, let's print what we get.
        console.log("Latest Version Details:", JSON.stringify(latestVersion, null, 2));

    } catch (error) {
        console.error("Error fetching model:", error);
    }
}

inspect();
