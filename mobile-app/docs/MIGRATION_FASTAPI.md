# Migrazione da Supabase a Backend FastAPI

Documentazione per la migrazione dal backend Supabase al backend FastAPI custom.

## 🎯 Obiettivo

Sostituire l'integrazione con Supabase (autenticazione e database cloud) con il backend FastAPI hostato su `http://your-server-ip:8000`.

## 📋 Modifiche Effettuate

### 1. Nuovi File Creati

#### Configurazione
- **`config/api.ts`**: Configurazione URL backend e endpoints
  - Base URL: `http://your-server-ip:8000`
  - Tutti gli endpoints API
  - Headers default

#### Types
- **`types/api.ts`**: Types TypeScript generati da OpenAPI spec
  - `UserResponse`, `UserLogin`, `Token`
  - `ArniaConStato`, `LetturaResponse`, `AttivitaResponse`
  - Utilities e response types

#### Services
- **`services/api-client.ts`**: Client HTTP per FastAPI
  - Gestione autenticazione JWT (Bearer token)
  - Storage token in AsyncStorage
  - Timeout e error handling
  - Metodi GET, POST, PUT, DELETE

- **`services/fastapi-auth-service.ts`**: Servizio autenticazione
  - Login/Logout con JWT
  - Gestione sessione utente
  - Sostituto di `auth-service.ts` (Supabase)

- **`services/fastapi-beehive-service.ts`**: Servizio dati arnie
  - Caricamento arnie utente
  - Letture sensori (temperatura, umidità, peso)
  - Serie temporali per grafici
  - Gestione attività
  - Sostituto di `beehive-data-service.ts` (ThingSpeak)

#### Context
- **`contexts/FastAPIAuthContext.tsx`**: Context autenticazione FastAPI
  - Sostituisce `AuthContext.tsx` (Supabase)
  - Gestione stato utente con JWT
  - No dependency da `@supabase/supabase-js`

### 2. File da Aggiornare nell'App

Per completare la migrazione, devi aggiornare questi file:

#### `app/_layout.tsx`
```tsx
// PRIMA (Supabase)
import { AuthProvider } from '@/contexts/AuthContext';

// DOPO (FastAPI)
import { AuthProvider } from '@/contexts/FastAPIAuthContext';
```

#### Schermate che usano dati arnie
Sostituire gli import:

```tsx
// PRIMA
import { loadBeehivesData } from '@/services/beehive-data-service';

// DOPO
import { loadBeehivesData } from '@/services/fastapi-beehive-service';
```

File da aggiornare:
- `app/(tabs)/beehives.tsx`
- `app/(tabs)/index.tsx`
- Qualsiasi componente che carica dati arnie

## 🔐 Autenticazione

### Come Funziona

1. **Login**:
   - POST `/api/auth/login` con email e password
   - Ricevi `access_token` e `refresh_token`
   - Token salvati in AsyncStorage

2. **Request Autenticate**:
   - Header: `Authorization: Bearer {access_token}`
   - Gestito automaticamente da `apiClient`

3. **Logout**:
   - Cancellazione token da AsyncStorage
   - No chiamata API necessaria

### Differenze con Supabase

| Supabase | FastAPI |
|----------|---------|
| `User` object | `UserResponse` object |
| `Session` object | JWT token (string) |
| `onAuthStateChange()` | Manual token check |
| Email verification | No (admin creates users) |
| Password reset email | No (admin resets) |

## 📊 API Endpoints Disponibili

### Autenticazione
- `POST /api/auth/login` - Login utente
- `GET /api/auth/me` - Dati utente corrente

### Arnie (Utente)
- `GET /api/user/arnie` - Lista arnie
- `GET /api/user/arnie/{id}` - Dettagli arnia
- `GET /api/user/arnie/{id}/letture` - Letture complete
- `GET /api/user/arnie/{id}/letture/temperatura` - Serie temperatura
- `GET /api/user/arnie/{id}/letture/umidita` - Serie umidità
- `GET /api/user/arnie/{id}/letture/peso` - Serie peso
- `GET /api/user/arnie/{id}/attivita` - Log attività
- `POST /api/user/arnie/{id}/attivita` - Crea attività

### Admin (richiede ruolo admin)
- Gestione utenti, arnie, nodi, letture

## 📱 Formato Dati

### Arnia con Stato

```typescript
{
  id_arnia: 1,
  id_nodo: "NODE001",
  id_sensore_fisico: "SENSOR01",
  nome_arnia: "Arnia Nord",
  descrizione: "Prima arnia apiario nord",
  posizione: "Apiario Nord, Fila 1",
  latitudine: "45.464200",
  longitudine: "9.190000",
  attiva: true,
  ultima_temperatura: "34.5",
  ultima_umidita: "65.0",
  ultimo_peso: "42.5",
  ultimo_aggiornamento: "2024-02-15T10:30:00Z"
}
```

### Lettura Sensori

```typescript
{
  id_lettura: 1234,
  id_arnia: 1,
  id_nodo: "NODE001",
  timestamp: "2024-02-15T10:30:00Z",
  temperatura: "34.5",
  umidita: "65.0",
  peso: "42.5",
  dati_raw: { /* dati extra */ }
}
```

## 🔨 Testing

### 1. Test Login

```bash
curl -X POST http://your-server-ip:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"utente@test.local","password":"YOUR_USER_PASSWORD"}'
```

### 2. Test Arnie (con token)

```bash
TOKEN="your_access_token_here"

curl http://your-server-ip:8000/api/user/arnie \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Test Letture

```bash
curl "http://your-server-ip:8000/api/user/arnie/1/letture?limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

## ⚠️ Limitazioni Note

1. **Registrazione Utenti**:
   - Non disponibile pubblicamente
   - Solo admin può creare utenti

2. **Password Reset**:
   - Non disponibile via email
   - Solo admin può resettare password

3. **Email Verification**:
   - Non implementato
   - Utenti attivi di default

4. **Refresh Token**:
   - Implementato ma non ancora gestito nel client
   - TODO: Auto-refresh quando access token scade

## 📝 TODO List

- [ ] Implementare auto-refresh token
- [ ] Gestire scadenza token (401 response)
- [ ] Aggiungere cache locale per dati arnie
- [ ] Implementare offline mode con sync
- [ ] Aggiornare tutte le schermate per usare nuovi services
- [ ] Rimuovere dipendenze Supabase da package.json
- [ ] Test completo su dispositivo reale

## 🚀 Deploy Steps

1. **Aggiorna Context**:
   ```tsx
   // app/_layout.tsx
   import { AuthProvider } from '@/contexts/FastAPIAuthContext';
   ```

2. **Aggiorna Import Services**:
   Cerca e sostituisci in tutti i file:
   ```
   beehive-data-service → fastapi-beehive-service
   auth-service → fastapi-auth-service
   ```

3. **Test Completo**:
   - Login
   - Visualizzazione arnie
   - Visualizzazione grafici
   - Creazione attività
   - Logout

4. **Cleanup (opzionale)**:
   - Rimuovi file vecchi (quando sei sicuro che tutto funzioni)
   - Rimuovi dipendenze Supabase da package.json
   - Aggiorna README principale

## 📚 Risorse

- **API Docs**: http://your-server-ip:8000/docs
- **OpenAPI Spec**: http://your-server-ip:8000/openapi.json
- **Server README**: `../server/README.md`

---

**Data Migrazione**: 2026-03-13
**Backend Version**: 1.0.0
**Status**: ✅ Services created, ⏳ Integration pending
