const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// In-memory store of rooms
const rooms = {};

// Helper function to add isHost property to players
function addHostProperty(room) {
  const result = {
    ...room,
    players: room.players.map((player, index) => ({
      ...player,
      isHost: index === 0 // First player is always the host
    }))
  };
  
  // Add debugging info
  console.log('[DEBUG] addHostProperty - Turn:', room.turn, 'Player:', room.players[room.turn]?.name, 'Eliminated:', room.players[room.turn]?.eliminated);
  
  return result;
}

// Helper: build and shuffle a 52-card deck
function shuffledDeck() {
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks = [
    { face: 'A', value: 1 }, { face: '2', value: 2 }, { face: '3', value: 3 },
    { face: '4', value: 4 }, { face: '5', value: 5 }, { face: '6', value: 6 },
    { face: '7', value: 7 }, { face: '8', value: 8 }, { face: '9', value: 9 },
    { face: '10', value: 10 }, { face: 'J', value: 0 }, { face: 'Q', value: 20 }, { face: 'K', value: 20 }
  ];
  
  const deck = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank: rank.face, value: rank.value });
    }
  }
  
  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  
  return deck;
}

function isValidPlay(cards) {
  if (!cards || cards.length === 0) {
    return { valid: false, message: 'No cards selected.' };
  }
  
  if (cards.length === 1) {
    return { valid: true, message: '' };
  }
  
  // Check for double
  if (cards.length === 2 && cards[0].rank === cards[1].rank) {
    return { valid: true, message: '' };
  }
  
  // Check for series (same suit, consecutive ranks)
  if (cards.length >= 3) {
    const suits = cards.map(c => c.suit);
    if (new Set(suits).size !== 1) {
      return { valid: false, message: 'Series must be same suit.' };
    }
    
    // Map face to value for sorting
    const faceOrder = {
      'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
      '10': 10, 'J': 11, 'Q': 12, 'K': 13
    };
    
    try {
      const values = cards.map(c => faceOrder[c.rank]).sort((a, b) => a - b);
      const expected = Array.from({ length: cards.length }, (_, i) => values[0] + i);
      
      if (JSON.stringify(values) !== JSON.stringify(expected)) {
        return { valid: false, message: 'Series must be consecutive.' };
      }
      return { valid: true, message: '' };
    } catch (error) {
      return { valid: false, message: 'Invalid card rank.' };
    }
  }
  
  return { valid: false, message: 'Invalid play.' };
}

// Helper to check and update eliminated status
function updateEliminations(room) {
  const eliminationScore = room.eliminationScore || 100;
  console.log('[DEBUG] updateEliminations called with elimination score:', eliminationScore);
  
  room.players.forEach(player => {
    const currentScore = room.scores[player.id] || 0;
    const wasEliminated = player.eliminated;
    
    if (currentScore > eliminationScore) {
      player.eliminated = true;
      if (!wasEliminated) {
        console.log(`[DEBUG] Player ${player.name} eliminated: score ${currentScore} > ${eliminationScore}`);
      }
    }
  });
}

// Helper to get next non-eliminated player's index
function getNextActivePlayerIdx(room, startIdx) {
  const n = room.players.length;
  let idx = (startIdx + 1) % n;
  let count = 0;
  
  // Find next non-eliminated player
  while (count < n) {
    if (!room.players[idx].eliminated) {
      return idx;
    }
    idx = (idx + 1) % n;
    count++;
  }
  
  // If all players are eliminated, return -1 (should trigger game over)
  return -1;
}

// Helper to count active players
function countActivePlayers(room) {
  return room.players.filter(p => !p.eliminated).length;
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Create a new room
  socket.on('create_room', (data) => {
    const { room, name, eliminationScore = 100 } = data;
    
    // Check if room already exists
    if (rooms[room]) {
      socket.emit('error', { msg: 'Room already exists. Try a different code.' });
      return;
    }
    
    // Initialize room state
    rooms[room] = {
      players: [{ id: socket.id, name, hand: [], eliminated: false }],
      deck: shuffledDeck(),
      center_pile: [],
      turn: 0,
      scores: {},
      turn_start_time: Date.now(),
      eliminationScore: parseInt(eliminationScore) || 100
    };
    
    if (!rooms[room].turns_taken) {
      rooms[room].turns_taken = {};
      rooms[room].players.forEach(p => {
        rooms[room].turns_taken[p.id] = 0;
      });
    }
    
    socket.join(room);
    socket.emit('room_state', addHostProperty(rooms[room]));
  });

    // Join an existing room
  socket.on('join_room', (data) => {
    const { room, name } = data;

    if (!rooms[room]) {
      socket.emit('error', { msg: 'Room not found.' });
      return;
    }

    // Check if game has already started (any player has cards)
    const gameStarted = rooms[room].players.some(p => p.hand && p.hand.length > 0);
    if (gameStarted) {
      socket.emit('error', { msg: 'Game has already started. Cannot join.' });
      return;
    }

    // Check if player is already in the room
    const existingPlayer = rooms[room].players.find(p => p.id === socket.id);
    if (existingPlayer) {
      socket.emit('error', { msg: 'You are already in this room.' });
      return;
    }

    // Check if room is full (assuming max 6 players)
    if (rooms[room].players.length >= 6) {
      socket.emit('error', { msg: 'Room is full.' });
      return;
    }

    rooms[room].players.push({ id: socket.id, name, hand: [], eliminated: false });
    
    if (!rooms[room].turns_taken) {
      rooms[room].turns_taken = {};
      rooms[room].players.forEach(p => {
        rooms[room].turns_taken[p.id] = 0;
      });
    } else {
      rooms[room].turns_taken[socket.id] = 0;
    }
    
    socket.join(room);
    // Send updated room state to all players
    io.to(room).emit('room_state', addHostProperty(rooms[room]));
  });

  // Start the game: deal 5 cards each
  socket.on('start_game', (data) => {
    console.log('Start game requested for room:', data.room);
    const { room } = data;
    const r = rooms[room];
    
    if (!r) {
      console.log('Room not found:', room);
      socket.emit('error', { msg: 'Room not found.' });
      return;
    }
    
    if (r.players.length < 2) {
      console.log('Not enough players:', r.players.length);
      socket.emit('error', { msg: 'Need at least 2 players to start.' });
      return;
    }
    
    console.log('Starting game with players:', r.players.map(p => p.name));
    
    // Deal cards
    r.players.forEach(player => {
      player.hand = [];
      player.eliminated = false;
      for (let i = 0; i < 5; i++) {
        player.hand.push(r.deck.pop());
      }
      console.log(`Dealt ${player.hand.length} cards to ${player.name}:`, player.hand);
    });
    
    // Initialize scores
    r.players.forEach(p => {
      r.scores[p.id] = 0;
    });
    
    r.turn = 0;
    r.turn_start_time = Date.now();
    r.center_pile = [];
    r.turns_taken = {};
    r.players.forEach(p => {
      r.turns_taken[p.id] = 0;
    });
    
    console.log('Emitting room_state with game started');
    io.to(room).emit('room_state', addHostProperty(r));
  });

  // Turn action (draw card)
  socket.on('turn_action', (data) => {
    console.log('Received turn_action:', data);
    const { room, throw_cards, pick } = data;
    const r = rooms[room];
    
    if (!r) {
      console.log('Room not found:', room);
      socket.emit('error', { msg: 'Room not found.' });
      return;
    }
    
    const turn_idx = r.turn % r.players.length;
    const player = r.players[turn_idx];
    
    if (player.id !== socket.id) {
      console.log('Not your turn:', socket.id);
      socket.emit('error', { msg: 'Not your turn!' });
      return;
    }
    
    // Check if player is eliminated
    if (player.eliminated) {
      console.log('Player is eliminated, cannot take turn:', player.name);
      socket.emit('error', { msg: 'You are eliminated and cannot take turns!' });
      return;
    }
    
    // Validate throw
    const { valid, message } = isValidPlay(throw_cards);
    if (!valid) {
      console.log('Invalid play:', message);
      socket.emit('error', { msg: message || 'Invalid play.' });
      return;
    }
    
    // Remove thrown cards from hand
    const hand = player.hand;
    throw_cards.forEach(card => {
      const index = hand.findIndex(h => h.rank === card.rank && h.suit === card.suit);
      if (index !== -1) {
        hand.splice(index, 1);
      }
    });
    
    // Validate pick
    if (r.turn === 0 && (!r.center_pile || r.center_pile.length === 0)) {
      // First turn: only allow picking from deck
      if (pick.source !== 'deck') {
        console.log('Must pick from deck on first turn');
        socket.emit('error', { msg: 'Must pick from deck on first turn.' });
        // Restore thrown cards to hand
        hand.push(...throw_cards);
        return;
      }
    }
    
    if (pick.source === 'deck') {
      if (!r.deck || r.deck.length === 0) {
        console.log('Deck is empty!');
        socket.emit('error', { msg: 'Deck is empty!' });
        hand.push(...throw_cards);
        return;
      }
      const card = r.deck.pop();
      player.hand.push(card);
    } else if (pick.source === 'center') {
      if (!r.center_pile || r.center_pile.length === 0) {
        console.log('No card(s) to pick from center!');
        socket.emit('error', { msg: 'No card(s) to pick from center!' });
        hand.push(...throw_cards);
        return;
      }
      
      const idx = pick.index || 0;
      if (idx < 0 || idx >= r.center_pile.length) {
        console.log('Invalid card index');
        socket.emit('error', { msg: 'Invalid card index.' });
        hand.push(...throw_cards);
        return;
      }
      
      const picked_card = r.center_pile[idx];
      player.hand.push(picked_card);
      // Discard the rest
      r.center_pile = [];
    } else {
      console.log('Invalid pick source');
      socket.emit('error', { msg: 'Invalid pick source.' });
      hand.push(...throw_cards);
      return;
    }
    
    // After turn, update center_pile to new throw
    r.center_pile = throw_cards;
    
    // Increment turns taken for this player
    if (!r.turns_taken) {
      r.turns_taken = {};
      r.players.forEach(p => {
        r.turns_taken[p.id] = 0;
      });
    }
    r.turns_taken[player.id]++;
    
    // Advance turn to next non-eliminated player
    let nextIdx = getNextActivePlayerIdx(r, r.turn);
    
    if (nextIdx === -1) {
      // No active players found - check if this should trigger game over
      const activePlayers = r.players.filter(p => !p.eliminated);
      if (activePlayers.length === 1) {
        console.log('[DEBUG] Only one active player remaining, ending game');
        io.to(room).emit('game_over', { winner: activePlayers[0] });
        return;
      } else if (activePlayers.length === 0) {
        console.log('[DEBUG] No active players, ending game');
        io.to(room).emit('game_over', { winner: null });
        return;
      }
    }
    
    r.turn = nextIdx;
    r.turn_start_time = Date.now();
    
    console.log('Turn processed, new center_pile:', r.center_pile);
    console.log('[DEBUG] Turn advanced to player:', r.players[r.turn]?.name, 'eliminated:', r.players[r.turn]?.eliminated);
    io.to(room).emit('room_state', addHostProperty(r));
  });

  // Quit (declare end of round)
  socket.on('quit', (data) => {
    const { room } = data;
    const r = rooms[room];
    
    if (!r) {
      socket.emit('error', { msg: 'Room not found.' });
      return;
    }
    
    const turn_idx = r.turn % r.players.length;
    const player = r.players[turn_idx];
    
    if (player.id !== socket.id) {
      socket.emit('error', { msg: 'Not your turn!' });
      return;
    }
    
    // Check if player is eliminated
    if (player.eliminated) {
      console.log('Player is eliminated, cannot quit:', player.name);
      socket.emit('error', { msg: 'You are eliminated and cannot quit!' });
      return;
    }
    
    // Calculate hand values
    function handValue(hand) {
      const faceVal = {
        'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
        '10': 10, 'J': 0, 'Q': 20, 'K': 20
      };
      return hand.reduce((sum, c) => sum + faceVal[c.rank], 0);
    }
    
    const my_val = handValue(player.hand);
    const others = r.players.filter(p => p.id !== player.id && !p.eliminated); // Only include non-eliminated players
    const others_vals = others.map(p => handValue(p.hand));
    
    // Must have at least 3 turns per player before quitting
    if (!r.turns_taken) {
      r.turns_taken = {};
      r.players.forEach(p => {
        r.turns_taken[p.id] = 0;
      });
    }
    
    if (r.turns_taken[player.id] < 3) {
      socket.emit('error', { msg: 'You must take at least 3 turns before quitting.' });
      return;
    }
    
    // Scoring
    console.log('[DEBUG] Scoring calculation:');
    console.log(`  - Quitter (${player.name}) hand value: ${my_val}`);
    console.log(`  - Others (non-eliminated): ${others.map(p => p.name).join(', ')}`);
    console.log(`  - Others hand values: ${others_vals.join(', ')}`);
    
    let msg;
    if (others_vals.every(v => my_val < v)) {
      // Quitter has lowest value, add others' values to their scores
      others.forEach((p, i) => {
        r.scores[p.id] += others_vals[i];
        console.log(`  - ${p.name} gets +${others_vals[i]} points`);
      });
      msg = `${player.name} quit and had the lowest value! Others get their hand values as score.`;
    } else {
      // Penalty to quitter
      r.scores[player.id] += 25;
      console.log(`  - ${player.name} gets +25 penalty points`);
      msg = `${player.name} quit but did not have the lowest value. 25 penalty!`;
    }
    
    // Send quit reveal data with all player hands for animation
    const quit_reveal_data = {
      quit_player: player,
      all_players: r.players.map(p => ({
        ...p,
        hand: [...p.hand] // Capture hands at the time of quit
      })),
      quit_result: {
        success: others_vals.every(v => my_val < v),
        message: msg
      }
    };
    
    console.log('[DEBUG] Server sending quit_reveal data:', quit_reveal_data);
    console.log('[DEBUG] Current player status before revelation:');
    r.players.forEach(p => {
      console.log(`  - ${p.name}: eliminated=${p.eliminated}, score=${r.scores[p.id] || 0}`);
    });
    
    console.log('[DEBUG] Final scores after quit:');
    r.players.forEach(p => {
      console.log(`  - ${p.name}: ${r.scores[p.id] || 0}`);
    });
    
    io.to(room).emit('quit_reveal', quit_reveal_data);

    // --- NEW: Setup reveal order for manual reveal phase ---
    r.reveal_phase = {
      non_quitters: r.players.filter(p => p.id !== player.id && !p.eliminated).map(p => p.id), // Only include non-quitters who are NOT eliminated
      current_index: 0,
      in_progress: true
    };
    
    console.log('[DEBUG] Setting up revelation phase. Non-quitters (not eliminated):', r.reveal_phase.non_quitters.map(id => r.players.find(p => p.id === id)?.name));
    
    if (r.reveal_phase.non_quitters.length > 0) {
      io.to(room).emit('next_revealing_player', {
        player_id: r.reveal_phase.non_quitters[0]
      });
    } else {
      io.to(room).emit('reveal_complete');
      r.reveal_phase.in_progress = false;
    }

    // DON'T check eliminations here - wait until after revelations are complete
  });

      // --- NEW: Handle finished_revealing event ---
    socket.on('finished_revealing', (data) => {
      console.log('[DEBUG] finished_revealing event received:', data);
      const { room } = data;
      const r = rooms[room];
      if (!r || !r.reveal_phase || !r.reveal_phase.in_progress) {
        console.log('[DEBUG] Invalid reveal phase state:', { 
          room: !!r, 
          reveal_phase: !!r?.reveal_phase, 
          in_progress: r?.reveal_phase?.in_progress 
        });
        return;
      }
      console.log('[DEBUG] Current reveal phase:', r.reveal_phase);
      r.reveal_phase.current_index++;
      console.log('[DEBUG] Updated current_index to:', r.reveal_phase.current_index);
      
      if (r.reveal_phase.current_index < r.reveal_phase.non_quitters.length) {
        const nextId = r.reveal_phase.non_quitters[r.reveal_phase.current_index];
        const nextPlayer = r.players.find(p => p.id === nextId);
        
        console.log('[DEBUG] Emitting next_revealing_player for:', nextId, 'Player:', nextPlayer?.name);
        io.to(room).emit('next_revealing_player', { player_id: nextId });
      } else {
        console.log('[DEBUG] All players revealed, emitting reveal_complete. Total players in revelation:', r.reveal_phase.non_quitters.length);
        io.to(room).emit('reveal_complete');
        r.reveal_phase.in_progress = false;
        
        // NOW check eliminations after all revelations are complete
        updateEliminations(r);
        
        // Log elimination status for debugging
        console.log('[DEBUG] Elimination check complete. Players status:');
        r.players.forEach(p => {
          console.log(`  - ${p.name}: eliminated=${p.eliminated}, score=${r.scores[p.id] || 0}`);
        });
        
        // Check for winner immediately after eliminations
        const activePlayers = r.players.filter(p => !p.eliminated);
        if (activePlayers.length === 1) {
          console.log('[DEBUG] Only one player remaining after all eliminations, ending game');
          io.to(room).emit('game_over', { winner: activePlayers[0] });
          return;
        }
      }
    });

  // Reveal card during quit phase
  socket.on('reveal_card', (data) => {
    const { room, player_id, card_index } = data;
    const r = rooms[room];
    
    if (!r) {
      socket.emit('error', { msg: 'Room not found.' });
      return;
    }
    
    const player = r.players.find(p => p.id === player_id);
    if (!player || !player.hand || card_index >= player.hand.length) {
      socket.emit('error', { msg: 'Invalid card reveal.' });
      return;
    }
    
    // Check if player is eliminated
    if (player.eliminated) {
      console.log(`[DEBUG] Player ${player.name} is eliminated, cannot reveal cards`);
      socket.emit('error', { msg: 'You are eliminated and cannot reveal cards.' });
      return;
    }
    
    // Broadcast the card reveal to all players
    io.to(room).emit('card_revealed', {
      player_id: player_id,
      card_index: card_index,
      card: player.hand[card_index]
    });
  });

  // Start next round after quit phase
  socket.on('start_next_round', (data) => {
    console.log('start_next_round event received:', data);
    const { room } = data;
    const r = rooms[room];
    
    if (!r) {
      console.log('Room not found:', room);
      socket.emit('error', { msg: 'Room not found.' });
      return;
    }
    
    console.log('Starting next round...');
    console.log('Current players:', r.players.map(p => ({ name: p.name, id: p.id, hand: p.hand?.length })));
    
    // Reset game state for new round
    r.deck = shuffledDeck();
    r.center_pile = [];
    
    // Find first non-eliminated player to start the round
    let firstActivePlayerIdx = 0;
    for (let i = 0; i < r.players.length; i++) {
      if (!r.players[i].eliminated) {
        firstActivePlayerIdx = i;
        break;
      }
    }
    r.turn = firstActivePlayerIdx;
    r.turn_start_time = Date.now();
    r.turns_taken = {};
    r.players.forEach(p => {
      r.turns_taken[p.id] = 0;
    });
    
    // Deal 5 new cards to each NON-ELIMINATED player only
    r.players.forEach(player => {
      if (!player.eliminated) {
        player.hand = [];
        for (let i = 0; i < 5; i++) {
          player.hand.push(r.deck.pop());
        }
        console.log(`Dealt ${player.hand.length} cards to ${player.name}:`, player.hand);
      } else {
        // Clear hand for eliminated players
        player.hand = [];
        console.log(`${player.name} is eliminated, no cards dealt`);
      }
    });
    
    console.log('Emitting room_state and next_round_started');
    console.log('Updated players:', r.players.map(p => ({ name: p.name, id: p.id, hand: p.hand?.length })));
    io.to(room).emit('room_state', addHostProperty(r));
    io.to(room).emit('next_round_started');
  });

  // Kick player from room
  socket.on('kick_player', (data) => {
    console.log('Kick player event received:', data);
    const { room, player_id } = data;
    const r = rooms[room];
    
    if (!r) {
      socket.emit('error', { msg: 'Room not found.' });
      return;
    }
    
    // Check if the kicker is the host (first player)
    const host = r.players[0];
    console.log('Host ID:', host.id, 'Socket ID:', socket.id);
    if (host.id !== socket.id) {
      console.log('Kick denied: Not host');
      socket.emit('error', { msg: 'Only the host can kick players.' });
      return;
    }
    
    // Check if trying to kick the host
    if (player_id === host.id) {
      socket.emit('error', { msg: 'Cannot kick yourself.' });
      return;
    }
    
    // Find the player to kick
    const playerToKick = r.players.find(p => p.id === player_id);
    console.log('Player to kick:', playerToKick);
    if (!playerToKick) {
      console.log('Kick denied: Player not found');
      socket.emit('error', { msg: 'Player not found in room.' });
      return;
    }
    
    // Remove player from room
    r.players = r.players.filter(p => p.id !== player_id);
    
    // Notify the kicked player
    io.to(player_id).emit('kicked', { msg: 'You have been kicked from the room.' });
    
    // Remove kicked player from socket room
    socket.to(player_id).leave(room);
    
    // Update room state for remaining players
    io.to(room).emit('room_state', addHostProperty(r));
    io.to(room).emit('info', { msg: `${playerToKick.name} has been kicked from the room.` });
    
    // If no players left, delete the room
    if (r.players.length === 0) {
      delete rooms[room];
    }
  });

  // Voice signal relay
  socket.on('voice-signal', (data) => {
    const { room, target, signal } = data;
    // Relay the signal to the target user in the room
    socket.to(target).emit('voice-signal', { from: socket.id, signal });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Remove player from all rooms they're in
    Object.keys(rooms).forEach(roomId => {
      const room = rooms[roomId];
      if (room && room.players) {
        const playerIndex = room.players.findIndex(p => p.id === socket.id);
        if (playerIndex !== -1) {
          room.players.splice(playerIndex, 1);
          
          // If room is empty, delete it
          if (room.players.length === 0) {
            delete rooms[roomId];
          } else {
            // Update turns_taken
            if (room.turns_taken && room.turns_taken[socket.id]) {
              delete room.turns_taken[socket.id];
            }
            
            // Notify remaining players
            io.to(roomId).emit('room_state', addHostProperty(room));
          }
        }
      }
    });
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', rooms: Object.keys(rooms).length });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
}); 