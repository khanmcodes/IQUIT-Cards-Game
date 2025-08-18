import React from 'react';

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
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 md:p-8 max-w-4xl w-full relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/20 via-transparent to-neon-purple/20"></div>
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
                <div
                  key={`${card.rank}-${card.suit}-${index}`}
                  className="card bg-white border-2 border-white/20 hover:border-neon-blue/50 hover:shadow-neon-glow cursor-pointer"
                  onClick={() => onSelectCard(index)}
                >
                  <div 
                    className={`absolute top-2 left-2 text-lg md:text-xl font-bold font-numbers ${
                      card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-600' : 'text-black'
                    }`}
                  >
                    {card.rank}
                  </div>
                  <div 
                    className={`text-2xl md:text-3xl ${
                      card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-600' : 'text-black'
                    }`}
                  >
                    {getSuitSymbol(card.suit)}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={onClose}
                className="px-8 py-4 bg-gradient-to-r from-dark-800 to-dark-700 text-white rounded-xl font-semibold hover:from-dark-700 hover:to-dark-600 border border-white/20 hover:border-neon-blue/50 transition-all duration-300"
              >
                Cancel
              </button>
            </div>
            </div>
                    </div>
        </div>
      )}
    </>
  );
};

export default DiscardPileModal; 