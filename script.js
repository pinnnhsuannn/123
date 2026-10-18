const STORAGE_KEY = "sunnyEnglishVillage_v1";
const defaultState = {
  coins: 120,
  wordsLearned: 12,
  dailyCompleted: 1,
  boughtItems: [],
  roomItems: [],
  petPhrase: "You make my day sunny!"
};
let state = loadState();
let activeGame = "match";
let questionIndex = 0;
let selectedAnswer = null;
let answered = false;
let gameRewarded = false;
let activeCategory = "all";

const vocab = [
  { word: "apple", meaning: "蘋果", emoji: "🍎", options: ["蘋果", "香蕉", "蛋糕", "花朵"] },
  { word: "book", meaning: "書", emoji: "📚", options: ["書", "椅子", "鞋子", "雨傘"] },
  { word: "cat", meaning: "貓", emoji: "🐱", options: ["狗", "貓", "兔子", "小鳥"] },
  { word: "sun", meaning: "太陽", emoji: "☀️", options: ["月亮", "雲朵", "太陽", "星星"] },
  { word: "chair", meaning: "椅子", emoji: "🪑", options: ["桌子", "椅子", "床", "窗戶"] },
  { word: "flower", meaning: "花", emoji: "🌼", options: ["樹", "草", "花", "葉子"] },
  { word: "milk", meaning: "牛奶", emoji: "🥛", options: ["水", "果汁", "牛奶", "茶"] },
  { word: "happy", meaning: "開心的", emoji: "😊", options: ["難過的", "疲倦的", "生氣的", "開心的"] }
];
const sentences = [
  { words: ["I", "am", "happy."], answer: "I am happy." },
  { words: ["This", "is", "a", "cat."], answer: "This is a cat." },
  { words: ["I", "like", "apples."], answer: "I like apples." },
  { words: ["The", "sun", "is", "yellow."], answer: "The sun is yellow." }
];
const shopItems = [
  { id: "sofa", name: "Sage Sofa", emoji: "🛋️", price: 45, category: "furniture", desc: "A cozy seat" },
  { id: "lamp", name: "Sunny Lamp", emoji: "💡", price: 25, category: "furniture", desc: "A warm glow" },
  { id: "plant", name: "Little Plant", emoji: "🪴", price: 20, category: "decor", desc: "A touch of green" },
  { id: "picture", name: "Flower Art", emoji: "🖼️", price: 30, category: "decor", desc: "A happy wall" },
  { id: "rug", name: "Peachy Rug", emoji: "🟠", price: 35, category: "furniture", desc: "Soft underfoot" },
  { id: "toy", name: "Puppy Toy", emoji: "🧸", price: 15, category: "pet", desc: "For your best pal" }
];

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...defaultState, ...JSON.parse(saved) } : { ...defaultState };
  } catch {
    return { ...defaultState };
  }
}
function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}
function updateWallet() {
  document.getElementById("coin-count").textContent = state.coins;
  document.getElementById("shop-coin-count").textContent = state.coins;
  document.getElementById("words-count").textContent = `${state.wordsLearned} / 1,200`;
  document.getElementById("word-progress").style.width = `${Math.max(1, state.wordsLearned / 1200 * 100)}%`;
  document.getElementById("daily-progress-text").textContent = `${state.dailyCompleted} / 3`;
  document.getElementById("daily-progress-bar").style.width = `${Math.min(100, state.dailyCompleted / 3 * 100)}%`;
}
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2300);
}
function showView(viewName) {
  const target = document.getElementById(`view-${viewName}`);
  if (!target) return;
  document.querySelectorAll(".view").forEach(view => view.classList.toggle("active", view === target));
  document.querySelectorAll(".nav-link").forEach(button => button.classList.toggle("active", button.dataset.view === viewName));
  window.scrollTo({ top: 0, behavior: "smooth" });
}
document.querySelectorAll("[data-view]").forEach(button => button.addEventListener("click", () => showView(button.dataset.view)));
document.querySelectorAll("[data-game]").forEach(button => button.addEventListener("click", () => openGame(button.dataset.game)));

function renderShop() {
  const container = document.getElementById("shop-items");
  const filtered = shopItems.filter(item => activeCategory === "all" || item.category === activeCategory);
  container.innerHTML = filtered.map(item => {
    const bought = state.boughtItems.includes(item.id);
    return `<article class="shop-item">
      <div class="shop-item-art">${item.emoji}</div>
      <strong>${item.name}</strong><small>${item.desc}</small>
      <button class="buy-btn" data-buy="${item.id}" ${bought || state.coins < item.price ? "disabled" : ""}>${bought ? "Owned ✓" : `✦ ${item.price} coins`}</button>
    </article>`;
  }).join("");
  container.querySelectorAll("[data-buy]").forEach(button => button.addEventListener("click", () => buyItem(button.dataset.buy)));
}
document.querySelectorAll(".shop-tab").forEach(button => button.addEventListener("click", () => {
  activeCategory = button.dataset.category;
  document.querySelectorAll(".shop-tab").forEach(tab => tab.classList.toggle("active", tab === button));
  renderShop();
}));
function buyItem(id) {
  const item = shopItems.find(entry => entry.id === id);
  if (!item || state.boughtItems.includes(id)) return;
  if (state.coins < item.price) { showToast("Keep learning to earn more coins! 🌱"); return; }
  state.coins -= item.price;
  state.boughtItems.push(id);
  state.roomItems.push(id);
  saveState();
  updateWallet();
  renderShop();
  showToast(`${item.name} is yours! ✨`);
  updateRoomItems();
}
function updateRoomItems() {
  const preview = document.querySelector(".room-preview");
  const existing = preview.querySelector(".owned-items");
  if (existing) existing.remove();
  if (!state.roomItems.length) return;
  const owned = document.createElement("div");
  owned.className = "owned-items";
  owned.style.cssText = "position:absolute;z-index:6;right:18px;bottom:12px;display:flex;gap:4px;font-size:23px;filter:drop-shadow(0 2px 1px #fff)";
  owned.textContent = state.roomItems.map(id => shopItems.find(item => item.id === id)?.emoji || "").join("");
  preview.appendChild(owned);
}

function openGame(type) {
  activeGame = type;
  questionIndex = 0;
  selectedAnswer = null;
  answered = false;
  gameRewarded = false;
  document.getElementById("game-modal").hidden = false;
  document.body.style.overflow = "hidden";
  renderQuestion();
}
function closeGame() {
  document.getElementById("game-modal").hidden = true;
  document.body.style.overflow = "";
}
document.getElementById("close-game").addEventListener("click", closeGame);
document.getElementById("game-modal").addEventListener("click", event => {
  if (event.target.id === "game-modal") closeGame();
});
document.addEventListener("keydown", event => { if (event.key === "Escape") closeGame(); });

function renderQuestion() {
  selectedAnswer = null;
  answered = false;
  const title = { match: "Word Match", sentence: "Sentence Builder", memory: "Memory Flip", listen: "Listen & Find" }[activeGame];
  document.getElementById("game-title").textContent = title;
  document.getElementById("game-message").textContent = "";
  document.getElementById("game-message").className = "game-message";
  const next = document.getElementById("next-question");
  next.textContent = activeGame === "sentence" ? "Check sentence →" : "Check answer →";
  if (activeGame === "grammar") renderGrammar();
  else if (activeGame === "sentence") renderSentence();
  else if (activeGame === "memory") renderMemory();
  else if (activeGame === "listen") renderListen();
  else renderMatch();
}
function renderGrammar() {
  document.getElementById("game-instructions").textContent = "Choose the right word to complete the sentence.";
  document.getElementById("game-content").innerHTML = `<div class="question-card"><span class="question-emoji">🌱</span><div class="question-word">I ___ happy.</div></div><div class="answer-options"><button class="answer-option" data-answer="am">am</button><button class="answer-option" data-answer="is">is</button><button class="answer-option" data-answer="are">are</button></div>`;
  wireAnswerButtons("am");
}
function renderMatch() {
  const item = vocab[questionIndex % vocab.length];
  document.getElementById("game-instructions").textContent = "Look at the picture and choose the correct English word.";
  document.getElementById("game-content").innerHTML = `<div class="question-card"><span class="question-emoji">${item.emoji}</span><div class="question-word">${item.meaning}</div></div><div class="answer-options">${shuffle([...vocab.map(v => v.word)]).slice(0,4).map(word => `<button class="answer-option" data-answer="${word}">${word}</button>`).join("")}</div>`;
  // Ensure the correct answer is always present.
  const options = document.querySelector(".answer-options");
  if (![...options.querySelectorAll("button")].some(btn => btn.dataset.answer === item.word)) {
    options.lastElementChild.dataset.answer = item.word;
    options.lastElementChild.textContent = item.word;
  }
  wireAnswerButtons(item.word);
}
function renderSentence() {
  const item = sentences[questionIndex % sentences.length];
  document.getElementById("game-instructions").textContent = "Tap the words in the correct order to make a sentence.";
  const words = shuffle([...item.words]);
  document.getElementById("game-content").innerHTML = `<div class="question-card"><span class="question-emoji">💬</span><div class="question-word">Make a sentence!</div></div><div class="answer-options">${words.map((word, i) => `<button class="answer-option" data-word="${word}" data-index="${i}">${word}</button>`).join("")}</div><div id="sentence-result" style="min-height:35px;margin-top:13px;text-align:center;font-weight:900;color:#65785d"></div>`;
  const chosen = [];
  document.querySelectorAll("[data-word]").forEach(button => button.addEventListener("click", () => {
    if (answered || button.disabled) return;
    chosen.push(button.dataset.word);
    button.disabled = true;
    button.classList.add("selected");
    document.getElementById("sentence-result").textContent = chosen.join(" ");
    selectedAnswer = chosen.join(" ");
  }));
  window.currentCorrect = item.answer;
}
function renderMemory() {
  document.getElementById("game-instructions").textContent = "Choose the English word that matches the picture.";
  const item = vocab[(questionIndex + 2) % vocab.length];
  document.getElementById("game-content").innerHTML = `<div class="question-card"><span class="question-emoji">🧠</span><div class="question-word">${item.emoji} ${item.meaning}</div></div><div class="answer-options">${shuffle([item.word, ...vocab.filter(v => v.word !== item.word).slice(0,3).map(v => v.word)]).map(word => `<button class="answer-option" data-answer="${word}">${word}</button>`).join("")}</div>`;
  wireAnswerButtons(item.word);
}
function renderListen() {
  const item = vocab[(questionIndex + 3) % vocab.length];
  document.getElementById("game-instructions").textContent = "Press the speaker to hear the word, then choose its meaning.";
  document.getElementById("game-content").innerHTML = `<div class="question-card"><button id="speak-word" class="speaker-button" style="border:0;border-radius:50%;width:75px;height:75px;background:#f4dfb0;font-size:34px">🔊</button><div class="question-word" style="font-size:15px;margin-top:10px">Listen carefully!</div></div><div class="answer-options">${shuffle([...item.options]).map(option => `<button class="answer-option" data-answer="${option}">${option}</button>`).join("")}</div>`;
  document.getElementById("speak-word").addEventListener("click", () => speak(item.word));
  wireAnswerButtons(item.meaning);
}
function wireAnswerButtons(correct) {
  document.querySelectorAll("[data-answer]").forEach(button => button.addEventListener("click", () => {
    if (answered) return;
    selectedAnswer = button.dataset.answer;
    document.querySelectorAll("[data-answer]").forEach(btn => btn.classList.toggle("selected", btn === button));
  }));
}
function shuffle(items) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}
function speak(text) {
  if (!("speechSynthesis" in window)) { showToast("Audio playback is not supported in this browser."); return; }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.82;
  window.speechSynthesis.speak(utterance);
}
document.getElementById("next-question").addEventListener("click", () => {
  if (answered) {
    questionIndex++;
    renderQuestion();
    return;
  }
  let correct;
  if (activeGame === "grammar") correct = selectedAnswer === "am";
  else if (activeGame === "sentence") correct = selectedAnswer === window.currentCorrect;
  else if (activeGame === "listen") {
    const item = vocab[(questionIndex + 3) % vocab.length];
    correct = selectedAnswer === item.meaning;
  } else if (activeGame === "memory") {
    const item = vocab[(questionIndex + 2) % vocab.length];
    correct = selectedAnswer === item.word;
  } else {
    const item = vocab[questionIndex % vocab.length];
    correct = selectedAnswer === item.word;
  }
  const message = document.getElementById("game-message");
  if (!selectedAnswer) {
    message.textContent = "Choose an answer first — you've got this! 🌱";
    message.className = "game-message error";
    return;
  }
  answered = true;
  document.querySelectorAll(".answer-option").forEach(button => {
    button.disabled = true;
    const expected = activeGame === "sentence" ? button.dataset.word : button.dataset.answer;
    const answer = activeGame === "sentence" ? window.currentCorrect.split(" ") : [];
    const correctValue = activeGame === "grammar" ? "am" : activeGame === "listen" ? vocab[(questionIndex + 3) % vocab.length].meaning : activeGame === "memory" ? vocab[(questionIndex + 2) % vocab.length].word : vocab[questionIndex % vocab.length].word;
    if ((activeGame === "sentence" && answer.includes(expected)) || (activeGame !== "sentence" && expected === correctValue)) button.classList.add("correct");
  });
  if (correct) {
    message.textContent = "Wonderful! You got it! 🌟";
    message.className = "game-message";
    if (!gameRewarded) {
      state.coins += 10;
      state.wordsLearned = Math.min(1200, state.wordsLearned + 1);
      state.dailyCompleted = Math.min(3, state.dailyCompleted + 1);
      gameRewarded = true;
      saveState();
      updateWallet();
      renderShop();
      showToast("+10 coins! You're growing! ✨");
    }
  } else {
    message.textContent = "Good try! Take another look — mistakes help us learn.";
    message.className = "game-message error";
  }
  document.getElementById("next-question").textContent = "Next question →";
});

document.querySelectorAll(".phrase-btn").forEach(button => button.addEventListener("click", () => {
  const phrase = button.dataset.phrase;
  state.petPhrase = phrase;
  document.getElementById("pet-quote").textContent = `“${phrase}”`;
  document.getElementById("pet-feedback").textContent = `Mochi wags their tail! “${phrase}” 💛`;
  saveState();
}));
document.getElementById("grammar-btn").addEventListener("click", () => openGame("grammar"));

updateWallet();
renderShop();
updateRoomItems();
if (state.petPhrase) document.getElementById("pet-quote").textContent = `“${state.petPhrase}”`;
