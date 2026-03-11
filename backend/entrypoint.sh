#!/bin/bash
set -e

echo "Running Makemigrations"
python3 manage.py makemigrations authentication
python3 manage.py makemigrations users
python3 manage.py makemigrations categories
python3 manage.py makemigrations notes

echo "Running Migrations"
python3 manage.py migrate

echo "Running the backend application"
if [ "$DEBUG" = "1" ]; then
    echo "Debug mode is enabled"
    python3 -Xfrozen_modules=off -m debugpy --listen 0.0.0.0:5678 \
        -m uvicorn config.asgi:application \
        --host 0.0.0.0 --port 8000 --reload
else
    echo "Debug mode is disabled"
    gunicorn config.asgi:application \
        --bind 0.0.0.0:8000 \
        --workers 4 \
        --threads 2 \
        -k uvicorn.workers.UvicornWorker \
        --access-logfile -
fi
