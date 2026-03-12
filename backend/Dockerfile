FROM python:3.14
ENV PYTHONUNBUFFERED=1

WORKDIR /code

RUN apt-get update \
 && apt-get install -y --no-install-recommends gettext \
 && rm -rf /var/lib/apt/lists/*

# Copy requirements alone to avoid rebuilding on code changes
COPY requirements.txt /code/requirements.txt

RUN pip install --no-cache-dir -r requirements.txt

RUN groupadd --system appgroup && useradd --system --gid appgroup appuser \
    && chown -R appuser:appgroup /code

COPY entrypoint.sh /
RUN chmod +x /entrypoint.sh

COPY . .

CMD ["/entrypoint.sh"]
