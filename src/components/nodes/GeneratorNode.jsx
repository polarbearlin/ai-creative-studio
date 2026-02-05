import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Sparkles, Image as ImageIcon, Video, Zap } from 'lucide-react';
import clsx from 'clsx';
import useCanvasStore from '../../store/canvasStore';
import axios from 'axios';

// Models Definition (Reuse from App.jsx or create shared constant)
const MODELS = [
    { id: 'models/imagen-4.0-fast-generate-001', name: 'Imagen 4 Fast', type: 'image' },
    { id: 'models/imagen-4.0-generate-001', name: 'Imagen 4', type: 'image' },
    { id: 'models/imagen-4.0-ultra-generate-001', name: 'Imagen 4 Ultra', type: 'image' },
    { id: 'models/nano-banana-pro-preview', name: '🍌 Nano Banana', type: 'image' },
    { id: 'models/veo-2.0-generate-001', name: 'Veo 2.0', type: 'video' },
    { id: 'models/veo-3.0-generate-001', name: 'Veo 3.0', type: 'video' },
    { id: 'models/veo-3.1-generate-preview', name: 'Veo 3.1 ⭐', type: 'video' },
];

export default function GeneratorNode({ id, data }) {
    const [prompt, setPrompt] = useState(data.prompt || '');
    const [model, setModel] = useState(data.model || MODELS[0].id);
    const [loading, setLoading] = useState(false);
    const updateNodeData = useCanvasStore((state) => state.updateNodeData);
    const addNode = useCanvasStore((state) => state.addNode);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const isVideo = model.includes('veo');
            const endpoint = isVideo ? '/api/generate-video' : '/api/generate';

            const payload = {
                prompt,
                model,
                // TODO: Get input image from connected node if exists
            };


            // Smart API URL
            const API_BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:3002';
            const res = await axios.post(`${API_BASE_URL}${endpoint}`, payload);

            const resultUrl = isVideo ? res.data.videoUrl : (res.data.urls ? res.data.urls[0] : res.data.url);

            if (resultUrl) {
                // Spawn a result node to the right
                const newNodeId = `media-${Date.now()}`;
                const newNode = {
                    id: newNodeId,
                    type: 'mediaNode',
                    position: { x: 400, y: 0 }, // Offset relative to this node (need real math, this is placeholder)
                    data: {
                        url: resultUrl,
                        type: isVideo ? 'video' : 'image',
                        prompt: prompt
                    },
                };

                // Better position calculation: current pos + width + gap
                // For now, simpler is fine, user can drag.
                // Actually, let's try to add it relatively if we can, 
                // but we don't know our own position easily inside component unless passed.
                // We'll just add it to the store, maybe slightly offset.
                addNode(newNode);

                // TODO: Auto-connect edge
            }

        } catch (err) {
            console.error(err);
            alert("Generation failed: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-surface/90 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl w-80 overflow-hidden">
            {/* Input Handles */}
            <Handle type="target" position={Position.Left} className="w-3 h-3 bg-blue-500" />

            {/* Header */}
            <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-500" />
            <div className="p-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                        <Sparkles size={16} className="text-blue-400" />
                        <span>Generator</span>
                    </div>
                    <select
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        className="nodrag text-xs bg-black/20 border border-white/10 rounded px-2 py-1 text-muted focus:outline-none focus:border-blue-500"
                    >
                        {MODELS.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>
                </div>

                <textarea
                    value={prompt}
                    onChange={(e) => {
                        setPrompt(e.target.value);
                        updateNodeData(id, { prompt: e.target.value });
                    }}
                    placeholder="Describe what you want to create..."
                    className="nodrag w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-foreground placeholder:text-muted/50 resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 min-h-[80px]"
                />

                <button
                    onClick={handleGenerate}
                    disabled={loading || !prompt}
                    className={clsx(
                        "w-full py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold transition-all",
                        loading ? "bg-white/10 text-muted cursor-wait" : "bg-primary text-black hover:bg-primaryHover shadow-lg hover:shadow-primary/20"
                    )}
                >
                    {loading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                            <span>Generating...</span>
                        </>
                    ) : (
                        <>
                            <span>Generate</span>
                            <Zap size={14} fill="currentColor" />
                        </>
                    )}
                </button>
            </div>

            {/* Output Handle */}
            <Handle type="source" position={Position.Right} className="w-3 h-3 bg-purple-500" />
        </div>
    );
}
