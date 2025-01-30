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
  <div className="border-b border-teal-100 last:border-b-0">
    <button
      onClick={onToggle}
      className="w-full px-6 py-4 flex items-center justify-between hover:bg-teal-50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <span className="text-teal-600">{icon}</span>
        <h2 className="text-lg font-medium text-teal-900">{title}</h2>
      </div>
      <ChevronUpIcon 
        className={`w-5 h-5 text-teal-600 transition-transform duration-300 ${
          isOpen ? '' : 'rotate-180'
        }`}
      />
    </button>
    <div
      className={`overflow-hidden transition-all duration-300 ${
        isOpen ? 'max-h-[400px]' : 'max-h-0'
      }`}
    >
      <div className="px-6 pb-4">
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
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-teal-900 text-center mb-8">
          ZecoCenter Meditation
        </h1>

        {/* Audio Players Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
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
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Scenes Section */}
          <AccordionSection 
            title="Choose Background Scene" 
            isOpen={!isScenesCollapsed}
            onToggle={() => setScenesCollapsed(!isScenesCollapsed)}
            icon="🎵"
          >
            <div className="grid gap-2">
              {scenes.map((scene) => (
                <button
                  key={scene.filename}
                  onClick={() => setSelectedScene(scene)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    selectedScene?.name === scene.name
                      ? 'bg-teal-100 text-teal-900'
                      : 'hover:bg-teal-50 text-gray-700'
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
            icon="📚"
          >
            <div className="grid gap-2">
              {programs.map((program) => (
                <div key={program.programName}>
                  <button
                    onClick={() => setSelectedProgram(program)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      selectedProgram?.programName === program.programName
                        ? 'bg-teal-100 text-teal-900'
                        : 'hover:bg-teal-50 text-gray-700'
                    }`}
                  >
                    {program.programName.replace(/_/g, " ").toUpperCase()}
                  </button>
                  
                  {/* Guides Subsection */}
                  {selectedProgram?.programName === program.programName && (
                    <div className="ml-6 mt-2 border-l-2 border-teal-100 pl-4">
                      {program.guides.map((guide) => (
                        <button
                          key={guide.fileName}
                          onClick={() => setSelectedGuide(guide)}
                          className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                            selectedGuide?.fileName === guide.fileName
                              ? 'bg-teal-100 text-teal-900'
                              : 'hover:bg-teal-50 text-gray-700'
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
