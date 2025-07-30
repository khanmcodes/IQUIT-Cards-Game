import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaHouseUser } from "react-icons/fa6";

const JoinRoom = ({ onBack, onJoin, roomPreview = null, error = null }) => {
  const [roomCode, setRoomCode] = useState('');

  const handleJoin = () => {
    if (!roomCode.trim()) return;
    onJoin(roomCode);
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
        
        <h1 className="text-2xl md:text-3xl font-bold text-white font-gaming">Join Room</h1>
        
        <div className="w-20"></div> {/* Spacer */}
      </motion.div>

      <div className="max-w-md mx-auto">
        <motion.div 
          className="bg-[#191919] border border-white/20 rounded-xl p-6 md:p-8"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <div className="text-5xl text-blue-500 items-center justify-center flex mb-4">
              <FaHouseUser />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Enter Room Code</h2>
            <p className="text-white/60">Ask the host for the room code to join</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-white/80 mb-2 font-medium">Room Code</label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/20 transition-all text-center text-2xl font-mono tracking-wider"
                placeholder="000"
                maxLength={3}
                autoFocus
              />
            </div>

            {error && (
              <motion.div
                className="p-3 bg-neon-red/20 border border-neon-red/30 rounded-xl text-neon-red text-sm"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.div>
            )}

            <button
              onClick={handleJoin}
              disabled={!roomCode.trim()}
              className="w-full py-4 px-8 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-600/80 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              Join Room
            </button>
          </div>

          {/* Room Preview */}
          {roomPreview && (
            <motion.div 
              className="mt-8 p-4 bg-dark-800/50 rounded-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-white font-semibold mb-3">Room Preview</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-white/60">Room:</span>
                  <span className="text-white">{roomPreview.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Players:</span>
                  <span className="text-white">{roomPreview.players?.length || 0}/{roomPreview.maxPlayers || 4}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Host:</span>
                  <span className="text-white">{roomPreview.host?.name || 'Unknown'}</span>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default JoinRoom; 