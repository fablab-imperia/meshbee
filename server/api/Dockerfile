FROM python:3.11-slim

WORKDIR /app

# Installa dipendenze di sistema
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev && \
    rm -rf /var/lib/apt/lists/*

# Copia requirements e installa dipendenze Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia il codice dell'applicazione
COPY . .

# Espone la porta 8000
EXPOSE 8000

# Comando di avvio
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
