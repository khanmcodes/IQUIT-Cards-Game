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
}) => {
  const [showChat, setShowChat] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [quitPhase, setQuitPhase] = useState(null); // 'iquit-text', 'revealing', 'complete'
  const [currentRevealingPlayer, setCurrentRevealingPlayer] = useState(null);
  const [revealedCards, setRevealedCards] = useState({});
  const [roundScores, setRoundScores] = useState({});
  const [autoRevealIndex, setAutoRevealIndex] = useState(0);
  const [sortedCards, setSortedCards] = useState({});
  const [countdown, setCountdown] = useState(3);

  // Debug modal state
  useEffect(() => {
    console.log("showDiscardModal changed to:", showDiscardModal);
  }, [showDiscardModal]);

  // Handle quit data changes
  useEffect(() => {
    if (quitData) {
      setQuitPhase('iquit-text');
      setRevealedCards({});
      setRoundScores({});
      setAutoRevealIndex(0);
      setCountdown(3);
      
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
        setQuitPhase('revealing');
        // Start with the first player who is not the quit player
        const initialQuitPlayerIndex = quitData.all_players.findIndex(p => p.id === quitData.quitPlayer.id);
        const initialNextPlayerIndex = (initialQuitPlayerIndex + 1) % quitData.all_players.length;
        setCurrentRevealingPlayer(quitData.all_players[initialNextPlayerIndex]);
      }, 2000); // 1s fade in + 1s fade out
    }
  }, [quitData, players]);

  // Auto-reveal cards
  useEffect(() => {
    if (quitPhase === 'revealing' && currentRevealingPlayer && sortedCards[currentRevealingPlayer.id]) {
      const playerCards = sortedCards[currentRevealingPlayer.id];
      
      if (autoRevealIndex < playerCards.length) {
        const timer = setTimeout(() => {
          // Reveal the next card
          if (!revealedCards[currentRevealingPlayer.id]) {
            revealedCards[currentRevealingPlayer.id] = [];
          }
          revealedCards[currentRevealingPlayer.id].push(autoRevealIndex);
          setRevealedCards({...revealedCards});
          setAutoRevealIndex(autoRevealIndex + 1);
        }, 800); // Reveal a card every 800ms
        
        return () => clearTimeout(timer);
      } else {
        // All cards revealed for current player, move to next
        setTimeout(() => {
          const currentIndex = quitData.all_players.findIndex(p => p.id === currentRevealingPlayer.id);
          let nextPlayerIndex = (currentIndex + 1) % quitData.all_players.length;
          
          // Skip the quit player
          while (quitData.all_players[nextPlayerIndex].id === quitData.quitPlayer.id) {
            nextPlayerIndex = (nextPlayerIndex + 1) % quitData.all_players.length;
          }
          
          const nextPlayer = quitData.all_players[nextPlayerIndex];
          
          // If we've gone through all non-quit players, complete the round
          if (nextPlayer.id === currentRevealingPlayer.id) {
            setQuitPhase('complete');
          } else {
            setCurrentRevealingPlayer(nextPlayer);
            setAutoRevealIndex(0);
          }
        }, 1000); // Wait 1 second before moving to next player
      }
    }
  }, [quitPhase, currentRevealingPlayer, autoRevealIndex, sortedCards, revealedCards, players, quitData]);

  // Countdown and auto-start next round
  useEffect(() => {
    if (quitPhase === 'complete') {
      const timer = setTimeout(() => {
        if (countdown > 1) {
          setCountdown(countdown - 1);
        } else {
          // Start next round automatically
          if (onStartNextRound) {
            console.log('Auto-starting next round');
            onStartNextRound();
          }
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [quitPhase, countdown, onStartNextRound]);

  const handleRevealCard = (playerId, cardIndex) => {
    // This function is no longer used for manual reveals
    console.log('Manual reveal disabled, using auto-reveal');
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
  console.log("GameScreen render:", {
    players: players.length,
    currentPlayer: currentPlayer?.name,
    turnPlayer: turnPlayer?.name,
    isMyTurn: isMyTurn,
    myHand: myHand.length,
    positions: positions,
    quitPhase: quitPhase,
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
                {quitData.quitPlayer.name} IQUIT at {quitData.quitPlayer.hand?.length || 0}
              </div>
              <div className="text-lg text-white/60">
                {currentRevealingPlayer?.name} is revealing cards...
              </div>
            </div>

            {/* Current revealing player's cards */}
            {currentRevealingPlayer && (
              <div className="text-center">
                <div className="text-lg text-white/80 mb-4">
                  {currentRevealingPlayer.name}'s cards
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {(sortedCards[currentRevealingPlayer.id] || []).map((card, index) => (
                    <motion.div
                      key={index}
                      className={`w-12 h-18 md:w-16 md:h-24 rounded-lg shadow-lg flex flex-col items-center justify-center ${
                        revealedCards[currentRevealingPlayer.id]?.includes(index)
                          ? 'bg-white'
                          : 'bg-blue-800 border-2 border-blue-600'
                      }`}
                      initial={{ scale: 0, rotateY: 180 }}
                      animate={{ 
                        scale: 1, 
                        rotateY: revealedCards[currentRevealingPlayer.id]?.includes(index) ? 0 : 180 
                      }}
                      transition={{ delay: index * 0.1 }}
                    >
                      {revealedCards[currentRevealingPlayer.id]?.includes(index) ? (
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
            <div className="text-center mb-8">
              <div className="text-3xl md:text-4xl font-bold text-white mb-4">
                Round Complete!
              </div>
              <div className="text-lg text-white/60 mb-6">
                Final scores have been calculated
              </div>
            </div>

            {/* Final scores */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {players.map((player) => (
                <motion.div
                  key={player.id}
                  className="bg-black/20 rounded-lg p-4 border border-white/10"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-white font-semibold">{player.name}</div>
                    </div>
                    <div className="text-2xl font-bold text-neon-blue font-numbers">
                      {scores[player.id] || 0}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Countdown */}
            <motion.div
              className="text-center"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-6xl md:text-8xl font-bold text-neon-blue font-numbers mb-4">
                {countdown}
              </div>
              <div className="text-lg text-white/60">
                Starting next round...
              </div>
            </motion.div>
          </motion.div>
        );

      default:
        return null;
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
                                ? "border-blue-500 shadow-[0_0_15px_rgba(255,255,255,0.8)] animate-glow"
                                : "border-gray-200"
                            }`}
                            layout
                            whileHover={{
                              scale: 1.04,
                              y: -2,
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
                              y: 50,
                              opacity: 0,
                            }}
                            animate={{
                              scale: 1,
                              rotateY: 0,
                              y: 0,
                              opacity: 1,
                            }}
                            exit={{
                              scale: 0,
                              rotateY: -180,
                              y: -50,
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
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{
                                delay: 0.6 + index * 0.1,
                                duration: 0.3,
                              }}
                            >
                              {card.rank}
                            </motion.div>
                            <motion.div
                              className={`text-2xl md:text-4xl pl-4 lg:pl-6 lg:pt-1 ${
                                card.suit === "hearts" || card.suit === "diamonds"
                                  ? "text-red-600"
                                  : "text-black"
                              }`}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{
                                delay: 0.7 + index * 0.1,
                                duration: 0.3,
                              }}
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
