const fs = require('fs');
const path = require('path');
const cardsPath = path.join(__dirname, '../public/data/cards.json');
const decksDir = path.join(__dirname, '../decks');

let allCards = [];
let currentDeck = [];

const cardList = document.getElementById('card-list');
const deckList = document.getElementById('deck-list');
const deckNameInput = document.getElementById('deck-name');

document.getElementById('save-deck').onclick = saveDeck;
document.getElementById('load-deck').onclick = loadDeck;

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

function addToDeck(cardId) {
  const card = allCards.find(c => c.id === cardId);
  if (card) {
    currentDeck.push(card);
    renderDeck();
  }
}

function removeFromDeck(index) {
  currentDeck.splice(index, 1);
  renderDeck();
}

function saveDeck() {
  const name = deckNameInput.value.trim();
  if (!name) return alert('Nome do deck obrigatório.');
  fs.mkdirSync(decksDir, { recursive: true });
  fs.writeFileSync(path.join(decksDir, `${name}.fdk`), JSON.stringify(currentDeck, null, 2));
  alert('Deck salvo com sucesso!');
}

function loadDeck() {
  const name = deckNameInput.value.trim();
  if (!name) return alert('Nome do deck obrigatório.');
  const filePath = path.join(decksDir, `${name}.fdk`);
  if (!fs.existsSync(filePath)) return alert('Deck não encontrado.');
  const data = fs.readFileSync(filePath);
  currentDeck = JSON.parse(data);
  renderDeck();
}

fs.readFile(cardsPath, 'utf8', (err, data) => {
  if (err) return alert('Erro ao carregar cards.');
  allCards = JSON.parse(data);
  renderCards();
});
