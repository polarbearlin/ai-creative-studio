import { create } from 'zustand';
import {
    applyNodeChanges,
    applyEdgeChanges,
    addEdge,
} from '@xyflow/react';

// Initial state
const useCanvasStore = create((set, get) => ({
    nodes: [],
    edges: [],

    // --- React Flow Actions ---
    onNodesChange: (changes) => {
        set({
            nodes: applyNodeChanges(changes, get().nodes),
        });
    },
    onEdgesChange: (changes) => {
        set({
            edges: applyEdgeChanges(changes, get().edges),
        });
    },
    onConnect: (connection) => {
        set({
            edges: addEdge(connection, get().edges),
        });
    },

    // --- Custom Actions ---
    addNode: (node) => {
        set((state) => ({
            nodes: [...state.nodes, node],
        }));
    },

    updateNodeData: (id, data) => {
        set((state) => ({
            nodes: state.nodes.map((node) => {
                if (node.id === id) {
                    return { ...node, data: { ...node.data, ...data } };
                }
                return node;
            }),
        }));
    },

    // Helper to get connected source node data
    getSourceData: (targetNodeId, handleId) => {
        const state = get();
        const edge = state.edges.find(e => e.target === targetNodeId && e.targetHandle === handleId);
        if (!edge) return null;
        const sourceNode = state.nodes.find(n => n.id === edge.source);
        return sourceNode ? sourceNode.data : null;
    }
}));

export default useCanvasStore;
