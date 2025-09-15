
import React, { useState, useEffect, useCallback } from 'react';
import { generateAdventureStep, generateSceneImage } from './services/geminiService';
import type { PlayerState } from './types';
import Navbar from './components/Navbar';
import ImageDisplay from './components/ImageDisplay';
import StoryOutput from './components/StoryOutput';
import PlayerInput from './components/PlayerInput';
import Loader from './components/Loader';
import PlayerStats from './components/PlayerStats';

const App: React.FC = () => {
  const [history, setHistory] = useState<string[]>([]);
  const [playerState, setPlayerState] = useState<PlayerState>({ health: 100, inventory: [] });
  const [possibleActions, setPossibleActions] = useState<string[]>([]);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isNewGame, setIsNewGame] = useState<boolean>(true);

  const processGameTurn = useCallback(async (action: string) => {
    setIsLoading(true);
    setError(null);

    const fullHistory = action === 'start' ? [] : [...history, `> ${action}`];

    try {
      const gameState = await generateAdventureStep(history, action, playerState.inventory, playerState.health);
      
      setHistory(prev => [...prev, gameState.description]);
      setPlayerState({ health: gameState.health, inventory: gameState.inventory });
      setPossibleActions(gameState.possibleActions);

      if (gameState.health <= 0) {
        setHistory(prev => [...prev, "You have fallen. The adventure ends here. But a new one can always begin..."]);
        setPossibleActions(["Start a New Game"]);
      }

      const imageUrl = await generateSceneImage(gameState.imagePrompt);
      setCurrentImageUrl(imageUrl);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
      setIsNewGame(false);
    }
  }, [history, playerState.inventory, playerState.health]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    processGameTurn('start');
  }, []);

  const handlePlayerAction = (action: string) => {
    if (isLoading) return;

    if (action === "Start a New Game") {
        setHistory([]);
        setPlayerState({ health: 100, inventory: [] });
        setPossibleActions([]);
        setCurrentImageUrl(null);
        setError(null);
        setIsNewGame(true);
        processGameTurn('start');
        return;
    }
    
    setHistory(prev => [...prev, `\n> ${action}`]);
    processGameTurn(action);
  };
  
  if (isNewGame && isLoading) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900">
            <Navbar />
            <Loader message="Forging your destiny in the arcane mists..." />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 font-sans">
      <Navbar />
      <main className="container mx-auto pt-24 pb-12 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 flex flex-col gap-8">
            <ImageDisplay imageUrl={currentImageUrl} isLoading={isLoading} />
            <PlayerStats playerState={playerState} />
          </div>
          <div className="lg:col-span-2 flex flex-col h-[80vh]">
            <div className="flex-grow mb-4">
              <StoryOutput 
                history={history} 
                playerState={playerState} 
                possibleActions={possibleActions} 
                onActionClick={handlePlayerAction}
                isLoading={isLoading} 
                error={error} 
              />
            </div>
            <PlayerInput onSubmit={handlePlayerAction} isLoading={isLoading} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
