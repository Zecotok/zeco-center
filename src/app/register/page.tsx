
"use client";
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';


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

  
  useEffect(() => {
    const fetchScenes = async () => {
      try {
        const response = await axios.get('/api/scenes');
        setScenes(response.data);
      } catch (error) {
        console.error('Error fetching scenes:', error);
      }
    };
    fetchScenes();
  }, []);

  
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await axios.get('/api/programs');
        setPrograms(response.data.programs || []);
      } catch (error) {
        console.error('Error fetching programs:', error);
      }
    };
    fetchPrograms();
  }, []);

  
  useEffect(() => {
    if (selectedScene) {
      setBackgroundAudioSrc(`/scenes/${selectedScene.filename}`);
    }
  }, [selectedScene]);

  
  useEffect(() => {
    if (selectedGuide && selectedProgram) {
      setGuideAudioSrc(`/programs/${selectedProgram.programName}/guides/${selectedGuide.fileName}`);
    }
  }, [selectedGuide, selectedProgram]);

  
  const AudioPlayer = ({ src, autoplay = false, loop = false }: { src: string | null; autoplay?: boolean; loop?: boolean }) => {
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
      if (audioRef.current && autoplay && src) {
        audioRef.current.play().catch((error) => {
          console.error('Error playing audio:', error);
        });
      }
    }, [src, autoplay]);

    return (
      <audio ref={audioRef} src={src || ''} controls loop={loop}>
        Your browser does not support the audio element.
      </audio>
    );
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Meditation App</h1>
      <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
        {/* Scene Selection */}
        <div style={{ flex: 1, minWidth: '300px' }}>
          <h2>Select a Scene</h2>
          <ul>
            {scenes.map((scene) => (
              <li key={scene.filename}>
                <button onClick={() => setSelectedScene(scene)}>{scene.name}</button>
              </li>
            ))}
          </ul>

          {/* Program Selection */}
          <h2>Select a Program</h2>
          <ul>
            {programs?.map((program) => (
              <li key={program.programName}>
                <button onClick={() => setSelectedProgram(program)}>
                  {program.programName.replace(/_/g, ' ').toUpperCase()}
                </button>
              </li>
            ))|| []}
          </ul>

          {/* Guide Selection */}
          {selectedProgram && (
            <div>
              <h3>Select a Guide</h3>
              <ul>
                {selectedProgram.guides.map((guide) => (
                  <li key={guide.fileName}>
                    <button onClick={() => setSelectedGuide(guide)}>{guide.guideName}</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Audio Players */}
        <div style={{ flex: 1, minWidth: '300px' }}>
          <h2>Audio Player</h2>
          {backgroundAudioSrc && (
            <div>
              <h3>Background Audio</h3>
              <AudioPlayer src={backgroundAudioSrc} autoplay={true} loop={true} />
            </div>
          )}
          {guideAudioSrc && (
            <div>
              <h3>Guide Audio</h3>
              <AudioPlayer src={guideAudioSrc} autoplay={false} loop={false} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MeditationPage;
