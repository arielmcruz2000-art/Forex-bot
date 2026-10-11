import unittest
from bot.paper import PaperEngine

class PaperTests(unittest.TestCase):
    def test_pause_keeps_positions_but_stop_still_closes(self):
        e = PaperEngine()
        e.command('start')
        self.assertTrue(e.open(1))
        e.command('pause')
        self.assertEqual(len(e.s['trades']), 1)
        self.assertFalse(e.open(1))
        e.step(1.09)
        self.assertEqual(len(e.s['trades']), 0)
        self.assertLess(e.s['balance'], 1000)

    def test_daily_drawdown_blocks_restart(self):
        e = PaperEngine()
        e.command('config', 2)
        e.command('start')
        e.open(1)
        e.step(1.085)
        self.assertFalse(e.s['active'])
        with self.assertRaises(ValueError):
            e.command('start')

    def test_open_risk_and_limit(self):
        e = PaperEngine()
        e.command('start')
        self.assertTrue(e.open(1))
        self.assertTrue(e.open(-1))
        self.assertFalse(e.open(1))
        self.assertEqual(e.snapshot()['broker_connected'], False)

    def test_generated_feed_and_restart(self):
        e = PaperEngine()
        e.command('start')
        for _ in range(250):
            e.step()
        self.assertGreater(len(e.s['history']), 0)
        restored = PaperEngine(e.s.copy())
        self.assertFalse(restored.s['active'])
        self.assertEqual(restored.s['balance'], e.s['balance'])

if __name__ == '__main__':
    unittest.main()
