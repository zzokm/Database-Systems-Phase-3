FROM python:3.12-slim

WORKDIR /app

# ODBC dependencies (driver installation can be adjusted per host needs)
RUN apt-get update \
  && apt-get install -y --no-install-recommends unixodbc unixodbc-dev \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

EXPOSE 5000

CMD ["sh", "-c", "gunicorn -b 0.0.0.0:${BACKEND_PORT} --factory app.main:create_app"]
