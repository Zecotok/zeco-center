"use client";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/solid";

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

const MeditationPage = () => {
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

  const AudioPlayer = ({ src, autoplay = false, loop = false, showControls = true }: { src: string | null; autoplay?: boolean; loop?: boolean; showControls?: boolean }) => {
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
      if (audioRef.current && autoplay && src) {
        audioRef.current.play().catch((error) => {
          console.error("Error playing audio:", error);
        });
      }
    }, [src, autoplay]);

    return (
      <audio ref={audioRef} src={src || ""} controls={showControls} loop={loop} className="w-full mt-4">
        Your browser does not support the audio element.
      </audio>
    );
  };

  return (
    <div className="bg-gradient-to-r from-teal-150 to-teal-10 min-h-screen flex flex-col items-center p-4 md:p-6">
      <h1 className="text-3xl md:text-4xl font-extrabold text-teal-900 mb-4 md:mb-6">Meditation App</h1>

      <div className="w-full max-w-2xl lg:max-w-3xl p-4 md:p-6 bg-white border-4 border-teal-500 rounded-xl shadow-lg mb-6 md:mb-8">
        <h2 className="text-xl md:text-2xl font-semibold text-center text-teal-900 mb-4">Audio Player</h2>
        {backgroundAudioSrc && (
          <AudioPlayer src={backgroundAudioSrc} autoplay={true} loop={true} showControls={false} />
        )}
        {guideAudioSrc && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold text-center text-teal-700 mb-2"></h3>
            <AudioPlayer src={guideAudioSrc} autoplay={false} loop={false} showControls={true} />
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
