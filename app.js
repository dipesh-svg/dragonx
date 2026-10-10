/**
 * DRAGON-X PHARMA - EXCLUSIVE PREGABALIN-400 & LFT CRYPTO PORTAL
 * Security Math Gate • Unique Alphanumeric ID Auth • Telegram Bot Integration
 * Minimum Quantity: 2 | Maximum Quantity: 100 | Currency: LFT Crypto
 */

(function () {
  'use strict';

  // Order Quantity Constraints
  const MIN_ORDER_QTY = 2;
  const MAX_ORDER_QTY = 100;

  // Storage Keys
  const STORAGE_KEYS = {
    USERS: 'dragonx_users_v1',
    SESSION: 'dragonx_active_session_v1',
    CART: 'dragonx_cart_v1',
    BOT_CONFIG: 'dragonx_bot_config_v1',
    CURRENCY: 'dragonx_currency_v1',
    SOUND_ENABLED: 'dragonx_sound_enabled_v1'
  };

  // Currency Rates (Default & Primary: LFT Crypto)
  const CURRENCY_RATES = {
    LFT: { symbol: 'LFT', rate: 1, name: 'LFT Crypto', isCrypto: true },
    LTC: { symbol: 'LTC', rate: 0.012, name: 'LTC (Litecoin)', isCrypto: true },
    USDT: { symbol: 'USDT', rate: 1, name: 'USDT (TRC-20)', isCrypto: true },
    BTC: { symbol: 'BTC', rate: 0.000015, name: 'BTC (Bitcoin)', isCrypto: true },
    USD: { symbol: '$', rate: 1, name: 'USD ($)', isCrypto: false },
    RUB: { symbol: '₽', rate: 92.5, name: 'RUB (₽)', isCrypto: false }
  };

  // EXCLUSIVE CATALOG: ONLY PREGABALIN - 400
  const PRODUCTS = [
    {
      id: 'pregabalin-400',
      name: 'Прегабалин - 400',
      latinName: 'Pregabalinum 400mg Original',
      category: 'neuro',
      badge: 'ФЛАГМАН',
      badgeClass: 'pill-red',
      image: 'assets/images/pregabalin-400.jpg',
      dose: '400 мг / капсула',
      region: 'Ташкент',
      packOptions: [
        { count: 2, price: 25, label: '2 капсулы — $25' },
        { count: 3, price: 35, label: '3 капсулы — $35' },
        { count: 5, price: 55, isDefault: true, label: '5 капсул — $55' },
        { count: 10, price: 108, discount: '-5%', label: '10 капсул — $108' },
        { count: 20, price: 210, discount: '-15%', label: '20 капсул — $210' },
        { count: 50, price: 510, discount: '-25%', label: '50 капсул — $510' },
        { count: 100, price: 1000, discount: '-35%', label: '100 капсул — $1000' }
      ],
      description: 'Высокоэффективный препарат пролонгированного действия (400 мг). Доступный регион: Ташкент. Фармакопейная степень чистоты 99.8%. Оплата в LFT Crypto и LTC.',
      specs: {
        'Регион': 'Ташкент',
        'Активное вещество': 'Pregabalin (Прегабалин) 400 мг',
        'Степень очистки': '99.8% (HPLC тест GMP)',
        'Биодоступность': '≥ 90% независимо от приема пищи',
        'Период полувыведения': '6.3 часа (пролонгация 12-16ч)',
        'Минимальный заказ': '2 капсулы',
        'Максимальный заказ': '100 капсул',
        'Основная оплата': 'LFT Crypto (или LTC / USDT / BTC)'
      },
      tags: ['Прегабалин 400мг', 'ГАМК-эффект', 'LFT Crypto', 'Мин. 2 шт', 'Макс. 100 шт']
    }
  ];

  // Default Demo Account
  const DEFAULT_DEMO_USER = {
    id: 'DRGX-9024-VIP',
    name: 'Алексей (VIP Client)',
    telegram: '@Alex_VIP_Client',
    password: 'dragonpass',
    createdAt: new Date().toISOString(),
    ordersCount: 3,
    discountRate: 0.10 // 10% VIP discount
  };

  // Application State
  const AppState = {
    isSecurityPassed: false,
    currentUser: null,
    cart: [],
    currentCurrency: 'LFT', // Default LFT Crypto
    soundEnabled: true,
    currentBotConfig: {
      username: '@dragonX1Bot',
      support: '@Dgx464'
    },
    mathProblem: { num1: 0, num2: 0, operator: '+', answer: 0 },
    heroSelectedPack: 60,
    heroQuantity: 2 // Default quantity is 2 (minimum order)
  };

  // Web Audio Synth for High-Tech Sound FX
  let audioCtx = null;
  function playBeep(freq = 600, duration = 0.08, type = 'sine') {
    if (!AppState.soundEnabled) return;
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Audio fallback
    }
  }

  function playSuccessSound() {
    playBeep(520, 0.08, 'sine');
    setTimeout(() => playBeep(880, 0.15, 'sine'), 80);
  }

  function playErrorSound() {
    playBeep(220, 0.15, 'sawtooth');
    setTimeout(() => playBeep(180, 0.2, 'sawtooth'), 120);
  }

  // =========================================================================
  // 2. MATHEMATICAL SECURITY CHECK (ANTI-BOT GATE)
  // =========================================================================
  function generateMathProblem() {
    const ops = ['+', '-'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let n1, n2, ans;

    if (op === '+') {
      n1 = Math.floor(Math.random() * 45) + 12;
      n2 = Math.floor(Math.random() * 35) + 11;
      ans = n1 + n2;
    } else {
      n1 = Math.floor(Math.random() * 50) + 30;
      n2 = Math.floor(Math.random() * 25) + 10;
      if (n2 > n1) [n1, n2] = [n2, n1];
      ans = n1 - n2;
    }

    AppState.mathProblem = { num1: n1, num2: n2, operator: op, answer: ans };

    const elN1 = document.getElementById('mathNum1');
    const elN2 = document.getElementById('mathNum2');
    const elOp = document.getElementById('mathOperator');
    const elInput = document.getElementById('mathAnswerInput');
    const elErr = document.getElementById('securityErrorMsg');

    if (elN1) elN1.textContent = n1;
    if (elN2) elN2.textContent = n2;
    if (elOp) elOp.textContent = op;
    if (elInput) elInput.value = '';
    if (elErr) elErr.classList.add('hidden');
  }

  function verifyMathSecurity() {
    const elInput = document.getElementById('mathAnswerInput');
    const elErr = document.getElementById('securityErrorMsg');
    const elGate = document.getElementById('securityGate');
    const val = parseInt(elInput.value.trim(), 10);

    if (isNaN(val) || val !== AppState.mathProblem.answer) {
      playErrorSound();
      if (elErr) {
        elErr.classList.remove('hidden');
        elErr.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> <span>Ошибка! Ответ неверный. Попробуйте еще раз!</span>`;
      }
      elInput.focus();
      elInput.select();
      return;
    }

    // Success: passed security check
    playSuccessSound();
    AppState.isSecurityPassed = true;
    sessionStorage.setItem('dragonx_math_cleared', 'true');

    document.body.classList.remove('security-locked');
    if (elGate) {
      elGate.classList.add('gate-passed');
    }
    showToast('Проверка безопасности пройдена! Добро пожаловать в Dragon-X.', 'success');
  }

  // =========================================================================
  // 3. UNIQUE ALPHANUMERIC CODE & USER AUTHENTICATION
  // =========================================================================
  function generateUniqueCustomerCode() {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    const randomBlock = (len) => {
      let res = '';
      for (let i = 0; i < len; i++) {
        res += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return res;
    };

    let newCode = '';
    const users = getAllUsers();
    let collision = true;

    while (collision) {
      newCode = `DRGX-${randomBlock(4)}-${randomBlock(4)}`;
      collision = users.some(u => u.id.toUpperCase() === newCode.toUpperCase());
    }

    return newCode;
  }

  function getAllUsers() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      if (!data) {
        const initial = [DEFAULT_DEMO_USER];
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(initial));
        return initial;
      }
      return JSON.parse(data);
    } catch (e) {
      return [DEFAULT_DEMO_USER];
    }
  }

  function saveUser(user) {
    const users = getAllUsers();
    users.push(user);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  function initSession() {
    try {
      const sess = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (sess) {
        AppState.currentUser = JSON.parse(sess);
      }
    } catch (e) {
      AppState.currentUser = null;
    }
    renderUserAuthUI();
  }

  function loginUser(uniqueCode, password) {
    const users = getAllUsers();
    const cleanCode = uniqueCode.trim().toUpperCase();
    const cleanPwd = password.trim();

    const user = users.find(u => u.id.toUpperCase() === cleanCode);
    if (!user) {
      return { success: false, message: 'Уникальный Код Клиента не найден в базе данных!' };
    }

    if (user.password !== cleanPwd) {
      return { success: false, message: 'Неверный пароль для данного Кода Клиента!' };
    }

    AppState.currentUser = user;
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
    renderUserAuthUI();
    playSuccessSound();
    return { success: true, user };
  }

  function registerNewUser(name, telegram, password) {
    const uniqueId = generateUniqueCustomerCode();
    const newUser = {
      id: uniqueId,
      name: name.trim() || 'Уважаемый Клиент',
      telegram: telegram.trim() || '',
      password: password.trim(),
      createdAt: new Date().toISOString(),
      ordersCount: 0,
      discountRate: 0.10 // 10% VIP discount on all orders
    };

    saveUser(newUser);
    AppState.currentUser = newUser;
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(newUser));
    renderUserAuthUI();
    playSuccessSound();
    return newUser;
  }

  function logoutUser() {
    AppState.currentUser = null;
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    renderUserAuthUI();
    showToast('Вы успешно вышли из аккаунта.', 'info');
    closeAllModals();
  }

  function renderUserAuthUI() {
    const container = document.getElementById('userAuthSection');
    const heroNotice = document.getElementById('heroIdNoticeText');
    const cartCustomerDisplay = document.getElementById('cartCustomerIdDisplay');

    if (!container) return;

    if (AppState.currentUser) {
      container.innerHTML = `
        <div class="user-logged-pill" id="openProfileModalBtn" title="Ваш кабинет">
          <div class="user-logged-avatar">
            <i class="fa-solid fa-user-astronaut"></i>
          </div>
          <div class="user-logged-info">
            <span class="u-name">${escapeHtml(AppState.currentUser.name)}</span>
            <span class="u-id">${AppState.currentUser.id}</span>
          </div>
        </div>
      `;

      if (heroNotice) {
        heroNotice.innerHTML = `Авторизован: <strong>${AppState.currentUser.id}</strong> (Скидка VIP 10% активна!)`;
      }
      if (cartCustomerDisplay) {
        cartCustomerDisplay.textContent = `${AppState.currentUser.name} (${AppState.currentUser.id})`;
      }

      const pill = document.getElementById('openProfileModalBtn');
      if (pill) {
        pill.addEventListener('click', () => {
          playBeep(450, 0.04);
          openAuthModal('profile');
        });
      }
    } else {
      container.innerHTML = `
        <button id="openAuthModalBtn" class="btn-primary auth-btn-pill">
          <i class="fa-solid fa-user-lock"></i>
          <span>Личный кабинет</span>
        </button>
      `;

      if (heroNotice) {
        heroNotice.textContent = 'Вход по Уникальному Коду Клиента обеспечивает конфиденциальность каждого заказа.';
      }
      if (cartCustomerDisplay) {
        cartCustomerDisplay.textContent = 'Гость (Без ID)';
      }

      const btn = document.getElementById('openAuthModalBtn');
      if (btn) {
        btn.addEventListener('click', () => {
          playBeep(450, 0.04);
          openAuthModal('login');
        });
      }
    }

    renderCart();
  }

  // =========================================================================
  // 4. CURRENCY & FORMATTING (DEFAULT: LFT CRYPTO)
  // =========================================================================
  function initCurrency() {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENCY);
    if (saved && CURRENCY_RATES[saved]) {
      AppState.currentCurrency = saved;
    } else {
      AppState.currentCurrency = 'LFT'; // Default to LFT Crypto
    }
    updateCurrencyUI();
  }

  function formatPrice(amountBase) {
    const curr = CURRENCY_RATES[AppState.currentCurrency] || CURRENCY_RATES.LFT;
    const converted = amountBase * curr.rate;

    if (curr.name === 'LFT Crypto') {
      return `${converted.toFixed(2)} LFT`;
    }
    if (curr.name === 'LTC (Litecoin)') {
      return `${(converted * 0.012).toFixed(4)} LTC`;
    }
    if (curr.name === 'BTC (Bitcoin)') {
      return `${(converted * 0.000015).toFixed(6)} BTC`;
    }
    if (curr.name === 'RUB (₽)') {
      return `${Math.round(converted).toLocaleString('ru-RU')} ₽`;
    }
    if (curr.name === 'USDT (TRC-20)') {
      return `${converted.toFixed(2)} USDT`;
    }
    return `$${converted.toFixed(2)}`;
  }

  function updateCurrencyUI() {
    const curr = CURRENCY_RATES[AppState.currentCurrency] || CURRENCY_RATES.LFT;
    const btn = document.getElementById('currentCurrencyBtn');
    const symbol = document.getElementById('currencySymbol');
    if (btn && symbol) {
      symbol.textContent = curr.symbol;
      btn.innerHTML = `<span id="currencySymbol">${curr.symbol}</span> ${curr.name} <i class="fa-solid fa-chevron-down"></i>`;
    }

    document.querySelectorAll('.curr-opt').forEach(opt => {
      opt.classList.toggle('active', opt.dataset.currency === AppState.currentCurrency);
    });

    updateHeroPriceDisplay();
    renderCatalog();
    renderCart();
  }

  // =========================================================================
  // 5. HERO PREGABALIN-400 & QUANTITY CONTROLS (MIN 2, MAX 100)
  // =========================================================================
  function initHeroShowcase() {
    const packBtns = document.querySelectorAll('#heroPackOptions .pack-btn');
    packBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        playBeep(500, 0.04);
        packBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        AppState.heroSelectedPack = parseInt(btn.dataset.pack, 10);
        updateHeroPriceDisplay();
      });
    });

    // Quantity Stepper: Minimum 2, Maximum 100
    const decBtn = document.getElementById('heroQtyDecBtn');
    const incBtn = document.getElementById('heroQtyIncBtn');
    const input = document.getElementById('heroQuantityInput');

    if (decBtn) {
      decBtn.addEventListener('click', () => {
        if (AppState.heroQuantity > MIN_ORDER_QTY) {
          AppState.heroQuantity--;
          playBeep(420, 0.03);
          updateHeroQuantityUI();
        } else {
          playErrorSound();
          showToast(`Минимальный заказ: ${MIN_ORDER_QTY} упаковки!`, 'info');
        }
      });
    }

    if (incBtn) {
      incBtn.addEventListener('click', () => {
        if (AppState.heroQuantity < MAX_ORDER_QTY) {
          AppState.heroQuantity++;
          playBeep(480, 0.03);
          updateHeroQuantityUI();
        } else {
          playErrorSound();
          showToast(`Максимальный заказ: ${MAX_ORDER_QTY} упаковок!`, 'info');
        }
      });
    }

    if (input) {
      input.addEventListener('change', () => {
        let val = parseInt(input.value, 10);
        if (isNaN(val) || val < MIN_ORDER_QTY) {
          val = MIN_ORDER_QTY;
          showToast(`Минимальный заказ: ${MIN_ORDER_QTY} упаковки!`, 'info');
        } else if (val > MAX_ORDER_QTY) {
          val = MAX_ORDER_QTY;
          showToast(`Максимальный заказ: ${MAX_ORDER_QTY} упаковок!`, 'info');
        }
        AppState.heroQuantity = val;
        updateHeroQuantityUI();
      });
    }

    const addHeroBtn = document.getElementById('heroAddToCartBtn');
    if (addHeroBtn) {
      addHeroBtn.addEventListener('click', () => {
        addPregabalinToCart();
      });
    }

    const quickTgBtn = document.getElementById('heroQuickTgBtn');
    if (quickTgBtn) {
      quickTgBtn.addEventListener('click', () => {
        addPregabalinToCart();
        openTelegramCheckout();
      });
    }

    const heroDetailsBtn = document.getElementById('heroDetailsBtn');
    if (heroDetailsBtn) {
      heroDetailsBtn.addEventListener('click', () => {
        openProductModal('pregabalin-400');
      });
    }

    updateHeroPriceDisplay();
    updateHeroQuantityUI();
  }

  function updateHeroQuantityUI() {
    const input = document.getElementById('heroQuantityInput');
    const decBtn = document.getElementById('heroQtyDecBtn');
    const incBtn = document.getElementById('heroQtyIncBtn');
    const qtyDisplay = document.getElementById('heroQtyNumberDisplay');
    const btnQtyDisplay = document.getElementById('btnQtyDisplay');
    const subtotalDisplay = document.getElementById('heroCalculatedSubtotal');

    if (input) input.value = AppState.heroQuantity;
    if (qtyDisplay) qtyDisplay.textContent = AppState.heroQuantity;
    if (btnQtyDisplay) btnQtyDisplay.textContent = AppState.heroQuantity;

    if (decBtn) decBtn.disabled = AppState.heroQuantity <= MIN_ORDER_QTY;
    if (incBtn) incBtn.disabled = AppState.heroQuantity >= MAX_ORDER_QTY;

    const preg = PRODUCTS[0];
    const pack = preg.packOptions.find(opt => opt.count === AppState.heroSelectedPack) || preg.packOptions[1];
    if (subtotalDisplay) {
      subtotalDisplay.textContent = formatPrice(pack.price * AppState.heroQuantity);
    }
  }

  function updateHeroPriceDisplay() {
    const preg = PRODUCTS[0];
    const pack = preg.packOptions.find(opt => opt.count === AppState.heroSelectedPack) || preg.packOptions[1];

    const curEl = document.getElementById('heroCurrentPrice');
    const oldEl = document.getElementById('heroOldPrice');

    if (curEl) curEl.textContent = formatPrice(pack.price);
    if (oldEl) {
      const oldPrice = Math.round(pack.price * 1.25);
      oldEl.textContent = formatPrice(oldPrice);
    }

    updateHeroQuantityUI();
  }

  function addPregabalinToCart() {
    const preg = PRODUCTS[0];
    const pack = preg.packOptions.find(opt => opt.count === AppState.heroSelectedPack) || preg.packOptions[1];
    addToCart(preg, pack, AppState.heroQuantity);
  }

  // =========================================================================
  // 6. PACKAGING TIERS CATALOG (PREGABALIN-400 ONLY)
  // =========================================================================
  function renderCatalog() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    const preg = PRODUCTS[0];

    grid.innerHTML = preg.packOptions.map(pack => {
      const unitTotalMin = pack.price * MIN_ORDER_QTY;

      return `
        <article class="product-card glass-panel" data-pack="${pack.count}">
          <div class="card-top-badges">
            <span class="pill-badge ${pack.discount ? 'pill-red' : 'pill-cyan'}">${pack.discount || 'СТАРТ'}</span>
            <span class="micro-pill font-mono">${pack.count} капсул</span>
          </div>

          <div class="card-img-wrapper" onclick="window.DragonX.openProductModal('pregabalin-400')" style="cursor: pointer;">
            <img src="${preg.image}" alt="Прегабалин-400 (${pack.count} капсул)" class="card-bottle-img" loading="lazy">
          </div>

          <div class="card-content">
            <span class="card-category">Pregabalinum 400mg</span>
            <h3 class="card-title">Прегабалин - 400 • ${pack.count} капс.</h3>
            <p class="card-desc">Фармакопейный Прегабалин 400 мг. Фасовка: ${pack.count} капсул в темном стеклянном флаконе с контролем вскрытия.</p>

            <div class="card-pills-row">
              <span class="micro-pill crypto-pay-badge font-mono"><i class="fa-solid fa-coins"></i> LFT Crypto</span>
              <span class="micro-pill font-mono">Партия: 2–100 шт</span>
              <span class="micro-pill">Чистота 99.8%</span>
            </div>
          </div>

          <div class="card-footer">
            <div class="card-price-wrap">
              <span class="card-price">${formatPrice(pack.price)}</span>
              <span class="card-dose-info">Мин. заказ (2 шт): ${formatPrice(unitTotalMin)}</span>
            </div>
            <div class="card-actions">
              <button class="card-detail-btn" onclick="window.DragonX.openProductModal('pregabalin-400')" title="Характеристики">
                <i class="fa-solid fa-eye"></i>
              </button>
              <button class="card-add-btn" onclick="window.DragonX.quickAddPack(${pack.count})" title="Добавить 2 шт в корзину">
                <i class="fa-solid fa-plus"></i>
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  // =========================================================================
  // 7. CART SYSTEM (MIN: 2, MAX: 100 ENFORCED)
  // =========================================================================
  function initCart() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CART);
      if (data) {
        AppState.cart = JSON.parse(data);
        // Ensure all loaded cart items obey MIN_ORDER_QTY
        AppState.cart.forEach(item => {
          if (item.quantity < MIN_ORDER_QTY) item.quantity = MIN_ORDER_QTY;
          if (item.quantity > MAX_ORDER_QTY) item.quantity = MAX_ORDER_QTY;
        });
      }
    } catch (e) {
      AppState.cart = [];
    }

    const headerCartBtn = document.getElementById('headerCartBtn');
    const closeCartDrawerBtn = document.getElementById('closeCartDrawerBtn');
    const overlay = document.getElementById('cartDrawerOverlay');

    if (headerCartBtn) {
      headerCartBtn.addEventListener('click', () => {
        playBeep(520, 0.04);
        openCartDrawer();
      });
    }

    if (closeCartDrawerBtn) {
      closeCartDrawerBtn.addEventListener('click', () => {
        closeCartDrawer();
      });
    }

    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeCartDrawer();
      });
    }

    const checkoutTgBtn = document.getElementById('checkoutTelegramBtn');
    if (checkoutTgBtn) {
      checkoutTgBtn.addEventListener('click', () => {
        openTelegramCheckout();
      });
    }

    const checkoutWebBtn = document.getElementById('checkoutWebBtn');
    if (checkoutWebBtn) {
      checkoutWebBtn.addEventListener('click', () => {
        openOrderReceiptModal();
      });
    }

    renderCart();
  }

  function addToCart(product, packOption, qty = 2) {
    // Clamp quantity
    const finalQty = Math.max(MIN_ORDER_QTY, Math.min(MAX_ORDER_QTY, qty));
    const cartItemId = `${product.id}-${packOption.count}`;
    const existing = AppState.cart.find(item => item.cartItemId === cartItemId);

    if (existing) {
      existing.quantity = Math.min(MAX_ORDER_QTY, existing.quantity + finalQty);
    } else {
      AppState.cart.push({
        cartItemId,
        productId: product.id,
        name: product.name,
        image: product.image,
        packCount: packOption.count,
        unitPriceBase: packOption.price,
        quantity: finalQty
      });
    }

    saveCart();
    playSuccessSound();
    showToast(`Прегабалин-400 (${packOption.count} капс.) — ${finalQty} шт. добавлен в корзину!`, 'success');
    renderCart();
  }

  function updateCartItemQty(cartItemId, delta) {
    const item = AppState.cart.find(i => i.cartItemId === cartItemId);
    if (!item) return;

    const newQty = item.quantity + delta;

    if (newQty < MIN_ORDER_QTY) {
      playErrorSound();
      showToast(`Минимальный заказ: ${MIN_ORDER_QTY} упаковки! Для удаления нажмите на корзину 🗑️`, 'info');
      return;
    }

    if (newQty > MAX_ORDER_QTY) {
      playErrorSound();
      showToast(`Максимальный заказ: ${MAX_ORDER_QTY} упаковок!`, 'info');
      return;
    }

    item.quantity = newQty;
    saveCart();
    playBeep(450, 0.03);
    renderCart();
  }

  function removeCartItem(cartItemId) {
    AppState.cart = AppState.cart.filter(i => i.cartItemId !== cartItemId);
    saveCart();
    playBeep(320, 0.04);
    showToast('Товар удален из корзины.', 'info');
    renderCart();
  }

  function saveCart() {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(AppState.cart));
  }

  function renderCart() {
    const container = document.getElementById('cartItemsContainer');
    const countBadge = document.getElementById('cartCountBadge');
    const headerTotal = document.getElementById('headerCartTotal');
    const drawerCount = document.getElementById('cartDrawerCount');
    const subtotalEl = document.getElementById('cartSubtotalAmount');
    const discountEl = document.getElementById('cartDiscountAmount');
    const totalEl = document.getElementById('cartTotalAmount');
    const discountRow = document.getElementById('cartDiscountRow');

    const totalQty = AppState.cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotalBase = AppState.cart.reduce((sum, item) => sum + (item.unitPriceBase * item.quantity), 0);

    let discountBase = 0;
    if (AppState.currentUser && AppState.currentUser.discountRate) {
      discountBase = subtotalBase * AppState.currentUser.discountRate;
    }
    const finalTotalBase = Math.max(0, subtotalBase - discountBase);

    if (countBadge) countBadge.textContent = totalQty;
    if (drawerCount) drawerCount.textContent = totalQty;
    if (headerTotal) headerTotal.textContent = formatPrice(finalTotalBase);
    if (subtotalEl) subtotalEl.textContent = formatPrice(subtotalBase);
    if (discountEl) discountEl.textContent = `-${formatPrice(discountBase)}`;
    if (totalEl) totalEl.textContent = formatPrice(finalTotalBase);

    if (discountRow) {
      discountRow.style.display = AppState.currentUser ? 'flex' : 'none';
    }

    if (!container) return;

    if (AppState.cart.length === 0) {
      container.innerHTML = `
        <div class="cart-empty-state">
          <div class="cart-empty-icon"><i class="fa-solid fa-basket-shopping"></i></div>
          <h4>Ваша корзина пуста</h4>
          <p>Выберите фасовку Прегабалина-400 (от 2 до 100 упаковок)</p>
        </div>
      `;
      return;
    }

    container.innerHTML = AppState.cart.map(item => `
      <div class="cart-item-row">
        <img src="${item.image}" alt="${escapeHtml(item.name)}" class="cart-item-img">
        <div class="cart-item-details">
          <div class="cart-item-name">${escapeHtml(item.name)}</div>
          <div class="cart-item-meta">${item.packCount} капсул • ${formatPrice(item.unitPriceBase)} / шт</div>
          <div class="cart-item-price">${formatPrice(item.unitPriceBase * item.quantity)}</div>
        </div>
        <div class="cart-item-controls">
          <button class="qty-btn" onclick="window.DragonX.updateCartItemQty('${item.cartItemId}', -1)" title="Уменьшить">-</button>
          <span class="qty-num">${item.quantity}</span>
          <button class="qty-btn" onclick="window.DragonX.updateCartItemQty('${item.cartItemId}', 1)" title="Увеличить">+</button>
          <button class="remove-item-btn" onclick="window.DragonX.removeCartItem('${item.cartItemId}')" title="Удалить">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
    `).join('');
  }

  function openCartDrawer() {
    const overlay = document.getElementById('cartDrawerOverlay');
    if (overlay) overlay.classList.remove('hidden');
    renderCart();
  }

  function closeCartDrawer() {
    const overlay = document.getElementById('cartDrawerOverlay');
    if (overlay) overlay.classList.add('hidden');
  }

  // =========================================================================
  // 8. TELEGRAM BOT INTEGRATION & LFT CRYPTO ORDER EXPORT
  // =========================================================================
  function initTelegramConfig() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BOT_CONFIG);
      if (saved) {
        AppState.currentBotConfig = JSON.parse(saved);
      }
    } catch (e) {
      // keep default
    }

    updateBotLabelsInUI();

    const openTgModalBtn = document.getElementById('openTgBotModalBtn');
    const navTgBtn = document.getElementById('navTelegramBtn');
    const closeTgModalBtn = document.getElementById('closeTelegramModalBtn');
    const configBtn = document.getElementById('configureTgBotBtn');
    const footerConfigBtn = document.getElementById('editBotConfigFooterBtn');

    if (closeTgModalBtn) closeTgModalBtn.addEventListener('click', () => closeTelegramModal());
    if (configBtn) configBtn.addEventListener('click', () => openTelegramModal(true));
    if (footerConfigBtn) footerConfigBtn.addEventListener('click', (e) => { e.preventDefault(); openTelegramModal(true); });

    const saveForm = document.getElementById('saveBotConfigForm');
    if (saveForm) {
      saveForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveCustomBotConfig();
      });
    }

    const directBtn = document.getElementById('modalOpenDirectTgBtn');
    if (directBtn) {
      directBtn.addEventListener('click', (e) => {
        openBotDirectLink();
      });
    }
  }

  function updateBotLabelsInUI() {
    const botLabel = document.getElementById('currentBotUsernameLabel');
    const modalBotDisplay = document.getElementById('modalBotHandleDisplay');
    const tgBotContact = document.getElementById('tgBotContactLink');
    const tgSupportLink = document.getElementById('tgSupportLink');
    const customBotInput = document.getElementById('customBotUsername');
    const customSupportInput = document.getElementById('customSupportHandle');
    const openTgModalBtn = document.getElementById('openTgBotModalBtn');
    const navTgBtn = document.getElementById('navTelegramBtn');
    const modalDirectBtn = document.getElementById('modalOpenDirectTgBtn');

    const b = AppState.currentBotConfig.username;
    const s = AppState.currentBotConfig.support;
    const botUrl = `https://t.me/${b.replace('@', '')}`;
    const supUrl = `https://t.me/${s.replace('@', '')}`;

    if (botLabel) botLabel.textContent = b;
    if (modalBotDisplay) modalBotDisplay.textContent = b;
    if (tgBotContact) {
      tgBotContact.textContent = b;
      tgBotContact.href = botUrl;
      tgBotContact.target = '_blank';
    }
    if (tgSupportLink) {
      tgSupportLink.textContent = s;
      tgSupportLink.href = supUrl;
      tgSupportLink.target = '_blank';
    }
    if (openTgModalBtn) {
      openTgModalBtn.href = botUrl;
      openTgModalBtn.target = '_blank';
    }
    if (navTgBtn) {
      navTgBtn.href = botUrl;
      navTgBtn.target = '_blank';
    }
    if (modalDirectBtn) {
      modalDirectBtn.href = botUrl;
      modalDirectBtn.target = '_blank';
    }
    if (customBotInput) customBotInput.value = b;
    if (customSupportInput) customSupportInput.value = s;
  }

  function saveCustomBotConfig() {
    const bInput = document.getElementById('customBotUsername');
    const sInput = document.getElementById('customSupportHandle');

    let botName = bInput ? bInput.value.trim() : '@DragonX_Capsules_Bot';
    let supName = sInput ? sInput.value.trim() : '@DragonX_Support';

    if (!botName.startsWith('@')) botName = '@' + botName;
    if (supName && !supName.startsWith('@')) supName = '@' + supName;

    AppState.currentBotConfig.username = botName;
    AppState.currentBotConfig.support = supName;

    localStorage.setItem(STORAGE_KEYS.BOT_CONFIG, JSON.stringify(AppState.currentBotConfig));
    updateBotLabelsInUI();
    playSuccessSound();
    showToast(`Настройки Telegram бота сохранены: ${botName}`, 'success');
  }

  function openBotDirectLink() {
    const rawBot = AppState.currentBotConfig.username.replace('@', '');
    const url = `https://t.me/${rawBot}`;
    window.open(url, '_blank');
  }

  function generateOrderPayloadText() {
    const user = AppState.currentUser;
    const customerId = user ? user.id : 'ГОСТЬ (Без Unique ID)';
    const customerName = user ? user.name : 'Анонимный заказчик';
    const customerTg = user && user.telegram ? user.telegram : 'Не указан';

    const orderId = 'DX-PG400-' + Math.floor(100000 + Math.random() * 900000);
    const dateStr = new Date().toLocaleString('ru-RU');

    let itemsText = '';
    let subtotalBase = 0;
    let totalPacksCount = 0;

    AppState.cart.forEach((item, idx) => {
      const itemSub = item.unitPriceBase * item.quantity;
      subtotalBase += itemSub;
      totalPacksCount += item.quantity;
      itemsText += `  ${idx + 1}. ${item.name} (${item.packCount} капс.) x ${item.quantity} шт = ${formatPrice(itemSub)}\n`;
    });

    let discountBase = 0;
    if (user && user.discountRate) {
      discountBase = subtotalBase * user.discountRate;
    }
    const finalTotalBase = Math.max(0, subtotalBase - discountBase);

    // Automatically record order into admin database
    recordCustomerOrder(orderId, customerId, customerName, customerTg, finalTotalBase, totalPacksCount);

    return `🛡️ DRAGON-X PHARMA | ПРЕГАБАЛИН-400 ЗАКАЗ\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📌 НОМЕР ЗАКАЗА: ${orderId}\n` +
      `📅 ДАТА: ${dateStr}\n` +
      `🔑 УНИКАЛЬНЫЙ ID КЛИЕНТА: ${customerId}\n` +
      `👤 ПОЛУЧАТЕЛЬ: ${customerName}\n` +
      `📱 TG КОНТАКТ: ${customerTg}\n` +
      `📦 ВСЕГО УПАКОВОК: ${totalPacksCount} шт (Мин: 2, Макс: 100)\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `💊 СОСТАВ ЗАКАЗА:\n${itemsText}` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `💵 Базовая стоимость: ${formatPrice(subtotalBase)}\n` +
      (discountBase > 0 ? `🎁 VIP Скидка (Unique ID 10%): -${formatPrice(discountBase)}\n` : '') +
      `💰 ИТОГО К ОПЛАТЕ: ${formatPrice(finalTotalBase)}\n` +
      `🪙 ВАЛЮТА ОПЛАТЫ: ${AppState.currentCurrency} (LFT Crypto / LTC / USDT / BTC)\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🔒 Шлюз: 256-bit SSL Secure Dispatch\n` +
      `⚡ Отправьте это сообщение боту для подтверждения!`;
  }

  function recordCustomerOrder(orderId, customerId, customerName, customerTg, totalAmount, totalPacks) {
    try {
      const orders = JSON.parse(localStorage.getItem('dragonx_orders_db_v1') || '[]');
      const alreadyExists = orders.some(o => o.id === orderId);
      if (!alreadyExists) {
        const newOrderRecord = {
          id: orderId,
          createdAt: new Date().toISOString(),
          customerId: customerId,
          customerName: customerName,
          telegram: customerTg,
          items: AppState.cart.map(i => ({
            name: i.name,
            packCount: i.packCount,
            quantity: i.quantity,
            unitPriceBase: i.unitPriceBase
          })),
          totalPacks: totalPacks,
          totalAmount: totalAmount,
          currency: 'LFT',
          status: 'new',
          deliveryLocation: 'Ожидает назначения локации в Telegram',
          trackingCode: 'DX-TRK-' + Math.floor(1000 + Math.random() * 9000)
        };
        orders.unshift(newOrderRecord);
        localStorage.setItem('dragonx_orders_db_v1', JSON.stringify(orders));
      }
    } catch (e) {
      // ignore
    }
  }

  function openTelegramCheckout() {
    if (AppState.cart.length === 0) {
      showToast('Корзина пуста! Добавьте товар перед оформлением.', 'error');
      return;
    }

    const payload = generateOrderPayloadText();
    const rawBot = AppState.currentBotConfig.username.replace('@', '');
    const tgUrl = `https://t.me/${rawBot}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(payload).then(() => {
        showToast('📋 Детали заказа скопированы! Открываем Telegram...', 'success');
      }).catch(() => {});
    }

    openOrderReceiptModal(payload, tgUrl);
  }

  function openOrderReceiptModal(customPayload = null, customUrl = null) {
    if (AppState.cart.length === 0) {
      showToast('Корзина пуста!', 'error');
      return;
    }

    const payload = customPayload || generateOrderPayloadText();
    const rawBot = AppState.currentBotConfig.username.replace('@', '');
    const url = customUrl || `https://t.me/${rawBot}`;

    const textEl = document.getElementById('receiptRawText');
    const sendBtn = document.getElementById('sendReceiptToTgBtn');
    const modal = document.getElementById('receiptModal');

    if (textEl) textEl.textContent = payload;
    if (sendBtn) {
      sendBtn.href = url;
      sendBtn.target = '_blank';
    }

    if (modal) modal.classList.remove('hidden');
    playBeep(520, 0.05);
  }

  // =========================================================================
  // 9. MODALS MANAGEMENT
  // =========================================================================
  function openAuthModal(view = 'login') {
    const modal = document.getElementById('authModal');
    if (!modal) return;
    modal.classList.remove('hidden');

    switchAuthView(view);
  }

  function switchAuthView(view) {
    const tabLogin = document.getElementById('tabLoginBtn');
    const tabReg = document.getElementById('tabRegisterBtn');
    const viewLogin = document.getElementById('authLoginView');
    const viewReg = document.getElementById('authRegisterView');
    const viewSuccess = document.getElementById('authSuccessView');
    const viewProfile = document.getElementById('authProfileView');

    [viewLogin, viewReg, viewSuccess, viewProfile].forEach(v => {
      if (v) v.classList.add('hidden');
    });

    if (view === 'login') {
      tabLogin.classList.add('active');
      tabReg.classList.remove('active');
      viewLogin.classList.remove('hidden');
      document.querySelector('.auth-tabs-header').style.display = 'flex';
      document.getElementById('loginUniqueCode').focus();
    } else if (view === 'register') {
      tabReg.classList.add('active');
      tabLogin.classList.remove('active');
      viewReg.classList.remove('hidden');
      document.querySelector('.auth-tabs-header').style.display = 'flex';
      document.getElementById('regFullName').focus();
    } else if (view === 'success') {
      document.querySelector('.auth-tabs-header').style.display = 'none';
      viewSuccess.classList.remove('hidden');
    } else if (view === 'profile') {
      document.querySelector('.auth-tabs-header').style.display = 'none';
      viewProfile.classList.remove('hidden');
      populateProfileView();
    }
  }

  function populateProfileView() {
    if (!AppState.currentUser) return;
    const u = AppState.currentUser;

    const elName = document.getElementById('profileUserName');
    const elId = document.getElementById('profileUserId');
    const elOrders = document.getElementById('profileOrdersCount');
    const elDiscount = document.getElementById('profileDiscountVal');
    const elTg = document.getElementById('profileTgBound');

    if (elName) elName.textContent = u.name;
    if (elId) elId.textContent = u.id;
    if (elOrders) elOrders.textContent = u.ordersCount || 0;
    if (elDiscount) elDiscount.textContent = `${(u.discountRate || 0.1) * 100}%`;
    if (elTg) elTg.textContent = u.telegram || 'Не указан';
  }

  function openTelegramModal(focusSettings = false) {
    const modal = document.getElementById('telegramModal');
    if (!modal) return;
    modal.classList.remove('hidden');
    playBeep(480, 0.04);

    if (focusSettings) {
      setTimeout(() => {
        const inp = document.getElementById('customBotUsername');
        if (inp) {
          inp.focus();
          inp.select();
        }
      }, 100);
    }
  }

  function closeTelegramModal() {
    const modal = document.getElementById('telegramModal');
    if (modal) modal.classList.add('hidden');
  }

  function openProductModal(productId) {
    const prod = PRODUCTS[0];
    const container = document.getElementById('productModalContent');
    const modal = document.getElementById('productModal');

    const defaultPack = prod.packOptions.find(p => p.isDefault) || prod.packOptions[1];

    const specsRows = Object.entries(prod.specs || {}).map(([k, v]) => `
      <div class="pm-spec-row">
        <span>${escapeHtml(k)}</span>
        <span>${escapeHtml(v)}</span>
      </div>
    `).join('');

    const packsButtons = prod.packOptions.map(pack => `
      <button class="pack-btn ${pack.count === defaultPack.count ? 'active' : ''}" 
              onclick="window.DragonX.selectModalPack('${prod.id}', ${pack.count}, ${pack.price}, this)">
        <span class="pack-name">${pack.count} Капсул</span>
        <span class="pack-price">${formatPrice(pack.price)}</span>
        ${pack.discount ? `<span class="pack-discount">${pack.discount}</span>` : ''}
      </button>
    `).join('');

    container.innerHTML = `
      <div class="product-modal-grid">
        <div class="pm-img-wrap">
          <img src="${prod.image}" alt="${escapeHtml(prod.name)}" class="pm-bottle-img">
        </div>
        <div class="pm-details">
          <span class="pill-badge ${prod.badgeClass}">${prod.badge}</span>
          <h2 class="pm-title">${escapeHtml(prod.name)}</h2>
          <span class="pm-dose-badge"><i class="fa-solid fa-capsules"></i> ${prod.dose}</span>
          <p class="pm-desc">${escapeHtml(prod.description)}</p>

          <div class="pm-specs-list">
            ${specsRows}
          </div>

          <div class="pack-selector-label">Выберите фасовку (Минимум 2 шт):</div>
          <div class="pack-options" style="margin-bottom: 1.25rem;">
            ${packsButtons}
          </div>

          <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
            <button class="btn-primary glow-btn" id="modalAddToCartBtn">
              <i class="fa-solid fa-cart-plus"></i>
              <span id="modalAddPriceText">В корзину (2 шт • ${formatPrice(defaultPack.price * 2)})</span>
            </button>
            <button class="btn-tg-direct" onclick="window.DragonX.quickAddPack(${defaultPack.count}); window.DragonX.openTelegramCheckout();">
              <i class="fa-brands fa-telegram"></i> Заказ в TG
            </button>
          </div>
        </div>
      </div>
    `;

    let selectedPack = defaultPack;
    window._currentModalSelectedPack = selectedPack;

    document.getElementById('modalAddToCartBtn').addEventListener('click', () => {
      addToCart(prod, window._currentModalSelectedPack || defaultPack, MIN_ORDER_QTY);
      modal.classList.add('hidden');
    });

    modal.classList.remove('hidden');
    playBeep(520, 0.04);
  }

  function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
    closeCartDrawer();
  }

  // =========================================================================
  // 10. NOTIFICATION TOAST SYSTEM
  // =========================================================================
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'fa-circle-info';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'error') icon = 'fa-triangle-exclamation';

    toast.innerHTML = `
      <i class="fa-solid ${icon}"></i>
      <span>${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // =========================================================================
  // 11. EVENT LISTENERS SETUP
  // =========================================================================
  function setupEventListeners() {
    const secForm = document.getElementById('mathSecurityForm');
    const refreshBtn = document.getElementById('refreshMathBtn');
    if (secForm) secForm.addEventListener('submit', verifyMathSecurity);
    if (refreshBtn) refreshBtn.addEventListener('click', () => {
      playBeep(440, 0.03);
      generateMathProblem();
    });

    const recheckBtn = document.getElementById('recheckSecurityBtn');
    if (recheckBtn) {
      recheckBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const gate = document.getElementById('securityGate');
        if (gate) {
          gate.classList.remove('gate-passed');
          document.body.classList.add('security-locked');
          generateMathProblem();
        }
      });
    }

    const currBtn = document.getElementById('currentCurrencyBtn');
    const currDropdown = document.getElementById('currencyDropdown');
    if (currBtn && currDropdown) {
      currBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currDropdown.classList.toggle('hidden');
      });

      document.querySelectorAll('.curr-opt').forEach(opt => {
        opt.addEventListener('click', () => {
          AppState.currentCurrency = opt.dataset.currency;
          localStorage.setItem(STORAGE_KEYS.CURRENCY, AppState.currentCurrency);
          updateCurrencyUI();
          currDropdown.classList.add('hidden');
        });
      });

      document.addEventListener('click', () => currDropdown.classList.add('hidden'));
    }

    const soundBtn = document.getElementById('soundToggleBtn');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        AppState.soundEnabled = !AppState.soundEnabled;
        localStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, String(AppState.soundEnabled));
        soundBtn.innerHTML = AppState.soundEnabled 
          ? '<i class="fa-solid fa-volume-high"></i>' 
          : '<i class="fa-solid fa-volume-xmark"></i>';
        showToast(`Звуковые эффекты: ${AppState.soundEnabled ? 'Включены' : 'Выключены'}`, 'info');
      });
    }

    const tabLogin = document.getElementById('tabLoginBtn');
    const tabReg = document.getElementById('tabRegisterBtn');
    if (tabLogin) tabLogin.addEventListener('click', () => switchAuthView('login'));
    if (tabReg) tabReg.addEventListener('click', () => switchAuthView('register'));

    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        playBeep(350, 0.03);
        closeAllModals();
      });
    });

    document.querySelectorAll('.toggle-pwd-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const input = document.getElementById(targetId);
        if (input) {
          const isPwd = input.type === 'password';
          input.type = isPwd ? 'text' : 'password';
          btn.innerHTML = isPwd ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
        }
      });
    });

    const demoBtn = document.getElementById('fillDemoAccountBtn');
    if (demoBtn) {
      demoBtn.addEventListener('click', () => {
        document.getElementById('loginUniqueCode').value = DEFAULT_DEMO_USER.id;
        document.getElementById('loginPassword').value = DEFAULT_DEMO_USER.password;
        playBeep(520, 0.04);
        showToast('Данные Демо-аккаунта заполнены!', 'info');
      });
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const code = document.getElementById('loginUniqueCode').value;
        const pwd = document.getElementById('loginPassword').value;
        const errBanner = document.getElementById('loginErrorMsg');
        const errText = document.getElementById('loginErrorText');

        const res = loginUser(code, pwd);
        if (res.success) {
          if (errBanner) errBanner.classList.add('hidden');
          showToast(`Добро пожаловать, ${res.user.name}! Вы вошли по коду ${res.user.id}.`, 'success');
          closeAllModals();
        } else {
          playErrorSound();
          if (errBanner && errText) {
            errText.textContent = res.message;
            errBanner.classList.remove('hidden');
          }
        }
      });
    }

    const regForm = document.getElementById('registerForm');
    if (regForm) {
      regForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('regFullName').value;
        const tg = document.getElementById('regTgHandle').value;
        const pwd = document.getElementById('regPassword').value;

        const user = registerNewUser(name, tg, pwd);

        const dispId = document.getElementById('displayGeneratedId');
        if (dispId) dispId.textContent = user.id;

        switchAuthView('success');
      });
    }

    const copyGenBtn = document.getElementById('copyGeneratedIdBtn');
    if (copyGenBtn) {
      copyGenBtn.addEventListener('click', () => {
        const idText = document.getElementById('displayGeneratedId').textContent;
        navigator.clipboard.writeText(idText).then(() => {
          playSuccessSound();
          const txt = document.getElementById('copyBtnText');
          if (txt) txt.textContent = 'Скопировано в буфер!';
          setTimeout(() => { if (txt) txt.textContent = 'Скопировать Код'; }, 2000);
          showToast('Уникальный Код Клиента скопирован!', 'success');
        });
      });
    }

    const copyProfBtn = document.getElementById('copyProfileIdBtn');
    if (copyProfBtn) {
      copyProfBtn.addEventListener('click', () => {
        if (!AppState.currentUser) return;
        navigator.clipboard.writeText(AppState.currentUser.id).then(() => {
          playSuccessSound();
          showToast('Код Клиента скопирован!', 'success');
        });
      });
    }

    const proceedBtn = document.getElementById('proceedToProfileBtn');
    if (proceedBtn) {
      proceedBtn.addEventListener('click', () => {
        closeAllModals();
        showToast('Вы авторизованы под вашим Уникальным Кодом!', 'success');
      });
    }

    const logoutBtn = document.getElementById('profileLogoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', logoutUser);

    const copyReceiptBtn = document.getElementById('copyReceiptTextBtn');
    if (copyReceiptBtn) {
      copyReceiptBtn.addEventListener('click', () => {
        const text = document.getElementById('receiptRawText').textContent;
        navigator.clipboard.writeText(text).then(() => {
          playSuccessSound();
          showToast('Текст заказа скопирован в буфер обмена!', 'success');
        });
      });
    }

    const navContactsBtn = document.getElementById('navContactsBtn');
    if (navContactsBtn) {
      navContactsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const sec = document.getElementById('contacts');
        if (sec) sec.scrollIntoView({ behavior: 'smooth' });
      });
    }

    const inquiryForm = document.getElementById('contactInquiryForm');
    if (inquiryForm) {
      inquiryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const cid = document.getElementById('contactClientId').value;
        const tg = document.getElementById('contactTgHandle').value;
        const msg = document.getElementById('contactMessageText').value;

        playSuccessSound();
        showToast('Запрос отправлен оператору Dragon-X. Мы свяжемся с вами в Telegram!', 'success');
        inquiryForm.reset();
      });
    }

    if (AppState.currentUser) {
      const cInp = document.getElementById('contactClientId');
      if (cInp) cInp.value = AppState.currentUser.id;
    }
  }

  // =========================================================================
  // 12. INITIALIZATION
  // =========================================================================
  function init() {
    generateMathProblem();

    const cleared = sessionStorage.getItem('dragonx_math_cleared');
    if (cleared === 'true') {
      AppState.isSecurityPassed = true;
      document.body.classList.remove('security-locked');
      const gate = document.getElementById('securityGate');
      if (gate) gate.classList.add('gate-passed');
    }

    initSession();
    initCurrency();
    initHeroShowcase();
    renderCatalog();
    initCart();
    initTelegramConfig();
    setupEventListeners();
  }

  // Expose public API for HTML onclick bindings
  window.DragonX = {
    openProductModal,
    quickAddPack: function (packCount) {
      const preg = PRODUCTS[0];
      const pack = preg.packOptions.find(p => p.count === packCount) || preg.packOptions[0];
      addToCart(preg, pack, MIN_ORDER_QTY);
    },
    selectModalPack: function (productId, count, price, btnEl) {
      const parent = btnEl.parentElement;
      parent.querySelectorAll('.pack-btn').forEach(b => b.classList.remove('active'));
      btnEl.classList.add('active');

      const preg = PRODUCTS[0];
      const pack = preg.packOptions.find(p => p.count === count);
      window._currentModalSelectedPack = pack;

      const txt = document.getElementById('modalAddPriceText');
      if (txt) txt.textContent = `В корзину (2 шт • ${formatPrice(price * 2)})`;
    },
    updateCartItemQty,
    removeCartItem,
    openTelegramCheckout
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
