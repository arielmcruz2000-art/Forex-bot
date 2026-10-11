"""Read-only OANDA practice adapter. No live endpoint or order methods."""
import json
import os
from urllib.parse import quote
from urllib.request import Request, urlopen

BASE = 'https://api-fxpractice.oanda.com/v3'

class PracticeClient:
    def __init__(self):
        self.token = os.environ.get('OANDA_PRACTICE_TOKEN', '')
        self.account = os.environ.get('OANDA_PRACTICE_ACCOUNT_ID', '')
        if not self.token or not self.account:
            raise ValueError('Configure OANDA practice credentials in server environment variables')

    def _get(self, path):
        request = Request(BASE + path, headers={'Authorization': 'Bearer ' + self.token}, method='GET')
        with urlopen(request, timeout=15) as response:
            return json.load(response)

    def summary(self):
        return self._get('/accounts/' + quote(self.account, safe='') + '/summary')

    def candles(self):
        return self._get('/instruments/EUR_USD/candles?count=100&granularity=M15&price=M')
