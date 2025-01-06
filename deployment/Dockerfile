FROM python:3.9
WORKDIR /app
COPY backend_FASTAPI_mongodb/requirements.txt .
RUN pip install -r requirements.txt
COPY backend_FASTAPI_mongodb/ .
COPY frontend_game_UI/dist/ static/
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "${PORT:-8000}"]