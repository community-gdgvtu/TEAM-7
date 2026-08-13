import sys
import os
import unittest
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.security import hash_password, verify_password, create_access_token, decode_access_token

class TestAuthSecurity(unittest.TestCase):

    def test_password_hashing(self):
        pwd = "SecretPassword123!"
        hashed = hash_password(pwd)

        self.assertNotEqual(pwd, hashed)
        self.assertIn("$", hashed)

        # Correct password verification
        self.assertTrue(verify_password(pwd, hashed))

        # Incorrect password rejection
        self.assertFalse(verify_password("WrongPassword!", hashed))

    def test_jwt_token_generation_and_decoding(self):
        payload_data = {"sub": "usr-test-123", "email": "test@panchayat.ai", "role": "CUSTOMER"}
        token = create_access_token(payload_data)

        self.assertIsInstance(token, str)
        self.assertGreater(len(token), 20)

        decoded = decode_access_token(token)
        self.assertIsNotNone(decoded)
        self.assertEqual(decoded["sub"], "usr-test-123")
        self.assertEqual(decoded["email"], "test@panchayat.ai")
        self.assertEqual(decoded["role"], "CUSTOMER")

    def test_invalid_jwt_rejection(self):
        invalid_token = "invalid.jwt.token.string"
        decoded = decode_access_token(invalid_token)
        self.assertIsNone(decoded)

if __name__ == '__main__':
    unittest.main()
