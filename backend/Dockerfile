FROM python:3.12-slim

WORKDIR /app

ARG USE_IRAN_MIRRORS=true

# Arvan Debian mirror for faster apt on Iranian servers
RUN if [ "$USE_IRAN_MIRRORS" = "true" ] && [ -f /etc/apt/sources.list.d/debian.sources ]; then \
      sed -i 's|http://deb.debian.org|http://mirror.arvancloud.ir|g' /etc/apt/sources.list.d/debian.sources; \
    fi

RUN apt-get update && apt-get install -y --no-install-recommends libpq-dev gcc && rm -rf /var/lib/apt/lists/*

# Runflare PyPI mirror
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
