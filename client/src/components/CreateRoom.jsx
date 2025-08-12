import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LuCopy } from "react-icons/lu";

import { FaHouseMedical } from "react-icons/fa6";

const CreateRoom = ({ onBack, onStartGame, roomCode, players = [], isHost, onGenerateRoom, onKickPlayer, currentUserId, eliminationScore: roomEliminationScore }) => {
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [eliminationScore, setEliminationScore] = useState(100);
  const [customScore, setCustomScore] = useState('');
  const [useCustomScore, setUseCustomScore] = useState(false);
  
  console.log('CreateRoom props:', { isHost, playersCount: players.length, onKickPlayer: !!onKickPlayer, currentUserId });

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    // Show toast notification
  };

  const handleScoreChange = (value) => {
    if (value === 'custom') {
      setUseCustomScore(true);
      setEliminationScore(parseInt(customScore) || 100);
    } else {
      setUseCustomScore(false);
      setEliminationScore(parseInt(value));
    }
  };

  const handleCustomScoreChange = (value) => {
    setCustomScore(value);
    if (useCustomScore) {
      setEliminationScore(parseInt(value) || 100);
    }
  };

  const handleGenerateRoom = () => {
    const finalScore = useCustomScore ? (parseInt(customScore) || 100) : eliminationScore;
    onGenerateRoom(finalScore);
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] p-4 md:p-8">
      {/* Header */}
      <motion.div 
        className="flex flex-col justify-between mb-8"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <button
          onClick={onBack}
          className="flex items-center space-x-2 mb-4 text-white/60 hover:text-white transition-colors"
        >
          <span>←</span>
          <span>Back to Lobby</span>
        </button>
        
        <h1 className="text-2xl md:text-3xl font-bold text-white font-gaming">Create Room</h1>
        
        <div className="w-20"></div> {/* Spacer */}
      </motion.div>

      <div className="max-w-4xl mx-auto">
        <div className={`grid ${roomCode ? 'lg:grid-cols-1' : 'lg:grid-cols-2'} gap-8`}>
          {/* Left Side - Room Settings (Only for host before room is created) */}
          {!roomCode && (
            <motion.div 
              className="bg-[#191919] border border-white/20 rounded-xl p-6"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h2 className="text-xl font-bold text-white mb-6">Room Settings</h2>
              
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <div className="text-5xl text-green-500 items-center justify-center flex mb-4">
                    <FaHouseMedical />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Create New Room</h3>
                  <p className="text-white/60">Set up your game and invite friends</p>
                </div>

                <div>
                  <label className="block text-white/80 mb-2 font-medium">Max Players</label>
                  <select
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-dark-800 border border-white/20 rounded-xl text-white focus:outline-none focus:border-neon-blue focus:ring-2 focus:ring-neon-blue/20 transition-all"
                  >
                    {[2, 3, 4, 5, 6].map(num => (
                      <option key={num} value={num}>{num} Players</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-white/80 mb-2 font-medium">Elimination Score</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={eliminationScore}
                      onChange={(e) => handleScoreChange(e.target.value)}
                      className="w-full sm:w-1/2 px-4 py-3 bg-dark-800 border border-white/20 rounded-xl text-white focus:outline-none focus:border-neon-blue focus:ring-2 focus:ring-neon-blue/20 transition-all"
                    >
                      <option value="50">50</option>
                      <option value="100">100</option>
                      <option value="200">200</option>
                      <option value="custom">Custom</option>
                    </select>
                    {useCustomScore && (
                      <input
                        type="number"
                        value={customScore}
                        onChange={(e) => handleCustomScoreChange(e.target.value)}
                        className="w-full sm:w-1/2 px-4 py-3 bg-dark-800 border border-white/20 rounded-xl text-white focus:outline-none focus:border-neon-blue focus:ring-2 focus:ring-neon-blue/20 transition-all"
                        placeholder="Enter custom score"
                      />
                    )}
                  </div>
                </div>

                <button
                  onClick={handleGenerateRoom}
                  disabled={roomCode}
                  className="w-full py-4 px-8 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-600/80 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                >
                  Generate Room Code
                </button>
              </div>
            </motion.div>
          )}

          {/* Right Side - Room Info & Players */}
          <motion.div 
            className={`space-y-6 ${roomCode ? 'lg:col-span-1' : ''}`}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {/* Room Code */}
            {roomCode && isHost && (
              <motion.div 
                className="bg-[#191919] border border-white/20 rounded-xl p-6"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-lg font-bold text-white mb-4">Room Code</h3>
                <div className="flex items-center space-x-3">
                  <div className="flex-1 px-4 py-3 bg-dark-800 border border-white/20 rounded-xl text-white font-mono text-lg text-center">
                    {roomCode}
                  </div>
                  <button
                    onClick={copyRoomCode}
                    className="text-white text-2xl hover:text-white/80 transition-colors"
                  >
                    <LuCopy />
                  </button>
                </div>
                <p className="text-white/60 text-sm mt-2">Share this code with friends to join</p>
                
                {/* Room Settings Display */}
                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-white/60">Max Players:</span>
                      <span className="text-white ml-2">{maxPlayers}</span>
                    </div>
                    <div>
                      <span className="text-white/60">Elimination Score:</span>
                      <span className="text-white ml-2">{roomEliminationScore}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Players List */}
            <div className="bg-[#191919] border border-white/20 rounded-xl p-6 flex flex-col h-full">
              <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h3 className="text-lg font-bold text-white">Players ({players.length}/{maxPlayers})</h3>
                {isHost && players.length >= 2 && (
                  <button
                    onClick={onStartGame}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-600/80 transition-colors"
                  >
                    Start Game
                  </button>
                )}
              </div>
              
              {/* Game Settings Display */}
              <div className="mb-4 p-3 bg-dark-800/50 rounded-lg flex-shrink-0">
                <div className="text-sm text-white/80">
                  <span className="font-medium">Elimination Score:</span>
                  <span className="text-white ml-2">{roomEliminationScore}</span>
                </div>
              </div>

              <div className="space-y-3 flex-1 scrollable-container max-h-96">
                {console.log('Rendering players:', players.map(p => ({ name: p.name, isHost: p.isHost, id: p.id })))}
                {players.map((player, index) => (
                  <motion.div
                    key={player.id}
                    className="flex items-center justify-between p-3 bg-dark-800/50 rounded-lg"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full flex items-center justify-center text-white font-bold">
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-white font-semibold">
                          {player.name} 
                          {player.id === currentUserId && <span className="text-green-400 ml-1">(You)</span>}
                        </div>
                        <div className="text-white/60 text-sm">
                          {player.isHost ? 'Host' : 'Player'}
                        </div>
                      </div>
                    </div>
                    
                    {isHost && player.id !== currentUserId && (
                      <button 
                        onClick={() => {
                          console.log('Kick button clicked for player:', player.name, 'ID:', player.id);
                          onKickPlayer(player.id);
                        }}
                        className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                      >
                        Kick ({player.name})
                      </button>
                    )}
                  </motion.div>
                ))}

                {players.length === 0 && (
                  <div className="text-center py-8 text-white/40">
                    <div className="text-4xl mb-2">👥</div>
                    <p>Waiting for players to join...</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CreateRoom; 