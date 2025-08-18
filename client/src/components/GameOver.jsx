import React from 'react';
import { motion } from 'framer-motion';

const GameOver = ({ winner, players = [], scores = {}, onPlayAgain, isHost = false }) => {
  // Sort players by score: lowest on top, highest on bottom
  const sortedPlayers = [...players].sort((a, b) => (scores[a.id] || 0) - (scores[b.id] || 0));

  return (
    <div className="min-h-screen bg-gaming-gradient flex items-center justify-center p-4">
      <motion.div
        className="glass-panel p-8 md:p-12 max-w-2xl w-full text-center"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Winner Celebration */}
        <motion.div
          className="mb-8"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <motion.div
            className="text-8xl mb-4"
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatDelay: 1
            }}
          >
            🎉
          </motion.div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-white font-gaming mb-2">
            Game Over!
          </h1>
          
          {winner && (
            <motion.div
              className="bg-gradient-to-r from-neon-yellow to-neon-orange p-4 rounded-xl mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="text-2xl font-bold text-dark-900">
                🏆 {winner.name} Wins! 🏆
              </div>
              <div className="text-dark-800 font-semibold">
                Final Score: {scores[winner.id] || 0} points
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Final Leaderboard */}
        <motion.div
          className="mb-8"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <h2 className="text-xl font-bold text-white mb-4">Final Standings</h2>
          <div className="space-y-3 max-h-80 scrollable-container pr-2">
            {sortedPlayers.map((player, index) => {
              const playerScore = scores[player.id] || 0;
              const isWinner = player.id === winner?.id;
              const position = index + 1; // Position 1 for lowest score, 2 for second lowest, etc.
              
              return (
                <motion.div
                  key={player.id}
                  className="flex items-center justify-between p-4 bg-dark-800/50 rounded-xl"
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                      isWinner ? 'bg-neon-yellow text-dark-900' :
                      position === 1 ? 'bg-neon-yellow text-dark-900' :
                      position === 2 ? 'bg-gray-400 text-dark-900' :
                      position === 3 ? 'bg-orange-500 text-white' :
                      'bg-dark-700 text-white'
                    }`}>
                      {isWinner ? '🏆' : 
                       position === 1 ? '1' : 
                       position === 2 ? '2' : 
                       position === 3 ? '3' : 
                       position}
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-neon-blue to-neon-purple rounded-full flex items-center justify-center text-white font-bold">
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-white font-semibold">{player.name}</div>
                        <div className="text-white/60 text-sm">
                          {isWinner ? 'Winner!' : `${playerScore} points`}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-neon-blue">
                      {playerScore}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Action Area */}
        <motion.div
          className="flex flex-col items-center justify-center space-y-3"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          {isHost ? (
            <button
              onClick={onPlayAgain}
              className="px-8 py-4 bg-gradient-to-r from-neon-green to-neon-cyan text-white font-semibold rounded-xl hover:from-neon-blue hover:to-neon-purple transition-all duration-300 transform hover:scale-105 shadow-neon"
            >
              Play Again (Host)
            </button>
          ) : (
            <div className="text-white/70">Waiting for host to start again…</div>
          )}
        </motion.div>

        {/* Confetti Animation */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-neon-yellow rounded-full"
              initial={{
                x: Math.random() * window.innerWidth,
                y: -10,
                opacity: 1
              }}
              animate={{
                y: window.innerHeight + 10,
                opacity: 0,
                rotate: 360
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                delay: Math.random() * 2,
                repeat: Infinity
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default GameOver; 