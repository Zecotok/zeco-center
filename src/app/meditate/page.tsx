"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/solid";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React from "react";
// Scene and Guide Interfaces
interface Scene {
  name: string;
  filename: string;
}

interface Guide {
  fileName: string;
  guideName: string;
}

interface Program {
  programName: string;
  guides: Guide[];
}

// Add these interfaces at the top with other interfaces
interface AudioConfig {
  showSeekControls: boolean;
}

// Update the AudioPlayer props interface
interface AudioPlayerProps {
  src: string | null;
  autoplay?: boolean;
  loop?: boolean;
  showControls?: boolean;
  volume: number;
  onVolumeChange: (value: number) => void;
  label: string;
  isGuide?: boolean;
  // Add these new props for tracking
  programName?: string;
  guideName?: string;
  sceneUsed?: string;
  config?: AudioConfig;
}

const AudioPlayer = React.memo(({ 
  src, 
  autoplay = false, 
  loop = false, 
  showControls = true,
  volume,
  onVolumeChange,
  label,
  isGuide = false,
  programName,
  guideName,
  sceneUsed,
  config = { showSeekControls: false }
}: AudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current && autoplay && src) {
      audioRef.current.play().catch((error) => {
        console.error("Error playing audio:", error);
      });
    }
  }, [src, autoplay]);

  useEffect(() => {
    if (audioRef.current && isGuide) {
      const audio = audioRef.current;
      
      const handleTimeUpdate = () => {
        setCurrentTime(audio.currentTime);
      };

      const handleLoadedMetadata = () => {
        setDuration(audio.duration);
      };

      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);

      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, [isGuide]);

  const togglePlay = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Add function to record completion
  const recordCompletion = useCallback(async () => {
    if (isGuide && src) {
      try {
        await axios.post('/api/meditation/analytics', {
          guideId: src,
          programName,
          guideName,
          duration,
          sceneUsed
        });
      } catch (error) {
        console.error('Error recording meditation completion:', error);
      }
    }
  }, [isGuide, src, programName, guideName, duration, sceneUsed]);

  // Add handleSeek function
  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const newTime = parseFloat(e.target.value);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }, []);

  // Scene audio player (minimal version)
  if (!isGuide) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-end">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Background Volume:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-24"
            />
          </div>
        </div>
        <audio 
          ref={audioRef} 
          src={src || ""} 
          loop={loop}
          className="hidden"
        >
          Your browser does not support the audio element.
        </audio>
      </div>
    );
  }

  // Guide audio player (with controls)
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <div className="flex items-center space-x-4">
          <button
            onClick={togglePlay}
            className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Volume:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-24"
            />
          </div>
        </div>
      </div>
      
      {/* Seek bar */}
      <div className="space-y-1">
        <div className="w-full bg-gray-200 rounded-full h-2 relative">
          {config?.showSeekControls ? (
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="absolute inset-0 w-full h-2 appearance-none bg-transparent rounded-full cursor-pointer z-10
                [&::-webkit-slider-runnable-track]:bg-transparent
                [&::-webkit-slider-thumb]:appearance-none 
                [&::-webkit-slider-thumb]:w-4 
                [&::-webkit-slider-thumb]:h-4 
                [&::-webkit-slider-thumb]:rounded-full 
                [&::-webkit-slider-thumb]:bg-white 
                [&::-webkit-slider-thumb]:border-2
                [&::-webkit-slider-thumb]:border-teal-500
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:shadow-md
                [&::-moz-range-track]:bg-transparent
                [&::-moz-range-thumb]:appearance-none 
                [&::-moz-range-thumb]:w-4 
                [&::-moz-range-thumb]:h-4 
                [&::-moz-range-thumb]:rounded-full 
                [&::-moz-range-thumb]:bg-white 
                [&::-moz-range-thumb]:border-2
                [&::-moz-range-thumb]:border-teal-500
                [&::-moz-range-thumb]:cursor-pointer
                [&::-moz-range-thumb]:shadow-md"
            />
          ) : null}
          <div 
            className="absolute inset-0 bg-teal-500 h-full rounded-full transition-all duration-150"
            style={{ 
              width: duration ? `${(currentTime / duration * 100).toFixed(2)}%` : '0%',
              zIndex: 1 
            }}
          />
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <audio 
        ref={audioRef} 
        src={src || ""} 
        loop={loop}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          recordCompletion();
        }}
        className="hidden"
      >
        Your browser does not support the audio element.
      </audio>
    </div>
  );
});

AudioPlayer.displayName = 'AudioPlayer';

// Add this wave pattern component
const WavePattern = () => (
  <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.07]" 
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='20' viewBox='0 0 100 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M21.184 20c.357-.13.72-.264 1.088-.402l1.768-.661C33.64 15.347 39.647 14 50 14c10.271 0 15.362 1.222 24.629 4.928.955.383 1.869.74 2.75 1.072h6.225c-2.51-.73-5.139-1.691-8.233-2.928C65.888 13.278 60.562 12 50 12c-10.626 0-16.855 1.397-26.66 5.063l-1.767.662c-2.475.923-4.66 1.674-6.724 2.275h6.335zm0-20C13.258 2.892 8.077 4 0 4V2c5.744 0 9.951-.574 14.85-2h6.334zM77.38 0C85.239 2.966 90.502 4 100 4V2c-6.842 0-11.386-.542-16.396-2h-6.225zM0 14c8.44 0 13.718-1.21 22.272-4.402l1.768-.661C33.64 5.347 39.647 4 50 4c10.271 0 15.362 1.222 24.629 4.928C84.112 12.722 89.438 14 100 14v-2c-10.271 0-15.362-1.222-24.629-4.928C65.888 3.278 60.562 2 50 2 39.374 2 33.145 3.397 23.34 7.063l-1.767.662C13.223 10.84 8.163 12 0 12v2z' fill='%232C4A7F' fill-opacity='0.8' fill-rule='evenodd'/%3E%3C/svg%3E")`,
      backgroundSize: '100px auto',
    }}
  />
);

const AccordionSection = ({ 
  title, 
  isOpen, 
  onToggle, 
  children, 
  icon 
}: { 
  title: string; 
  isOpen: boolean; 
  onToggle: () => void; 
  children: React.ReactNode;
  icon: string;
}) => (
  <div className="border-b border-[#2C4A7F]/10 last:border-b-0">
    <button
      onClick={onToggle}
      className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#84B9EF]/5 transition-colors"
    >
      <div className="flex items-center gap-3">
        <span className="text-[#2C4A7F]">{icon}</span>
        <h2 className="text-lg font-medium text-[#051B2C]">{title}</h2>
      </div>
      <ChevronUpIcon 
        className={`w-5 h-5 text-[#2C4A7F] transition-transform duration-300 ${
          isOpen ? '' : 'rotate-180'
        }`}
      />
    </button>
    <div
      className={`overflow-hidden transition-all duration-300 ${
        isOpen ? 'max-h-[300px]' : 'max-h-0'
      }`}
    >
      <div className="px-6 pb-4 overflow-y-auto max-h-[280px] scrollbar-thin scrollbar-thumb-[#2C4A7F]/20 scrollbar-track-transparent hover:scrollbar-thumb-[#2C4A7F]/30">
        {children}
      </div>
    </div>
  </div>
);

const MeditationPage = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);

  const [backgroundAudioSrc, setBackgroundAudioSrc] = useState<string | null>(null);
  const [guideAudioSrc, setGuideAudioSrc] = useState<string | null>(null);

  const [scenes, setScenes] = useState<Scene[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);

  const [isScenesCollapsed, setScenesCollapsed] = useState(false);
  const [isProgramsCollapsed, setProgramsCollapsed] = useState(false);
  const [isGuidesCollapsed, setGuidesCollapsed] = useState(false);

  // Add these new state variables after other useState declarations
  const [sceneVolume, setSceneVolume] = useState(0.5);
  const [guideVolume, setGuideVolume] = useState(0.8);
  
  // Add this config object
  const audioConfig: AudioConfig = {
    showSeekControls: session?.user?.isAdmin ? true : false
  };

  useEffect(() => {
    const fetchScenes = async () => {
      try {
        const response = await axios.get("/api/scenes");
        setScenes(response.data);
      } catch (error) {
        console.error("Error fetching scenes:", error);
      }
    };
    fetchScenes();
  }, []);

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await axios.get("/api/programs");
        setPrograms(response.data);
      } catch (error) {
        console.error("Error fetching programs:", error);
      }
    };
    fetchPrograms();
  }, []);

  useEffect(() => {
    if (selectedScene) setBackgroundAudioSrc(`/scenes/${selectedScene.filename}`);
  }, [selectedScene]);

  useEffect(() => {
    if (selectedGuide && selectedProgram) {
      setGuideAudioSrc(`/programs/${selectedProgram.programName}/${selectedGuide.fileName}`);
    }
  }, [selectedGuide, selectedProgram]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F7FF] via-[#E6F0FF] to-[#F0F7FF] py-8 px-4 relative">
      <WavePattern />
      <div className="max-w-3xl mx-auto relative z-10">
        <h1 className="text-4xl font-bold text-[#0A2342] text-center mb-8">
          ZecoCenter Meditation
        </h1>

        {/* Audio Players Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-[#2C4A7F]/10 p-6 mb-6 border border-[#84B9EF]/20">
          {backgroundAudioSrc && (
            <AudioPlayer 
              src={backgroundAudioSrc}
              autoplay={true}
              loop={true}
              showControls={false}
              volume={sceneVolume}
              onVolumeChange={setSceneVolume}
              label="Background Scene"
              isGuide={false}
            />
          )}
          {guideAudioSrc && (
            <div className="mt-4">
              <AudioPlayer 
                src={guideAudioSrc}
                autoplay={false}
                loop={false}
                showControls={true}
                volume={guideVolume}
                onVolumeChange={setGuideVolume}
                label="Meditation Guide"
                isGuide={true}
                programName={selectedProgram?.programName}
                guideName={selectedGuide?.guideName}
                sceneUsed={selectedScene?.name}
                config={audioConfig}
              />
            </div>
          )}
        </div>

        {/* Accordion Sections */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-[#2C4A7F]/10 overflow-hidden border border-[#84B9EF]/20">
          {/* Scenes Section */}
          <AccordionSection 
            title="Choose Background Scene" 
            isOpen={!isScenesCollapsed}
            onToggle={() => setScenesCollapsed(!isScenesCollapsed)}
            icon="🌊"
          >
            <div className="grid gap-2">
              {scenes.map((scene) => (
                <button
                  key={scene.filename}
                  onClick={() => setSelectedScene(scene)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
                    selectedScene?.name === scene.name
                      ? 'bg-[#2C4A7F] text-white shadow-md shadow-[#2C4A7F]/10'
                      : 'hover:bg-[#84B9EF]/10 text-[#051B2C] hover:shadow-sm'
                  }`}
                >
                  {scene.name}
                </button>
              ))}
            </div>
          </AccordionSection>

          {/* Programs Section */}
          <AccordionSection 
            title="Select Program" 
            isOpen={!isProgramsCollapsed}
            onToggle={() => setProgramsCollapsed(!isProgramsCollapsed)}
            icon="🌟"
          >
            <div className="grid gap-2">
              {programs.map((program) => (
                <div key={program.programName}>
                  <button
                    onClick={() => setSelectedProgram(program)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
                      selectedProgram?.programName === program.programName
                        ? 'bg-[#2C4A7F] text-white shadow-md shadow-[#2C4A7F]/10'
                        : 'hover:bg-[#84B9EF]/10 text-[#051B2C] hover:shadow-sm'
                    }`}
                  >
                    {program.programName.replace(/_/g, " ").toUpperCase()}
                  </button>
                  
                  {/* Guides Subsection */}
                  {selectedProgram?.programName === program.programName && (
                    <div className="ml-6 mt-2 border-l-2 border-[#84B9EF]/20 pl-4">
                      {program.guides.map((guide) => (
                        <button
                          key={guide.fileName}
                          onClick={() => setSelectedGuide(guide)}
                          className={`w-full text-left px-4 py-2 rounded-xl transition-all duration-200 ${
                            selectedGuide?.fileName === guide.fileName
                              ? 'bg-[#64B6AC] text-white shadow-md shadow-[#64B6AC]/10'
                              : 'hover:bg-[#84B9EF]/10 text-[#051B2C] hover:shadow-sm'
                          }`}
                        >
                          {guide.guideName}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </AccordionSection>
        </div>
      </div>
    </div>
  );
};

export default MeditationPage;
