FROM python:3.12.8-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/workspace \
    PIPEFORGE_INCOMING_DIR=/workspace/data/incoming \
    PIPEFORGE_QUARANTINE_DIR=/workspace/data/quarantine \
    PIPEFORGE_DB_PATH=/workspace/data/warehouse.db

WORKDIR /workspace

COPY environment/repo/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

COPY environment/repo /workspace
COPY tests /grader/tests

RUN mkdir -p /workspace/data/incoming /workspace/data/quarantine \
    && chmod -R a+rwX /workspace/data /grader

EXPOSE 8000

CMD ["python", "-m", "pipeline", "status"]
