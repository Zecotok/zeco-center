"use client";
import { useState, useEffect, useRef } from "react";
import axios from "axios";

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
  // State for selected scene, program, and guide
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);

  // State for background and guide audio sources
  const [backgroundAudioSrc, setBackgroundAudioSrc] = useState<string | null>(null);
  const [guideAudioSrc, setGuideAudioSrc] = useState<string | null>(null);

  // State for fetched data
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);

  // Fetch scenes data
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

  // Fetch programs data
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

  // Update background audio when scene changes
  useEffect(() => {
    if (selectedScene) {
      setBackgroundAudioSrc(`/scenes/${selectedScene.filename}`);
    }
  }, [selectedScene]);

  // Update guide audio when guide is selected
  useEffect(() => {
    if (selectedGuide && selectedProgram) {
      setGuideAudioSrc(`/programs/${selectedProgram.programName}/${selectedGuide.fileName}`);
    }
  }, [selectedGuide, selectedProgram]);

  // Component for listing scenes
  const SceneList = () => (
    <div className="max-h-80 overflow-y-scroll p-4 bg-gradient-to-r from-blue-100 to-indigo-200 rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold text-center text-blue-900 mb-4">Select a Scene</h2>
      <ul className="space-y-4">
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

  // Component for listing programs
  const ProgramList = () => (
    <div className="max-h-80 overflow-y-scroll p-4 bg-gradient-to-r from-green-100 to-green-300 rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold text-center text-green-900 mb-4">Select a Program</h2>
      <ul className="space-y-4">
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

  // Component for listing guides within the selected program
  const GuideList = () => (
    <div className="max-h-80 overflow-y-scroll p-4 bg-gradient-to-r from-purple-100 to-purple-300 rounded-xl shadow-lg">
      <h3 className="text-xl font-semibold text-center text-purple-900 mb-4">Select a Guide</h3>
      <ul className="space-y-4">
        {selectedProgram?.guides.map((guide) => (
          <li key={guide.fileName}>
            <button
              className="w-full p-2 text-white bg-purple-500 hover:bg-purple-700 rounded-lg shadow-md transition-colors"
              onClick={() => setSelectedGuide(guide)}
            >
              {guide.guideName}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  // Audio Player component
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
    <div className="bg-gradient-to-r from-teal-100 to-teal-300 min-h-screen flex flex-col justify-center items-center p-6">
      <h1 className="text-4xl font-extrabold text-teal-900 mb-8">Meditation App</h1>
      <div className="flex flex-wrap gap-8 justify-center w-full max-w-6xl">
        <div className="flex-1 w-full max-w-xs">
          <SceneList />
          <ProgramList />
          {selectedProgram && <GuideList />}
        </div>
        <div className="flex-1 w-full max-w-xs">
          <h2 className="text-2xl font-semibold text-center text-teal-900 mb-6">Audio Player</h2>
          {backgroundAudioSrc && (
            <div>
              <h3 className="text-lg font-semibold text-center text-teal-700 mb-2">Background Audio (Hidden)</h3>
              <AudioPlayer src={backgroundAudioSrc} autoplay={true} loop={true} showControls={false} />
            </div>
          )}
          {guideAudioSrc && (
            <div>
              <h3 className="text-lg font-semibold text-center text-teal-700 mb-2">Guide Audio</h3>
              <AudioPlayer src={guideAudioSrc} autoplay={false} loop={false} showControls={true} />
            </div>
          )}
        </div>
      </div>
      <div className="mt-8 text-center">
        <i className="fas fa-spa text-6xl text-teal-700"></i> {/* Meditation Icon */}
        <h2 className="text-2xl font-semibold text-teal-900 mt-4">Meditation App</h2>
      </div>

    </div>
  );
};

export default MeditationPage;
