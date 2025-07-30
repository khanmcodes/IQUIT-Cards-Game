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
            className="glass-panel p-6 md:p-8 max-w-2xl w-full"
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Pick from Center Pile
              </h2>
              <p className="text-white/60">
                Select a card from the center pile to add to your hand
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
              {discardPile.map((card, index) => (
                <motion.div
                  key={`${card.rank}-${card.suit}-${index}`}
                  className="w-full aspect-[3/4] bg-white rounded-xl shadow-card flex flex-col items-center justify-center cursor-pointer border-2 border-gray-200 hover:border-neon-blue/50"
                  whileHover={{ 
                    scale: 1.05, 
                    y: -4,
                    rotateY: 5,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSelectCard(index)}
                  initial={{ scale: 0, rotateY: 180, opacity: 0 }}
                  animate={{ scale: 1, rotateY: 0, opacity: 1 }}
                  transition={{ 
                    duration: 0.4, 
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
                className="px-6 py-3 bg-dark-800 text-white rounded-lg font-semibold hover:bg-dark-700"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.3 }}
              >
                Cancel
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DiscardPileModal; 