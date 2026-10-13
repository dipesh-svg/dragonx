/**
 * DRAGON-X PHARMA - OPERATOR DISPATCH & TRACKING CONSOLE
 * Secure Admin Gateway: ID = damascus@123 | PASS = vegadragon24
 * Real-time Telegram Bot API Synchronization • GPS Tracking • Order Pickup Console
 */

(function () {
  'use strict';

  // Hardcoded Secure Operator Credentials
  const ADMIN_CREDENTIALS = {
    id: 'damascus@123',
    password: 'vegadragon24'
  };

  const STORAGE_KEYS = {
    ADMIN_SESSION: 'dragonx_admin_session_v1',
    ORDERS: 'dragonx_orders_db_v2',
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

  // Realistic Seed Orders for Tashkent (Product: Рега, Currency: USD & LTC)
  const SEED_ORDERS = [
    {
      id: 'DRGX-20261013-4821',
      createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
      customerId: 'DRGX-8841-UZB',
      customerName: 'Тимур (VIP Client)',
      telegram: '@timur_tashkent',
      district: 'Чиланзор',
      item: 'Рега',
      volume: '2 шт',
      totalAmount: 25.00,
      currency: 'USD',
      cryptoAmount: 0.38,
      cryptoCurrency: 'LTC',
      status: 'picked_up',
      deliveryLocation: 'Чиланзор, кв-л 9, дом 14 (Магнит за кондиционером)',
      coordinates: '41.2721, 69.2045',
      trackingCode: 'DRGX-TRK-4821',
      pickedUpAt: new Date(Date.now() - 1800000).toISOString(),
      notes: 'Клиент забрал заказ без задержек. Все чисто.'
    },
    {
      id: 'DRGX-20261013-7914',
      createdAt: new Date(Date.now() - 3600000 * 3.2).toISOString(),
      customerId: 'DRGX-5519-KX8',
      customerName: 'Сардор К.',
      telegram: '@sardor_pharma',
      district: 'Яшнабад',
      item: 'Рега',
      volume: '5 шт',
      totalAmount: 55.00,
      currency: 'USD',
      cryptoAmount: 0.84,
      cryptoCurrency: 'LTC',
      status: 'drop_ready',
      deliveryLocation: 'Яшнабад, ул. Карасу, тайник в ограждении аллеи №3',
      coordinates: '41.2985, 69.3241',
      trackingCode: 'DRGX-TRK-7914',
      notes: 'Дроп заложен курьером в 14:15. Фото и GPS выданы клиенту.'
    },
    {
      id: 'DRGX-20261013-9102',
      createdAt: new Date(Date.now() - 3600000 * 5.8).toISOString(),
      customerId: 'DRGX-9024-VIP',
      customerName: 'Алексей Д.',
      telegram: '@alex_operator_vip',
      district: 'Ulugbek',
      item: 'Рега',
      volume: '10 шт',
      totalAmount: 108.00,
      currency: 'USD',
      cryptoAmount: 1.65,
      cryptoCurrency: 'LTC',
      status: 'paid',
      deliveryLocation: 'Ulugbek, сектор Б, готовится курьерская закладка',
      coordinates: '41.3412, 69.4520',
      trackingCode: 'DRGX-TRK-9102',
      notes: 'Оплата LTC подтверждена в сети. Курьер выехал на район.'
    },
    {
      id: 'DRGX-20261013-1153',
      createdAt: new Date(Date.now() - 3600000 * 8.4).toISOString(),
      customerId: 'DRGX-1204-MN2',
      customerName: 'Анонимный клиент',
      telegram: '@phantom_uzb',
      district: 'Чиланзор',
      item: 'Рега',
      volume: '3 шт',
      totalAmount: 35.00,
      currency: 'USD',
      cryptoAmount: 0.54,
      cryptoCurrency: 'LTC',
      status: 'pending',
      deliveryLocation: 'Чиланзор (локация формируется после оплаты)',
      coordinates: '41.2721, 69.2045',
      trackingCode: 'DRGX-TRK-1153',
      notes: 'Ожидается перевод на LTC адрес кошелька.'
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

  // Default Stock Quantities
  const DEFAULT_STOCK = {
    '2': 45,
    '3': 38,
    '5': 24,
    '10': 18,
    '20': 12,
    '50': 10,
    '100': 5
  };

  // Admin App State
  const AdminState = {
    isAuthenticated: false,
    activeTab: 'tabOrders',
    orders: [],
    zones: [],
    users: [],
    stock: { ...DEFAULT_STOCK },
    botApiUrl: 'https://dragon-x-telegram-bot.onrender.com',
    isApiOnline: false,
    lastSyncTime: null,
    syncIntervalId: null,
    botConfig: {
      username: '@yuan_rndiBOT',
      token: '',
      chatId: '',
      support: '@ashley_graves3'
    },
    searchQuery: '',
    statusFilter: 'all',
    activeTrackingOrderId: null
  };

  // Determine Default Bot API Gateway URL
  function detectDefaultApiUrl() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:10000';
    }
    return 'https://dragon-x-telegram-bot.onrender.com';
  }

  // =========================================================================
  // 1. AUTHENTICATION & LOGIN GATE
  // =========================================================================
  function checkAdminSession() {
    const session = sessionStorage.getItem(STORAGE_KEYS.ADMIN_SESSION);
    if (session === 'authenticated') {
      AdminState.isAuthenticated = true;
      unlockDashboard();
    } else {
      lockDashboard();
    }
  }

  function handleAdminLogin(id, password) {
    const cleanId = id.trim();
    const cleanPass = password.trim();

    if (cleanId === ADMIN_CREDENTIALS.id && cleanPass === ADMIN_CREDENTIALS.password) {
      sessionStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, 'authenticated');
      AdminState.isAuthenticated = true;
      unlockDashboard();
      showToast('Авторизация успешна. Добро пожаловать в Диспетчерскую DRAGON-X!', 'success');
      return true;
    } else {
      const errEl = document.getElementById('adminLoginError');
      if (errEl) errEl.classList.remove('hidden');
      const passInp = document.getElementById('adminLoginPassword');
      if (passInp) passInp.value = '';
      showToast('Ошибка доступа: неверный ID или пароль!', 'error');
      return false;
    }
  }

  function handleAdminLogout() {
    sessionStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
    AdminState.isAuthenticated = false;
    if (AdminState.syncIntervalId) {
      clearInterval(AdminState.syncIntervalId);
      AdminState.syncIntervalId = null;
    }
    lockDashboard();
    showToast('Сессия оператора завершена.', 'info');
  }

  function unlockDashboard() {
    const gate = document.getElementById('adminAuthGate');
    const dash = document.getElementById('adminDashboard');
    if (gate) gate.classList.add('logged-in');
    if (dash) dash.classList.remove('hidden');

    loadData();
    renderAll();

    // Start Real-time synchronization
    startAutoSync();
  }

  function lockDashboard() {
    const gate = document.getElementById('adminAuthGate');
    const dash = document.getElementById('adminDashboard');
    if (gate) gate.classList.remove('logged-in');
    if (dash) dash.classList.add('hidden');
  }

  // =========================================================================
  // 2. DATA MANAGEMENT & REAL-TIME BOT SYNCHRONIZATION
  // =========================================================================
  function loadData() {
    // 1. Bot Config & API Gateway URL
    try {
      const savedBot = localStorage.getItem(STORAGE_KEYS.BOT_CONFIG);
      if (savedBot) {
        const parsed = JSON.parse(savedBot);
        AdminState.botConfig = Object.assign(AdminState.botConfig, parsed);
        if (parsed.apiUrl) AdminState.botApiUrl = parsed.apiUrl;
      } else {
        AdminState.botApiUrl = detectDefaultApiUrl();
      }
    } catch (e) {
      AdminState.botApiUrl = detectDefaultApiUrl();
    }

    // 2. Orders Local Storage
    try {
      const savedOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (savedOrders) {
        AdminState.orders = JSON.parse(savedOrders);
      } else {
        AdminState.orders = [...SEED_ORDERS];
        saveOrdersLocally();
      }
    } catch (e) {
      AdminState.orders = [...SEED_ORDERS];
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

    // 4. Stock Local Storage
    try {
      const savedStock = localStorage.getItem(STORAGE_KEYS.STOCK_CONFIG);
      if (savedStock) {
        AdminState.stock = Object.assign({ ...DEFAULT_STOCK }, JSON.parse(savedStock));
      }
    } catch (e) {
      AdminState.stock = { ...DEFAULT_STOCK };
    }

    // 5. Users List
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

  function saveOrdersLocally() {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(AdminState.orders));
  }

  function saveZonesLocally() {
    localStorage.setItem(STORAGE_KEYS.DELIVERY_ZONES, JSON.stringify(AdminState.zones));
  }

  function saveStockLocally() {
    localStorage.setItem(STORAGE_KEYS.STOCK_CONFIG, JSON.stringify(AdminState.stock));
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

  /**
   * Real-time Bot REST API Synchronization
   */
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
      // 1. Fetch Orders from Bot
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const resp = await fetch(`${apiUrl}/api/orders`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const elapsed = Math.round(performance.now() - startTime);

      if (resp.ok) {
        const data = await resp.json();
        if (data && data.success && Array.isArray(data.orders)) {
          // Merge Bot orders with local orders (preserving any local un-synced)
          mergeBotOrders(data.orders);
          AdminState.isApiOnline = true;
          AdminState.lastSyncTime = new Date();

          // Update Stock if available
          if (data.stock) {
            AdminState.stock = Object.assign(AdminState.stock, data.stock);
            saveStockLocally();
            populateStockInputs();
          }

          // Update UI Status Indicators
          if (syncPill) {
            syncPill.className = 'status-pill status-sync online';
          }
          if (syncLabel) {
            syncLabel.textContent = `🟢 Бот API: ОНЛАЙН (${elapsed}ms)`;
          }
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

          if (!silent) {
            showToast(`Синхронизация успешна! Получено ${data.orders.length} заказов из бота (${elapsed}ms).`, 'success');
          }
          return true;
        }
      }
      throw new Error(`API returned status ${resp.status}`);
    } catch (err) {
      console.warn('Bot API Sync fallback to local DB:', err.message);
      AdminState.isApiOnline = false;

      if (syncPill) {
        syncPill.className = 'status-pill status-sync offline';
      }
      if (syncLabel) {
        syncLabel.textContent = `🟡 Автономно (Локальный кэш)`;
      }
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

    const botMap = new Map();
    botOrders.forEach(bo => {
      // Normalize bot order schema
      const normalized = {
        id: bo.id || bo.order_id,
        createdAt: bo.createdAt || (bo.created_at ? new Date(bo.created_at * 1000).toISOString() : new Date().toISOString()),
        customerId: bo.customerId || bo.customer_id || (bo.user_id ? `TG-${bo.user_id}` : 'DRGX-TG-USER'),
        customerName: bo.customerName || bo.customer_name || 'Покупатель Telegram',
        telegram: bo.telegram || (bo.username ? `@${bo.username.replace('@','')}` : ''),
        district: bo.district || 'Чиланзор',
        item: bo.item || 'Рега',
        volume: bo.volume || `${bo.quantity || 2} шт`,
        totalAmount: parseFloat(bo.totalAmount || bo.price_usd || 25),
        currency: 'USD',
        cryptoAmount: parseFloat(bo.cryptoAmount || bo.ltc_amount || 0),
        cryptoCurrency: 'LTC',
        status: bo.status || 'paid',
        deliveryLocation: bo.deliveryLocation || bo.location || 'Локация выдается в боте',
        coordinates: bo.coordinates || DISTRICT_COORDS[bo.district] || '41.2721, 69.2045',
        trackingCode: bo.trackingCode || bo.tracking_code || `DRGX-TRK-${(bo.id||'').slice(-4)}`,
        pickedUpAt: bo.pickedUpAt || (bo.picked_up_at ? new Date(bo.picked_up_at * 1000).toISOString() : null),
        notes: bo.notes || ''
      };
      botMap.set(normalized.id, normalized);
    });

    // Merge into local list (preserving orders created locally that might not yet be in bot)
    const merged = [];
    const processedIds = new Set();

    // 1. Bot orders take precedence as source of truth
    botMap.forEach((botOrder, id) => {
      merged.push(botOrder);
      processedIds.add(id);
    });

    // 2. Keep local orders that don't collide
    AdminState.orders.forEach(lo => {
      if (!processedIds.has(lo.id)) {
        merged.push(lo);
        processedIds.add(lo.id);
      }
    });

    AdminState.orders = merged;
    saveOrdersLocally();
  }

  function startAutoSync() {
    if (AdminState.syncIntervalId) clearInterval(AdminState.syncIntervalId);
    // Initial sync
    syncWithBotAPI(true);
    // Poll every 8 seconds
    AdminState.syncIntervalId = setInterval(() => {
      syncWithBotAPI(true);
    }, 8000);
  }

  // =========================================================================
  // 3. RENDERING ENGINE
  // =========================================================================
  function renderAll() {
    renderMetrics();
    renderOrdersTable();
    renderZonesList();
    renderTelegramTab();
    renderClientsTable();
    populateStockInputs();
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
      // Status filter
      if (AdminState.statusFilter !== 'all' && order.status !== AdminState.statusFilter) {
        return false;
      }
      // Search query
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

    tbody.innerHTML = filtered.map(ord => {
      const dateStr = new Date(ord.createdAt).toLocaleDateString('ru-RU', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
      });

      const volumeSummary = ord.volume ? `Рега (${ord.volume})` : 'Рега (2 шт)';
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
    const apiUrlInp = document.getElementById('adminBotApiUrl');
    const botUserInp = document.getElementById('adminBotUsername');
    const botTokenInp = document.getElementById('adminBotToken');
    const botSupInp = document.getElementById('adminOperatorHandle');
    const activeLabel = document.getElementById('displayActiveBotHandle');
    const openDirectLink = document.getElementById('openBotDirectAdminLink');

    const b = AdminState.botConfig;
    if (apiUrlInp) apiUrlInp.value = AdminState.botApiUrl || detectDefaultApiUrl();
    if (botUserInp) botUserInp.value = b.username || '@yuan_rndiBOT';
    if (botTokenInp) botTokenInp.value = b.token || '';
    if (botSupInp) botSupInp.value = b.support || '@ashley_graves3';

    if (activeLabel) activeLabel.textContent = b.username || '@yuan_rndiBOT';
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

  function populateStockInputs() {
    const s = AdminState.stock;
    if (!s) return;
    const ids = {
      '2': 'stockBuy2',
      '3': 'stockBuy3',
      '5': 'stockBuy5',
      '10': 'stockBuy10',
      '20': 'stockBuy20',
      '50': 'stockBuy50',
      '100': 'stockBuy100'
    };
    Object.keys(ids).forEach(pack => {
      const el = document.getElementById(ids[pack]);
      if (el && s[pack] !== undefined) {
        el.value = s[pack];
      }
    });
  }

  // =========================================================================
  // 4. TRACK LOCATION & PICKUP STASH CONSOLE MODAL
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

    // Set order headers
    document.getElementById('locModalOrderId').value = ord.id;
    document.getElementById('locModalOrderNumber').textContent = ord.id;
    document.getElementById('locModalStatusBadge').className = `ord-status ${getStatusBadgeClass(ord.status)}`;
    document.getElementById('locModalStatusBadge').textContent = getStatusText(ord.status);

    const clientSummary = `Клиент: ${ord.telegram || ord.customerName || 'Аноним'} • Товар: Рега (${ord.volume || '2 шт'}) — ${(parseFloat(ord.totalAmount) || 0).toFixed(2)}$`;
    document.getElementById('locModalClientSummary').textContent = clientSummary;

    // Update 5-Step Stepper
    updateStepperView(ord.status);

    // Pickup Banner visibility
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

    // Coords & Radar Display
    const district = ord.district || 'Чиланзор';
    const coords = ord.coordinates || DISTRICT_COORDS[district] || '41.2721, 69.2045';
    updateRadarMapWidget(district, coords);

    // Populate Form Inputs
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

    // Clean coordinates for Map URLs
    const parts = coords.split(',').map(p => p.trim());
    const lat = parts[0] || '41.2721';
    const lon = parts[1] || '69.2045';

    // Google Maps link
    const gBtn = document.getElementById('openGoogleMapsBtn');
    if (gBtn) gBtn.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coords)}`;

    // Yandex Maps link
    const yBtn = document.getElementById('openYandexMapsBtn');
    if (yBtn) yBtn.href = `https://yandex.com/maps/?ll=${lon},${lat}&z=16&text=${encodeURIComponent(coords)}`;

    // OpenStreetMap link
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
  // 5. 1-CLICK MARK AS PICKED UP (SYNC WITH BOT & DB)
  // =========================================================================
  async function markOrderPickedUp(orderId) {
    const ord = AdminState.orders.find(o => o.id === orderId);
    if (!ord) return;

    ord.status = 'picked_up';
    ord.pickedUpAt = new Date().toISOString();
    saveOrdersLocally();
    renderAll();

    // If modal is open, refresh modal view
    if (AdminState.activeTrackingOrderId === orderId) {
      trackLocation(orderId);
    }

    showToast(`Заказ ${orderId} отмечен как ЗАБРАН (Picked Up)!`, 'success');

    // Notify Telegram Bot via REST API
    const apiUrl = (AdminState.botApiUrl || detectDefaultApiUrl()).replace(/\/+$/, '');
    try {
      const resp = await fetch(`${apiUrl}/api/orders/pickup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          picked_up_at: Math.floor(Date.now() / 1000),
          notes: 'Отмечено оператором в панели управления'
        })
      });

      if (resp.ok) {
        showToast(`Бот @yuan_rndiBOT синхронизировал статус заказа ${orderId}: Picked Up!`, 'success');
      }
    } catch (e) {
      console.warn('Bot pickup API offline, stored locally:', e.message);
    }
  }

  // =========================================================================
  // 6. SAVE LOCATION & EDIT ORDERS (SYNC WITH BOT REST API)
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

    // Sync to Bot REST API
    const apiUrl = (AdminState.botApiUrl || detectDefaultApiUrl()).replace(/\/+$/, '');
    try {
      const resp = await fetch(`${apiUrl}/api/orders/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          status: status,
          district: district,
          coordinates: coords,
          delivery_location: address,
          notes: notes,
          notify_customer: notifyCustomer
        })
      });

      if (resp.ok) {
        showToast(`Синхронизировано с ботом в реальном времени! ${notifyCustomer ? 'Клиенту отправлено уведомление.' : ''}`, 'success');
      }
    } catch (e) {
      console.warn('Bot API update call failed:', e.message);
    }
  }

  // Full Order Details Modal view
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

    // Items Breakdown
    const itemsContainer = document.getElementById('modalItemsList');
    if (itemsContainer) {
      const vol = ord.volume || '2 шт';
      itemsContainer.innerHTML = `
        <div class="modal-item-row" style="display:flex; justify-content:space-between; padding:0.6rem 0; border-bottom:1px solid rgba(255,255,255,0.06);">
          <span>Рега (${escapeHtml(vol)}) • Район: <strong>${escapeHtml(ord.district || 'Чиланзор')}</strong></span>
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

    // Populate Form
    document.getElementById('modalEditOrderId').value = ord.id;
    document.getElementById('modalEditStatus').value = ord.status || 'paid';
    document.getElementById('modalEditDistrict').value = ord.district || 'Чиланзор';
    document.getElementById('modalEditCoordinates').value = ord.coordinates || DISTRICT_COORDS[ord.district] || '41.2721, 69.2045';
    document.getElementById('modalEditTracking').value = ord.trackingCode || '';
    document.getElementById('modalEditLocation').value = ord.deliveryLocation || '';
    document.getElementById('modalEditNotes').value = ord.notes || '';

    modal.classList.remove('hidden');
  }

  function deleteOrder(orderId) {
    if (confirm(`Вы уверены, что хотите удалить заказ ${orderId}?`)) {
      AdminState.orders = AdminState.orders.filter(o => o.id !== orderId);
      saveOrdersLocally();
      renderAll();
      showToast(`Заказ ${orderId} удален из базы.`, 'info');

      // Also call Bot API delete
      const apiUrl = (AdminState.botApiUrl || detectDefaultApiUrl()).replace(/\/+$/, '');
      fetch(`${apiUrl}/api/orders/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId })
      }).catch(() => {});
    }
  }

  function createManualOrder(data) {
    const newOrd = {
      id: 'DRGX-' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + Math.floor(1000 + Math.random() * 9000),
      createdAt: new Date().toISOString(),
      customerId: data.customerId.trim(),
      customerName: data.customerName.trim(),
      telegram: data.telegram.trim(),
      district: data.district,
      item: 'Рега',
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

    // Sync to Bot API
    const apiUrl = (AdminState.botApiUrl || detectDefaultApiUrl()).replace(/\/+$/, '');
    fetch(`${apiUrl}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrd)
    }).catch(() => {});
  }

  async function saveStockToBot() {
    const s = {
      '2': parseInt(document.getElementById('stockBuy2')?.value, 10) || 0,
      '3': parseInt(document.getElementById('stockBuy3')?.value, 10) || 0,
      '5': parseInt(document.getElementById('stockBuy5')?.value, 10) || 0,
      '10': parseInt(document.getElementById('stockBuy10')?.value, 10) || 0,
      '20': parseInt(document.getElementById('stockBuy20')?.value, 10) || 0,
      '50': parseInt(document.getElementById('stockBuy50')?.value, 10) || 0,
      '100': parseInt(document.getElementById('stockBuy100')?.value, 10) || 0
    };

    AdminState.stock = s;
    saveStockLocally();
    showToast('Складские остатки Рега сохранены локально!', 'success');

    const apiUrl = (AdminState.botApiUrl || detectDefaultApiUrl()).replace(/\/+$/, '');
    try {
      const resp = await fetch(`${apiUrl}/api/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(s)
      });
      if (resp.ok) {
        showToast('Остатки товара Рега синхронизированы в Telegram боте!', 'success');
      }
    } catch (e) {
      console.warn('Stock update to bot failed:', e.message);
    }
  }

  function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
    AdminState.activeTrackingOrderId = null;
  }

  // =========================================================================
  // 7. TOAST NOTIFICATIONS & UTILS
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
  // 8. EVENT LISTENERS SETUP
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

    // Toggle Password Visibility
    const togglePwdBtn = document.getElementById('toggleAdminPwdBtn');
    if (togglePwdBtn) {
      togglePwdBtn.addEventListener('click', () => {
        const inp = document.getElementById('adminLoginPassword');
        const isPwd = inp.type === 'password';
        inp.type = isPwd ? 'text' : 'password';
        togglePwdBtn.innerHTML = isPwd ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
      });
    }

    // Logout Button
    const logoutBtn = document.getElementById('adminLogoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', handleAdminLogout);

    // Manual Sync Button in Header
    const manualSyncBtn = document.getElementById('adminManualSyncBtn');
    if (manualSyncBtn) {
      manualSyncBtn.addEventListener('click', () => {
        syncWithBotAPI(false);
      });
    }

    // Tab Navigation
    document.querySelectorAll('.adm-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.adm-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.admin-tab-pane').forEach(p => p.classList.add('hidden'));

        btn.classList.add('active');
        const targetTab = btn.dataset.tab;
        const pane = document.getElementById(targetTab);
        if (pane) pane.classList.remove('hidden');
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

    // Close on overlay click
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

    // When district selector changes in modal, auto update coords if empty
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

    // Copy Coordinates Button
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

    // Open Manual New Order Modal
    const openNewOrdBtn = document.getElementById('openNewOrderModalBtn');
    if (openNewOrdBtn) {
      openNewOrdBtn.addEventListener('click', () => {
        const modal = document.getElementById('newOrderModal');
        if (modal) modal.classList.remove('hidden');
      });
    }

    // Manual New Order Form Submit
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

    // Telegram Bot Settings Form
    const tgForm = document.getElementById('adminTgBotForm');
    if (tgForm) {
      tgForm.addEventListener('submit', (e) => {
        e.preventDefault();
        let apiUrl = document.getElementById('adminBotApiUrl').value.trim();
        let botUser = document.getElementById('adminBotUsername').value.trim();
        let botToken = document.getElementById('adminBotToken').value.trim();
        let botSup = document.getElementById('adminOperatorHandle').value.trim();

        if (botUser && !botUser.startsWith('@')) botUser = '@' + botUser;
        if (botSup && !botSup.startsWith('@')) botSup = '@' + botSup;

        AdminState.botApiUrl = apiUrl || detectDefaultApiUrl();
        AdminState.botConfig = {
          apiUrl: AdminState.botApiUrl,
          username: botUser || '@yuan_rndiBOT',
          token: botToken,
          support: botSup || '@ashley_graves3'
        };

        localStorage.setItem(STORAGE_KEYS.BOT_CONFIG, JSON.stringify(AdminState.botConfig));
        renderTelegramTab();
        showToast('Настройки шлюза и Telegram бота успешно сохранены!', 'success');

        // Test connection immediately
        syncWithBotAPI(false);
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

    // Save Stock Inventory Button
    const saveStockBtn = document.getElementById('saveStockBtn');
    if (saveStockBtn) {
      saveStockBtn.addEventListener('click', saveStockToBot);
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
  }

  // =========================================================================
  // 9. PUBLIC API FOR INLINE ACTIONS
  // =========================================================================
  window.AdminOps = {
    trackLocation,
    markOrderPickedUp,
    viewOrderDetails,
    deleteOrder,
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
    checkAdminSession();
    setupEventListeners();
  });

})();
