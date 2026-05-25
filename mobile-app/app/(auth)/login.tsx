import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '@/contexts/FastAPIAuthContext';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { validateEmail } from '@/services/fastapi-auth-service';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const colors = {
    background: isDark ? '#000000' : '#FFFFFF',
    card: isDark ? '#1C1C1E' : '#F2F2F7',
    text: isDark ? '#FFFFFF' : '#000000',
    textSecondary: isDark ? '#8E8E93' : '#6E6E73',
    primary: '#007AFF',
    error: '#FF3B30',
    border: isDark ? '#38383A' : '#C6C6C8',
  };

  async function handleLogin() {
    // Validazione
    if (!email || !password) {
      Alert.alert('Errore', 'Inserisci email e password');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Errore', 'Email non valida');
      return;
    }

    setLoading(true);

    try {
      const result = await signIn({ email, password });

      if (result.success) {
        router.replace('/(tabs)');
      } else {
        Alert.alert('Errore di Login', result.error || 'Credenziali non valide');
      }
    } catch (error) {
      Alert.alert('Errore', 'Si è verificato un errore imprevisto');
    } finally {
      setLoading(false);
    }
  }

  function goToRegister() {
    router.push('/(auth)/register');
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.logo, { color: colors.text }]}>🐝</Text>
          <Text style={[styles.title, { color: colors.text }]}>BeeHive IoT</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Accedi alla tua piattaforma
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Email</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="tuo@email.com"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Password</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="••••••••"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              editable={!loading}
            />
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: colors.primary },
              loading && styles.buttonDisabled,
            ]}
            onPress={handleLogin}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Accedi</Text>
            )}
          </TouchableOpacity>

          {/* Forgot Password */}
          <TouchableOpacity style={styles.forgotButton} disabled={loading}>
            <Text style={[styles.forgotText, { color: colors.primary }]}>
              Password dimenticata?
            </Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.textSecondary }]}>oppure</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        {/* Register Link */}
        <View style={styles.registerContainer}>
          <Text style={[styles.registerText, { color: colors.textSecondary }]}>
            Non hai un account?{' '}
          </Text>
          <TouchableOpacity onPress={goToRegister} disabled={loading}>
            <Text style={[styles.registerLink, { color: colors.primary }]}>
              Registrati
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  button: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotText: {
    fontSize: 14,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: 14,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});
