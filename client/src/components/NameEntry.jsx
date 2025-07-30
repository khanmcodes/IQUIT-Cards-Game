import React, { useState } from 'react';
import { motion } from 'framer-motion';

const NameEntry = ({ onEnter }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onEnter(name.trim());
  };

  return (
    <div className="h-screen flex items-center justify-center p-4 shadow-[0_0_50px_rgba(0,0,0,1)_inset]">
      <motion.div
        className=" p-8 rounded-[3.5rem] w-full h-full bg-[#191919] border border-white/20 flex flex-col justify-center items-center"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8 items-center justify-center flex flex-col">
          <h1 className="text-5xl md:text-5xl font-bold text-white animate-pulse font-gaming mb-1">IQUIT</h1>
          <img src="/gameStart.png" alt="Iquit" className="w-28 h-28 lg:w-40 lg:h-40 invert" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-white/80 mb-3 font-medium text-lg">Enter Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-6 py-4 bg-black/50 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-neon-green focus:ring-2 focus:ring-neon-green/20 transition-all text-center text-xl"
              placeholder="Your name here..."
              maxLength={20}
              autoFocus
              required
            />
          </div>

          <motion.button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-4 px-8 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-600/80 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            whileHover={name.trim() ? { scale: 1.02 } : {}}
            whileTap={name.trim() ? { scale: 0.98 } : {}}
          >
            Enter Game
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default NameEntry; 