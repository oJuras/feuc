// Conectar ao servidor socket.io
const socket = io();

// Eventos de conexão
socket.on('connect', () => {
  console.log('Conectado ao servidor com ID:', socket.id);
});

// Elementos da interface
const cardList = document.getElementById('card-list');
const deckList = document.getElementById('deck-list');
const deckNameInput = document.getElementById('deck-name');
const deckSelect = document.getElementById('deck-select');
const deleteDeckBtn = document.getElementById('delete-deck');
const saveDeckBtn = document.getElementById('save-deck');

let allCards = [];
let currentDeck = [];

// Buscar lista de cartas
fetch('/data/cards.json')
  .then(res => res.json())
  .then(data => {
    allCards = data;
    renderCards();
  })
  .catch(() => alert('Erro ao carregar cards.'));

// Popular dropdown com os decks existentes
function populateDeckSelect() {
  fetch('/decks')
    .then(res => res.json())
    .then(decks => {
      deckSelect.innerHTML = '<option value="">-- Selecione um deck --</option>';
      decks.forEach(deck => {
        const option = document.createElement('option');
        option.value = deck;
        option.textContent = deck;
        deckSelect.appendChild(option);
      });
    })
    .catch(() => alert('Erro ao listar decks.'));
}

// Carregar deck selecionado
deckSelect.onchange = () => {
  const name = deckSelect.value;
  if (!name) return;

  fetch(`/decks/${name}`)
    .then(res => {
      if (!res.ok) throw new Error();
      return res.json();
    })
    .then(deck => {
      currentDeck = deck;
      deckNameInput.value = name;
      renderDeck();
    })
    .catch(() => alert('Erro ao carregar o deck.'));
};

// Renderizar cartas disponíveis
function renderCards() {
  cardList.innerHTML = '';
  allCards.forEach(card => {
    const li = document.createElement('li');
    li.textContent = `${card.name} [${card.type}]`;
    li.setAttribute('data-effect', card.effect);
    li.onclick = () => addToDeck(card.id);
    cardList.appendChild(li);
  });
}

// Renderizar deck atual
function renderDeck() {
  deckList.innerHTML = '';
  currentDeck.forEach((card, index) => {
    const li = document.createElement('li');
    li.textContent = `${card.name} [${card.type}]`;
    li.setAttribute('data-effect', card.effect);
    li.onclick = () => removeFromDeck(index);
    deckList.appendChild(li);
  });
}

// Adicionar carta ao deck
function addToDeck(cardId) {
  const card = allCards.find(c => c.id === cardId);
  if (card) {
    currentDeck.push(card);
    renderDeck();
  }
}

// Remover carta do deck
function removeFromDeck(index) {
  currentDeck.splice(index, 1);
  renderDeck();
}

// Salvar deck
saveDeckBtn.onclick = () => {
  const name = deckNameInput.value.trim();
  if (!name) return alert('Nome do deck obrigatório.');

  fetch(`/save-deck/${encodeURIComponent(name)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(currentDeck)
  })
    .then(res => {
      if (!res.ok) throw new Error();
      alert('Deck salvo com sucesso!');
      populateDeckSelect();
    })
    .catch(() => alert('Erro ao salvar deck.'));
};

// Deletar deck
deleteDeckBtn.onclick = () => {
  const name = deckSelect.value;
  if (!name) return alert('Selecione um deck para excluir.');

  fetch(`/delete-deck/${encodeURIComponent(name)}`, { method: 'DELETE' })
    .then(res => {
      if (!res.ok) throw new Error();
      alert('Deck excluído com sucesso.');
      currentDeck = [];
      renderDeck();
      deckNameInput.value = '';
      populateDeckSelect();
    })
    .catch(() => alert('Erro ao excluir deck.'));
};

// Botão para ir à tela de jogo online
document.getElementById('btnPlayOnline').onclick = () => {
  window.location.href = '/game/';
};

// Inicializar dropdown
populateDeckSelect();
