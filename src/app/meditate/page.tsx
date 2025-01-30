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
    showSeekControls: true
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

  const SceneList = () => (
    <div className="bg-blue-50 p-4 rounded-xl shadow-lg transition-all">
      <h2
        className="text-xl font-semibold text-blue-900 mb-2 flex justify-between items-center cursor-pointer"
        onClick={() => setScenesCollapsed(!isScenesCollapsed)}
      >
        Select a Scene
        {isScenesCollapsed ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronUpIcon className="w-5 h-5" />}
      </h2>
      <ul className={`space-y-4 ${isScenesCollapsed ? "max-h-0 overflow-hidden" : "max-h-80 overflow-y-auto"}`}>
        {scenes.map((scene) => (
          <li key={scene.filename}>
            <button
              className="w-full p-2 text-white bg-blue-500 hover:bg-blue-700 rounded-lg shadow-md transition-colors"
              onClick={() => setSelectedScene(scene)}
            >
              {scene.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  const ProgramList = () => (
    <div className="bg-green-50 p-4 rounded-xl shadow-lg transition-all">
      <h2
        className="text-xl font-semibold text-green-900 mb-2 flex justify-between items-center cursor-pointer"
        onClick={() => setProgramsCollapsed(!isProgramsCollapsed)}
      >
        Select a Program
        {isProgramsCollapsed ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronUpIcon className="w-5 h-5" />}
      </h2>
      <ul className={`space-y-4 ${isProgramsCollapsed ? "max-h-0 overflow-hidden" : "max-h-80 overflow-y-auto"}`}>
        {programs.map((program) => (
          <li key={program.programName}>
            <button
              className="w-full p-2 text-white bg-green-500 hover:bg-green-700 rounded-lg shadow-md transition-colors"
              onClick={() => setSelectedProgram(program)}
            >
              {program.programName.replace(/_/g, " ").toUpperCase()}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  const GuideList = () => (
    <div className="bg-purple-50 p-4 rounded-xl shadow-lg transition-all">
      <h3
        className="text-xl font-semibold text-purple-900 mb-2 flex justify-between items-center cursor-pointer"
        onClick={() => setGuidesCollapsed(!isGuidesCollapsed)}
      >
        Select a Guide
        {isGuidesCollapsed ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronUpIcon className="w-5 h-5" />}
      </h3>
      <ul className={`space-y-4 ${isGuidesCollapsed ? "max-h-0 overflow-hidden" : "max-h-80 overflow-y-auto"}`}>
        {selectedProgram?.guides.map((guide) => (
          <li key={guide.fileName}>
            <button
              className="w-full p-2 text-white bg-blue-500 hover:bg-blue-700 rounded-lg shadow-md transition-colors"
              onClick={() => setSelectedGuide(guide)}
            >
              {guide.guideName}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  // If still loading session, you can show a loading message
  if (status === "loading") {
    return <p>Loading...</p>;
  }

  // If user is not logged in, show a message or redirect them
  if (!session) {
    console.log('------------------------',session)
    return <p className="text-center text-red-600">You must be logged in to access this page.</p>;
  }

  return (
    <div className="bg-gradient-to-r from-teal-150 to-teal-10 min-h-screen flex flex-col items-center p-4 md:p-6">
      <h1 className="text-3xl md:text-4xl font-extrabold text-teal-900 mb-4 md:mb-6">ZecoCenter Meditation</h1>

      <div className="w-full max-w-2xl lg:max-w-3xl p-4 md:p-6 bg-white border-4 border-teal-500 rounded-xl shadow-lg mb-6 md:mb-8">
        <h2 className="text-xl md:text-2xl font-semibold text-center text-teal-900 mb-4">Audio Player</h2>
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
            programName={selectedProgram?.programName}
            sceneUsed={selectedScene?.name}
          />
        )}
        {guideAudioSrc && (
          <div className="mt-4">
            <AudioPlayer 
              src={guideAudioSrc} 
              autoplay={true} 
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-5xl">
        <div className="flex-1 min-w-[300px]">
          <SceneList />
        </div>
        <div className="flex-1 min-w-[300px]">
          <ProgramList />
        </div>
        {selectedProgram && (
          <div className="flex-1 min-w-[300px]">
            <GuideList />
          </div>
        )}
      </div>
    </div>
  );
};

export default MeditationPage;
