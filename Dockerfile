FROM python:3.12-slim
WORKDIR /app
COPY bot ./bot
COPY dist ./dist
RUN useradd --create-home app && mkdir /data && chown app:app /data
USER app
ENV PANEL_HOST=0.0.0.0 PORT=8765 PAPER_DB_PATH=/data/paper.sqlite3
EXPOSE 8765
CMD ["python", "-m", "bot.server"]
