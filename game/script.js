const socket = io(); // conecta ao servidor socket.io

const deckSelect = document.getElementById('deck-select-game');
const gameIdInput = document.getElementById('game-id');
const joinBtn = document.getElementById('join-game');

const connectSection = document.getElementById('connect-section');
const gameSection = document.getElementById('game-section');

const playerDeckUl = document.getElementById('player-deck');
const yourPlayedUl = document.getElementById('your-played');
const opponentPlayedUl = document.getElementById('opponent-played');

let currentDeck = [];
let gameId = null;

// Popula dropdown de decks do jogador usando fetch
async function populateDeckSelect() {
  try {
    const res = await fetch('/decks');
    const decks = await res.json();

    deckSelect.innerHTML = '<option value="">-- Selecione seu deck --</option>';
    decks.forEach(deckName => {
      const option = document.createElement('option');
      option.value = deckName;
      option.textContent = deckName;
      deckSelect.appendChild(option);
    });
  } catch (err) {
    console.error('Erro ao carregar decks:', err);
    deckSelect.innerHTML = '<option value="">-- Erro ao carregar decks --</option>';
  }
}

// Renderiza as cartas do deck do jogador
function renderPlayerDeck() {
  playerDeckUl.innerHTML = '';
  currentDeck.forEach(card => {
    const li = document.createElement('li');
    li.textContent = `${card.name} [${card.type}]`;
    li.onclick = () => playCard(card);
    playerDeckUl.appendChild(li);
  });
}

// Jogar uma carta
function playCard(card) {
  const idx = currentDeck.findIndex(c => c.id === card.id);
  if (idx >= 0) {
    currentDeck.splice(idx, 1);
    renderPlayerDeck();

    const li = document.createElement('li');
    li.textContent = `${card.name} [${card.type}]`;
    yourPlayedUl.appendChild(li);

    socket.emit('playCard', { gameId, card });
  }
}

joinBtn.onclick = async () => {
  gameId = gameIdInput.value.trim();
  const deckName = deckSelect.value;
  if (!gameId) return alert('Informe o ID do jogo.');
  if (!deckName) return alert('Selecione seu deck.');

  try {
    const res = await fetch(`/decks/${deckName}`);
    if (!res.ok) throw new Error('Deck não encontrado.');
    currentDeck = await res.json();

    renderPlayerDeck();
    socket.emit('joinGame', { gameId, deck: currentDeck });

    connectSection.style.display = 'none';
    gameSection.style.display = 'block';
  } catch (err) {
    alert('Erro ao carregar o deck.');
    console.error(err);
  }
};

socket.on('opponentPlayedCard', (card) => {
  const li = document.createElement('li');
  li.textContent = `${card.name} [${card.type}]`;
  opponentPlayedUl.appendChild(li);
});

socket.on('playerJoined', (data) => {
  console.log(`Jogadores na sala: ${data.players}`);
});

// Inicializa dropdown
populateDeckSelect();
