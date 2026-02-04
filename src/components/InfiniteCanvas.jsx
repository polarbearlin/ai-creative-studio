import React, { useMemo, useEffect } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import useCanvasStore from '../store/canvasStore';
import GeneratorNode from './nodes/GeneratorNode';
import MediaNode from './nodes/MediaNode';
import { Plus } from 'lucide-react';

const nodeTypes = {
    generatorNode: GeneratorNode,
    mediaNode: MediaNode,
};

function InfiniteCanvasContent() {
    const {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        addNode
    } = useCanvasStore();

    // Initialize with one generator node if empty
    useEffect(() => {
        if (nodes.length === 0) {
            addNode({
                id: 'start-node',
                type: 'generatorNode',
                position: { x: 100, y: 100 },
                data: { prompt: '' },
            });
        }
    }, [nodes.length, addNode]);

    const handleAddGenerator = () => {
        const id = `gen-${Date.now()}`;
        addNode({
            id,
            type: 'generatorNode',
            position: { x: Math.random() * 400, y: Math.random() * 400 },
            data: { prompt: '' },
        });
    };

    return (
        <div className="w-full h-full bg-[#0a0a0a]">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                defaultEdgeOptions={{
                    type: 'smoothstep',
                    animated: true,
                    style: { stroke: '#6366f1', strokeWidth: 2 },
                }}
                connectionLineStyle={{ stroke: '#6366f1', strokeWidth: 2 }}
                snapToGrid={true}
                snapGrid={[20, 20]}
            >
                <Background gap={20} color="#555" variant="dots" size={1} />
                <Controls className="bg-surface/90 border border-white/10 text-white fill-white" />
                <MiniMap
                    nodeColor={(n) => {
                        if (n.type === 'generatorNode') return '#3b82f6';
                        if (n.type === 'mediaNode') return '#a855f7';
                        return '#fff';
                    }}
                    className="bg-surface/90 border border-white/10 rounded-lg overflow-hidden"
                    maskColor="rgba(0,0,0, 0.6)"
                />

                {/* Floating Dock */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex gap-4 p-2 rounded-2xl bg-black/50 backdrop-blur-xl border border-white/10 shadow-2xl">
                    <button
                        onClick={handleAddGenerator}
                        className="p-3 rounded-xl bg-primary text-black hover:bg-primaryHover transition-colors flex items-center gap-2 font-bold"
                    >
                        <Plus size={20} />
                        <span>Add Generator</span>
                    </button>
                </div>

            </ReactFlow>
        </div>
    );
}

export default function InfiniteCanvas() {
    return (
        <ReactFlowProvider>
            <InfiniteCanvasContent />
        </ReactFlowProvider>
    );
}
