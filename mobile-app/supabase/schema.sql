-- =============================================================================
-- SCHEMA DATABASE AGRISAFE
-- =============================================================================
-- Questo script crea tutte le tabelle necessarie per AgriSafe su Supabase
-- Esegui questo script nella sezione SQL Editor di Supabase Dashboard
-- =============================================================================

-- Abilita l'estensione UUID (se non già abilitata)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- TABELLA: products
-- Prodotti fisici venduti (arnie, sensori, sistemi irrigazione)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    serial_number TEXT UNIQUE NOT NULL,
    activation_code TEXT UNIQUE NOT NULL,
    product_type TEXT NOT NULL CHECK (product_type IN ('beehive', 'soil_sensor', 'irrigation_system')),
    product_name TEXT,
    thingspeak_channel_id TEXT NOT NULL,
    thingspeak_read_key TEXT,
    status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'maintenance')),
    manufactured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    activated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_products_serial ON public.products(serial_number);
CREATE INDEX IF NOT EXISTS idx_products_activation ON public.products(activation_code);
CREATE INDEX IF NOT EXISTS idx_products_type ON public.products(product_type);

-- =============================================================================
-- TABELLA: user_products
-- Associazione utente-prodotto (chi può vedere cosa)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.user_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    access_level TEXT NOT NULL DEFAULT 'owner' CHECK (access_level IN ('owner', 'viewer')),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_user_products_user ON public.user_products(user_id);
CREATE INDEX IF NOT EXISTS idx_user_products_product ON public.user_products(product_id);

-- =============================================================================
-- TABELLA: access_logs
-- Log degli accessi (opzionale, per analytics)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    metadata JSONB,
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indice per query temporali
CREATE INDEX IF NOT EXISTS idx_access_logs_time ON public.access_logs(accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_logs_user ON public.access_logs(user_id);

-- =============================================================================
-- TABELLA: user_profiles
-- Profili utente estesi (informazioni aggiuntive oltre auth.users)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    company_name TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    country TEXT DEFAULT 'IT',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- FUNZIONI: Trigger per updated_at
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger per aggiornare updated_at automaticamente
CREATE TRIGGER products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- FUNZIONI: Attivazione prodotto
-- =============================================================================
CREATE OR REPLACE FUNCTION public.activate_product(
    p_serial_number TEXT,
    p_activation_code TEXT,
    p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_product_id UUID;
    v_result JSON;
BEGIN
    -- Verifica che il prodotto esista e il codice sia corretto
    SELECT id INTO v_product_id
    FROM public.products
    WHERE serial_number = p_serial_number
      AND activation_code = p_activation_code
      AND status = 'inactive';

    IF v_product_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Prodotto non trovato o già attivato'
        );
    END IF;

    -- Attiva il prodotto
    UPDATE public.products
    SET status = 'active',
        activated_at = NOW()
    WHERE id = v_product_id;

    -- Associa il prodotto all'utente
    INSERT INTO public.user_products (user_id, product_id, access_level)
    VALUES (p_user_id, v_product_id, 'owner');

    -- Log dell'attivazione
    INSERT INTO public.access_logs (user_id, product_id, action)
    VALUES (p_user_id, v_product_id, 'product_activated');

    RETURN json_build_object(
        'success', true,
        'product_id', v_product_id
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- Abilita la sicurezza a livello di riga per proteggere i dati
-- =============================================================================

-- Abilita RLS su tutte le tabelle
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- POLICY: products
-- =============================================================================

-- Gli utenti possono vedere solo i prodotti a cui hanno accesso
CREATE POLICY "Users can view their products"
    ON public.products FOR SELECT
    USING (
        id IN (
            SELECT product_id
            FROM public.user_products
            WHERE user_id = auth.uid()
        )
    );

-- Solo admin possono inserire nuovi prodotti (tramite service_role)
-- Utenti normali non possono inserire direttamente

-- Gli utenti possono aggiornare solo alcuni campi dei loro prodotti
CREATE POLICY "Users can update their product names"
    ON public.products FOR UPDATE
    USING (
        id IN (
            SELECT product_id
            FROM public.user_products
            WHERE user_id = auth.uid() AND access_level = 'owner'
        )
    )
    WITH CHECK (
        id IN (
            SELECT product_id
            FROM public.user_products
            WHERE user_id = auth.uid() AND access_level = 'owner'
        )
    );

-- =============================================================================
-- POLICY: user_products
-- =============================================================================

-- Gli utenti possono vedere le loro associazioni prodotto
CREATE POLICY "Users can view their product associations"
    ON public.user_products FOR SELECT
    USING (user_id = auth.uid());

-- Gli utenti possono creare associazioni solo per se stessi
CREATE POLICY "Users can create their own associations"
    ON public.user_products FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Gli owner possono cancellare le associazioni
CREATE POLICY "Owners can delete associations"
    ON public.user_products FOR DELETE
    USING (
        user_id = auth.uid()
        AND access_level = 'owner'
    );

-- =============================================================================
-- POLICY: access_logs
-- =============================================================================

-- Gli utenti possono vedere solo i loro log
CREATE POLICY "Users can view their own logs"
    ON public.access_logs FOR SELECT
    USING (user_id = auth.uid());

-- Gli utenti possono inserire i loro log
CREATE POLICY "Users can insert their own logs"
    ON public.access_logs FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- POLICY: user_profiles
-- =============================================================================

-- Gli utenti possono vedere solo il proprio profilo
CREATE POLICY "Users can view own profile"
    ON public.user_profiles FOR SELECT
    USING (id = auth.uid());

-- Gli utenti possono inserire solo il proprio profilo
CREATE POLICY "Users can insert own profile"
    ON public.user_profiles FOR INSERT
    WITH CHECK (id = auth.uid());

-- Gli utenti possono aggiornare solo il proprio profilo
CREATE POLICY "Users can update own profile"
    ON public.user_profiles FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- =============================================================================
-- FUNZIONE: Creazione automatica profilo utente
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, full_name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger per creare profilo quando si registra un nuovo utente
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- DATI DI TEST (opzionale - rimuovi in produzione)
-- =============================================================================

-- Inserisci alcuni prodotti di esempio
INSERT INTO public.products (serial_number, activation_code, product_type, product_name, thingspeak_channel_id, status)
VALUES
    ('AGS-BH-001', 'ACTIV-BH-001', 'beehive', 'Arnia Smart Pro', '1234567', 'inactive'),
    ('AGS-BH-002', 'ACTIV-BH-002', 'beehive', 'Arnia Smart Pro', '1234568', 'inactive'),
ON CONFLICT (serial_number) DO NOTHING;

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

-- Permetti agli utenti autenticati di eseguire la funzione di attivazione
GRANT EXECUTE ON FUNCTION public.activate_product TO authenticated;

-- =============================================================================
-- FINE SCHEMA
-- =============================================================================

-- Verifica che tutto sia stato creato correttamente
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
