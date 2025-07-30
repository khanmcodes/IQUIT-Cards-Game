# IQUIT - Multiplayer Card Game

A real-time multiplayer card game built with React, Node.js, and Socket.IO. Players can create or join rooms, play cards, and compete in a strategic card-based game with voice chat capabilities.

## 🎮 Features

- **Real-time Multiplayer**: Play with friends in real-time using WebSocket connections
- **Room System**: Create or join game rooms with unique codes
- **Card Game Mechanics**: Strategic card playing with validation rules
- **Voice Chat**: Built-in voice communication between players
- **Responsive UI**: Modern, responsive interface built with React and Tailwind CSS
- **Game State Management**: Real-time game state synchronization
- **Player Management**: Host controls, player kicking, and room management

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and development server
- **Tailwind CSS** - Styling framework
- **Framer Motion** - Animation library
- **Socket.IO Client** - Real-time communication
- **React Icons** - Icon library

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Socket.IO** - Real-time bidirectional communication
- **CORS** - Cross-origin resource sharing

## 📋 Prerequisites

Before running this project, make sure you have the following installed:

- **Node.js** (version 16 or higher)
- **npm** (comes with Node.js)

You can check your Node.js version with:
```bash
node --version
npm --version
```

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/iquit.git
cd iquit
```

### 2. Install Dependencies

Install both client and server dependencies:

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Start the Development Servers

You'll need to run both the server and client in separate terminal windows:

**Terminal 1 - Start the Server:**
```bash
cd server
npm run dev
```

The server will start on `http://localhost:5001`

**Terminal 2 - Start the Client:**
```bash
cd client
npm run dev
```

The client will start on `http://localhost:5173`

### 4. Open the Application

Open your browser and navigate to `http://localhost:5173` to start playing!

## 🎯 How to Play

1. **Enter Your Name**: Start by entering your username
2. **Create or Join a Room**: 
   - Create a new room to get a unique room code
   - Join an existing room using a room code
3. **Wait for Players**: The host can start the game when at least 2 players have joined
4. **Play Cards**: Follow the game rules to play valid card combinations
5. **Voice Chat**: Enable voice chat to communicate with other players

## 🏗️ Project Structure

```
iquit/
├── client/                 # React frontend
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── App.jsx        # Main app component
│   │   └── main.jsx       # App entry point
│   ├── package.json       # Frontend dependencies
│   └── vite.config.js     # Vite configuration
├── server/                # Node.js backend
│   ├── server.js          # Main server file
│   └── package.json       # Backend dependencies
└── README.md              # This file
```

## 🔧 Development

### Available Scripts

**Client (in `client/` directory):**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

**Server (in `server/` directory):**
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server

### Environment Variables

The application currently uses default localhost URLs. For production deployment, you may need to configure:

- Server port (default: 5001)
- Client server URL (default: http://localhost:5001)
- CORS origins

## 🤝 Contributing

We welcome contributions to IQUIT! Here's how you can help:

### 1. Fork the Repository

1. Go to the project repository on GitHub
2. Click the "Fork" button in the top right corner
3. Clone your forked repository to your local machine

### 2. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 3. Make Your Changes

- Write clean, readable code
- Follow the existing code style
- Add comments for complex logic
- Test your changes thoroughly

### 4. Commit Your Changes

```bash
git add .
git commit -m "feat: add your feature description"
```

Use conventional commit messages:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for formatting changes
- `refactor:` for code refactoring
- `test:` for adding tests
- `chore:` for maintenance tasks

### 5. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 6. Create a Pull Request

1. Go to your forked repository on GitHub
2. Click "Compare & pull request"
3. Fill out the PR template with:
   - Description of changes
   - Screenshots (if applicable)
   - Testing instructions
4. Submit the pull request

### 7. Code Review

- Respond to review comments
- Make requested changes
- Once approved, your PR will be merged!

## 🐛 Reporting Bugs

If you find a bug, please create an issue with:

1. **Clear title** describing the problem
2. **Detailed description** of the bug
3. **Steps to reproduce** the issue
4. **Expected vs actual behavior**
5. **Screenshots** (if applicable)
6. **Browser/OS information**

## 💡 Feature Requests

Have an idea for a new feature? Create an issue with:

1. **Clear title** describing the feature
2. **Detailed description** of the feature
3. **Use cases** and benefits
4. **Mockups or examples** (if applicable)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with React and Node.js
- Real-time communication powered by Socket.IO
- Styled with Tailwind CSS
- Animations by Framer Motion

## 📞 Support

If you need help or have questions:

1. Check the existing issues for similar problems
2. Create a new issue with your question
3. Join our community discussions

---

**Happy Gaming! 🎮** 