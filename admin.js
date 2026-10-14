/**
 * DRAGON-X PHARMA - OPERATOR DISPATCH & BOT MASTER CONTROL CONSOLE
 * Real-time Telegram Bot API Synchronization • Master Dynamic Catalog & Pricing • GPS Tracking
 */

(function () {
  'use strict';

  const STORAGE_KEYS = {
    ADMIN_SESSION: 'dragonx_admin_session_v1',
    ADMIN_TOKEN: 'dragonx_admin_token_v3',
    OPERATOR_ID: 'dragonx_operator_id_v3',
    ORDERS: 'dragonx_orders_db_v2',
    DELETED_ORDERS: 'dragonx_deleted_orders_v2',
    USERS: 'dragonx_users_v2',
    BOT_CONFIG: 'dragonx_bot_config_v2',
    DELIVERY_ZONES: 'dragonx_delivery_zones_v2',
    STOCK_CONFIG: 'dragonx_stock_config_v2'
  };

  // Tashkent District Coordinates Presets
  const DISTRICT_COORDS = {
    'Чиланзор': '41.2721, 69.2045',
    'Яшнабад': '41.2985, 69.3241',
    'Ulugbek': '41.3412, 69.4520'
  };

  // Real Verified Orders for Tashkent DRAGON-X
  const SEED_ORDERS = [
    {
      id: 'DRGX-8634764266-8265',
      createdAt: '2026-10-13T11:53:47.000Z',
      customerId: 'DRGX-8634764266',
      customerName: 'Клиент #8634764266',
      telegram: '@dragon_buyer',
      district: 'Чиланзор',
      item: 'Рега',
      volume: '2 штук',
      totalAmount: 26.40,
      currency: 'USD',
      cryptoAmount: 0.406,
      cryptoCurrency: 'LTC',
      status: 'paid',
      deliveryLocation: 'Чиланзор, тайник готовится курьером',
      coordinates: '41.2721, 69.2045',
      trackingCode: 'DRGX-TRK-8265',
      notes: 'Оплачено в блокчейне LTC (0.40608 LTC). TxID: f1500bf280ad33816fe71ad4cbffff0da51df7b2a7e78c20e51d55dd9234c384'
    },
    {
      id: 'DRGX-8281942784-2817',
      createdAt: '2026-10-13T11:46:00.000Z',
      customerId: 'DRGX-8281942784',
      customerName: '𝐃.𝐊',
      telegram: '@dkouzz',
      district: 'Чиланзор',
      item: 'Рега',
      volume: '2 штук',
      totalAmount: 25.00,
      currency: 'USD',
      cryptoAmount: 0.385,
      cryptoCurrency: 'LTC',
      status: 'pending',
      deliveryLocation: 'Ташкент, Чиланзор (Координаты выдаются после подтверждения оплаты)',
      coordinates: '41.2721, 69.2045',
      trackingCode: 'DRGX-TRK-2817',
      notes: 'Ожидает проверки оплаты LTC'
    },
    {
      id: 'DRGX-7738837350-3207',
      createdAt: '2026-10-13T11:17:00.000Z',
      customerId: 'DRGX-7738837350',
      customerName: '𝐻𝐸𝐿𝐿☯ 𝒩𝒜R𝒞☯ ❎',
      telegram: '@hello_narco',
      district: 'Чиланзор',
      item: 'Рега',
      volume: '2 штук',
      totalAmount: 25.00,
      currency: 'USD',
      cryptoAmount: 0.385,
      cryptoCurrency: 'LTC',
      status: 'pending',
      deliveryLocation: 'Ташкент, Чиланзор (Координаты выдаются после подтверждения оплаты)',
      coordinates: '41.2721, 69.2045',
      trackingCode: 'DRGX-TRK-3207',
      notes: 'Ожидает проверки оплаты LTC'
    },
    {
      id: 'DRGX-8281942784-5209',
      createdAt: '2026-10-13T11:10:00.000Z',
      customerId: 'DRGX-8281942784',
      customerName: '𝐃.𝐊',
      telegram: '—',
      district: 'Яшнабад',
      item: 'Рега',
      volume: '2 штук',
      totalAmount: 25.00,
      currency: 'USD',
      cryptoAmount: 0.385,
      cryptoCurrency: 'LTC',
      status: 'pending',
      deliveryLocation: 'Ташкент, Яшнабад (Координаты выдаются после подтверждения оплаты)',
      coordinates: '41.2985, 69.3241',
      trackingCode: 'DRGX-TRK-5209',
      notes: 'Ожидает проверки оплаты LTC'
    },
    {
      id: 'DRGX-20261013-4821',
      createdAt: '2026-10-13T09:17:00.000Z',
      customerId: 'DRGX-8841-UZB',
      customerName: 'Тимур (VIP Client)',
      telegram: '@timur_tashkent',
      district: 'Чиланзор',
      item: 'Рега',
      volume: '2 шт',
      totalAmount: 25.00,
      currency: 'USD',
      cryptoAmount: 0.385,
      cryptoCurrency: 'LTC',
      status: 'picked_up',
      deliveryLocation: 'Чиланзор, кв-л 9, дом 14 (Магнит за кондиционером)',
      coordinates: '41.2721, 69.2045',
      trackingCode: 'DRGX-TRK-4821',
      pickedUpAt: '2026-10-13T09:45:00.000Z',
      notes: 'Клиент забрал заказ без задержек. Все чисто.'
    },
    {
      id: 'DRGX-9024-8142',
      createdAt: '2026-10-13T08:56:00.000Z',
      customerId: 'DRGX-90248142',
      customerName: 'Алексей VIP',
      telegram: '@tashkent_vip',
      district: 'Чиланзор',
      item: 'Рега',
      volume: '2 штук',
      totalAmount: 25.00,
      currency: 'USD',
      cryptoAmount: 0.385,
      cryptoCurrency: 'LTC',
      status: 'drop_ready',
      deliveryLocation: 'Чиланзор, квартал 9, дом 14, магнит под металлическим отливом',
      coordinates: '41.2721, 69.2045',
      trackingCode: 'DRGX-TRK-8142',
      notes: 'Дроп свежий, защитная метка X-42. Координаты подтверждены курьером.'
    },
    {
      id: 'DRGX-5519-9311',
      createdAt: '2026-10-13T04:46:00.000Z',
      customerId: 'DRGX-55199311',
      customerName: 'Сергей К.',
      telegram: '@sergey_tash',
      district: 'Яшнабад',
      item: 'Рега',
      volume: '5 штук',
      totalAmount: 55.00,
      currency: 'USD',
      cryptoAmount: 0.846,
      cryptoCurrency: 'LTC',
      status: 'picked_up',
      deliveryLocation: 'Яшнабад, ул. Султанали Машхади, тайник в нише кирпичной кладки',
      coordinates: '41.2985, 69.3241',
      trackingCode: 'DRGX-TRK-9311',
      pickedUpAt: '2026-10-13T06:15:00.000Z',
      notes: 'Клиент успешно забрал заказ в 14:15, тайник чист.'
    },
    {
      id: 'DRGX-1204-4420',
      createdAt: '2026-10-13T00:36:00.000Z',
      customerId: 'DRGX-12044420',
      customerName: 'Гость',
      telegram: '@ulugbek_client',
      district: 'Ulugbek',
      item: 'Рега',
      volume: '10 штук',
      totalAmount: 108.00,
      currency: 'USD',
      cryptoAmount: 1.66,
      cryptoCurrency: 'LTC',
      status: 'paid',
      deliveryLocation: 'Пос. Улугбек, парковая зона, опора освещения №7, магнитный бокс',
      coordinates: '41.3412, 69.4520',
      trackingCode: 'DRGX-TRK-4420',
      notes: 'Оплата LTC подтверждена в блокчейне. Курьер закладывает дроп.'
    }
  ];

  // Tashkent Delivery Zones Seed
  const SEED_ZONES = [
    {
      id: 'zone-chilonzor',
      city: 'Ташкент — Чиланзор',
      area: 'Кварталы 1–26 / Метро Новза & Чиланзар (Тайники & Магниты)',
      coordinates: '41.2721, 69.2045',
      notes: 'Круглосуточная закладка в течение 30-45 минут после оплаты LTC. Бесконтактный съем.'
    },
    {
      id: 'zone-yashnabad',
      city: 'Ташкент — Яшнабад',
      area: 'Ул. Карасу, Дубовая, массив 40 лет Победы (Тайники)',
      coordinates: '41.2985, 69.3241',
      notes: 'Высокая надежность и маскировка. Фото-отчет и двойные координаты GPS в боте.'
    },
    {
      id: 'zone-ulugbek',
      city: 'Ташкент — Ulugbek',
      area: 'Поселок Улугбек / Институт Ядерной Физики (Парковые тайники)',
      coordinates: '41.3412, 69.4520',
      notes: 'Тихие локации, мгновенный доступ без свидетелей. 100% гарантия сохранности.'
    }
  ];

  // Default Bot Config
  const DEFAULT_BOT_CONFIG = {
    product_name: 'Рега',
    username: '@yuan_rndiBOT',
    support_handle: '@ashley_graves3',
    support_url: 'https://t.me/ashley_graves3',
    website_url: 'https://dragonx-gamma.vercel.app',
    reviews_url: 'https://dragonx-gamma.vercel.app',
    exchanger_1_name: '🔄 Обменник 1 (Eva)',
    exchanger_1_url: 'https://t.me/Eva_obmen',
    exchanger_2_name: '🔄 Обменник 2 (Sum Exc)',
    exchanger_2_url: 'https://t.me/sum_exc',
    ltc_address: 'ltc1qr5xhqe9tdd5lekrxurfftdv9hhaaqche2urvhr',
    maintenance_mode: false,
    maintenance_text: '⚠️ Бот временно находится на техническом обслуживании. Свяжитесь с оператором: @ashley_graves3',
    districts: [
      { id: 'district_chilanzer', name: 'Чиланзор', coords: '41.2721, 69.2045', active: true },
      { id: 'district_yashnabad', name: 'Яшнабад', coords: '41.2985, 69.3241', active: true },
      { id: 'district_ulugbek', name: 'Ulugbek', coords: '41.3412, 69.4520', active: true }
    ],
    packages: [
      { key: 'buy_2', qty_num: 2, label_ru: '2 штук', price_usd: 25, stock: 50, active: true },
      { key: 'buy_3', qty_num: 3, label_ru: '3 штук', price_usd: 35, stock: 40, active: true },
      { key: 'buy_5', qty_num: 5, label_ru: '5 штук', price_usd: 55, stock: 30, active: true },
      { key: 'buy_10', qty_num: 10, label_ru: '10 штук', price_usd: 108, stock: 20, active: true },
      { key: 'buy_20', qty_num: 20, label_ru: '20 штук', price_usd: 210, stock: 15, active: true },
      { key: 'buy_50', qty_num: 50, label_ru: '50 штук', price_usd: 510, stock: 10, active: true },
      { key: 'buy_100', qty_num: 100, label_ru: '100 штук', price_usd: 1000, stock: 5, active: true }
    ]
  };

  // Admin App State
  const AdminState = {
    isAuthenticated: false,
    authToken: null,
    operatorId: null,
    activeTab: 'tabOrders',
    orders: [],
    deletedOrderIds: new Set(),
    zones: [],
    users: [],
    botConfig: { ...DEFAULT_BOT_CONFIG },
    stock: { 'buy_2': 50, 'buy_3': 40, 'buy_5': 30, 'buy_10': 20, 'buy_20': 15, 'buy_50': 10, 'buy_100': 5 },
    botApiUrl: 'https://dragonx.onrender.com',
    isApiOnline: false,
    isInitialConfigLoaded: false,
    lastSyncTime: null,
    syncIntervalId: null,
    searchQuery: '',
    statusFilter: 'all',
    activeTrackingOrderId: null
  };

  function detectDefaultApiUrl() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:10000';
    }
    return 'https://dragonx.onrender.com';
  }

  // Helper: inject Authorization Bearer token into outgoing API requests
  function getAuthHeaders(extraHeaders = {}) {
    const headers = { ...extraHeaders };
    const token = AdminState.authToken || sessionStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  // =========================================================================
  // 1. AUTHENTICATION & LOGIN GATE (SERVER-SIDE TOKEN AUTH)
  // =========================================================================
  async function checkAdminSession() {
    const token = sessionStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
    const opId = sessionStorage.getItem(STORAGE_KEYS.OPERATOR_ID);
    if (token) {
      AdminState.isAuthenticated = true;
      AdminState.authToken = token;
      AdminState.operatorId = opId || 'Оператор';
      unlockDashboard();
      verifyTokenWithServer(token);
    } else {
      lockDashboard();
    }
  }

  async function verifyTokenWithServer(token) {
    if (!token) return;
    try {
      const apiUrl = (AdminState.botApiUrl || detectDefaultApiUrl()).replace(/\/+$/, '');
      const resp = await fetch(`${apiUrl}/api/auth/verify`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resp.status === 401) {
        handleAdminLogout();
        showToast('Сессия оператора устарела. Пожалуйста, войдите снова.', 'warning');
      } else if (resp.ok) {
        const data = await resp.json().catch(() => ({}));
        if (data.operator_id) {
          AdminState.operatorId = data.operator_id;
          sessionStorage.setItem(STORAGE_KEYS.OPERATOR_ID, data.operator_id);
          const dispEl = document.getElementById('adminDisplayId');
          if (dispEl) dispEl.textContent = data.operator_id;
        }
      }
    } catch (e) {
      console.warn('Token verify warning:', e);
    }
  }

  async function handleAdminLogin(id, password) {
    const cleanId = (id || '').trim();
    const cleanPass = (password || '').trim();

    const errEl = document.getElementById('adminLoginError');

    if (!cleanId || !cleanPass) {
      if (errEl) {
        errEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> <span>Введите ID оператора и пароль!</span>';
        errEl.classList.remove('hidden');
      }
      return false;
    }

    const submitBtn = document.getElementById('adminLoginSubmitBtn');
    const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Проверка сервера...</span>';
    }

    if (errEl) errEl.classList.add('hidden');

    try {
      const apiUrl = (AdminState.botApiUrl || detectDefaultApiUrl()).replace(/\/+$/, '');
      const resp = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cleanId, password: cleanPass })
      });

      const data = await resp.json().catch(() => ({}));

      if (resp.ok && data.success && data.token) {
        sessionStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, 'authenticated');
        sessionStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, data.token);
        sessionStorage.setItem(STORAGE_KEYS.OPERATOR_ID, data.operator_id || cleanId);

        AdminState.isAuthenticated = true;
        AdminState.authToken = data.token;
        AdminState.operatorId = data.operator_id || cleanId;

        const passInp = document.getElementById('adminLoginPassword');
        if (passInp) passInp.value = '';
        const idInp = document.getElementById('adminLoginId');
        if (idInp) idInp.value = '';
        if (errEl) errEl.classList.add('hidden');

        unlockDashboard();
        showToast(`Авторизация успешна. Добро пожаловать, ${AdminState.operatorId}!`, 'success');
        return true;
      } else {
        if (errEl) {
          errEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> <span>${data.error || 'Неверный ID оператора или пароль доступа!'}</span>`;
          errEl.classList.remove('hidden');
        }
        const passInp = document.getElementById('adminLoginPassword');
        if (passInp) passInp.value = '';
        showToast('Ошибка доступа: неверный ID или пароль!', 'error');
        return false;
      }
    } catch (err) {
      console.error('Login network error:', err);
      if (errEl) {
        errEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> <span>Сервер бэкенда просыпается или временно недоступен. Подождите 10-15 сек и повторите.</span>';
        errEl.classList.remove('hidden');
      }
      showToast('Сервер бэкенда недоступен или перезапускается.', 'error');
      return false;
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHtml;
      }
    }
  }

  function handleAdminLogout() {
    sessionStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
    sessionStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.OPERATOR_ID);
    AdminState.isAuthenticated = false;
    AdminState.authToken = null;
    AdminState.operatorId = null;

    if (AdminState.syncIntervalId) {
      clearInterval(AdminState.syncIntervalId);
      AdminState.syncIntervalId = null;
    }
    if (activeEventSource) {
      try { activeEventSource.close(); } catch (e) {}
      activeEventSource = null;
    }
    lockDashboard();
    showToast('Сессия оператора завершена.', 'info');
  }

  function unlockDashboard() {
    const gate = document.getElementById('adminAuthGate');
    const dash = document.getElementById('adminDashboard');
    if (gate) gate.classList.add('logged-in');
    if (dash) dash.classList.remove('hidden');

    const opId = AdminState.operatorId || sessionStorage.getItem(STORAGE_KEYS.OPERATOR_ID) || 'Оператор';
    const dispEl = document.getElementById('adminDisplayId');
    if (dispEl) dispEl.textContent = opId;

    loadData();
    renderAll();
    startAutoSync();
  }

  function lockDashboard() {
    const gate = document.getElementById('adminAuthGate');
    const dash = document.getElementById('adminDashboard');
    if (gate) gate.classList.remove('logged-in');
    if (dash) dash.classList.add('hidden');

    const idInp = document.getElementById('adminLoginId');
    if (idInp) idInp.value = '';
    const passInp = document.getElementById('adminLoginPassword');
    if (passInp) passInp.value = '';

    const dispEl = document.getElementById('adminDisplayId');
    if (dispEl) dispEl.textContent = 'Оператор';
  }

  // =========================================================================
  // 2. DATA MANAGEMENT & LOCAL STORAGE
  // =========================================================================
  function loadData() {
    // 1. Bot Config & API Gateway URL
    try {
      const savedBot = localStorage.getItem(STORAGE_KEYS.BOT_CONFIG);
      if (savedBot) {
        const parsed = JSON.parse(savedBot);
        AdminState.botConfig = Object.assign({ ...DEFAULT_BOT_CONFIG }, parsed);
        if (parsed.apiUrl && !parsed.apiUrl.includes('dragon-x-telegram-bot.onrender.com')) {
          AdminState.botApiUrl = parsed.apiUrl;
        } else {
          AdminState.botApiUrl = detectDefaultApiUrl();
          AdminState.botConfig.apiUrl = AdminState.botApiUrl;
          localStorage.setItem(STORAGE_KEYS.BOT_CONFIG, JSON.stringify(AdminState.botConfig));
        }
      } else {
        AdminState.botConfig = { ...DEFAULT_BOT_CONFIG };
        AdminState.botApiUrl = detectDefaultApiUrl();
      }
    } catch (e) {
      AdminState.botConfig = { ...DEFAULT_BOT_CONFIG };
      AdminState.botApiUrl = detectDefaultApiUrl();
    }


    // 2. Orders Local Storage
    loadDeletedOrderIdsLocally();
    try {
      const savedOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (savedOrders) {
        const parsed = JSON.parse(savedOrders);
        const legacyMockIds = new Set(['DRGX-20261013-7914', 'DRGX-20261013-9102', 'DRGX-20261013-1153']);
        const cleaned = parsed.filter(o => !legacyMockIds.has(o.id) && !AdminState.deletedOrderIds.has(o.id));
        AdminState.orders = cleaned.length > 0 ? cleaned : SEED_ORDERS.filter(o => !AdminState.deletedOrderIds.has(o.id));
      } else {
        AdminState.orders = SEED_ORDERS.filter(o => !AdminState.deletedOrderIds.has(o.id));
      }
      saveOrdersLocally();
    } catch (e) {
      AdminState.orders = SEED_ORDERS.filter(o => !AdminState.deletedOrderIds.has(o.id));
    }

    // 3. Zones Local Storage
    try {
      const savedZones = localStorage.getItem(STORAGE_KEYS.DELIVERY_ZONES);
      if (savedZones) {
        AdminState.zones = JSON.parse(savedZones);
      } else {
        AdminState.zones = [...SEED_ZONES];
        saveZonesLocally();
      }
    } catch (e) {
      AdminState.zones = [...SEED_ZONES];
    }

    // 4. Users List
    try {
      const savedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      if (savedUsers) {
        AdminState.users = JSON.parse(savedUsers);
      } else {
        buildUsersFromOrders();
      }
    } catch (e) {
      buildUsersFromOrders();
    }
  }

  function saveDeletedOrderIdsLocally() {
    try {
      localStorage.setItem(STORAGE_KEYS.DELETED_ORDERS, JSON.stringify([...AdminState.deletedOrderIds]));
    } catch (e) {}
  }

  function loadDeletedOrderIdsLocally() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DELETED_ORDERS);
      if (saved) {
        AdminState.deletedOrderIds = new Set(JSON.parse(saved));
      } else {
        AdminState.deletedOrderIds = new Set();
      }
    } catch (e) {
      AdminState.deletedOrderIds = new Set();
    }
  }

  function saveOrdersLocally() {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(AdminState.orders));
  }

  function saveZonesLocally() {
    localStorage.setItem(STORAGE_KEYS.DELIVERY_ZONES, JSON.stringify(AdminState.zones));
  }

  function saveBotConfigLocally() {
    localStorage.setItem(STORAGE_KEYS.BOT_CONFIG, JSON.stringify(AdminState.botConfig));
  }

  function buildUsersFromOrders() {
    const userMap = new Map();
    AdminState.orders.forEach(ord => {
      const uId = ord.customerId || 'DRGX-GUEST';
      if (!userMap.has(uId)) {
        userMap.set(uId, {
          id: uId,
          name: ord.customerName || 'Клиент',
          telegram: ord.telegram || '',
          ordersCount: 1,
          totalSpent: ord.totalAmount || 0,
          createdAt: ord.createdAt
        });
      } else {
        const u = userMap.get(uId);
        u.ordersCount += 1;
        u.totalSpent += (ord.totalAmount || 0);
      }
    });
    AdminState.users = Array.from(userMap.values());
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(AdminState.users));
  }

  // =========================================================================
  // 3. REAL-TIME BOT REST API SYNCHRONIZATION
  // =========================================================================
  async function syncWithBotAPI(silent = false) {
    const syncPill = document.getElementById('adminSyncPill');
    const syncLabel = document.getElementById('adminSyncLabel');
    const syncIcon = document.getElementById('adminSyncIcon');
    const syncSpin = document.getElementById('syncSpinIcon');
    const gatewayBadge = document.getElementById('botGatewayStatusBadge');
    const pingEl = document.getElementById('botPingLatency');

    if (syncSpin) syncSpin.classList.add('fa-spin');
    if (syncIcon) syncIcon.classList.add('fa-spin');

    const apiUrl = (AdminState.botApiUrl || detectDefaultApiUrl()).replace(/\/+$/, '');
    const startTime = performance.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      // 1. Fetch Orders with Bearer Auth
      const resp = await fetch(`${apiUrl}/api/orders`, {
        method: 'GET',
        headers: getAuthHeaders({ 'Accept': 'application/json' }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (resp.status === 401) {
        handleAdminLogout();
        showToast('Сессия оператора истекла. Авторизуйтесь снова.', 'warning');
        return;
      }

      const elapsed = Math.round(performance.now() - startTime);

      if (resp.ok) {
        const data = await resp.json();
        const ordersArray = Array.isArray(data) ? data : (data && Array.isArray(data.orders) ? data.orders : null);

        if (ordersArray) {
          mergeBotOrders(ordersArray);
          AdminState.isApiOnline = true;
          AdminState.lastSyncTime = new Date();

          // 2. Fetch Live Bot Config & Stocks
          try {
            const cfgResp = await fetch(`${apiUrl}/api/config`);
            if (cfgResp.ok) {
              const cfgData = await cfgResp.json();
              if (cfgData && cfgData.config) {
                // Update live stock numbers dynamically without interrupting active input
                if (Array.isArray(cfgData.config.packages)) {
                  updateLiveStockValues(cfgData.config.packages);
                }
                if (!silent || !AdminState.isInitialConfigLoaded) {
                  const isEditing = document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA');
                  const hasDirtyInputs = !!document.querySelector('#botPackagesTable input[data-dirty="true"], #botDistrictsTable input[data-dirty="true"]');
                  if (!isEditing && !hasDirtyInputs) {
                    AdminState.botConfig = Object.assign(AdminState.botConfig, cfgData.config);
                    saveBotConfigLocally();
                    renderTelegramTab();
                    renderBotCatalogTab();
                  }
                  AdminState.isInitialConfigLoaded = true;
                }
              }
            }
          } catch (e) {}

          // Update UI Status Indicators
          if (syncPill) syncPill.className = 'status-pill status-sync online';
          if (syncLabel) syncLabel.textContent = `🟢 Бот API: ОНЛАЙН (${elapsed}ms)`;
          if (gatewayBadge) {
            gatewayBadge.className = 'badge-status-online';
            gatewayBadge.innerHTML = `<i class="fa-solid fa-circle"></i> ОНЛАЙН (Синхронизировано)`;
          }
          if (pingEl) {
            pingEl.textContent = `~${elapsed} ms`;
            pingEl.className = 'font-mono text-green';
          }

          renderMetrics();
          renderOrdersTable();
          buildUsersFromOrders();
          renderClientsTable();
          // Note: renderBotCatalogTab() is NOT called on background poll to prevent reverting user typing!

          if (!silent) {
            showToast(`Синхронизация успешна! Получено ${ordersArray.length} заказов из бота (${elapsed}ms).`, 'success');
          }
          return true;
        }
      }
      throw new Error(`API status ${resp.status}`);
    } catch (err) {
      console.warn('Bot API offline/cache mode:', err.message);
      AdminState.isApiOnline = false;

      if (syncPill) syncPill.className = 'status-pill status-sync offline';
      if (syncLabel) syncLabel.textContent = `🟡 Автономно (Локальный кэш)`;
      if (gatewayBadge) {
        gatewayBadge.className = 'badge-status-offline';
        gatewayBadge.innerHTML = `<i class="fa-solid fa-circle"></i> АВТОНОМНО (Локальная база)`;
      }
      if (pingEl) {
        pingEl.textContent = 'Таймаут (Кэш)';
        pingEl.className = 'font-mono text-muted';
      }

      if (!silent) {
        showToast('Бот API в спящем режиме Render или недоступен. Используется локальная база данных.', 'info');
      }
      return false;
    } finally {
      if (syncSpin) syncSpin.classList.remove('fa-spin');
      if (syncIcon) syncIcon.classList.remove('fa-spin');
    }
  }

  function mergeBotOrders(botOrders) {
    if (!Array.isArray(botOrders) || botOrders.length === 0) return;

    const deletedSet = AdminState.deletedOrderIds || new Set();
    const botMap = new Map();
    botOrders.forEach(bo => {
      const oid = bo.id || bo.order_id;
      if (!oid || deletedSet.has(oid)) return;

      const orderDate = bo.createdAt || 
        (bo.createdTimestamp ? new Date(bo.createdTimestamp * 1000).toISOString() : 
        (bo.created_at ? new Date(bo.created_at * 1000).toISOString() : new Date().toISOString()));

      const tg = bo.telegram && bo.telegram !== '—' 
        ? (bo.telegram.startsWith('@') ? bo.telegram : `@${bo.telegram}`) 
        : (bo.username ? `@${bo.username.replace('@','')}` : '—');

      const totalVal = parseFloat(bo.totalAmount || bo.price_usd || bo.total_amount || 25);
      const cryptoVal = parseFloat(bo.cryptoAmount || bo.ltc_amount || (totalVal / 65).toFixed(3));

      const normalized = {
        id: oid,
        createdAt: orderDate,
        customerId: bo.customerId || bo.customer_id || (bo.userId ? `DRGX-${bo.userId}` : (bo.user_id ? `DRGX-${bo.user_id}` : 'DRGX-TG-USER')),
        customerName: bo.customerName || bo.customer_name || (bo.userId ? `Клиент #${bo.userId}` : 'Покупатель Telegram'),
        telegram: tg,
        district: bo.district || 'Чиланзор',
        item: bo.product || bo.item || AdminState.botConfig.product_name || 'Рега',
        volume: bo.qty || bo.volume || `${bo.quantity || 2} шт`,
        totalAmount: totalVal,
        currency: bo.currency || 'USD',
        cryptoAmount: cryptoVal,
        cryptoCurrency: 'LTC',
        status: bo.status || 'pending',
        deliveryLocation: bo.deliveryLocation || bo.location || 'Локация выдается в боте',
        coordinates: bo.coordinates || DISTRICT_COORDS[bo.district] || '41.2721, 69.2045',
        trackingCode: bo.trackingCode || bo.tracking_code || `DRGX-TRK-${(oid||'').slice(-4)}`,
        pickedUpAt: bo.pickedUpAt || (bo.picked_up_at ? new Date(bo.picked_up_at * 1000).toISOString() : null),
        notes: bo.notes || ''
      };
      botMap.set(normalized.id, normalized);
    });

    const merged = [];
    const processedIds = new Set();

    botMap.forEach((botOrder, id) => {
      merged.push(botOrder);
      processedIds.add(id);
    });

    const legacyMockIds = new Set(['DRGX-20261013-7914', 'DRGX-20261013-9102', 'DRGX-20261013-1153']);
    AdminState.orders.forEach(lo => {
      if (!processedIds.has(lo.id) && !legacyMockIds.has(lo.id) && !deletedSet.has(lo.id)) {
        merged.push(lo);
        processedIds.add(lo.id);
      }
    });

    // Sort newest orders at top
    merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    AdminState.orders = merged;
    saveOrdersLocally();
  }

  let activeEventSource = null;

  function initSSE() {
    if (!window.EventSource) return;
    if (activeEventSource) {
      try { activeEventSource.close(); } catch (e) {}
      activeEventSource = null;
    }
    const apiUrl = (AdminState.botApiUrl || detectDefaultApiUrl()).replace(/\/+$/, '');
    const token = AdminState.authToken || sessionStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN) || '';
    try {
      const es = new EventSource(`${apiUrl}/api/events?token=${encodeURIComponent(token)}`);
      activeEventSource = es;

      es.addEventListener('order_created', (e) => {
        try {
          const ord = JSON.parse(e.data);
          if (ord && ord.id) {
            mergeBotOrders([ord]);
            renderAll();
            showToast(`⚡ Новый заказ из Telegram: ${ord.id}!`, 'info');
          }
        } catch (err) {}
      });

      es.addEventListener('order_updated', (e) => {
        try {
          const ord = JSON.parse(e.data);
          if (ord && ord.id) {
            mergeBotOrders([ord]);
            renderAll();
          }
        } catch (err) {}
      });

      es.addEventListener('order_deleted', (e) => {
        try {
          const { order_id } = JSON.parse(e.data);
          if (order_id) {
            if (!AdminState.deletedOrderIds) AdminState.deletedOrderIds = new Set();
            AdminState.deletedOrderIds.add(order_id);
            saveDeletedOrderIdsLocally();
            AdminState.orders = AdminState.orders.filter(o => o.id !== order_id);
            saveOrdersLocally();
            renderAll();
          }
        } catch (err) {}
      });

      es.addEventListener('stock_updated', (e) => {
        try {
          const { packages } = JSON.parse(e.data);
          if (Array.isArray(packages)) {
            updateLiveStockValues(packages);
          }
        } catch (err) {}
      });
    } catch (err) {
      console.warn('SSE initialization failed:', err);
    }
  }

  function startAutoSync() {
    if (AdminState.syncIntervalId) clearInterval(AdminState.syncIntervalId);
    syncWithBotAPI(true);
    initSSE();
    AdminState.syncIntervalId = setInterval(() => {
      syncWithBotAPI(true);
    }, 8000);
  }

  // =========================================================================
  // 4. RENDERING ENGINE
  // =========================================================================
  function renderAll() {
    renderMetrics();
    renderOrdersTable();
    renderZonesList();
    renderTelegramTab();
    renderClientsTable();
    renderBotCatalogTab();
  }

  function renderMetrics() {
    const totalOrdersEl = document.getElementById('metricTotalOrders');
    const totalRevEl = document.getElementById('metricTotalRevenue');
    const activeDelEl = document.getElementById('metricActiveDelivery');
    const pickedUpEl = document.getElementById('metricPickedUpCount');
    const ordersBadge = document.getElementById('ordersTabCount');

    const totalOrders = AdminState.orders.length;
    const totalRevenue = AdminState.orders.reduce((sum, ord) => sum + (parseFloat(ord.totalAmount) || 0), 0);
    const activeDelivery = AdminState.orders.filter(ord => ord.status === 'drop_ready' || ord.status === 'paid').length;
    const pickedUpCount = AdminState.orders.filter(ord => ord.status === 'picked_up').length;

    if (totalOrdersEl) totalOrdersEl.textContent = totalOrders;
    if (totalRevEl) totalRevEl.textContent = `${totalRevenue.toFixed(2)} $`;
    if (activeDelEl) activeDelEl.textContent = activeDelivery;
    if (pickedUpEl) pickedUpEl.textContent = pickedUpCount;
    if (ordersBadge) ordersBadge.textContent = totalOrders;
  }

  function getStatusBadge(status) {
    switch (status) {
      case 'picked_up':
        return `<span class="ord-status status-picked-up"><i class="fa-solid fa-circle-check"></i> Забран (Picked Up)</span>`;
      case 'drop_ready':
        return `<span class="ord-status status-drop-ready"><i class="fa-solid fa-location-dot"></i> Локация выдана</span>`;
      case 'paid':
        return `<span class="ord-status status-paid"><i class="fa-solid fa-coins"></i> Оплачен (LTC)</span>`;
      case 'cancelled':
        return `<span class="ord-status status-cancelled"><i class="fa-solid fa-ban"></i> Отменен</span>`;
      default:
        return `<span class="ord-status status-new"><i class="fa-solid fa-clock"></i> Ожидает LTC</span>`;
    }
  }

  function renderOrdersTable() {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;

    let filtered = AdminState.orders.filter(order => {
      if (AdminState.statusFilter !== 'all' && order.status !== AdminState.statusFilter) return false;
      if (AdminState.searchQuery) {
        const q = AdminState.searchQuery.toLowerCase();
        const idMatch = (order.id || '').toLowerCase().includes(q);
        const cIdMatch = (order.customerId || '').toLowerCase().includes(q);
        const tgMatch = (order.telegram || '').toLowerCase().includes(q);
        const nameMatch = (order.customerName || '').toLowerCase().includes(q);
        const distMatch = (order.district || '').toLowerCase().includes(q);
        const locMatch = (order.deliveryLocation || '').toLowerCase().includes(q);
        return idMatch || cIdMatch || tgMatch || nameMatch || distMatch || locMatch;
      }
      return true;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="10" style="text-align: center; padding: 3rem; color: var(--text-dim);">
            <i class="fa-solid fa-inbox" style="font-size: 2.2rem; margin-bottom: 0.75rem; display:block; color: var(--accent-cyan); opacity: 0.5;"></i>
            Заказов по заданным критериям не найдено
          </td>
        </tr>
      `;
      return;
    }

    const prodName = AdminState.botConfig.product_name || 'Рега';

    tbody.innerHTML = filtered.map(ord => {
      const dateStr = new Date(ord.createdAt).toLocaleDateString('ru-RU', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
      });

      const volumeSummary = ord.volume ? `${prodName} (${ord.volume})` : `${prodName} (2 шт)`;
      const districtDisplay = ord.district || 'Чиланзор';
      const tgLink = ord.telegram && ord.telegram.startsWith('@') 
        ? `<a href="https://t.me/${ord.telegram.replace('@', '')}" target="_blank" class="font-mono text-cyan" style="text-decoration:none;">${escapeHtml(ord.telegram)}</a>`
        : escapeHtml(ord.telegram || '—');

      const isPickedUp = ord.status === 'picked_up';

      return `
        <tr>
          <td><strong class="font-mono text-cyan">${escapeHtml(ord.id)}</strong></td>
          <td style="font-size: 0.8rem; color: var(--text-muted);">${dateStr}</td>
          <td>
            <div style="font-weight: 700;">${escapeHtml(ord.customerName || 'Клиент')}</div>
            <div class="font-mono" style="font-size: 0.72rem; color: var(--accent-cyan);">${escapeHtml(ord.customerId || 'Без ID')}</div>
          </td>
          <td>${tgLink}</td>
          <td>
            <span class="district-badge-cell">
              <i class="fa-solid fa-map-pin" style="color: var(--accent-cyan); margin-right: 4px;"></i>${escapeHtml(districtDisplay)}
            </span>
          </td>
          <td><strong style="color: #fff;">${escapeHtml(volumeSummary)}</strong></td>
          <td><strong class="font-mono" style="color: #fbbf24;">${(parseFloat(ord.totalAmount) || 0).toFixed(2)} $</strong></td>
          <td>
            <div class="location-preview-cell" onclick="window.AdminOps.trackLocation('${ord.id}')" title="Кликните для отслеживания локации и тайника" style="cursor: pointer;">
              <i class="fa-solid fa-crosshairs text-cyan"></i>
              <span class="loc-text">${escapeHtml(ord.deliveryLocation || districtDisplay)}</span>
              ${ord.coordinates ? `<span class="coords-mini font-mono">${escapeHtml(ord.coordinates)}</span>` : ''}
            </div>
          </td>
          <td>${getStatusBadge(ord.status)}</td>
          <td>
            <div class="table-action-btns">
              <!-- TRACK LOCATION CONSOLE -->
              <button class="action-icon-btn btn-action-track" onclick="window.AdminOps.trackLocation('${ord.id}')" title="📍 Отследить локацию и тайник (GPS)">
                <i class="fa-solid fa-location-crosshairs"></i>
              </button>

              <!-- 1-CLICK MARK AS PICKED UP -->
              ${!isPickedUp ? `
                <button class="action-icon-btn btn-action-pickup" onclick="window.AdminOps.markOrderPickedUp('${ord.id}')" title="✅ Отметить как Забран (Picked Up)">
                  <i class="fa-solid fa-check"></i>
                </button>
              ` : `
                <span class="action-icon-btn action-disabled" title="Заказ уже забран" style="opacity: 0.4; cursor: default;">
                  <i class="fa-solid fa-check-double text-green"></i>
                </span>
              `}

              <!-- EDIT FULL DETAILS -->
              <button class="action-icon-btn" onclick="window.AdminOps.viewOrderDetails('${ord.id}')" title="👁️ Редактировать все данные заказа">
                <i class="fa-solid fa-pen-to-square"></i>
              </button>

              <!-- TELEGRAM QUICK CHAT -->
              <button class="action-icon-btn" onclick="window.AdminOps.quickTgContact('${ord.telegram}', '${ord.id}')" title="💬 Написать клиенту в Telegram">
                <i class="fa-brands fa-telegram"></i>
              </button>

              <!-- DELETE ORDER -->
              <button class="action-icon-btn action-delete-btn" onclick="window.AdminOps.deleteOrder('${ord.id}')" title="🗑️ Удалить заказ">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function renderZonesList() {
    const container = document.getElementById('activeZonesList');
    if (!container) return;

    if (AdminState.zones.length === 0) {
      container.innerHTML = `<p style="color: var(--text-dim); text-align:center; padding: 2rem;">Нет сохраненных районов доставки</p>`;
      return;
    }

    container.innerHTML = AdminState.zones.map(zone => `
      <div class="zone-item-card glass-panel-inner" style="margin-bottom: 0.85rem; padding: 1.1rem; border-radius: 10px; display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <div class="zone-city" style="font-weight: 700; font-size: 1.05rem; margin-bottom: 0.25rem;">
            <i class="fa-solid fa-map-pin" style="color: var(--accent-cyan); margin-right: 6px;"></i> ${escapeHtml(zone.city)}
          </div>
          <div class="zone-area" style="color: var(--text-muted); font-size: 0.85rem;">${escapeHtml(zone.area)}</div>
          ${zone.coordinates ? `<div class="zone-coords font-mono" style="color: var(--accent-cyan); font-size: 0.82rem; margin-top: 0.35rem;"><i class="fa-solid fa-crosshairs"></i> GPS: ${escapeHtml(zone.coordinates)}</div>` : ''}
          ${zone.notes ? `<p style="font-size: 0.82rem; color: #a1a1aa; margin-top: 0.45rem;">${escapeHtml(zone.notes)}</p>` : ''}
        </div>
        <button class="action-icon-btn action-delete-btn" onclick="window.AdminOps.deleteZone('${zone.id}')" title="Удалить зону">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    `).join('');
  }

  function renderTelegramTab() {
    const b = AdminState.botConfig;

    const apiUrlInp = document.getElementById('adminBotApiUrl');
    const botUserInp = document.getElementById('adminBotUsername');
    const botSupInp = document.getElementById('adminOperatorHandle');
    const ltcInp = document.getElementById('adminBotLtcAddress');
    const ex1Inp = document.getElementById('adminBotExchanger1');
    const ex2Inp = document.getElementById('adminBotExchanger2');
    const maintToggle = document.getElementById('adminBotMaintenanceToggle');
    const maintText = document.getElementById('adminBotMaintenanceText');
    const maintGroup = document.getElementById('maintenanceTextGroup');

    const activeLabel = document.getElementById('displayActiveBotHandle');
    const activeLtc = document.getElementById('displayActiveLtcWallet');
    const modeLabel = document.getElementById('displayBotModeLabel');
    const openDirectLink = document.getElementById('openBotDirectAdminLink');

    if (apiUrlInp) apiUrlInp.value = AdminState.botApiUrl || detectDefaultApiUrl();
    if (botUserInp) botUserInp.value = b.username || '@yuan_rndiBOT';
    if (botSupInp) botSupInp.value = b.support_handle || '@ashley_graves3';
    if (ltcInp) ltcInp.value = b.ltc_address || 'ltc1qr5xhqe9tdd5lekrxurfftdv9hhaaqche2urvhr';
    if (ex1Inp) ex1Inp.value = b.exchanger_1_url || 'https://t.me/Eva_obmen';
    if (ex2Inp) ex2Inp.value = b.exchanger_2_url || 'https://t.me/sum_exc';

    if (maintToggle) {
      maintToggle.checked = !!b.maintenance_mode;
      if (maintGroup) maintGroup.style.display = b.maintenance_mode ? 'block' : 'none';
    }
    if (maintText) maintText.value = b.maintenance_text || '⚠️ Бот временно находится на техническом обслуживании.';

    if (activeLabel) activeLabel.textContent = b.username || '@yuan_rndiBOT';
    if (activeLtc) {
      const addr = b.ltc_address || 'ltc1qr5xhqe9tdd5lekrxurfftdv9hhaaqche2urvhr';
      activeLtc.textContent = `${addr.slice(0, 10)}...${addr.slice(-6)}`;
    }
    if (modeLabel) {
      if (b.maintenance_mode) {
        modeLabel.textContent = '⚠️ Техническое обслуживание';
        modeLabel.className = 'font-mono text-red';
      } else {
        modeLabel.textContent = '🟢 Активен (Заказы включены)';
        modeLabel.className = 'font-mono text-green';
      }
    }
    if (openDirectLink) {
      const clean = (b.username || '@yuan_rndiBOT').replace('@', '');
      openDirectLink.href = `https://t.me/${clean}`;
    }
  }

  function renderClientsTable() {
    const tbody = document.getElementById('clientsTableBody');
    if (!tbody) return;

    if (AdminState.users.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-dim); padding: 2.5rem;">Клиенты еще не регистрировались</td></tr>`;
      return;
    }

    tbody.innerHTML = AdminState.users.map(u => {
      const dateStr = u.createdAt ? new Date(u.createdAt).toLocaleDateString('ru-RU') : '—';
      const tg = u.telegram ? `<a href="https://t.me/${u.telegram.replace('@','')}" target="_blank" class="font-mono text-cyan">${escapeHtml(u.telegram)}</a>` : '—';

      return `
        <tr>
          <td><strong class="font-mono text-cyan" style="font-size: 0.95rem;">${escapeHtml(u.id)}</strong></td>
          <td><strong>${escapeHtml(u.name || 'Покупатель')}</strong></td>
          <td>${tg}</td>
          <td style="color: var(--text-muted); font-size: 0.8rem;">${dateStr}</td>
          <td><span class="tab-badge">${u.ordersCount || 1}</span></td>
          <td><strong class="font-mono text-gold">${(u.totalSpent || 0).toFixed(2)} $</strong></td>
          <td>
            <button class="action-icon-btn" onclick="window.AdminOps.copyClientId('${u.id}')" title="Скопировать Unique ID">
              <i class="fa-solid fa-copy"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // =========================================================================
  // 5. MASTER BOT CATALOG & PACKAGES EDITOR (TAB 5)
  // =========================================================================
  function renderBotCatalogTab() {
    const prodNameInp = document.getElementById('cfgBotProductName');
    if (prodNameInp) {
      prodNameInp.value = AdminState.botConfig.product_name || 'Рега';
    }

    // 1. Packages Table
    const pkgTbody = document.getElementById('botPackagesTableBody');
    if (pkgTbody) {
      const pkgs = AdminState.botConfig.packages || [];
      pkgTbody.innerHTML = pkgs.map((pkg, idx) => `
        <tr data-pkg-idx="${idx}">
          <td><input type="text" class="pkg-key-inp font-mono" value="${escapeHtml(pkg.key || `buy_${pkg.qty_num}`)}"></td>
          <td><input type="number" class="pkg-qty-inp font-mono" value="${pkg.qty_num || 2}" min="1"></td>
          <td><input type="text" class="pkg-lbl-inp" value="${escapeHtml(pkg.label_ru || `${pkg.qty_num} штук`)}"></td>
          <td><input type="number" class="pkg-price-inp font-mono text-gold" value="${pkg.price_usd || 25}" min="1"></td>
          <td><input type="number" class="pkg-stock-inp font-mono text-cyan" value="${pkg.stock !== undefined ? pkg.stock : 50}" min="0"></td>
          <td style="text-align: center;">
            <input type="checkbox" class="pkg-active-inp" ${pkg.active !== false ? 'checked' : ''} style="width: 17px; height: 17px; accent-color: var(--accent-cyan);">
          </td>
          <td style="text-align: center;">
            <button type="button" class="action-icon-btn action-delete-btn" onclick="window.AdminOps.deletePackageRow(${idx})" title="Удалить позицию">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </td>
        </tr>
      `).join('');
    }

    // 2. Districts Table
    const distTbody = document.getElementById('botDistrictsTableBody');
    if (distTbody) {
      const dists = AdminState.botConfig.districts || [];
      distTbody.innerHTML = dists.map((dist, idx) => `
        <tr data-dist-idx="${idx}">
          <td><input type="text" class="dist-id-inp font-mono" value="${escapeHtml(dist.id || `district_${idx}`)}"></td>
          <td><input type="text" class="dist-name-inp font-bold" value="${escapeHtml(dist.name || '')}"></td>
          <td><input type="text" class="dist-coords-inp font-mono text-cyan" value="${escapeHtml(dist.coords || '41.2721, 69.2045')}"></td>
          <td style="text-align: center;">
            <input type="checkbox" class="dist-active-inp" ${dist.active !== false ? 'checked' : ''} style="width: 17px; height: 17px; accent-color: var(--accent-cyan);">
          </td>
          <td style="text-align: center;">
            <button type="button" class="action-icon-btn action-delete-btn" onclick="window.AdminOps.deleteDistrictRow(${idx})" title="Удалить район">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </td>
        </tr>
      `).join('');
    }

    // 3. Tab 5 Controls (Payment, Exchangers, Support, Maintenance)
    const ltcInp = document.getElementById('cfgBotLtcWallet');
    if (ltcInp) ltcInp.value = AdminState.botConfig.ltc_address || 'ltc1qr5xhqe9tdd5lekrxurfftdv9hhaaqche2urvhr';

    const ex1Inp = document.getElementById('cfgBotExchanger1');
    if (ex1Inp) ex1Inp.value = AdminState.botConfig.exchanger_1_url || 'https://t.me/Eva_obmen';

    const ex2Inp = document.getElementById('cfgBotExchanger2');
    if (ex2Inp) ex2Inp.value = AdminState.botConfig.exchanger_2_url || 'https://t.me/sum_exc';

    const supInp = document.getElementById('cfgBotSupportHandle');
    if (supInp) supInp.value = AdminState.botConfig.support_handle || '@ashley_graves3';

    const maintToggle = document.getElementById('cfgBotMaintenanceToggle');
    if (maintToggle) {
      maintToggle.checked = AdminState.botConfig.maintenance_mode === true;
      const grp = document.getElementById('cfgMaintenanceTextGroup');
      if (grp) grp.style.display = maintToggle.checked ? 'block' : 'none';
    }

    const maintText = document.getElementById('cfgBotMaintenanceText');
    if (maintText) maintText.value = AdminState.botConfig.maintenance_text || '⚠️ Бот временно находится на техническом обслуживании. Свяжитесь с оператором: @ashley_graves3';

    // 4. Update Tab 1 Banner Elements
    const bBotName = document.getElementById('bannerBotName');
    if (bBotName) bBotName.textContent = AdminState.botConfig.username || '@yuan_rndiBOT';

    const bProd = document.getElementById('bannerProdName');
    if (bProd) bProd.textContent = AdminState.botConfig.product_name || 'Рега';

    const bDist = document.getElementById('bannerDistCount');
    if (bDist) {
      const activeCount = (AdminState.botConfig.districts || []).filter(d => d.active !== false).length;
      bDist.textContent = activeCount;
    }

    const bLtc = document.getElementById('bannerLtcCode');
    if (bLtc) {
      const addr = AdminState.botConfig.ltc_address || 'ltc1qr5xhqe9tdd5lekrxurfftdv9hhaaqche2urvhr';
      bLtc.textContent = addr.length > 14 ? `${addr.slice(0, 10)}...${addr.slice(-4)}` : addr;
    }

    const bOnline = document.getElementById('bannerBotOnlineBadge');
    const bDot = document.getElementById('bannerPulseDot');
    if (bOnline && bDot) {
      if (AdminState.isApiOnline) {
        bOnline.className = 'badge-status-online';
        bOnline.innerHTML = `<i class="fa-solid fa-circle"></i> ОНЛАЙН (dragonx.onrender.com)`;
        bDot.style.background = '#10b981';
        bDot.style.boxShadow = '0 0 12px #10b981';
      } else {
        bOnline.className = 'badge-status-offline';
        bOnline.innerHTML = `<i class="fa-solid fa-circle"></i> АВТОНОМНО (Кэш)`;
        bDot.style.background = '#f59e0b';
        bDot.style.boxShadow = '0 0 12px #f59e0b';
      }
    }
  }

  function updateLiveStockValues(packages) {
    if (!Array.isArray(packages)) return;
    packages.forEach((pkg, idx) => {
      const row = document.querySelector(`tr[data-pkg-idx="${idx}"]`);
      if (row) {
        const inp = row.querySelector('.pkg-stock-inp');
        if (inp) {
          // If the user modified this input or is currently focused on it, NEVER overwrite it!
          if (inp.dataset.dirty === 'true' || document.activeElement === inp) {
            return;
          }
          const curVal = parseInt(inp.value, 10);
          if (curVal !== pkg.stock) {
            inp.value = pkg.stock;
            inp.style.transition = 'all 0.5s ease';
            inp.style.backgroundColor = 'rgba(16, 185, 129, 0.3)';
            setTimeout(() => { inp.style.backgroundColor = ''; }, 1200);
          }
        }
      }
      const rowInp = row ? row.querySelector('.pkg-stock-inp') : null;
      if (!rowInp || (rowInp.dataset.dirty !== 'true' && document.activeElement !== rowInp)) {
        if (AdminState.botConfig.packages && AdminState.botConfig.packages[idx]) {
          AdminState.botConfig.packages[idx].stock = pkg.stock;
        }
      }
    });
  }

  function addNewPackageRow() {
    const pkgs = AdminState.botConfig.packages || [];
    const nextQty = pkgs.length > 0 ? (pkgs[pkgs.length - 1].qty_num * 2) : 2;
    pkgs.push({
      key: `buy_${nextQty}`,
      qty_num: nextQty,
      label_ru: `${nextQty} штук`,
      price_usd: nextQty * 12,
      stock: 20,
      active: true
    });
    AdminState.botConfig.packages = pkgs;
    renderBotCatalogTab();
    scheduleCatalogAutoPush(200);
    showToast('Добавлена новая строка фасовки. Сохранение в бот...', 'info');
  }

  function deletePackageRow(idx) {
    const pkgs = AdminState.botConfig.packages || [];
    if (pkgs.length <= 1) {
      showToast('Должна остаться хотя бы одна активная фасовка!', 'error');
      return;
    }
    pkgs.splice(idx, 1);
    AdminState.botConfig.packages = pkgs;
    renderBotCatalogTab();
    scheduleCatalogAutoPush(200);
    showToast('Позиция удалена из списка и сохранена в боте.', 'info');
  }

  function addNewDistrictRow() {
    const dists = AdminState.botConfig.districts || [];
    dists.push({
      id: `district_${Date.now().toString().slice(-4)}`,
      name: 'Новый Район',
      coords: '41.2985, 69.3241',
      active: true
    });
    AdminState.botConfig.districts = dists;
    renderBotCatalogTab();
    scheduleCatalogAutoPush(200);
    showToast('Добавлен новый район и синхронизирован с ботом.', 'info');
  }

  function deleteDistrictRow(idx) {
    const dists = AdminState.botConfig.districts || [];
    if (dists.length <= 1) {
      showToast('Должен остаться хотя бы один активный район!', 'error');
      return;
    }
    dists.splice(idx, 1);
    AdminState.botConfig.districts = dists;
    renderBotCatalogTab();
    scheduleCatalogAutoPush(200);
    showToast('Район удален из списка и синхронизирован с ботом.', 'info');
  }

  /**
   * DEBOUNCED LIVE CLOUD AUTO-SYNC ENGINE
   */
  let catalogAutoSaveTimer = null;

  function setCatalogSaveBadge(state) {
    const badge = document.getElementById('catalogLiveStatusBadge');
    if (!badge) return;
    if (state === 'saving') {
      badge.style.display = 'inline-flex';
      badge.style.background = 'rgba(245, 158, 11, 0.15)';
      badge.style.color = '#f59e0b';
      badge.style.borderColor = 'rgba(245, 158, 11, 0.3)';
      badge.style.opacity = '1';
      badge.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Сохранение в бот...';
    } else if (state === 'saved') {
      badge.style.display = 'inline-flex';
      badge.style.background = 'rgba(16, 185, 129, 0.15)';
      badge.style.color = '#10b981';
      badge.style.borderColor = 'rgba(16, 185, 129, 0.3)';
      badge.style.opacity = '1';
      badge.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Синхронизировано с Neon DB';
    } else if (state === 'offline') {
      badge.style.display = 'inline-flex';
      badge.style.background = 'rgba(239, 68, 68, 0.15)';
      badge.style.color = '#ef4444';
      badge.style.borderColor = 'rgba(239, 68, 68, 0.3)';
      badge.style.opacity = '1';
      badge.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Сохранено в кэше';
    }
    badge.dataset.state = state;
  }

  function scheduleCatalogAutoPush(delayMs = 600) {
    setCatalogSaveBadge('saving');
    if (catalogAutoSaveTimer) clearTimeout(catalogAutoSaveTimer);
    catalogAutoSaveTimer = setTimeout(async () => {
      await pushBotConfigToAPISilent();
    }, delayMs);
  }

  function collectBotCatalogFromDOM() {
    const prodNameInp = document.getElementById('cfgBotProductName');
    if (prodNameInp) {
      AdminState.botConfig.product_name = prodNameInp.value.trim() || 'Рега';
    }

    const pkgRows = document.querySelectorAll('#botPackagesTableBody tr');
    const updatedPkgs = [];
    const updatedStocks = {};

    pkgRows.forEach(row => {
      const key = row.querySelector('.pkg-key-inp')?.value.trim() || 'buy_item';
      const qty = parseInt(row.querySelector('.pkg-qty-inp')?.value, 10) || 2;
      const lbl = row.querySelector('.pkg-lbl-inp')?.value.trim() || `${qty} штук`;
      const price = parseFloat(row.querySelector('.pkg-price-inp')?.value) || 25;
      const stock = parseInt(row.querySelector('.pkg-stock-inp')?.value, 10) || 0;
      const active = row.querySelector('.pkg-active-inp')?.checked !== false;

      updatedPkgs.push({
        key,
        qty_num: qty,
        label_ru: lbl,
        label_en: `${qty} pcs`,
        label_uz: `${qty} ta`,
        price_usd: price,
        stock,
        active
      });
      updatedStocks[key] = stock;
    });

    if (updatedPkgs.length > 0) {
      AdminState.botConfig.packages = updatedPkgs;
      AdminState.stock = updatedStocks;
    }

    const distRows = document.querySelectorAll('#botDistrictsTableBody tr');
    const updatedDists = [];

    distRows.forEach(row => {
      const id = row.querySelector('.dist-id-inp')?.value.trim() || 'dist';
      const name = row.querySelector('.dist-name-inp')?.value.trim() || 'Район';
      const coords = row.querySelector('.dist-coords-inp')?.value.trim() || '41.2721, 69.2045';
      const active = row.querySelector('.dist-active-inp')?.checked !== false;

      updatedDists.push({ id, name, coords, active });
    });

    if (updatedDists.length > 0) {
      AdminState.botConfig.districts = updatedDists;
    }

    const botUserInp = document.getElementById('adminBotUsername');
    const botSupInp = document.getElementById('cfgBotSupportHandle') || document.getElementById('adminOperatorHandle');
    const ltcInp = document.getElementById('cfgBotLtcWallet') || document.getElementById('adminBotLtcAddress');
    const ex1Inp = document.getElementById('cfgBotExchanger1') || document.getElementById('adminBotExchanger1');
    const ex2Inp = document.getElementById('cfgBotExchanger2') || document.getElementById('adminBotExchanger2');
    const maintToggle = document.getElementById('cfgBotMaintenanceToggle') || document.getElementById('adminBotMaintenanceToggle');
    const maintText = document.getElementById('cfgBotMaintenanceText') || document.getElementById('adminBotMaintenanceText');

    if (botUserInp) AdminState.botConfig.username = botUserInp.value.trim() || '@yuan_rndiBOT';
    if (botSupInp) AdminState.botConfig.support_handle = botSupInp.value.trim() || '@ashley_graves3';
    if (ltcInp) AdminState.botConfig.ltc_address = ltcInp.value.trim() || 'ltc1qr5xhqe9tdd5lekrxurfftdv9hhaaqche2urvhr';
    if (ex1Inp) AdminState.botConfig.exchanger_1_url = ex1Inp.value.trim() || 'https://t.me/Eva_obmen';
    if (ex2Inp) AdminState.botConfig.exchanger_2_url = ex2Inp.value.trim() || 'https://t.me/sum_exc';
    if (maintToggle) AdminState.botConfig.maintenance_mode = maintToggle.checked;
    if (maintText) AdminState.botConfig.maintenance_text = maintText.value.trim();

    saveBotConfigLocally();
  }

  async function pushBotConfigToAPISilent() {
    collectBotCatalogFromDOM();
    const apiUrl = (AdminState.botApiUrl || detectDefaultApiUrl()).replace(/\/+$/, '');
    try {
      const resp = await fetch(`${apiUrl}/api/config`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(AdminState.botConfig)
      });
      if (resp.ok) {
        document.querySelectorAll('#botPackagesTable input, #botDistrictsTable input').forEach(el => {
          el.dataset.dirty = 'false';
        });
        setCatalogSaveBadge('saved');
        return true;
      }
      setCatalogSaveBadge('offline');
      return false;
    } catch (e) {
      console.warn('Silent config sync failed:', e.message);
      setCatalogSaveBadge('offline');
      return false;
    }
  }

  /**
   * PUSH COMPLETE CONFIG TO RUNNING TELEGRAM BOT VIA REST API (MANUAL)
   */
  async function pushBotConfigToAPI() {
    collectBotCatalogFromDOM();
    renderTelegramTab();
    renderBotCatalogTab();
    renderOrdersTable();

    const apiUrl = (AdminState.botApiUrl || detectDefaultApiUrl()).replace(/\/+$/, '');
    try {
      showToast('Отправка обновлений в Telegram бот (dragonx.onrender.com)...', 'info');
      const resp = await fetch(`${apiUrl}/api/config`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(AdminState.botConfig)
      });

      if (resp.ok) {
        document.querySelectorAll('#botPackagesTable input, #botDistrictsTable input').forEach(el => {
          el.dataset.dirty = 'false';
        });
        setCatalogSaveBadge('saved');
        showToast(`🚀 Все изменения успешно отправлены и применены в боте ${AdminState.botConfig.username || '@yuan_rndiBOT'}!`, 'success');
        return true;
      }
      throw new Error(`Bot returned status ${resp.status}`);
    } catch (e) {
      console.warn('Bot config API push failed:', e.message);
      setCatalogSaveBadge('offline');
      showToast('Настройки сохранены локально. Проверьте соединение с bot API.', 'info');
      return false;
    }
  }

  /**
   * MASS BROADCAST CONSOLE
   */
  async function sendBroadcastMessage() {
    const textInp = document.getElementById('cfgBroadcastMessageInput') || document.getElementById('broadcastMessageInput');
    const text = textInp ? textInp.value.trim() : '';

    if (!text) {
      showToast('Введите текст рассылки для клиентов!', 'error');
      return;
    }

    if (!confirm('Вы уверены, что хотите отправить это сообщение ВСЕМ клиентам в боте?')) {
      return;
    }

    const apiUrl = (AdminState.botApiUrl || detectDefaultApiUrl()).replace(/\/+$/, '');
    try {
      showToast('Отправка рассылки клиентам...', 'info');
      const resp = await fetch(`${apiUrl}/api/broadcast`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ message: text })
      });

      if (resp.ok) {
        const data = await resp.json();
        showToast(`📢 Рассылка доставлена ${data.sent_count || 0} клиентам в боте!`, 'success');
        textInp.value = '';
        const other = document.getElementById('broadcastMessageInput');
        if (other) other.value = '';
        const other2 = document.getElementById('cfgBroadcastMessageInput');
        if (other2) other2.value = '';
      } else {
        showToast('Ошибка отправки рассылки ботом.', 'error');
      }
    } catch (e) {
      showToast('Не удалось связаться с API бота для рассылки.', 'error');
    }
  }

  function switchToTab(tabId) {
    if (!tabId) return;
    document.querySelectorAll('.adm-tab-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tabId);
    });
    document.querySelectorAll('.admin-tab-pane').forEach(p => {
      const isTarget = p.id === tabId;
      p.classList.toggle('active', isTarget);
      p.classList.toggle('hidden', !isTarget);
      p.style.display = isTarget ? 'block' : 'none';
    });
    AdminState.activeTab = tabId;

    if (tabId === 'tabPrices') renderBotCatalogTab();
    if (tabId === 'tabTelegram') renderTelegramTab();
    if (tabId === 'tabOrders') renderOrdersTable();
    if (tabId === 'tabClients') renderClientsTable();
    if (tabId === 'tabLocations') renderZonesList();

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // =========================================================================
  // 6. TRACK LOCATION & PICKUP STASH CONSOLE MODAL
  // =========================================================================
  function trackLocation(orderId) {
    const ord = AdminState.orders.find(o => o.id === orderId);
    if (!ord) {
      showToast(`Заказ ${orderId} не найден!`, 'error');
      return;
    }

    AdminState.activeTrackingOrderId = orderId;
    const modal = document.getElementById('orderLocationModal');
    if (!modal) return;

    document.getElementById('locModalOrderId').value = ord.id;
    document.getElementById('locModalOrderNumber').textContent = ord.id;
    document.getElementById('locModalStatusBadge').className = `ord-status ${getStatusBadgeClass(ord.status)}`;
    document.getElementById('locModalStatusBadge').textContent = getStatusText(ord.status);

    const prodName = AdminState.botConfig.product_name || 'Рега';
    const clientSummary = `Клиент: ${ord.telegram || ord.customerName || 'Аноним'} • Товар: ${prodName} (${ord.volume || '2 шт'}) — ${(parseFloat(ord.totalAmount) || 0).toFixed(2)}$`;
    document.getElementById('locModalClientSummary').textContent = clientSummary;

    updateStepperView(ord.status);

    const pickupBanner = document.getElementById('locModalPickupBanner');
    if (pickupBanner) {
      if (ord.status === 'picked_up') {
        pickupBanner.innerHTML = `
          <div class="banner-text">
            <strong><i class="fa-solid fa-circle-check" style="color: #34d399;"></i> Заказ уже успешно получен клиентом!</strong>
            <p>Статус зафиксирован: Picked Up. Координаты дропа закрыты.</p>
          </div>
          <span class="status-pill status-picked-up" style="padding: 0.6rem 1.2rem; font-size: 0.9rem;">
            <i class="fa-solid fa-box-archive"></i> Завершен
          </span>
        `;
      } else {
        pickupBanner.innerHTML = `
          <div class="banner-text">
            <strong><i class="fa-solid fa-circle-check" style="color: #34d399;"></i> Подтверждение получения заказа:</strong>
            <p>Клиент уже забрал дроп/заказ? Нажмите кнопку ниже, чтобы зафиксировать статус «Забран (Picked Up)» в боте и в системе.</p>
          </div>
          <button type="button" id="locModalMarkPickedUpBtn" class="btn-primary glow-btn btn-picked-up" onclick="window.AdminOps.markOrderPickedUp('${ord.id}')">
            <i class="fa-solid fa-check-double"></i>
            <span>Отметить: Заказ Забран (Picked Up)</span>
          </button>
        `;
      }
    }

    const district = ord.district || 'Чиланзор';
    const coords = ord.coordinates || DISTRICT_COORDS[district] || '41.2721, 69.2045';
    updateRadarMapWidget(district, coords);

    const districtSelect = document.getElementById('locModalDistrict');
    if (districtSelect) districtSelect.value = district;

    const coordsInput = document.getElementById('locModalCoordsInput');
    if (coordsInput) coordsInput.value = coords;

    const addressInput = document.getElementById('locModalAddressInput');
    if (addressInput) addressInput.value = ord.deliveryLocation || '';

    const statusSelect = document.getElementById('locModalStatusSelect');
    if (statusSelect) statusSelect.value = ord.status || 'paid';

    const trackingInput = document.getElementById('locModalTrackingInput');
    if (trackingInput) trackingInput.value = ord.trackingCode || '';

    const notesInput = document.getElementById('locModalNotes');
    if (notesInput) notesInput.value = ord.notes || '';

    modal.classList.remove('hidden');
  }

  function updateStepperView(status) {
    const steps = [
      { id: 'step1', line: 'line1', activeFor: ['pending', 'paid', 'drop_ready', 'picked_up'] },
      { id: 'step2', line: 'line2', activeFor: ['paid', 'drop_ready', 'picked_up'] },
      { id: 'step3', line: 'line3', activeFor: ['drop_ready', 'picked_up'] },
      { id: 'step4', line: 'line4', activeFor: ['drop_ready', 'picked_up'] },
      { id: 'step5', line: null, activeFor: ['picked_up'] }
    ];

    const stepTextEl = document.getElementById('locModalStepText');
    if (stepTextEl) {
      if (status === 'picked_up') {
        stepTextEl.textContent = '5. Заказ Успешно Забран Клиентом (Picked Up)';
        stepTextEl.style.color = '#34d399';
      } else if (status === 'drop_ready') {
        stepTextEl.textContent = '3. Локация Выдана • Дроп Заложен (Готов к Выдаче)';
        stepTextEl.style.color = '#00f3ff';
      } else if (status === 'paid') {
        stepTextEl.textContent = '2. Оплачен в LTC • Курьер готовит локацию';
        stepTextEl.style.color = '#fbbf24';
      } else {
        stepTextEl.textContent = '1. Создан • Ожидает подтверждения LTC оплаты';
        stepTextEl.style.color = '#94a3b8';
      }
    }

    steps.forEach((s, idx) => {
      const stepEl = document.getElementById(s.id);
      const lineEl = s.line ? document.getElementById(s.line) : null;
      const isComplete = s.activeFor.includes(status);
      const isCurrent = (
        (status === 'pending' && idx === 0) ||
        (status === 'paid' && idx === 1) ||
        (status === 'drop_ready' && (idx === 2 || idx === 3)) ||
        (status === 'picked_up' && idx === 4)
      );

      if (stepEl) {
        stepEl.classList.remove('step-completed', 'step-active');
        if (isCurrent) {
          stepEl.classList.add('step-active');
        } else if (isComplete) {
          stepEl.classList.add('step-completed');
        }
      }

      if (lineEl) {
        lineEl.classList.remove('line-completed');
        if (isComplete && !isCurrent) {
          lineEl.classList.add('line-completed');
        }
      }
    });
  }

  function updateRadarMapWidget(district, coords) {
    const coordsPill = document.getElementById('locModalCoordsText');
    if (coordsPill) coordsPill.textContent = coords;

    const radarBadge = document.getElementById('radarDistrictBadge');
    if (radarBadge) radarBadge.textContent = district;

    const pinLabel = document.getElementById('radarPinLabel');
    if (pinLabel) pinLabel.textContent = `Ташкент • ${district}`;

    const parts = coords.split(',').map(p => p.trim());
    const lat = parts[0] || '41.2721';
    const lon = parts[1] || '69.2045';

    const gBtn = document.getElementById('openGoogleMapsBtn');
    if (gBtn) gBtn.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coords)}`;

    const yBtn = document.getElementById('openYandexMapsBtn');
    if (yBtn) yBtn.href = `https://yandex.com/maps/?ll=${lon},${lat}&z=16&text=${encodeURIComponent(coords)}`;

    const oBtn = document.getElementById('openOsmBtn');
    if (oBtn) oBtn.href = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`;
  }

  function getStatusBadgeClass(status) {
    switch (status) {
      case 'picked_up': return 'status-picked-up';
      case 'drop_ready': return 'status-drop-ready';
      case 'paid': return 'status-paid';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-new';
    }
  }

  function getStatusText(status) {
    switch (status) {
      case 'picked_up': return 'Забран (Picked Up)';
      case 'drop_ready': return 'Локация выдана';
      case 'paid': return 'Оплачен (LTC)';
      case 'cancelled': return 'Отменен';
      default: return 'Ожидает оплаты LTC';
    }
  }

  // =========================================================================
  // 7. 1-CLICK MARK AS PICKED UP
  // =========================================================================
  async function markOrderPickedUp(orderId) {
    const ord = AdminState.orders.find(o => o.id === orderId);
    if (!ord) return;

    ord.status = 'picked_up';
    ord.pickedUpAt = new Date().toISOString();
    saveOrdersLocally();
    renderAll();

    if (AdminState.activeTrackingOrderId === orderId) {
      trackLocation(orderId);
    }

    showToast(`Заказ ${orderId} отмечен как ЗАБРАН (Picked Up)!`, 'success');

    const apiUrl = (AdminState.botApiUrl || detectDefaultApiUrl()).replace(/\/+$/, '');
    try {
      const resp = await fetch(`${apiUrl}/api/orders/pickup`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          id: orderId,
          order_id: orderId,
          picked_up_at: Math.floor(Date.now() / 1000),
          notes: 'Отмечено оператором в панели управления'
        })
      });

      if (resp.ok) {
        showToast(`Бот ${AdminState.botConfig.username} синхронизировал статус заказа ${orderId}: Picked Up!`, 'success');
      }
    } catch (e) {
      console.warn('Bot pickup API offline, stored locally:', e.message);
    }
  }

  // =========================================================================
  // 8. SAVE LOCATION & ORDER DETAILS
  // =========================================================================
  async function saveLocationDetails(formData) {
    const { orderId, district, coords, address, status, tracking, notes, notifyCustomer } = formData;
    const ord = AdminState.orders.find(o => o.id === orderId);
    if (!ord) return;

    ord.district = district;
    ord.coordinates = coords;
    ord.deliveryLocation = address;
    ord.status = status;
    ord.trackingCode = tracking;
    ord.notes = notes;
    if (status === 'picked_up' && !ord.pickedUpAt) {
      ord.pickedUpAt = new Date().toISOString();
    }

    saveOrdersLocally();
    renderAll();
    closeAllModals();

    showToast(`Локация и координаты для заказа ${orderId} сохранены!`, 'success');

    const apiUrl = (AdminState.botApiUrl || detectDefaultApiUrl()).replace(/\/+$/, '');
    try {
      const resp = await fetch(`${apiUrl}/api/orders/update`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          id: orderId,
          order_id: orderId,
          status: status,
          district: district,
          coordinates: coords,
          delivery_location: address,
          notes: notes,
          notify_customer: notifyCustomer,
          notifyCustomer: notifyCustomer
        })
      });

      if (resp.ok) {
        showToast(`Синхронизировано с ботом в реальном времени! ${notifyCustomer ? 'Клиенту отправлено уведомление.' : ''}`, 'success');
      }
    } catch (e) {
      console.warn('Bot API update call failed:', e.message);
    }
  }

  function viewOrderDetails(orderId) {
    const ord = AdminState.orders.find(o => o.id === orderId);
    if (!ord) return;

    const modal = document.getElementById('orderDetailModal');
    if (!modal) return;

    document.getElementById('modalOrderNumber').textContent = ord.id;
    document.getElementById('modalOrderDate').textContent = new Date(ord.createdAt).toLocaleString('ru-RU');
    document.getElementById('modalCustomerId').textContent = ord.customerId || 'Гость (Без ID)';
    document.getElementById('modalCustomerName').textContent = ord.customerName || 'Анонимный клиент';

    const tgLink = document.getElementById('modalCustomerTg');
    if (tgLink) {
      tgLink.textContent = ord.telegram || 'Не указан';
      if (ord.telegram && ord.telegram.startsWith('@')) {
        tgLink.href = `https://t.me/${ord.telegram.replace('@', '')}`;
      } else {
        tgLink.removeAttribute('href');
      }
    }

    document.getElementById('modalOrderTotal').textContent = `${(parseFloat(ord.totalAmount) || 0).toFixed(2)} $`;

    const itemsContainer = document.getElementById('modalItemsList');
    if (itemsContainer) {
      const vol = ord.volume || '2 шт';
      const prodName = AdminState.botConfig.product_name || 'Рега';
      itemsContainer.innerHTML = `
        <div class="modal-item-row" style="display:flex; justify-content:space-between; padding:0.6rem 0; border-bottom:1px solid rgba(255,255,255,0.06);">
          <span>${escapeHtml(prodName)} (${escapeHtml(vol)}) • Район: <strong>${escapeHtml(ord.district || 'Чиланзор')}</strong></span>
          <span class="font-mono text-cyan">${(parseFloat(ord.totalAmount) || 0).toFixed(2)} $</span>
        </div>
        ${ord.cryptoAmount ? `
          <div class="modal-item-row" style="display:flex; justify-content:space-between; padding:0.4rem 0; font-size:0.8rem; color:var(--text-muted);">
            <span>Оплата через Litecoin (LTC):</span>
            <span class="font-mono text-gold">${ord.cryptoAmount} LTC</span>
          </div>
        ` : ''}
      `;
    }

    document.getElementById('modalEditOrderId').value = ord.id;
    document.getElementById('modalEditStatus').value = ord.status || 'paid';
    document.getElementById('modalEditDistrict').value = ord.district || 'Чиланзор';
    document.getElementById('modalEditCoordinates').value = ord.coordinates || DISTRICT_COORDS[ord.district] || '41.2721, 69.2045';
    document.getElementById('modalEditTracking').value = ord.trackingCode || '';
    document.getElementById('modalEditLocation').value = ord.deliveryLocation || '';
    document.getElementById('modalEditNotes').value = ord.notes || '';

    modal.classList.remove('hidden');
  }

  async function deleteOrder(orderId) {
    if (!orderId) return;
    if (!confirm(`Вы уверены, что хотите безвозвратно удалить заказ ${orderId} из базы данных и бота?`)) {
      return;
    }

    if (!AdminState.deletedOrderIds) AdminState.deletedOrderIds = new Set();
    AdminState.deletedOrderIds.add(orderId);
    saveDeletedOrderIdsLocally();

    AdminState.orders = AdminState.orders.filter(o => o.id !== orderId);
    saveOrdersLocally();
    renderAll();
    closeAllModals();
    showToast(`🗑️ Заказ ${orderId} удален. Синхронизация с сервером...`, 'info');

    const apiUrl = (AdminState.botApiUrl || detectDefaultApiUrl()).replace(/\/+$/, '');
    try {
      const resp = await fetch(`${apiUrl}/api/orders/delete`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ id: orderId, order_id: orderId })
      });
      if (resp.ok) {
        showToast(`✅ Заказ ${orderId} удален из бота и базы Neon DB!`, 'success');
      } else {
        showToast(`Заказ удален из панели управления.`, 'info');
      }
    } catch (e) {
      console.warn('API delete error:', e);
      showToast(`Заказ удален из панели управления.`, 'info');
    }
  }

  function createManualOrder(data) {
    const prodName = AdminState.botConfig.product_name || 'Рега';
    const newOrd = {
      id: 'DRGX-' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + Math.floor(1000 + Math.random() * 9000),
      createdAt: new Date().toISOString(),
      customerId: data.customerId.trim(),
      customerName: data.customerName.trim(),
      telegram: data.telegram.trim(),
      district: data.district,
      item: prodName,
      volume: data.packVolume,
      totalAmount: data.unitPrice,
      currency: 'USD',
      cryptoAmount: +(data.unitPrice / 65).toFixed(4),
      cryptoCurrency: 'LTC',
      status: 'paid',
      deliveryLocation: data.location.trim() || `${data.district}, координаты выдаются`,
      coordinates: DISTRICT_COORDS[data.district] || '41.2721, 69.2045',
      trackingCode: 'DRGX-TRK-' + Math.floor(1000 + Math.random() * 9000),
      notes: 'Создано вручную оператором'
    };

    AdminState.orders.unshift(newOrd);
    saveOrdersLocally();
    renderAll();
    closeAllModals();
    showToast(`Новый заказ ${newOrd.id} успешно создан!`, 'success');

    const apiUrl = (AdminState.botApiUrl || detectDefaultApiUrl()).replace(/\/+$/, '');
    fetch(`${apiUrl}/api/orders`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(newOrd)
    }).catch(() => {});
  }

  function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
    AdminState.activeTrackingOrderId = null;
  }

  // =========================================================================
  // 9. TOAST NOTIFICATIONS & UTILS
  // =========================================================================
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'fa-circle-info';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'error') icon = 'fa-triangle-exclamation';

    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${escapeHtml(message)}</span>`;
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
  // 10. EVENT LISTENERS
  // =========================================================================
  function setupEventListeners() {
    // 1. Admin Login Form
    const loginForm = document.getElementById('adminLoginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('adminLoginId').value;
        const pass = document.getElementById('adminLoginPassword').value;
        handleAdminLogin(id, pass);
      });
    }

    const togglePwdBtn = document.getElementById('toggleAdminPwdBtn');
    if (togglePwdBtn) {
      togglePwdBtn.addEventListener('click', () => {
        const inp = document.getElementById('adminLoginPassword');
        const isPwd = inp.type === 'password';
        inp.type = isPwd ? 'text' : 'password';
        togglePwdBtn.innerHTML = isPwd ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
      });
    }

    const logoutBtn = document.getElementById('adminLogoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', handleAdminLogout);

    const manualSyncBtn = document.getElementById('adminManualSyncBtn');
    if (manualSyncBtn) {
      manualSyncBtn.addEventListener('click', () => {
        syncWithBotAPI(false);
      });
    }

    // Tab Navigation
    document.querySelectorAll('.adm-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        if (targetTab) switchToTab(targetTab);
      });
    });

    // Orders Filter and Search
    const searchInp = document.getElementById('orderSearchInput');
    if (searchInp) {
      searchInp.addEventListener('input', (e) => {
        AdminState.searchQuery = e.target.value.trim();
        renderOrdersTable();
      });
    }

    const filterSelect = document.getElementById('orderStatusFilter');
    if (filterSelect) {
      filterSelect.addEventListener('change', (e) => {
        AdminState.statusFilter = e.target.value;
        renderOrdersTable();
      });
    }

    const refreshOrdersBtn = document.getElementById('refreshOrdersBtn');
    if (refreshOrdersBtn) {
      refreshOrdersBtn.addEventListener('click', () => {
        syncWithBotAPI(false);
      });
    }

    // Modal Close Buttons
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', closeAllModals);
    });

    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeAllModals();
      });
    });

    // Track Location Form Submit
    const trackLocationForm = document.getElementById('trackLocationForm');
    if (trackLocationForm) {
      trackLocationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const orderId = document.getElementById('locModalOrderId').value;
        const district = document.getElementById('locModalDistrict').value;
        const coords = document.getElementById('locModalCoordsInput').value.trim();
        const address = document.getElementById('locModalAddressInput').value.trim();
        const status = document.getElementById('locModalStatusSelect').value;
        const tracking = document.getElementById('locModalTrackingInput').value.trim();
        const notes = document.getElementById('locModalNotes').value.trim();
        const notifyCustomer = document.getElementById('locModalNotifyClient').checked;

        saveLocationDetails({
          orderId,
          district,
          coords,
          address,
          status,
          tracking,
          notes,
          notifyCustomer
        });
      });
    }

    // District Presets Buttons in Track Location Modal
    document.querySelectorAll('.btn-preset-district').forEach(btn => {
      btn.addEventListener('click', () => {
        const dist = btn.dataset.district;
        const coords = btn.dataset.coords;

        const distSelect = document.getElementById('locModalDistrict');
        const coordsInp = document.getElementById('locModalCoordsInput');

        if (distSelect) distSelect.value = dist;
        if (coordsInp) coordsInp.value = coords;

        updateRadarMapWidget(dist, coords);
        showToast(`Выбран район: ${dist} (${coords})`, 'info');
      });
    });

    const locModalDistrict = document.getElementById('locModalDistrict');
    if (locModalDistrict) {
      locModalDistrict.addEventListener('change', (e) => {
        const val = e.target.value;
        if (DISTRICT_COORDS[val]) {
          const coordsInp = document.getElementById('locModalCoordsInput');
          if (coordsInp) coordsInp.value = DISTRICT_COORDS[val];
          updateRadarMapWidget(val, DISTRICT_COORDS[val]);
        }
      });
    }

    const copyCoordsBtn = document.getElementById('copyCoordsBtn');
    if (copyCoordsBtn) {
      copyCoordsBtn.addEventListener('click', () => {
        const coordsText = document.getElementById('locModalCoordsText').textContent;
        navigator.clipboard.writeText(coordsText).then(() => {
          showToast(`Координаты GPS скопированы: ${coordsText}`, 'success');
        });
      });
    }

    // Update Full Order Form Submit
    const updateOrderForm = document.getElementById('updateOrderForm');
    if (updateOrderForm) {
      updateOrderForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const orderId = document.getElementById('modalEditOrderId').value;
        const status = document.getElementById('modalEditStatus').value;
        const district = document.getElementById('modalEditDistrict').value;
        const coords = document.getElementById('modalEditCoordinates').value.trim();
        const tracking = document.getElementById('modalEditTracking').value.trim();
        const location = document.getElementById('modalEditLocation').value.trim();
        const notes = document.getElementById('modalEditNotes').value.trim();
        const notify = document.getElementById('modalEditNotifyCustomer').checked;

        saveLocationDetails({
          orderId,
          district,
          coords,
          address: location,
          status,
          tracking,
          notes,
          notifyCustomer: notify
        });
      });
    }

    const delModalBtn = document.getElementById('deleteOrderFromModalBtn');
    if (delModalBtn) {
      delModalBtn.addEventListener('click', () => {
        const orderId = document.getElementById('modalEditOrderId')?.value;
        if (orderId) {
          deleteOrder(orderId);
        }
      });
    }

    // Manual New Order Modal Trigger
    const openNewOrdBtn = document.getElementById('openNewOrderModalBtn');
    if (openNewOrdBtn) {
      openNewOrdBtn.addEventListener('click', () => {
        const modal = document.getElementById('newOrderModal');
        if (modal) modal.classList.remove('hidden');
      });
    }

    // Manual Order Form Submit
    const manualOrderForm = document.getElementById('createManualOrderForm');
    if (manualOrderForm) {
      manualOrderForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const cId = document.getElementById('newOrderClientId').value;
        const cName = document.getElementById('newOrderClientName').value;
        const cTg = document.getElementById('newOrderClientTg').value;
        const dist = document.getElementById('newOrderDistrict').value;
        const packSelect = document.getElementById('newOrderPack');
        const packVolume = packSelect.value;
        const unitPrice = parseFloat(packSelect.selectedOptions[0]?.dataset?.price || 25);
        const loc = document.getElementById('newOrderLocation').value;

        createManualOrder({
          customerId: cId,
          customerName: cName,
          telegram: cTg,
          district: dist,
          packVolume: packVolume,
          unitPrice: unitPrice,
          location: loc
        });

        manualOrderForm.reset();
      });
    }

    // Add Delivery Zone Form
    const zoneForm = document.getElementById('addLocationZoneForm');
    if (zoneForm) {
      zoneForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const city = document.getElementById('zoneCityName').value;
        const area = document.getElementById('zoneAreaName').value;
        const coords = document.getElementById('zoneCoordinatesDefault').value;
        const notes = document.getElementById('zoneDeliveryNotes').value;

        const newZone = {
          id: 'zone-' + Date.now(),
          city: city.trim(),
          area: area.trim(),
          coordinates: coords.trim(),
          notes: notes.trim()
        };

        AdminState.zones.push(newZone);
        saveZonesLocally();
        renderZonesList();
        zoneForm.reset();
        showToast(`Район «${newZone.city}» успешно добавлен!`, 'success');
      });
    }

    // Maintenance Toggle Listener in Tab 3
    const maintToggle = document.getElementById('adminBotMaintenanceToggle');
    if (maintToggle) {
      maintToggle.addEventListener('change', (e) => {
        const grp = document.getElementById('maintenanceTextGroup');
        if (grp) grp.style.display = e.target.checked ? 'block' : 'none';
      });
    }

    // Telegram Bot Settings Form Submit
    const tgForm = document.getElementById('adminTgBotForm');
    if (tgForm) {
      tgForm.addEventListener('submit', (e) => {
        e.preventDefault();
        pushBotConfigToAPI();
      });
    }

    // Test Bot API Gateway Button
    const testBotApiBtn = document.getElementById('testBotApiBtn');
    if (testBotApiBtn) {
      testBotApiBtn.addEventListener('click', async () => {
        showToast('Проверка соединения со шлюзом бота...', 'info');
        const success = await syncWithBotAPI(false);
        if (success) {
          showToast('Тест API успешно пройден! Бот отвечает на запросы.', 'success');
        } else {
          showToast('Бот не ответил. Проверьте URL или запустите сервис Render.', 'error');
        }
      });
    }

    // Broadcast Button
    const broadcastBtn = document.getElementById('sendBroadcastBtn');
    if (broadcastBtn) {
      broadcastBtn.addEventListener('click', sendBroadcastMessage);
    }

    // Tab 5: Add New Package Row
    const addPkgBtn = document.getElementById('addNewPackageBtn');
    if (addPkgBtn) {
      addPkgBtn.addEventListener('click', addNewPackageRow);
    }

    // Tab 5: Add New District Row
    const addDistBtn = document.getElementById('addNewDistrictBtn');
    if (addDistBtn) {
      addDistBtn.addEventListener('click', addNewDistrictRow);
    }

    // Tab 5: Push Master Changes to Bot
    const saveCatalogBtn = document.getElementById('saveAllBotCatalogBtn');
    if (saveCatalogBtn) {
      saveCatalogBtn.addEventListener('click', pushBotConfigToAPI);
    }
    const saveCatalogTopBtn = document.getElementById('saveAllBotCatalogTopBtn');
    if (saveCatalogTopBtn) {
      saveCatalogTopBtn.addEventListener('click', pushBotConfigToAPI);
    }

    // Master Control Navigation Shortcuts
    const headerMasterBtn = document.getElementById('headerMasterBotBtn');
    if (headerMasterBtn) {
      headerMasterBtn.addEventListener('click', () => switchToTab('tabPrices'));
    }

    const bannerMasterBtn = document.getElementById('bannerOpenMasterBotBtn');
    if (bannerMasterBtn) {
      bannerMasterBtn.addEventListener('click', () => switchToTab('tabPrices'));
    }

    // Tab 5 Maintenance Toggle Listener
    const cfgMaintToggle = document.getElementById('cfgBotMaintenanceToggle');
    if (cfgMaintToggle) {
      cfgMaintToggle.addEventListener('change', (e) => {
        const grp = document.getElementById('cfgMaintenanceTextGroup');
        if (grp) grp.style.display = e.target.checked ? 'block' : 'none';
        const otherToggle = document.getElementById('adminBotMaintenanceToggle');
        if (otherToggle) otherToggle.checked = e.target.checked;
      });
    }

    // Tab 5 Broadcast Button
    const cfgBroadcastBtn = document.getElementById('cfgSendBroadcastBtn');
    if (cfgBroadcastBtn) {
      cfgBroadcastBtn.addEventListener('click', sendBroadcastMessage);
    }

    // Refresh Clients Button
    const refreshClientsBtn = document.getElementById('refreshClientsBtn');
    if (refreshClientsBtn) {
      refreshClientsBtn.addEventListener('click', () => {
        buildUsersFromOrders();
        renderClientsTable();
        showToast('База клиентов обновлена!', 'info');
      });
    }

    // Live Auto-Save Listeners for Tables & Fields (Prevents inputs reverting on scroll/blur)
    setupLiveInputListeners();
  }

  function setupLiveInputListeners() {
    const pkgTable = document.getElementById('botPackagesTable');
    if (pkgTable) {
      pkgTable.addEventListener('input', (e) => {
        const row = e.target.closest('tr');
        if (!row) return;
        const idx = parseInt(row.dataset.pkgIdx, 10);
        if (isNaN(idx) || !AdminState.botConfig.packages || !AdminState.botConfig.packages[idx]) return;

        // Mark dirty so polling never clobbers local user typing
        e.target.dataset.dirty = 'true';

        if (e.target.classList.contains('pkg-stock-inp')) {
          const val = parseInt(e.target.value, 10) || 0;
          AdminState.botConfig.packages[idx].stock = val;
          const k = AdminState.botConfig.packages[idx].key;
          if (k) AdminState.stock[k] = val;
        } else if (e.target.classList.contains('pkg-price-inp')) {
          AdminState.botConfig.packages[idx].price_usd = parseFloat(e.target.value) || 0;
        } else if (e.target.classList.contains('pkg-qty-inp')) {
          AdminState.botConfig.packages[idx].qty_num = parseInt(e.target.value, 10) || 0;
        } else if (e.target.classList.contains('pkg-lbl-inp')) {
          AdminState.botConfig.packages[idx].label_ru = e.target.value;
        } else if (e.target.classList.contains('pkg-key-inp')) {
          AdminState.botConfig.packages[idx].key = e.target.value;
        }
        saveBotConfigLocally();
        scheduleCatalogAutoPush(600);
      });

      pkgTable.addEventListener('change', (e) => {
        const row = e.target.closest('tr');
        if (!row) return;
        const idx = parseInt(row.dataset.pkgIdx, 10);
        if (isNaN(idx) || !AdminState.botConfig.packages || !AdminState.botConfig.packages[idx]) return;

        e.target.dataset.dirty = 'true';

        if (e.target.classList.contains('pkg-active-inp')) {
          AdminState.botConfig.packages[idx].active = e.target.checked;
        } else if (e.target.classList.contains('pkg-stock-inp')) {
          const val = parseInt(e.target.value, 10) || 0;
          AdminState.botConfig.packages[idx].stock = val;
          const k = AdminState.botConfig.packages[idx].key;
          if (k) AdminState.stock[k] = val;
        }
        saveBotConfigLocally();
        // Immediately sync on change / blur / step
        scheduleCatalogAutoPush(50);
      });
    }

    const distTable = document.getElementById('botDistrictsTable');
    if (distTable) {
      distTable.addEventListener('input', (e) => {
        const row = e.target.closest('tr');
        if (!row) return;
        const idx = parseInt(row.dataset.distIdx, 10);
        if (isNaN(idx) || !AdminState.botConfig.districts || !AdminState.botConfig.districts[idx]) return;

        e.target.dataset.dirty = 'true';

        if (e.target.classList.contains('dist-name-inp')) {
          AdminState.botConfig.districts[idx].name = e.target.value;
        } else if (e.target.classList.contains('dist-coords-inp')) {
          AdminState.botConfig.districts[idx].coords = e.target.value;
        } else if (e.target.classList.contains('dist-id-inp')) {
          AdminState.botConfig.districts[idx].id = e.target.value;
        }
        saveBotConfigLocally();
        scheduleCatalogAutoPush(600);
      });

      distTable.addEventListener('change', (e) => {
        const row = e.target.closest('tr');
        if (!row) return;
        const idx = parseInt(row.dataset.distIdx, 10);
        if (isNaN(idx) || !AdminState.botConfig.districts || !AdminState.botConfig.districts[idx]) return;

        e.target.dataset.dirty = 'true';

        if (e.target.classList.contains('dist-active-inp')) {
          AdminState.botConfig.districts[idx].active = e.target.checked;
          saveBotConfigLocally();
          scheduleCatalogAutoPush(50);
        }
      });
    }

    const liveInputs = [
      { id: 'cfgBotProductName', key: 'product_name' },
      { id: 'cfgBotLtcWallet', key: 'ltc_address' },
      { id: 'cfgBotExchanger1', key: 'exchanger_1_url' },
      { id: 'cfgBotExchanger2', key: 'exchanger_2_url' },
      { id: 'cfgBotSupportHandle', key: 'support_handle' },
      { id: 'cfgBotMaintenanceText', key: 'maintenance_text' }
    ];

    liveInputs.forEach(({ id, key }) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', (e) => {
          e.target.dataset.dirty = 'true';
          AdminState.botConfig[key] = e.target.value.trim();
          saveBotConfigLocally();
          scheduleCatalogAutoPush(600);
        });
        el.addEventListener('change', () => {
          scheduleCatalogAutoPush(50);
        });
      }
    });
  }

  // =========================================================================
  // 11. PUBLIC API FOR INLINE ACTIONS
  // =========================================================================
  window.AdminOps = {
    trackLocation,
    markOrderPickedUp,
    viewOrderDetails,
    deleteOrder,
    addNewPackageRow,
    deletePackageRow,
    addNewDistrictRow,
    deleteDistrictRow,
    pushBotConfigToAPI,
    pushBotConfigToAPISilent,
    quickTgContact: function (tgHandle, orderId) {
      if (tgHandle && tgHandle.startsWith('@')) {
        const clean = tgHandle.replace('@', '');
        window.open(`https://t.me/${clean}`, '_blank');
      } else {
        showToast(`У клиента не указан прямой ник Telegram для заказа ${orderId}`, 'info');
      }
    },
    deleteZone: function (zoneId) {
      AdminState.zones = AdminState.zones.filter(z => z.id !== zoneId);
      saveZonesLocally();
      renderZonesList();
      showToast('Район доставки удален.', 'info');
    },
    copyClientId: function (clientId) {
      navigator.clipboard.writeText(clientId).then(() => {
        showToast(`Unique ID ${clientId} скопирован в буфер!`, 'success');
      });
    }
  };

  // Initialization
  document.addEventListener('DOMContentLoaded', () => {
    // Explicitly clear login inputs on load to prevent auto-fill exposure
    const idInp = document.getElementById('adminLoginId');
    if (idInp) idInp.value = '';
    const passInp = document.getElementById('adminLoginPassword');
    if (passInp) passInp.value = '';

    checkAdminSession();
    setupEventListeners();
  });

})();
