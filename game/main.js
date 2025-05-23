// main.js
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const cardsPath = path.join(__dirname, '../public/data/cards.json');
const decksDir = path.join(__dirname, '../decks');

// EXPRESS SERVER CONFIG
const expressApp = express();
const server = http.createServer(expressApp);
const io = new Server(server);
const gameSessions = {};

expressApp.use(express.static(path.join(__dirname, '../public')));
expressApp.use(express.json());
expressApp.use(express.static(path.join(__dirname, '../app')));

// Serve a pasta /game para a tela do jogo online
expressApp.use('/game', express.static(path.join(__dirname, '../game')));

// API: Lista todos os decks
expressApp.get('/decks', (req, res) => {
  fs.readdir(decksDir, (err, files) => {
    if (err) return res.status(500).json({ error: 'Erro ao ler os decks' });
    const decks = files.filter(f => f.endsWith('.fdk')).map(f => f.replace('.fdk', ''));
    res.json(decks);
  });
});

// API: Retorna um deck específico
expressApp.get('/decks/:name', (req, res) => {
  const name = req.params.name;
  const filePath = path.join(decksDir, `${name}.fdk`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Deck não encontrado' });
  const data = fs.readFileSync(filePath);
  res.type('json').send(data);
});

expressApp.post('/save-deck/:name', (req, res) => {
  const name = req.params.name;
  const deckData = req.body;

  if (!Array.isArray(deckData)) {
    return res.status(400).json({ error: 'Formato inválido de deck.' });
  }

  try {
    fs.mkdirSync(decksDir, { recursive: true });
    const filePath = path.join(decksDir, `${name}.fdk`);
    fs.writeFileSync(filePath, JSON.stringify(deckData, null, 2));
    res.status(200).json({ message: 'Deck salvo com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar o deck.' });
  }
});

expressApp.delete('/delete-deck/:name', (req, res) => {
  const name = req.params.name;
  const filePath = path.join(decksDir, `${name}.fdk`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Deck não encontrado.' });
  }

  try {
    fs.unlinkSync(filePath);
    res.status(200).json({ message: 'Deck excluído com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir o deck.' });
  }
});

// SOCKET.IO CONFIG
io.on('connection', (socket) => {
  console.log('Novo jogador conectado:', socket.id);

  socket.on('joinGame', ({ gameId, deck }) => {
    socket.join(gameId);

    if (!gameSessions[gameId]) {
      gameSessions[gameId] = { players: [], turnIndex: 0 };
    }

    const game = gameSessions[gameId];

    // Impede mais de dois jogadores
    if (game.players.length >= 2) {
      socket.emit('error', 'Sala cheia.');
      return;
    }

    game.players.push({ id: socket.id, deck });
    io.to(gameId).emit('playerJoined', { players: game.players.length });

    // Se dois jogadores, inicia o turno do jogador 0
    if (game.players.length === 2) {
      const currentPlayer = game.players[game.turnIndex];
      const otherPlayer = game.players[1 - game.turnIndex];

      io.to(currentPlayer.id).emit('yourTurn');
      io.to(otherPlayer.id).emit('opponentTurn');
    }
  });

  socket.on('endTurn', ({ gameId }) => {
    const game = gameSessions[gameId];
    if (!game || game.players.length !== 2) return;

    game.turnIndex = 1 - game.turnIndex; // Alterna entre 0 e 1

    const currentPlayer = game.players[game.turnIndex];
    const otherPlayer = game.players[1 - game.turnIndex];

    io.to(currentPlayer.id).emit('yourTurn');
    io.to(otherPlayer.id).emit('opponentTurn');
  });

  socket.on('playCard', ({ gameId, card }) => {
    socket.to(gameId).emit('opponentPlayedCard', card);
  });

  socket.on('disconnect', () => {
    for (const gameId in gameSessions) {
      const game = gameSessions[gameId];
      game.players = game.players.filter(p => p.id !== socket.id);

      if (game.players.length === 0) {
        delete gameSessions[gameId];
      }
    }

    console.log('Jogador desconectado:', socket.id);
  });
});


server.listen(3000, () => {
  console.log('Servidor de jogo online iniciado em http://localhost:3000');
});

// ELECTRON CONFIG
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadURL('http://localhost:3000');

}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
