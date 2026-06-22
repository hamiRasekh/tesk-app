FROM python:3.12-slim-bookworm

WORKDIR /app

# No apt packages needed — psycopg2-binary and other deps ship as wheels.
# (Arvan apt mirror often 404s; skipping apt avoids build failures.)

COPY pip.conf /etc/pip.conf
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY alembic.ini .
COPY alembic ./alembic
COPY app ./app
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

EXPOSE 8000
ENTRYPOINT ["./entrypoint.sh"]
