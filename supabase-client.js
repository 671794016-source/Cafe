/* ==========================================================================
   Supabase Database Client & Offline Mock Integration Layer
   ========================================================================== */

const CONFIG_KEY_URL = 'espresso_pos_supabase_url';
const CONFIG_KEY_KEY = 'espresso_pos_supabase_key';

class SupabaseClientManager {
    constructor() {
        this.supabase = null;
        this.url = localStorage.getItem(CONFIG_KEY_URL) || '';
        this.key = localStorage.getItem(CONFIG_KEY_KEY) || '';
        this.initClient();
    }

    // Initialize Supabase if credentials are present
    initClient() {
        if (this.url && this.key) {
            try {
                // supabase is loaded via script tag in HTML
                if (typeof supabase !== 'undefined') {
                    this.supabase = supabase.createClient(this.url, this.key);
                } else {
                    console.error('Supabase SDK not loaded in HTML');
                }
            } catch (err) {
                console.error('Failed to initialize Supabase client:', err);
                this.supabase = null;
            }
        } else {
            this.supabase = null;
        }
    }

    // Save configurations
    async saveConfig(url, key) {
        // Validate URL format
        if (!url.startsWith('https://')) {
            throw new Error('Supabase URL ต้องขึ้นต้นด้วย https://');
        }

        // Test credentials by making a dummy fetch or testing connection
        try {
            const testClient = supabase.createClient(url, key);
            // Try to query a random table or check user (will return auth error or standard response)
            // We just query customers table with a limit of 1
            const { data, error } = await testClient.from('customers').select('*').limit(1);
            
            // If connection fails due to network/CORS/invalid URL
            if (error && error.message.includes('Failed to fetch')) {
                throw new Error('ไม่สามารถเชื่อมต่อ Server ได้ กรุณาตรวจสอบ URL');
            }
        } catch (err) {
            // If it's an API schema error (table doesn't exist yet), that's fine (means connected but no tables)
            if (err.message && err.message.includes('relation "customers" does not exist')) {
                // Table doesn't exist, but credentials are valid!
                console.log('Connected! (Need to create tables)');
            } else {
                throw new Error('การเชื่อมต่อล้มเหลว: ' + (err.message || 'กรุณาตรวจสอบ URL และ Anon Key'));
            }
        }

        localStorage.setItem(CONFIG_KEY_URL, url);
        localStorage.setItem(CONFIG_KEY_KEY, key);
        this.url = url;
        this.key = key;
        this.initClient();
        return true;
    }

    // Clear settings
    clearConfig() {
        localStorage.removeItem(CONFIG_KEY_URL);
        localStorage.removeItem(CONFIG_KEY_KEY);
        this.url = '';
        this.key = '';
        this.supabase = null;
    }

    isConnected() {
        return this.supabase !== null;
    }

    /* ==========================================================================
       Authentication Methods
       ========================================================================== */
    async login(email, password) {
        if (this.isConnected()) {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: email,
                password: password
            });
            if (error) throw error;
            return { user: data.user, offline: false };
        } else {
            // Mock Login (Accepts any email ending with @coffee.com or guest credentials)
            if (email && password.length >= 6) {
                const mockUser = {
                    id: 'mock-user-123',
                    email: email,
                    role: 'authenticated'
                };
                localStorage.setItem('espresso_pos_mock_user', JSON.stringify(mockUser));
                return { user: mockUser, offline: true };
            } else {
                throw new Error('กรุณากรอกรหัสผ่านอย่างน้อย 6 ตัวอักษร');
            }
        }
    }

    getCurrentUser() {
        if (this.isConnected()) {
            // Returns current supabase user
            const session = this.supabase.auth.getSession();
            return session ? session.user : null;
        } else {
            const mock = localStorage.getItem('espresso_pos_mock_user');
            return mock ? JSON.parse(mock) : null;
        }
    }

    logout() {
        if (this.isConnected()) {
            this.supabase.auth.signOut();
        }
        localStorage.removeItem('espresso_pos_mock_user');
    }

    /* ==========================================================================
       Customers & Loyalty Database Methods
       ========================================================================== */
    // Get all customers
    async getCustomers() {
        if (this.isConnected()) {
            const { data, error } = await this.supabase
                .from('customers')
                .select('*')
                .order('name', { ascending: true });
            if (error) throw error;
            return data;
        } else {
            return this.getMockCustomers();
        }
    }

    // Register a new customer
    async addCustomer(name, phone) {
        if (this.isConnected()) {
            const { data, error } = await this.supabase
                .from('customers')
                .insert([{ name, phone, points: 0 }])
                .select();
            if (error) {
                if (error.code === '23505') throw new Error('เบอร์โทรศัพท์นี้ถูกใช้ลงทะเบียนไปแล้ว');
                throw error;
            }
            return data[0];
        } else {
            const customers = this.getMockCustomers();
            const exists = customers.find(c => c.phone === phone);
            if (exists) throw new Error('เบอร์โทรศัพท์นี้ถูกใช้ลงทะเบียนไปแล้ว');

            const newCust = {
                id: 'cust-' + Date.now(),
                name,
                phone,
                points: 0,
                created_at: new Date().toISOString()
            };
            customers.push(newCust);
            this.saveMockCustomers(customers);
            return newCust;
        }
    }

    // Update customer points
    async updateCustomerPoints(id, pointsChange) {
        if (this.isConnected()) {
            // First fetch current points
            const { data: customer, error: fetchErr } = await this.supabase
                .from('customers')
                .select('points')
                .eq('id', id)
                .single();
            
            if (fetchErr) throw fetchErr;
            
            const newPoints = Math.max(0, (customer.points || 0) + pointsChange);
            
            const { data, error } = await this.supabase
                .from('customers')
                .update({ points: newPoints })
                .eq('id', id)
                .select();
            
            if (error) throw error;
            return data[0];
        } else {
            const customers = this.getMockCustomers();
            const index = customers.findIndex(c => c.id === id);
            if (index !== -1) {
                customers[index].points = Math.max(0, customers[index].points + pointsChange);
                this.saveMockCustomers(customers);
                return customers[index];
            }
            throw new Error('ไม่พบข้อมูลลูกค้า');
        }
    }

    /* ==========================================================================
       Orders Database Methods
       ========================================================================== */
    // Get all orders
    async getOrders() {
        if (this.isConnected()) {
            const { data, error } = await this.supabase
                .from('orders')
                .select('*, customers(name, phone)')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        } else {
            const orders = this.getMockOrders();
            const customers = this.getMockCustomers();
            
            // Map customer details to orders
            return orders.map(o => ({
                ...o,
                customers: customers.find(c => c.id === o.customer_id) || null
            })).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
        }
    }

    // Save order + order items
    async createOrder(orderData, cartItems) {
        if (this.isConnected()) {
            // Insert into orders table
            const { data: order, error: orderErr } = await this.supabase
                .from('orders')
                .insert([{
                    total_amount: orderData.total_amount,
                    discount: orderData.discount,
                    points_earned: orderData.points_earned,
                    points_redeemed: orderData.points_redeemed,
                    customer_id: orderData.customer_id || null
                }])
                .select();

            if (orderErr) throw orderErr;
            const newOrder = order[0];

            // Prepare order items
            const itemsToInsert = cartItems.map(item => ({
                order_id: newOrder.id,
                product_name: item.name,
                quantity: item.qty,
                price: item.price,
                category: item.category
            }));

            // Insert into order_items
            const { error: itemsErr } = await this.supabase
                .from('order_items')
                .insert(itemsToInsert);

            if (itemsErr) {
                // If items fail, clean up order
                await this.supabase.from('orders').delete().eq('id', newOrder.id);
                throw itemsErr;
            }

            // If a customer is selected, update their points
            if (orderData.customer_id) {
                const pointsDelta = orderData.points_earned - orderData.points_redeemed;
                await this.updateCustomerPoints(orderData.customer_id, pointsDelta);
            }

            return newOrder;
        } else {
            const orders = this.getMockOrders();
            const orderItems = this.getMockOrderItems();
            
            const newOrderId = 'order-' + Date.now();
            const newOrder = {
                id: newOrderId,
                total_amount: orderData.total_amount,
                discount: orderData.discount,
                points_earned: orderData.points_earned,
                points_redeemed: orderData.points_redeemed,
                customer_id: orderData.customer_id || null,
                created_at: new Date().toISOString()
            };
            
            // Add order
            orders.push(newOrder);
            this.saveMockOrders(orders);

            // Add order items
            cartItems.forEach(item => {
                orderItems.push({
                    id: 'item-' + Math.random().toString(36).substr(2, 9),
                    order_id: newOrderId,
                    product_name: item.name,
                    quantity: item.qty,
                    price: item.price,
                    category: item.category
                });
            });
            this.saveMockOrderItems(orderItems);

            // Update local customer points
            if (orderData.customer_id) {
                const pointsDelta = orderData.points_earned - orderData.points_redeemed;
                this.updateCustomerPoints(orderData.customer_id, pointsDelta);
            }

            return newOrder;
        }
    }

    // Get order items for specific order
    async getOrderItems(orderId) {
        if (this.isConnected()) {
            const { data, error } = await this.supabase
                .from('order_items')
                .select('*')
                .eq('order_id', orderId);
            if (error) throw error;
            return data;
        } else {
            const items = this.getMockOrderItems();
            return items.filter(item => item.order_id === orderId);
        }
    }

    /* ==========================================================================
       Offline Storage Mock Data Handlers (Out-of-the-box Data)
       ========================================================================== */
    getMockCustomers() {
        const data = localStorage.getItem('espresso_pos_mock_customers');
        if (data) return JSON.parse(data);

        // Prepopulate with seed customers
        const seed = [
            { id: 'cust-1', name: 'คุณ สมชาย ใจดี', phone: '0891234567', points: 45, created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
            { id: 'cust-2', name: 'คุณ อารี รักดี', phone: '0812345678', points: 8, created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
            { id: 'cust-3', name: 'คุณ นารี สีชมพู', phone: '0855556666', points: 95, created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }
        ];
        this.saveMockCustomers(seed);
        return seed;
    }

    saveMockCustomers(customers) {
        localStorage.setItem('espresso_pos_mock_customers', JSON.stringify(customers));
    }

    getMockOrders() {
        const data = localStorage.getItem('espresso_pos_mock_orders');
        if (data) return JSON.parse(data);

        // Generate some sample orders from the last 7 days
        const seed = [];
        const baseTime = Date.now();
        
        // 5 random past orders
        const ordersMeta = [
            { customer_id: 'cust-1', total: 165, discount: 0, points_earned: 3, points_redeemed: 0, daysAgo: 4, hoursAgo: 2 },
            { customer_id: 'cust-2', total: 95, discount: 0, points_earned: 1, points_redeemed: 0, daysAgo: 3, hoursAgo: 4 },
            { customer_id: 'cust-3', total: 120, discount: 50, points_earned: 3, points_redeemed: 10, daysAgo: 2, hoursAgo: 1 },
            { customer_id: null, total: 65, discount: 0, points_earned: 0, points_redeemed: 0, daysAgo: 1, hoursAgo: 5 },
            { customer_id: 'cust-1', total: 110, discount: 0, points_earned: 2, points_redeemed: 0, daysAgo: 0, hoursAgo: 3 }
        ];

        ordersMeta.forEach((o, index) => {
            const time = new Date(baseTime - (o.daysAgo * 24 * 60 * 60 * 1000) - (o.hoursAgo * 60 * 60 * 1000));
            seed.push({
                id: `order-seed-${index + 1}`,
                total_amount: o.total,
                discount: o.discount,
                points_earned: o.points_earned,
                points_redeemed: o.points_redeemed,
                customer_id: o.customer_id,
                created_at: time.toISOString()
            });
        });

        this.saveMockOrders(seed);
        return seed;
    }

    saveMockOrders(orders) {
        localStorage.setItem('espresso_pos_mock_orders', JSON.stringify(orders));
    }

    getMockOrderItems() {
        const data = localStorage.getItem('espresso_pos_mock_order_items');
        if (data) return JSON.parse(data);

        // Seed details matching our orders above
        const seed = [
            // Order 1 (165)
            { id: 'item-1', order_id: 'order-seed-1', product_name: 'Espresso (เอสเปรสโซ่)', quantity: 2, price: 50.00, category: 'coffee' },
            { id: 'item-2', order_id: 'order-seed-1', product_name: 'Croissant (ครัวซองต์ฝรั่งเศส)', quantity: 1, price: 65.00, category: 'bakery' },
            
            // Order 2 (95)
            { id: 'item-3', order_id: 'order-seed-2', product_name: 'Caffe Latte (ลาเต้ร้อน)', quantity: 1, price: 60.00, category: 'coffee' },
            { id: 'item-4', order_id: 'order-seed-2', product_name: 'Espresso (เอสเปรสโซ่)', quantity: 1, price: 35.00, category: 'coffee' }, // Ice/hot diff
            
            // Order 3 (120 after 50 discount)
            { id: 'item-5', order_id: 'order-seed-3', product_name: 'Caffe Latte (ลาเต้ร้อน)', quantity: 2, price: 60.00, category: 'coffee' },
            { id: 'item-6', order_id: 'order-seed-3', product_name: 'Strawberry Shortcake (เค้กสตรอว์เบอร์รี่)', quantity: 1, price: 50.00, category: 'bakery' },
            
            // Order 4 (65)
            { id: 'item-7', order_id: 'order-seed-4', product_name: 'Croissant (ครัวซองต์ฝรั่งเศส)', quantity: 1, price: 65.00, category: 'bakery' },
            
            // Order 5 (110)
            { id: 'item-8', order_id: 'order-seed-5', product_name: 'Espresso (เอสเปรสโซ่)', quantity: 1, price: 50.00, category: 'coffee' },
            { id: 'item-9', order_id: 'order-seed-5', product_name: 'Caffe Latte (ลาเต้ร้อน)', quantity: 1, price: 60.00, category: 'coffee' }
        ];

        this.saveMockOrderItems(seed);
        return seed;
    }

    saveMockOrderItems(items) {
        localStorage.setItem('espresso_pos_mock_order_items', JSON.stringify(items));
    }
}

// Make globally available
window.db = new SupabaseClientManager();
