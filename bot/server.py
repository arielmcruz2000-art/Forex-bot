"""Run with python3 -m bot.server. Authenticated control of paper engine only."""
import hmac
import json
import os
import sqlite3
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from .paper import PaperEngine

ROOT = Path(__file__).resolve().parents[1]
TOKEN = os.environ.get('PANEL_ACCESS_TOKEN', '')
ALLOWED_ORIGIN = os.environ.get('PANEL_ORIGIN', '')
LOCK = threading.RLock()

def main():
    if len(TOKEN) < 32:
        raise SystemExit('Set PANEL_ACCESS_TOKEN to a random value of at least 32 characters.')
    db = sqlite3.connect(os.environ.get('PAPER_DB_PATH', str(ROOT / 'paper.sqlite3')), check_same_thread=False)
    db.execute('CREATE TABLE IF NOT EXISTS engine (id INTEGER PRIMARY KEY, state TEXT NOT NULL)')
    stored = db.execute('SELECT state FROM engine WHERE id=1').fetchone()
    engine = PaperEngine(json.loads(stored[0]) if stored else None)
    def persist():
        db.execute('INSERT OR REPLACE INTO engine VALUES (1,?)', (json.dumps(engine.s),))
        db.commit()
    with LOCK:
        persist()

    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(ROOT / 'dist'), **kwargs)
        def log_message(self, *args):
            pass  # Never log credentials or request bodies.
        def end_headers(self):
            self.send_header('Cache-Control', 'no-store')
            self.send_header('X-Content-Type-Options', 'nosniff')
            origin = self.headers.get('Origin')
            if ALLOWED_ORIGIN and origin == ALLOWED_ORIGIN:
                self.send_header('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
                self.send_header('Vary', 'Origin')
            super().end_headers()
        def respond(self, code, payload):
            data = json.dumps(payload).encode()
            self.send_response(code)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        def authorized(self):
            origin = self.headers.get('Origin')
            own_origin = 'http://' + self.headers.get('Host', '')
            if origin and origin not in (own_origin, ALLOWED_ORIGIN):
                return False
            provided = self.headers.get('Authorization', '')
            return hmac.compare_digest(provided, 'Bearer ' + TOKEN)
        def do_OPTIONS(self):
            if not ALLOWED_ORIGIN or self.headers.get('Origin') != ALLOWED_ORIGIN:
                return self.respond(403, {'error':'Origen no permitido'})
            self.send_response(204)
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Authorization, Content-Type')
            self.end_headers()
        def do_GET(self):
            if self.path.startswith('/api/'):
                if not self.authorized():
                    return self.respond(401, {'error':'Acceso no autorizado'})
                if self.path != '/api/state':
                    return self.respond(404, {'error':'Ruta desconocida'})
                with LOCK:
                    return self.respond(200, engine.snapshot())
            super().do_GET()
        def do_POST(self):
            if not self.authorized():
                return self.respond(401, {'error':'Acceso no autorizado'})
            if self.path != '/api/command':
                return self.respond(404, {'error':'Ruta desconocida'})
            try:
                size = int(self.headers.get('Content-Length', '0'))
                if not 0 < size <= 2048:
                    raise ValueError('Solicitud inválida')
                payload = json.loads(self.rfile.read(size))
                if not isinstance(payload, dict):
                    raise ValueError('Solicitud inválida')
                with LOCK:
                    engine.command(payload.get('action'), payload.get('risk'))
                    persist()
                    return self.respond(200, engine.snapshot())
            except (ValueError, TypeError, OverflowError):
                self.respond(400, {'error':'Acción o parámetros inválidos; comprueba el límite diario'})

    def loop():
        while not stop.wait(5):
            with LOCK:
                engine.step()
                persist()

    stop = threading.Event()
    thread = threading.Thread(target=loop, daemon=True)
    server = ThreadingHTTPServer((os.environ.get('PANEL_HOST', '127.0.0.1'), int(os.environ.get('PORT', '8765'))), Handler)
    thread.start()
    print('Panel y motor simulado disponibles. OANDA permanece desconectado.', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        stop.set()
        thread.join()
        server.server_close()
        with LOCK:
            persist()
            db.close()

if __name__ == '__main__':
    main()
