// Fix: Implemented the main App component to manage game state
import React, { useState, useCallback, useEffect } from 'react';
import Navbar from './components/Navbar';
import PlayerStats from './components/PlayerStats';
import EnemyStats from './components/EnemyStats';
import ImageDisplay from './components/ImageDisplay';
import StoryOutput from './components/StoryOutput';
import PlayerInput from './components/PlayerInput';
import CharacterCreation from './components/CharacterCreation';
import LogModal from './components/LogModal';
import InventoryModal from './components/InventoryModal';
import { PlayerStats as PlayerStatsType, EnemyStats as EnemyStatsType, StoryChoice, CombatTurnResult, SaveState, InventoryItem } from './types';
import { startGame, processPlayerAction, processCombatAction, generateSceneImage, generateItemIcon, getItemUsefulness } from './services/geminiService';
import { audioService } from './services/audioService';

type AppState = 'CHARACTER_CREATION' | 'LOADING' | 'GAME' | 'COMBAT' | 'GAME_OVER';

const App: React.FC = () => {
    const [appState, setAppState] = useState<AppState>('CHARACTER_CREATION');
    const [playerStats, setPlayerStats] = useState<PlayerStatsType | null>(null);
    const [enemyStats, setEnemyStats] = useState<EnemyStatsType | null>(null);
    const [dialogue, setDialogue] = useState<string>('');
    const [possibleActions, setPossibleActions] = useState<string[]>([]);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [history, setHistory] = useState<string[]>([]);
    const [currentImagePrompt, setCurrentImagePrompt] = useState<string>('');
    
    const [isLoading, setIsLoading] = useState(false);
    const [isImageLoading, setIsImageLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showActions, setShowActions] = useState(false);

    const [isLogOpen, setIsLogOpen] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Inventory State
    const [isInventoryOpen, setIsInventoryOpen] = useState(false);
    const [activeItem, setActiveItem] = useState<InventoryItem | null>(null);
    const [itemHint, setItemHint] = useState<string | null>(null);
    const [isHintLoading, setIsHintLoading] = useState(false);


    const showToast = (message: string) => {
        setToastMessage(message);
        setTimeout(() => {
            setToastMessage(null);
        }, 2500);
    };

    const handleMuteToggle = () => {
        audioService.toggleMute();
        setIsMuted(prev => !prev);
    };

    const handleApiResponse = useCallback((response: StoryChoice) => {
        const oldPlayerStats = playerStats;
        
        setPlayerStats(response.playerStats);
        setDialogue(response.story);
        setPossibleActions(response.possibleActions);
        setHistory(prev => [...prev, response.story]);
        setCurrentImagePrompt(response.imagePrompt);
        setShowActions(false);

        // Asynchronously generate icons for new items
        response.playerStats.inventory.forEach(item => {
            const isNew = !oldPlayerStats || !oldPlayerStats.inventory.find(oldItem => oldItem.name === item.name);
            if (isNew && item.iconPrompt && !item.iconUrl) {
                generateItemIcon(item.iconPrompt)
                    .then(url => {
                        setPlayerStats(currentStats => {
                            if (!currentStats) return null;
                            const updatedInventory = currentStats.inventory.map(invItem => 
                                invItem.name === item.name ? { ...invItem, iconUrl: url } : invItem
                            );
                            return { ...currentStats, inventory: updatedInventory };
                        });
                    })
                    .catch(err => console.error("Failed to generate item icon:", err));
            }
        });


        const ambiancePrompt = response.isEncounter ? `battle, ${response.imagePrompt}` : response.imagePrompt;
        audioService.playAmbiance(ambiancePrompt);

        setIsImageLoading(true);
        generateSceneImage(response.imagePrompt)
            .then(url => setImageUrl(url))
            .catch(() => setError("Failed to generate scene image."))
            .finally(() => setIsImageLoading(false));

        if (response.isEncounter && response.enemy) {
            setEnemyStats(response.enemy);
            setAppState('COMBAT');
        } else if (response.isGameOver) {
            setAppState('GAME_OVER');
        } else {
            setEnemyStats(null);
            setAppState('GAME');
        }
    }, [playerStats]);
    
    const handleCharacterCreate = useCallback(async (name: string, characterClass: string) => {
        setAppState('LOADING');
        setIsLoading(true);
        setError(null);
        try {
            const initialStory = await startGame(name, characterClass);
            setHistory([`> You are ${name}, the ${characterClass}.`]);
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

    const handlePostCombat = useCallback(async (outcome: 'player_win' | 'fled') => {
        if (!playerStats) return;

        setIsLoading(true);
        setError(null);
        setDialogue('');
        setPossibleActions([]);
        
        const action = outcome === 'player_win'
            ? `Having defeated the enemy, I survey the area.`
            : `Having fled from the encounter, I try to catch my breath.`;
        
        setHistory(prev => [...prev, `> ${action}`]);

        try {
            const nextStory = await processPlayerAction(playerStats, history, action);
            handleApiResponse(nextStory);
        } catch (err) {
             setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            setAppState('GAME');
        } finally {
            setIsLoading(false);
        }

    }, [playerStats, history, handleApiResponse]);

    const handleCombatAction = useCallback(async (action: string) => {
        if (!playerStats || !enemyStats) return;

        setIsLoading(true);
        setError(null);
        setDialogue('');
        setPossibleActions([]);
        setHistory(prev => [...prev, `> ${action}`]);

        try {
            const result = await processCombatAction(playerStats, enemyStats, action);
            setPlayerStats(result.playerStats);
            setEnemyStats(result.enemyStats);
            setDialogue(result.combatLog);
            setHistory(prev => [...prev, result.combatLog]);

            if (result.isCombatOver) {
                setEnemyStats(null);
                if (result.outcome === 'player_win') {
                    setDialogue(prev => prev + '\n\nYou are victorious!');
                    setShowActions(false);
                    setTimeout(() => handlePostCombat('player_win'), 2500);
                } else if (result.outcome === 'player_lose') {
                    setAppState('GAME_OVER');
                } else if (result.outcome === 'fled') {
                    setDialogue(prev => prev + '\n\nYou managed to escape!');
                    setShowActions(false);
                    setTimeout(() => handlePostCombat('fled'), 2500);
                }
            } else {
                setPossibleActions(['Attack', 'Defend', 'Attempt to flee']);
                setShowActions(false); // Let onDialogueFinished trigger this
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            setPossibleActions(['Attack', 'Defend', 'Attempt to flee']);
            setAppState('COMBAT'); // Stay in combat on error
        } finally {
            setIsLoading(false);
        }
    }, [playerStats, enemyStats, history, handlePostCombat]);

    const handleRestart = () => {
        setAppState('CHARACTER_CREATION');
        setPlayerStats(null);
        setEnemyStats(null);
        setDialogue('');
        setPossibleActions([]);
        setImageUrl(null);
        setHistory([]);
        setError(null);
        setShowActions(false);
    };

    const handleQuickSave = useCallback(() => {
        if ((appState !== 'GAME' && appState !== 'COMBAT') || !playerStats) {
            showToast("You can only save during an active game.");
            return;
        }
        const saveData: SaveState = {
            playerStats,
            dialogue,
            possibleActions,
            imageUrl,
            history,
            currentImagePrompt,
            appState,
            enemyStats,
        };
        localStorage.setItem('adventa-quicksave', JSON.stringify(saveData));
        showToast("Game saved!");
    }, [appState, playerStats, dialogue, possibleActions, imageUrl, history, currentImagePrompt, enemyStats]);

    const handleQuickLoad = useCallback(() => {
        const savedDataString = localStorage.getItem('adventa-quicksave');
        if (!savedDataString) {
            showToast("No quick save data found.");
            return;
        }
        
        const savedData: SaveState = JSON.parse(savedDataString);
        
        setPlayerStats(savedData.playerStats);
        setDialogue(savedData.dialogue);
        setPossibleActions(savedData.possibleActions);
        setImageUrl(savedData.imageUrl);
        setHistory(savedData.history);
        setCurrentImagePrompt(savedData.currentImagePrompt);
        setEnemyStats(savedData.enemyStats);
        
        setShowActions(true);
        setError(null);
        setIsLoading(false);
        setIsImageLoading(false);

        // Icon generation for loaded data
        if (savedData.playerStats.inventory) {
            savedData.playerStats.inventory.forEach(item => {
                if (item.iconPrompt && !item.iconUrl) {
                     generateItemIcon(item.iconPrompt)
                        .then(url => {
                            setPlayerStats(currentStats => {
                                if (!currentStats) return null;
                                const updatedInventory = currentStats.inventory.map(invItem => 
                                    invItem.name === item.name ? { ...invItem, iconUrl: url } : invItem
                                );
                                return { ...currentStats, inventory: updatedInventory };
                            });
                        })
                        .catch(err => console.error("Failed to generate item icon on load:", err));
                }
            });
        }

        const ambiancePrompt = savedData.appState === 'COMBAT' ? `battle, ${savedData.currentImagePrompt}` : savedData.currentImagePrompt;
        audioService.playAmbiance(ambiancePrompt);
        setAppState(savedData.appState);
        
        showToast("Game loaded!");
    }, []);

    const handleItemHover = useCallback(async (item: InventoryItem | null) => {
        if (!item) {
            setActiveItem(null);
            setItemHint(null);
            return;
        }

        if (activeItem?.name === item.name) {
            return;
        }
        
        setActiveItem(item);
        setIsHintLoading(true);
        setItemHint(null);

        try {
            const hint = await getItemUsefulness(item.name, item.description, dialogue);
            setItemHint(hint);
        } catch (err) {
            setItemHint("The arcane energies are too turbulent to discern this item's purpose right now.");
            console.error("Failed to get item usefulness:", err);
        } finally {
            setIsHintLoading(false);
        }

    }, [activeItem, dialogue]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.code === 'Numpad3') {
                handleQuickSave();
            } else if (event.code === 'Numpad7') {
                handleQuickLoad();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleQuickSave, handleQuickLoad]);
    
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
            case 'COMBAT':
            case 'GAME_OVER':
                return (
                    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto">
                        <ImageDisplay imageUrl={imageUrl} isLoading={isImageLoading} />
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-1 flex flex-col gap-8">
                                <PlayerStats stats={playerStats} onOpenInventory={() => setIsInventoryOpen(true)} />
                                {appState === 'COMBAT' && <EnemyStats stats={enemyStats} />}
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
                                    onActionClick={appState === 'COMBAT' ? handleCombatAction : handlePlayerAction}
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
            {toastMessage && (
                <div className="fixed bottom-16 left-1/2 -translate-x-1/2 bg-slate-950/80 backdrop-blur-sm text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in border border-slate-700">
                    {toastMessage}
                </div>
            )}
            <LogModal history={history} isOpen={isLogOpen} onClose={() => setIsLogOpen(false)} />
            <InventoryModal
                isOpen={isInventoryOpen}
                onClose={() => setIsInventoryOpen(false)}
                inventory={playerStats?.inventory || []}
                onItemHover={handleItemHover}
                activeItem={activeItem}
                itemHint={itemHint}
                isHintLoading={isHintLoading}
            />
        </div>
    );
};

export default App;