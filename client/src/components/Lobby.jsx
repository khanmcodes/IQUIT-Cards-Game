import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { FaHouseMedical } from "react-icons/fa6";
import { FaHouseUser } from "react-icons/fa6";

const Lobby = ({ user, onCreateRoom, onJoinRoom, recentRooms = [] }) => {
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  return (
    <div className="min-h-screen p-4 md:p-8 bg-[#0f0f0f]">
      {/* Header */}
      <motion.div 
        className="flex justify-between items-center mb-8"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white font-gaming">IQUIT</h1>
          <p className="text-white/60">Multiplayer Card Game</p>
        </div>
        
        {/* Profile Avatar */}
        <motion.div 
          className="flex items-center border border-white/20 rounded-full"
          whileHover={{ scale: 1.05 }}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full flex items-center justify-center text-white font-bold">
            {user?.username?.charAt(0).toUpperCase() || 'G'}
          </div>
        </motion.div>
      </motion.div>

      {/* Main Actions */}
      <div className="max-w-4xl mx-auto">
        <motion.div 
          className="grid md:grid-cols-2 gap-6 mb-8"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Create Room */}
          <motion.button
            onClick={onCreateRoom}
            className="bg-[#191919] border border-white/20 rounded-xl p-8 text-center group"
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="text-5xl text-green-500 items-center justify-center flex mb-4 group-hover:scale-110 transition-transform duration-300">
              <FaHouseMedical />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Create Room</h3>
            <p className="text-white/60">Start a new game and invite friends</p>
          </motion.button>

          {/* Join Room */}
          <motion.button
            onClick={onJoinRoom}
            className="bg-[#191919] border border-white/20 rounded-xl p-8 text-center group"
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="text-5xl text-blue-500 items-center justify-center flex mb-4 group-hover:scale-110 transition-transform duration-300">
              <FaHouseUser />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Join Room</h3>
            <p className="text-white/60">Enter a room code to join existing game</p>
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default Lobby; 