import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import './index.css';

// Import components
import NameEntry from './components/NameEntry';
import Lobby from './components/Lobby';
import CreateRoom from './components/CreateRoom';
import JoinRoom from './components/JoinRoom';
import GameScreen from './components/GameScreen';
import GameOver from './components/GameOver';

const socket = io('http://localhost:5001');

function App() {
  // App state
  const [currentScreen, setCurrentScreen] = useState('auth');
  const [user, setUser] = useState(null);
  const [room, setRoom] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [players, setPlayers] = useState([]);
  const [hand, setHand] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [selectedCards, setSelectedCards] = useState([]);
  const [turnIdx, setTurnIdx] = useState(0);

  const [scores, setScores] = useState({});
  const [centerPile, setCenterPile] = useState([]);
  const [deckCount, setDeckCount] = useState(0);
  const [isFirstTurn, setIsFirstTurn] = useState(true);
  const [pickSource, setPickSource] = useState(null);
  const [pickIndex, setPickIndex] = useState(null);
  const [turnsTaken, setTurnsTaken] = useState({});
  const [quitData, setQuitData] = useState(null);
  const [revealedCards, setRevealedCards] = useState({});
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [peerConnections, setPeerConnections] = useState({});
  const [remoteStreams, setRemoteStreams] = useState({});
  const localAudioRef = useRef();
  const [currentRevealingPlayerId, setCurrentRevealingPlayerId] = useState(null);
  const [revealComplete, setRevealComplete] = useState(false);
  const [roomData, setRoomData] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  
  // Ref to store current quitData for event handlers
  const quitDataRef = useRef(null);
  
  


  // Name entry handler
  const handleNameEnter = (name) => {
    setUser({ id: Date.now().toString(), username: name });
    setCurrentScreen('lobby');
  };

  // Navigation handlers
  const handleCreateRoom = () => {
    setCurrentScreen('create-room');
  };

  const handleJoinRoom = () => {
    setCurrentScreen('join-room');
  };

  const handleBackToLobby = () => {
    setCurrentScreen('lobby');
    setRoom('');
    setRoomCode('');
    setPlayers([]);
    setHand([]);
    setIsHost(false);
    setSelectedCards([]);
    setScores({});
    setCenterPile([]);
    setDeckCount(0);
    setShowScoreboard(false);
    setQuitData(null);
    quitDataRef.current = null;
    setGameOver(false);
    setWinner(null);
  };

  // Room management
  const handleGenerateRoom = (eliminationScore = 100) => {
    const code = Math.floor(100 + Math.random() * 900).toString();
    setRoomCode(code);
    setRoom(code);
    socket.emit('create_room', { room: code, name: user.username, eliminationScore });
  };

  const handleJoinRoomSubmit = (code) => {
    setRoom(code);
    socket.emit('join_room', { room: code, name: user.username });
  };

  const handleStartGame = () => {
    console.log('Starting game with room:', room, 'players:', players.length);
    if (players.length < 2) {
      return;
    }
    socket.emit('start_game', { room });
  };



  // Game handlers
  const handleSelectCard = (index) => {
    setSelectedCards(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleSetPickSource = (source) => {
    setPickSource(source);
    setPickIndex(null);
  };

  const handlePickFromDiscard = (index) => {
    setPickSource('discard');
    setPickIndex(index);
  };

  const handleConfirmTurn = () => {
    if (selectedCards.length === 0 || !pickSource) {
      return;
    }

    const throwCards = selectedCards.map(i => hand[i]);
    const pick = pickSource === 'deck' 
      ? { source: 'deck' } 
      : { source: 'center', index: pickIndex };

    socket.emit('turn_action', { room, throw_cards: throwCards, pick });
    setSelectedCards([]);
    setPickSource(null);
    setPickIndex(null);
  };

  const handleQuit = () => {
    socket.emit('quit', { room: room });
  };

  const handleRevealCard = (playerId, cardIndex) => {
    socket.emit('reveal_card', { room: room, player_id: playerId, card_index: cardIndex });
  };

  const handleStartNextRound = () => {
    console.log('handleStartNextRound called, room:', room);
    console.log('socket.id:', socket.id);
    console.log('players:', players);
    console.log('isHost:', isHost);
    console.log('Emitting start_next_round event');
    socket.emit('start_next_round', { room: room });
  };

  const handleKickPlayer = (playerId) => {
    console.log('Kicking player:', playerId, 'from room:', room, 'socket.id:', socket.id);
    socket.emit('kick_player', { room, player_id: playerId });
  };

  const handlePlayAgain = () => {
    if (!isHost) return;
    if (!room) return;
    
    // Immediately clear game over state for smooth transition
    setGameOver(false);
    setWinner(null);
    
    // Emit start_game to restart the game
    socket.emit('start_game', { room });
  };

	
  // Reset game state when quit data is cleared
  useEffect(() => {
    if (!quitData) {
      console.log('Quit data cleared, resetting game state');
      setSelectedCards([]);
      setPickSource(null);
      setPickIndex(null);
      setIsFirstTurn(true);
      setRevealedCards({});
    }
  }, [quitData]);

  // Socket event handlers
  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to server');
    });

    socket.on('room_state', (state) => {
      console.log('Room state received:', state);
      console.log('Players:', state.players?.length, state.players?.map(p => ({ name: p.name, id: p.id, hand: p.hand?.length })));
      console.log('Current gameOver state:', gameOver);
      console.log('Current currentScreen:', currentScreen);
      
      // Store room data
      setRoomData(state);
      
      // Add isHost property to each player
      const playersWithHost = state.players?.map((player, index) => ({
        ...player,
        isHost: index === 0 // First player is always the host
      })) || [];
      
      setPlayers(playersWithHost);
      
      // Check if current player is in the room
      const me = state.players.find(p => p.id === socket.id);
      console.log('Current socket ID:', socket.id);
      console.log('Found me:', me?.name, me?.id);
      
      if (me) {
        // Player is in the room, check if game has started
        const gameStarted = state.players.some(p => p.hand && p.hand.length > 0);
        console.log('Game started:', gameStarted, 'My hand:', me.hand?.length);
        
        if (gameStarted) {
          console.log('Switching to game screen');
          setCurrentScreen('game');
          setHand(me && me.hand ? me.hand : []);
          setIsHost(state.players.length && state.players[0].id === socket.id);
          setTurnIdx(state.turn || 0);
          setScores(state.scores || {});
          setCenterPile(state.center_pile || []);
          setDeckCount(state.deck ? state.deck.length : 0);
          setIsFirstTurn((state.turn === 0) && (!state.center_pile || state.center_pile.length === 0));
          setTurnsTaken(state.turns_taken || {});
          
          // Clear quit data if we're getting a new game state
          if (quitData) {
            console.log('Clearing quit data due to new room state');
            setQuitData(null);
            quitDataRef.current = null;
          }
          
          // Clear game over state when starting a new game
          if (gameOver) {
            console.log('Clearing game over state due to new room state');
            setGameOver(false);
            setWinner(null);
          }
          
          console.log('Game state updated successfully');
        } else {
          console.log('Staying in create room screen');
          setCurrentScreen('create-room');
          setIsHost(state.players.length && state.players[0].id === socket.id);
        }
      } else {
        console.log('Player not found in room');
      }
    });

    // Chat history for this room
    socket.on('chat_history', (history) => {
      setChatMessages(Array.isArray(history) ? history : []);
    });

    // Incoming chat messages
    socket.on('chat_message', (message) => {
      setChatMessages(prev => [...prev, message].slice(-50));
    });

    socket.on('error', (data) => {
      // If there's an error joining, go back to lobby
      if (data.msg.includes('already in room') || data.msg.includes('room not found')) {
        setCurrentScreen('lobby');
        setRoom('');
        setRoomCode('');
      }
    });

    socket.on('quit_reveal', (data) => {
  console.log('quit_reveal event received:', data);
  console.log('[DEBUG] Client received quit_reveal data:', {
    quit_player: data.quit_player,
    all_players: data.all_players,
    quit_result: data.quit_result,
    scores: data.scores
  });

  // Reset any previous reveal state to prevent premature summary display
  setRevealComplete(false);
  setCurrentRevealingPlayerId(null);

  // Keep existing quitData format (GameScreen reads this) and store scores for later
  const newQuitData = {
    quitPlayer: data.quit_player,
    all_players: data.all_players,
    quitResult: data.quit_result,
    pendingScores: data.scores  // Store scores to apply after revelation phase
  };
  setQuitData(newQuitData);
  quitDataRef.current = newQuitData;  // Update ref immediately

  if (data.scores) {
    console.log('[DEBUG] Received scores from quit_reveal (storing in quitData for later):', data.scores);
  }
});



    socket.on('card_revealed', (data) => {
      console.log('Card revealed event received:', data);
      const { player_id, card_index } = data;
      setRevealedCards(prev => {
        const newRevealedCards = { ...prev };
        if (!newRevealedCards[player_id]) {
          newRevealedCards[player_id] = [];
        }
        if (!newRevealedCards[player_id].includes(card_index)) {
          newRevealedCards[player_id].push(card_index);
        }
        return newRevealedCards;
      });
    });

    socket.on('next_round_started', () => {
      console.log('next_round_started event received');
      console.log('Clearing quit data and resetting game state');
      setQuitData(null);
      quitDataRef.current = null;
      // Reset game state for new round
      setSelectedCards([]);
      setPickSource(null);
      setPickIndex(null);
      setIsFirstTurn(true);
      setRevealedCards({});
      console.log('Game state reset complete - waiting for room_state update');
    });

    socket.on('game_over', (data) => {
  // If a reveal/summary is in progress (we have quitData + revealComplete), delay the UI swap to allow the Round Summary to show.
  if (revealComplete && quitData) {
    console.log('[DEBUG] game_over received during reveal/summary — delaying UI switch so summary is visible');
    // Delay slightly longer than the GameScreen countdown (3s) to make sure summary is visible.
    setTimeout(() => {
      setGameOver(true);
      setWinner(data.winner);
    }, 3500);
  } else {
    setGameOver(true);
    setWinner(data.winner);
  }
});



    socket.on('kicked', (data) => {
      // Redirect to lobby when kicked
      setCurrentScreen('lobby');
      setRoom('');
      setRoomCode('');
      setPlayers([]);
      setHand([]);
      setIsHost(false);
      setSelectedCards([]);
      setScores({});
      setCenterPile([]);
      setDeckCount(0);
      setShowScoreboard(false);
      setQuitData(null);
      quitDataRef.current = null;
      setGameOver(false);
      setWinner(null);
    });

    socket.on('next_revealing_player', (data) => {
      setCurrentRevealingPlayerId(data.player_id);
      setRevealComplete(false);
    });
    socket.on('reveal_complete', () => {
      setRevealComplete(true);
      setCurrentRevealingPlayerId(null);
      
      // Now that revelation phase is complete, apply the scores from quitData
      if (quitDataRef.current && quitDataRef.current.pendingScores) {
        console.log('[DEBUG] Revelation complete, applying pending scores:', quitDataRef.current.pendingScores);
        setScores(quitDataRef.current.pendingScores);
      }
    });

    return () => {
      socket.off('connect');
      socket.off('room_state');
      socket.off('chat_history');
      socket.off('chat_message');
      socket.off('error');
      socket.off('info');
      socket.off('quit_reveal');
      socket.off('next_round_started');
      socket.off('game_over');
      socket.off('kicked');
      socket.off('next_revealing_player');
      socket.off('reveal_complete');
    };
  }, [room, players, revealComplete, quitData]);



  // Voice chat logic (unchanged from original)
  useEffect(() => {
    if (!voiceEnabled) return;
    if (!room || players.length < 2) return;
    let isMounted = true;
    let local;
    let pcs = {};
    let remotes = {};

    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      if (!isMounted) return;
      setLocalStream(stream);
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
      }
      players.filter(p => p.id !== socket.id).forEach(player => {
        const pc = new window.RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
        stream.getTracks().forEach(track => pc.addTrack(track, stream));
        pc.ontrack = (event) => {
          remotes[player.id] = event.streams[0];
          setRemoteStreams(r => ({ ...r, [player.id]: event.streams[0] }));
        };
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('voice-signal', {
              room,
              target: player.id,
              signal: { candidate: event.candidate }
            });
          }
        };
        pcs[player.id] = pc;
      });
      setPeerConnections(pcs);
      Object.entries(pcs).forEach(async ([id, pc]) => {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('voice-signal', {
          room,
          target: id,
          signal: { sdp: offer }
        });
      });
    });
    
    return () => {
      isMounted = false;
      Object.values(peerConnections).forEach(pc => pc.close());
      setPeerConnections({});
      setRemoteStreams({});
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      setLocalStream(null);
    };
  }, [voiceEnabled, room, players.length]);

  useEffect(() => {
    if (!voiceEnabled) return;
    function handleSignal({ from, signal }) {
      if (from === socket.id) return;
      let pc = peerConnections[from];
      if (!pc) {
        pc = new window.RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
        if (localStream) {
          localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
        }
        pc.ontrack = (event) => {
          setRemoteStreams(r => ({ ...r, [from]: event.streams[0] }));
        };
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('voice-signal', {
              room,
              target: from,
              signal: { candidate: event.candidate }
            });
          }
        };
        setPeerConnections(prev => ({ ...prev, [from]: pc }));
      }
      if (signal.sdp) {
        pc.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(async () => {
          if (signal.sdp.type === 'offer') {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('voice-signal', {
              room,
              target: from,
              signal: { sdp: answer }
            });
          }
        });
      } else if (signal.candidate) {
        pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
      }
    }
    socket.on('voice-signal', handleSignal);
    return () => socket.off('voice-signal', handleSignal);
  }, [voiceEnabled, peerConnections, localStream, room]);

  const isMyTurn = players[turnIdx] && players[turnIdx].id === socket.id && !players[turnIdx].eliminated;
  const canQuit = isMyTurn && (turnsTaken[socket.id] || 0) >= 3;

  return (
    <div className="font-inter">
      <AnimatePresence mode="wait">
        {currentScreen === 'auth' && (
          <NameEntry key="auth" onEnter={handleNameEnter} />
        )}

        {currentScreen === 'lobby' && (
          <Lobby 
            key="lobby"
            user={user}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            recentRooms={[]}
          />
        )}

        {currentScreen === 'create-room' && (
          <CreateRoom 
            key="create-room"
            onBack={handleBackToLobby}
            onStartGame={handleStartGame}
            onGenerateRoom={handleGenerateRoom}
            onKickPlayer={handleKickPlayer}
            roomCode={roomCode}
            players={players}
            isHost={isHost}
            currentUserId={socket.id}
            eliminationScore={roomData?.eliminationScore || 100}
          />
        )}

        {currentScreen === 'join-room' && (
          <JoinRoom 
            key="join-room"
            onBack={handleBackToLobby}
            onJoin={handleJoinRoomSubmit}
            roomPreview={null}
            error={null}
          />
        )}

        {currentScreen === 'game' && !gameOver && (
          <GameScreen 
            key="game"
            players={players}
            currentPlayer={players.find(p => p.id === socket.id) || players[0]}
            turnPlayer={players[turnIdx] || players[0]}
            myHand={hand}
            centerPile={centerPile}
            deckCount={deckCount}
            isMyTurn={isMyTurn}
            selectedCards={selectedCards}
            onSelectCard={handleSelectCard}
            pickSource={pickSource}
            pickIndex={pickIndex}
            onSetPickSource={handleSetPickSource}
            onPickFromDiscard={handlePickFromDiscard}
            onConfirmTurn={handleConfirmTurn}
            onQuit={handleQuit}
            canQuit={canQuit}
            onPlayCards={handleConfirmTurn}
            onDrawFromDeck={() => handleSetPickSource('deck')}
            scores={scores}
            quitData={quitData}
            onRevealCard={handleRevealCard}
            onStartNextRound={handleStartNextRound}
            revealedCards={revealedCards}
            currentRevealingPlayerId={currentRevealingPlayerId}
            revealComplete={revealComplete}
            onFinishRevealing={() => socket.emit('finished_revealing', { room })}
            chatMessages={chatMessages}
            onSendChat={(text) => socket.emit('chat_message', { room, text })}
          />
        )}

        {gameOver && (
          <GameOver 
            key="game-over"
            winner={winner}
            players={players}
            scores={scores}
            onPlayAgain={handlePlayAgain}
            isHost={isHost}
          />
        )}
        
        {/* Fallback screen */}
        {!currentScreen || (currentScreen !== 'auth' && currentScreen !== 'lobby' && currentScreen !== 'create-room' && currentScreen !== 'join-room' && currentScreen !== 'game' && !gameOver) && (
          <div className="min-h-screen bg-gaming-gradient flex items-center justify-center">
            <div className="glass-panel p-8 text-center">
              <h1 className="text-2xl font-bold text-white mb-4">Loading...</h1>
              <p className="text-white/60">Current screen: {currentScreen}</p>
              <button 
                onClick={handleBackToLobby}
                className="mt-4 px-4 py-2 bg-neon-blue text-white rounded-lg"
              >
                Back to Lobby
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Voice Chat Audio */}
      <audio ref={localAudioRef} autoPlay muted className="hidden" />
      {Object.entries(remoteStreams).map(([id, stream]) => (
        <audio key={id} srcObject={stream} autoPlay />
      ))}
    </div>
  );
}

export default App;
