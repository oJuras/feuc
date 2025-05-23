document.addEventListener('DOMContentLoaded', () => {
  const socket = io(); // conecta ao servidor socket.io

  const deckSelect = document.getElementById('deck-select-game');
  const gameIdInput = document.getElementById('game-id');
  const joinBtn = document.getElementById('join-game');

  const connectSection = document.getElementById('connect-section');
  const gameSection = document.getElementById('game-section');

  const playerDeckUl = document.getElementById('player-deck');
  const yourPlayedUl = document.getElementById('your-played');
  const opponentPlayedUl = document.getElementById('opponent-played');
  const handUl = document.getElementById('player-hand');
  const playerLife = document.getElementById('player-life');
  const opponentLife = document.getElementById('opponent-life');

  let fullDeck = [];
  let hand = [];
  let gameId = null;
  let lifePoints = 20;
  let opponentLifePoints = 20;

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

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  function drawCard() {
    if (hand.length >= 10 || fullDeck.length === 0) return;
    const card = fullDeck.shift();
    hand.push(card);
    renderHand();
  }

  function renderHand() {
    handUl.innerHTML = '';
    hand.forEach((card, index) => {
      const li = document.createElement('li');
      li.textContent = `${card.name} [${card.type}]`;
      li.oncontextmenu = (e) => {
        e.preventDefault();
        showContextMenu(e.pageX, e.pageY, [
          { label: 'Invocar/Ativar', action: () => playCardFromHand(index) },
          { label: 'Descartar', action: () => discardFromHand(index) },
          { label: 'Embaralhar no deck', action: () => shuffleBackToDeck(index) }
        ]);
      };
      handUl.appendChild(li);
    });
  }

  function playCardFromHand(index) {
    const card = hand.splice(index, 1)[0];
    renderHand();

    const li = document.createElement('li');
    li.textContent = `${card.name} [${card.type}]`;
    li.oncontextmenu = (e) => {
      e.preventDefault();
      showContextMenu(e.pageX, e.pageY, [
        { label: 'Devolver à mão', action: () => returnToHand(card, li) },
        { label: 'Embaralhar no deck', action: () => moveToDeck(card, li) },
        { label: 'Descartar', action: () => discardCard(card, li) }
      ]);
    };
    yourPlayedUl.appendChild(li);

    socket.emit('playCard', { gameId, card });
  }

  function discardFromHand(index) {
    hand.splice(index, 1);
    renderHand();
  }

  function shuffleBackToDeck(index) {
    const card = hand.splice(index, 1)[0];
    fullDeck.push(card);
    shuffle(fullDeck);
    renderHand();
  }

  function returnToHand(card, element) {
    if (hand.length < 10) {
      hand.push(card);
      renderHand();
      element.remove();
    } else {
      alert('Mão cheia.');
    }
  }

  function moveToDeck(card, element) {
    fullDeck.push(card);
    shuffle(fullDeck);
    element.remove();
  }

  function discardCard(card, element) {
    element.remove();
    // implementar lógica de cemitério se necessário
  }

  function showContextMenu(x, y, options) {
    const menu = document.createElement('ul');
    menu.style.position = 'absolute';
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.style.backgroundColor = '#fff';
    menu.style.border = '1px solid #ccc';
    menu.style.padding = '5px';
    menu.style.zIndex = 1000;
    menu.style.listStyle = 'none';

    options.forEach(opt => {
      const item = document.createElement('li');
      item.textContent = opt.label;
      item.style.cursor = 'pointer';
      item.onclick = () => {
        opt.action();
        document.body.removeChild(menu);
      };
      menu.appendChild(item);
    });

    document.body.appendChild(menu);

    document.addEventListener('click', () => {
      if (document.body.contains(menu)) document.body.removeChild(menu);
    }, { once: true });
  }

  playerDeckUl.oncontextmenu = (e) => {
    e.preventDefault();
    showContextMenu(e.pageX, e.pageY, [
      { label: 'Comprar uma carta', action: drawCard },
      { label: 'Embaralhar deck', action: () => shuffle(fullDeck) }
    ]);
  };

  joinBtn.onclick = async () => {
    gameId = gameIdInput.value.trim();
    const deckName = deckSelect.value;
    if (!gameId) return alert('Informe o ID do jogo.');
    if (!deckName) return alert('Selecione seu deck.');

    try {
      const res = await fetch(`/decks/${deckName}`);
      if (!res.ok) throw new Error('Deck não encontrado.');
      fullDeck = await res.json();
      shuffle(fullDeck);

      lifePoints = 20;
      opponentLifePoints = 20;
      playerLife.textContent = `Você: ${lifePoints} LP`;
      opponentLife.textContent = `Oponente: ${opponentLifePoints} LP`;

      for (let i = 0; i < 5; i++) drawCard();

      socket.emit('joinGame', { gameId, deck: fullDeck });
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
const endTurnBtn = document.getElementById('end-turn');
const turnIndicator = document.getElementById('turn-indicator');

let isMyTurn = false;

function updateTurnUI(turnStatus) {
  isMyTurn = turnStatus;
  turnIndicator.textContent = isMyTurn ? 'Seu turno' : 'Turno do oponente';
  turnIndicator.className = isMyTurn ? 'your-turn' : 'opponent-turn';
  endTurnBtn.style.display = isMyTurn ? 'inline-block' : 'none';
}

endTurnBtn.onclick = () => {
  socket.emit('endTurn', { gameId });
  updateTurnUI(false); // opcional: espera confirmação do servidor
};

socket.on('yourTurn', () => {
  drawCard();
  updateTurnUI(true)
});
socket.on('opponentTurn', () => {
  updateTurnUI(false)
});

  populateDeckSelect();
});
