const STORAGE_KEY = 'auralis-bank-state-v1';

const defaultState = {
  profile: {
    name: 'Alex',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
    theme: 'emerald'
  },
  balance: 14850.5,
  pin: '1234',
  biometricEnabled: true,
  contacts: [
    { id: 'max', name: 'Макс', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80' },
    { id: 'sofia', name: 'Софія', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80' },
    { id: 'denis', name: 'Денис', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80' },
    { id: 'alina', name: 'Аліна', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80' }
  ],
  transactions: [
    { id: 't1', title: 'Steam Games', category: 'Ігри', amount: -350, icon: 'pink', time: 'Сьогодні, 16:42' },
    { id: 't2', title: 'Переказ від Мами', category: 'Кишенькові', amount: 1000, icon: 'green', time: 'Сьогодні, 12:15' },
    { id: 't3', title: 'Coffee House', category: 'Кава / їжа', amount: -180, icon: 'violet', time: 'Вчора, 19:10' }
  ],
  jars: [
    { id: 'jar1', name: 'AirPods Max', emoji: '🎧', current: 12000, target: 22000 },
    { id: 'jar2', name: 'Новий байк', emoji: '🚲', current: 4500, target: 15000 }
  ],
  categories: [
    { id: 'cat-1', name: 'Розваги', value: 1540, share: 45, icon: 'violet' },
    { id: 'cat-2', name: 'Їжа та кафе', value: 1025, share: 30, icon: 'amber' },
    { id: 'cat-3', name: 'Транспорт', value: 620, share: 18, icon: 'teal' }
  ]
};

const state = loadState();
let currentTab = 'home';
let activeSheet = null;
let pinInput = '';
let sheetOpen = false;
let promptMode = null;

const els = {
  lockScreen: document.getElementById('lock-screen'),
  appShell: document.getElementById('app-shell'),
  balanceValue: document.getElementById('balance-value'),
  contactsList: document.getElementById('contacts-list'),
  transactionsList: document.getElementById('transactions-list'),
  savingsList: document.getElementById('savings-list'),
  categoriesList: document.getElementById('categories-list'),
  welcomeName: document.getElementById('welcome-name'),
  profileAvatar: document.getElementById('profile-avatar'),
  navItems: [...document.querySelectorAll('.nav-item')],
  navPill: document.getElementById('nav-pill'),
  toast: document.getElementById('toast'),
  sheetBackdrop: document.getElementById('sheet-backdrop'),
  actionSheet: document.getElementById('action-sheet'),
  sheetTitle: document.getElementById('sheet-title'),
  sheetBody: document.getElementById('sheet-body'),
  faceModal: document.getElementById('faceid-modal'),
  biometricBtn: document.getElementById('biometric-btn'),
  faceButton: document.getElementById('face-button'),
  notifyButton: document.getElementById('notify-button'),
  installButton: document.getElementById('install-button'),
  changePinBtn: document.getElementById('change-pin-btn'),
  biometricToggle: document.getElementById('biometric-toggle'),
  addJarBtn: document.getElementById('add-jar')
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState));
      return JSON.parse(JSON.stringify(defaultState));
    }
    return JSON.parse(raw);
  } catch (error) {
    return JSON.parse(JSON.stringify(defaultState));
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatMoney(value) {
  const abs = Math.abs(value);
  return new Intl.NumberFormat('uk-UA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(abs);
}

function updateTheme() {
  document.body.classList.remove('theme-violet', 'theme-amber');
  document.body.classList.add(`theme-${state.profile.theme}`);
  document.querySelectorAll('.theme-swatch').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === state.profile.theme);
  });
}

function setBalanceValue() {
  const whole = Math.floor(state.balance).toLocaleString('uk-UA');
  const cents = Math.abs(state.balance % 1).toFixed(2).slice(2);
  els.balanceValue.textContent = whole;
  const balanceParent = els.balanceValue.parentElement;
  const centNode = balanceParent.querySelector('.balance-cents');
  if (centNode) centNode.textContent = `.${cents}`;
}

function updateHeader() {
  const label = state.profile.name ? `Привіт, ${state.profile.name}!` : 'Привіт!';
  els.welcomeName.textContent = label;
  els.profileAvatar.src = state.profile.avatar;
}

function renderContacts() {
  const contacts = state.contacts;
  els.contactsList.innerHTML = '';

  const addCard = document.createElement('button');
  addCard.type = 'button';
  addCard.className = 'contact-pill add';
  addCard.innerHTML = '<span class="add-box">+</span><span>Новий</span>';
  addCard.addEventListener('click', () => {
    showToast('Новий контакт скоро додасться');
  });
  els.contactsList.appendChild(addCard);

  contacts.forEach(contact => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'contact-pill';
    card.innerHTML = `
      <span class="avatar-box"><img src="${contact.avatar}" alt="${contact.name}" /></span>
      <span>${contact.name}</span>
    `;
    card.addEventListener('click', () => openTransferSheet(contact.name));
    els.contactsList.appendChild(card);
  });
}

function renderTransactions() {
  els.transactionsList.innerHTML = '';

  state.transactions.slice(0, 6).forEach(tx => {
    const item = document.createElement('div');
    item.className = 'transaction-item';
    const isIncome = tx.amount >= 0;
    const amount = formatMoney(tx.amount);
    item.innerHTML = `
      <div class="transaction-main">
        <span class="tx-icon ${tx.icon === 'green' ? 'green' : tx.icon === 'red' ? 'red' : tx.icon === 'pink' ? 'pink' : 'violet'}">
          ${tx.icon === 'green' ? '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 18V6m0 0 4 4m-4-4-4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' : tx.icon === 'pink' ? '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M8 16V8h8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M7 8h10v8H7zM9 12h6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'}
        </span>
        <div class="transaction-meta">
          <h4>${tx.title}</h4>
          <p>${tx.time} • ${tx.category}</p>
        </div>
      </div>
      <div class="transaction-amount ${isIncome ? 'income' : 'expense'}">
        <strong>${isIncome ? '+' : '-'} ₴ ${amount}</strong>
        <small>${isIncome ? 'Поповнення' : 'Витрата'}</small>
      </div>
    `;
    els.transactionsList.appendChild(item);
  });
}

function renderSavings() {
  els.savingsList.innerHTML = '';

  state.jars.forEach(jar => {
    const percent = Math.min((jar.current / jar.target) * 100, 100);
    const item = document.createElement('div');
    item.className = 'jar-item';
    item.innerHTML = `
      <div class="jar-head">
        <div class="jar-main">
          <div class="jar-emoji">${jar.emoji}</div>
          <div class="jar-meta">
            <h4>${jar.name}</h4>
            <p>Зібрано ₴ ${jar.current.toLocaleString('uk-UA')} з ${jar.target.toLocaleString('uk-UA')}</p>
          </div>
        </div>
        <span class="jar-pill">${Math.round(percent)}%</span>
      </div>
      <div class="progress-bar"><span class="progress-fill" style="width:${percent}%"></span></div>
      <div class="jar-foot">
        <span>+₴ ${(jar.target - jar.current) * 0.08} до цілі</span>
        <button type="button" data-jar="${jar.id}">Поповнити +</button>
      </div>
    `;

    item.querySelector('button').addEventListener('click', () => addMoneyToJar(jar.id));
    els.savingsList.appendChild(item);
  });
}

function renderCategories() {
  els.categoriesList.innerHTML = '';

  state.categories.forEach(cat => {
    const item = document.createElement('div');
    item.className = 'category-item';
    item.innerHTML = `
      <div class="category-main">
        <span class="tx-icon ${cat.icon === 'violet' ? 'violet' : cat.icon === 'amber' ? 'violet' : 'green'}">${cat.icon === 'violet' ? '🎮' : cat.icon === 'amber' ? '☕' : '🚕'}</span>
        <div class="category-meta">
          <h4>${cat.name}</h4>
          <p>${cat.share}% від усіх витрат</p>
        </div>
      </div>
      <div class="category-value">₴ ${cat.value.toLocaleString('uk-UA')}</div>
    `;
    els.categoriesList.appendChild(item);
  });
}

function renderAll() {
  updateHeader();
  setBalanceValue();
  renderContacts();
  renderTransactions();
  renderSavings();
  renderCategories();
  updateTheme();
  updateNav();
}

function updateNav() {
  const index = ['home', 'analytics', 'savings', 'settings'].indexOf(currentTab);
  const width = 100 / 4;
  els.navPill.style.transform = `translateX(${index * 100}%)`;

  els.navItems.forEach((button, i) => {
    button.classList.toggle('active', i === index);
  });
}

function switchTab(tabName) {
  currentTab = tabName;
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `tab-${tabName}`);
  });
  updateNav();
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add('show');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    els.toast.classList.remove('show');
  }, 1800);
}

function openSheet(title, content) {
  els.sheetTitle.textContent = title;
  els.sheetBody.innerHTML = content;
  els.sheetBackdrop.classList.add('visible');
  els.actionSheet.classList.add('open');
  sheetOpen = true;
}

function closeSheet() {
  els.sheetBackdrop.classList.remove('visible');
  els.actionSheet.classList.remove('open');
  sheetOpen = false;
}

function addTransaction({ title, category, amount, icon, time = new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }) }) {
  state.transactions.unshift({
    id: `t-${Date.now()}`,
    title,
    category,
    amount,
    icon,
    time: `${new Date().toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' })} • ${time}`
  });
  state.transactions = state.transactions.slice(0, 10);
  renderTransactions();
  saveState();
}

function addMoneyToJar(jarId) {
  const jar = state.jars.find(item => item.id === jarId);
  if (!jar) return;

  const amount = 150;
  jar.current += amount;
  state.balance -= amount;
  addTransaction({ title: `Поповнення ${jar.name}`, category: 'Скарбничка', amount: -amount, icon: 'green', time: 'Сьогодні' });
  saveState();
  renderAll();
  showToast(`Додано +₴ ${amount} до ${jar.name}`);
  closeSheet();
}

function topUpBalance(amount) {
  if (!Number.isFinite(amount) || amount <= 0) {
    showToast('Введіть правильну суму');
    return;
  }

  state.balance += amount;
  addTransaction({ title: 'Поповнення картки', category: 'Картка', amount, icon: 'green', time: 'Сьогодні' });
  renderAll();
  showToast(`Поповнено на +₴ ${amount}`);
  closeSheet();
}

function openTopUpSheet() {
  const content = `
    <div class="sheet-grid">
      <button class="sheet-option" type="button" data-quick="100"><span>+₴ 100</span></button>
      <button class="sheet-option" type="button" data-quick="250"><span>+₴ 250</span></button>
      <button class="sheet-option" type="button" data-quick="500"><span>+₴ 500</span></button>
      <button class="sheet-option" type="button" data-quick="1000"><span>+₴ 1000</span></button>
    </div>
    <input id="custom-topup" class="sheet-input" type="number" min="50" step="50" placeholder="Інша сума" value="300" />
    <button id="confirm-topup" class="primary-action" type="button">Поповнити</button>
  `;

  openSheet('Поповнити баланс', content);

  document.querySelectorAll('[data-quick]').forEach(btn => {
    btn.addEventListener('click', () => {
      const value = Number(btn.dataset.quick);
      topUpBalance(value);
    });
  });

  const customInput = document.getElementById('custom-topup');
  const confirmBtn = document.getElementById('confirm-topup');
  confirmBtn.addEventListener('click', () => {
    const value = Number(customInput.value || 0);
    topUpBalance(value);
  });
}

function openTransferSheet(targetName = 'контакт') {
  const content = `
    <input id="transfer-name" class="sheet-input" value="${targetName}" placeholder="Контакт" />
    <input id="transfer-amount" class="sheet-input" type="number" min="10" step="10" placeholder="Сума переказу" value="250" />
    <button id="confirm-transfer" class="primary-action" type="button">Надіслати</button>
  `;

  openSheet('Переказ', content);

  document.getElementById('confirm-transfer').addEventListener('click', () => {
    const name = document.getElementById('transfer-name').value.trim() || 'Контакт';
    const amount = Number(document.getElementById('transfer-amount').value || 0);

    if (!Number.isFinite(amount) || amount <= 0) {
      showToast('Введіть коректну суму');
      return;
    }

    if (state.balance < amount) {
      showToast('Недостатньо коштів');
      return;
    }

    state.balance -= amount;
    addTransaction({ title: `Переказ ${name}`, category: 'Переказ', amount: -amount, icon: 'red', time: 'Сьогодні' });
    renderAll();
    showToast(`Відправлено ₴ ${amount} ${name}`);
    closeSheet();
  });
}

function openMoreSheet() {
  const options = [
    ['Платіжка', 'wallet'],
    ['Карта', 'credit-card'],
    ['Підписка', 'shield'],
    ['Реквізити', 'info']
  ];

  const content = `
    <div class="sheet-grid">
      ${options.map(([label, icon]) => `
        <button class="sheet-option" type="button"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M5 8.5h14M5 15.5h10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="17" cy="15.5" r="2.2" fill="none" stroke="currentColor" stroke-width="1.8"/></svg><span>${label}</span></button>
      `).join('')}
    </div>
  `;

  openSheet('Інші дії', content);

  document.querySelectorAll('.sheet-option').forEach(button => {
    button.addEventListener('click', () => {
      const label = button.textContent.trim();
      showToast(`${label} відкрито`);
      closeSheet();
    });
  });
}

function openJarSheet() {
  const content = `
    <div class="sheet-grid">
      <button class="sheet-option" type="button" data-jar-action="save"><span>Зберегти</span></button>
      <button class="sheet-option" type="button" data-jar-action="plan"><span>План</span></button>
      <button class="sheet-option" type="button" data-jar-action="dream"><span>Мрія</span></button>
      <button class="sheet-option" type="button" data-jar-action="settings"><span>Налаштувати</span></button>
    </div>
  `;

  openSheet('Скарбничка', content);

  document.querySelectorAll('[data-jar-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.jarAction;
      const messages = {
        save: 'Сума збережена до скарбнички',
        plan: 'План накопичення активний',
        dream: 'Цільова мрія відкрилась',
        settings: 'Налаштування скарбниці оновлено'
      };
      showToast(messages[action] || 'Готово');
      closeSheet();
    });
  });
}

function handleQuickAction(actionName) {
  if (actionName === 'transfer') openTransferSheet();
  if (actionName === 'topup') openTopUpSheet();
  if (actionName === 'jar') openJarSheet();
  if (actionName === 'more') openMoreSheet();
}

function unlockApp() {
  els.appShell.classList.add('visible');
  els.lockScreen.classList.add('hidden');
}

function showFaceIdModal() {
  els.faceModal.classList.add('show');
  setTimeout(() => {
    els.faceModal.classList.remove('show');
    unlockApp();
  }, 1200);
}

function handlePinInput(value) {
  if (value === 'delete') {
    pinInput = pinInput.slice(0, -1);
    renderPinDots();
    return;
  }

  if (value === 'enter') {
    if (pinInput.length < 4) {
      showToast('Введіть 4-значний PIN');
      return;
    }

    if (pinInput === state.pin) {
      unlockApp();
      pinInput = '';
      renderPinDots();
      return;
    }

    showToast('Невірний PIN');
    pinInput = '';
    renderPinDots();
    return;
  }

  if (pinInput.length >= 4) return;
  pinInput += value;
  renderPinDots();

  if (pinInput.length === 4) {
    setTimeout(() => {
      if (pinInput === state.pin) {
        unlockApp();
        pinInput = '';
        renderPinDots();
      } else {
        showToast('Невірний PIN');
        pinInput = '';
        renderPinDots();
      }
    }, 200);
  }
}

function renderPinDots() {
  const dots = [...document.querySelectorAll('.passcode-dot')];
  dots.forEach((dot, index) => dot.classList.toggle('active', index < pinInput.length));
}

function setDefaultScreen() {
  currentTab = 'home';
  switchTab('home');
}

function installApp() {
  if (!window.deferredPrompt) {
    showToast('Вже встановлено або недоступно');
    return;
  }

  window.deferredPrompt.prompt();
  window.deferredPrompt.userChoice.then(() => {
    window.deferredPrompt = null;
    els.installButton.classList.add('hidden');
  });
}

function showBiometricSettings() {
  const enabled = els.biometricToggle.checked;
  state.biometricEnabled = enabled;
  saveState();
  showToast(enabled ? 'Face ID увімкнено' : 'Face ID вимкнено');
}

function changePin() {
  const nextPin = window.prompt('Введіть новий 4-значний PIN:', state.pin);
  if (!nextPin) return;

  const cleaned = nextPin.replace(/\D/g, '');
  if (cleaned.length !== 4) {
    showToast('PIN повинен містити 4 цифри');
    return;
  }

  state.pin = cleaned;
  saveState();
  showToast('PIN успішно змінено');
}

function addJar() {
  const name = window.prompt('Назва цілі:', 'Подорож');
  if (!name) return;

  state.jars.unshift({
    id: `jar-${Date.now()}`,
    name: name.trim() || 'Нова ціль',
    emoji: '✨',
    current: 0,
    target: 15000
  });

  saveState();
  renderSavings();
  showToast('Нова скарбничка створена');
}

function handleDocumentClick(event) {
  const actionItem = event.target.closest('[data-action]');
  if (actionItem) {
    handleQuickAction(actionItem.dataset.action);
  }

  const nav = event.target.closest('.nav-item');
  if (nav) {
    switchTab(nav.dataset.tab);
  }

  if (event.target === els.sheetBackdrop) closeSheet();
}

function bindEvents() {
  document.addEventListener('click', handleDocumentClick);

  document.querySelectorAll('.digit').forEach(button => {
    button.addEventListener('click', () => handlePinInput(button.dataset.value));
  });

  document.getElementById('biometric-btn').addEventListener('click', () => {
    if (state.biometricEnabled) {
      showFaceIdModal();
    } else {
      showToast('Face ID вимкнено в налаштуваннях');
    }
  });

  document.getElementById('face-button').addEventListener('click', () => {
    showFaceIdModal();
  });

  document.getElementById('notify-button').addEventListener('click', () => {
    showToast('Сповіщення: 3 нових повідомлення');
  });

  document.getElementById('flip-card').addEventListener('click', () => {
    const card = document.getElementById('bank-card');
    const isRotated = card.dataset.flip === 'true';
    card.dataset.flip = String(!isRotated);
    card.style.transform = isRotated ? 'rotateY(0deg)' : 'rotateY(180deg)';
    card.style.boxShadow = isRotated ? '0 28px 70px rgba(2, 6, 23, 0.6)' : '0 28px 80px rgba(16, 185, 129, 0.22)';
    showToast(isRotated ? 'Card details hidden' : 'Card details shown');
  });

  document.querySelectorAll('.theme-swatch').forEach(btn => {
    btn.addEventListener('click', () => {
      state.profile.theme = btn.dataset.theme;
      saveState();
      updateTheme();
      showToast('Тема оновлена');
    });
  });

  els.biometricToggle.addEventListener('change', showBiometricSettings);
  els.changePinBtn.addEventListener('click', changePin);
  els.addJarBtn.addEventListener('click', addJar);
  els.installButton.addEventListener('click', installApp);

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    window.deferredPrompt = event;
    els.installButton.classList.remove('hidden');
  });

  window.addEventListener('keydown', event => {
    if (event.key === 'Escape' && sheetOpen) closeSheet();
  });
}

function boot() {
  bindEvents();
  renderAll();
  setDefaultScreen();
  renderPinDots();
  const appHasInstall = !!window.matchMedia('(display-mode: standalone)').matches;
  if (appHasInstall) els.installButton.classList.add('hidden');
}

boot();

window.addEventListener('storage', () => {
  const restored = loadState();
  Object.assign(state, restored);
  renderAll();
});

window.deferredPrompt = null;






























































































































































































































































































actionSheet; 
























































































































































