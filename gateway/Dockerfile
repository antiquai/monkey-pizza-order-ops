FROM python:3.14-slim

WORKDIR /app

# Устанавливаем системные зависимости для работы с Postgres (если используешь psycopg2)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Запускаем через uvicorn (порт 8000)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]