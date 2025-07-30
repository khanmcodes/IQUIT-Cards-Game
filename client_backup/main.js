// main.js
// Connect to Flask-SocketIO backend at port 5000
const socket = io('http://localhost:5000');
let myId = null;
let currentRoom = null;

// DOM elements
const lobby  = document.getElementById('lobby');
const game   = document.getElementById('game');
const roomIn = document.getElementById('room');
const nameIn = document.getElementById('name');
const btnC   = document.getElementById('btnCreate');
const btnJ   = document.getElementById('btnJoin');
const btnS   = document.getElementById('btnStart');
const status = document.getElementById('status');
const handDiv= document.getElementById('hand');

// Create Room
btnC.onclick = () => {
  const room = roomIn.value.trim();
  const name = nameIn.value.trim();
  if (!room || !name) return alert('Please enter both room code and name.');
  currentRoom = room;
  socket.emit('create_room', { room, name });
};

// Join Room
btnJ.onclick = () => {
  const room = roomIn.value.trim();
  const name = nameIn.value.trim();
  if (!room || !name) return alert('Please enter both room code and name.');
  currentRoom = room;
  socket.emit('join_room', { room, name });
};

// Start Game (only shown to creator once >=2 players)
btnS.onclick = () => {
  if (!currentRoom) return;
  socket.emit('start_game', { room: currentRoom });
};

// Render a hand of cards
function renderHand(cards) {
  handDiv.innerHTML = '';
  cards.forEach(card => {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    cardDiv.textContent = `${card.rank}${card.suit[0].toUpperCase()}`;
    handDiv.appendChild(cardDiv);
  });
}

// Socket event handlers
socket.on('connect', () => {
  myId = socket.id;
  console.log('Connected to server as', myId);
});

socket.on('room_state', state => {
  // Switch UI
  lobby.classList.add('hidden');
  game.classList.remove('hidden');

  // Show start button only if I'm host and at least 2 players joined
  const isHost = state.players.length && state.players[0].id === myId;
  if (state.players.length >= 2 && isHost) {
    btnS.classList.remove('hidden');
  } else {
    btnS.classList.add('hidden');
  }

  // Update status text
  const names = state.players.map(p => p.name).join(', ');
  status.textContent = `Room: ${currentRoom} | Players: ${names}`;

  // Render my hand if dealt
  const me = state.players.find(p => p.id === myId);
  if (me && me.hand && me.hand.length) {
    renderHand(me.hand);
  }
});

socket.on('error', data => {
  alert(data.msg);
  console.error('Server error:', data.msg);
});