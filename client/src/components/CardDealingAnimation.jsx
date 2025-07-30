import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CardDealingAnimation = ({ isDealing, onComplete }) => {
  const cardCount = 5;
  const players = 4; // Assuming 4 players for the animation

  return (
    <AnimatePresence>
      {isDealing && (
        <motion.div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-center">
            <motion.h2 
              className="text-3xl font-bold text-white mb-8"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              Dealing Cards...
            </motion.h2>
            
            <div className="flex justify-center space-x-8">
              {Array.from({ length: players }).map((_, playerIndex) => (
                <div key={playerIndex} className="flex flex-col items-center">
                  <motion.div 
                    className="w-12 h-16 bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg border-2 border-blue-600 mb-2"
                    initial={{ scale: 0, rotateY: 180 }}
                    animate={{ scale: 1, rotateY: 0 }}
                    transition={{ 
                      duration: 0.3, 
                      delay: playerIndex * 0.2,
                      type: "spring",
                      stiffness: 200
                    }}
                  />
                  <div className="text-white/60 text-sm">Player {playerIndex + 1}</div>
                </div>
              ))}
            </div>

            <motion.div 
              className="mt-8 flex justify-center space-x-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              {Array.from({ length: cardCount }).map((_, cardIndex) => (
                <motion.div
                  key={cardIndex}
                  className="w-8 h-10 bg-white rounded border border-gray-300"
                  initial={{ scale: 0, y: 50, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  transition={{ 
                    duration: 0.2, 
                    delay: 1.5 + (cardIndex * 0.1),
                    type: "spring",
                    stiffness: 300
                  }}
                />
              ))}
            </motion.div>

            <motion.button
              className="mt-8 px-6 py-3 bg-neon-blue text-white rounded-lg font-semibold"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.5, duration: 0.5 }}
              onClick={onComplete}
            >
              Start Game
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CardDealingAnimation; 