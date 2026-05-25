# 🚀 Guida Setup Supabase per AgriSafe

Segui questi passaggi per configurare il backend completo dell'applicazione.

## 📋 Step 1: Crea Progetto Supabase

1. Vai su https://supabase.com
2. Clicca "Start your project" e registrati (gratuito)
3. Clicca "New Project"
4. Compila:
   - **Name**: AgriSafe
   - **Database Password**: [scegli una password sicura e salvala!]
   - **Region**: Europe (Frankfurt o Amsterdam)
   - **Pricing Plan**: Free
5. Clicca "Create new project" (ci vorranno ~2 minuti)

## 📊 Step 2: Esegui lo Schema Database

1. Nel dashboard Supabase, vai su **SQL Editor** (icona nel menu laterale)
2. Clicca "+ New query"
3. Copia tutto il contenuto del file `supabase/schema.sql`
4. Incolla nell'editor SQL
5. Clicca "Run" (in basso a destra)
6. Verifica che appaia "Success. No rows returned" (è normale!)

### Verifica che tutto sia stato creato:

Esegui questa query nel SQL Editor:
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

Dovresti vedere queste tabelle:
- `products`
- `user_products`
- `access_logs`
- `user_profiles`

## 🔑 Step 3: Ottieni le Chiavi API

1. Nel dashboard, vai su **Project Settings** (icona ingranaggio in basso)
2. Clicca su **API**
3. Troverai:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGc...` (chiave pubblica)
   - **service_role key**: `eyJhbGc...` (chiave privata - NON condividere!)

4. **IMPORTANTE**: Copia questi valori, li useremo nella prossima fase!

## 🔐 Step 4: Configura Autenticazione

1. Vai su **Authentication** → **Providers**
2. Assicurati che **Email** sia abilitato (di default lo è)
3. Configura:
   - **Enable email confirmations**: Disabilita per testing (abilita in produzione)
   - **Enable email change confirmations**: Disabilita per testing

### Opzionale - Personalizza Email Templates:

Vai su **Authentication** → **Email Templates** per personalizzare:
- Email di conferma
- Email di reset password
- Email di invito

## 📱 Step 5: Configura l'App

Crea un file `.env` nella root del progetto:

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# NON mettere la service_role key qui! È solo per backend sicuro
```

**⚠️ IMPORTANTE**:
- Aggiungi `.env` al `.gitignore`
- Non committare mai le chiavi API su GitHub
- La `anon key` è sicura da usare lato client (ha RLS)

## 🧪 Step 6: Test del Database

### Test 1: Verifica prodotti di esempio

Nel SQL Editor, esegui:
```sql
SELECT * FROM public.products;
```

Dovresti vedere 4 prodotti di esempio.

### Test 2: Verifica RLS (Row Level Security)

Nel SQL Editor, esegui:
```sql
-- Questo dovrebbe restituire 0 righe (nessun utente loggato)
SELECT * FROM public.products;
```

Se RLS funziona correttamente, vedrai 0 righe (perché non sei autenticato come utente dell'app).

### Test 3: Crea un utente di test

1. Vai su **Authentication** → **Users**
2. Clicca "Add user" → "Create new user"
3. Inserisci:
   - Email: `test@agrisafe.com`
   - Password: `Test123!`
   - Email Confirm: Spunta (per saltare conferma)
4. Clicca "Create user"

## 🎯 Step 7: Test Attivazione Prodotto

Nel SQL Editor, testa la funzione di attivazione:

```sql
-- Sostituisci USER_ID con l'ID dell'utente test che hai creato
-- (Lo trovi in Authentication → Users)

SELECT public.activate_product(
    'AGS-BH-001',           -- serial_number
    'ACTIV-BH-001',         -- activation_code
    'USER_ID_QUI'::uuid     -- user_id
);
```

Se funziona, vedrai:
```json
{"success": true, "product_id": "..."}
```

Verifica l'associazione:
```sql
SELECT * FROM public.user_products;
```

## 📊 Step 8: Dashboard di Monitoraggio

Supabase offre dashboard integrate:

1. **Table Editor**: Visualizza e modifica dati direttamente
2. **Authentication**: Gestisci utenti
3. **Database**: Vedi struttura e relazioni
4. **API Docs**: Documentazione auto-generata delle API

## 🔄 Step 9: Prossimi Passi

Ora che il database è pronto:

1. ✅ Database configurato
2. ✅ Tabelle create
3. ✅ RLS abilitato
4. ✅ Funzioni create

**Prossimo**: Installare le dipendenze nell'app e configurare il client Supabase!

## 🆘 Troubleshooting

### Errore: "permission denied for schema public"
**Soluzione**: Assicurati di essere connesso come proprietario del progetto.

### Errore: "relation already exists"
**Soluzione**: Lo schema è già stato eseguito. Puoi saltare questo step.

### Non vedo i prodotti di esempio
**Soluzione**: Controlla che l'ultima parte dello script (INSERT) sia stata eseguita.

### RLS blocca tutto
**Soluzione**: Perfetto! È così che deve funzionare. Gli utenti vedranno solo i loro dati quando saranno autenticati dall'app.

## 📚 Risorse Utili

- [Supabase Docs](https://supabase.com/docs)
- [RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)

## ✅ Checklist Finale

Prima di procedere, assicurati di aver:

- [ ] Creato progetto Supabase
- [ ] Eseguito schema.sql con successo
- [ ] Copiato Project URL e anon key
- [ ] Creato file .env con le configurazioni
- [ ] Testato creazione utente
- [ ] Testato funzione activate_product
- [ ] Verificato che RLS funzioni correttamente

---

**Pronto?** Procediamo con l'installazione delle dipendenze nell'app! 🚀
