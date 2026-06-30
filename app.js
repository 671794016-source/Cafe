/* ==========================================================================
   EspressoPOS Core Logic, UI Orchestrator & Chart Analytics
   ========================================================================== */

// --- Products Database ---
const PRODUCTS = [
    { id: 'prod-1', name: 'Espresso (เอสเปรสโซ่ร้อน)', price: 50.00, category: 'coffee', image: 'images/coffee_espresso.jpg', pointsValue: 1 },
    { id: 'prod-2', name: 'Caffe Latte (ลาเต้ร้อน)', price: 60.00, category: 'coffee', image: 'images/coffee_latte.jpg', pointsValue: 1 },
    { id: 'prod-3', name: 'French Croissant (ครัวซองต์ฝรั่งเศส)', price: 65.00, category: 'bakery', image: 'images/bakery_croissant.jpg', pointsValue: 2 },
    { id: 'prod-4', name: 'Strawberry Shortcake (เค้กสตรอว์เบอร์รี่)', price: 75.00, category: 'bakery', image: 'images/bakery_cake.jpg', pointsValue: 2 },
    { id: 'prod-5', name: 'Iced Americano (อเมริกาโน่เย็น)', price: 55.00, category: 'coffee', image: 'images/coffee_espresso.jpg', pointsValue: 1 },
    { id: 'prod-6', name: 'Cappuccino (คาปูชิโน่ร้อน)', price: 60.00, category: 'coffee', image: 'images/coffee_latte.jpg', pointsValue: 1 },
    { id: 'prod-7', name: 'Chocolate Fudge Cake (เค้กช็อกโกแลต)', price: 80.00, category: 'bakery', image: 'images/bakery_cake.jpg', pointsValue: 2 },
    { id: 'prod-8', name: 'Almond Croissant (ครัวซองต์อัลมอนด์)', price: 85.00, category: 'bakery', image: 'images/bakery_croissant.jpg', pointsValue: 2 }
];

// --- Application State ---
let state = {
    user: null,
    cart: [],
    selectedCustomer: null,
    redeemChecked: false,
    activeView: 'pos-view',
    activeCategory: 'all',
    searchQuery: '',
    customers: [],
    orders: [],
    chartInstance: null
};

// --- DOM Elements Cache ---
const elements = {
    // Views
    loginView: document.getElementById('login-view'),
    appShell: document.getElementById('app-shell'),
    posView: document.getElementById('pos-view'),
    dashboardView: document.getElementById('dashboard-view'),
    customersView: document.getElementById('customers-view'),
    settingsView: document.getElementById('settings-view'),
    
    // Sidebar
    navItems: document.querySelectorAll('.nav-item'),
    statusBadge: document.getElementById('supabase-status-badge'),
    offlineBanner: document.getElementById('offline-banner'),
    userEmail: document.getElementById('current-user-email'),
    btnLogout: document.getElementById('btn-logout'),
    
    // Forms
    loginForm: document.getElementById('login-form'),
    btnGuest: document.getElementById('btn-guest-login'),
    customerRegisterForm: document.getElementById('customer-register-form'),
    settingsForm: document.getElementById('settings-form'),
    btnSaveSettings: document.getElementById('btn-save-settings'),
    btnClearSettings: document.getElementById('btn-clear-settings'),
    
    // POS DOMs
    productGrid: document.getElementById('product-grid'),
    searchProduct: document.getElementById('search-product'),
    categoryTabs: document.querySelectorAll('.cat-tab'),
    cartItems: document.getElementById('cart-items'),
    btnClearCart: document.getElementById('btn-clear-cart'),
    btnCheckout: document.getElementById('btn-checkout'),
    
    // Cart Summary
    cartSubtotal: document.getElementById('cart-subtotal'),
    cartDiscount: document.getElementById('cart-discount'),
    cartPointsEarn: document.getElementById('cart-points-earned'),
    cartTotal: document.getElementById('cart-total'),
    discountRow: document.getElementById('discount-row'),
    
    // POS Loyalty Section
    posCustomerSearch: document.getElementById('pos-customer-search'),
    customerSearchDropdown: document.getElementById('customer-search-dropdown'),
    selectedCustomerDetails: document.getElementById('selected-customer-details'),
    btnRemoveCustomerPos: document.getElementById('btn-remove-customer-pos'),
    btnAddCustomerPos: document.getElementById('btn-add-customer-pos'),
    selCustName: document.getElementById('sel-cust-name'),
    selCustPhone: document.getElementById('sel-cust-phone'),
    selCustPoints: document.getElementById('sel-cust-points'),
    pointsRedemptionBox: document.getElementById('points-redemption-box'),
    chkRedeemPoints: document.getElementById('chk-redeem-points'),
    pointsRedemptionHint: document.getElementById('points-redemption-hint'),
    
    // Dashboard DOMs
    kpiRevenue: document.getElementById('kpi-revenue'),
    kpiOrders: document.getElementById('kpi-orders'),
    kpiPoints: document.getElementById('kpi-points'),
    kpiMembers: document.getElementById('kpi-members'),
    popularProductsList: document.getElementById('popular-products-list'),
    recentOrdersTbody: document.getElementById('recent-orders-tbody'),
    btnRefreshDashboard: document.getElementById('btn-refresh-dashboard'),
    
    // Customers Management DOMs
    searchMemberList: document.getElementById('search-member-list'),
    customersListTbody: document.getElementById('customers-list-tbody'),
    
    // Receipt Modal
    receiptModal: document.getElementById('receipt-modal'),
    recBillId: document.getElementById('rec-bill-id'),
    recDate: document.getElementById('rec-date'),
    recCashier: document.getElementById('rec-cashier'),
    recCustomerRow: document.getElementById('rec-customer-row'),
    recCustomerInfo: document.getElementById('rec-customer-info'),
    recItems: document.getElementById('rec-items'),
    recSubtotal: document.getElementById('rec-subtotal'),
    recDiscountRow: document.getElementById('rec-discount-row'),
    recDiscount: document.getElementById('rec-discount'),
    recTotal: document.getElementById('rec-total'),
    recLoyaltySection: document.getElementById('rec-loyalty-section'),
    recLoyaltyPrev: document.getElementById('rec-loyalty-prev'),
    recLoyaltyEarned: document.getElementById('rec-loyalty-earned'),
    recLoyaltyRedeemedRow: document.getElementById('rec-loyalty-redeemed-row'),
    recLoyaltyRedeemed: document.getElementById('rec-loyalty-redeemed'),
    recLoyaltyTotal: document.getElementById('rec-loyalty-total'),
    btnCloseReceipt: document.getElementById('btn-close-receipt'),
    
    // Supabase Status Settings Box
    settingsStatusBox: document.getElementById('settings-status-box'),
    statusDot: document.getElementById('status-dot'),
    statusText: document.getElementById('status-text')
};

/* ==========================================================================
   Helper Functions (Toasts, Formatting)
   ========================================================================== */
function formatCurrency(val) {
    return '฿' + parseFloat(val).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateString) {
    const d = new Date(dateString);
    return d.toLocaleString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Toast notification trigger
function showToast(title, message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconName = 'check-circle';
    if (type === 'error') iconName = 'alert-triangle';
    if (type === 'warning') iconName = 'alert-circle';
    
    toast.innerHTML = `
        <i data-lucide="${iconName}"></i>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <div class="toast-close"><i data-lucide="x"></i></div>
    `;
    
    container.appendChild(toast);
    lucide.createIcons();
    
    // Handle close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.style.transform = 'translateX(120%)';
        setTimeout(() => toast.remove(), 300);
    });
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.transform = 'translateX(120%)';
            setTimeout(() => toast.remove(), 300);
        }
    }, 4000);
}

/* ==========================================================================
   Navigation Controller
   ========================================================================== */
function switchView(viewId) {
    // Hide all views
    elements.posView.classList.add('hidden');
    elements.dashboardView.classList.add('hidden');
    elements.customersView.classList.add('hidden');
    elements.settingsView.classList.add('hidden');
    
    // Show selected view
    document.getElementById(viewId).classList.remove('hidden');
    state.activeView = viewId;
    
    // Update navigation active states
    elements.navItems.forEach(item => {
        if (item.getAttribute('data-view') === viewId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // If switching to a view that requires database updates
    if (viewId === 'dashboard-view') {
        loadDashboardData();
    } else if (viewId === 'customers-view') {
        loadCustomersList();
    }
}

/* ==========================================================================
   Authentication Flows
   ========================================================================== */
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('btn-login-submit');
    
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader-2" class="animate-spin"></i> กำลังตรวจสอบ...';
    lucide.createIcons();

    try {
        const { user, offline } = await window.db.login(email, password);
        state.user = user;
        
        showToast('เข้าสู่ระบบสำเร็จ', offline ? 'กำลังใช้งานโหมดออฟไลน์' : `เข้าใช้งานโดยบัญชี: ${user.email}`);
        setupAppShell();
    } catch (err) {
        showToast('การเข้าสู่ระบบล้มเหลว', err.message || 'รหัสผ่านไม่ถูกต้อง', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i data-lucide="log-in"></i> เข้าสู่ระบบ';
        lucide.createIcons();
    }
}

function handleGuestLogin() {
    state.user = {
        id: 'mock-user-guest',
        email: 'guest@espressopos.local',
        role: 'guest'
    };
    localStorage.setItem('espresso_pos_mock_user', JSON.stringify(state.user));
    showToast('ยินดีต้อนรับ', 'เข้าสู่ระบบในโหมดออฟไลน์สำเร็จ (Guest Mode)');
    setupAppShell();
}

function handleLogout() {
    window.db.logout();
    state.user = null;
    state.cart = [];
    state.selectedCustomer = null;
    state.redeemChecked = false;
    
    // Hide shell and show login
    elements.appShell.classList.add('hidden');
    elements.loginView.classList.remove('hidden');
    
    // Reset forms
    elements.loginForm.reset();
}

function setupAppShell() {
    elements.loginView.classList.add('hidden');
    elements.appShell.classList.remove('hidden');
    
    // Render current email and credentials status
    elements.userEmail.innerText = state.user.email;
    
    if (window.db.isConnected()) {
        elements.statusBadge.innerText = 'Supabase Online';
        elements.statusBadge.className = 'badge badge-online';
        elements.offlineBanner.classList.add('hidden');
        
        // Fill settings fields automatically
        document.getElementById('settings-url').value = window.db.url;
        document.getElementById('settings-key').value = window.db.key;
        
        // Update connection check box in Settings UI
        elements.statusDot.className = 'status-dot dot-online';
        elements.statusText.innerText = 'เชื่อมต่อฐานข้อมูล Supabase สำเร็จ';
    } else {
        elements.statusBadge.innerText = 'Offline Mode';
        elements.statusBadge.className = 'badge badge-offline';
        elements.offlineBanner.classList.remove('hidden');
        
        elements.statusDot.className = 'status-dot dot-offline';
        elements.statusText.innerText = 'ไม่ได้เชื่อมต่อฐานข้อมูล Supabase (ทำงานแบบออฟไลน์)';
    }
    
    // Pre-cache data
    fetchInitialData();
    
    // Render products
    renderProducts();
    updateCartUI();
    switchView('pos-view');
}

async function fetchInitialData() {
    try {
        state.customers = await window.db.getCustomers();
        state.orders = await window.db.getOrders();
    } catch (err) {
        console.error('Error fetching database cache:', err);
    }
}

/* ==========================================================================
   POS Product Rendering
   ========================================================================== */
function renderProducts() {
    elements.productGrid.innerHTML = '';
    
    // Filter products list based on active category & query search
    const filtered = PRODUCTS.filter(prod => {
        const matchesCategory = state.activeCategory === 'all' || prod.category === state.activeCategory;
        const matchesSearch = prod.name.toLowerCase().includes(state.searchQuery.toLowerCase()) || 
                             prod.category.toLowerCase().includes(state.searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
        elements.productGrid.innerHTML = `
            <div class="empty-cart-message" style="grid-column: 1/-1;">
                <i data-lucide="search-code"></i>
                <p>ไม่พบรายการอาหารหรือเครื่องดื่มที่ค้นหา</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    filtered.forEach(prod => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-image-wrapper">
                <img src="${prod.image}" alt="${prod.name}">
                <div class="product-points-badge">
                    <i data-lucide="award"></i> +${prod.pointsValue} แต้ม
                </div>
            </div>
            <div class="product-info">
                <span class="product-category">${prod.category === 'coffee' ? 'กาแฟ' : 'เบเกอรี่'}</span>
                <h4 class="product-name">${prod.name}</h4>
                <div class="product-price-row">
                    <span class="product-price">${formatCurrency(prod.price)}</span>
                    <button class="btn-add-product-card"><i data-lucide="plus"></i></button>
                </div>
            </div>
        `;
        
        // Bind click events
        card.addEventListener('click', () => addToCart(prod));
        
        elements.productGrid.appendChild(card);
    });
    
    lucide.createIcons();
}

/* ==========================================================================
   POS Cart & Loyalty Operations
   ========================================================================== */
function addToCart(product) {
    const existing = state.cart.find(item => item.product.id === product.id);
    if (existing) {
        existing.qty += 1;
    } else {
        state.cart.push({ product, qty: 1 });
    }
    showToast('เพิ่มสินค้า', `เพิ่ม ${product.name} ลงตะกร้าแล้ว`, 'success');
    updateCartUI();
}

function updateCartItemQty(prodId, newQty) {
    const item = state.cart.find(i => i.product.id === prodId);
    if (!item) return;

    if (newQty <= 0) {
        state.cart = state.cart.filter(i => i.product.id !== prodId);
    } else {
        item.qty = newQty;
    }
    updateCartUI();
}

function removeCartItem(prodId) {
    state.cart = state.cart.filter(i => i.product.id !== prodId);
    updateCartUI();
}

function clearCart() {
    state.cart = [];
    state.selectedCustomer = null;
    state.redeemChecked = false;
    elements.posCustomerSearch.value = '';
    updateCartUI();
}

// Calculate totals and loyalty rules
function calculateTotals() {
    let subtotal = 0;
    let pointsEarned = 0;

    state.cart.forEach(item => {
        subtotal += item.product.price * item.qty;
        pointsEarned += item.product.pointsValue * item.qty;
    });

    // Check discount logic: 10 points = 50 THB
    let discount = 0;
    let pointsRedeemed = 0;
    
    if (state.selectedCustomer) {
        // Can only check the Box if current points >= 10
        const canRedeem = state.selectedCustomer.points >= 10;
        
        if (canRedeem) {
            elements.pointsRedemptionBox.classList.remove('disabled');
            elements.chkRedeemPoints.disabled = false;
            elements.pointsRedemptionHint.className = 'hint-text';
            elements.pointsRedemptionHint.innerText = `(แลกใช้ได้สิทธิ์ละ 50 บาท)`;
            
            if (state.redeemChecked) {
                discount = 50.00;
                pointsRedeemed = 10;
            }
        } else {
            elements.pointsRedemptionBox.classList.add('disabled');
            elements.chkRedeemPoints.disabled = true;
            elements.chkRedeemPoints.checked = false;
            state.redeemChecked = false;
            elements.pointsRedemptionHint.className = 'hint-text';
            elements.pointsRedemptionHint.innerText = `(แต้มสะสมไม่ถึง 10 แต้ม)`;
        }
    } else {
        elements.pointsRedemptionBox.classList.add('disabled');
        elements.chkRedeemPoints.disabled = true;
        elements.chkRedeemPoints.checked = false;
        state.redeemChecked = false;
        elements.pointsRedemptionHint.innerText = `(กรุณาเลือกลูกค้าสมาชิกก่อน)`;
    }

    // Cap discount at total price
    if (discount > subtotal) {
        discount = subtotal;
    }

    const total = subtotal - discount;

    return {
        subtotal,
        discount,
        pointsEarned,
        pointsRedeemed,
        total
    };
}

function updateCartUI() {
    elements.cartItems.innerHTML = '';
    
    if (state.cart.length === 0) {
        elements.cartItems.innerHTML = `
            <div class="empty-cart-message">
                <i data-lucide="shopping-bag"></i>
                <p>ไม่มีสินค้าในตะกร้า</p>
            </div>
        `;
        elements.btnCheckout.disabled = true;
        elements.btnClearCart.style.opacity = '0.5';
        elements.btnClearCart.disabled = true;
        
        elements.cartSubtotal.innerText = formatCurrency(0);
        elements.cartDiscount.innerText = formatCurrency(0);
        elements.discountRow.classList.add('hidden');
        elements.cartPointsEarn.innerText = '+0 แต้ม';
        elements.cartTotal.innerText = formatCurrency(0);
        
        elements.pointsRedemptionBox.classList.add('disabled');
        elements.chkRedeemPoints.disabled = true;
        elements.chkRedeemPoints.checked = false;
        state.redeemChecked = false;
        elements.pointsRedemptionHint.innerText = `(กรุณาเลือกลูกค้าสมาชิกก่อน)`;
        
        lucide.createIcons();
        return;
    }

    elements.btnClearCart.style.opacity = '1';
    elements.btnClearCart.disabled = false;
    elements.btnCheckout.disabled = false;

    // Render cart items list
    state.cart.forEach(item => {
        const row = document.createElement('div');
        row.className = 'cart-item';
        row.innerHTML = `
            <img src="${item.product.image}" class="cart-item-img" alt="${item.product.name}">
            <div class="cart-item-details">
                <span class="cart-item-name">${item.product.name}</span>
                <span class="cart-item-price">${formatCurrency(item.product.price)} / ชิ้น</span>
            </div>
            <div class="quantity-controls">
                <button class="btn-qty btn-minus" data-id="${item.product.id}"><i data-lucide="minus" style="width:12px;height:12px;"></i></button>
                <span class="qty-value">${item.qty}</span>
                <button class="btn-qty btn-plus" data-id="${item.product.id}"><i data-lucide="plus" style="width:12px;height:12px;"></i></button>
            </div>
            <span class="cart-item-total">${formatCurrency(item.product.price * item.qty)}</span>
            <button class="btn-remove-item" data-id="${item.product.id}"><i data-lucide="trash-2"></i></button>
        `;

        // Event bindings
        row.querySelector('.btn-minus').addEventListener('click', () => updateCartItemQty(item.product.id, item.qty - 1));
        row.querySelector('.btn-plus').addEventListener('click', () => updateCartItemQty(item.product.id, item.qty + 1));
        row.querySelector('.btn-remove-item').addEventListener('click', () => removeCartItem(item.product.id));

        elements.cartItems.appendChild(row);
    });

    // Update loyalty point redemption visual cues
    const cal = calculateTotals();
    
    elements.cartSubtotal.innerText = formatCurrency(cal.subtotal);
    elements.cartPointsEarn.innerText = `+${cal.pointsEarned} แต้ม`;
    
    if (cal.discount > 0) {
        elements.cartDiscount.innerText = `-${formatCurrency(cal.discount)}`;
        elements.discountRow.classList.remove('hidden');
    } else {
        elements.discountRow.classList.add('hidden');
    }
    
    elements.cartTotal.innerText = formatCurrency(cal.total);
    lucide.createIcons();
}

/* ==========================================================================
   Loyalty Customer Selector Dropdown
   ========================================================================== */
function handleCustomerSearch() {
    const q = elements.posCustomerSearch.value.trim().toLowerCase();
    elements.customerSearchDropdown.innerHTML = '';

    if (!q) {
        elements.customerSearchDropdown.classList.add('hidden');
        return;
    }

    const filtered = state.customers.filter(c => 
        c.name.toLowerCase().includes(q) || c.phone.includes(q)
    );

    if (filtered.length === 0) {
        elements.customerSearchDropdown.innerHTML = `
            <div class="dropdown-item" style="color:var(--color-text-muted); cursor:default;">
                ไม่พบรายชื่อสมาชิก "${q}"
            </div>
        `;
    } else {
        filtered.forEach(c => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.innerHTML = `
                <div class="dropdown-item-details">
                    <strong>${c.name}</strong>
                    <span>โทร: ${c.phone}</span>
                </div>
                <span class="dropdown-item-points">${c.points} แต้ม</span>
            `;
            
            item.addEventListener('mousedown', () => {
                selectCustomer(c);
            });
            
            elements.customerSearchDropdown.appendChild(item);
        });
    }

    elements.customerSearchDropdown.classList.remove('hidden');
}

function selectCustomer(cust) {
    state.selectedCustomer = cust;
    elements.customerSearchDropdown.classList.add('hidden');
    elements.posCustomerSearch.value = '';
    
    // UI details
    elements.selCustName.innerText = cust.name;
    elements.selCustPhone.innerText = `โทร: ${cust.phone}`;
    elements.selCustPoints.innerText = cust.points;
    
    elements.selectedCustomerDetails.classList.remove('hidden');
    elements.posCustomerSearch.parentNode.classList.add('hidden'); // Hide search bar
    
    updateCartUI();
}

function removeSelectedCustomer() {
    state.selectedCustomer = null;
    state.redeemChecked = false;
    elements.chkRedeemPoints.checked = false;
    
    elements.selectedCustomerDetails.classList.add('hidden');
    elements.posCustomerSearch.parentNode.classList.remove('hidden'); // Show search bar
    elements.posCustomerSearch.value = '';
    elements.posCustomerSearch.focus();
    
    updateCartUI();
}

/* ==========================================================================
   Checkout Process & Receipt Generation
   ========================================================================== */
async function handleCheckout() {
    if (state.cart.length === 0) return;
    
    const cal = calculateTotals();
    const btn = elements.btnCheckout;
    
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader-2" class="animate-spin"></i> กำลังชำระเงิน...';
    lucide.createIcons();

    // Prepare order details mapping
    const orderData = {
        total_amount: cal.total,
        discount: cal.discount,
        points_earned: cal.pointsEarned,
        points_redeemed: cal.pointsRedeemed,
        customer_id: state.selectedCustomer ? state.selectedCustomer.id : null
    };

    // Prepare cart items details
    const cartItemsList = state.cart.map(item => ({
        name: item.product.name,
        qty: item.qty,
        price: item.product.price,
        category: item.product.category
    }));

    try {
        const order = await window.db.createOrder(orderData, cartItemsList);
        
        // Refresh local cache lists
        await fetchInitialData();

        // Open Receipt Modal
        showReceipt(order, cartItemsList, cal);
        showToast('คำสั่งซื้อเสร็จสมบูรณ์', `บิลเลขที่ ${order.id.slice(0,8)} ชำระเงินเรียบร้อย`);
        
    } catch (err) {
        showToast('ชำระเงินไม่สำเร็จ', err.message || 'มีข้อผิดพลาดบางอย่างเกิดขึ้น', 'error');
        btn.disabled = false;
        btn.innerHTML = '<i data-lucide="credit-card"></i> ชำระเงิน & รับแต้มสะสม';
        lucide.createIcons();
    }
}

function showReceipt(order, cartItemsList, cal) {
    elements.recBillId.innerText = '#' + order.id.slice(0, 8).toUpperCase();
    elements.recDate.innerText = formatDate(order.created_at);
    elements.recCashier.innerText = state.user.email.split('@')[0];
    
    // Customer profile info
    if (state.selectedCustomer) {
        // Customer was updated, retrieve the latest profile from cache to show final point balances
        const currentCust = state.customers.find(c => c.id === state.selectedCustomer.id);
        
        elements.recCustomerInfo.innerText = `${currentCust.name} (โทร: ${currentCust.phone})`;
        elements.recCustomerRow.classList.remove('hidden');
        
        // Point details
        const prevPoints = currentCust.points - cal.pointsEarned + cal.pointsRedeemed;
        elements.recLoyaltyPrev.innerText = prevPoints;
        elements.recLoyaltyEarned.innerText = `+${cal.pointsEarned}`;
        
        if (cal.pointsRedeemed > 0) {
            elements.recLoyaltyRedeemed.innerText = `-${cal.pointsRedeemed}`;
            elements.recLoyaltyRedeemedRow.classList.remove('hidden');
        } else {
            elements.recLoyaltyRedeemedRow.classList.add('hidden');
        }
        
        elements.recLoyaltyTotal.innerText = currentCust.points;
        elements.recLoyaltySection.classList.remove('hidden');
    } else {
        elements.recCustomerRow.classList.add('hidden');
        elements.recLoyaltySection.classList.add('hidden');
    }
    
    // Receipt Items List
    elements.recItems.innerHTML = '';
    cartItemsList.forEach(item => {
        const itemRow = document.createElement('div');
        itemRow.className = 'receipt-item-row';
        itemRow.innerHTML = `
            <span>${item.name} x ${item.qty}</span>
            <span>${formatCurrency(item.price * item.qty)}</span>
        `;
        elements.recItems.appendChild(itemRow);
    });
    
    // Summary values
    elements.recSubtotal.innerText = formatCurrency(cal.subtotal);
    if (cal.discount > 0) {
        elements.recDiscount.innerText = `-${formatCurrency(cal.discount)}`;
        elements.recDiscountRow.classList.remove('hidden');
    } else {
        elements.recDiscountRow.classList.add('hidden');
    }
    elements.recTotal.innerText = formatCurrency(cal.total);
    
    // Show Modal
    elements.receiptModal.classList.remove('hidden');
}

function closeReceiptAndReset() {
    elements.receiptModal.classList.add('hidden');
    clearCart();
    removeSelectedCustomer();
    renderProducts();
}

/* ==========================================================================
   Dashboard Metrics & Graphs Generator
   ========================================================================== */
async function loadDashboardData() {
    const loader = elements.btnRefreshDashboard;
    loader.disabled = true;
    loader.innerHTML = '<i class="animate-spin" data-lucide="refresh-cw"></i> กำลังโหลด...';
    lucide.createIcons();

    try {
        await fetchInitialData();
        
        // Process sales metrics
        const orders = state.orders;
        const customers = state.customers;
        
        // 1. Total Revenue today & cumulative orders
        let revenueToday = 0;
        let totalPointsIssued = 0;
        const todayStr = new Date().toDateString();

        orders.forEach(o => {
            totalPointsIssued += (o.points_earned || 0);
            const orderDateStr = new Date(o.created_at).toDateString();
            if (orderDateStr === todayStr) {
                revenueToday += parseFloat(o.total_amount);
            }
        });

        // Set KPI labels
        elements.kpiRevenue.innerText = formatCurrency(revenueToday);
        elements.kpiOrders.innerText = orders.length + ' รายการ';
        elements.kpiPoints.innerText = totalPointsIssued + ' แต้ม';
        elements.kpiMembers.innerText = customers.length + ' คน';

        // 2. Fetch popular products data
        renderPopularProducts();

        // 3. Render Sales Chart
        renderSalesChart();

        // 4. Render Transaction History Table
        renderTransactionHistory();

    } catch (err) {
        showToast('โหลดข้อมูลแดชบอร์ดล้มเหลว', err.message || 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้', 'error');
    } finally {
        loader.disabled = false;
        loader.innerHTML = '<i data-lucide="refresh-cw"></i> รีเฟรชข้อมูล';
        lucide.createIcons();
    }
}

// Aggregates and displays popular sold items lists
async function renderPopularProducts() {
    elements.popularProductsList.innerHTML = '';
    const itemSalesCount = {};

    try {
        // Iterate through orders
        for (const order of state.orders) {
            const items = await window.db.getOrderItems(order.id);
            items.forEach(item => {
                if (itemSalesCount[item.product_name]) {
                    itemSalesCount[item.product_name] += item.quantity;
                } else {
                    itemSalesCount[item.product_name] = item.quantity;
                }
            });
        }

        // Sort sold counts
        const sortedItems = Object.entries(itemSalesCount)
            .map(([name, qty]) => ({ name, qty }))
            .sort((a,b) => b.qty - a.qty)
            .slice(0, 5); // top 5

        if (sortedItems.length === 0) {
            elements.popularProductsList.innerHTML = `
                <div style="font-size:12px; color:var(--color-text-muted); text-align:center; padding: 20px 0;">
                    ไม่มีสถิติยอดขายขณะนี้
                </div>
            `;
            return;
        }

        sortedItems.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = 'popular-item';
            row.innerHTML = `
                <div class="popular-item-info">
                    <span class="popular-rank">${index + 1}</span>
                    <span class="popular-item-name">${item.name}</span>
                </div>
                <span class="popular-item-sales">${item.qty} ชิ้น</span>
            `;
            elements.popularProductsList.appendChild(row);
        });

    } catch (err) {
        console.error('Error loading popular products stats:', err);
    }
}

// Chart.js Graphing
function renderSalesChart() {
    if (state.chartInstance) {
        state.chartInstance.destroy();
    }

    const ctx = document.getElementById('salesChart').getContext('2d');
    
    // Group sales by day (for past 7 days)
    const salesByDay = {};
    const last7Days = [];
    
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayStr = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
        last7Days.push(dayStr);
        salesByDay[d.toDateString()] = { label: dayStr, total: 0 };
    }

    state.orders.forEach(o => {
        const oDate = new Date(o.created_at).toDateString();
        if (salesByDay[oDate] !== undefined) {
            salesByDay[oDate].total += parseFloat(o.total_amount);
        }
    });

    const datasetData = Object.values(salesByDay).map(v => v.total);

    state.chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last7Days,
            datasets: [{
                label: 'ยอดขายรายวัน (บาท)',
                data: datasetData,
                backgroundColor: 'rgba(124, 92, 67, 0.08)',
                borderColor: '#7C5C43',
                borderWidth: 3,
                tension: 0.35,
                fill: true,
                pointBackgroundColor: '#FFFFFF',
                pointBorderColor: '#7C5C43',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#F0ECE5'
                    },
                    ticks: {
                        callback: function(value) { return '฿' + value; },
                        font: { family: 'Prompt', size: 11 }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: { family: 'Prompt', size: 11 }
                    }
                }
            }
        }
    });
}

function renderTransactionHistory() {
    elements.recentOrdersTbody.innerHTML = '';
    
    const recent = state.orders.slice(0, 10); // Display 10 recent orders
    
    if (recent.length === 0) {
        elements.recentOrdersTbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; color:var(--color-text-muted);">
                    ยังไม่มีข้อมูลประวัติคำสั่งซื้อ
                </td>
            </tr>
        `;
        return;
    }

    recent.forEach(o => {
        const tr = document.createElement('tr');
        const custName = o.customers ? o.customers.name : 'ลูกค้าทั่วไป';
        const phone = o.customers ? `(${o.customers.phone})` : '';
        
        let pointActionText = '-';
        if (o.customer_id) {
            pointActionText = `<span style="color:var(--color-success)">+${o.points_earned}</span>`;
            if (o.points_redeemed > 0) {
                pointActionText += ` / <span style="color:var(--color-danger)">-${o.points_redeemed}</span>`;
            }
        }

        tr.innerHTML = `
            <td><strong>#${o.id.slice(0, 8).toUpperCase()}</strong></td>
            <td>${formatDate(o.created_at)}</td>
            <td>${custName} <small style="display:block;color:var(--color-text-muted)">${phone}</small></td>
            <td><strong>${formatCurrency(o.total_amount)}</strong></td>
            <td style="color:var(--color-danger)">${o.discount > 0 ? '-' + formatCurrency(o.discount) : '-'}</td>
            <td>${pointActionText}</td>
            <td>
                <button class="btn-icon-text btn-view-bill" data-id="${o.id}">
                    <i data-lucide="receipt" style="width:14px;height:14px;"></i> รายละเอียด
                </button>
            </td>
        `;

        // Bind bill view details click
        tr.querySelector('.btn-view-bill').addEventListener('click', async () => {
            try {
                const items = await window.db.getOrderItems(o.id);
                const calMock = {
                    subtotal: parseFloat(o.total_amount) + parseFloat(o.discount),
                    discount: parseFloat(o.discount),
                    pointsEarned: o.points_earned,
                    pointsRedeemed: o.points_redeemed,
                    total: parseFloat(o.total_amount)
                };
                
                // Set customer context from order profile
                state.selectedCustomer = o.customers ? { id: o.customer_id, name: o.customers.name, phone: o.customers.phone, points: 0 } : null;
                showReceipt(o, items, calMock);
            } catch (err) {
                showToast('ไม่สามารถดูใบเสร็จได้', err.message, 'error');
            }
        });

        elements.recentOrdersTbody.appendChild(tr);
    });

    lucide.createIcons();
}

/* ==========================================================================
   Customers Loyalty Management Tab
   ========================================================================== */
function loadCustomersList() {
    elements.customersListTbody.innerHTML = '';
    const query = elements.searchMemberList.value.trim().toLowerCase();

    const filtered = state.customers.filter(c => 
        c.name.toLowerCase().includes(query) || c.phone.includes(query)
    );

    if (filtered.length === 0) {
        elements.customersListTbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align:center; color:var(--color-text-muted);">
                    ไม่พบข้อมูลสมาชิกร้านกาแฟ
                </td>
            </tr>
        `;
        return;
    }

    filtered.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${c.name}</strong></td>
            <td>${c.phone}</td>
            <td>
                <span class="badge badge-online" style="font-size:12px; padding: 4px 12px; font-weight:700;">
                    ${c.points} แต้ม
                </span>
            </td>
            <td>${formatDate(c.created_at).split(' เวลา')[0]}</td>
        `;
        elements.customersListTbody.appendChild(tr);
    });
}

async function handleRegisterCustomer(e) {
    e.preventDefault();
    const name = document.getElementById('cust-name').value.trim();
    const phone = document.getElementById('cust-phone').value.trim();

    try {
        const newCust = await window.db.addCustomer(name, phone);
        elements.customerRegisterForm.reset();
        
        // Refresh cache
        await fetchInitialData();
        loadCustomersList();
        
        showToast('ลงทะเบียนสำเร็จ', `ลงทะเบียนสมาชิกคุณ ${newCust.name} เรียบร้อย`);
        
        // Auto select in POS if register was clicked from POS view drawer
        if (state.activeView === 'pos-view') {
            selectCustomer(newCust);
        }
    } catch (err) {
        showToast('ลงทะเบียนสมาชิกล้มเหลว', err.message, 'error');
    }
}

/* ==========================================================================
   Settings Tab (Supabase Credentials Configuration)
   ========================================================================== */
async function handleSaveSettings(e) {
    e.preventDefault();
    const url = document.getElementById('settings-url').value.trim();
    const key = document.getElementById('settings-key').value.trim();
    const btn = elements.btnSaveSettings;

    btn.disabled = true;
    btn.innerHTML = '<i class="animate-spin" data-lucide="loader-2"></i> กำลังทดสอบเชื่อมต่อ...';
    lucide.createIcons();

    try {
        await window.db.saveConfig(url, key);
        showToast('เชื่อมต่อสำเร็จ', 'บันทึกการตั้งค่า Supabase และเชื่อมโยงข้อมูลสำเร็จ');
        setupAppShell();
    } catch (err) {
        showToast('การเชื่อมต่อผิดพลาด', err.message, 'error');
        elements.statusDot.className = 'status-dot dot-offline';
        elements.statusText.innerText = 'เชื่อมต่อล้มเหลว: ' + err.message;
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i data-lucide="save"></i> บันทึกและทดสอบเชื่อมต่อ';
        lucide.createIcons();
    }
}

function handleClearSettings() {
    if (confirm('คุณต้องการยกเลิกการเชื่อมโยง Supabase และสลับไปใช้ระบบทดลอง Offline หรือไม่?')) {
        window.db.clearConfig();
        document.getElementById('settings-url').value = '';
        document.getElementById('settings-key').value = '';
        
        showToast('ล้างการเชื่อมต่อสำเร็จ', 'ระบบสลับกลับมาทำงานแบบ Offline Mock Mode');
        setupAppShell();
    }
}

/* ==========================================================================
   Event Bindings & Initialization on Page Load
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial Page Load Check Auth Status
    const storedUser = window.db.getCurrentUser();
    if (storedUser) {
        state.user = storedUser;
        setupAppShell();
    } else {
        elements.loginView.classList.remove('hidden');
        elements.appShell.classList.add('hidden');
    }
    
    // Create initial Lucide vector icons
    lucide.createIcons();

    // 2. Bind Auth Elements Events
    elements.loginForm.addEventListener('submit', handleLogin);
    elements.btnGuest.addEventListener('click', handleGuestLogin);
    elements.btnLogout.addEventListener('click', handleLogout);

    // 3. Navigation View Switch Bindings
    elements.navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetView = item.getAttribute('data-view');
            switchView(targetView);
        });
    });

    // 4. POS Catalog Bindings
    elements.searchProduct.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        renderProducts();
    });

    elements.categoryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            elements.categoryTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            state.activeCategory = tab.getAttribute('data-category');
            renderProducts();
        });
    });

    // 5. Cart Operations & Selection Bindings
    elements.btnClearCart.addEventListener('click', clearCart);
    elements.btnCheckout.addEventListener('click', handleCheckout);
    
    // Loyalty search box bindings
    elements.posCustomerSearch.addEventListener('input', handleCustomerSearch);
    elements.posCustomerSearch.addEventListener('focus', handleCustomerSearch);
    
    // Hide customer dropdown if clicked outside
    document.addEventListener('click', (e) => {
        if (!elements.posCustomerSearch.contains(e.target) && !elements.customerSearchDropdown.contains(e.target)) {
            elements.customerSearchDropdown.classList.add('hidden');
        }
    });

    elements.btnRemoveCustomerPos.addEventListener('click', removeSelectedCustomer);
    
    // Point redeem checkbox toggle handler
    elements.chkRedeemPoints.addEventListener('change', (e) => {
        state.redeemChecked = e.target.checked;
        updateCartUI();
    });

    // POS register drawer redirect shortcuts
    elements.btnAddCustomerPos.addEventListener('click', () => {
        switchView('customers-view');
        elements.searchMemberList.value = '';
        setTimeout(() => {
            document.getElementById('cust-name').focus();
        }, 100);
    });

    // 6. Customers Page Bindings
    elements.customerRegisterForm.addEventListener('submit', handleRegisterCustomer);
    elements.searchMemberList.addEventListener('input', loadCustomersList);

    // 7. Dashboard Refresh Binding
    elements.btnRefreshDashboard.addEventListener('click', loadDashboardData);

    // 8. Settings Page Bindings
    elements.settingsForm.addEventListener('submit', handleSaveSettings);
    elements.btnClearSettings.addEventListener('click', handleClearSettings);

    // 9. Receipt Modal Bindings
    elements.btnCloseReceipt.addEventListener('click', closeReceiptAndReset);
});
