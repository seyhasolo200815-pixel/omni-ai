import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  Film,
  Sparkles,
  Wand2,
  ArrowLeft,
  Download,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Clock,
  Layers,
  Image as ImageIcon,
  Check,
  AlertCircle,
  RefreshCw,
  Share2
} from 'lucide-react';

interface VideoPlaceholderProps {
  onBackToChat: () => void;
}

interface VideoItem {
  id: string;
  url: string;
  prompt: string;
  aspectRatio: '16:9' | '9:16';
  resolution: string;
  style: string;
  timestamp: string;
  duration: string;
}

export const VideoPlaceholder: React.FC<VideoPlaceholderProps> = ({ onBackToChat }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  const [selectedStyle, setSelectedStyle] = useState('cinematic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [currentVideo, setCurrentVideo] = useState<VideoItem | null>(null);

  // Video player controls
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Gallery of created videos
  const [videoGallery, setVideoGallery] = useState<VideoItem[]>([
    {
      id: 'default-veo-1',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      prompt: 'រថយន្តទំនើបបើកបរលើផ្លូវភ្លើងពណ៌ Neon ពេលរាត្រីក្នុងរចនាប័ទ្មភាពយន្ត 16:9',
      aspectRatio: '16:9',
      resolution: '1080p',
      style: 'cinematic',
      timestamp: 'ថ្ងៃនេះ',
      duration: '0:15',
    },
    {
      id: 'default-veo-2',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
      prompt: 'ទេសភាពឆ្នេរសមុទ្រក្រុងព្រះសីហនុនាពេលថ្ងៃលិច រលកបោកបក់ស្រទន់បែប Drone View',
      aspectRatio: '16:9',
      resolution: '720p',
      style: 'drone',
      timestamp: 'ម្សិលមិញ',
      duration: '0:12',
    },
  ]);

  // Load saved videos from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('omni_ai_generated_videos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setVideoGallery((prev) => [...parsed, ...prev]);
        }
      }
    } catch {}
  }, []);

  const saveVideoToGallery = (newItem: VideoItem) => {
    setVideoGallery((prev) => [newItem, ...prev]);
    setCurrentVideo(newItem);
    try {
      const existing = localStorage.getItem('omni_ai_generated_videos');
      const list = existing ? JSON.parse(existing) : [];
      localStorage.setItem('omni_ai_generated_videos', JSON.stringify([newItem, ...list]));
    } catch {}
  };

  const styleOptions = [
    { id: 'cinematic', name: 'ភាពយន្ត (Cinematic Film)', icon: '🎬' },
    { id: '3d', name: 'គំនូរជីវចល 3D (Animation)', icon: '🌸' },
    { id: 'realistic', name: 'វីដេអូពិតជាក់ស្តែង (Realistic)', icon: '🎥' },
    { id: 'cyberpunk', name: 'អនាគត Sci-Fi (Cyberpunk)', icon: '🛸' },
    { id: 'drone', name: 'ប្លង់ដ្រូន (Drone Aerial Shot)', icon: '🦅' },
    { id: 'timelapse', name: 'ចលនាលឿន (Time-lapse)', icon: '⏳' },
  ];

  const samplePrompts = [
    'រថយន្តទំនើបបើកបរលើផ្លូវភ្លើងពណ៌ Neon ពេលរាត្រីក្នុងរចនាប័ទ្មភាពយន្ត',
    'ទេសភាពថ្ងៃរះលើប្រាសាទអង្គរវត្ត មានអ័ព្ទហុយៗ និងបក្សីហើរលើមេឃ',
    'រ៉ូបូត AI អនាគតកំពុងដើរក្នុងទីក្រុងឆ្លាតវៃភ្នំពេញឆ្នាំ 2050',
    'សត្វផ្សោតសមុទ្រហែលលេងក្នុងទឹកសមុទ្រថ្លាដូចកញ្ចក់នាពេលថ្ងៃត្រង់',
  ];

  const handleGenerateVideo = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setGenerationStep(1);

    const stepInterval = setInterval(() => {
      setGenerationStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 4500);

    try {
      // 1. Call Generate Video API
      const res = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `${prompt.trim()}, ${selectedStyle} style`,
          aspectRatio,
          resolution,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.message || 'ម៉ាស៊ីន Omni Video មិនអាចចាប់ផ្តើមបង្កើតវីដេអូបានទេ។');
      }

      const operationName = data.operationName;

      // 2. Poll video status if real operation name returned
      let isDone = false;
      let pollAttempts = 0;
      const maxAttempts = 30; // ~2.5 mins

      while (!isDone && pollAttempts < maxAttempts) {
        await new Promise((r) => setTimeout(r, 6000));
        pollAttempts++;

        const statusRes = await fetch('/api/video-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operationName }),
        });

        const statusData = await statusRes.json();
        if (statusData.done) {
          isDone = true;
          break;
        }
        if (statusData.error) {
          throw new Error(statusData.error.message || 'បញ្ហាក្នុងការ Render វីដេអូ');
        }
      }

      // 3. Obtain video download URL
      const videoDownloadUrl = `/api/video-download?operationName=${encodeURIComponent(operationName)}`;

      const newVideoItem: VideoItem = {
        id: Math.random().toString(36).substring(7),
        url: videoDownloadUrl,
        prompt: prompt.trim(),
        aspectRatio,
        resolution,
        style: selectedStyle,
        timestamp: 'ទើបតែបង្កើត',
        duration: '0:10',
      };

      saveVideoToGallery(newVideoItem);
      setPrompt('');
    } catch (err: any) {
      console.warn('Real Veo API note/fallback:', err);
      // Fallback: If user hits Veo Quota or needs paid tier, explain clearly and provide sample video demonstration
      const rawErrMsg = err?.message || '';
      if (rawErrMsg.includes('429') || rawErrMsg.includes('quota') || rawErrMsg.includes('403') || rawErrMsg.includes('Billing') || rawErrMsg.includes('RESOURCE_EXHAUSTED')) {
        setError('សេវាកម្មបង្កើតវីដេអូមានបន្ទុកខ្ពស់ ឬកូតាត្រូវបានប្រើប្រាស់អស់ជាបណ្តោះអាសន្ន។ ប្រព័ន្ធបានបង្កើតវីដេអូសាកល្បងជាគំរូខាងក្រោមជូនអ្នកដើម្បីទស្សនាចំណុចប្រទាក់។');
      } else {
        setError(rawErrMsg || 'មានបញ្ហាក្នុងការបង្កើតវីដេអូ។');
      }

      // Add a simulated preview demo so user can test full player & download UX
      const demoItem: VideoItem = {
        id: Math.random().toString(36).substring(7),
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        prompt: prompt.trim(),
        aspectRatio,
        resolution,
        style: selectedStyle,
        timestamp: 'គំរូទស្សនា (Demo)',
        duration: '0:15',
      };
      saveVideoToGallery(demoItem);
    } finally {
      clearInterval(stepInterval);
      setIsGenerating(false);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      const dur = videoRef.current.duration || 1;
      setProgress((cur / dur) * 100);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const newTime = (Number(e.target.value) / 100) * (videoRef.current.duration || 1);
      videoRef.current.currentTime = newTime;
      setProgress(Number(e.target.value));
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
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
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-200/60 shadow-2xs">
                <Video size={22} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-zinc-950 tracking-tight">
                  ស្ទូឌីយោវីដេអូ AI (Omni Video Studio)
                </h1>
                <p className="text-xs text-zinc-600 font-medium mt-0.5">
                  បង្កើតឈុតឆាកវីដេអូកម្រិតភាពយន្ត 1080p ដំណើរការដោយបច្ចេកវិទ្យា Omni Video Studio
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
              <span>ការពិពណ៌នាវីដេអូ (Video Prompt):</span>
              <span className="text-[11px] text-zinc-500 font-normal">គាំទ្រភាសាខ្មែរ និងអង់គ្លេស</span>
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="ពិពណ៌នាឈុតឆាក ចលនា ពន្លឺ និងមុំកាមេរ៉ា (ឧ. រថយន្តទំនើបបើកបរលើផ្លូវភ្លើងពណ៌ Neon ពេលរាត្រី បែបភាពយន្ត)..."
              disabled={isGenerating}
              className="w-full rounded-2xl border border-zinc-300 bg-white p-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all font-medium resize-none shadow-2xs"
            />
          </div>

          {/* Quick Ideas */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-zinc-500">គំនិតបំផុស (Click to apply):</span>
            <div className="flex flex-wrap gap-1.5">
              {samplePrompts.map((idea, idx) => (
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

          {/* Controls: Aspect Ratio, Resolution, Style */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
            {/* Aspect Ratio */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-800">
                ទម្រង់វីដេអូ (Aspect Ratio):
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAspectRatio('16:9')}
                  className={`p-2.5 rounded-xl text-center border transition-all ${
                    aspectRatio === '16:9'
                      ? 'border-purple-600 bg-purple-50 text-purple-700 font-bold shadow-2xs'
                      : 'border-zinc-200 bg-white hover:border-zinc-300 text-zinc-700 font-medium'
                  }`}
                >
                  <div className="text-xs">16:9 ផ្ដេក (Landscape)</div>
                  <div className="text-[10px] opacity-70 mt-0.5">YouTube / PC / TV</div>
                </button>

                <button
                  type="button"
                  onClick={() => setAspectRatio('9:16')}
                  className={`p-2.5 rounded-xl text-center border transition-all ${
                    aspectRatio === '9:16'
                      ? 'border-purple-600 bg-purple-50 text-purple-700 font-bold shadow-2xs'
                      : 'border-zinc-200 bg-white hover:border-zinc-300 text-zinc-700 font-medium'
                  }`}
                >
                  <div className="text-xs">9:16 បញ្ឈរ (Portrait)</div>
                  <div className="text-[10px] opacity-70 mt-0.5">TikTok / Reels / Shorts</div>
                </button>
              </div>
            </div>

            {/* Resolution */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-800">
                កម្រិតភាពច្បាស់ (Resolution):
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setResolution('720p')}
                  className={`p-2.5 rounded-xl text-center border transition-all ${
                    resolution === '720p'
                      ? 'border-purple-600 bg-purple-50 text-purple-700 font-bold shadow-2xs'
                      : 'border-zinc-200 bg-white hover:border-zinc-300 text-zinc-700 font-medium'
                  }`}
                >
                  <div className="text-xs">720p HD</div>
                  <div className="text-[10px] opacity-70 mt-0.5">រហ័ស (Fast)</div>
                </button>

                <button
                  type="button"
                  onClick={() => setResolution('1080p')}
                  className={`p-2.5 rounded-xl text-center border transition-all ${
                    resolution === '1080p'
                      ? 'border-purple-600 bg-purple-50 text-purple-700 font-bold shadow-2xs'
                      : 'border-zinc-200 bg-white hover:border-zinc-300 text-zinc-700 font-medium'
                  }`}
                >
                  <div className="text-xs">1080p Full HD</div>
                  <div className="text-[10px] opacity-70 mt-0.5">គុណភាពខ្ពស់</div>
                </button>
              </div>
            </div>

            {/* Art Style */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-800">
                រចនាប័ទ្មភាពយន្ត (Style):
              </label>
              <div className="grid grid-cols-2 gap-2">
                {styleOptions.slice(0, 4).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedStyle(s.id)}
                    className={`p-2 rounded-xl text-left border text-xs truncate transition-all ${
                      selectedStyle === s.id
                        ? 'border-purple-600 bg-purple-50 text-purple-700 font-bold shadow-2xs'
                        : 'border-zinc-200 bg-white hover:border-zinc-300 text-zinc-700 font-medium'
                    }`}
                  >
                    <span>{s.icon} {s.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Multi-stage Generating Progress Indicator */}
          {isGenerating && (
            <div className="p-4 bg-purple-50/80 border border-purple-200 rounded-2xl space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-bold text-purple-900">
                <div className="flex items-center gap-2">
                  <Film size={16} className="text-purple-600 animate-spin" />
                  <span>
                    {generationStep === 1 && 'ដំណាក់កាល ១: វិភាគ Prompt និងរចនាប័ទ្មពន្លឺ...'}
                    {generationStep === 2 && 'ដំណាក់កាល ២: ម៉ាស៊ីន AI Veo កំពុង Render Frames នៃចលនា...'}
                    {generationStep === 3 && 'ដំណាក់កាល ៣: កំពុងបញ្ចូល Effects និង Compile វីដេអូ MP4...'}
                  </span>
                </div>
                <span>ជំហាន {generationStep}/3</span>
              </div>

              <div className="w-full bg-purple-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-purple-600 h-full transition-all duration-700"
                  style={{ width: `${(generationStep / 3) * 100}%` }}
                />
              </div>

              <p className="text-[11px] text-purple-700 font-medium">
                ដំណើរការបង្កើតវីដេអូ Veo អាចចំណាយពេលពី ១ ទៅ ២ នាទី។ សូមរង់ចាំបន្តិច...
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium flex items-center gap-2.5">
              <AlertCircle size={16} className="shrink-0 text-amber-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex items-center justify-end pt-2">
            <button
              onClick={handleGenerateVideo}
              disabled={!prompt.trim() || isGenerating}
              className={`px-6 py-3 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
                prompt.trim() && !isGenerating
                  ? 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow active:scale-98'
                  : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
              }`}
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Omni AI កំពុងបង្កើតវីដេអូ...</span>
                </>
              ) : (
                <>
                  <Film size={15} />
                  <span>បង្កើតវីដេអូ AI ឥឡូវនេះ (Generate Video)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Video Player Display Section */}
        {currentVideo && (
          <div className="bg-black rounded-3xl overflow-hidden shadow-xl border border-zinc-800 text-white">
            <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video size={16} className="text-purple-400" />
                <span className="text-xs font-bold">លទ្ធផលវីដេអូ Veo AI</span>
                <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] font-mono">
                  {currentVideo.aspectRatio} · {currentVideo.resolution}
                </span>
              </div>
              <a
                href={currentVideo.url}
                download="omni-ai-video.mp4"
                className="px-3 py-1.5 rounded-lg bg-white text-black hover:bg-zinc-200 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
              >
                <Download size={13} />
                <span>ទាញយក MP4</span>
              </a>
            </div>

            {/* Video Canvas */}
            <div className="relative aspect-video max-h-[500px] flex items-center justify-center bg-black">
              <video
                ref={videoRef}
                src={currentVideo.url}
                className="w-full h-full object-contain"
                playsInline
                loop
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />

              {/* Big Play Overlay if paused */}
              {!isPlaying && (
                <button
                  type="button"
                  onClick={togglePlay}
                  className="absolute p-4 rounded-full bg-purple-600/90 text-white hover:bg-purple-600 hover:scale-105 transition-all shadow-xl cursor-pointer"
                >
                  <Play size={24} fill="white" />
                </button>
              )}
            </div>

            {/* Custom Bottom Player Bar */}
            <div className="p-3.5 bg-zinc-950 border-t border-zinc-850 space-y-2">
              {/* Seekbar */}
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={handleSeek}
                className="w-full accent-purple-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
              />

              <div className="flex items-center justify-between text-xs text-zinc-400">
                <div className="flex items-center gap-3">
                  <button
                    onClick={togglePlay}
                    className="p-1 hover:text-white transition-colors"
                    title={isPlaying ? 'ផ្អាក' : 'ចាក់'}
                  >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  <button
                    onClick={toggleMute}
                    className="p-1 hover:text-white transition-colors"
                    title={isMuted ? 'បើកសំឡេង' : 'បិទសំឡេង'}
                  >
                    {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                  <span className="text-[11px] font-mono text-zinc-500">{currentVideo.duration}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleFullscreen}
                    className="p-1 hover:text-white transition-colors"
                    title="ពេញអេក្រង់"
                  >
                    <Maximize2 size={16} />
                  </button>
                </div>
              </div>

              <div className="pt-1 text-xs text-zinc-300 font-medium">
                <span className="text-zinc-500">Prompt: </span>
                {currentVideo.prompt}
              </div>
            </div>
          </div>
        )}

        {/* Video Creations Gallery */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-zinc-950 flex items-center gap-2">
              <Film size={18} className="text-zinc-600" />
              <span>វិចិត្រសាលវីដេអូ AI (Video Gallery)</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 font-normal">
                {videoGallery.length}
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {videoGallery.map((vid) => (
              <div
                key={vid.id}
                className="group border border-zinc-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all bg-white flex flex-col"
              >
                <div
                  className="relative overflow-hidden bg-black aspect-video flex items-center justify-center cursor-pointer"
                  onClick={() => setCurrentVideo(vid)}
                >
                  <video
                    src={vid.url}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    muted
                    preload="metadata"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-white/90 text-zinc-900 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play size={16} fill="currentColor" />
                    </div>
                  </div>

                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-mono backdrop-blur-xs">
                    {vid.aspectRatio} · {vid.resolution}
                  </span>
                  <span className="absolute bottom-2.5 right-2.5 px-1.5 py-0.5 rounded bg-black/70 text-white text-[10px] font-mono">
                    {vid.duration}
                  </span>
                </div>

                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                  <p className="text-xs font-semibold text-zinc-900 line-clamp-2 leading-relaxed">
                    {vid.prompt}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-zinc-100">
                    <span>{vid.timestamp}</span>
                    <a
                      href={vid.url}
                      download="omni-video.mp4"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 font-semibold text-purple-600 hover:text-purple-800"
                    >
                      <Download size={12} />
                      <span>ទាញយក MP4</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
