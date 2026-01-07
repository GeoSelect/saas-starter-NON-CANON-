-- =====================================================
-- HOA PACKET PURCHASES & TRANSACTIONS
-- =====================================================

-- Add 'basic_buyer' to subscription_tier enum
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_subscription_tier_check;
ALTER TABLE public.users ADD CONSTRAINT users_subscription_tier_check 
  CHECK (subscription_tier IN ('free', 'basic_buyer', 'pro', 'enterprise'));

-- Transactions table for one-time purchases
CREATE TABLE IF NOT EXISTS public.hoa_packet_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  parcel_id VARCHAR(255) NOT NULL,
  property_address VARCHAR(255),
  property_city VARCHAR(100),
  property_state VARCHAR(2),
  property_zip VARCHAR(10),
  stripe_session_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_payment_intent_id VARCHAR(255),
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'usd',
  status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  customer_email VARCHAR(255) NOT NULL,
  downloaded_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User purchases history (for dashboard)
CREATE TABLE IF NOT EXISTS public.user_hoa_packet_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  parcel_id VARCHAR(255) NOT NULL,
  purchase_id UUID REFERENCES public.hoa_packet_purchases(id) ON DELETE SET NULL,
  access_level VARCHAR(50) DEFAULT 'full' CHECK (access_level IN ('preview', 'full')),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- NULL = lifetime access
  UNIQUE(user_id, parcel_id)
);

-- Webhook logs for debugging
CREATE TABLE IF NOT EXISTS public.stripe_webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id VARCHAR(255) UNIQUE NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  stripe_session_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'processed' CHECK (status IN ('received', 'processed', 'failed')),
  payload JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_hoa_purchases_user_id ON public.hoa_packet_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_hoa_purchases_parcel_id ON public.hoa_packet_purchases(parcel_id);
CREATE INDEX IF NOT EXISTS idx_hoa_purchases_status ON public.hoa_packet_purchases(status);
CREATE INDEX IF NOT EXISTS idx_hoa_purchases_stripe_session ON public.hoa_packet_purchases(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_hoa_purchases_created_at ON public.hoa_packet_purchases(created_at);
CREATE INDEX IF NOT EXISTS idx_hoa_purchases_customer_email ON public.hoa_packet_purchases(customer_email);

CREATE INDEX IF NOT EXISTS idx_user_packet_access_user_id ON public.user_hoa_packet_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_packet_access_parcel_id ON public.user_hoa_packet_access(parcel_id);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_id ON public.stripe_webhook_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON public.stripe_webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON public.stripe_webhook_logs(created_at);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.hoa_packet_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_hoa_packet_access ENABLE ROW LEVEL SECURITY;

-- Users can view only their own purchases
CREATE POLICY "users_view_own_purchases" 
  ON public.hoa_packet_purchases 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can view only their own access
CREATE POLICY "users_view_own_access"
  ON public.user_hoa_packet_access
  FOR SELECT
  USING (auth.uid() = user_id);
