# 🚀 AgriSafe - Riepilogo Implementazione Backend

## ✅ Cosa Abbiamo Implementato

### 1. **Database Supabase**
- ✅ Schema completo con 4 tabelle principali
- ✅ Row Level Security (RLS) configurata
- ✅ Funzione `activate_product()` per attivazione prodotti
- ✅ Trigger automatici per profili utente
- ✅ Log degli accessi

**File creati:**
- `supabase/schema.sql` - Schema database completo
- `supabase/SETUP_GUIDE.md` - Guida passo-passo per setup

### 2. **Configurazione App**
- ✅ Client Supabase configurato
- ✅ Tipi TypeScript per database
- ✅ Gestione sessioni con AsyncStorage

**File creati:**
- `lib/supabase.ts` - Client Supabase
- `types/database.ts` - Tipi TypeScript completi
- `.env.example` - Template configurazione

### 3. **Servizi Backend**
- ✅ Servizio autenticazione completo
- ✅ Servizio gestione prodotti
- ✅ Validazione input
- ✅ Gestione errori

**File creati:**
- `services/auth-service.ts` - Login, registrazione, profilo
- `services/product-service.ts` - CRUD prodotti, attivazione

### 4. **State Management**
- ✅ Context React per autenticazione globale
- ✅ Hook personalizzati
- ✅ Sincronizzazione automatica stato

**File creati:**
- `contexts/AuthContext.tsx` - Context autenticazione
- `app/_layout.tsx` - Integrato AuthProvider

### 5. **Integrazione ThingSpeak**
- ✅ Client API ThingSpeak
- ✅ Mapper dati
- ✅ Helper functions

**File creati:**
- `config/thingspeak.ts`
- `types/thingspeak.ts`
- `services/thingspeak-api.ts`
- `services/thingspeak-mapper.ts`

---

## 📋 Prossimi Passi per Completare

### Step 1: Setup Supabase (15 min)

1. Vai su https://supabase.com e crea progetto
2. Esegui `supabase/schema.sql` nel SQL Editor
3. Copia URL e anon key
4. Crea file `.env`:
   ```bash
   EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   ```

### Step 2: Creare Schermate UI (1-2 ore)

Devi creare queste schermate:

#### A. Schermata Login
**File:** `app/(auth)/login.tsx`

```typescript
import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn } = useAuth();
  const router = useRouter();

  async function handleLogin() {
    const result = await signIn({ email, password });
    if (result.success) {
      router.replace('/(tabs)');
    } else {
      alert(result.error);
    }
  }

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  input: { borderWidth: 1, padding: 10, marginBottom: 10, borderRadius: 5 },
});
```

#### B. Schermata Register
**File:** `app/(auth)/register.tsx`

Simile a login, usa `signUp()` invece di `signIn()`.

#### C. Schermata Attivazione Prodotto
**File:** `app/(auth)/activate.tsx`

```typescript
import { useState } from 'react';
import { View, TextInput, Button } from 'react-native';
import { activateProduct } from '@/services/product-service';

export default function ActivateScreen() {
  const [serial, setSerial] = useState('');
  const [code, setCode] = useState('');

  async function handleActivate() {
    const result = await activateProduct(serial, code);
    if (result.success) {
      alert('Prodotto attivato!');
    } else {
      alert(result.error);
    }
  }

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="Numero Seriale (es: AGS-BH-001)"
        value={serial}
        onChangeText={setSerial}
      />
      <TextInput
        placeholder="Codice Attivazione"
        value={code}
        onChangeText={setCode}
      />
      <Button title="Attiva" onPress={handleActivate} />
    </View>
  );
}
```

### Step 3: Proteggere Route con Auth

Aggiorna `app/(tabs)/_layout.tsx` per richiedere autenticazione:

```typescript
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function TabLayout() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/(auth)/login');
    }
  }, [user, loading]);

  if (loading) {
    return <Text>Caricamento...</Text>;
  }

  // ... resto del layout
}
```

### Step 4: Integrare ThingSpeak con Prodotti Utente

Modifica `app/(tabs)/index.tsx`:

```typescript
import { useAuth } from '@/contexts/AuthContext';
import { getUserProducts } from '@/services/product-service';
import { getAllFarmData } from '@/services/thingspeak-api';
import { mapFarmData } from '@/services/thingspeak-mapper';

export default function DashboardScreen() {
  const { user } = useAuth();
  const [farmData, setFarmData] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    // 1. Ottieni i prodotti dell'utente
    const productsResult = await getUserProducts();
    if (!productsResult.success) return;

    // 2. Estrai channel IDs dai prodotti
    const channels = productsResult.data.map(p => ({
      channelId: p.thingspeak_channel_id,
      params: {
        api_key: p.thingspeak_read_key,
        results: 100,
      },
    }));

    // 3. Carica dati da ThingSpeak
    const thingSpeakData = await getAllFarmData({ results: 100 });
    const data = mapFarmData(thingSpeakData);
    setFarmData(data);
  }

  // ... resto del componente
}
```

### Step 5: Aggiungi Logout e Profilo

Aggiungi un pulsante logout nella dashboard:

```typescript
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardScreen() {
  const { user, signOut } = useAuth();

  return (
    <View>
      <Text>Ciao, {user?.email}</Text>
      <Button title="Logout" onPress={signOut} />
    </View>
  );
}
```

---

## 🧪 Testing

### Test Manuale

1. **Test Registrazione:**
   - Apri app → Vai a Register
   - Registrati con email/password
   - Verifica creazione in Supabase Dashboard

2. **Test Login:**
   - Logout e fai login con credenziali
   - Verifica che entri nella dashboard

3. **Test Attivazione Prodotto:**
   - Usa codici di test dal database:
     - Serial: `AGS-BH-001`
     - Code: `ACTIV-BH-001`
   - Verifica associazione in tabella `user_products`

4. **Test Dati ThingSpeak:**
   - Configura un channel ThingSpeak di test
   - Verifica che i dati vengano mostrati

### Debug Comune

**Errore: "Supabase URL non configurato"**
- Soluzione: Crea file `.env` con le variabili

**Errore: "permission denied"**
- Soluzione: Verifica che RLS sia configurato correttamente

**Errore: "Invalid API key"**
- Soluzione: Controlla che hai copiato l'anon key (non service_role)

---

## 📊 Architettura Finale

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │
┌──────▼──────────────────────────────┐
│         React Native App            │
│  ┌────────────────────────────────┐ │
│  │  AuthContext (Global State)    │ │
│  └────────────────────────────────┘ │
│                                     │
│  ┌─────────────┐  ┌──────────────┐ │
│  │ Auth Screens│  │  Tab Screens │ │
│  │  - Login    │  │  - Dashboard │ │
│  │  - Register │  │  - Beehives  │ │
│  │  - Activate │  │  - Soil      │ │
│  └─────────────┘  └──────────────┘ │
└─────────┬───────────────┬───────────┘
          │               │
    ┌─────▼─────┐   ┌─────▼──────────┐
    │ Supabase  │   │  ThingSpeak    │
    │           │   │                │
    │ - Auth    │   │ - IoT Data     │
    │ - Database│   │ - Sensors      │
    │ - Storage │   │                │
    └───────────┘   └────────────────┘
```

---

## 💰 Costi Riassunti

### Sviluppo/Testing (GRATUITO)
- Supabase Free: 500MB DB, 50k MAU
- ThingSpeak Free: Letture ogni 15 sec
- Expo Go: Gratuito

### Produzione
- Supabase: Gratuito fino a limiti
- ThingSpeak: Gratuito uso base
- App Store: 99 USD/anno
- Google Play: 25 USD una tantum

---

## 🎯 Checklist Finale

Prima di andare in produzione:

- [ ] Setup Supabase completato
- [ ] Schermate Login/Register create
- [ ] Attivazione prodotto funzionante
- [ ] RLS testato e funzionante
- [ ] ThingSpeak integrato
- [ ] Test su iOS e Android
- [ ] Gestione errori implementata
- [ ] Privacy policy pronta
- [ ] Icon e splash screen preparati
- [ ] Build di test completati

---

## 📚 Risorse

- [Supabase Docs](https://supabase.com/docs)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [ThingSpeak API](https://www.mathworks.com/help/thingspeak/rest-api.html)
- [React Native](https://reactnative.dev/)

---

**Sei pronto per continuare?**
I servizi backend sono completi e funzionanti. Ora devi solo:
1. Fare setup Supabase (15 min)
2. Creare le 3 schermate UI (1-2 ore)
3. Testare il flusso completo

Vuoi che ti aiuti a creare le schermate UI oppure preferisci prima testare il backend?
