import React from 'react';
import { motion } from 'framer-motion';

const CardMovement = ({ 
  card, 
  fromPosition, 
  toPosition, 
  onComplete, 
  isVisible = false 
}) => {
  if (!isVisible || !card) return null;

  return (
    <motion.div
      className="fixed z-50 pointer-events-none"
      style={{
        left: fromPosition.x,
        top: fromPosition.y,
      }}
      initial={{ 
        x: 0, 
        y: 0, 
        scale: 1,
        rotateZ: 0
      }}
      animate={{ 
        x: toPosition.x - fromPosition.x, 
        y: toPosition.y - fromPosition.y, 
        scale: 0.8,
        rotateZ: [0, 5, -5, 0]
      }}
      transition={{ 
        duration: 0.8, 
        ease: "easeInOut",
        rotateZ: {
          duration: 0.8,
          times: [0, 0.25, 0.75, 1]
        }
      }}
      onAnimationComplete={onComplete}
    >
      <div className="w-16 h-24 md:w-20 md:h-28 bg-white rounded-xl shadow-card flex flex-col items-center justify-center border-2 border-gray-200">
        <div className={`text-sm md:text-base font-bold ${
          card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-600' : 'text-black'
        }`}>
          {card.rank}
        </div>
        <div className={`text-lg md:text-xl ${
          card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-600' : 'text-black'
        }`}>
          {getSuitSymbol(card.suit)}
        </div>
      </div>
    </motion.div>
  );
};

const getSuitSymbol = (suit) => {
  const symbols = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠'
  };
  return symbols[suit] || '';
};

export default CardMovement; 