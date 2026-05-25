## 🔔 Sistema Notifiche Alert - Guida Completa

### ✅ **Cosa Ho Implementato**

#### **1. Database** ✅
- ✅ `alert_settings` - Configurazione alert per arnia
- ✅ `alert_logs` - Storico alert triggered
- ✅ `push_tokens` - Token dispositivi per push notifications
- ✅ Funzioni SQL helper per check automatici

#### **2. Servizi Backend** ✅
- ✅ `notification-service.ts` - Gestione Expo Push Notifications
- ✅ `alert-service.ts` - CRUD alert settings e logs
- ✅ Tipi TypeScript completi

#### **3. Dipendenze** ✅
- ✅ `expo-notifications` - Push notifications
- ✅ `expo-device` - Info dispositivo

---

## 🚀 **Setup Completo (30 minuti)**

### **Step 1: Aggiorna Database Supabase** (5 min)

1. Vai su Supabase Dashboard → **SQL Editor**
2. Apri `supabase/schema_alerts.sql`
3. Copia tutto e incolla nell'editor
4. Clicca **Run**
5. Verifica che appaia "Success"

**Verifica tabelle create:**
```sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('alert_settings', 'alert_logs', 'push_tokens');
```

Dovresti vedere 3 tabelle.

---

### **Step 2: Configura Expo Project ID** (2 min)

1. Apri `app.json` o `app.config.js`
2. Aggiungi/Verifica il campo `extra`:

```json
{
  "expo": {
    "name": "AgriSafe",
    "slug": "agrisafe",
    "extra": {
      "eas": {
        "projectId": "TUO_PROJECT_ID"
      }
    }
  }
}
```

**Ottenere Project ID:**
```bash
# Installa EAS CLI se non ce l'hai
npm install -g eas-cli

# Login
eas login

# Crea/Ottieni project ID
eas build:configure
```

Questo creerà un project ID e lo aggiungerà automaticamente.

---

### **Step 3: Crea Supabase Edge Function** (15 min)

#### **A. Installa Supabase CLI**

```bash
# macOS/Linux
brew install supabase/tap/supabase

# Oppure con npm
npm install -g supabase
```

#### **B. Inizializza Supabase nel progetto**

```bash
# Nella root del progetto
supabase init

# Login
supabase login
```

#### **C. Crea Edge Function**

```bash
# Crea funzione
supabase functions new check-alerts
```

Questo crea: `supabase/functions/check-alerts/index.ts`

#### **D. Implementa la Edge Function**

Sostituisci il contenuto di `supabase/functions/check-alerts/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const THINGSPEAK_BASE_URL = 'https://api.thingspeak.com'

serve(async (req) => {
  try {
    // Crea client Supabase con service_role per bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Ottieni ora corrente
    const now = new Date()
    const currentHour = now.getHours()

    console.log(`Checking alerts for hour: ${currentHour}`)

    // Ottieni alert attivi per questa ora
    const { data: alerts, error: alertsError } = await supabaseAdmin
      .rpc('get_active_alerts_for_check', { check_hour: currentHour })

    if (alertsError) {
      throw alertsError
    }

    console.log(`Found ${alerts?.length || 0} alerts to check`)

    // Per ogni alert, controlla ThingSpeak e invia notifiche
    const results = []

    for (const alert of alerts || []) {
      try {
        // Recupera ultimo dato da ThingSpeak
        const thingspeakUrl = `${THINGSPEAK_BASE_URL}/channels/${alert.thingspeak_channel_id}/feeds/last.json?api_key=${alert.thingspeak_read_key}`

        const thingspeakResponse = await fetch(thingspeakUrl)
        const thingspeakData = await thingspeakResponse.json()

        // Supponiamo che il peso sia in field1 (configurabile)
        const currentWeight = parseFloat(thingspeakData.field1 || '0')

        console.log(`Product ${alert.product_name}: ${currentWeight}kg vs threshold ${alert.weight_threshold}kg`)

        // Se peso sotto soglia, invia notifica
        if (currentWeight < alert.weight_threshold) {
          console.log(`Alert triggered for ${alert.product_name}`)

          // Prepara messaggio notifica
          const messages = alert.push_tokens.map((token: string) => ({
            to: token,
            sound: 'default',
            title: '⚠️ Alert Arnia',
            body: `${alert.product_name}: peso sotto soglia (${currentWeight}kg < ${alert.weight_threshold}kg)`,
            data: {
              productId: alert.product_id,
              productName: alert.product_name,
              actualWeight: currentWeight,
              threshold: alert.weight_threshold,
            },
          }))

          // Invia notifiche push via Expo
          if (messages.length > 0) {
            const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(messages),
            })

            const expoResult = await expoResponse.json()
            console.log('Expo push result:', expoResult)
          }

          // Log alert nel database
          await supabaseAdmin.rpc('log_alert_triggered', {
            p_user_id: alert.user_id,
            p_product_id: alert.product_id,
            p_alert_setting_id: alert.alert_id,
            p_weight_threshold: alert.weight_threshold,
            p_actual_weight: currentWeight,
            p_check_time: `${currentHour.toString().padStart(2, '0')}:00`,
            p_notification_sent: true,
          })

          results.push({
            productId: alert.product_id,
            triggered: true,
            weight: currentWeight,
          })
        } else {
          results.push({
            productId: alert.product_id,
            triggered: false,
            weight: currentWeight,
          })
        }
      } catch (error) {
        console.error(`Error checking alert for ${alert.product_id}:`, error)
        results.push({
          productId: alert.product_id,
          error: error.message,
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        hour: currentHour,
        checked: results.length,
        results,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Edge Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})
```

#### **E. Deploy Edge Function**

```bash
# Deploy
supabase functions deploy check-alerts

# Otterrai un URL tipo:
# https://xxxxx.supabase.co/functions/v1/check-alerts
```

---

### **Step 4: Setup Scheduler Automatico** (5 min)

Usa **cron-job.org** (gratuito) per eseguire la funzione ogni ora:

1. Vai su https://cron-job.org (registrazione gratuita)
2. Crea nuovo job:
   - **Title**: AgriSafe Alert Check
   - **URL**: `https://xxxxx.supabase.co/functions/v1/check-alerts`
   - **Schedule**: `0 * * * *` (ogni ora)
   - **Method**: POST

3. Aggiungi header (importante):
   - **Authorization**: `Bearer TUA_SUPABASE_ANON_KEY`

4. Salva e attiva

**Alternative:**
- GitHub Actions (gratuito, con workflow)
- Railway Cron (gratuito con limiti)
- Vercel Cron (su deploy Vercel)

---

### **Step 5: Integra nell'App** (3 min)

#### **A. Richiedi permessi notifiche al login**

Modifica `contexts/AuthContext.tsx`:

```typescript
import { registerForPushNotifications } from '@/services/notification-service';

// Nel AuthProvider, dopo login/register di successo:
useEffect(() => {
  if (user) {
    // Registra per notifiche push
    registerForPushNotifications().then(result => {
      if (!result.success) {
        console.warn('Push notifications not registered:', result.error);
      }
    });
  }
}, [user]);
```

#### **B. Test notifiche**

Nell'app, aggiungi un pulsante di test (temporaneo):

```typescript
import { sendLocalNotification } from '@/services/notification-service';

// In un componente:
<Button
  title="Test Notifica"
  onPress={() => {
    sendLocalNotification(
      '⚠️ Alert Test',
      'Arnia 1: peso sotto soglia (38kg < 40kg)'
    );
  }}
/>
```

---

## 🧪 **Testing Completo**

### **Test 1: Permessi Notifiche**

```typescript
import { checkNotificationPermissions, requestNotificationPermissions } from '@/services/notification-service';

const { granted } = await checkNotificationPermissions();
if (!granted) {
  await requestNotificationPermissions();
}
```

### **Test 2: Crea Alert**

```typescript
import { createAlert } from '@/services/alert-service';

const result = await createAlert(
  'product-id-arnia',
  40.0,  // Soglia 40 kg
  ['09:00', '18:00']  // Check alle 9 e 18
);
```

### **Test 3: Trigger Manuale Edge Function**

```bash
curl -X POST https://xxxxx.supabase.co/functions/v1/check-alerts \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

### **Test 4: Verifica Logs**

```typescript
import { getAlertLogs } from '@/services/alert-service';

const { data: logs } = await getAlertLogs();
console.log('Alert logs:', logs);
```

---

## 📱 **UI da Creare (Prossimi Step)**

Dovrai creare queste schermate:

### **1. Schermata Configurazione Alert**
- Lista arnie
- Per ogni arnia: pulsante "Configura Alert"
- Form con:
  - Soglia peso (slider o input)
  - Orari check (selector multiplo)
  - Toggle attiva/disattiva

### **2. Dashboard Alert**
- Numero alert attivi
- Alert triggered oggi/settimana
- Lista ultimi alert
- Statistiche

### **3. Dettaglio Alert**
- Info alert corrente
- Storico trigger
- Modifica/Elimina

---

## 🔍 **Debug & Troubleshooting**

### **Problema: Notifiche non arrivano**

**Check 1 - Permessi:**
```typescript
const permissions = await checkNotificationPermissions();
console.log('Permissions:', permissions);
```

**Check 2 - Token registrato:**
```sql
SELECT * FROM push_tokens WHERE user_id = 'YOUR_USER_ID';
```

**Check 3 - Edge Function logs:**
```bash
supabase functions logs check-alerts
```

**Check 4 - Alert configurati:**
```sql
SELECT * FROM alert_settings WHERE enabled = true;
```

### **Problema: Edge Function fallisce**

**Verifica variabili ambiente:**
- `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` sono configurate?

```bash
supabase secrets list
```

### **Problema: ThingSpeak non risponde**

**Test manuale:**
```bash
curl "https://api.thingspeak.com/channels/YOUR_CHANNEL/feeds/last.json?api_key=YOUR_KEY"
```

---

## 💰 **Costi (Tutto Gratuito!)**

- ✅ Supabase Edge Functions: 500k invocazioni/mese gratis
- ✅ Expo Push Notifications: Illimitate gratis
- ✅ cron-job.org: Gratis
- ✅ Database Supabase: Incluso nel piano free

**Calcolo:** 24 check/giorno × 30 giorni = 720 invocazioni/mese = **GRATIS**

---

## ✅ **Checklist Setup**

- [ ] Schema database eseguito su Supabase
- [ ] Expo Project ID configurato
- [ ] Edge Function creata e deployed
- [ ] Scheduler configurato su cron-job.org
- [ ] Permessi notifiche integrati nell'app
- [ ] Test notifica locale funzionante
- [ ] Alert di test creato
- [ ] Edge Function testata manualmente
- [ ] Verificato log in alert_logs table

---

## 🎯 **Prossimi Passi**

1. **Ora:** Esegui setup Step 1-5
2. **Poi:** Testa tutto il flusso
3. **Infine:** Crea UI per configurare alert (ti posso aiutare)

Vuoi che ti aiuti con qualche step specifico o creo le UI? 🚀
