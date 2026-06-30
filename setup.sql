-- ==========================================================================
-- SQL Script for Setting Up Supabase Database Tables (EspressoPOS)
-- Copy and execute this script inside the Supabase SQL Editor:
-- Dashboard -> SQL Editor -> New Query -> Paste & Click Run
-- ==========================================================================

-- 1. Create Customers Table (สมาชิกสะสมแต้ม)
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    points INT DEFAULT 0 CHECK (points >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Orders Table (ข้อมูลบิลคำสั่งซื้อ)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    total_amount DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) DEFAULT 0.00,
    points_earned INT DEFAULT 0 CHECK (points_earned >= 0),
    points_redeemed INT DEFAULT 0 CHECK (points_redeemed >= 0),
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Order Items Table (รายการสินค้าของแต่ละบิล)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(50) NOT NULL
);

-- ==========================================================================
-- ROW LEVEL SECURITY (RLS) CONFIGURATION
-- By default, Supabase tables require authentication rules to read/write.
-- To allow the POS client to sync data, choose ONE of the options below:
-- ==========================================================================

-- OPTION A: Disable RLS for development/quick test (easiest for testing)
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;

-- OPTION B: Enable RLS and allow authenticated staff users to perform operations (Recommended for production)
/*
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Policy for customers table
CREATE POLICY "Allow authenticated staff to manage customers" 
ON public.customers 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Policy for orders table
CREATE POLICY "Allow authenticated staff to manage orders" 
ON public.orders 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Policy for order_items table
CREATE POLICY "Allow authenticated staff to manage order items" 
ON public.order_items 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);
*/

-- ==========================================================================
-- STAFF USERS SETUP (AUTHENTICATION)
-- ==========================================================================
-- To create staff/cashier accounts to login to the POS system:
-- 1. Go to your Supabase Dashboard -> Authentication -> Users
-- 2. Click "Add User" -> "Create User"
-- 3. Enter the email (e.g. cashier1@coffee.com) and a password (at least 6 characters)
-- 4. Uncheck "Auto-confirm user?" or confirm the email directly in dashboard.
-- 5. Use these credentials to sign in to the EspressoPOS login screen!
-- ==========================================================================
