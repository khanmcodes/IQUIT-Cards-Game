import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DiscardPileModal from "./DiscardPileModal";
import { HiOutlineEmojiHappy } from "react-icons/hi";

const GameScreen = ({
  players = [],
  currentPlayer,
  turnPlayer,
  myHand = [],
  centerPile = [],
  deckCount = 0,
  isMyTurn = false,
  onPlayCards,
  onDrawFromDeck,
  onPickFromDiscard,
  onQuit,
  canQuit = false,
  selectedCards = [],
  onSelectCard,
  pickSource = null,
  pickIndex = null,
  onSetPickSource,
  onConfirmTurn,
  scores = {},
  quitData = null,
  onRevealCard = null,
  onStartNextRound = null,
  revealedCards = {},
  currentRevealingPlayerId = null,
  revealComplete = false,
  onFinishRevealing = null,
}) => {
  const [showChat, setShowChat] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [quitPhase, setQuitPhase] = useState(null); // 'iquit-text', 'quit-reveal', 'revealing', 'complete'
  const [currentRevealingPlayer, setCurrentRevealingPlayer] = useState(null);
  const [roundScores, setRoundScores] = useState({});
  const [autoRevealIndex, setAutoRevealIndex] = useState(0);
  const [sortedCards, setSortedCards] = useState({});
  const [countdown, setCountdown] = useState(3);
  const [revealedPlayers, setRevealedPlayers] = useState(new Set());
  
  // New state variables for manual card revelation
  const [manualRevealMode, setManualRevealMode] = useState(false);
  const [playerTimeout, setPlayerTimeout] = useState(null);
  const [timeoutSeconds, setTimeoutSeconds] = useState(30); // 30 seconds timeout
  const [isCurrentPlayerTurn, setIsCurrentPlayerTurn] = useState(false);
  const [quitPlayerRevealed, setQuitPlayerRevealed] = useState(false);
  const [playerScores, setPlayerScores] = useState({});

  // Debug modal state
  useEffect(() => {
    console.log("showDiscardModal changed to:", showDiscardModal);
  }, [showDiscardModal]);

  // Track quitData changes
  useEffect(() => {
    console.log("quitData changed:", quitData ? 'present' : 'null', 'quitPhase:', quitPhase);
    if (!quitData && quitPhase) {
      console.log("Clearing quit phase state");
      setQuitPhase(null);
      setCurrentRevealingPlayer(null);
      setRoundScores({});
      setAutoRevealIndex(0);
      setSortedCards({});
      setRevealedPlayers(new Set());
      // Clear manual revelation state
      setManualRevealMode(false);
      setPlayerTimeout(null);
      setTimeoutSeconds(30);
      setIsCurrentPlayerTurn(false);
      setQuitPlayerRevealed(false);
      setPlayerScores({});
    }
  }, [quitData, quitPhase]);

  // Handle quit data changes
  useEffect(() => {
    if (quitData) {
      console.log('Quit data received, starting quit phase');
      setQuitPhase('iquit-text');
      setRoundScores({});
      setAutoRevealIndex(0);
      setCountdown(3);
      setRevealedPlayers(new Set());
      // Initialize manual revelation state
      setManualRevealMode(false);
      setPlayerTimeout(null);
      setTimeoutSeconds(30);
      setIsCurrentPlayerTurn(false);
      setQuitPlayerRevealed(false);
      setPlayerScores({});
      console.log('Countdown reset to 3');
      
      // Sort cards for each player in the correct order
      const sorted = {};
      quitData.all_players.forEach(player => {
        if (player.hand && player.hand.length > 0) {
          // Sort cards: J's first, then numbers 0-10, then face cards (K, Q)
          const sortedHand = [...player.hand].sort((a, b) => {
            const getCardValue = (card) => {
              if (card.rank === 'J') return 0;
              if (card.rank === 'K') return 21;
              if (card.rank === 'Q') return 22;
              if (card.rank === 'A') return 1;
              return parseInt(card.rank) || 0;
            };
            return getCardValue(a) - getCardValue(b);
          });
          sorted[player.id] = sortedHand;
        }
      });
      setSortedCards(sorted);
      
      // Start the revelation process after IQUIT text fades
      setTimeout(() => {
        setQuitPhase('quit-reveal');
        // First, auto-reveal the quit player's cards
        console.log('Starting quit player reveal:', quitData.quitPlayer.name);
      }, 2000); // 1s fade in + 1s fade out
    }
  }, [quitData, players]);

  // Auto-reveal quit player's cards first
  useEffect(() => {
    if (quitPhase === 'quit-reveal' && quitData?.quitPlayer) {
      const playerCards = quitData.all_players.find(p => p.id === quitData.quitPlayer.id)?.hand || [];
      
      if (autoRevealIndex < playerCards.length) {
        const timer = setTimeout(() => {
          // Reveal the next card
          if (!revealedCards[quitData.quitPlayer.id]?.includes(autoRevealIndex)) {
            // For quit player auto-reveal, we need to emit the event to server
            if (onRevealCard) {
              onRevealCard(quitData.quitPlayer.id, autoRevealIndex);
            }
          }
          setAutoRevealIndex(autoRevealIndex + 1);
        }, 800); // Reveal a card every 800ms
        
        return () => clearTimeout(timer);
      } else {
        // All quit player cards revealed, calculate score and move to next phase
        setTimeout(() => {
          // Calculate quit player's score
          const quitPlayerCards = quitData.all_players.find(p => p.id === quitData.quitPlayer.id)?.hand || [];
          console.log('[DEBUG] Calculating quit player score for:', quitData.quitPlayer.name, 'Cards:', quitPlayerCards);
          
          const quitPlayerScore = quitPlayerCards.reduce((total, card) => {
            if (card.rank === 'J') return total + 0;
            if (card.rank === 'K') return total + 13;
            if (card.rank === 'Q') return total + 12;
            if (card.rank === 'A') return total + 1;
            return total + (parseInt(card.rank) || 0);
          }, 0);
          
          console.log('[DEBUG] Quit player score calculated:', quitPlayerScore);
          setPlayerScores(prev => ({ ...prev, [quitData.quitPlayer.id]: quitPlayerScore }));
          setQuitPlayerRevealed(true);
          
          // Move to manual revelation phase for non-quit players
          setQuitPhase('revealing');
          // Server will control the revealing order via currentRevealingPlayerId
          console.log('Quit player revealed, waiting for server to start manual reveal phase');
        }, 1000);
      }
    }
  }, [quitPhase, quitData, autoRevealIndex, sortedCards, revealedCards, onRevealCard]);

  // Manual/Auto-reveal cards with timeout system for non-quit players
  useEffect(() => {
    if (quitPhase === 'revealing' && currentRevealingPlayerId && quitPlayerRevealed) {
      const currentRevealingPlayer = players.find(p => p.id === currentRevealingPlayerId);
      if (!currentRevealingPlayer) return;
      
      const playerCards = quitData.all_players.find(p => p.id === currentRevealingPlayerId)?.hand || [];
      const isCurrentPlayer = currentRevealingPlayerId === currentPlayer?.id;
      
      // Check if current player is the one revealing
      setIsCurrentPlayerTurn(isCurrentPlayer);
      
      // Only start timeout for current player if not in manual mode
      if (isCurrentPlayer && !manualRevealMode && !playerTimeout) {
        console.log('Starting timeout for current player:', currentRevealingPlayer.name);
        const timeout = setTimeout(() => {
          console.log('Timeout reached, auto-revealing remaining cards');
          setManualRevealMode(true);
        }, 30000); // Use fixed 30 seconds instead of timeoutSeconds state
        
        setPlayerTimeout(timeout);
        return () => clearTimeout(timeout);
      }
      
      // Auto-reveal logic (only when manual mode is enabled for current player)
      if (manualRevealMode && isCurrentPlayer) {
        console.log('[DEBUG] Auto-reveal logic triggered:', {
          manualRevealMode,
          isCurrentPlayer,
          playerCardsLength: playerCards.length,
          revealedCardsCount: revealedCards[currentRevealingPlayerId]?.length
        });
        
        // Find the next unrevealed card
        const nextUnrevealedIndex = playerCards.findIndex((_, index) => 
          !revealedCards[currentRevealingPlayerId]?.includes(index)
        );
        
        console.log('[DEBUG] Next unrevealed index:', nextUnrevealedIndex);
        
        if (nextUnrevealedIndex !== -1) {
          const timer = setTimeout(() => {
            // Reveal the next unrevealed card
            if (onRevealCard) {
              console.log('[DEBUG] Auto-revealing card at index:', nextUnrevealedIndex);
              onRevealCard(currentRevealingPlayerId, nextUnrevealedIndex);
            }
          }, 800); // Reveal a card every 800ms
          
          return () => clearTimeout(timer);
        } else {
          // All cards have been auto-revealed
          console.log('[DEBUG] All cards auto-revealed for player:', currentRevealingPlayerId);
          // Calculate and store the player's score
          const playerCards = quitData.all_players.find(p => p.id === currentRevealingPlayerId)?.hand || [];
          console.log('[DEBUG] Calculating auto-reveal score for player:', currentRevealingPlayerId, 'Cards:', playerCards);
          
          const playerScore = playerCards.reduce((total, card) => {
            if (card.rank === 'J') return total + 0;
            if (card.rank === 'K') return total + 13;
            if (card.rank === 'Q') return total + 12;
            if (card.rank === 'A') return total + 1;
            return total + (parseInt(card.rank) || 0);
          }, 0);
          
          console.log('[DEBUG] Auto-reveal player score calculated:', playerScore);
          setPlayerScores(prev => ({ ...prev, [currentRevealingPlayerId]: playerScore }));
        }
      }
    }
  }, [quitPhase, currentRevealingPlayerId, revealedCards, players, quitData, manualRevealMode, playerTimeout, currentPlayer, quitPlayerRevealed, onRevealCard]);

  // Monitor playerScores state for debugging
  useEffect(() => {
    console.log('[DEBUG] playerScores state updated:', playerScores);
  }, [playerScores]);

  // Countdown and auto-start next round
  useEffect(() => {
    if (quitPhase === 'complete') {
      console.log('Countdown effect triggered, countdown:', countdown);
      const timer = setTimeout(() => {
        if (countdown > 1) {
          console.log('Decrementing countdown to:', countdown - 1);
          setCountdown(countdown - 1);
        } else {
          // Start next round automatically
          if (onStartNextRound) {
            console.log('Auto-starting next round - calling onStartNextRound');
            onStartNextRound();
          } else {
            console.log('onStartNextRound function is null or undefined');
          }
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [quitPhase, countdown, onStartNextRound]);

  // Timeout countdown for manual revelation
  useEffect(() => {
    if (quitPhase === 'revealing' && 
        isCurrentPlayerTurn && 
        !manualRevealMode && 
        timeoutSeconds > 0) {
      
      const timer = setTimeout(() => {
        setTimeoutSeconds(timeoutSeconds - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [quitPhase, isCurrentPlayerTurn, manualRevealMode, timeoutSeconds]);

  // Call onFinishRevealing when current revealing player's cards are fully revealed
  useEffect(() => {
    const playerCards = quitData?.all_players?.find(p => p.id === currentRevealingPlayerId)?.hand || [];
    console.log('[DEBUG] onFinishRevealing useEffect check:', {
      quitData: !!quitData,
      currentRevealingPlayerId,
      currentPlayerId: currentPlayer?.id,
      isCurrentPlayer: currentRevealingPlayerId === currentPlayer?.id,
      revealedCardsCount: revealedCards[currentRevealingPlayerId]?.length,
      totalCardsCount: playerCards.length,
      shouldCall: quitData && currentRevealingPlayerId && currentRevealingPlayerId === currentPlayer?.id && revealedCards[currentRevealingPlayerId]?.length === playerCards.length
    });
    
    if (
      quitData &&
      currentRevealingPlayerId &&
      currentRevealingPlayerId === currentPlayer?.id &&
      revealedCards[currentRevealingPlayerId]?.length === playerCards.length &&
      onFinishRevealing
    ) {
      console.log('[DEBUG] Calling onFinishRevealing for player:', currentRevealingPlayerId);
      // Add a longer delay so players can see the last card before moving to next player
      setTimeout(() => {
        onFinishRevealing();
      }, 1500); // 1.5 seconds delay
    }
  }, [quitData, currentRevealingPlayerId, currentPlayer, revealedCards, onFinishRevealing]);

  // Handle revealComplete state and transition to complete phase
  useEffect(() => {
    if (revealComplete && quitData) {
      console.log('[DEBUG] revealComplete is true, transitioning to complete phase');
      setQuitPhase('complete');
      setCountdown(3); // Start 3-2-1 countdown
    }
  }, [revealComplete, quitData]);

  // Always set quitPhase to 'revealing' and reset per-player state for each new currentRevealingPlayerId (except for the quitter's auto-reveal)
  useEffect(() => {
    console.log('[DEBUG] useEffect: currentRevealingPlayerId changed:', currentRevealingPlayerId, 'quitPhase:', quitPhase, 'client:', currentPlayer?.name);
    if (
      quitData &&
      currentRevealingPlayerId &&
      quitData.quitPlayer.id !== currentRevealingPlayerId
    ) {
      setQuitPhase('revealing');
      setManualRevealMode(false);
      setPlayerTimeout(null);
      setTimeoutSeconds(30);
      setIsCurrentPlayerTurn(currentRevealingPlayerId === currentPlayer?.id);
      setAutoRevealIndex(0);
    }
  }, [quitData, currentRevealingPlayerId, currentPlayer]);

  const handleRevealCard = (playerId, cardIndex) => {
    console.log('[DEBUG] handleRevealCard called:', {
      playerId,
      cardIndex,
      quitPhase,
      currentRevealingPlayerId,
      currentPlayerId: currentPlayer?.id,
      isCurrentPlayer: currentRevealingPlayerId === currentPlayer?.id,
      manualRevealMode,
      alreadyRevealed: revealedCards[playerId]?.includes(cardIndex)
    });
    
    // Handle manual card revelation
    if (quitPhase === 'revealing' && 
        currentRevealingPlayerId === playerId && 
        currentRevealingPlayerId === currentPlayer?.id &&
        !manualRevealMode) {
      
      console.log('Manual reveal triggered for card index:', cardIndex);
      
      // Clear the timeout since player is actively revealing
      if (playerTimeout) {
        clearTimeout(playerTimeout);
        setPlayerTimeout(null);
      }
      
      // Only reveal if not already revealed
      if (!revealedCards[playerId]?.includes(cardIndex)) {
        // Use the onRevealCard prop to emit the event to server
        if (onRevealCard) {
          console.log('[DEBUG] Emitting onRevealCard to server');
          onRevealCard(playerId, cardIndex);
          
          // Check if this is the last card for this player
          const playerCards = quitData?.all_players?.find(p => p.id === playerId)?.hand || [];
          const currentRevealedCount = (revealedCards[playerId] || []).length + 1;
          if (currentRevealedCount >= playerCards.length) {
            console.log('[DEBUG] Last card revealed for player:', playerId);
            console.log('[DEBUG] Calculating manual reveal score for player:', playerId, 'Cards:', playerCards);
            
            // Add a small delay to ensure all card reveals are processed
            setTimeout(() => {
              // Calculate and store the player's score
              const playerScore = playerCards.reduce((total, card) => {
                if (card.rank === 'J') return total + 0;
                if (card.rank === 'K') return total + 13;
                if (card.rank === 'Q') return total + 12;
                if (card.rank === 'A') return total + 1;
                return total + (parseInt(card.rank) || 0);
              }, 0);
              
              console.log('[DEBUG] Manual reveal player score calculated:', playerScore);
              setPlayerScores(prev => ({ ...prev, [playerId]: playerScore }));
            }, 500); // 500ms delay to ensure all reveals are processed
          }
        } else {
          console.log('[DEBUG] onRevealCard prop is null!');
        }
      } else {
        console.log('[DEBUG] Card already revealed, skipping');
      }
    } else {
      console.log('[DEBUG] handleRevealCard conditions not met');
    }
  };

  const handleAutoReveal = () => {
    if (quitPhase === 'revealing' && 
        currentRevealingPlayerId === currentPlayer?.id &&
        !manualRevealMode) {
      
      console.log('Auto-reveal button clicked');
      
      // Clear the timeout
      if (playerTimeout) {
        clearTimeout(playerTimeout);
        setPlayerTimeout(null);
      }
      
      // Enable auto-reveal mode
      setManualRevealMode(true);
    }
  };

  const getPlayerPositions = () => {
    // Use the current player's ID to determine positioning
    const currentUserId = currentPlayer?.id;
    const others = players.filter((p) => p.id !== currentUserId);

    // Sort others by their original order in the players array for consistent positioning
    const sortedOthers = others.sort((a, b) => {
      const aIndex = players.findIndex((p) => p.id === a.id);
      const bIndex = players.findIndex((p) => p.id === b.id);
      return aIndex - bIndex;
    });

    if (players.length === 2) {
      return { top: [sortedOthers[0]], left: [], right: [] };
    } else if (players.length === 3) {
      return {
        top: [sortedOthers[0]],
        left: [sortedOthers[1]],
        right: [],
      };
    } else if (players.length === 4) {
      return {
        top: [sortedOthers[0]],
        left: [sortedOthers[1]],
        right: [sortedOthers[2]],
      };
    } else if (players.length >= 5) {
      return {
        top: [sortedOthers[0], sortedOthers[1]],
        left: [sortedOthers[2]],
        right: [sortedOthers[3]],
      };
    }
    return { top: [], left: [], right: [] };
  };

  const positions = getPlayerPositions();

  // Debug logging
  console.log('[DEBUG] GameScreen render:', {
    currentPlayer: currentPlayer?.name,
    isMyTurn: isMyTurn,
    myHand: myHand.length,
    players: players.length,
    quitData: quitData ? 'present' : 'null',
    quitPhase,
    currentRevealingPlayerId,
    revealComplete
  });

  const handlePickFromCenterPile = () => {
    if (centerPile.length === 1) {
      onPickFromDiscard(0);
    } else if (centerPile.length > 1) {
      setShowDiscardModal(true);
    }
  };

  const handleCenterPileCardSelect = (cardIndex) => {
    onPickFromDiscard(cardIndex);
    setShowDiscardModal(false);
  };

  // Render quit phase content
  const renderQuitContent = () => {
    console.log('[DEBUG] renderQuitContent called with quitPhase:', quitPhase, 'quitData:', quitData ? 'present' : 'null');
    if (!quitData) return null;

    switch (quitPhase) {
      case 'iquit-text':
        return (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            <motion.div
              className="text-center"
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="text-6xl md:text-8xl font-bold text-red-500 mb-4 font-gaming">
                IQUIT
              </div>
              <div className="text-xl md:text-2xl text-white/80 font-medium">
                {quitData.quitPlayer.name}
              </div>
            </motion.div>
          </motion.div>
        );

      case 'quit-reveal':
        return (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-8">
              <div className="text-2xl md:text-3xl font-bold text-white mb-2">
                {quitData.quitPlayer.name} IQUIT at {quitData.quitPlayer.hand?.reduce((total, card) => {
                  const faceVal = {
                    'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
                    '10': 10, 'J': 0, 'Q': 20, 'K': 20
                  };
                  return total + faceVal[card.rank];
                }, 0) || 0}
              </div>
              <div className="text-lg text-white/60">
                Revealing {quitData.quitPlayer.name}'s cards...
              </div>
            </div>

            {/* Quit player's cards being auto-revealed */}
            <div className="text-center">
              <div className="text-lg text-white/80 mb-4">
                {quitData.quitPlayer.name}'s cards
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {(quitData.all_players.find(p => p.id === quitData.quitPlayer.id)?.hand || []).map((card, index) => (
                  <motion.div
                    key={index}
                    className={`w-12 h-18 md:w-16 md:h-24 rounded-lg shadow-lg flex flex-col items-center justify-center transition-all ${
                      revealedCards[quitData.quitPlayer.id]?.includes(index)
                        ? 'bg-white'
                        : 'bg-blue-800 border-2 border-blue-600'
                    }`}
                    initial={{ scale: 0, rotateY: 180 }}
                    animate={{ 
                      scale: 1, 
                      rotateY: revealedCards[quitData.quitPlayer.id]?.includes(index) ? 0 : 180 
                    }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {revealedCards[quitData.quitPlayer.id]?.includes(index) ? (
                      <>
                        <div className={`text-sm md:text-lg font-bold font-numbers ${
                          card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-600' : 'text-black'
                        }`}>
                          {card.rank}
                        </div>
                        <div className={`text-lg md:text-xl ${
                          card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-600' : 'text-black'
                        }`}>
                          {getSuitSymbol(card.suit)}
                        </div>
                      </>
                    ) : (
                      <div className="text-white text-lg md:text-2xl">🂠</div>
                    )}
                  </motion.div>
                ))}
              </div>
              
              {/* Show quit player's total score when all cards are revealed */}
              {revealedCards[quitData.quitPlayer.id]?.length === (quitData.all_players.find(p => p.id === quitData.quitPlayer.id)?.hand || []).length && (
                <motion.div
                  className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="text-lg text-white font-semibold">
                    {quitData.quitPlayer.name}'s total hand value: 
                    <span className="text-red-400 font-bold ml-2">
                      {quitData.quitPlayer.hand?.reduce((total, card) => {
                        const faceVal = {
                          'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
                          '10': 10, 'J': 0, 'Q': 20, 'K': 20
                        };
                        return total + faceVal[card.rank];
                      }, 0) || 0}
                    </span>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        );

      case 'revealing':
        return (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-8">
              <div className="text-2xl md:text-3xl font-bold text-white mb-2">
                {quitData.all_players.find(p => p.id === currentRevealingPlayerId)?.name} is revealing cards...
              </div>
              
              {/* Manual revelation controls for current player */}
              {isCurrentPlayerTurn && !manualRevealMode && (
                <div className="mt-4 space-y-3">
                  <div className="text-sm text-white/80">
                    Click on your cards to reveal them one by one
                  </div>
                  
                  {/* Timeout display */}
                  <div className="flex items-center justify-center space-x-2">
                    <div className="text-lg font-bold text-neon-blue font-numbers">
                      {timeoutSeconds}
                    </div>
                    <div className="text-sm text-white/60">
                      seconds remaining
                    </div>
                  </div>
                  
                  {/* Auto-reveal button */}
                  <motion.button
                    onClick={handleAutoReveal}
                    className="px-4 py-2 bg-neon-blue text-white rounded-lg font-bold hover:bg-blue-500 transition-colors text-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Auto-Reveal All Cards
                  </motion.button>
                </div>
              )}
              
              {/* Auto-reveal mode indicator */}
              {manualRevealMode && (
                <div className="mt-4 text-sm text-white/60">
                  Auto-revealing cards...
                </div>
              )}
            </div>

            {/* Current revealing player's cards */}
            {currentRevealingPlayerId && (
              <div className="text-center">
                <div className="text-lg text-white/80 mb-4">
                  {quitData.all_players.find(p => p.id === currentRevealingPlayerId)?.name}'s cards
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {(quitData.all_players.find(p => p.id === currentRevealingPlayerId)?.hand || []).map((card, index) => (
                    <motion.div
                      key={index}
                      className={`w-12 h-18 md:w-16 md:h-24 rounded-lg shadow-lg flex flex-col items-center justify-center cursor-pointer transition-all ${
                        revealedCards[currentRevealingPlayerId]?.includes(index)
                          ? 'bg-white'
                          : isCurrentPlayerTurn && !manualRevealMode
                          ? 'bg-blue-800 border-2 border-blue-400 hover:border-blue-300 hover:bg-blue-700'
                          : 'bg-blue-800 border-2 border-blue-600'
                      }`}
                      initial={{ scale: 0, rotateY: 180 }}
                      animate={{ 
                        scale: 1, 
                        rotateY: revealedCards[currentRevealingPlayerId]?.includes(index) ? 0 : 180 
                      }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleRevealCard(currentRevealingPlayerId, index)}
                      style={{
                        cursor: isCurrentPlayerTurn && !manualRevealMode && !revealedCards[currentRevealingPlayerId]?.includes(index) 
                          ? 'pointer' 
                          : 'default'
                      }}
                    >
                      {revealedCards[currentRevealingPlayerId]?.includes(index) ? (
                        <>
                          <div className={`text-sm md:text-lg font-bold font-numbers ${
                            card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-600' : 'text-black'
                          }`}>
                            {card.rank}
                          </div>
                          <div className={`text-lg md:text-xl ${
                            card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-600' : 'text-black'
                          }`}>
                            {getSuitSymbol(card.suit)}
                          </div>
                        </>
                      ) : (
                        <div className="text-white text-lg md:text-2xl">🂠</div>
                      )}
                    </motion.div>
                  ))}
                </div>
                
                {/* Show current player's total score when all cards are revealed */}
                {revealedCards[currentRevealingPlayerId]?.length === (quitData.all_players.find(p => p.id === currentRevealingPlayerId)?.hand || []).length && (
                  <motion.div
                    className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="text-lg text-white font-semibold">
                      {quitData.all_players.find(p => p.id === currentRevealingPlayerId)?.name}'s total hand value: 
                      <span className="text-blue-400 font-bold ml-2">
                        {playerScores[currentRevealingPlayerId] || 0}
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        );

      case 'complete':
        return (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-white mb-6">
                Round Summary
              </div>
              
              {/* Show score changes based on quit result */}
              <div className="space-y-4">
                {(() => {
                  console.log('[DEBUG] Full quitData in summary:', quitData);
                  console.log('[DEBUG] quitData.quit_result:', quitData?.quit_result);
                  console.log('[DEBUG] quitData.quitResult:', quitData?.quitResult);
                  
                  // Try both possible property names
                  const quitResult = quitData?.quit_result || quitData?.quitResult;
                  const isSuccessfulQuit = quitResult?.success;
                  console.log('[DEBUG] Summary calculation:', {
                    quitResult,
                    isSuccessfulQuit,
                    quitPlayer: quitData?.quitPlayer?.name,
                    allPlayers: quitData?.all_players?.map(p => ({ name: p.name, id: p.id }))
                  });
                  
                  const scoreChanges = [];
                  
                  // Let me also check the message to see what type of quit it was
                  const quitMessage = quitResult?.message || '';
                  console.log('[DEBUG] Quit message:', quitMessage);
                  
                  // Check if it's a successful quit by looking at the message
                  const isSuccessfulByMessage = quitMessage.includes('had the lowest value');
                  console.log('[DEBUG] Is successful by message:', isSuccessfulByMessage);
                  
                  // Use the success field directly since we know it's working
                  const isSuccessful = quitResult?.success === true;
                  console.log('[DEBUG] Is successful by success field:', isSuccessful);
                  
                  if (isSuccessful) {
                    // Successful quit: all non-quitters get their hand values as score
                    quitData.all_players.forEach(player => {
                      if (player.id !== quitData.quitPlayer.id) {
                        // Use same card value calculation as server
                        const faceVal = {
                          'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
                          '10': 10, 'J': 0, 'Q': 20, 'K': 20
                        };
                        const handValue = player.hand.reduce((sum, card) => sum + faceVal[card.rank], 0);
                        console.log('[DEBUG] Adding score for successful quit:', player.name, handValue);
                        scoreChanges.push({ playerId: player.id, playerName: player.name, scoreChange: handValue });
                      }
                    });
                    
                    // Also show the quit player's hand value (but not as a score change)
                    const quitPlayerHandValue = quitData.quitPlayer.hand.reduce((sum, card) => {
                      const faceVal = {
                        'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
                        '10': 10, 'J': 0, 'Q': 20, 'K': 20
                      };
                      return sum + faceVal[card.rank];
                    }, 0);
                    console.log('[DEBUG] Quit player hand value:', quitData.quitPlayer.name, quitPlayerHandValue);
                  } else {
                    // Failed quit: only quitter gets 25 penalty
                    console.log('[DEBUG] Adding penalty for failed quit:', quitData.quitPlayer.name, 25);
                    scoreChanges.push({ 
                      playerId: quitData.quitPlayer.id, 
                      playerName: quitData.quitPlayer.name, 
                      scoreChange: 25 
                    });
                  }
                  
                  console.log('[DEBUG] Final score changes:', scoreChanges);
                  
                  return scoreChanges.map(({ playerId, playerName, scoreChange }) => (
                    <div key={playerId} className="p-3 bg-gray-800/50 rounded-lg">
                      <div className="text-lg text-white">
                        {playerName}: <span className="text-yellow-400 font-bold">+{scoreChange}</span>
                      </div>
                    </div>
                  ));
                })()}
              </div>
              
              {/* Countdown to next round */}
              <div className="mt-8">
                <div className="text-lg text-white/80 mb-2">
                  Starting next round in:
                </div>
                <div className="text-4xl font-bold text-neon-blue font-numbers">
                  {countdown}
                </div>
              </div>
            </div>
          </motion.div>
        );

      default:
        console.log('[DEBUG] Unknown quitPhase:', quitPhase);
        return (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-4">
                Loading...
              </div>
              <div className="text-sm text-white/60">
                quitPhase: {quitPhase}
              </div>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="h-screen bg-gaming-gradient relative overflow-hidden">
      {/* Main Game Area */}
      <div className="relative h-[95%] m-4 flex items-center justify-center bg-graydiant rounded-[2.5rem]">
        <motion.div
          className="fixed top-5 left-0 right-0 z-30 px-8 py-3 md:px-6 md:py-4"
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="p-3 md:p-4">
            <div className="flex justify-between items-center">
              <div className="flex flex-col space-y-2">
                {/* Left Section - Turn Info */}
                <div className="flex items-center bg-black/60 px-2 py-1 rounded-lg opacity-80">
                  <motion.div
                    className="flex items-center space-x-2"
                    key={turnPlayer?.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="w-2 h-2 md:w-3 md:h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-white/80 text-xs md:text-sm font-medium">
                      TURN
                    </span>
                    <span className="text-white font-bold text-sm md:text-base">
                      {turnPlayer?.name || "Unknown"}
                    </span>
                  </motion.div>
                
                </div>
                {/* Center Section - Scoreboard */}
                <motion.div
                  className="flex items-center space-x-2"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <div className="flex items-center space-x-2">
                    {players.slice(0, 4).map((player, index) => (
                      <motion.div
                        key={player.id}
                        className="flex items-center space-x-2 bg-black/20 rounded-lg px-3 py-1.5 border border-white/10"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                      >
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {player.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-white font-bold text-sm font-numbers">
                          {scores[player.id] || 0}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Right Section - Game Info */}
              <div className="flex items-center">
                <motion.button
                  onClick={() => setShowChat(!showChat)}
                  className="p-2 md:p-2.5 bg-green-600 hover:bg-green-500 rounded-full opacity-80 text-white transition-colors text-sm md:text-base"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <HiOutlineEmojiHappy className="text-white text-2xl" />
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="h-[65%] w-[85%] flex flex-col items-center justify-center bg-gradient-to-b from-[#227e36] via-[#2AAD4B] to-[#227e36] border-[20px] border-[#161B1D] shadow-[10px_5px_30px_2px_rgba(0,0,0,0.6)] rounded-[5rem]">
          {/* Quit Phase Overlay */}
          <AnimatePresence>
            {quitPhase && renderQuitContent()}
          </AnimatePresence>

          {/* Normal Game Content - Hidden during quit phases */}
          {!quitPhase && (
            <>
              {/* Opponent Players - Responsive Layout */}
              <div className="absolute inset-2 pointer-events-none">
                {/* Top Players */}
                <div className="absolute top-40 md:top-4 left-1/2 transform -translate-x-1/2 z-10">
                  {positions.top &&
                    positions.top.map((player, index) => (
                      <motion.div
                        key={player?.id || index}
                        className="mb-2 md:mb-4"
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      >
                        <PlayerCard
                          player={player}
                          isCurrentTurn={turnPlayer?.id === player?.id}
                        />
                      </motion.div>
                    ))}
                </div>
                {/* Left Players - Hidden on mobile */}
                <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 z-10">
                  {positions.left &&
                    positions.left.map((player, index) => (
                      <motion.div
                        key={player?.id || index}
                        className="mb-4"
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      >
                        <PlayerCard
                          player={player}
                          isCurrentTurn={turnPlayer?.id === player?.id}
                          vertical
                        />
                      </motion.div>
                    ))}
                </div>
                {/* Right Players - Hidden on mobile */}
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10">
                  {positions.right &&
                    positions.right.map((player, index) => (
                      <motion.div
                        key={player?.id || index}
                        className="mb-4"
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      >
                        <PlayerCard
                          player={player}
                          isCurrentTurn={turnPlayer?.id === player?.id}
                          vertical
                        />
                      </motion.div>
                    ))}
                </div>
              </div>
              {/* Center Game Area - Mobile Optimized */}
              <motion.div
                className="absolute top-[40%] left-1/2 right-1/2 transform -translate-x-1/2 -translate-y-1/2 z-5 pointer-events-auto"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="flex flex-col md:flex-row items-center space-y-3 md:space-y-0 md:space-x-6 lg:space-x-8">
                  {/* Deck */}
                  <div className="text-center">
                    <motion.div
                      className={`w-10 h-14 lg:w-16 lg:h-[84px] bg-blue-800 border-2 rounded-lg lg:rounded-xl shadow-neon flex items-center justify-center cursor-pointer relative overflow-hidden ${
                        pickSource === "deck"
                          ? "border-white shadow-[0_0_15px_rgba(255,255,255,0.8)] animate-glow"
                          : "border-blue-600"
                      }`}
                      whileHover={{
                        scale: 1.08,
                        rotateY: 5,
                        transition: { duration: 0.2 },
                      }}
                      whileTap={{ scale: 0.95 }}
                      onClick={isMyTurn ? onDrawFromDeck : undefined}
                      initial={{
                        scale: 0,
                        rotateY: 180,
                        y: 50,
                        opacity: 0,
                      }}
                      animate={{
                        scale: 1,
                        rotateY: 0,
                        y: 0,
                        opacity: 1,
                      }}
                      transition={{
                        duration: 0.4,
                        delay: 0.2,
                        type: "spring",
                        stiffness: 200,
                        damping: 15,
                      }}
                    >
                      <motion.div className="absolute inset-0 bg-blue-600/20" />
                      <motion.div
                        className="text-white text-lg md:text-2xl font-bold"
                        animate={{
                          scale: [1, 1.1, 1],
                          rotateY: [0, 5, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        🂠
                      </motion.div>
                      <motion.div
                        className="absolute bottom-0.5 right-0.5 md:bottom-1 md:right-1 text-white/80 text-xs font-bold font-numbers"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                      >
                        {deckCount}
                      </motion.div>
                    </motion.div>
                    <motion.div
                      className="text-white/70 font-semibold mt-1 md:mt-2 text-xs md:text-sm"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      Deck
                    </motion.div>
                  </div>
                  {/* Center Pile */}
                  <div className="text-center">
                    <div className="flex flex-row gap-1 justify-center max-w-32 md:max-w-40">
                      {centerPile.length === 0 ? (
                        <motion.div
                          className="w-10 h-14 lg:w-16 lg:h-[84px] border-white font-sans rounded-lg lg:rounded-xl shadow-card flex flex-col items-center justify-center cursor-pointer border-2"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5, delay: 0.3 }}
                        >
                        </motion.div>
                      ) : (
                        centerPile.map((card, index) => (
                          <motion.div
                            key={`center-pile-${card.rank}-${card.suit}-${index}-${centerPile.length}`}
                            className={`w-10 h-14 lg:w-16 lg:h-[84px] bg-white font-sans rounded-lg lg:rounded-xl shadow-card flex flex-col items-center justify-center cursor-pointer border-2 ${
                              pickSource === "discard" && pickIndex === index
                                ? "border-neon-blue shadow-neon-glow"
                                : "hover:border-neon-blue/50"
                            }`}
                            layout
                            whileHover={{
                              scale: 1.04,
                              y: -4,
                              rotateY: 5,
                              transition: { duration: 0.2 },
                            }}
                            whileTap={{ scale: 0.95 }}
                            onClick={
                              isMyTurn
                                ? () => {
                                    console.log(
                                      "Pile card clicked, centerPile length:",
                                      centerPile.length
                                    );
                                    if (centerPile.length === 1) {
                                      console.log(
                                        "Single card, calling onPickFromDiscard(0)"
                                      );
                                      onPickFromDiscard(0);
                                    } else if (centerPile.length > 1) {
                                      console.log(
                                        "Multiple cards, setting showDiscardModal to true"
                                      );
                                      setShowDiscardModal(true);
                                    }
                                  }
                                : undefined
                            }
                            initial={{
                              scale: 0,
                              rotateY: 180,
                              y: 100,
                              opacity: 0,
                            }}
                            animate={{
                              scale: pickSource === "discard" && pickIndex === index ? 1.1 : 1,
                              rotateY: 0,
                              y: pickSource === "discard" && pickIndex === index ? -8 : 0,
                              opacity: 1,
                            }}
                            exit={{
                              scale: 0,
                              rotateY: -180,
                              y: -100,
                              opacity: 0,
                            }}
                            transition={{
                              duration: 0.4,
                              type: "spring",
                              stiffness: 200,
                              damping: 15,
                            }}
                          >
                            <motion.div
                              className={`text-base md:text-2xl font-medium pr-4 lg:pr-6 pt-1 lg:pb-1 font-numbers ${
                                card.suit === "hearts" || card.suit === "diamonds"
                                  ? "text-red-600"
                                  : "text-black"
                              }`}
                              transition={{ duration: 0.2 }}
                            >
                              {card.rank}
                            </motion.div>
                            <motion.div
                              className={`text-2xl md:text-4xl pl-4 lg:pl-6 lg:pt-1 ${
                                card.suit === "hearts" || card.suit === "diamonds"
                                  ? "text-red-600"
                                  : "text-black"
                              }`}
                              transition={{ duration: 0.2 }}
                            >
                              {getSuitSymbol(card.suit)}
                            </motion.div>
                          </motion.div>
                        ))
                      )}
                    </div>
                    <motion.div
                      className="text-white/70 font-semibold mt-1 md:mt-2 text-xs md:text-sm text-center"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                    >
                      Pile
                    </motion.div>
                  </div>
                </div>
              </motion.div>
              {/* My Hand - Enhanced Hierarchy */}
              <motion.div
                className="absolute bottom-[20%] md:bottom-[15%] left-0 right-0 z-10 p-3 md:p-4"
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div className="p-4 md:p-6">
                  {/* Cards - Responsive Grid */}
                  <div className="flex flex-wrap gap-1.5 md:gap-2 lg:gap-3 justify-center mb-4 md:mb-6">
                    {myHand.length === 0 ? (
                      <motion.div
                        className="text-white/60 text-center py-6 md:py-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <motion.div
                          className="text-3xl md:text-4xl mb-2"
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        >
                          🃏
                        </motion.div>
                        <div className="text-xs md:text-sm">Empty</div>
                      </motion.div>
                    ) : (
                      myHand.map((card, index) => (
                        <motion.div
                          key={`${card.rank}-${card.suit}-${index}-${myHand.length}`}
                          className={`w-10 h-14 lg:w-16 lg:h-[84px] bg-white font-sans rounded-lg lg:rounded-xl shadow-card flex flex-col items-center justify-center cursor-pointer border-2 ${
                            selectedCards.includes(index)
                              ? "border-neon-blue shadow-neon-glow"
                              : "hover:border-neon-blue/50"
                          }`}
                          layout
                          whileHover={{
                            scale: 1.04,
                            y: -4,
                            rotateY: 5,
                            transition: { duration: 0.2 },
                          }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onSelectCard(index)}
                          initial={{
                            scale: 0,
                            rotateY: 180,
                            y: 100,
                            opacity: 0,
                          }}
                          animate={{
                            scale: selectedCards.includes(index) ? 1.1 : 1,
                            rotateY: 0,
                            y: selectedCards.includes(index) ? -8 : 0,
                            opacity: 1,
                          }}
                          exit={{
                            scale: 0,
                            rotateY: -180,
                            y: -100,
                            opacity: 0,
                          }}
                          transition={{
                            duration: 0.4,
                            type: "spring",
                            stiffness: 200,
                            damping: 15,
                          }}
                        >
                          <motion.div
                            className={`text-base md:text-2xl font-medium pr-4 lg:pr-6 pt-1 lg:pb-1 font-numbers ${
                              card.suit === "hearts" || card.suit === "diamonds"
                                ? "text-red-600"
                                : "text-black"
                            }`}
                            transition={{ duration: 0.2 }}
                          >
                            {card.rank}
                          </motion.div>
                          <motion.div
                            className={`text-2xl md:text-4xl pl-4 lg:pl-6 lg:pt-1 ${
                              card.suit === "hearts" || card.suit === "diamonds"
                                ? "text-red-600"
                                : "text-black"
                            }`}
                            transition={{ duration: 0.2 }}
                          >
                            {getSuitSymbol(card.suit)}
                          </motion.div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </div>

      {/* Action Buttons - Enhanced Hierarchy */}
      {isMyTurn && !quitPhase && (
        <motion.div
          className="absolute bottom-[9%] md:bottom-[7%] left-0 right-0 z-10 px-8 py-3 md:px-6 md:py-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {/* Action Selection */}
          <div className="flex justify-center space-x-8">

          {/* Quit Action */}
            <div className="flex justify-center">
              <motion.button
                onClick={onQuit}
                disabled={!canQuit}
                className={`px-4 py-4 rounded-full bg-red-600 font-bold text-sm md:text-base transition-all ${
                  canQuit
                    ? "shadow-lg shadow-red-600/30 hover:bg-red-500"
                    : "opacity-50 cursor-not-allowed"
                }`}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                <img 
                  src="/playButton.png" 
                  alt="IQuit" 
                  className="h-6 md:h-8 w-auto invert"
                />
              </motion.button>
            </div>

            {/* Play Action */}
            <div className="flex justify-center">
              <motion.button
                onClick={onConfirmTurn}
                disabled={selectedCards.length === 0 || !pickSource}
                className={`px-4 py-4 rounded-full bg-green-600 font-bold text-sm md:text-base transition-all ${
                  selectedCards.length > 0 && pickSource
                    ? "shadow-lg shadow-green-600/30 hover:bg-green-500"
                    : "opacity-50 cursor-not-allowed"
                }`}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                <img 
                  src="/playButton.png" 
                  alt="Play Cards" 
                  className="h-6 md:h-8 w-auto invert"
                />
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Chat Panel - Mobile Optimized */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            className="absolute top-16 md:top-20 right-2 md:right-4 z-30 w-64 md:w-80 h-64 md:h-96 glass-panel p-3 md:p-4"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
          >
            <div className="flex justify-between items-center mb-3 md:mb-4">
              <h3 className="text-white font-semibold text-sm md:text-base">
                Chat
              </h3>
              <button
                onClick={() => setShowChat(false)}
                className="text-white/60 hover:text-white text-lg"
              >
                ×
              </button>
            </div>
            <div className="h-48 md:h-64 bg-dark-800 rounded-lg p-2 md:p-3 mb-2 md:mb-3 overflow-y-auto">
              <div className="text-white/60 text-xs md:text-sm">
                Chat coming soon...
              </div>
            </div>
            <input
              type="text"
              placeholder="Type a message..."
              className="w-full px-2 py-1.5 md:px-3 md:py-2 bg-dark-800 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-neon-blue text-xs md:text-sm"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Center Pile Selection Modal */}
      <DiscardPileModal
        isOpen={showDiscardModal}
        discardPile={centerPile}
        onSelectCard={handleCenterPileCardSelect}
        onClose={() => setShowDiscardModal(false)}
      />
    </div>
  );
};

// Player Card Component - Enhanced Hierarchy
const PlayerCard = ({ player, isCurrentTurn, vertical = false }) => {
  // Safety check for player data
  if (!player || !player.name) {
    return (
      <motion.div
        className={`p-3 md:p-4 ${
          vertical ? "w-28 md:w-36" : "w-32 md:w-44"
        }`}
      >
        <div className="text-center">
          <div className="text-white/60 text-sm">Loading...</div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`p-3 md:p-4 ${vertical ? "w-28 md:w-36" : "w-32 md:w-44"}`}
    >
      <div
        className={`text-center ${
          vertical ? "space-y-2 md:space-y-3" : "space-y-2"
        }`}
      >
        <div
          className={`w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mx-auto text-sm md:text-base shadow-lg ${
            isCurrentTurn ? "border-2 border-white" : ""
          }`}
        >
          {player.name.charAt(0).toUpperCase()}
        </div>

        <div className="flex items-center justify-center">
          {isCurrentTurn && (
            <motion.div
              className="flex items-center justify-center mr-2"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="w-2 h-2 bg-blue-400 rounded-full"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
            </motion.div>
          )}
          <div className="text-white/60 font-sans font-bold text-xs md:text-sm truncate">
            {player.name}
          </div>
        </div>
        <div className="flex items-center justify-center">
          <div className="relative">
            {/* Folded cards stack */}
            {player.hand && player.hand.length > 0 ? (
              <div className="absolute bottom-9 left-2 flex -space-x-3">
                {player.hand
                  .slice(0, Math.min(5, player.hand.length))
                  .map((card, index) => (
                    <motion.div
                      key={`${player.id}-card-${index}`}
                      className="w-6 h-8 md:w-8 md:h-12 p-px md:p-[2px] bg-white rounded-[2px] sm:rounded-[4px] shadow-[0_1px_4px_0.5px_rgba(0,0,0,0.5)] md:shadow-[0_2px_8px_1px_rgba(0,0,0,1)] relative overflow-hidden"
                      style={{
                        transform: `rotate(${index * 2}deg)`,
                        zIndex: index,
                      }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <img 
                        src="/cardBack.png" 
                        alt="Card Back" 
                        className="w-full h-full object-cover rounded-[2px] sm:rounded-[4px]"
                      />
                    </motion.div>
                  ))}
              </div>
            ) : (
              <div className="w-6 h-8 md:w-8 md:h-12 bg-gray-800 rounded border border-gray-600 shadow-sm flex items-center justify-center">
                <span className="text-white/40 text-xs">0</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Helper function for suit symbols
const getSuitSymbol = (suit) => {
  const symbols = {
    hearts: "♥",
    diamonds: "♦",
    clubs: "♣",
    spades: "♠",
  };
  return symbols[suit] || "";
};

export default GameScreen;
