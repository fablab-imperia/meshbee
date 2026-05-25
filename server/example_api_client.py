#!/usr/bin/env python3
"""
Client di esempio per API Beehive IoT
Mostra come autenticarsi e recuperare dati dalle arnie
"""
import os
import requests
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, List


class BeehiveAPIClient:
    """Client per interagire con l'API Beehive IoT"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        """
        Inizializza il client
        
        Args:
            base_url: URL base dell'API
        """
        self.base_url = base_url.rstrip('/')
        self.access_token: Optional[str] = None
        self.refresh_token: Optional[str] = None
    
    def login(self, email: str, password: str) -> bool:
        """
        Esegue il login
        
        Args:
            email: Email dell'utente
            password: Password
        
        Returns:
            True se login riuscito, False altrimenti
        """
        try:
            response = requests.post(
                f"{self.base_url}/api/auth/login",
                json={"email": email, "password": password}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data['access_token']
                self.refresh_token = data['refresh_token']
                print(f"✓ Login effettuato con successo come {email}")
                return True
            else:
                print(f"✗ Login fallito: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"✗ Errore durante login: {e}")
            return False
    
    def _get_headers(self) -> Dict[str, str]:
        """Restituisce gli headers con il token di autenticazione"""
        if not self.access_token:
            raise Exception("Non autenticato. Esegui prima il login.")
        
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
    
    def get_me(self) -> Optional[Dict]:
        """
        Ottiene informazioni sull'utente corrente
        
        Returns:
            Dati utente o None
        """
        try:
            response = requests.get(
                f"{self.base_url}/api/auth/me",
                headers=self._get_headers()
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"✗ Errore: {response.status_code}")
                return None
        except Exception as e:
            print(f"✗ Errore: {e}")
            return None
    
    def get_arnie(self) -> List[Dict]:
        """
        Ottiene la lista delle arnie dell'utente
        
        Returns:
            Lista di arnie
        """
        try:
            response = requests.get(
                f"{self.base_url}/api/user/arnie",
                headers=self._get_headers()
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"✗ Errore: {response.status_code}")
                return []
        except Exception as e:
            print(f"✗ Errore: {e}")
            return []
    
    def get_letture(
        self,
        id_arnia: int,
        giorni: int = 30,
        limit: int = 1000
    ) -> List[Dict]:
        """
        Ottiene le letture di un'arnia
        
        Args:
            id_arnia: ID dell'arnia
            giorni: Numero di giorni di storico (default: 30)
            limit: Numero massimo di letture
        
        Returns:
            Lista di letture
        """
        try:
            data_inizio = datetime.now() - timedelta(days=giorni)
            
            response = requests.get(
                f"{self.base_url}/api/user/arnie/{id_arnia}/letture",
                params={
                    "data_inizio": data_inizio.isoformat(),
                    "limit": limit
                },
                headers=self._get_headers()
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"✗ Errore: {response.status_code}")
                return []
        except Exception as e:
            print(f"✗ Errore: {e}")
            return []
    
    def get_attivita(
        self,
        id_arnia: int,
        giorni: int = 30
    ) -> List[Dict]:
        """
        Ottiene le attività di un'arnia
        
        Args:
            id_arnia: ID dell'arnia
            giorni: Numero di giorni di storico (default: 30)
        
        Returns:
            Lista di attività
        """
        try:
            data_inizio = datetime.now() - timedelta(days=giorni)
            
            response = requests.get(
                f"{self.base_url}/api/user/arnie/{id_arnia}/attivita",
                params={"data_inizio": data_inizio.isoformat()},
                headers=self._get_headers()
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"✗ Errore: {response.status_code}")
                return []
        except Exception as e:
            print(f"✗ Errore: {e}")
            return []
    
    def aggiungi_attivita(
        self,
        id_arnia: int,
        tipo_attivita: str,
        descrizione: str,
        dati: Optional[Dict] = None
    ) -> bool:
        """
        Aggiunge un'attività a un'arnia
        
        Args:
            id_arnia: ID dell'arnia
            tipo_attivita: Tipo (ispezione, trattamento, etc.)
            descrizione: Descrizione dell'attività
            dati: Dati aggiuntivi (opzionale)
        
        Returns:
            True se successo, False altrimenti
        """
        try:
            payload = {
                "id_arnia": id_arnia,
                "tipo_attivita": tipo_attivita,
                "descrizione": descrizione
            }
            
            if dati:
                payload["dati"] = dati
            
            response = requests.post(
                f"{self.base_url}/api/user/arnie/{id_arnia}/attivita",
                json=payload,
                headers=self._get_headers()
            )
            
            if response.status_code == 200:
                print(f"✓ Attività aggiunta con successo")
                return True
            else:
                print(f"✗ Errore: {response.status_code}")
                return False
        except Exception as e:
            print(f"✗ Errore: {e}")
            return False
    
    def get_allarmi(self, id_arnia: int, solo_attivi: bool = True) -> List[Dict]:
        """
        Ottiene gli allarmi di un'arnia
        
        Args:
            id_arnia: ID dell'arnia
            solo_attivi: Se True, mostra solo allarmi non risolti
        
        Returns:
            Lista di allarmi
        """
        try:
            response = requests.get(
                f"{self.base_url}/api/user/arnie/{id_arnia}/allarmi",
                params={"solo_attivi": solo_attivi},
                headers=self._get_headers()
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"✗ Errore: {response.status_code}")
                return []
        except Exception as e:
            print(f"✗ Errore: {e}")
            return []


def stampa_separatore():
    """Stampa una linea separatrice"""
    print("\n" + "=" * 80 + "\n")


def main():
    """Esempio di utilizzo del client"""
    print("=" * 80)
    print("Client di Esempio - Beehive IoT API")
    print("=" * 80)
    
    # Crea client
    client = BeehiveAPIClient("http://localhost:8000")
    
    # Login
    print("\n1. Login...")
    if not client.login("utente@test.local", os.getenv("USER_PASSWORD", "")):
        print("Login fallito. Uscita.")
        return
    
    stampa_separatore()
    
    # Informazioni utente
    print("2. Informazioni utente corrente:")
    user_info = client.get_me()
    if user_info:
        print(f"   Nome: {user_info['nome']} {user_info['cognome']}")
        print(f"   Email: {user_info['email']}")
        print(f"   Ruolo: {user_info['ruolo']}")
    
    stampa_separatore()
    
    # Lista arnie
    print("3. Le tue arnie:")
    arnie = client.get_arnie()
    
    if not arnie:
        print("   Nessuna arnia trovata.")
        return
    
    for arnia in arnie:
        print(f"\n   📍 {arnia['nome_arnia']} (ID: {arnia['id_arnia']})")
        print(f"      Nodo: {arnia['id_nodo']}")
        print(f"      Posizione: {arnia.get('posizione', 'N/A')}")
        
        if arnia.get('ultimo_aggiornamento'):
            print(f"      Ultimo aggiornamento: {arnia['ultimo_aggiornamento']}")
            print(f"      🌡️  Temperatura: {arnia.get('ultima_temperatura', 'N/A')}°C")
            print(f"      💧 Umidità: {arnia.get('ultima_umidita', 'N/A')}%")
            print(f"      ⚖️  Peso: {arnia.get('ultimo_peso', 'N/A')}kg")
    
    stampa_separatore()
    
    # Dettagli prima arnia
    if arnie:
        arnia = arnie[0]
        id_arnia = arnia['id_arnia']
        
        print(f"4. Dettagli arnia '{arnia['nome_arnia']}':")
        
        # Letture recenti
        print(f"\n   📊 Ultime 5 letture:")
        letture = client.get_letture(id_arnia, giorni=7, limit=5)
        
        for lettura in letture:
            print(f"      {lettura['timestamp']}: "
                  f"T={lettura.get('temperatura', 'N/A')}°C, "
                  f"H={lettura.get('umidita', 'N/A')}%, "
                  f"P={lettura.get('peso', 'N/A')}kg")
        
        # Attività recenti
        print(f"\n   📝 Attività recenti:")
        attivita = client.get_attivita(id_arnia, giorni=30)
        
        if attivita:
            for att in attivita[:5]:
                print(f"      {att['timestamp']}: "
                      f"{att['tipo_attivita']} - {att.get('descrizione', 'N/A')}")
        else:
            print("      Nessuna attività registrata")
        
        # Allarmi
        print(f"\n   🚨 Allarmi attivi:")
        allarmi = client.get_allarmi(id_arnia, solo_attivi=True)
        
        if allarmi:
            for allarme in allarmi:
                emoji = "🔴" if allarme['livello'] == 'critical' else "⚠️"
                print(f"      {emoji} {allarme['tipo_allarme']}: {allarme.get('messaggio', 'N/A')}")
                print(f"         Valore: {allarme.get('valore_rilevato', 'N/A')} "
                      f"(soglia: {allarme.get('soglia', 'N/A')})")
        else:
            print("      ✓ Nessun allarme attivo")
        
        stampa_separatore()
        
        # Esempio: aggiungi attività
        print("5. Esempio: Aggiungi nuova attività")
        success = client.aggiungi_attivita(
            id_arnia=id_arnia,
            tipo_attivita="ispezione",
            descrizione="Controllo di routine da script API",
            dati={
                "telaini_miele": 8,
                "covata_presente": True,
                "note": "Tutto regolare"
            }
        )
        
        if success:
            print("   Attività aggiunta!")
    
    stampa_separatore()
    print("✓ Test completato!")
    print("=" * 80)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n✗ Interrotto dall'utente")
    except Exception as e:
        print(f"\n✗ Errore: {e}")
        import traceback
        traceback.print_exc()
