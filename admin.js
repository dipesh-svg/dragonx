/**
 * DRAGON-X PHARMA - OPERATOR DISPATCH CONSOLE
 * Secure Admin Gateway: ID = damascus@123 | PASS = vegadragon24
 * Order Tracking • Delivery Locations • Telegram Bot Gateway
 */

(function () {
  'use strict';

  // Hardcoded Secure Operator Credentials (as requested)
  const ADMIN_CREDENTIALS = {
    id: 'damascus@123',
    password: 'vegadragon24'
  };

  const STORAGE_KEYS = {
    ADMIN_SESSION: 'dragonx_admin_session_v1',
    ORDERS: 'dragonx_orders_db_v1',
    USERS: 'dragonx_users_v1',
    BOT_CONFIG: 'dragonx_bot_config_v1',
    DELIVERY_ZONES: 'dragonx_delivery_zones_v1',
    PRICING_CONFIG: 'dragonx_pricing_config_v1'
  };

  // Seed Initial Sample Orders if empty
  const SEED_ORDERS = [
    {
      id: 'DX-PG400-984102',
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      customerId: 'DRGX-9024-VIP',
      customerName: 'Алексей (VIP Client)',
      telegram: '@Alex_VIP_Client',
      items: [
        { name: 'Прегабалин - 400', packCount: 60, quantity: 2, unitPriceBase: 65 }
      ],
      totalPacks: 2,
      totalAmount: 117.00, // with 10% VIP discount
      currency: 'LFT',
      status: 'paid',
      deliveryLocation: 'Центральный Район, Сектор А (Координаты выданы в TG)',
      trackingCode: 'DX-TRK-9841'
    },
    {
      id: 'DX-PG400-771249',
      createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
      customerId: 'DRGX-5519-KX8',
      customerName: 'Сергей К.',
      telegram: '@sergey_k_tg',
      items: [
        { name: 'Прегабалин - 400', packCount: 90, quantity: 4, unitPriceBase: 89 }
      ],
      totalPacks: 4,
      totalAmount: 356.00,
      currency: 'LFT',
      status: 'dispatch',
      deliveryLocation: 'Северный округ, тайник №14 (GPS: 55.7892, 37.5921)',
      trackingCode: 'DX-TRK-7712'
    },
    {
      id: 'DX-PG400-334910',
      createdAt: new Date(Date.now() - 3600000 * 22).toISOString(),
      customerId: 'DRGX-1204-MN2',
      customerName: 'Гость (Аноним)',
      telegram: '@phantom_pharma',
      items: [
        { name: 'Прегабалин - 400', packCount: 120, quantity: 10, unitPriceBase: 110 }
      ],
      totalPacks: 10,
      totalAmount: 1100.00,
      currency: 'LFT',
      status: 'delivered',
      deliveryLocation: 'Экспресс Курьер (Бесконтактно, передано лично)',
      trackingCode: 'DX-TRK-3349'
    }
  ];

  // Seed Initial Delivery Zones
  const SEED_ZONES = [
    {
      id: 'zone-1',
      city: 'Центральный Хаб — Москва',
      area: 'ЦАО / Садовое кольцо (Курьерская доставка)',
      coordinates: '55.7558, 37.6173',
      notes: 'Доставка курьером в герметичной термо-упаковке в течение 40 минут.'
    },
    {
      id: 'zone-2',
      city: 'Северный Сектор — Спб',
      area: 'Бесконтактный Дроп / Магнитный тайник',
      coordinates: '59.9343, 30.3351',
      notes: 'Координаты GPS и 2 фото выдаются ботом после подтверждения LFT оплаты.'
    },
    {
      id: 'zone-3',
      city: 'Региональная Доставка (РФ & СНГ)',
      area: 'Экспресс Спецсвязь / Дрон',
      coordinates: 'По согласованию с оператором',
      notes: 'Локация и способ передачи согласовываются индивидуально через Telegram.'
    }
  ];

  // Admin App State
  const AdminState = {
    isAuthenticated: false,
    activeTab: 'tabOrders',
    orders: [],
    zones: [],
    users: [],
    botConfig: {
      username: '@yuan_rndiBOT',
      token: '',
      chatId: '',
      support: '@Dgx464'
    },
    searchQuery: '',
    statusFilter: 'all'
  };

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
      showToast('Авторизация успешна. Добро пожаловать, оператор damascus@123!', 'success');
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
  }

  function lockDashboard() {
    const gate = document.getElementById('adminAuthGate');
    const dash = document.getElementById('adminDashboard');
    if (gate) gate.classList.remove('logged-in');
    if (dash) dash.classList.add('hidden');
  }

  // =========================================================================
  // 2. DATA MANAGEMENT (LOCALSTORAGE SYNC)
  // =========================================================================
  function loadData() {
    // Load Orders
    try {
      const savedOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (savedOrders) {
        AdminState.orders = JSON.parse(savedOrders);
      } else {
        AdminState.orders = [...SEED_ORDERS];
        saveOrders();
      }
    } catch (e) {
      AdminState.orders = [...SEED_ORDERS];
    }

    // Load Zones
    try {
      const savedZones = localStorage.getItem(STORAGE_KEYS.DELIVERY_ZONES);
      if (savedZones) {
        AdminState.zones = JSON.parse(savedZones);
      } else {
        AdminState.zones = [...SEED_ZONES];
        saveZones();
      }
    } catch (e) {
      AdminState.zones = [...SEED_ZONES];
    }

    // Load Users
    try {
      const savedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      if (savedUsers) {
        AdminState.users = JSON.parse(savedUsers);
      } else {
        AdminState.users = [];
      }
    } catch (e) {
      AdminState.users = [];
    }

    // Load Bot Config
    try {
      const savedBot = localStorage.getItem(STORAGE_KEYS.BOT_CONFIG);
      if (savedBot) {
        AdminState.botConfig = Object.assign(AdminState.botConfig, JSON.parse(savedBot));
      }
    } catch (e) {
      // keep default
    }
  }

  function saveOrders() {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(AdminState.orders));
  }

  function saveZones() {
    localStorage.setItem(STORAGE_KEYS.DELIVERY_ZONES, JSON.stringify(AdminState.zones));
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
  }

  function renderMetrics() {
    const totalOrdersEl = document.getElementById('metricTotalOrders');
    const totalRevEl = document.getElementById('metricTotalRevenue');
    const activeDelEl = document.getElementById('metricActiveDelivery');
    const totalClientsEl = document.getElementById('metricTotalClients');
    const ordersBadge = document.getElementById('ordersTabCount');

    const totalOrders = AdminState.orders.length;
    const totalRevenue = AdminState.orders.reduce((sum, ord) => sum + (ord.totalAmount || 0), 0);
    const activeDelivery = AdminState.orders.filter(ord => ord.status === 'dispatch' || ord.status === 'paid').length;
    const totalClients = AdminState.users.length;

    if (totalOrdersEl) totalOrdersEl.textContent = totalOrders;
    if (totalRevEl) totalRevEl.textContent = `${totalRevenue.toFixed(2)} LFT`;
    if (activeDelEl) activeDelEl.textContent = activeDelivery;
    if (totalClientsEl) totalClientsEl.textContent = totalClients;
    if (ordersBadge) ordersBadge.textContent = totalOrders;
  }

  function getStatusBadge(status) {
    switch (status) {
      case 'paid':
        return `<span class="ord-status status-paid"><i class="fa-solid fa-circle-check"></i> Оплачен (LFT)</span>`;
      case 'dispatch':
        return `<span class="ord-status status-dispatch"><i class="fa-solid fa-truck-fast"></i> В пути / Курьер</span>`;
      case 'delivered':
        return `<span class="ord-status status-delivered"><i class="fa-solid fa-circle-check"></i> Выдан / Доставлен</span>`;
      case 'cancelled':
        return `<span class="ord-status status-cancelled"><i class="fa-solid fa-ban"></i> Отменен</span>`;
      default:
        return `<span class="ord-status status-new"><i class="fa-solid fa-clock"></i> Новый (Ждет LFT)</span>`;
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
        const idMatch = order.id.toLowerCase().includes(q);
        const cIdMatch = (order.customerId || '').toLowerCase().includes(q);
        const tgMatch = (order.telegram || '').toLowerCase().includes(q);
        const nameMatch = (order.customerName || '').toLowerCase().includes(q);
        return idMatch || cIdMatch || tgMatch || nameMatch;
      }
      return true;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; padding: 2.5rem; color: var(--text-dim);">
            <i class="fa-solid fa-inbox" style="font-size: 2rem; margin-bottom: 0.5rem; display:block;"></i>
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

      const itemsSummary = (ord.items || []).map(i => `${i.packCount} капс. x ${i.quantity} шт`).join(', ') || `${ord.totalPacks || 2} упак.`;
      const tgLink = ord.telegram && ord.telegram.startsWith('@') 
        ? `<a href="https://t.me/${ord.telegram.replace('@', '')}" target="_blank" class="font-mono text-cyan" style="text-decoration:none;">${escapeHtml(ord.telegram)}</a>`
        : escapeHtml(ord.telegram || '—');

      return `
        <tr>
          <td><strong class="font-mono text-cyan">${ord.id}</strong></td>
          <td style="font-size: 0.8rem; color: var(--text-muted);">${dateStr}</td>
          <td>
            <div style="font-weight: 700;">${escapeHtml(ord.customerName || 'Клиент')}</div>
            <div class="font-mono" style="font-size: 0.72rem; color: var(--accent-cyan);">${ord.customerId || 'Без ID'}</div>
          </td>
          <td>${tgLink}</td>
          <td>${itemsSummary}</td>
          <td><strong class="font-mono" style="color: #fbbf24;">${(ord.totalAmount || 0).toFixed(2)} LFT</strong></td>
          <td>
            <div class="location-preview-cell" title="${escapeHtml(ord.deliveryLocation || 'Локация не назначена')}">
              <i class="fa-solid fa-location-dot" style="color: var(--accent-cyan);"></i> ${escapeHtml(ord.deliveryLocation || 'Локация не назначена')}
            </div>
          </td>
          <td>${getStatusBadge(ord.status)}</td>
          <td>
            <div class="table-action-btns">
              <button class="action-icon-btn" onclick="window.AdminOps.viewOrderDetails('${ord.id}')" title="Подробнее и локация">
                <i class="fa-solid fa-eye"></i>
              </button>
              <button class="action-icon-btn" onclick="window.AdminOps.quickTgContact('${ord.telegram}', '${ord.id}')" title="Написать в Telegram">
                <i class="fa-brands fa-telegram"></i>
              </button>
              <button class="action-icon-btn action-delete-btn" onclick="window.AdminOps.deleteOrder('${ord.id}')" title="Удалить заказ">
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
      container.innerHTML = `<p style="color: var(--text-dim); text-align:center;">Нет сохраненных локаций доставки</p>`;
      return;
    }

    container.innerHTML = AdminState.zones.map(zone => `
      <div class="zone-item-card">
        <div>
          <div class="zone-city"><i class="fa-solid fa-map-pin" style="color: var(--accent-cyan);"></i> ${escapeHtml(zone.city)}</div>
          <div class="zone-area">${escapeHtml(zone.area)}</div>
          ${zone.coordinates ? `<div class="zone-coords font-mono"><i class="fa-solid fa-crosshairs"></i> GPS: ${escapeHtml(zone.coordinates)}</div>` : ''}
          ${zone.notes ? `<p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.35rem;">${escapeHtml(zone.notes)}</p>` : ''}
        </div>
        <button class="action-icon-btn action-delete-btn" onclick="window.AdminOps.deleteZone('${zone.id}')" title="Удалить зону">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    `).join('');
  }

  function renderTelegramTab() {
    const botUserInp = document.getElementById('adminBotUsername');
    const botTokenInp = document.getElementById('adminBotToken');
    const botChatInp = document.getElementById('adminTgChatId');
    const botSupInp = document.getElementById('adminOperatorHandle');
    const activeLabel = document.getElementById('displayActiveBotHandle');
    const openDirectLink = document.getElementById('openBotDirectAdminLink');

    const b = AdminState.botConfig;
    if (botUserInp) botUserInp.value = b.username || '@yuan_rndiBOT';
    if (botTokenInp) botTokenInp.value = b.token || '';
    if (botChatInp) botChatInp.value = b.chatId || '';
    if (botSupInp) botSupInp.value = b.support || '@Dgx464';

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
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-dim); padding: 2rem;">Клиенты еще не регистрировались</td></tr>`;
      return;
    }

    tbody.innerHTML = AdminState.users.map(u => {
      const dateStr = u.createdAt ? new Date(u.createdAt).toLocaleDateString('ru-RU') : '—';
      const tg = u.telegram ? `<a href="https://t.me/${u.telegram.replace('@','')}" target="_blank" class="font-mono text-cyan">${escapeHtml(u.telegram)}</a>` : '—';

      return `
        <tr>
          <td><strong class="font-mono text-cyan" style="font-size: 0.95rem;">${u.id}</strong></td>
          <td><strong>${escapeHtml(u.name || 'Пользователь')}</strong></td>
          <td>${tg}</td>
          <td style="color: var(--text-muted); font-size: 0.8rem;">${dateStr}</td>
          <td><span class="tab-badge">${u.ordersCount || 0}</span></td>
          <td><span style="color: #34d399; font-weight: 700;">10% VIP</span></td>
          <td>
            <button class="action-icon-btn" onclick="window.AdminOps.copyClientId('${u.id}')" title="Скопировать ID">
              <i class="fa-solid fa-copy"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // =========================================================================
  // 4. ORDER DETAILS & LOCATION ASSIGNMENT
  // =========================================================================
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

    document.getElementById('modalOrderTotal').textContent = `${(ord.totalAmount || 0).toFixed(2)} LFT`;

    // Items Breakdown
    const itemsContainer = document.getElementById('modalItemsList');
    if (itemsContainer) {
      itemsContainer.innerHTML = (ord.items || []).map(item => `
        <div class="modal-item-row">
          <span>Прегабалин - 400 (${item.packCount} капс.) x <strong>${item.quantity} шт</strong></span>
          <span class="font-mono text-cyan">${(item.unitPriceBase * item.quantity).toFixed(2)} LFT</span>
        </div>
      `).join('');
    }

    // Populate Form
    document.getElementById('modalEditOrderId').value = ord.id;
    document.getElementById('modalEditStatus').value = ord.status || 'new';
    document.getElementById('modalEditLocation').value = ord.deliveryLocation || '';
    document.getElementById('modalEditTracking').value = ord.trackingCode || '';

    modal.classList.remove('hidden');
  }

  function saveOrderDetails(orderId, status, location, tracking) {
    const ord = AdminState.orders.find(o => o.id === orderId);
    if (!ord) return;

    ord.status = status;
    ord.deliveryLocation = location.trim();
    ord.trackingCode = tracking.trim();

    saveOrders();
    renderAll();
    closeAllModals();
    showToast(`Заказ ${orderId} обновлен! Локация доставки сохранена.`, 'success');
  }

  function deleteOrder(orderId) {
    if (confirm(`Вы уверены, что хотите удалить заказ ${orderId}?`)) {
      AdminState.orders = AdminState.orders.filter(o => o.id !== orderId);
      saveOrders();
      renderAll();
      showToast(`Заказ ${orderId} удален из базы.`, 'info');
    }
  }

  function createManualOrder(data) {
    const newOrd = {
      id: 'DX-PG400-' + Math.floor(100000 + Math.random() * 900000),
      createdAt: new Date().toISOString(),
      customerId: data.customerId.trim(),
      customerName: data.customerName.trim(),
      telegram: data.telegram.trim(),
      items: [
        {
          name: 'Прегабалин - 400',
          packCount: data.packCount,
          quantity: data.quantity,
          unitPriceBase: data.unitPrice
        }
      ],
      totalPacks: data.quantity,
      totalAmount: data.unitPrice * data.quantity,
      currency: 'LFT',
      status: 'paid',
      deliveryLocation: data.location.trim() || 'Локация будет предоставлена',
      trackingCode: 'DX-TRK-' + Math.floor(1000 + Math.random() * 9000)
    };

    AdminState.orders.unshift(newOrd);
    saveOrders();
    renderAll();
    closeAllModals();
    showToast(`Новый заказ ${newOrd.id} успешно создан!`, 'success');
  }

  function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
  }

  // =========================================================================
  // 5. TOAST NOTIFICATIONS
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
    }, 3500);
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
  // 6. EVENT LISTENERS
  // =========================================================================
  function setupEventListeners() {
    // Admin Login Form
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
        loadData();
        renderAll();
        showToast('Список заказов обновлен!', 'info');
      });
    }

    // Update Order Form in Modal
    const updateOrderForm = document.getElementById('updateOrderForm');
    if (updateOrderForm) {
      updateOrderForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const orderId = document.getElementById('modalEditOrderId').value;
        const status = document.getElementById('modalEditStatus').value;
        const location = document.getElementById('modalEditLocation').value;
        const tracking = document.getElementById('modalEditTracking').value;
        saveOrderDetails(orderId, status, location, tracking);
      });
    }

    // Close Modals
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', closeAllModals);
    });

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
        saveZones();
        renderZonesList();
        zoneForm.reset();
        showToast('Локация доставки добавлена!', 'success');
      });
    }

    // Telegram Bot Settings Form
    const tgForm = document.getElementById('adminTgBotForm');
    if (tgForm) {
      tgForm.addEventListener('submit', (e) => {
        e.preventDefault();
        let botUser = document.getElementById('adminBotUsername').value.trim();
        let botToken = document.getElementById('adminBotToken').value.trim();
        let botChat = document.getElementById('adminTgChatId').value.trim();
        let botSup = document.getElementById('adminOperatorHandle').value.trim();

        if (botUser && !botUser.startsWith('@')) botUser = '@' + botUser;
        if (botSup && !botSup.startsWith('@')) botSup = '@' + botSup;

        AdminState.botConfig = {
          username: botUser || '@yuan_rndiBOT',
          token: botToken,
          chatId: botChat,
          support: botSup || '@Dgx464'
        };

        localStorage.setItem(STORAGE_KEYS.BOT_CONFIG, JSON.stringify(AdminState.botConfig));
        renderTelegramTab();
        showToast('Настройки Telegram бота успешно сохранены!', 'success');
      });
    }

    // Test Telegram Notification
    const testTgBtn = document.getElementById('testTgNotificationBtn');
    if (testTgBtn) {
      testTgBtn.addEventListener('click', () => {
        const botName = AdminState.botConfig.username || '@DragonX_Capsules_Bot';
        showToast(`Тестовое уведомление сформировано для ${botName}. Шлюз готов к приему заказов!`, 'info');
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
        const packCount = parseInt(document.getElementById('newOrderPack').value, 10);
        const qty = parseInt(document.getElementById('newOrderQuantity').value, 10);
        const loc = document.getElementById('newOrderLocation').value;

        // Determine unit price
        let unitPrice = 65;
        if (packCount === 30) unitPrice = 38;
        if (packCount === 90) unitPrice = 89;
        if (packCount === 120) unitPrice = 110;

        createManualOrder({
          customerId: cId,
          customerName: cName,
          telegram: cTg,
          packCount: packCount,
          quantity: qty,
          unitPrice: unitPrice,
          location: loc
        });

        manualOrderForm.reset();
      });
    }

    // Pricing & Limits Form
    const pricingForm = document.getElementById('adminPricingForm');
    if (pricingForm) {
      pricingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const p30 = parseFloat(document.getElementById('pricePack30').value) || 38;
        const p60 = parseFloat(document.getElementById('pricePack60').value) || 65;
        const p90 = parseFloat(document.getElementById('pricePack90').value) || 89;
        const p120 = parseFloat(document.getElementById('pricePack120').value) || 110;
        const minQ = parseInt(document.getElementById('cfgMinQty').value, 10) || 2;
        const maxQ = parseInt(document.getElementById('cfgMaxQty').value, 10) || 100;

        const pricingCfg = {
          packs: { 30: p30, 60: p60, 90: p90, 120: p120 },
          minQty: minQ,
          maxQty: maxQ
        };

        localStorage.setItem(STORAGE_KEYS.PRICING_CONFIG, JSON.stringify(pricingCfg));
        showToast('Цены в LFT Crypto и лимиты партий успешно сохранены!', 'success');
      });
    }
  }

  // Public API for inline buttons
  window.AdminOps = {
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
      saveZones();
      renderZonesList();
      showToast('Зона доставки удалена.', 'info');
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
