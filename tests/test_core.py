import asyncio
import hashlib
import unittest

import faiss
import numpy as np

from app.safety import answer_has_unsupported_prices, classify


class SafetyTests(unittest.TestCase):
    def test_medical_advice_is_flagged(self):
        self.assertTrue(classify("Is this treatment safe for my diabetes?").medical_advice)

    def test_wrong_price_premise_is_flagged(self):
        self.assertTrue(classify("I heard it costs $50. Confirm that.").asserted_price)

    def test_unsupported_price_is_rejected(self):
        context = "The out-patient program is $18,995 USD and in-patient is $30,000 USD."
        self.assertTrue(answer_has_unsupported_prices("It costs $50.", context))
        self.assertFalse(answer_has_unsupported_prices("It costs $18,995 USD.", context))


class FaissTests(unittest.TestCase):
    def test_normalized_inner_product_ranks_nearest_vector(self):
        vectors = np.asarray([[1.0, 0.0], [0.0, 1.0], [0.7, 0.7]], dtype="float32")
        faiss.normalize_L2(vectors)
        index = faiss.IndexFlatIP(2)
        index.add(vectors)
        query = np.asarray([[0.95, 0.05]], dtype="float32")
        faiss.normalize_L2(query)
        _, ids = index.search(query, 2)
        self.assertEqual(ids[0][0], 0)


if __name__ == "__main__":
    unittest.main()
