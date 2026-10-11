"""Educational paper execution using generated prices, never broker orders."""
import math
from datetime import datetime
from zoneinfo import ZoneInfo
from .risk import position_units, can_open

def day_key():
    return datetime.now(ZoneInfo('America/New_York')).date().isoformat()

class PaperEngine:
    def __init__(self, state=None):
        self.s = state or {'active': False, 'risk': 1.0, 'balance': 1000.0,
                           'trades': [], 'history': [], 'events': [], 'tick': 0,
                           'prices': [], 'price': 1.095, 'day': day_key(), 'day_equity': 1000.0}
        # Restart never silently re-enables entries.
        self.s['active'] = False

    def event(self, message):
        self.s['events'].insert(0, datetime.now().isoformat(timespec='seconds') + ' · ' + message)
        self.s['events'] = self.s['events'][:40]

    def pnl(self, trade):
        # Constant illustrative spread: 1 pip total round trip.
        exit_price = self.s['price'] - .00005 if trade['direction'] == 1 else self.s['price'] + .00005
        return (exit_price - trade['entry']) * trade['direction'] * trade['units']

    def equity(self):
        return self.s['balance'] + sum(self.pnl(t) for t in self.s['trades'])

    def loss_percent(self):
        baseline = self.s['day_equity']
        return max(0, (baseline - self.equity()) / baseline * 100) if baseline > 0 else 100

    def open(self, direction):
        equity = self.equity()
        risks = [t['risk'] for t in self.s['trades']]
        if not self.s['active'] or not can_open(risks, self.s['risk'], self.loss_percent()) or equity <= 0:
            return False
        entry = self.s['price'] + direction * .00005
        units = position_units(equity, self.s['risk'], .002, .00005)
        if units <= 0:
            return False
        self.s['trades'].append({'direction': direction, 'units': units, 'entry': entry,
                                'stop': entry - direction * .002, 'target': entry + direction * .004,
                                'risk': self.s['risk']})
        self.event('Posición simulada abierta: ' + ('compra' if direction == 1 else 'venta'))
        return True

    def close(self, trade, reason):
        profit = round(self.pnl(trade), 2)
        self.s['balance'] = round(self.s['balance'] + profit, 2)
        self.s['history'].insert(0, {**trade, 'profit': profit, 'exit': self.s['price'],
                                   'reason': reason, 'time': datetime.now().isoformat(timespec='seconds')})
        self.s['history'] = self.s['history'][:1000]
        self.s['trades'].remove(trade)
        self.event('Cierre simulado: ' + reason)

    def step(self, price=None):
        if self.s['day'] != day_key():
            self.s['day'] = day_key()
            self.s['day_equity'] = self.equity()
        self.s['tick'] += 1
        t = self.s['tick']
        p = price if price is not None else 1.095 + .003 * math.sin(t / 15) + .0002 * math.sin(t / 3)
        if not math.isfinite(p) or p <= 0:
            raise ValueError('Invalid simulated price')
        self.s['price'] = round(p, 5)
        prices = self.s['prices']
        prices.append(self.s['price'])
        self.s['prices'] = prices[-100:]
        for trade in list(self.s['trades']):
            exit_price = p - trade['direction'] * .00005
            stop = exit_price <= trade['stop'] if trade['direction'] == 1 else exit_price >= trade['stop']
            target = exit_price >= trade['target'] if trade['direction'] == 1 else exit_price <= trade['target']
            if stop or target:
                self.close(trade, 'Stop' if stop else 'Objetivo')
        if self.loss_percent() >= 4:
            if self.s['active']:
                self.event('Límite diario alcanzado. Nuevas entradas suspendidas.')
            self.s['active'] = False
        # SMA 5/20 on generated ticks; purely educational, not 15-minute market candles.
        if len(prices) >= 21 and self.s['active'] and not self.s['trades']:
            previous = sum(prices[-6:-1])/5 - sum(prices[-21:-1])/20
            current = sum(prices[-5:])/5 - sum(prices[-20:])/20
            if previous <= 0 < current:
                self.open(1)
            elif previous >= 0 > current:
                self.open(-1)

    def command(self, action, risk=None):
        if action == 'start':
            if self.loss_percent() >= 4:
                raise ValueError('Límite diario alcanzado')
            self.s['active'] = True
            self.event('Entradas automáticas simuladas activadas')
        elif action == 'pause':
            self.s['active'] = False
            self.event('Entradas pausadas; salidas protectoras siguen activas')
        elif action == 'close':
            self.s['active'] = False
            for trade in list(self.s['trades']):
                self.close(trade, 'Cierre manual')
        elif action == 'config':
            r = float(risk)
            if not math.isfinite(r) or not .1 <= r <= 2:
                raise ValueError('Riesgo permitido: 0.1% a 2%')
            self.s['risk'] = r
            self.event('Riesgo actualizado')
        elif action == 'step':
            self.step()
        else:
            raise ValueError('Acción desconocida')

    def snapshot(self):
        return {**self.s, 'equity': round(self.equity(), 2), 'loss_percent': round(self.loss_percent(), 2),
                'mode': 'generated-paper', 'broker_connected': False,
                'trades': [{**t, 'profit': round(self.pnl(t), 2)} for t in self.s['trades']]}
