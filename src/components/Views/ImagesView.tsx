import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  Sparkles,
  ArrowLeft,
  Download,
  Maximize2,
  Copy,
  Check,
  RefreshCw,
  Wand2,
  X,
  Layers,
  Palette,
  AlertCircle
} from 'lucide-react';

interface ImagesViewProps {
  onBackToChat: () => void;
}

interface ImageItem {
  id: string;
  url: string;
  prompt: string;
  aspectRatio: string;
  style: string;
  timestamp: string;
}

export const ImagesView: React.FC<ImagesViewProps> = ({ onBackToChat }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '3:4'>('1:1');
  const [selectedStyle, setSelectedStyle] = useState('realistic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeModalImage, setActiveModalImage] = useState<ImageItem | null>(null);

  // Initial gallery + user saved images
  const [gallery, setGallery] = useState<ImageItem[]>([
    {
      id: 'default-1',
      url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      prompt: 'ប្រាសាទអង្គរវត្តនាពេលថ្ងៃរះពណ៌មាស រំលេចពន្លឺចាំងលើផ្ទៃទឹកត្រពាំងដ៏ស្ងប់ស្ងាត់',
      aspectRatio: '16:9',
      style: 'cinematic',
      timestamp: 'ថ្ងៃនេះ',
    },
    {
      id: 'default-2',
      url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
      prompt: 'គំនូរប្រេងបុរាណបែប Abstract សិល្បៈទំនើប កម្រិតពណ៌រស់រវើក',
      aspectRatio: '1:1',
      style: 'oil',
      timestamp: 'ម្សិលមិញ',
    },
    {
      id: 'default-3',
      url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=800&q=80',
      prompt: 'ទេសភាពភ្នំបូកគោគ្របដណ្តប់ដោយអ័ព្ទត្រជាក់ស្រទន់ នាពេលព្រលប់',
      aspectRatio: '4:3',
      style: 'realistic',
      timestamp: '២ ថ្ងៃមុន',
    },
  ]);

  // Load saved creations from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('omni_ai_generated_images');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setGallery((prev) => [...parsed, ...prev]);
        }
      }
    } catch {}
  }, []);

  const saveImageToGallery = (newItem: ImageItem) => {
    setGallery((prev) => [newItem, ...prev]);
    try {
      const existing = localStorage.getItem('omni_ai_generated_images');
      const list = existing ? JSON.parse(existing) : [];
      localStorage.setItem('omni_ai_generated_images', JSON.stringify([newItem, ...list]));
    } catch {}
  };

  const styles = [
    { id: 'realistic', name: 'ធម្មជាតិពិត (Photorealistic)' },
    { id: 'cinematic', name: 'ភាពយន្ត (Cinematic Film)' },
    { id: 'anime', name: 'គំនូរជីវចល (Anime / Ghibli)' },
    { id: '3d', name: 'ម៉ូដែល 3D (Octane Render)' },
    { id: 'oil', name: 'គំនូរប្រេង (Oil Painting)' },
    { id: 'cyberpunk', name: 'បែបអនាគត (Cyberpunk)' },
  ];

  const aspectRatios = [
    { id: '1:1', label: '1:1 ការ៉េ (Square)', sub: '1024 × 1024' },
    { id: '16:9', label: '16:9 ផ្ដេក (Landscape)', sub: 'YouTube / PC' },
    { id: '9:16', label: '9:16 បញ្ឈរ (Portrait)', sub: 'Story / Reel' },
    { id: '4:3', label: '4:3 បុរាណ (Classic)', sub: 'Standard' },
    { id: '3:4', label: '3:4 រូបថត (Photo)', sub: 'Portrait' },
  ];

  const promptIdeas = [
    'ប្រាសាទអង្គរវត្តនាពេលថ្ងៃរះពណ៌មាស រំលេចពន្លឺចាំងលើផ្ទៃទឹកត្រពាំង',
    'ទេសភាពទីក្រុងភ្នំពេញឆ្នាំ 2050 បែប Cyberpunk មានរថយន្តហោះ និងភ្លើង Neon',
    'ស្ត្រីខ្មែរក្នុងសម្លៀកបំពាក់បុរាណប្រពៃណី ឈរក្នុងសួនផ្កាឈូករីកស្រស់',
    'សត្វខ្លាឃ្មុំតូចគួរឱ្យស្រលាញ់ កំពុងអានសៀវភៅក្នុងផ្ទះឈើកក់ក្តៅ',
  ];

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          aspectRatio,
          style: selectedStyle,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error || !data.imageUrl) {
        throw new Error(data.message || 'មិនអាចបង្កើតរូបភាពបានទេ។ សូមព្យាយាមម្តងទៀត។');
      }

      const newItem: ImageItem = {
        id: Math.random().toString(36).substring(7),
        url: data.imageUrl,
        prompt: prompt.trim(),
        aspectRatio,
        style: selectedStyle,
        timestamp: 'ទើបតែបង្កើត',
      };

      saveImageToGallery(newItem);
      setPrompt('');
    } catch (err: any) {
      console.error('Image generation error:', err);
      setError(err?.message || 'មានបញ្ហាក្នុងការបង្កើតរូបភាព។');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto w-full space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200/80 pb-5">
          <div>
            <button
              onClick={onBackToChat}
              className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-black font-semibold mb-2 transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>ត្រឡប់ទៅការជជែក (Back to Chat)</span>
            </button>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60 shadow-2xs">
                <Palette size={22} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-zinc-950 tracking-tight">
                  ស្ទូឌីយោរូបភាព AI (Omni Image Studio)
                </h1>
                <p className="text-xs text-zinc-600 font-medium mt-0.5">
                  បង្កើតរូបភាពសិល្បៈកម្រិតច្បាស់ខ្ពស់ដោយផ្ទាល់ពីបច្ចេកវិទ្យា Omni Image Studio
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Studio Generator Card */}
        <div className="bg-[#fbfbfb] border border-zinc-200 rounded-3xl p-5 md:p-6 shadow-xs space-y-5">
          {/* Prompt Input Box */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-800 flex items-center justify-between">
              <span>ការពិពណ៌នារូបភាព (Image Prompt):</span>
              <span className="text-[11px] text-zinc-500 font-normal">គាំទ្រភាសាខ្មែរ និងអង់គ្លេស</span>
            </label>
            <div className="relative">
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="ពិពណ៌នារូបភាពដែលអ្នកចង់ឱ្យ AI គូរ (ឧ. ប្រាសាទបុរាណខ្មែរនាពេលថ្ងៃរះ មានពន្លឺចាំងផ្លេកៗ និងអ័ព្ទត្រជាក់)..."
                disabled={isGenerating}
                className="w-full rounded-2xl border border-zinc-300 bg-white p-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium resize-none shadow-2xs"
              />
            </div>
          </div>

          {/* Prompt Ideas Chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-zinc-500">គំនិតបំផុស (Click to apply):</span>
            <div className="flex flex-wrap gap-1.5">
              {promptIdeas.map((idea, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt(idea)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700 text-xs font-medium transition-colors cursor-pointer text-left truncate max-w-md"
                >
                  "{idea}"
                </button>
              ))}
            </div>
          </div>

          {/* Controls: Aspect Ratio & Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            {/* Aspect Ratio */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-800">
                ទម្រង់រូបភាព (Aspect Ratio):
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {aspectRatios.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAspectRatio(item.id as any)}
                    className={`p-2 rounded-xl text-center border transition-all ${
                      aspectRatio === item.id
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold shadow-2xs'
                        : 'border-zinc-200 bg-white hover:border-zinc-300 text-zinc-700 font-medium'
                    }`}
                  >
                    <div className="text-xs">{item.id}</div>
                    <div className="text-[10px] opacity-70 mt-0.5">{item.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Art Style */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-800">
                រចនាប័ទ្មសិល្បៈ (Art Style):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {styles.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedStyle(s.id)}
                    className={`px-3 py-2 rounded-xl text-left border text-xs transition-all ${
                      selectedStyle === s.id
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold shadow-2xs'
                        : 'border-zinc-200 bg-white hover:border-zinc-300 text-zinc-700 font-medium'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Button */}
          <div className="flex items-center justify-end pt-2">
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className={`px-6 py-3 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
                prompt.trim() && !isGenerating
                  ? 'bg-zinc-950 text-white hover:bg-zinc-800 hover:shadow active:scale-98'
                  : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
              }`}
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Omni AI កំពុងបង្កើតរូបភាព...</span>
                </>
              ) : (
                <>
                  <Wand2 size={15} />
                  <span>បង្កើតរូបភាពឥឡូវនេះ (Generate Image)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Gallery Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-zinc-950 flex items-center gap-2">
              <ImageIcon size={18} className="text-zinc-600" />
              <span>វិចិត្រសាលរូបភាព (Creations Gallery)</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 font-normal">
                {gallery.length}
              </span>
            </h2>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {gallery.map((img) => (
              <div
                key={img.id}
                className="group border border-zinc-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all bg-white flex flex-col"
              >
                {/* Image Container with Hover Actions */}
                <div
                  className="relative overflow-hidden bg-zinc-100 cursor-pointer aspect-square"
                  onClick={() => setActiveModalImage(img)}
                >
                  <img
                    src={img.url}
                    alt={img.prompt}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveModalImage(img);
                      }}
                      className="p-2.5 bg-white/90 hover:bg-white text-zinc-900 rounded-full shadow-md transition-transform hover:scale-105"
                      title="ពង្រីកពេញអេក្រង់"
                    >
                      <Maximize2 size={15} />
                    </button>
                    <a
                      href={img.url}
                      download="omni-image.png"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2.5 bg-white/90 hover:bg-white text-zinc-900 rounded-full shadow-md transition-transform hover:scale-105"
                      title="ទាញយករូបភាព"
                    >
                      <Download size={15} />
                    </a>
                  </div>

                  {/* Ratio Badge */}
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-mono backdrop-blur-xs">
                    {img.aspectRatio}
                  </span>
                </div>

                {/* Details */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                  <p className="text-xs font-semibold text-zinc-900 line-clamp-2 leading-relaxed">
                    {img.prompt}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-zinc-100">
                    <span>{img.timestamp}</span>
                    <button
                      onClick={() => handleCopy(img.prompt, img.id)}
                      className="inline-flex items-center gap-1 hover:text-zinc-900 transition-colors"
                      title="ចម្លង Prompt"
                    >
                      {copiedId === img.id ? (
                        <>
                          <Check size={12} className="text-emerald-600" />
                          <span className="text-emerald-600 font-semibold">បានចម្លង</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>ចម្លង Prompt</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fullscreen Image Preview Modal */}
      {activeModalImage && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="relative max-w-4xl w-full bg-zinc-950 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 text-white">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-blue-400" />
                <span className="text-xs font-semibold">រូបភាព Omni AI</span>
                <span className="px-2 py-0.5 rounded text-[11px] bg-zinc-800 text-zinc-300 font-mono">
                  {activeModalImage.aspectRatio}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={activeModalImage.url}
                  download="omni-ai-image.png"
                  className="px-3 py-1.5 rounded-lg bg-white text-black hover:bg-zinc-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                >
                  <Download size={13} />
                  <span>ទាញយក PNG</span>
                </a>
                <button
                  onClick={() => setActiveModalImage(null)}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-zinc-900/50">
              <img
                src={activeModalImage.url}
                alt={activeModalImage.prompt}
                className="max-h-[68vh] w-auto max-w-full rounded-xl object-contain shadow-lg"
              />
            </div>

            <div className="p-3.5 bg-zinc-900 border-t border-zinc-800 text-zinc-300 text-xs font-medium">
              <span className="text-zinc-500 font-normal">Prompt: </span>
              {activeModalImage.prompt}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
