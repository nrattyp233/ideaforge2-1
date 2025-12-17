
import React, { useState, useRef, useEffect } from 'react';
import { 
  Pencil, 
  Eraser, 
  Trash2, 
  RotateCcw, 
  Sparkles, 
  Download, 
  Plus, 
  Image as ImageIcon,
  Loader2,
  Share2,
  Layers,
  Palette,
  Info,
  Bookmark,
  History,
  ExternalLink
} from 'lucide-react';
import DrawingCanvas, { DrawingCanvasHandle } from './components/DrawingCanvas';
import { Tool, GenerationResult, SavedMockup } from './types';
import { generateProductMockup } from './services/geminiService';

const App: React.FC = () => {
  const [tool, setTool] = useState<Tool>('pencil');
  const [color, setColor] = useState('#1e293b');
  const [brushSize, setBrushSize] = useState(4);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Gallery state
  const [savedMockups, setSavedMockups] = useState<SavedMockup[]>([]);

  const canvasRef = useRef<DrawingCanvasHandle>(null);

  // Load saved mockups from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('ideaforge_gallery');
    if (stored) {
      try {
        setSavedMockups(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to load gallery", e);
      }
    }
  }, []);

  // Save to localStorage whenever gallery changes
  useEffect(() => {
    localStorage.setItem('ideaforge_gallery', JSON.stringify(savedMockups));
  }, [savedMockups]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please describe the product materials and style.");
      return;
    }

    const sketchData = canvasRef.current?.getCanvasData();
    if (!sketchData) return;

    setIsGenerating(true);
    setError(null);

    try {
      const imageUrl = await generateProductMockup(sketchData, prompt);
      setResult({
        imageUrl,
        timestamp: Date.now()
      });
    } catch (err: any) {
      setError(err.message || "Failed to generate mockup. Check console for details.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToGallery = () => {
    if (!result) return;
    const sketchData = canvasRef.current?.getCanvasData() || '';
    
    const newSave: SavedMockup = {
      id: crypto.randomUUID(),
      sketchUrl: sketchData,
      resultUrl: result.imageUrl,
      prompt: prompt,
      timestamp: Date.now()
    };

    setSavedMockups(prev => [newSave, ...prev]);
  };

  const handleLoadSaved = (mockup: SavedMockup) => {
    // Restore prompt
    setPrompt(mockup.prompt);
    // Restore result view
    setResult({
      imageUrl: mockup.resultUrl,
      timestamp: mockup.timestamp
    });
    // Restore sketch to canvas for editing
    if (mockup.sketchUrl) {
      canvasRef.current?.loadImage(mockup.sketchUrl);
    }
  };

  const handleDeleteSaved = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedMockups(prev => prev.filter(m => m.id !== id));
  };

  const handleDownload = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = result.imageUrl;
    link.download = `IdeaForge-Mockup-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-indigo-200 shadow-lg">
            <Layers size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">IdeaForge</h1>
            <p className="text-xs text-slate-500 font-medium">AI-POWERED INDUSTRIAL DESIGN</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <button className="text-slate-500 hover:text-indigo-600 transition-colors p-2 rounded-full hover:bg-slate-100">
            <Info size={20} />
          </button>
          <button className="text-slate-500 hover:text-indigo-600 transition-colors p-2 rounded-full hover:bg-slate-100">
            <Share2 size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-[1600px] mx-auto w-full p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Sketching Interface */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[600px]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button
                    onClick={() => setTool('pencil')}
                    className={`p-2 rounded-md transition-all ${tool === 'pencil' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    title="Pencil"
                  >
                    <Pencil size={20} />
                  </button>
                  <button
                    onClick={() => setTool('eraser')}
                    className={`p-2 rounded-md transition-all ${tool === 'eraser' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    title="Eraser"
                  >
                    <Eraser size={20} />
                  </button>
                </div>
                
                <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
                
                <div className="flex items-center gap-3 bg-slate-100 px-3 py-1.5 rounded-lg">
                  <Palette size={16} className="text-slate-400" />
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-6 h-6 rounded-md cursor-pointer border-none bg-transparent"
                    title="Brush Color"
                  />
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={brushSize}
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                    className="w-24 accent-indigo-600"
                    title="Brush Size"
                  />
                  <span className="text-xs font-mono text-slate-500 w-4">{brushSize}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => canvasRef.current?.undo()}
                  className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors"
                  title="Undo"
                >
                  <RotateCcw size={20} />
                </button>
                <button
                  onClick={() => canvasRef.current?.clear()}
                  className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Clear Canvas"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 relative">
              <DrawingCanvas
                ref={canvasRef}
                tool={tool}
                color={color}
                size={brushSize}
              />
              <div className="absolute bottom-4 left-4 pointer-events-none opacity-40 select-none">
                <p className="text-xs uppercase tracking-widest font-bold text-slate-400">Sketch Area 1:1</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Product Description & Materials</label>
            <textarea
              className="w-full h-32 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none bg-white text-slate-900"
              placeholder="e.g. A futuristic ergonomic headset. Made of matte black aluminum, carbon fiber details, and glowing neon blue light strips. Soft leather ear cups. Hyper-realistic studio render."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            {error && (
              <p className="mt-3 text-sm text-red-500 font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                {error}
              </p>
            )}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`w-full mt-6 py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
                isGenerating 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98] shadow-indigo-200'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Forging Mockup...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Generate High-Fidelity Mockup
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: AI Output & Gallery */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <ImageIcon size={20} className="text-indigo-600" />
                Rendered Mockup
              </h2>
              {result && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSaveToGallery}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
                  >
                    <Bookmark size={18} />
                    Save
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    <Download size={18} />
                    Download
                  </button>
                </div>
              )}
            </div>

            <div className="aspect-square flex flex-col items-center justify-center relative bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 overflow-hidden">
              {isGenerating ? (
                <div className="flex flex-col items-center gap-4 text-center px-6">
                  <div className="relative">
                    <Loader2 size={48} className="text-indigo-600 animate-spin" />
                    <Sparkles size={20} className="text-amber-400 absolute -top-2 -right-2 animate-bounce" />
                  </div>
                  <div>
                    <p className="text-slate-800 font-bold text-lg">Forging Reality...</p>
                    <p className="text-slate-500 text-sm mt-1">Gemini is applying materials...</p>
                  </div>
                </div>
              ) : result ? (
                <div className="w-full h-full flex items-center justify-center group relative">
                  <img
                    src={result.imageUrl}
                    alt="AI Generated Mockup"
                    className="w-full h-full object-contain shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <p className="text-white font-bold text-sm bg-indigo-600 px-4 py-2 rounded-full flex items-center gap-2">
                      <Plus size={16} /> Click Download to save 4K Render
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 text-center text-slate-400 px-6">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-2">
                    <ImageIcon size={32} />
                  </div>
                  <div>
                    <p className="text-slate-600 font-semibold">No mockup generated yet</p>
                    <p className="text-slate-400 text-sm mt-1">Rough out your idea on the left and hit generate.</p>
                  </div>
                </div>
              )}
            </div>

            {result && (
              <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-600">
                    <Info size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-indigo-900 uppercase tracking-tight">AI Note</p>
                    <p className="text-sm text-indigo-800/80 leading-relaxed mt-1">
                      Perspective and form were preserved while applying PBR materials.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Project Gallery */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <History size={20} className="text-indigo-600" />
                Project Gallery
              </h2>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full uppercase tracking-tighter">
                {savedMockups.length} Items
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {savedMockups.length === 0 ? (
                <div className="col-span-2 py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-sm text-slate-400">Save mockups to see them here</p>
                </div>
              ) : (
                savedMockups.map((mockup) => (
                  <div 
                    key={mockup.id} 
                    onClick={() => handleLoadSaved(mockup)}
                    className="group cursor-pointer bg-slate-50 rounded-xl border border-slate-100 p-2 transition-all hover:border-indigo-200 hover:shadow-md relative overflow-hidden"
                  >
                    <img 
                      src={mockup.resultUrl} 
                      alt="Saved Mockup" 
                      className="w-full aspect-square object-cover rounded-lg mb-2"
                    />
                    <p className="text-[10px] text-slate-500 line-clamp-2 leading-tight font-medium">
                      {mockup.prompt}
                    </p>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button 
                        onClick={(e) => handleDeleteSaved(mockup.id, e)}
                        className="p-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 shadow-sm"
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity flex items-center justify-center">
                       <ExternalLink size={20} className="text-indigo-600" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-slate-400 font-medium">
              &copy; {new Date().getFullYear()} IdeaForge Lab • Powered by Gemini Pro Vision
            </p>
          </div>
        </div>
      </main>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default App;
