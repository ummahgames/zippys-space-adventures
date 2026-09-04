const state = {
  stars: Number(localStorage.getItem('zippy-stars') || 0),
  suit: localStorage.getItem('zippy-suit') || 'pink',
  sound: localStorage.getItem('zippy-sound') !== 'off',
  mission: 0,
  totalMissions: 5,
  currentAnswer: 0,
  locked: false,
};

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

function showView(id) {
  $$('.view').forEach(v => v.classList.toggle('active', v.id === id));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

$$('[data-view]').forEach(btn => btn.addEventListener('click', () => showView(btn.dataset.view)));
$('.planet-card.unlocked').addEventListener('click', startMission);
$('#nextMissionBtn').addEventListener('click', startMission);

function updateHud() {
  $('#starCount').textContent = state.stars;
  $('#soundBtn').textContent = state.sound ? '🔊' : '🔇';
}

function generateQuestion() {
  const a = Math.floor(Math.random() * 5) + 1;
  const b = Math.floor(Math.random() * 5) + 1;
  state.currentAnswer = a + b;
  $('#equation').textContent = `${a} + ${b} = ?`;
  $('#questionVisual').innerHTML = `${'<span>⭐</span>'.repeat(a)} <strong>+</strong> ${'<span>⭐</span>'.repeat(b)}`;
  const choices = new Set([state.currentAnswer]);
  while (choices.size < 3) {
    const offset = Math.floor(Math.random() * 5) - 2;
    const candidate = Math.max(1, state.currentAnswer + offset);
    choices.add(candidate);
  }
  const shuffled = [...choices].sort(() => Math.random() - .5);
  $('#answers').innerHTML = shuffled.map(n => `<button class="answer-btn" data-answer="${n}">${n}</button>`).join('');
  $$('.answer-btn').forEach(btn => btn.addEventListener('click', handleAnswer));
}

function startMission() {
  state.mission = 0;
  state.locked = false;
  showView('game');
  nextQuestion();
}

function nextQuestion() {
  state.mission += 1;
  $('#missionText').textContent = `Mission ${state.mission} of ${state.totalMissions}`;
  $('#progressBar').style.width = `${(state.mission / state.totalMissions) * 100}%`;
  $('#feedback').textContent = 'Zippy says: You can do it! 🌟';
  state.locked = false;
  generateQuestion();
}

function handleAnswer(e) {
  if (state.locked) return;
  state.locked = true;
  const selected = Number(e.currentTarget.dataset.answer);
  if (selected === state.currentAnswer) {
    e.currentTarget.classList.add('correct');
    $('#feedback').textContent = 'Amazing! Star power restored! ✨';
    ping(760, .08);
    state.stars += 1;
    localStorage.setItem('zippy-stars', state.stars);
    updateHud();
    setTimeout(() => {
      if (state.mission >= state.totalMissions) showView('complete');
      else nextQuestion();
    }, 650);
  } else {
    e.currentTarget.classList.add('wrong');
    $('#feedback').textContent = 'Almost! Count the stars and try again. 💫';
    ping(250, .09);
    setTimeout(() => {
      e.currentTarget.classList.remove('wrong');
      state.locked = false;
    }, 550);
  }
}

function ping(freq, duration) {
  if (!state.sound) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + duration);
    osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + duration);
  } catch (_) {}
}

$('#soundBtn').addEventListener('click', () => {
  state.sound = !state.sound;
  localStorage.setItem('zippy-sound', state.sound ? 'on' : 'off');
  updateHud();
});

$$('[data-suit]').forEach(btn => btn.addEventListener('click', () => {
  state.suit = btn.dataset.suit;
  localStorage.setItem('zippy-suit', state.suit);
  $$('.swatch').forEach(s => s.classList.toggle('active', s.dataset.suit === state.suit));
  $('#astronautPreview').className = `astronaut-preview ${state.suit}`;
}));

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); deferredPrompt = e; $('#installBtn').hidden = false;
});
$('#installBtn').addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; $('#installBtn').hidden = true;
});

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));

$('#astronautPreview').className = `astronaut-preview ${state.suit}`;
$$('.swatch').forEach(s => s.classList.toggle('active', s.dataset.suit === state.suit));
updateHud();
