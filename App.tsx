// Fix: Implemented the main App component to manage game state
import React, { useState, useCallback } from 'react';
import Navbar from './components/Navbar';
import PlayerStats from './components/PlayerStats';
import ImageDisplay from './components/ImageDisplay';
import StoryOutput from './components/StoryOutput';
import PlayerInput from './components/PlayerInput';
import CharacterCreation from './components/CharacterCreation';
import LogModal from './components/LogModal';
import { PlayerStats as PlayerStatsType, StoryChoice } from './types';
import { startGame, processPlayerAction, generateSceneImage } from './services/geminiService';
import { audioService } from './services/audioService';

type AppState = 'CHARACTER_CREATION' | 'LOADING' | 'GAME' | 'GAME_OVER';

const App: React.FC = () => {
    const [appState, setAppState] = useState<AppState>('CHARACTER_CREATION');
    const [playerStats, setPlayerStats] = useState<PlayerStatsType | null>(null);
    const [dialogue, setDialogue] = useState<string>('');
    const [possibleActions, setPossibleActions] = useState<string[]>([]);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [history, setHistory] = useState<string[]>([]);
    
    const [isLoading, setIsLoading] = useState(false);
    const [isImageLoading, setIsImageLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showActions, setShowActions] = useState(false);

    const [isLogOpen, setIsLogOpen] = useState(false);
    const [isMuted, setIsMuted] = useState(false);

    const handleMuteToggle = () => {
        audioService.toggleMute();
        setIsMuted(prev => !prev);
    };

    const handleApiResponse = useCallback((response: StoryChoice) => {
        setPlayerStats(response.playerStats);
        setDialogue(response.story);
        setPossibleActions(response.possibleActions);
        setHistory(prev => [...prev, response.story]);
        setShowActions(false);

        audioService.playAmbiance(response.imagePrompt);

        setIsImageLoading(true);
        generateSceneImage(response.imagePrompt)
            .then(url => setImageUrl(url))
            .catch(() => setError("Failed to generate scene image."))
            .finally(() => setIsImageLoading(false));

        if (response.isGameOver) {
            setAppState('GAME_OVER');
        } else {
            setAppState('GAME');
        }
    }, []);
    
    const handleCharacterCreate = useCallback(async (name: string, characterClass: string) => {
        setAppState('LOADING');
        setIsLoading(true);
        setError(null);
        try {
            const initialStory = await startGame(name, characterClass);
            setHistory([`> You are ${name}, the ${characterClass}.`, initialStory.story]);
            handleApiResponse(initialStory);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            setAppState('CHARACTER_CREATION');
        } finally {
            setIsLoading(false);
        }
    }, [handleApiResponse]);
    
    const handlePlayerAction = useCallback(async (action: string) => {
        if (!playerStats) return;
        
        setIsLoading(true);
        setError(null);
        setDialogue('');
        setPossibleActions([]);
        setHistory(prev => [...prev, `> ${action}`]);
        
        try {
            const nextStory = await processPlayerAction(playerStats, history, action);
            handleApiResponse(nextStory);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            setPossibleActions(possibleActions); 
            setDialogue(history[history.length-2] || 'You are in a bind.');
            setAppState('GAME');
        } finally {
            setIsLoading(false);
        }
    }, [playerStats, history, handleApiResponse, possibleActions]);

    const handleRestart = () => {
        setAppState('CHARACTER_CREATION');
        setPlayerStats(null);
        setDialogue('');
        setPossibleActions([]);
        setImageUrl(null);
        setHistory([]);
        setError(null);
        setShowActions(false);
    };
    
    const renderContent = () => {
        switch (appState) {
            case 'CHARACTER_CREATION':
                return <CharacterCreation onCharacterCreate={handleCharacterCreate} isLoading={isLoading} />;
            case 'LOADING':
                 return (
                    <div className="text-center mt-20">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-400 mx-auto mb-4"></div>
                        <p className="text-xl text-slate-400">The story unfolds...</p>
                        {error && <p className="text-red-400 mt-4">{error}</p>}
                    </div>
                );
            case 'GAME':
            case 'GAME_OVER':
                return (
                    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto">
                        <ImageDisplay imageUrl={imageUrl} isLoading={isImageLoading} />
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-1 flex flex-col gap-8">
                                <PlayerStats stats={playerStats} />
                                {appState === 'GAME' && <PlayerInput onSubmit={handlePlayerAction} isLoading={isLoading || !showActions} />}
                                {appState === 'GAME_OVER' && (
                                     <div className="text-center p-6 bg-red-900/50 border border-red-500 rounded-lg animate-fade-in">
                                         <h2 className="text-3xl font-bold text-red-400 font-serif">GAME OVER</h2>
                                         <p className="text-slate-300 mt-2 mb-4">{dialogue}</p>
                                         <button onClick={handleRestart} className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-2 px-4 rounded transition-colors">
                                            Start a New Legend
                                        </button>
                                     </div>
                                )}
                            </div>
                            <div className="lg:col-span-2">
                                <StoryOutput
                                    dialogue={dialogue}
                                    onDialogueFinished={() => setShowActions(true)}
                                    showActions={showActions && appState !== 'GAME_OVER'}
                                    possibleActions={possibleActions}
                                    onActionClick={handlePlayerAction}
                                    isLoading={isLoading}
                                    error={error}
                                />
                            </div>
                        </div>
                    </div>
                );
        }
    };
    
    return (
        <div className="bg-slate-900 text-gray-200 min-h-screen font-sans">
            <Navbar isMuted={isMuted} onMuteToggle={handleMuteToggle} />
            <main className="container mx-auto px-4 py-24 flex justify-center">
                {renderContent()}
            </main>
            <button
                onClick={() => setIsLogOpen(true)}
                className="fixed bottom-4 right-4 bg-slate-700 hover:bg-slate-600 text-amber-400 font-bold p-3 rounded-full shadow-lg transition-transform hover:scale-110"
                title="View Adventure Log"
            >
                <i className="fas fa-book-open text-xl"></i>
            </button>
            <LogModal history={history} isOpen={isLogOpen} onClose={() => setIsLogOpen(false)} />
        </div>
    );
};

export default App;
