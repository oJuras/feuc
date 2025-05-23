const fs = require('fs');
const path = require('path');

class DeckBuilder {
  constructor(cardsFilePath) {
    this.cardsFilePath = cardsFilePath;
    this.allCards = [];
    this.deck = [];
    this.deckName = null;
  }

  async loadCards() {
    const data = await fs.promises.readFile(this.cardsFilePath, 'utf8');
    this.allCards = JSON.parse(data);
  }

  listAllCards() {
    return this.allCards;
  }

  addCardToDeck(cardId) {
    const card = this.allCards.find(c => c.id === cardId);
    if (!card) throw new Error(`Carta com id "${cardId}" não encontrada.`);
    this.deck.push(card);
  }

  removeCardFromDeck(cardId) {
    const index = this.deck.findIndex(c => c.id === cardId);
    if (index === -1) throw new Error(`Carta com id "${cardId}" não está no deck.`);
    this.deck.splice(index, 1);
  }

  listDeck() {
    return this.deck;
  }

  setDeckName(name) {
    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw new Error("Nome do deck inválido.");
    }
    this.deckName = name.trim();
  }

  async saveDeck() {
    if (!this.deckName) throw new Error("Defina um nome para o deck com setDeckName(nome).");

    const dir = path.join(__dirname, 'decks');
    await fs.promises.mkdir(dir, { recursive: true });

    const filePath = path.join(dir, `${this.deckName}.fdk`);
    await fs.promises.writeFile(filePath, JSON.stringify(this.deck, null, 2), 'utf8');
    console.log(`Deck salvo como "${this.deckName}.fdk"`);
  }

  async loadDeck(name) {
    const filePath = path.join(__dirname, 'decks', `${name}.fdk`);
    const data = await fs.promises.readFile(filePath, 'utf8');
    this.deck = JSON.parse(data);
    this.deckName = name;
    console.log(`Deck "${name}" carregado.`);
  }
}

// Exemplo de uso
(async () => {
  const builder = new DeckBuilder(path.join(__dirname, 'public/data/cards.json'));
  try {
    await builder.loadCards();
    builder.setDeckName('fuzzy-power');

    builder.addCardToDeck('fuzzy:walter');
    builder.addCardToDeck('fuzzy:sartore1');
    builder.addCardToDeck('fuzzy:origem');

    await builder.saveDeck();

    console.log('\nDeck atual salvo:');
    console.log(builder.listDeck());

    // Simular carregamento
    const loader = new DeckBuilder(path.join(__dirname, 'public/data/cards.json'));
    await loader.loadCards();
    await loader.loadDeck('fuzzy-power');

    console.log('\nDeck carregado:');
    console.log(loader.listDeck());
  } catch (err) {
    console.error('Erro:', err.message);
  }
})();
