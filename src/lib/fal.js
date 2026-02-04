import { config } from '@fal-ai/client';

config({
    proxyUrl: '/api/fal/proxy', // We'll need to set up a proxy in Vite for dev or a real backend later.
    // For client-side only (not recommended for production but okay for local private tool):
    // We can use the credentials directly if we set them, but let's try to do it via a proxy to avoid exposing keys if deployed.
    // HOWEVER, for this "Serverless" local tool, we might just want to use the key directly for simplicity if the user runs it locally.
    // Let's stick to the proxy pattern for best practices, but providing a "direct" fallback for local dev.
});

export const FAL_KEY_NAME = 'VITE_FAL_KEY';

export const getFalKey = () => {
    return import.meta.env[FAL_KEY_NAME];
}
