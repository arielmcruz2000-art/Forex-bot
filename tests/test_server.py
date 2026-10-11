import json
import os
from pathlib import Path
import secrets
import signal
import socket
import subprocess
import sys
import tempfile
import time
import unittest
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

class ServerTests(unittest.TestCase):
    def test_auth_commands_and_durable_restart(self):
        with tempfile.TemporaryDirectory() as directory:
            token = secrets.token_urlsafe(32)
            with socket.socket() as sock:
                sock.bind(('127.0.0.1', 0))
                port = sock.getsockname()[1]
            env = dict(os.environ, PANEL_ACCESS_TOKEN=token, PORT=str(port),
                       PANEL_HOST='127.0.0.1', PAPER_DB_PATH=str(Path(directory)/'test.sqlite3'))
            url = 'http://127.0.0.1:' + str(port)
            def request(path, body=None, authorized=True, origin=None):
                headers = {'Authorization':'Bearer '+token} if authorized else {}
                if origin:
                    headers['Origin'] = origin
                if body:
                    headers['Content-Type'] = 'application/json'
                req = Request(url+path, data=json.dumps(body).encode() if body else None,
                              headers=headers)
                with urlopen(req, timeout=2) as response:
                    return json.load(response)
            def launch():
                process = subprocess.Popen([sys.executable, '-m', 'bot.server'], env=env,
                                           cwd=Path(__file__).resolve().parents[1],
                                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                for _ in range(100):
                    try:
                        request('/api/state')
                        return process
                    except URLError:
                        time.sleep(.03)
                process.kill()
                process.wait()
                self.fail('Server failed to launch')
            process = launch()
            try:
                with self.assertRaises(HTTPError) as error:
                    request('/api/state', authorized=False)
                self.assertEqual(error.exception.code, 401)
                with self.assertRaises(HTTPError):
                    request('/api/state', origin='https://untrusted.example')
                self.assertTrue(request('/api/command', {'action':'start'})['active'])
                self.assertEqual(request('/api/command', {'action':'config','risk':.5})['risk'], .5)
                with self.assertRaises(HTTPError):
                    request('/api/command', {'action':'config','risk':9})
                self.assertFalse(request('/api/state')['broker_connected'])
            finally:
                process.send_signal(signal.SIGINT)
                process.wait(timeout=5)
            process = launch()
            try:
                result = request('/api/state')
                self.assertFalse(result['active'])
                self.assertEqual(result['risk'], .5)
            finally:
                process.send_signal(signal.SIGINT)
                process.wait(timeout=5)

if __name__ == '__main__':
    unittest.main()
