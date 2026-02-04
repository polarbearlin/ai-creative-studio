import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyDkOgyk1i_oDIYLz1GCtlRwtxRczh-NmTk");

async function listModels() {
    try {
        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyDkOgyk1i_oDIYLz1GCtlRwtxRczh-NmTk"
        );
        const data = await response.json();

        if (data.models) {
            console.log("=== Available Models ===");
            data.models.forEach(model => {
                console.log(`- ${model.name} (${model.supportedGenerationMethods.join(', ')})`);
            });
        } else {
            console.log("No models found or error:", data);
        }
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
