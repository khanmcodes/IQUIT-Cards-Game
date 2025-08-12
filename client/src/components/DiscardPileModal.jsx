import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DiscardPileModal = ({ isOpen, discardPile = [], onSelectCard, onClose }) => {
  if (!isOpen || discardPile.length === 0) return null;

  const getSuitSymbol = (suit) => {
    const symbols = {
      hearts: '♥',
      diamonds: '♦',
      clubs: '♣',
      spades: '♠'
    };
    return symbols[suit] || '';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="glass-panel p-6 md:p-8 max-w-4xl w-full relative overflow-hidden"
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <motion.div 
                className="absolute inset-0 bg-gradient-to-br from-neon-blue/20 via-transparent to-neon-purple/20"
                animate={{
                  background: [
                    'linear-gradient(135deg, rgba(0, 212, 255, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
                    'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)',
                    'linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(0, 212, 255, 0.2) 100%)'
                  ]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              ></motion.div>
              <div className="absolute top-0 left-0 w-full h-full opacity-30">
                <div className="w-full h-full bg-gradient-to-br from-white/5 via-transparent to-white/10"></div>
              </div>
            </div>
            <div className="relative z-10">
              <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-white font-gaming mb-3">
                🃏 Pick from Center Pile
              </h2>
              <p className="text-white/60 text-lg">
                Select a card from the center pile to add to your hand
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6 justify-items-center">
              {discardPile.map((card, index) => (
                <motion.div
                  key={`${card.rank}-${card.suit}-${index}`}
                  className="card bg-white border-2 border-white/20 hover:border-neon-blue/50 hover:shadow-neon-glow"
                  whileHover={{ 
                    scale: 1.05, 
                    y: -4,
                    rotateY: 5,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSelectCard(index)}
                  initial={{ scale: 0, rotateY: 180, opacity: 0, y: 20 }}
                  animate={{ scale: 1, rotateY: 0, opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 200,
                    damping: 15
                  }}
                >
                  <motion.div 
                    className={`absolute top-2 left-2 text-lg md:text-xl font-bold font-numbers ${
                      card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-600' : 'text-black'
                    }`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + (index * 0.1), duration: 0.3 }}
                  >
                    {card.rank}
                  </motion.div>
                  <motion.div 
                    className={`text-2xl md:text-3xl ${
                      card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-600' : 'text-black'
                    }`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 + (index * 0.1), duration: 0.3 }}
                  >
                    {getSuitSymbol(card.suit)}
                  </motion.div>
                </motion.div>
              ))}
            </div>

            <div className="flex justify-center space-x-4">
              <motion.button
                onClick={onClose}
                className="px-8 py-4 bg-gradient-to-r from-dark-800 to-dark-700 text-white rounded-xl font-semibold hover:from-dark-700 hover:to-dark-600 border border-white/20 hover:border-neon-blue/50 transition-all duration-300"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.3 }}
              >
                Cancel
              </motion.button>
            </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DiscardPileModal; 