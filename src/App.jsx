import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Palette,
  Video,
  Image as ImageIcon,
  Settings,
  Zap,
  History as HistoryIcon,
  LayoutGrid,
  Download,
  Share2,
  Maximize2,
  Wand2,
  Sparkles,
  Upload,
  X,
  FileVideo,
  Film,
  Copy,
  Check,
  Loader2,
  ArrowRight,
  Workflow
} from 'lucide-react';
import clsx from 'clsx';
import axios from 'axios';
import InfiniteCanvas from './components/InfiniteCanvas';

// Smart API URL: Relative for Prod (Same Origin), Localhost:3002 for Dev
const API_BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:3002';

function App() {
  /* State */
  const [activeTab, setActiveTab] = useState('canvas');
  // Default to Google Imagen 4 Fast
  const [activeModel, setActiveModel] = useState('models/imagen-4.0-fast-generate-001');

  /* Constants */
  const MODELS = [
    { id: 'models/imagen-4.0-fast-generate-001', name: 'Google Imagen 4 Fast', desc: 'High speed, standard quality', badge: 'FAST' },
    { id: 'models/imagen-4.0-ultra-generate-001', name: 'Google Imagen 4 Ultra', desc: 'Photorealistic, highest fidelity', badge: 'PRO' },
  ];

  const VEO_MODELS = [
    { id: 'models/veo-2.0-generate-001', name: 'Veo 2.0 (Stable)', desc: 'Standard generation', badge: 'STABLE' },
    { id: 'models/veo-3.0-generate-001', name: 'Veo 3.0', desc: 'Next-gen motion realism', badge: 'NEW' },
    { id: 'models/veo-3.0-fast-generate-001', name: 'Veo 3.0 Fast', desc: 'Faster generation speed', badge: 'TURBO' },
  ];

  /* Generation State */
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null); // Result video
  const [activeMode, setActiveMode] = useState('image'); // 'image' | 'video'

  // Custom setter to switch default model when mode changes
  const switchMode = (mode) => {
    setActiveMode(mode);
    if (mode === 'video') {
      setActiveModel(VEO_MODELS[0].id);
    } else {
      setActiveModel(MODELS[0].id);
    }
  };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);
  const [seed, setSeed] = useState(Math.floor(Math.random() * 1000000));
  const [aspectRatio, setAspectRatio] = useState("3:2");
  const [uploadedImage, setUploadedImage] = useState(null); // Base64 or Blob URL
  const [batchSize, setBatchSize] = useState(1);
  const [resolution, setResolution] = useState("1K");

  /* History State (The "Filmstrip") */
  const [history, setHistory] = useState([]);

  const generateImage = async () => {
    if (!prompt) return;

    setLoading(true);
    setError(null);
    setLogs([]);
    setImage(null);
    setVideoUrl(null);

    // Friendly logs
    if (activeMode === 'video') {
      setLogs([`Connecting to Google Veo 2.0...`, `Initializing Video Generation...`]);
    } else {
      const modelName = MODELS.find(m => m.id === activeModel)?.name || "AI Model";
      setLogs([`Connecting to Google Cloud...`, `Initializing ${modelName}...`]);
    }

    try {
      if (activeMode === 'video') {
        // Call Veo Video API
        const response = await axios.post(`${API_BASE_URL}/api/generate-video`, {
          prompt: prompt,
          image: uploadedImage,
          model: activeModel
        });

        if (response.data.success && response.data.videoUrl) {
          setVideoUrl(response.data.videoUrl);
          setLogs(prev => [...prev, "Video Generation Complete!", "Rendering stream..."]);
          // Add to history
          const uniqueId = Date.now().toString();
          setHistory(prev => [{
            id: uniqueId,
            url: response.data.videoUrl, // Save video URL
            type: 'video', // New type
            prompt: prompt,
            model: 'veo-2.0',
            timestamp: new Date()
          }, ...prev]);
        } else {
          throw new Error("Failed to correct video URL");
        }
      } else {
        // Standard Image Generation (Google Imagen)
        if (activeModel.includes('imagen')) {
          setLogs(prev => [...prev, `Configuration: ${batchSize}x images at ${resolution}`]);
        }
        // Call Image API (Replicate / Google)
        const response = await axios.post(`${API_BASE_URL}/api/generate`, {
          prompt: prompt,
          model: activeModel,
          aspectRatio: aspectRatio,
          image: uploadedImage, // Send Base64 if exists
          numOutputs: batchSize,
          resolution: resolution
        });

        if (response.data.success) {
          // Handle Batch Response (Array of URLs) or Single URL
          const newUrls = (response.data.urls && response.data.urls.length > 0) ? response.data.urls : [response.data.url];

          // Update Main View with the FIRST image
          setImage(newUrls[0]);
          setLogs(prev => [...prev, "Download complete.", `Rendering ${newUrls.length} image(s).`]);

          // Add to History
          newUrls.forEach((url, idx) => {
            const uniqueId = Date.now().toString() + idx;
            setHistory(prev => [{
              id: uniqueId,
              url: url,
              type: 'image',
              prompt: prompt,
              model: activeModel,
              seed: seed,
              timestamp: new Date()
            }, ...prev]);
          });
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to generate content");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans selection:bg-primary/30">

      {/* Sidebar */}
      <aside className="hidden sm:flex w-14 md:w-16 lg:w-20 border-r border-border flex-col items-center py-4 md:py-6 gap-6 md:gap-8 bg-surface/30 backdrop-blur-md z-50">
        <div className="p-2 rounded-xl bg-primary/10 text-primary">
          <Zap size={24} strokeWidth={2.5} />
        </div>

        <nav className="flex-1 flex flex-col gap-6 w-full items-center">
          <NavIcon
            icon={<Palette size={22} />}
            label="Canvas"
            isActive={activeTab === 'canvas'}
            onClick={() => setActiveTab('canvas')}
          />
          <NavIcon
            icon={<Workflow size={22} />}
            label="Workflow"
            isActive={activeTab === 'workflow'}
            onClick={() => setActiveTab('workflow')}
          />
          <NavIcon
            icon={<Video size={22} />}
            label="Sora"
            isActive={activeTab === 'sora'}
            onClick={() => setActiveTab('sora')}
          />
          <NavIcon
            icon={<LayoutGrid size={22} />}
            label="Gallery"
            isActive={activeTab === 'gallery'}
            onClick={() => setActiveTab('gallery')}
          />
        </nav>

        <div className="flex flex-col gap-6 w-full items-center mt-auto">
          <NavIcon
            icon={<Settings size={22} />}
            label="Settings"
            isActive={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
          />
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-purple-500 border border-white/20" />
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-md border-t border-border px-2 py-2 flex justify-around items-center safe-area-pb">
        <MobileNavButton
          icon={<Palette size={20} />}
          label="画布"
          isActive={activeTab === 'canvas'}
          onClick={() => setActiveTab('canvas')}
        />
        <MobileNavButton
          icon={<Workflow size={20} />}
          label="工作流"
          isActive={activeTab === 'workflow'}
          onClick={() => setActiveTab('workflow')}
        />
        <MobileNavButton
          icon={<Video size={20} />}
          label="视频"
          isActive={activeTab === 'sora'}
          onClick={() => setActiveTab('sora')}
        />
        <MobileNavButton
          icon={<LayoutGrid size={20} />}
          label="画廊"
          isActive={activeTab === 'gallery'}
          onClick={() => setActiveTab('gallery')}
        />
        <MobileNavButton
          icon={<Settings size={20} />}
          label="设置"
          isActive={activeTab === 'settings'}
          onClick={() => setActiveTab('settings')}
        />
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {/* Header */}
        <header className="h-16 border-b border-border flex items-center justify-between px-8 bg-background/50 backdrop-blur-sm sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-medium tracking-wide">
              {activeTab === 'canvas' && 'Quantum Canvas'}
              {activeTab === 'workflow' && 'Infinite Workflow Engine'}
              {activeTab === 'sora' && 'Sora Laboratory'}
              {activeTab === 'gallery' && 'Asset Library'}
              {activeTab === 'settings' && 'System Config'}
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-surface border border-border text-[10px] text-muted font-mono">BETA 2.0</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 mr-4 bg-surface/50 p-1 rounded-lg border border-border">
              {MODELS.map(model => (
                <button
                  key={model.id}
                  onClick={() => setActiveModel(model.id)}
                  className={clsx(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                    activeModel === model.id ? "bg-white/10 text-foreground shadow-sm" : "text-muted hover:text-foreground hover:bg-white/5"
                  )}
                >
                  {model.name}
                </button>
              ))}
            </div>
            <button className="text-sm text-muted hover:text-foreground transition-colors">Docs</button>
            <button className="px-4 py-1.5 rounded-lg bg-white text-black text-sm font-medium hover:bg-gray-200 transition-colors">
              Upgrade Pro
            </button>
          </div>
        </header>

        {/* Content Viewport */}
        <div className="flex-1 flex overflow-hidden">

          {/* Canvas Area */}
          <div className="flex-1 overflow-auto p-0 scrollbar-hide relative">
            {/* Background Grid/Effects */}
            <div className="absolute inset-0 pointer-events-none z-0 opacity-20"
              style={{
                backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(45, 212, 191, 0.05) 0%, transparent 50%)'
              }}
            />

            <div className="relative z-10 w-full h-full min-h-[calc(100vh-4rem)]">
              {activeTab === 'workflow' ? (
                <InfiniteCanvas />
              ) : activeTab === 'sora' ? (
                /* Sora View Reuse or New Component */
                <VideoLabView setPrompt={setPrompt} setActiveTab={setActiveTab} />
              ) : (
                <CanvasView
                  prompt={prompt}
                  setPrompt={setPrompt}
                  generateImage={generateImage}
                  image={image}
                  setImage={setImage}
                  videoUrl={videoUrl}
                  activeMode={activeMode}
                  loading={loading}
                  error={error}
                  logs={logs}
                  seed={seed}
                  setSeed={setSeed}
                  activeModel={activeModel}
                  history={history}
                />
              )}
              {activeTab === 'gallery' && <PlaceholderView title="Gallery" icon={<LayoutGrid size={48} />} />}
              {activeTab === 'settings' && <PlaceholderView title="Settings" icon={<Settings size={48} />} />}
            </div>
          </div>

          {/* Right Control Station (Only for Canvas) */}
          {activeTab === 'canvas' && (
            <>
              <ControlPanel
                aspectRatio={aspectRatio}
                setAspectRatio={setAspectRatio}
                uploadedImage={uploadedImage}
                setUploadedImage={setUploadedImage}
                batchSize={batchSize}
                setBatchSize={setBatchSize}
                resolution={resolution}
                setResolution={setResolution}
                activeModel={activeModel}
                setActiveModel={setActiveModel}
                activeMode={activeMode}
                setActiveMode={switchMode}
                availableModels={activeMode === 'video' ? VEO_MODELS : MODELS}
              />
              {/* Mobile Controls Toggle */}
              <MobileControlSheet
                aspectRatio={aspectRatio}
                setAspectRatio={setAspectRatio}
                activeMode={activeMode}
                setActiveMode={switchMode}
              />
            </>
          )}

        </div>
      </main>
    </div>
  );
}

// ---------------- Mobile Control Sheet ----------------

function MobileControlSheet({ aspectRatio, setAspectRatio, activeMode, setActiveMode }) {
  const [isOpen, setIsOpen] = useState(false);
  const ratios = [
    { id: "16:9", label: "Cinema 电影" },
    { id: "3:2", label: "Photo 照片" },
    { id: "1:1", label: "Square 方形" },
    { id: "9:16", label: "Mobile 手机" },
  ];

  return (
    <>
      {/* Floating Toggle Button - Only on Mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed bottom-4 right-4 z-50 p-4 rounded-full bg-primary text-black shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-transform"
      >
        <Settings size={24} />
      </button>

      {/* Bottom Sheet */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            {/* Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border rounded-t-3xl p-6 z-50 max-h-[70vh] overflow-y-auto"
            >
              {/* Handle */}
              <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />

              {/* Mode Switcher */}
              <div className="flex bg-black/20 p-1 rounded-xl mb-6">
                <button
                  onClick={() => setActiveMode('image')}
                  className={clsx("flex-1 py-3 rounded-lg text-sm font-medium transition-all", activeMode === 'image' ? "bg-white/10 text-white shadow-sm" : "text-muted")}
                >
                  图像 Image
                </button>
                <button
                  onClick={() => setActiveMode('video')}
                  className={clsx("flex-1 py-3 rounded-lg text-sm font-medium transition-all", activeMode === 'video' ? "bg-purple-500 text-white shadow-sm" : "text-muted")}
                >
                  视频 Video
                </button>
              </div>

              {/* Aspect Ratio */}
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">画幅 Ratio</h3>
                <div className="grid grid-cols-4 gap-2">
                  {ratios.map(r => (
                    <button
                      key={r.id}
                      onClick={() => setAspectRatio(r.id)}
                      className={clsx(
                        "py-3 rounded-xl text-xs font-medium transition-all border",
                        aspectRatio === r.id
                          ? "bg-primary/20 border-primary text-primary"
                          : "bg-surface/50 border-white/10 text-muted"
                      )}
                    >
                      {r.id}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-3 bg-primary text-black font-semibold rounded-xl"
              >
                完成 Done
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ---------------- Sub Components ----------------

function ControlPanel({ aspectRatio, setAspectRatio, uploadedImage, setUploadedImage, batchSize, setBatchSize, resolution, setResolution, activeModel, setActiveModel, activeMode, setActiveMode, availableModels = [] }) {
  const ratios = [
    { id: "16:9", label: "Cinema" },
    { id: "3:2", label: "Photo" },
    { id: "1:1", label: "Square" },
    { id: "4:5", label: "Portrait" },
    { id: "9:16", label: "Mobile" },
  ];

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validation: Type
      if (!file.type.startsWith('image/')) {
        alert("Please upload an image file.");
        return;
      }
      // Validation: Size (Max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("Image too large. Please upload an image under 10MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const isGoogle = activeModel?.includes('imagen') || activeModel?.includes('veo');

  return (
    <aside className="hidden md:flex w-64 lg:w-72 border-l border-border bg-surface/30 backdrop-blur-md p-4 lg:p-6 flex-col gap-6 lg:gap-8 z-40 overflow-y-auto">

      {/* Mode Switcher */}
      <div className="flex bg-black/20 p-1 rounded-xl">
        <button
          onClick={() => setActiveMode('image')}
          className={clsx("flex-1 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-medium transition-all", activeMode === 'image' ? "bg-white/10 text-white shadow-sm" : "text-muted hover:text-white")}
        >
          Image 图像
        </button>
        <button
          onClick={() => setActiveMode('video')}
          className={clsx("flex-1 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-medium transition-all", activeMode === 'video' ? "bg-purple-500 text-white shadow-sm" : "text-muted hover:text-white")}
        >
          Video (Veo) 视频
        </button>
      </div>

      {/* Model Selector */}
      <div className="space-y-3">
        <label className="text-[10px] text-muted uppercase tracking-wider font-semibold">
          {activeMode === 'video' ? 'Video Model' : 'Image Model'}
        </label>
        <div className="flex flex-col gap-2">
          {availableModels.map(model => (
            <button
              key={model.id}
              onClick={() => setActiveModel(model.id)}
              className={clsx(
                "flex items-center justify-between p-3 rounded-xl border text-left transition-all",
                activeModel === model.id
                  ? "bg-primary/10 border-primary/50 text-primary shadow-sm"
                  : "bg-surface/50 border-white/5 text-muted hover:bg-white/5 hover:text-foreground"
              )}
            >
              <div>
                <div className="text-xs font-bold">{model.name}</div>
                <div className="text-[10px] opacity-70">{model.desc}</div>
              </div>
              {model.badge && (
                <span className={clsx(
                  "text-[9px] px-1.5 py-0.5 rounded-full font-bold",
                  activeModel === model.id ? "bg-primary text-black" : "bg-white/10 text-muted"
                )}>
                  {model.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Google Model Settings */}
      {isGoogle && activeMode === 'image' && (
        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 shadow-inner">
          <h3 className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Sparkles size={12} />
            Google Imagen Settings
          </h3>

          <div className="space-y-4">
            {/* Resolution */}
            <div className="space-y-2">
              <label className="text-[10px] text-muted uppercase">Resolution</label>
              <div className="flex gap-2 p-1 bg-black/20 rounded-lg">
                {['1K', '2K'].map(res => (
                  <button
                    key={res}
                    onClick={() => setResolution(res)}
                    className={clsx(
                      "flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
                      resolution === res ? "bg-blue-500 text-white shadow-lg" : "text-muted hover:text-white hover:bg-white/5"
                    )}
                  >
                    {res}
                  </button>
                ))}
              </div>
            </div>

            {/* Batch Size */}
            <div className="space-y-2">
              <label className="text-[10px] text-muted uppercase">Batch Size: {batchSize}</label>
              <input
                type="range"
                min="1"
                max="4"
                step="1"
                value={batchSize}
                onChange={(e) => setBatchSize(parseInt(e.target.value))}
                className="w-full accent-blue-500 h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted opacity-50 px-1">
                <span>1</span>
                <span>4</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Input Section */}
      <div>
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
          <ImageIcon size={14} />
          Visual Input
        </h3>

        {!uploadedImage ? (
          <div className="border border-dashed border-white/20 rounded-xl p-6 flex flex-col items-center justify-center gap-3 hover:bg-white/5 transition-colors cursor-pointer relative group">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer z-50 h-full w-full"
            />
            <div className="p-3 rounded-full bg-surface border border-white/10 group-hover:scale-110 transition-transform">
              <Upload size={20} className="text-muted" />
            </div>
            <span className="text-xs text-muted text-center">
              Drop image here<br />or click to upload
            </span>
          </div>
        ) : (
          <div className="relative rounded-xl overflow-hidden border border-border group">
            <img src={uploadedImage} alt="Reference" className="w-full h-auto object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
            <button
              onClick={() => setUploadedImage(null)}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-red-500/80 transition-colors backdrop-blur-sm"
            >
              <X size={14} />
            </button>
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
              <span className="text-[10px] text-white/80 font-mono">Reference Active</span>
            </div>
          </div>
        )}
      </div>

      <div className="w-full h-px bg-white/5" />

      <div>
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">Composition</h3>
        <div className="grid grid-cols-2 gap-2">
          {ratios.map(r => (
            <button
              key={r.id}
              onClick={() => setAspectRatio(r.id)}
              className={clsx(
                "flex items-center justify-center gap-2 p-3 rounded-lg border transition-all text-sm",
                aspectRatio === r.id
                  ? "bg-primary/10 border-primary text-primary shadow-sm"
                  : "bg-surface border-border text-muted hover:border-white/20 hover:text-foreground"
              )}
            >
              <span className="font-medium">{r.id}</span>
              {/* Visual representation could go here */}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">Advanced</h3>
        <div className="p-4 rounded-lg bg-surface border border-border space-y-4 opacity-50 cursor-not-allowed">
          <div className="flex justify-between text-sm">
            <span>Guidance Scale</span>
            <span>3.5</span>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-white/30"></div>
          </div>
          <div className="flex justify-between text-sm">
            <span>Steps</span>
            <span>24</span>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full w-2/3 bg-white/30"></div>
          </div>
          <p className="text-[10px] text-muted text-center pt-2">Pro features coming in Phase 3.1</p>
        </div>
      </div>
    </aside>
  )
}


function NavIcon({ icon, label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "relative group p-3 rounded-xl transition-all duration-300",
        isActive ? "text-primary bg-primary/10" : "text-muted hover:text-foreground hover:bg-white/5"
      )}
    >
      {icon}
      {isActive && (
        <motion.div
          layoutId="active-indicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full -ml-3"
        />
      )}

      {/* Tooltip */}
      <span className="absolute left-full ml-4 px-2 py-1 rounded-md bg-surface border border-border text-xs text-foreground opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50">
        {label}
      </span>
    </button>
  )
}

function MobileNavButton({ icon, label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl transition-all min-w-[60px]",
        isActive
          ? "text-primary bg-primary/10"
          : "text-muted active:bg-white/5"
      )}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  )
}

function PlaceholderView({ title, icon }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-muted gap-4">
      <div className="p-6 rounded-full bg-surface border border-border mb-4">
        {icon}
      </div>
      <h2 className="text-xl font-light text-foreground">{title} Coming Soon</h2>
      <p className="max-w-md text-center opacity-60">This module is part of the Phase 2 rollout. Please check back later.</p>
    </div>
  )
}

function CanvasView({
  prompt,
  setPrompt,
  generateImage,
  image,
  setImage,
  videoUrl, // Add videoUrl
  activeMode, // Add activeMode
  loading,
  error,
  logs,
  seed,
  setSeed,
  activeModel,
  history
}) {
  const [isEnhancing, setIsEnhancing] = useState(false);

  const downloadImage = async () => {
    if (!image) return;
    try {
      const response = await fetch(image);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      // Detect extension from MIME type or default to png
      const ext = blob.type.split('/')[1] || 'png';
      link.download = `ai-studio-gen-${timestamp}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download image:", err);
      window.open(image, '_blank');
    }
  };

  const enhancePrompt = async () => {
    if (!prompt) return;
    setIsEnhancing(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/enhance-prompt`, { prompt });
      if (response.data.success) {
        setPrompt(response.data.prompt);
      }
    } catch (err) {
      console.error("Failed to enhance prompt:", err);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleRemix = (item) => {
    setImage(item.url);
    setPrompt(item.prompt);
    setSeed(item.seed);
    // Optional: setActiveModel(item.model) if we passed the setter
  };

  /* Post-Processing Handlers */
  const upscaleImage = async () => {
    if (!image) return;
    setLoading(true);
    setLogs(prev => [...prev, "Upscaling image to 4K (Real-ESRGAN)..."]);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/upscale`, { image });
      if (response.data.success) {
        setImage(response.data.url); // Replace current image with upscaled version
        setLogs(prev => [...prev, "Upscale complete."]);
      }
    } catch (err) {
      console.error("Upscale frontend error:", err);
      // Show explicit error to user
      const msg = err.response?.data?.error || "Upscale failed. Please check backend logs.";
      setLogs(prev => [...prev, `Error: ${msg}`]);
      setError(`Upscale Error: ${msg}`);
      alert(`Upscale Failed: ${msg}\n\nNote: You may need to accept the model terms on Replicate for 'nightmareai/real-esrgan'.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 relative">
      <div className="w-full max-w-4xl flex flex-col gap-6 pb-32"> {/* Added padding bottom for filmstrip */}

        {/* Welcome Hero */}
        {!image && !loading && history.length === 0 && (
          <div className="text-center space-y-2 mb-8">
            <h2 className="text-4xl md:text-5xl font-serif italic text-foreground">Create something new.</h2>
            <p className="text-muted">
              Running on <span className="text-primary font-mono">{activeModel.split('/')[1]}</span>
            </p>
          </div>
        )}

        {/* Display Error */}
        {error && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Input Box */}
        <div className={clsx("w-full relative group transition-all duration-500", image ? "order-last" : "")}>
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-purple-500/50 rounded-2xl opacity-20 group-hover:opacity-100 transition duration-500 blur"></div>
          <div className="relative bg-surface border border-border rounded-2xl p-2 flex flex-col gap-2 shadow-2xl">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  generateImage();
                }
              }}
              placeholder="A futuristic city with neons, cinematic lighting..."
              className={clsx(
                "flex-1 bg-transparent border-none outline-none resize-none p-4 text-lg placeholder:text-muted/30 h-32 md:h-24 transition-opacity",
                isEnhancing ? "opacity-50" : "opacity-100"
              )}
              disabled={isEnhancing}
            />

            {/* Magic Enhance Overlay */}
            {isEnhancing && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="flex items-center gap-2 text-purple-400 font-mono text-sm animate-pulse bg-black/50 px-3 py-1 rounded-full backdrop-blur">
                  <Sparkles size={14} />
                  <span>Magic enhancing...</span>
                </div>
              </div>
            )}

            <div className="flex justify-between items-end p-2 border-t border-white/5 pt-2">
              <div className="flex gap-2">
                <button
                  onClick={enhancePrompt}
                  disabled={!prompt || isEnhancing}
                  className={clsx(
                    "p-2 rounded-lg transition-colors flex items-center gap-2",
                    (!prompt || isEnhancing) ? "text-muted/50 cursor-not-allowed" : "text-purple-400 hover:bg-purple-500/10 hover:text-purple-300"
                  )}
                  title="Magic Enhance"
                >
                  <Wand2 size={18} />
                  <span className="text-xs font-medium">Enhance</span>
                </button>
                <button className="p-2 rounded-lg hover:bg-white/5 text-muted hover:text-foreground transition-colors" title="Settings">
                  <Settings size={18} />
                </button>
                <button className="p-2 rounded-lg hover:bg-white/5 text-muted hover:text-foreground transition-colors" title="Seed">
                  <span className="text-xs font-mono opacity-50">SEED: {seed}</span>
                </button>
              </div>
              <button
                onClick={generateImage}
                disabled={loading || !prompt || isEnhancing}
                className="px-6 py-2 rounded-xl bg-primary hover:bg-primaryHover disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold transition-all shadow-lg hover:shadow-primary/20 flex items-center gap-2"
              >
                {loading ? (
                  <span>Generating...</span>
                ) : (
                  <>
                    <span>Generate</span>
                    <Zap size={16} fill="currentColor" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Result View */}
        <AnimatePresence mode="wait">
          {(image || loading) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full aspect-video rounded-2xl bg-black/40 border border-border overflow-hidden relative group"
            >
              {loading && (
                /* ... loading ... */
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <div className="font-mono text-xs text-primary/80 animate-pulse">
                    Processing...
                  </div>
                  <div className="text-[10px] text-muted max-w-sm text-center px-4">
                    {logs.slice(-1)[0]}
                  </div>
                </div>
              )}
              {activeMode === 'video' && videoUrl ? (
                <>
                  <video
                    src={videoUrl}
                    controls
                    autoPlay
                    loop
                    className="w-full h-full object-contain"
                  />
                  {/* Video Toolbar */}
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={videoUrl}
                      download={`veo-generation-${Date.now()}.mp4`}
                      className="p-2 rounded-full bg-black/50 backdrop-blur text-white hover:bg-black/80 transition-colors border border-white/10"
                      title="Download Video"
                    >
                      <Download size={16} />
                    </a>
                  </div>
                </>
              ) : image ? (
                <>
                  <img src={image} alt="Generated" className="w-full h-full object-contain" />

                  {/* Image Toolbar Overlay */}
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={upscaleImage}
                      className="px-3 py-1.5 rounded-full bg-black/50 backdrop-blur text-white hover:bg-black/80 transition-colors flex items-center gap-2 text-xs font-medium border border-white/10"
                      title="Upscale 4K"
                    >
                      <Maximize2 size={14} />
                      <span>Upscale 4K</span>
                    </button>
                    <button
                      onClick={downloadImage}
                      className="p-2 rounded-full bg-black/50 backdrop-blur text-white hover:bg-black/80 transition-colors border border-white/10"
                      title="Download"
                    >
                      <Download size={16} />
                    </button>
                  </div>
                </>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Filmstrip / Gallery Bar - Fixed at Bottom */}
      {history.length > 0 && (
        <div className="absolute bottom-6 left-0 right-0 px-8">
          <div className="flex items-center gap-4 p-2 bg-surface/80 backdrop-blur-md rounded-2xl border border-white/10 overflow-x-auto scrollbar-hide w-full max-w-5xl mx-auto shadow-2xl">
            <div className="flex gap-2 min-w-0">
              {history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleRemix(item)}
                  className={clsx(
                    "relative w-16 h-16 rounded-lg overflow-hidden border transition-all flex-shrink-0",
                    image === item.url ? "border-primary ring-2 ring-primary/20 scale-105" : "border-white/10 hover:border-white/30"
                  )}
                >
                  <img src={item.url} className="w-full h-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
            <div className="w-px h-8 bg-white/10 flex-shrink-0 mx-2" />
            <div className="flex-1 flex items-center justify-between min-w-[200px]">
              <div className="flex flex-col">
                <span className="text-[10px] text-muted uppercase tracking-wider">History</span>
                <span className="text-xs font-mono">{history.length} assets</span>
              </div>
              <button className="p-2 rounded-lg hover:bg-white/5 text-muted hover:text-foreground">
                <LayoutGrid size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* Video Analysis Component */
function VideoLabView({ setPrompt, setActiveTab }) {
  const [videoFile, setVideoFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [scenes, setScenes] = useState([]);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setVideoFile(e.target.files[0]);
      setScenes([]);
      setError(null);
    }
  };

  const analyzeVideo = async () => {
    if (!videoFile) return;
    setAnalyzing(true);
    setError(null);
    setScenes([]);

    const formData = new FormData();
    formData.append('video', videoFile);

    try {
      const res = await axios.post(`${API_BASE_URL}/api/analyze-video`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setScenes(res.data.scenes);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Analysis failed.");
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const sendToCanvas = (text) => {
    setPrompt(text);
    setActiveTab('canvas');
  };

  return (
    <div className="h-full flex flex-col p-8 gap-8 overflow-y-auto w-full max-w-6xl mx-auto pb-48">
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-border pb-6">
        <h2 className="text-4xl font-serif italic bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Video Intelligence Lab</h2>
        <p className="text-lg text-muted">Upload raw footage. Extract keyframes. Regenerate reality.</p>
      </div>

      {/* Upload Area */}
      <div className={clsx(
        "relative p-12 border-2 border-dashed rounded-3xl transition-all duration-300 flex flex-col items-center justify-center gap-6 group overflow-hidden",
        videoFile
          ? "border-green-500/30 bg-green-500/5 text-green-600 dark:text-green-300"
          : "border-border bg-surface hover:bg-surface-elevated text-foreground"
      )}>
        <input type="file" accept="video/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-20" />

        {/* Background Glow - Subtle */}
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-3xl pointer-events-none" />

        <div className={clsx(
          "p-6 rounded-full transition-transform group-hover:scale-110",
          videoFile ? "bg-green-500/20 text-green-500" : "bg-black/5 dark:bg-white/10 text-muted"
        )}>
          {videoFile ? <Check size={40} /> : <FileVideo size={40} />}
        </div>

        <div className="text-center z-10">
          <p className="text-2xl font-light text-foreground">{videoFile ? videoFile.name : "Drop Video Footage"}</p>
          <p className="text-sm font-mono text-muted mt-2">{videoFile ? `${(videoFile.size / 1024 / 1024).toFixed(1)} MB` : "Supports MP4, MOV, WEBM"}</p>
        </div>

        {videoFile && !analyzing && (
          <button
            onClick={(e) => { e.preventDefault(); analyzeVideo(); }}
            className="mt-4 px-8 py-3 bg-primary text-primary-foreground rounded-full font-bold hover:scale-105 transition-all shadow-xl shadow-primary/20 z-30 flex items-center gap-2"
          >
            <Sparkles size={18} />
            <span>Initialize Analysis</span>
          </button>
        )}

        {analyzing && (
          <div className="flex items-center gap-3 mt-4 px-6 py-2 bg-surface border border-border rounded-full z-30 shadow-lg">
            <Loader2 className="animate-spin text-primary" size={20} />
            <span className="font-mono text-sm tracking-widest text-primary">ANALYZING SCENE DATA...</span>
          </div>
        )}
      </div>

      {error && (
        <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-300 rounded-2xl flex items-center gap-4">
          <div className="p-2 bg-red-500/20 rounded-full"><X size={20} /></div>
          <div>
            <h4 className="font-bold">Analysis Terminated</h4>
            <p className="text-sm opacity-80">{error}</p>
          </div>
        </div>
      )}

      {/* Timeline View */}
      {scenes.length > 0 && (
        <div className="space-y-12 pl-4">
          {scenes.map((scene, idx) => (
            <div key={idx} className="relative pl-12 border-l-2 border-border last:border-0 hover:border-primary/50 transition-colors">
              {/* Timeline Node */}
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-surface border-2 border-primary shadow-[0_0_10px_rgba(59,130,246,0.5)] z-10" />

              <div className="flex flex-col gap-6">
                {/* Scene Header */}
                <div className="flex items-baseline gap-4">
                  <span className="text-2xl font-mono font-bold text-primary">{scene.time}</span>
                  <h3 className="text-xl font-light text-foreground">{scene.description.split('.')[0]}...</h3>
                </div>

                {/* Full Description & Cards */}
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Image Prompt Card */}
                  <div className="p-0 rounded-2xl bg-surface border border-border overflow-hidden group hover:border-purple-500/50 transition-all shadow-sm hover:shadow-md">
                    <div className="p-4 border-b border-border bg-black/5 dark:bg-white/5 flex justify-between items-center">
                      <div className="flex items-center gap-2 text-purple-600 dark:text-purple-300">
                        <ImageIcon size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">Flux/Imagen Prompt</span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => sendToCanvas(scene.img_prompt)} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-muted hover:text-foreground transition-colors" title="Send to Canvas"><ArrowRight size={16} /></button>
                        <button onClick={() => copyToClipboard(scene.img_prompt)} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-muted hover:text-foreground transition-colors"><Copy size={16} /></button>
                      </div>
                    </div>
                    <div className="p-5">
                      <p className="text-sm text-foreground/80 leading-relaxed font-light">{scene.img_prompt}</p>
                    </div>
                  </div>

                  {/* Video Prompt Card */}
                  <div className="p-0 rounded-2xl bg-surface border border-border overflow-hidden group hover:border-orange-500/50 transition-all shadow-sm hover:shadow-md">
                    <div className="p-4 border-b border-border bg-black/5 dark:bg-white/5 flex justify-between items-center">
                      <div className="flex items-center gap-2 text-orange-600 dark:text-orange-300">
                        <Film size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">Sora/Veo Prompt</span>
                      </div>
                      <button onClick={() => copyToClipboard(scene.video_prompt)} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-muted hover:text-foreground transition-colors"><Copy size={16} /></button>
                    </div>
                    <div className="p-5">
                      <p className="text-sm text-foreground/80 leading-relaxed font-light">{scene.video_prompt}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App;
