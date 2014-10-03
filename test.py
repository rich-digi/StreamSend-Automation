from imp_generate_customer_greetname import make_greeting
import unittest

# --------------------------------------------------------------------------------
# UNIT TESTS

def make_greeting_test(title, firstname, lastname, company, desired):
	res = make_greeting(title, firstname, lastname, company)
	return res == desired

class greet_tests(unittest.TestCase):
    
    def test_01(self):
        self.assertTrue(make_greeting_test('Mr', 'Richard', 'Knight', '', 'Richard'))

    def test_02(self):
        self.assertTrue(make_greeting_test('Mr', 'L', 'DiCaprio', '', 'Mr DiCaprio'))

# --------------------------------------------------------------------------------
# RUN

if __name__ == '__main__':
    unittest.main()
    

