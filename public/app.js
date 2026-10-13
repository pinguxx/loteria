// High-performance Native WebSocket Client for Rust Backend
class RustLoteriaSocket {
  constructor() {
    this.handlers = {};
    this.queue = [];
    this.id = null;
    this.connect();
  }

  connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('🦀 Connected to Rust WebSocket server!');
      while (this.queue.length > 0) {
        const item = this.queue.shift();
        this.ws.send(item);
      }
      if (this.handlers['connect']) {
        this.handlers['connect'].forEach(cb => cb());
      }
      // Auto-reconnect session if found in localStorage
      const rawSession = localStorage.getItem('loteria_session');
      if (rawSession) {
        try {
          const session = JSON.parse(rawSession);
          if (session && session.roomCode && session.playerId) {
            this.emit('reconnect_session', {
              roomCode: session.roomCode,
              playerId: session.playerId
            });
          }
        } catch (e) {
          localStorage.removeItem('loteria_session');
        }
      }
    };


    this.ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const eventName = payload.event;
        const data = payload.data;
        if (this.handlers[eventName]) {
          this.handlers[eventName].forEach(cb => cb(data));
        }
      } catch (err) {
        console.error('Error parsing WS message:', err);
      }
    };

    this.ws.onclose = () => {
      setTimeout(() => this.connect(), 2000);
    };

    this.ws.onerror = (err) => {
      console.warn('WS error:', err);
    };
  }

  on(eventName, callback) {
    if (!this.handlers[eventName]) this.handlers[eventName] = [];
    this.handlers[eventName].push(callback);
  }

  emit(type, data = {}) {
    const msg = JSON.stringify({ type, ...data });
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(msg);
    } else {
      this.queue.push(msg);
    }
  }
}

let socket = null;
let CARDS = [];
let CARDS_MAP = new Map();

// Internationalization (i18n)
// Default language is English as requested
let currentLang = localStorage.getItem('loteria_lang') || 'en';

const TRANSLATIONS = {
  en: {
    appTitle: 'LOTERÍA',
    appSubtitle: 'Online Multiplayer Game',
    langButton: '🌐 Español',
    tabCreate: 'Create Room',
    tabJoin: 'Join Room',
    labelName: 'Your Name or Nickname',
    placeholderHost: 'e.g. Lucky Charlie',
    placeholderGuest: 'e.g. Maria',
    labelWinPattern: 'Winning Condition',
    patternFull: '🏆 Full Board (all 16 cards)',
    patternLine: '📏 Any Line (Row, Column, Diagonal)',
    patternCorners: '📐 Four Corners',
    patternCenter: '🎯 Center / Pot (2x2 center)',
    labelCaller: 'Card Caller',
    callerAuto: '⏱️ Automatic',
    callerManual: '✋ Manual (Host calls)',
    labelSpeed: 'Calling Speed',
    speedFast: 'Fast (5 sec)',
    speedNormal: 'Normal (7 sec)',
    speedRelaxed: 'Relaxed (9 sec)',
    speedChill: 'Chill / Plenty of Time (12 sec)',
    labelVerseAudio: 'Read traditional verses aloud',
    btnCreate: 'Create Room & Play!',
    labelRoomCode: 'Room Code (5 letters)',
    btnJoin: 'Enter Room!',
    lobbyTitle: 'Waiting Lobby',
    codeLabel: 'Code:',
    btnCopy: 'Copy',
    playersInRoom: 'Players in room',
    btnStartGame: 'START GAME!',
    waitingHost: 'Waiting for host to start the game...',
    yourTabla: 'Your Board',
    btnShuffle: '🔀 Shuffle Board',
    shuffleHint: 'You can shuffle your board before the game starts until you like your cards.',
    callerTitle: 'The Caller',
    cardCounter: (cur, tot) => `Card ${cur} / ${tot}`,
    waitingToStart: 'Waiting to start...',
    shufflingDeck: '"Shuffling the deck of cards..."',
    previousCards: 'Previous cards:',
    noCardsYet: 'None yet',
    btnNextCard: '👉 Next Card',
    playersScoreboard: 'Players in game:',
    roomTag: 'ROOM:',
    beansPlaced: 'Beans placed:',
    winnerTitle: '¡¡LOTERÍA!!',
    btnPlayAgain: 'Play Another Round!',
    waitingNextRound: 'Waiting for host to start another round...',
    toastLinkCopied: 'Invite link copied to clipboard!',
    toastCodeCopied: (code) => `Room code ${code} copied!`,
    toastRoomCreated: (code) => `Room ${code} created successfully!`,
    toastJoined: (code) => `Joined room ${code}!`,
    toastNewTabla: 'New board generated!',
    toastGameStarted: 'The game has started! Watch the caller!',
    toastPaused: 'Caller paused',
    toastResumed: 'Caller resumed',
    toastSoundOn: 'Sound FX enabled',
    toastSoundOff: 'Sound FX disabled',
    toastSpeechOn: 'Voice caller enabled',
    toastSpeechOff: 'Voice caller disabled',
    toastDeckExhausted: 'No more cards left in the deck!',
    toastFalseCall: "Wait! You haven't completed the winning pattern yet or marked uncalled cards.",
    toastFalseClaimAlert: (name) => `${name} shouted Loteria but didn't have the full pattern yet! Game continues.`,
    winsBadge: (w) => `🏆 ${w} win${w === 1 ? '' : 's'}`,
    hostTag: 'Host',
    youTag: '(You)',
    leaveRoom: 'Leave',
    leaveRoomConfirm: 'Are you sure you want to leave the game room?',
    btnExitRoom: '🚪 Leave to Main Menu',
    toastLeftRoom: 'You left the room.',
    badgeFull: '🏆 Full Board',
    badgeLine: '📏 Any Line',
    badgeCorners: '📐 4 Corners',
    badgeCenter: '🎯 Center',
    resumeTitle: 'Game in Progress',
    btnResume: '▶️ Resume',
    toastReconnected: (code) => `Reconnected to room ${code}!`,
    labelChips: 'Betting Chips / Pozo',
    chipsOff: '🚫 No Chips (Free Play)',
    chips5: '💰 5 Chips Buy-in',
    chips10: '💰 10 Chips Buy-in',
    chips20: '💰 20 Chips Buy-in',
    potLabel: 'Pot:',
    potWon: 'Pot Won:',
    chipsLabel: 'chips',
    qrTitle: '📱 Scan to Join Game',
    qrSubtitle: 'Point phone camera to join directly without typing code',
    qrBtn: '📱 QR',
    themeChanged: (name) => `Theme changed to: ${name}`,
    themeFiesta: 'Fiesta Clásica',
    themeMuertos: 'Día de los Muertos',
    themeVintage: 'Vintage Feria 1950s',
    podiumWinner: 'Grand Winner',
    podiumSalado: '"El Salado"',
    podiumSaladoSub: '1 bean away!',
    podiumDormilon: '"El Dormilón"',
    podiumDormilonSub: 'Missed drawn cards',
    tokenChanged: (name) => `Marker token: ${name}`,
    dualTablaOn: '🎴 2 Boards (ACTIVE)',
    dualTablaOff: '🎴+ 2 Boards'
  },
  es: {
    appTitle: 'LOTERÍA',
    appSubtitle: 'Mexicana Multijugador',
    langButton: '🌐 English',
    tabCreate: 'Crear Sala',
    tabJoin: 'Unirse a Sala',
    labelName: 'Tu Nombre o Apodo',
    placeholderHost: 'Ej. Don Ferruco',
    placeholderGuest: 'Ej. Josefita',
    labelWinPattern: 'Modo de Ganar',
    patternFull: '🏆 Tabla Llena (16 cartas)',
    patternLine: '📏 Cualquier Línea (Horizontal, Vertical, Diagonal)',
    patternCorners: '📐 Cuatro Esquinas',
    patternCenter: '🎯 Centro / Pozo (2x2 central)',
    labelCaller: 'El Cantor',
    callerAuto: '⏱️ Automático',
    callerManual: '✋ Manual (por Anfitrión)',
    labelSpeed: 'Velocidad',
    speedFast: 'Rápida (5 seg)',
    speedNormal: 'Normal (7 seg)',
    speedRelaxed: 'Tranquila (9 seg)',
    speedChill: 'Pausa / Con tiempo (12 seg)',
    labelVerseAudio: 'Cantar los versos tradicionales en voz alta',
    btnCreate: '¡Crear Sala y Jugar!',
    labelRoomCode: 'Código de Sala (5 letras)',
    btnJoin: '¡Entrar a la Sala!',
    lobbyTitle: 'Sala de Espera',
    codeLabel: 'Código:',
    btnCopy: 'Copiar',
    playersInRoom: 'Jugadores en la sala',
    btnStartGame: '¡COMENZAR PARTIDA!',
    waitingHost: 'Esperando a que el anfitrión inicie la partida...',
    yourTabla: 'Tu Tabla Asignada',
    btnShuffle: '🔀 Cambiar Tabla',
    shuffleHint: 'Puedes barajar tu tabla antes de que empiece la partida hasta que te guste tu suerte.',
    callerTitle: 'El Cantor',
    cardCounter: (cur, tot) => `Carta ${cur} / ${tot}`,
    waitingToStart: 'Esperando...',
    shufflingDeck: '"Barajando el mazo de cartas..."',
    previousCards: 'Cartas anteriores:',
    noCardsYet: 'Ninguna aún',
    btnNextCard: '👉 Siguiente Carta',
    playersScoreboard: 'Jugadores en la partida:',
    roomTag: 'SALA:',
    beansPlaced: 'Frijoles puestos:',
    winnerTitle: '¡¡LOTERÍA!!',
    btnPlayAgain: '¡Jugar Otra Ronda!',
    waitingNextRound: 'Esperando a que el anfitrión comience otra ronda...',
    toastLinkCopied: '¡Enlace de invitación copiado al portapapeles!',
    toastCodeCopied: (code) => `Código ${code} copiado`,
    toastRoomCreated: (code) => `¡Sala ${code} creada con éxito!`,
    toastJoined: (code) => `¡Te has unido a la sala ${code}!`,
    toastNewTabla: '¡Nueva tabla generada!',
    toastGameStarted: '¡La partida ha comenzado! ¡Atentos al cantor!',
    toastPaused: 'Cantor en pausa',
    toastResumed: 'Cantor reanudado',
    toastSoundOn: 'Sonidos FX activados',
    toastSoundOff: 'Sonidos FX desactivados',
    toastSpeechOn: 'Voz del Cantor activada',
    toastSpeechOff: 'Voz del Cantor desactivada',
    toastDeckExhausted: '¡Se acabaron las cartas del mazo!',
    toastFalseCall: '¡Ojo! Aún no completas la figura requerida o marcaste cartas no cantadas.',
    toastFalseClaimAlert: (name) => `¡${name} gritó Lotería pero aún no tenía la figura! Continúa el juego.`,
    winsBadge: (w) => `🏆 ${w} victoria${w === 1 ? '' : 's'}`,
    hostTag: 'Anfitrión',
    youTag: '(Tú)',
    leaveRoom: 'Salir',
    leaveRoomConfirm: '¿Seguro que deseas salir de esta sala?',
    btnExitRoom: '🚪 Volver al Menú Principal',
    toastLeftRoom: 'Has salido de la sala.',
    badgeFull: '🏆 Tabla Llena',
    badgeLine: '📏 Una Línea',
    badgeCorners: '📐 4 Esquinas',
    badgeCenter: '🎯 Centro',
    resumeTitle: 'Partida en Curso',
    btnResume: '▶️ Reanudar',
    toastReconnected: (code) => `¡Reconectado a la sala ${code}!`,
    labelChips: 'Fichas de Apuesta / Pozo',
    chipsOff: '🚫 Sin Fichas (Juego Libre)',
    chips5: '💰 Entrada de 5 Fichas',
    chips10: '💰 Entrada de 10 Fichas',
    chips20: '💰 Entrada de 20 Fichas',
    potLabel: 'Pozo:',
    potWon: '¡Pozo Ganado!:',
    chipsLabel: 'fichas',
    qrTitle: '📱 Escanea para Entrar',
    qrSubtitle: 'Apunta la cámara de tu celular para unirte sin escribir el código',
    qrBtn: '📱 QR',
    themeChanged: (name) => `Tema cambiado a: ${name}`,
    themeFiesta: 'Fiesta Clásica',
    themeMuertos: 'Día de los Muertos',
    themeVintage: 'Feria Vintage 1950',
    podiumWinner: 'Gran Ganador',
    podiumSalado: '"El Salado"',
    podiumSaladoSub: '¡A 1 frijolito!',
    podiumDormilon: '"El Dormilón"',
    podiumDormilonSub: 'Cartas pasadas',
    tokenChanged: (name) => `Ficha: ${name}`,
    dualTablaOn: '🎴 2 Tablas (ACTIVO)',
    dualTablaOff: '🎴+ 2 Tablas'
  }
};

// Global translation accessor
function t() {
  return TRANSLATIONS[currentLang] || TRANSLATIONS.en;
}

// Local player state
let myPlayer = {
  id: null,
  name: '',
  tabla: [],
  isHost: false
};
let currentRoomCode = '';
let currentSettings = {
  winPattern: 'full',
  callerMode: 'auto',
  speedSeconds: 7,
  verseAudio: true
};
let myPlacedBeans = new Set();
let myPlacedBeans2 = new Set();
let hasSecondTabla = false;
let mySecondTabla = null;
let currentToken = localStorage.getItem('loteria_token') || 'theme';
const TOKEN_EMOJIS = {
  theme: '🎨',
  frijol: '🫘',
  corcholata: '🪙',
  moneda: '💰',
  maiz: '🌽',
  calavera: '💀',
  boton: '🔘'
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, function(m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m];
  });
}

let isAudioMuted = false;
let isSpeechMuted = false;
let latestRoomData = null;
let isGameActive = false;

// Screens dictionary
const screens = {
  welcome: document.getElementById('screen-welcome'),
  lobby: document.getElementById('screen-lobby'),
  game: document.getElementById('screen-game')
};

// Apply UI Language
function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('loteria_lang', lang);
  const tr = t();

  // Language button label
  const langBtn = document.getElementById('btn-toggle-lang');
  if (langBtn) langBtn.textContent = tr.langButton;

  // Text content elements with data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (tr[key]) {
      el.textContent = tr[key];
    }
  });

  // Placeholder inputs with data-i18n-ph
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const key = el.dataset.i18nPh;
    if (tr[key]) {
      el.placeholder = tr[key];
    }
  });

  // Select dropdown options
  const patternSelect = document.getElementById('create-pattern');
  if (patternSelect) {
    patternSelect.options[0].text = tr.patternFull;
    patternSelect.options[1].text = tr.patternLine;
    patternSelect.options[2].text = tr.patternCorners;
    patternSelect.options[3].text = tr.patternCenter;
  }

  const modeSelect = document.getElementById('create-mode');
  if (modeSelect) {
    modeSelect.options[0].text = tr.callerAuto;
    modeSelect.options[1].text = tr.callerManual;
  }

  const speedSelect = document.getElementById('create-speed');
  if (speedSelect) {
    speedSelect.options[0].text = tr.speedFast;
    speedSelect.options[1].text = tr.speedNormal;
    speedSelect.options[2].text = tr.speedRelaxed;
    speedSelect.options[3].text = tr.speedChill;
  }

  const chipsSelect = document.getElementById('create-chips');
  if (chipsSelect) {
    chipsSelect.options[0].text = tr.chipsOff;
    chipsSelect.options[1].text = tr.chips5;
    chipsSelect.options[2].text = tr.chips10;
    chipsSelect.options[3].text = tr.chips20;
  }

  // Update rule badges
  updateRuleBadges();

  // If players list is currently displayed, re-render labels
  if (latestRoomData) {
    renderRoomPlayers(latestRoomData);
  }
}

function updateRuleBadges() {
  const trans = t();
  const patternMap = {
    full: trans.badgeFull,
    line: trans.badgeLine,
    four_corners: trans.badgeCorners,
    center: trans.badgeCenter
  };
  const patternText = patternMap[currentSettings.winPattern] || currentSettings.winPattern;
  const lobbyBadge = document.getElementById('lobby-rule-badge');
  const gameBadge = document.getElementById('game-rule-badge');
  if (lobbyBadge) lobbyBadge.textContent = patternText;
  if (gameBadge) gameBadge.textContent = patternText;
}

// Theme Manager (Fiesta Clásica, Día de los Muertos, Vintage Feria 1950s)
let currentTheme = localStorage.getItem('loteria_theme') || 'fiesta';

function updateAmbientDecorations(themeName) {
  const layer = document.getElementById('ambient-theme-layer');
  if (!layer) return;
  layer.innerHTML = '';

  let icons = [];
  let count = 10;
  if (themeName === 'muertos') {
    icons = ['💀', '🌼', '🏵️', '🕯️', '💀', '🌼', '🏵️', '💀'];
    count = 14;
  } else if (themeName === 'vintage') {
    icons = ['⭐', '✦', '✨', '🪙', '★'];
    count = 10;
  } else {
    // fiesta
    icons = ['🎉', '✨', '🪅', '🎊', '🇲🇽'];
    count = 10;
  }

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'ambient-particle';
    const icon = icons[i % icons.length];
    p.textContent = icon;

    const left = (i * (94 / count) + Math.random() * (90 / count)).toFixed(1);
    const duration = (10 + Math.random() * 8).toFixed(1);
    const delay = (Math.random() * 7).toFixed(1);
    const size = themeName === 'muertos' ? (1.3 + Math.random() * 0.9).toFixed(2) : (0.95 + Math.random() * 0.75).toFixed(2);
    const driftX = (Math.random() * 90 - 45).toFixed(0) + 'px';
    const rot = (Math.random() * 140 - 70).toFixed(0) + 'deg';

    p.style.left = `${left}%`;
    p.style.fontSize = `${size}rem`;
    p.style.animationDuration = `${duration}s`;
    p.style.animationDelay = `${delay}s`;
    p.style.setProperty('--drift-x', driftX);
    p.style.setProperty('--rot', rot);

    if (themeName === 'muertos' && (icon === '🌼' || icon === '🏵️')) {
      p.style.color = '#f59e0b';
    } else if (themeName === 'vintage') {
      p.style.color = '#dda15e';
    }

    layer.appendChild(p);
  }
}

function applyTheme(themeName) {
  currentTheme = themeName;
  localStorage.setItem('loteria_theme', themeName);
  document.body.dataset.theme = themeName;

  const themeBtn = document.getElementById('btn-toggle-theme');
  const logoBadge = document.querySelector('.logo-badge');

  if (themeName === 'muertos') {
    if (themeBtn) {
      themeBtn.textContent = '💀';
      themeBtn.title = 'Día de los Muertos (Click to switch / Clic para cambiar)';
    }
    if (logoBadge) logoBadge.textContent = '💀';
  } else if (themeName === 'vintage') {
    if (themeBtn) {
      themeBtn.textContent = '📜';
      themeBtn.title = 'Vintage Feria 1950s (Click to switch / Clic para cambiar)';
    }
    if (logoBadge) logoBadge.textContent = '🎪';
  } else {
    if (themeBtn) {
      themeBtn.textContent = '🎨';
      themeBtn.title = 'Fiesta Clásica (Click to switch / Clic para cambiar)';
    }
    if (logoBadge) logoBadge.textContent = '🎴';
  }

  // Atmospheric floating decorations
  updateAmbientDecorations(themeName);

  // Re-render QR code with theme-appropriate dark color if open
  if (currentRoomCode) {
    const qrPanel = document.getElementById('lobby-qr-card');
    if (qrPanel && qrPanel.style.display !== 'none') {
      renderLobbyQRCode(currentRoomCode);
    }
  }
}

function cycleTheme() {
  const themes = ['fiesta', 'muertos', 'vintage'];
  const nextIdx = (themes.indexOf(currentTheme) + 1) % themes.length;
  const nextTheme = themes[nextIdx];
  applyTheme(nextTheme);

  const tr = t();
  const themeName = nextTheme === 'muertos' ? tr.themeMuertos : (nextTheme === 'vintage' ? tr.themeVintage : tr.themeFiesta);
  showToast(tr.themeChanged(themeName));
}

// Pure Local QR Code Generator for Lobby Sharing
let qrcodeInstance = null;

function renderLobbyQRCode(roomCode) {
  const container = document.getElementById('lobby-qrcode');
  if (!container || !window.QRCode || !roomCode) return;

  container.innerHTML = '';
  const joinUrl = `${window.location.protocol}//${window.location.host}/?room=${roomCode}`;

  const darkColor = currentTheme === 'muertos' ? '#180828' : (currentTheme === 'vintage' ? '#3d2616' : '#1e1b18');

  qrcodeInstance = new QRCode(container, {
    text: joinUrl,
    width: 130,
    height: 130,
    colorDark: darkColor,
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.M
  });
}

function saveLocalSession(roomCode, player, isHost) {
  try {
    const session = {
      roomCode,
      playerId: player.id,
      playerName: player.name,
      isHost,
      timestamp: Date.now()
    };
    localStorage.setItem('loteria_session', JSON.stringify(session));
  } catch (e) {
    console.warn('Could not save session:', e);
  }
}

function clearLocalSession() {
  localStorage.removeItem('loteria_session');
  const banner = document.getElementById('resume-banner');
  if (banner) banner.style.display = 'none';
}

function checkResumeBanner() {
  const banner = document.getElementById('resume-banner');
  if (!banner) return;
  const raw = localStorage.getItem('loteria_session');
  if (!raw) {
    banner.style.display = 'none';
    return;
  }
  try {
    const session = JSON.parse(raw);
    document.getElementById('resume-room-code').textContent = session.roomCode;
    document.getElementById('resume-player-name').textContent = session.playerName;
    banner.style.display = 'flex';
  } catch (e) {
    banner.style.display = 'none';
  }
}

function showScreen(name) {
  Object.values(screens).forEach(s => s && s.classList.remove('active'));
  if (screens[name]) {
    screens[name].classList.add('active');
  }
  const headerLeaveBtn = document.getElementById('btn-header-leave');
  if (headerLeaveBtn) {
    headerLeaveBtn.style.display = (name === 'welcome') ? 'none' : 'inline-flex';
  }
  if (name === 'welcome') {
    checkResumeBanner();
  }
}

function leaveCurrentRoom(skipConfirm = false) {
  if (!skipConfirm && isGameActive) {
    if (!confirm(t().leaveRoomConfirm)) {
      return;
    }
  }

  isGameActive = false;
  window.loteriaAudio.stopSpeech();
  const modal = document.getElementById('winner-modal');
  if (modal) modal.classList.remove('active');

  if (socket && currentRoomCode) {
    socket.emit('leave_room', { roomCode: currentRoomCode });
  }

  currentRoomCode = '';
  myPlayer = { id: null, name: '', tabla: [], isHost: false };
  myPlacedBeans.clear();
  myPlacedBeans2.clear();
  hasSecondTabla = false;
  mySecondTabla = null;
  updateDualTablaUI();
  latestRoomData = null;

  clearLocalSession();

  if (window.history.pushState) {
    const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
    window.history.pushState({ path: cleanUrl }, '', cleanUrl);
  }

  showScreen('welcome');
  showToast(t().toastLeftRoom);
}



function switchTab(tab) {
  const tabCreate = document.getElementById('tab-create');
  const tabJoin = document.getElementById('tab-join');
  const formCreate = document.getElementById('form-create');
  const formJoin = document.getElementById('form-join');

  if (tab === 'create') {
    tabCreate.classList.add('active');
    tabJoin.classList.remove('active');
    formCreate.style.display = 'block';
    formJoin.style.display = 'none';
  } else {
    tabJoin.classList.add('active');
    tabCreate.classList.remove('active');
    formJoin.style.display = 'block';
    formCreate.style.display = 'none';
  }
}

// Show Toast Message
function showToast(message, isWarning = false) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${isWarning ? 'warning' : ''}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-15px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Render a 4x4 Tabla Grid into a container element
function renderTabla(containerElement, cardIds, isInteractive = false, markedIndices = new Set(), isBoard2 = false) {
  if (!containerElement || !cardIds) return;
  containerElement.innerHTML = '';

  cardIds.forEach((cardId, index) => {
    const card = CARDS_MAP.get(cardId);
    if (!card) return;

    const tile = document.createElement('div');
    tile.className = 'tabla-card';
    tile.dataset.index = index;
    tile.dataset.cardId = cardId;
    tile.style.backgroundColor = card.color || '#fffbeb';

    // Random slight rotation for bean if marked
    const beanRotation = ((index * 37) % 60) - 30;

    tile.innerHTML = `
      <div class="tile-num">${card.id}</div>
      <div class="tile-art">${card.emoji}</div>
      <div class="tile-name" title="${card.name}">${card.name}</div>
      <div class="tile-english" title="${card.english}">${card.english}</div>
      ${markedIndices.has(index) ? `<div class="bean-token" data-token="${currentToken}" style="--bean-rot: ${beanRotation}deg;"></div>` : ''}
    `;

    if (isInteractive) {
      tile.addEventListener('click', () => {
        if (isBoard2) {
          handleTileClick2(index);
        } else {
          handleTileClick(index);
        }
      });
    }

    containerElement.appendChild(tile);
  });
}

// Handle placing / removing a bean token on Board 1
function handleTileClick(index) {
  if (myPlacedBeans.has(index)) {
    myPlacedBeans.delete(index);
    window.loteriaAudio.playBeanRemove();
  } else {
    myPlacedBeans.add(index);
    window.loteriaAudio.playBeanPop();
  }

  // Update DOM tile directly
  const gameTabla = document.getElementById('game-tabla');
  if (gameTabla) {
    const tile = gameTabla.children[index];
    if (tile) {
      const existingBean = tile.querySelector('.bean-token');
      if (myPlacedBeans.has(index)) {
        if (!existingBean) {
          const bean = document.createElement('div');
          bean.className = 'bean-token';
          bean.dataset.token = currentToken;
          const rot = ((index * 37) % 60) - 30;
          bean.style.setProperty('--bean-rot', `${rot}deg`);
          tile.appendChild(bean);
        }
      } else {
        if (existingBean) existingBean.remove();
      }
    }
  }

  updateBeanCounters();

  // Tell server so other players see our beans count on the live scoreboard
  if (socket && currentRoomCode) {
    socket.emit('toggle_bean', {
      roomCode: currentRoomCode,
      cardIndex: index
    });
  }
}

// Handle placing / removing a bean token on Board 2
function handleTileClick2(index) {
  if (myPlacedBeans2.has(index)) {
    myPlacedBeans2.delete(index);
    window.loteriaAudio.playBeanRemove();
  } else {
    myPlacedBeans2.add(index);
    window.loteriaAudio.playBeanPop();
  }

  const gameTabla2 = document.getElementById('game-tabla-2');
  if (gameTabla2) {
    const tile = gameTabla2.children[index];
    if (tile) {
      const existingBean = tile.querySelector('.bean-token');
      if (myPlacedBeans2.has(index)) {
        if (!existingBean) {
          const bean = document.createElement('div');
          bean.className = 'bean-token';
          bean.dataset.token = currentToken;
          const rot = ((index * 37) % 60) - 30;
          bean.style.setProperty('--bean-rot', `${rot}deg`);
          tile.appendChild(bean);
        }
      } else {
        if (existingBean) existingBean.remove();
      }
    }
  }

  updateBeanCounters();

  if (socket && currentRoomCode) {
    socket.emit('toggle_bean_2', {
      roomCode: currentRoomCode,
      cardIndex: index
    });
  }
}

function updateBeanCounters() {
  const badge = document.getElementById('bean-count-badge');
  if (badge) {
    if (hasSecondTabla) {
      badge.textContent = `T1: ${myPlacedBeans.size} | T2: ${myPlacedBeans2.size}`;
    } else {
      badge.textContent = `${myPlacedBeans.size} / 16`;
    }
  }
  const t1Count = document.getElementById('t1-count');
  if (t1Count) t1Count.textContent = myPlacedBeans.size;
  const t2Count = document.getElementById('t2-count');
  if (t2Count) t2Count.textContent = myPlacedBeans2.size;
}

function updateDualTablaUI() {
  const btn = document.getElementById('btn-toggle-dual-tabla');
  const tabs = document.getElementById('dual-tabla-tabs');
  const board1 = document.getElementById('game-tabla');
  const board2 = document.getElementById('game-tabla-2');
  const tr = t();

  if (btn) {
    if (hasSecondTabla) {
      btn.classList.add('active');
      btn.textContent = tr.dualTablaOn || '🎴 2 Tablas (ACTIVO)';
    } else {
      btn.classList.remove('active');
      btn.textContent = tr.dualTablaOff || '🎴+ 2 Tablas';
    }
  }

  if (tabs) {
    tabs.style.display = hasSecondTabla ? 'flex' : 'none';
  }

  if (!hasSecondTabla) {
    if (board1) board1.style.display = 'grid';
    if (board2) board2.style.display = 'none';
    const tab1 = document.getElementById('tab-tabla-1');
    const tab2 = document.getElementById('tab-tabla-2');
    if (tab1) tab1.classList.add('active');
    if (tab2) tab2.classList.remove('active');
  }

  updateBeanCounters();
}

// Floating Shout Speech Bubble Animation
function spawnFloatingShout(senderName, shoutText) {
  const bubble = document.createElement('div');
  bubble.className = 'floating-shout-bubble';
  bubble.innerHTML = `<strong>${escapeHtml(senderName)}:</strong> ${escapeHtml(shoutText)}`;

  const leftPos = Math.floor(Math.random() * 40) + 30; // 30% to 70%
  bubble.style.left = `${leftPos}%`;

  document.body.appendChild(bubble);
  if (window.loteriaAudio) {
    window.loteriaAudio.playCardChime();
  }
  setTimeout(() => bubble.remove(), 3200);
}

// Floating Emoji Animation
function spawnFloatingEmoji(emoji) {
  const el = document.createElement('div');
  el.className = 'floating-emoji';
  el.textContent = emoji;

  const leftPos = Math.floor(Math.random() * 70) + 15;
  el.style.left = `${leftPos}%`;

  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

// Confetti burst animation
function launchConfetti() {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.6 }
    });
    setTimeout(() => {
      confetti({
        particleCount: 80,
        angle: 60,
        spread: 70,
        origin: { x: 0 }
      });
      confetti({
        particleCount: 80,
        angle: 120,
        spread: 70,
        origin: { x: 1 }
      });
    }, 400);
  }
}

// Render room player lists
function renderRoomPlayers(data) {
  if (!data || !data.players) return;
  const tr = t();
  const myId = socket ? socket.id : (myPlayer ? myPlayer.id : null);
  const playersListEl = document.getElementById('lobby-players-list');
  if (playersListEl) {
    document.getElementById('lobby-player-count').textContent = data.players.length;
    playersListEl.innerHTML = '';

    data.players.forEach(p => {
      const isMe = p.id === myId || (myPlayer && p.id === myPlayer.id);
      const item = document.createElement('div');
      item.className = `player-item ${isMe ? 'is-me' : ''}`;
      item.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <span>👤</span>
          <strong>${p.name}</strong>
          ${isMe ? `<span style="font-size: 0.75rem; color: #f59e0b;">${tr.youTag}</span>` : ''}
          ${p.isHost ? `<span class="host-tag">${tr.hostTag}</span>` : ''}
        </div>
        <div style="font-size: 0.85rem; color: #cbd5e1; display: flex; align-items: center; gap: 8px;">
          ${tr.winsBadge(p.wins)}
          ${p.chips !== undefined ? `<span class="player-chips-badge">💰 ${p.chips}</span>` : ''}
        </div>
      `;
      playersListEl.appendChild(item);
    });
  }

  const scoreboardEl = document.getElementById('game-scoreboard-chips');
  if (scoreboardEl) {
    scoreboardEl.innerHTML = '';
    data.players.forEach(p => {
      const isMe = p.id === myId || (myPlayer && p.id === myPlayer.id);
      const chip = document.createElement('div');
      chip.className = `player-chip ${isMe ? 'is-me' : ''}`;
      chip.innerHTML = `
        <strong>${p.name}</strong>: 🫘 ${p.beansCount}
        ${p.chips !== undefined ? `<span style="color: #fde047; font-size: 0.75rem; margin-left: 4px;">(💰${p.chips})</span>` : ''}
      `;
      scoreboardEl.appendChild(chip);
    });
  }
}

// Socket Listeners Setup
function setupSocketListeners() {

  // 1. Room Created
  socket.on('room_created', ({ roomCode, isHost, player }) => {
    socket.id = player.id;
    currentRoomCode = roomCode;
    myPlayer = { ...player, isHost };
    saveLocalSession(roomCode, player, isHost);

    document.getElementById('lobby-room-code').textContent = roomCode;
    document.getElementById('game-room-code-tag').textContent = roomCode;

    document.getElementById('lobby-host-controls').style.display = 'block';
    document.getElementById('lobby-guest-msg').style.display = 'none';

    renderTabla(document.getElementById('preview-tabla'), myPlayer.tabla);
    renderLobbyQRCode(roomCode);
    showScreen('lobby');
    showToast(t().toastRoomCreated(roomCode));
  });

  // 2. Joined Room
  socket.on('joined_room', ({ roomCode, isHost, player }) => {
    socket.id = player.id;
    currentRoomCode = roomCode;
    myPlayer = { ...player, isHost };
    saveLocalSession(roomCode, player, isHost);

    document.getElementById('lobby-room-code').textContent = roomCode;
    document.getElementById('game-room-code-tag').textContent = roomCode;

    if (isHost) {
      document.getElementById('lobby-host-controls').style.display = 'block';
      document.getElementById('lobby-guest-msg').style.display = 'none';
    } else {
      document.getElementById('lobby-host-controls').style.display = 'none';
      document.getElementById('lobby-guest-msg').style.display = 'block';
    }

    renderTabla(document.getElementById('preview-tabla'), myPlayer.tabla);
    renderLobbyQRCode(roomCode);
    showScreen('lobby');
    showToast(t().toastJoined(roomCode));
  });

  // Session Restored (After Page Refresh or Reconnecting)
  socket.on('session_restored', (data) => {
    socket.id = data.player.id;
    currentRoomCode = data.roomCode;
    myPlayer = { ...data.player, isHost: data.isHost };
    currentSettings = data.settings;
    latestRoomData = data;
    myPlacedBeans = new Set(data.player.beans || []);
    myPlacedBeans2 = new Set(data.player.beans_2 || []);
    hasSecondTabla = !!data.player.tabla_2;
    mySecondTabla = data.player.tabla_2 || null;
    updateDualTablaUI();

    saveLocalSession(data.roomCode, data.player, data.isHost);
    const resumeBanner = document.getElementById('resume-banner');
    if (resumeBanner) resumeBanner.style.display = 'none';

    document.getElementById('lobby-room-code').textContent = data.roomCode;
    document.getElementById('game-room-code-tag').textContent = data.roomCode;
    updateRuleBadges();
    if (data.players) renderRoomPlayers(data);
    renderLobbyQRCode(data.roomCode);

    // Pot badges update
    const potBadges = [document.getElementById('game-pot-badge'), document.getElementById('mobile-pot-badge')];
    const potVals = [document.getElementById('game-pot-val'), document.getElementById('mobile-pot-val')];
    const hasChips = data.settings && data.settings.enableChips;
    const potAmount = data.pot || 0;
    potBadges.forEach(b => { if (b) b.style.display = hasChips ? 'inline-flex' : 'none'; });
    potVals.forEach(v => { if (v) v.textContent = potAmount; });

    if (data.roomState === 'playing') {
      isGameActive = true;
      updateBeanCounters();

      if (data.isPaused !== undefined) {
        const pauseBtn = document.getElementById('btn-toggle-pause');
        if (pauseBtn) pauseBtn.textContent = data.isPaused ? '▶️' : '⏸️';
      }

      if (document.getElementById('game-cards-left')) {
        document.getElementById('game-cards-left').textContent = t().cardCounter(data.drawnCount, data.totalCards || 54);
      }

      // Update Desktop Active Card if present
      if (data.currentCard) {
        const card = data.currentCard;
        const activeCardEl = document.getElementById('active-card');
        document.getElementById('active-card-num').textContent = card.id;
        document.getElementById('active-card-art').textContent = card.emoji;
        document.getElementById('active-card-name').textContent = card.name;
        document.getElementById('active-card-english').textContent = card.english;
        const verseEsEl = document.getElementById('active-verse-es');
        const verseEnEl = document.getElementById('active-verse-en');
        if (verseEsEl) verseEsEl.textContent = `"${card.verse}"`;
        if (verseEnEl) verseEnEl.textContent = card.verseEnglish ? `"${card.verseEnglish}"` : '';
        if (activeCardEl) activeCardEl.style.backgroundColor = card.color || '#fffbeb';

        // Update Mobile Strip
        const mobNum = document.getElementById('mobile-card-num');
        if (mobNum) mobNum.textContent = card.id;
        const mobArt = document.getElementById('mobile-card-art');
        if (mobArt) mobArt.textContent = card.emoji;
        const mobName = document.getElementById('mobile-card-name');
        if (mobName) mobName.textContent = card.name;
        const mobEng = document.getElementById('mobile-card-english');
        if (mobEng) mobEng.textContent = card.english;
        const mobCount = document.getElementById('mobile-cards-left');
        if (mobCount) mobCount.textContent = `${data.drawnCount}/54`;
        const mobVerseEs = document.getElementById('mobile-verse-es');
        if (mobVerseEs) mobVerseEs.textContent = `"${card.verse}"`;
        const mobVerseEn = document.getElementById('mobile-verse-en');
        if (mobVerseEn) mobVerseEn.textContent = card.verseEnglish ? `"${card.verseEnglish}"` : '';
      }

      // Restore History Tray
      const tray = document.getElementById('history-tray');
      if (tray && data.recentCards) {
        tray.innerHTML = '';
        data.recentCards.forEach(cid => {
          const c = CARDS_MAP.get(cid);
          if (!c) return;
          const mini = document.createElement('div');
          mini.className = 'history-card-mini';
          mini.title = `${c.id}. ${c.name} (${c.english})`;
          mini.style.backgroundColor = c.color || '#fffbeb';
          mini.innerHTML = `<span class="mini-num">${c.id}</span><span>${c.emoji}</span>`;
          tray.appendChild(mini);
        });
      }

      // Render interactive board with beans
      renderTabla(document.getElementById('game-tabla'), myPlayer.tabla, true, myPlacedBeans, false);
      if (hasSecondTabla && mySecondTabla) {
        renderTabla(document.getElementById('game-tabla-2'), mySecondTabla, true, myPlacedBeans2, true);
      }

      // Host controls
      const hostControls = document.getElementById('host-game-controls');
      if (hostControls) hostControls.style.display = data.isHost ? 'flex' : 'none';

      showScreen('game');
    } else if (data.roomState === 'ended' && data.winner) {
      isGameActive = false;
      renderTabla(document.getElementById('game-tabla'), myPlayer.tabla, false, myPlacedBeans, false);
      if (hasSecondTabla && mySecondTabla) {
        renderTabla(document.getElementById('game-tabla-2'), mySecondTabla, false, myPlacedBeans2, true);
      }

      const hostControls = document.getElementById('host-game-controls');
      if (hostControls) hostControls.style.display = 'none';

      document.getElementById('winner-message').textContent = `¡${data.winner.name} has won shouting LOTERÍA!`;
      const winContainer = document.getElementById('winner-tabla-preview');
      renderTabla(winContainer, data.winner.tabla);

      const isHost = data.isHost;
      const hostActions = document.getElementById('winner-host-actions');
      const guestMsg = document.getElementById('winner-guest-msg');
      const guestActions = document.getElementById('winner-guest-actions');
      if (hostActions) hostActions.style.display = isHost ? 'block' : 'none';
      if (guestMsg) guestMsg.style.display = isHost ? 'none' : 'block';
      if (guestActions) guestActions.style.display = isHost ? 'none' : 'block';

      document.getElementById('winner-modal').classList.add('active');
      showScreen('game');
    } else {
      isGameActive = false;
      renderTabla(document.getElementById('preview-tabla'), myPlayer.tabla);

      const hostControls = document.getElementById('lobby-host-controls');
      const guestMsg = document.getElementById('lobby-guest-msg');
      if (hostControls) hostControls.style.display = data.isHost ? 'block' : 'none';
      if (guestMsg) guestMsg.style.display = data.isHost ? 'none' : 'block';

      showScreen('lobby');
    }

    showToast(t().toastReconnected(data.roomCode));
  });

  socket.on('reconnect_failed', () => {
    clearLocalSession();
  });


  // 3. Join Error
  socket.on('join_error', ({ message }) => {
    showToast(message, true);
  });

  // 4. Tabla Updated (Shuffle)
  socket.on('tabla_updated', ({ tabla }) => {
    myPlayer.tabla = tabla;
    renderTabla(document.getElementById('preview-tabla'), tabla);
    showToast(t().toastNewTabla);
  });

  // Second Tabla Updated
  socket.on('second_tabla_updated', ({ tabla2 }) => {
    if (tabla2) {
      hasSecondTabla = true;
      mySecondTabla = tabla2;
      const game2 = document.getElementById('game-tabla-2');
      if (game2) renderTabla(game2, mySecondTabla, isGameActive, myPlacedBeans2, true);
    } else {
      hasSecondTabla = false;
      mySecondTabla = null;
    }
    updateDualTablaUI();
  });

  // 5. Room State Sync
  socket.on('room_state', (data) => {
    latestRoomData = data;
    currentSettings = data.settings;
    const isHost = (data.hostId === socket.id) || (myPlayer && myPlayer.id && data.hostId === myPlayer.id);
    myPlayer.isHost = isHost;

    updateRuleBadges();
    renderRoomPlayers(data);

    // Pot badges update
    const potBadges = [document.getElementById('game-pot-badge'), document.getElementById('mobile-pot-badge')];
    const potVals = [document.getElementById('game-pot-val'), document.getElementById('mobile-pot-val')];
    const hasChips = data.settings && data.settings.enableChips;
    const potAmount = data.pot || 0;
    potBadges.forEach(b => { if (b) b.style.display = hasChips ? 'inline-flex' : 'none'; });
    potVals.forEach(v => { if (v) v.textContent = potAmount; });

    // Host controls visibility
    if (isHost) {
      document.getElementById('lobby-host-controls').style.display = 'block';
      document.getElementById('lobby-guest-msg').style.display = 'none';
      document.getElementById('host-game-controls').style.display = 'flex';
      document.getElementById('winner-host-actions').style.display = 'block';
      document.getElementById('winner-guest-msg').style.display = 'none';
    } else {
      document.getElementById('lobby-host-controls').style.display = 'none';
      document.getElementById('lobby-guest-msg').style.display = 'block';
      document.getElementById('host-game-controls').style.display = 'none';
      document.getElementById('winner-host-actions').style.display = 'none';
      document.getElementById('winner-guest-msg').style.display = 'block';
    }

    // Card drawn counter
    document.getElementById('game-cards-left').textContent = t().cardCounter(data.drawnCount, data.totalCards);

    // Sync pause button state if present
    if (data.isPaused !== undefined) {
      const pauseBtn = document.getElementById('btn-toggle-pause');
      if (pauseBtn) pauseBtn.textContent = data.isPaused ? '▶️' : '⏸️';
    }

    // Track active game state
    if (data.state !== 'playing') {
      isGameActive = false;
      if (data.winner) {
        window.loteriaAudio.stopSpeech();
      }
    } else {
      isGameActive = true;
    }
  });

  // 6. Game Started
  socket.on('game_started', () => {
    isGameActive = true;
    myPlacedBeans.clear();
    myPlacedBeans2.clear();
    updateBeanCounters();
    const pauseBtn = document.getElementById('btn-toggle-pause');
    if (pauseBtn) pauseBtn.textContent = '⏸️';
    // Reset Mobile Caller Strip
    const mName = document.getElementById('mobile-card-name');
    if (mName) mName.textContent = t().waitingToStart;
    const mEng = document.getElementById('mobile-card-english');
    if (mEng) mEng.textContent = 'Mexican Loteria';
    const mNum = document.getElementById('mobile-card-num');
    if (mNum) mNum.textContent = '--';
    const mArt = document.getElementById('mobile-card-art');
    if (mArt) mArt.textContent = '🎴';
    const mBadge = document.getElementById('mobile-card-badge');
    if (mBadge) mBadge.style.backgroundColor = '#fffbeb';
    const mCount = document.getElementById('mobile-cards-left');
    if (mCount) mCount.textContent = '0/54';
    const mVerseEs = document.getElementById('mobile-verse-es');
    if (mVerseEs) mVerseEs.textContent = t().shufflingDeck;
    const mVerseEn = document.getElementById('mobile-verse-en');
    if (mVerseEn) mVerseEn.textContent = '';

    // Render interactive tabla for the player
    renderTabla(document.getElementById('game-tabla'), myPlayer.tabla, true, myPlacedBeans, false);
    if (hasSecondTabla && mySecondTabla) {
      renderTabla(document.getElementById('game-tabla-2'), mySecondTabla, true, myPlacedBeans2, true);
    }

    showScreen('game');
    showToast(t().toastGameStarted);
  });

  // 7. Card Drawn
  socket.on('card_drawn', ({ card, drawnCount, recentCards }) => {
    if (!isGameActive) return; // Immediately ignore card draws if game ended

    const activeCardEl = document.getElementById('active-card');
    if (activeCardEl) {
      activeCardEl.classList.remove('pop-in');
      void activeCardEl.offsetWidth; // Trigger reflow for animation restart
      activeCardEl.classList.add('pop-in');
    }

    // Update Desktop Card UI
    document.getElementById('active-card-num').textContent = card.id;
    document.getElementById('active-card-art').textContent = card.emoji;
    document.getElementById('active-card-name').textContent = card.name;
    document.getElementById('active-card-english').textContent = card.english;
    
    // Update phrase in Spanish and English translation
    const verseEsEl = document.getElementById('active-verse-es');
    const verseEnEl = document.getElementById('active-verse-en');
    if (verseEsEl && verseEnEl) {
      verseEsEl.textContent = `"${card.verse}"`;
      verseEnEl.textContent = card.verseEnglish ? `"${card.verseEnglish}"` : '';
    } else {
      document.getElementById('active-card-verse').innerHTML = `
        <div class="verse-spanish">"${card.verse}"</div>
        <div class="verse-english">"${card.verseEnglish || ''}"</div>
      `;
    }
    if (activeCardEl) activeCardEl.style.backgroundColor = card.color || '#fffbeb';

    // Update Mobile Caller Strip UI (docked above board)
    const mobileBadge = document.getElementById('mobile-card-badge');
    if (mobileBadge) mobileBadge.style.backgroundColor = card.color || '#fffbeb';
    const mobNum = document.getElementById('mobile-card-num');
    if (mobNum) mobNum.textContent = card.id;
    const mobArt = document.getElementById('mobile-card-art');
    if (mobArt) mobArt.textContent = card.emoji;
    const mobName = document.getElementById('mobile-card-name');
    if (mobName) mobName.textContent = card.name;
    const mobEng = document.getElementById('mobile-card-english');
    if (mobEng) mobEng.textContent = card.english;
    const mobCount = document.getElementById('mobile-cards-left');
    if (mobCount) mobCount.textContent = `${drawnCount}/54`;
    const mobVerseEs = document.getElementById('mobile-verse-es');
    if (mobVerseEs) mobVerseEs.textContent = `"${card.verse}"`;
    const mobVerseEn = document.getElementById('mobile-verse-en');
    if (mobVerseEn) mobVerseEn.textContent = card.verseEnglish ? `"${card.verseEnglish}"` : '';

    // Play chime sound
    window.loteriaAudio.playCardChime();

    // Voice announcement (Speech Synthesis)
    // Speaks at comfortable 0.95x rate
    if (currentSettings.verseAudio) {
      window.loteriaAudio.speakCard(card.name, card.verse, card.english, card.verseEnglish, false);
    } else {
      window.loteriaAudio.speakCard(card.name, null, card.english, null, false);
    }

    // Update history reel
    const tray = document.getElementById('history-tray');
    tray.innerHTML = '';
    recentCards.forEach(cid => {
      const c = CARDS_MAP.get(cid);
      if (!c) return;
      const mini = document.createElement('div');
      mini.className = 'history-card-mini';
      mini.title = `${c.id}. ${c.name} (${c.english})`;
      mini.style.backgroundColor = c.color || '#fffbeb';
      mini.innerHTML = `
        <span class="mini-num">${c.id}</span>
        <span>${c.emoji}</span>
      `;
      tray.appendChild(mini);
    });
  });

  // 8. False Loteria penalty/alert
  socket.on('false_loteria', ({ message }) => {
    window.loteriaAudio.playBuzzer();
    showToast(t().toastFalseCall, true);
  });

  socket.on('false_claim_alert', ({ playerName }) => {
    showToast(t().toastFalseClaimAlert(playerName), true);
  });

  // 9. Legitimate Winner Announcement
  socket.on('loteria_winner', ({ winner, message, potPrize, salado, dormilon }) => {
    isGameActive = false;
    window.loteriaAudio.stopSpeech();
    window.loteriaAudio.playFanfare();

    if (potPrize && potPrize > 0) {
      setTimeout(() => window.loteriaAudio.playCoinWin(), 600);
      const potBanner = document.getElementById('winner-pot-banner');
      if (potBanner) {
        document.getElementById('winner-pot-amount').textContent = potPrize;
        potBanner.style.display = 'block';
      }
    } else {
      const potBanner = document.getElementById('winner-pot-banner');
      if (potBanner) potBanner.style.display = 'none';
    }

    launchConfetti();

    document.getElementById('winner-message').textContent = message;

    // Render winner's tabla preview
    const winContainer = document.getElementById('winner-tabla-preview');
    renderTabla(winContainer, winner.tabla);

    // Populate Round Podium (Winner, El Salado, El Dormilón)
    const podiumWinner = document.getElementById('podium-winner-name');
    if (podiumWinner) podiumWinner.textContent = winner.name;

    const saladoCard = document.getElementById('podium-salado-card');
    const saladoName = document.getElementById('podium-salado-name');
    if (salado && salado.name) {
      if (saladoName) saladoName.textContent = `${salado.name} (${salado.beans}/16)`;
      if (saladoCard) saladoCard.style.display = 'flex';
    } else {
      if (saladoName) saladoName.textContent = '---';
      if (saladoCard) saladoCard.style.display = 'none';
    }

    const dormilonCard = document.getElementById('podium-dormilon-card');
    const dormilonName = document.getElementById('podium-dormilon-name');
    const dormilonSub = document.getElementById('podium-dormilon-sub');
    if (dormilon && dormilon.name && dormilon.missed > 0) {
      if (dormilonName) dormilonName.textContent = dormilon.name;
      if (dormilonSub) dormilonSub.textContent = `¡Olvidó ${dormilon.missed} carta${dormilon.missed > 1 ? 's' : ''}!`;
      if (dormilonCard) dormilonCard.style.display = 'flex';
    } else {
      if (dormilonName) dormilonName.textContent = '---';
      if (dormilonCard) dormilonCard.style.display = 'none';
    }

    // Show host actions if host, or guest exit if guest
    const isHost = myPlayer && myPlayer.isHost;
    const hostActions = document.getElementById('winner-host-actions');
    const guestMsg = document.getElementById('winner-guest-msg');
    const guestActions = document.getElementById('winner-guest-actions');
    if (hostActions) hostActions.style.display = isHost ? 'block' : 'none';
    if (guestMsg) guestMsg.style.display = isHost ? 'none' : 'block';
    if (guestActions) guestActions.style.display = isHost ? 'none' : 'block';

    document.getElementById('winner-modal').classList.add('active');
  });


  // 10. Floating Reactions & Cotorreo Fair Shouts
  socket.on('new_reaction', ({ emoji, sender }) => {
    if (emoji && (emoji.length > 5 || emoji.includes(' ') || emoji.includes('!'))) {
      spawnFloatingShout(sender || 'Jugador', emoji);
    } else {
      spawnFloatingEmoji(emoji);
    }
  });

  // 11. Deck Exhausted without winner
  socket.on('deck_exhausted', ({ message }) => {
    showToast(t().toastDeckExhausted, true);
  });
}

// UI Event Listeners
function setupUIEventListeners() {
  // Mobile Drawer Toggle (Recent cards & Host controls on small screens)
  const drawerBtn = document.getElementById('btn-toggle-mobile-drawer');
  if (drawerBtn) {
    drawerBtn.addEventListener('click', () => {
      const panel = document.getElementById('caller-panel');
      if (panel) {
        panel.classList.toggle('drawer-open');
        drawerBtn.textContent = panel.classList.contains('drawer-open') ? '✖️' : '📜';
      }
    });
  }

  // Language Switcher Toggle
  document.getElementById('btn-toggle-lang').addEventListener('click', () => {
    const nextLang = currentLang === 'en' ? 'es' : 'en';
    applyLanguage(nextLang);
    showToast(nextLang === 'en' ? 'Interface switched to English' : 'Interfaz cambiada a Español');
  });

  // Theme Switcher (Fiesta Clásica, Día de los Muertos, Vintage Feria 1950s)
  const themeBtn = document.getElementById('btn-toggle-theme');
  if (themeBtn) {
    themeBtn.addEventListener('click', cycleTheme);
  }

  // Tabs
  document.getElementById('tab-create').addEventListener('click', () => switchTab('create'));
  document.getElementById('tab-join').addEventListener('click', () => switchTab('join'));

  // Toggle mode showing/hiding speed dropdown
  document.getElementById('create-mode').addEventListener('change', (e) => {
    document.getElementById('speed-group').style.display = e.target.value === 'auto' ? 'block' : 'none';
  });

  // Form Create Room
  document.getElementById('form-create').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('create-name').value;
    const winPattern = document.getElementById('create-pattern').value;
    const callerMode = document.getElementById('create-mode').value;
    const speedSeconds = parseInt(document.getElementById('create-speed').value, 10) || 7;
    const verseAudio = document.getElementById('create-verse-audio').checked;
    const chipsVal = parseInt(document.getElementById('create-chips').value, 10) || 0;
    const enableChips = chipsVal > 0;
    const buyIn = chipsVal;

    socket.emit('create_room', {
      playerName: name,
      settings: { winPattern, callerMode, speedSeconds, verseAudio, enableChips, buyIn }
    });
  });

  // Form Join Room
  document.getElementById('form-join').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('join-name').value;
    const roomCode = document.getElementById('join-code').value.toUpperCase().trim();

    if (!roomCode) return;
    socket.emit('join_room', {
      playerName: name,
      roomCode
    });
  });

  // Copy Room Code / Share Link
  document.getElementById('btn-copy-code').addEventListener('click', () => {
    const url = `${window.location.origin}?room=${currentRoomCode}`;
    navigator.clipboard.writeText(url).then(() => {
      showToast(t().toastLinkCopied);
    }).catch(() => {
      navigator.clipboard.writeText(currentRoomCode);
      showToast(t().toastCodeCopied(currentRoomCode));
    });
  });

  // Toggle QR Code Card
  const qrBtn = document.getElementById('btn-toggle-qr');
  if (qrBtn) {
    qrBtn.addEventListener('click', () => {
      const qrPanel = document.getElementById('lobby-qr-card');
      if (qrPanel) {
        const isHidden = qrPanel.style.display === 'none';
        qrPanel.style.display = isHidden ? 'block' : 'none';
        if (isHidden && currentRoomCode) {
          renderLobbyQRCode(currentRoomCode);
        }
      }
    });
  }

  // Shuffle My Tabla (in lobby)
  document.getElementById('btn-shuffle-tabla').addEventListener('click', () => {
    if (socket && currentRoomCode) {
      socket.emit('shuffle_tabla', { roomCode: currentRoomCode });
    }
  });

  // Start Game Button (Host)
  document.getElementById('btn-start-game').addEventListener('click', () => {
    if (socket && currentRoomCode) {
      socket.emit('start_game', { roomCode: currentRoomCode });
    }
  });

  // Manual Next Card (Host)
  document.getElementById('btn-manual-draw').addEventListener('click', () => {
    if (socket && currentRoomCode) {
      socket.emit('manual_draw', { roomCode: currentRoomCode });
    }
  });

  // Pause / Resume Auto Caller (Host)
  const pauseBtn = document.getElementById('btn-toggle-pause');
  pauseBtn.addEventListener('click', () => {
    if (socket && currentRoomCode) {
      socket.emit('toggle_pause', { roomCode: currentRoomCode });
    }
  });

  socket.on('game_paused', ({ isPaused }) => {
    pauseBtn.textContent = isPaused ? '▶️' : '⏸️';
    showToast(isPaused ? t().toastPaused : t().toastResumed);
  });

  // Claim ¡LOTERÍA! Button
  document.getElementById('btn-claim-loteria').addEventListener('click', () => {
    if (socket && currentRoomCode) {
      socket.emit('claim_loteria', { roomCode: currentRoomCode });
    }
  });

  // Restart Round / Play Again Button (Host)
  document.getElementById('btn-restart-round').addEventListener('click', () => {
    if (socket && currentRoomCode) {
      document.getElementById('winner-modal').classList.remove('active');
      socket.emit('restart_round', { roomCode: currentRoomCode });
    }
  });

  // Reaction Buttons
  document.querySelectorAll('.reaction-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const emoji = btn.dataset.emoji;
      if (socket && currentRoomCode) {
        socket.emit('send_reaction', {
          roomCode: currentRoomCode,
          emoji,
          playerName: myPlayer.name
        });
      }
    });
  });

  // Cotorreo Fair Shouts ("El Cotorreo")
  document.querySelectorAll('.cotorreo-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const shout = btn.dataset.shout;
      if (socket && currentRoomCode && shout) {
        socket.emit('send_reaction', {
          roomCode: currentRoomCode,
          emoji: shout,
          playerName: myPlayer ? myPlayer.name : ''
        });
      }
    });
  });

  // Token Selector Modal ("El Costalito de Fichas")
  const openTokenModal = () => {
    const modal = document.getElementById('token-modal');
    if (modal) {
      modal.classList.add('active');
      document.querySelectorAll('.token-choice-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.token === currentToken);
      });
    }
  };

  const closeTokenModal = () => {
    const modal = document.getElementById('token-modal');
    if (modal) modal.classList.remove('active');
  };

  const tokenHeaderBtn = document.getElementById('btn-toggle-token');
  if (tokenHeaderBtn) tokenHeaderBtn.addEventListener('click', openTokenModal);

  const tokenBoardBtn = document.getElementById('btn-board-token-select');
  if (tokenBoardBtn) tokenBoardBtn.addEventListener('click', openTokenModal);

  const closeTokenBtn = document.getElementById('btn-close-token-modal');
  if (closeTokenBtn) closeTokenBtn.addEventListener('click', closeTokenModal);

  document.querySelectorAll('.token-choice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tok = btn.dataset.token;
      if (tok) {
        currentToken = tok;
        localStorage.setItem('loteria_token', currentToken);
        document.querySelectorAll('.token-choice-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.token === currentToken);
        });
        const badge = document.getElementById('current-token-badge');
        if (badge) badge.textContent = TOKEN_EMOJIS[currentToken] || '🫘';
        // Update all existing beans on boards
        document.querySelectorAll('.bean-token').forEach(b => {
          b.dataset.token = currentToken;
        });
        if (window.loteriaAudio) window.loteriaAudio.playBeanPop();
        closeTokenModal();
      }
    });
  });

  // Dual Board Toggle & Tab Switching ("Modo Pro: Doble Tabla")
  const dualTablaBtn = document.getElementById('btn-toggle-dual-tabla');
  if (dualTablaBtn) {
    dualTablaBtn.addEventListener('click', () => {
      hasSecondTabla = !hasSecondTabla;
      if (socket && currentRoomCode) {
        socket.emit('set_second_tabla', {
          roomCode: currentRoomCode,
          enabled: hasSecondTabla
        });
      }
      updateDualTablaUI();
    });
  }

  const tab1 = document.getElementById('tab-tabla-1');
  const tab2 = document.getElementById('tab-tabla-2');
  const board1 = document.getElementById('game-tabla');
  const board2 = document.getElementById('game-tabla-2');

  if (tab1 && tab2 && board1 && board2) {
    tab1.addEventListener('click', () => {
      tab1.classList.add('active');
      tab2.classList.remove('active');
      board1.style.display = 'grid';
      board2.style.display = 'none';
    });
    tab2.addEventListener('click', () => {
      tab2.classList.add('active');
      tab1.classList.remove('active');
      board1.style.display = 'none';
      board2.style.display = 'grid';
    });
  }

  // PWA Install Button Handler
  const pwaBtn = document.getElementById('btn-pwa-install');
  if (pwaBtn) {
    pwaBtn.addEventListener('click', async () => {
      if (deferredPwaPrompt) {
        deferredPwaPrompt.prompt();
        const choice = await deferredPwaPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          pwaBtn.style.display = 'none';
        }
        deferredPwaPrompt = null;
      } else {
        showToast('Para instalar: Usa la opción "Agregar a inicio" de tu navegador 📱');
      }
    });
  }

  // Sound Effects Toggle
  const sndBtn = document.getElementById('btn-toggle-sound');
  sndBtn.addEventListener('click', () => {
    isAudioMuted = !isAudioMuted;
    window.loteriaAudio.enabled = !isAudioMuted;
    sndBtn.textContent = isAudioMuted ? '🔇' : '🔊';
    showToast(isAudioMuted ? t().toastSoundOff : t().toastSoundOn);
  });

  // Speech Toggle
  const spkBtn = document.getElementById('btn-toggle-speech');
  spkBtn.addEventListener('click', () => {
    isSpeechMuted = !isSpeechMuted;
    window.loteriaAudio.speechEnabled = !isSpeechMuted;
    spkBtn.textContent = isSpeechMuted ? '🤐' : '🗣️';
    showToast(isSpeechMuted ? t().toastSpeechOff : t().toastSpeechOn);
  });

  // Leave Room Header Button
  const headerLeave = document.getElementById('btn-header-leave');
  if (headerLeave) {
    headerLeave.addEventListener('click', () => leaveCurrentRoom(false));
  }

  // Leave Room from Winner Modal (Host)
  const winExitHost = document.getElementById('btn-winner-exit-host');
  if (winExitHost) {
    winExitHost.addEventListener('click', () => leaveCurrentRoom(true));
  }

  // Leave Room from Winner Modal (Guest)
  const winExitGuest = document.getElementById('btn-winner-exit-guest');
  if (winExitGuest) {
    winExitGuest.addEventListener('click', () => leaveCurrentRoom(true));
  }

  // Resume Active Game Banner
  const resumeBtn = document.getElementById('btn-resume-game');
  if (resumeBtn) {
    resumeBtn.addEventListener('click', () => {
      const raw = localStorage.getItem('loteria_session');
      if (raw && socket) {
        try {
          const s = JSON.parse(raw);
          socket.emit('reconnect_session', { roomCode: s.roomCode, playerId: s.playerId });
        } catch (e) {
          clearLocalSession();
        }
      }
    });
  }

  const dismissBtn = document.getElementById('btn-dismiss-resume');
  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => {
      clearLocalSession();
    });
  }
}

// PWA Service Worker & Install Prompt
let deferredPwaPrompt = null;
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      console.log('✅ ServiceWorker registered:', reg.scope);
    }).catch(err => {
      console.warn('SW registration failed:', err);
    });
  });
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPwaPrompt = e;
  const pwaBtn = document.getElementById('btn-pwa-install');
  if (pwaBtn) pwaBtn.style.display = 'inline-flex';
});

window.addEventListener('appinstalled', () => {
  deferredPwaPrompt = null;
  const pwaBtn = document.getElementById('btn-pwa-install');
  if (pwaBtn) pwaBtn.style.display = 'none';
  showToast('¡Lotería Mexicana instalada en tu dispositivo! 🎉');
});

// Initialize Application
async function init() {
  // 1. Fetch Cards Dataset
  try {
    const res = await fetch('/api/cards');
    CARDS = await res.json();
    CARDS.forEach(c => CARDS_MAP.set(c.id, c));
  } catch (err) {
    console.error('Error fetching cards:', err);
  }

  // Apply chosen/default language & theme
  applyLanguage(currentLang);
  applyTheme(currentTheme);

  // Set initial token badge
  const tokenBadge = document.getElementById('current-token-badge');
  if (tokenBadge) tokenBadge.textContent = TOKEN_EMOJIS[currentToken] || '🫘';

  // Check if a previous game session is available to resume
  checkResumeBanner();

  // 2. Connect to Rust WebSocket backend
  socket = new RustLoteriaSocket();
  setupSocketListeners();
  setupUIEventListeners();

  // Check URL parameters for quick join: ?room=ABC12
  const urlParams = new URLSearchParams(window.location.search);
  const roomParam = urlParams.get('room');
  if (roomParam) {
    switchTab('join');
    const joinCodeInput = document.getElementById('join-code');
    if (joinCodeInput) joinCodeInput.value = roomParam.toUpperCase();
    const joinNameInput = document.getElementById('join-name');
    if (joinNameInput) joinNameInput.focus();
  }
}

// Start app
window.addEventListener('DOMContentLoaded', init);

