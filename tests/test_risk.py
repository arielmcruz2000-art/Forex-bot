import unittest
from bot.risk import position_units, can_open

class RiskTests(unittest.TestCase):
    def test_sizing_and_costs(self):
        self.assertEqual(position_units(1000, 2, .002), 10000)
        self.assertLess(position_units(1000, 2, .002, .0001), 10000)

    def test_invalid_inputs(self):
        for args in [(1000, 2, 0), (1000, 3, .002), (float('nan'), 1, .002)]:
            with self.assertRaises(ValueError):
                position_units(*args)

    def test_total_exposure_and_daily_cutoff(self):
        self.assertTrue(can_open([1], 1, 0))
        self.assertFalse(can_open([2], 1, 0))
        self.assertFalse(can_open([.5, .5], .5, 0))
        self.assertFalse(can_open([], 1, 4))
        self.assertFalse(can_open([], float('nan'), 0))

if __name__ == '__main__':
    unittest.main()
