#!/usr/bin/env python3
"""
Script per generare hash bcrypt delle password
Utile per creare/aggiornare password utenti nel database
"""
import sys
from passlib.context import CryptContext

# Configurazione bcrypt (stessa usata dall'API)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def generate_hash(password: str) -> str:
    """Genera hash bcrypt di una password"""
    return pwd_context.hash(password)

def verify_hash(password: str, hashed: str) -> bool:
    """Verifica se una password corrisponde a un hash"""
    return pwd_context.verify(password, hashed)

def main():
    print("=" * 60)
    print("Generatore Hash Password - Beehive IoT")
    print("=" * 60)
    print()
    
    if len(sys.argv) > 1:
        # Password passata come argomento
        password = sys.argv[1]
    else:
        # Richiedi password interattivamente
        password = input("Inserisci la password da hashare: ")
    
    if not password:
        print("❌ Errore: password vuota")
        sys.exit(1)
    
    # Genera hash
    password_hash = generate_hash(password)
    
    print()
    print("✓ Hash generato con successo!")
    print()
    print("Password originale:")
    print(f"  {password}")
    print()
    print("Hash bcrypt:")
    print(f"  {password_hash}")
    print()
    print("Query SQL per aggiornare un utente:")
    print(f"  UPDATE utenti SET password_hash = '{password_hash}' WHERE email = 'tua@email.com';")
    print()
    
    # Test verifica
    if verify_hash(password, password_hash):
        print("✓ Verifica hash: OK")
    else:
        print("❌ Verifica hash: FALLITA")
    
    print()
    print("=" * 60)

if __name__ == "__main__":
    main()
