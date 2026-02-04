import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Download, MoreHorizontal, Video as VideoIcon, Image as ImageIcon } from 'lucide-react';

export default memo(function MediaNode({ data, id }) {
    const isVideo = data.type === 'video';

    return (
        <div className="bg-black border border-white/20 rounded-2xl shadow-2xl w-80 overflow-hidden group">
            {/* Input Handle */}
            <Handle type="target" position={Position.Left} className="w-3 h-3 bg-purple-500" />

            {/* Media Content */}
            <div className="relative aspect-video bg-gray-900 flex items-center justify-center">
                {data.url ? (
                    isVideo ? (
                        <video
                            src={data.url}
                            controls
                            className="w-full h-full object-contain"
                        />
                    ) : (
                        <img
                            src={data.url}
                            alt={data.prompt}
                            className="w-full h-full object-cover"
                        />
                    )
                ) : (
                    <div className="text-muted text-xs">No Data</div>
                )}

                {/* Toolbar Overlay */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <a
                        href={data.url}
                        download
                        className="p-1.5 rounded-full bg-black/60 backdrop-blur text-white hover:bg-white hover:text-black transition-colors"
                    >
                        <Download size={14} />
                    </a>
                    <button className="p-1.5 rounded-full bg-black/60 backdrop-blur text-white hover:bg-white hover:text-black transition-colors">
                        <MoreHorizontal size={14} />
                    </button>
                </div>

                {/* Type Badge */}
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur border border-white/10 text-[10px] font-bold text-white uppercase flex items-center gap-1">
                    {isVideo ? <VideoIcon size={10} /> : <ImageIcon size={10} />}
                    {data.type}
                </div>
            </div>

            {/* Prompt/Info */}
            <div className="p-3 bg-surface border-t border-white/10">
                <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                    {data.prompt || "No prompt data"}
                </p>
            </div>

            {/* Output Handle (For Img2Img) */}
            <Handle type="source" position={Position.Right} className="w-3 h-3 bg-blue-500" />
        </div>
    );
});
