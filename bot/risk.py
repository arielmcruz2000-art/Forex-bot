"""Risk sizing for USD-quoted pairs with a USD account; no order execution."""
from decimal import Decimal, ROUND_DOWN

def position_units(equity, risk_percent, stop_distance, cost_per_unit=0):
    equity, risk, distance, cost = map(lambda x: Decimal(str(x)),
                                     (equity, risk_percent, stop_distance, cost_per_unit))
    if not all(x.is_finite() for x in (equity, risk, distance, cost)):
        raise ValueError('Values must be finite')
    if equity <= 0 or not Decimal('0') < risk <= Decimal('2') or distance <= 0 or cost < 0:
        raise ValueError('Invalid equity, risk, stop or cost')
    budget = equity * risk / 100
    return int((budget / (distance + cost)).to_integral_value(rounding=ROUND_DOWN))

def can_open(existing_risks, new_risk, daily_loss_percent):
    values = [Decimal(str(x)) for x in [*existing_risks, new_risk, daily_loss_percent]]
    if not all(x.is_finite() and x >= 0 for x in values):
        return False
    risks, new, loss = values[:-2], values[-2], values[-1]
    return len(risks) < 2 and 0 < new <= 2 and sum(risks) + new <= 2 and loss < 4
