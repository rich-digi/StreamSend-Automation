# --------------------------------------------------------------------------------
# Process Customer Greeting
# --------------------------------------------------------------------------------

import glob, csv, string, re
from sys import argv, stdout

fallback = 'dmClub Member'

invalid_matcher = '[^A-Za-z0-9\'\. -]'
camel_matcher 	= '([A-Z][a-z]+){2,}'

class trml:
	BLACK 	= '\033[30m'
	RED 	= '\033[31m'
	GREEN 	= '\033[32m'
	BOLD	= '\033[1m'
	NORMAL	= '\033[0;0m'
    
# --------------------------------------------------------------------------------
# make_greeting function

def make_greeting(title, firstname, lastname, company):
	#
	# Try to generate a name-based greeting e.g. Dear Sam or Dear Mr Smith
	#
	title		= title.strip()
	firstname	= firstname.strip()
	lastname	= lastname.strip()
	company		= company.strip()
	
	if re.search(invalid_matcher, firstname + lastname) or re.match('\d+', firstname):
		#
		# firstname or lastname contain illegal characters: non alpha-numeric (_.'- and space allowed)
		# or
		# firstname is all digits
		#
		return fallback
	
	# Normalize capitalisation
	# Check for camel-case in firstname or lastname, and respect if it's there
	title = title.lower().title()
	if not re.match(camel_matcher, firstname):
		firstname = firstname.lower().title()
	if not re.match(camel_matcher, lastname):
		lastname = lastname.lower().title()
	if not re.match(camel_matcher, company):
		company = company.lower().title()
	
	firstnames = re.split('\s|(?<!\d)[,.](?!\d)', firstname)
	if len(firstnames) and len(firstnames[0]) > 2:
		cgn = firstnames[0]

	elif len(lastname) > 2 and title:
		title = re.sub('\.', '', title)
		if title not in ['Mr', 'Mrs', 'Miss', 'Ms', 'Dr']:
			return fallback
		if lastname[0:2] == 'Mc':
			lastname = 'Mc' + lastname[2:].title()
		elif lastname[0:3] == 'Mac':
			lastname = 'Mac' + lastname[3:].title()
		elif lastname[0:2] == 'O\'':
			lastname = 'O\'' + lastname[2:].title()
		elif lastname[0:4] == 'Von ':
			lastname = 'von ' + lastname[4:].title()
		cgn = '%s %s' % (title, lastname)

	elif len(company) > 3:
		cgn = company

	else:
		cgn = fallback
			
	return cgn
	
# --------------------------------------------------------------------------------
# process_data function

def process_data(input_pattern, column_positions, output_prefix, joiner_function, testmode):
	
	cp = column_positions	
	total = 0
	for file in glob.glob(input_pattern):
		fileno = re.match(r'.*(\d+).txt', file)
		output = open(output_prefix + fileno.group(1) + '.tsv', 'wb')
		writer = csv.writer(output, delimiter='\t', quotechar='"', quoting=csv.QUOTE_ALL)
		tsv = open(file, 'rU')
		reader = csv.reader(tsv, delimiter='\t')
		rownum = 0
		for row in reader:
			extract_cols = range(len(row))
			content = list(row[i] for i in extract_cols)
			if rownum == 0:
				# Write header row
				writer.writerow(joiner_function(content))
			else:
				# Extract data from row
				title 		= content[cp['title']]
				firstname 	= content[cp['firstname']]
				lastname 	= content[cp['lastname']]
				company 	= content[cp['company']]

				cgn = make_greeting(title, firstname, lastname, company)
						
				print '{:20s}      {:40s}      {:40s}      {:40s}      {:40s}'.format(title, firstname, lastname, company, cgn)
				content[cp['result']] = cgn
				writer.writerow(joiner_function(content))
				total  += 1
			rownum += 1
		tsv.close()
		output.close()
	return total

# --------------------------------------------------------------------------------
# Check test results

def check_test_results(column_positions, output_prefix):
	stdout.write(trml.BOLD)
	print
	print '--------------------------------------------------------------------'
	print '{:4s}      {:20s}      {:20s}      {:20s}'.format('Line', 'Expected', 'Got', 'Test')
	print '--------------------------------------------------------------------'
	stdout.write(trml.NORMAL)
	cp = column_positions	
	passmsg = trml.GREEN + 'PASSED'
	failmsg = trml.RED   + 'FAILED'
	pcount = 0
	fcount = 0
	for file in glob.glob(output_prefix + '*.tsv'):
		tsv = open(file, 'rU')
		reader = csv.reader(tsv, delimiter='\t')
		rownum = 0
		for row in reader:
			extract_cols = range(len(row))
			content = list(row[i] for i in extract_cols)
			if rownum == 0:
				# Write header row
				extract_cols = range(len(row))
			else:
				# Extract data from row
				content = list(row[i] for i in extract_cols)
				expected = content[cp['expected']]
				greeting = content[cp['result']]
				passed = greeting == expected
				if not passed:
					 stdout.write(trml.BOLD)
				print '{:4d}      {:20s}      {:20s}      {:20s}'.format(rownum + 1, expected, greeting, passmsg if passed else failmsg), trml.BLACK
				if not passed:
					 stdout.write(trml.NORMAL)
				if passed:
					pcount += 1
				else:
					fcount += 1
			rownum += 1
		tsv.close()
	format = 'TEST RESULTS: ' + trml.GREEN + '%d PASSED ' + trml.RED + '%d FAILED'
	stdout.write(trml.BOLD)
	print '--------------------------------------------------------------------'
	print format % (pcount, fcount), trml.BLACK
	print '--------------------------------------------------------------------'
	print
	stdout.write(trml.NORMAL)

# --------------------------------------------------------------------------------
# RUN

if __name__ == '__main__':
	print
	print '------------------------------------------------------'
	print 'PROCESSING CUSTOMER DATA TO GENERATE CUSTOMER GREETING'
	print '------------------------------------------------------'
	testmode = len(argv) > 1 and argv[1] == 'test'
	if testmode:
		# Testmode
		print 'Running in test mode'
		print
		in_pat  = 'tests/custgreet_test_input*.txt'
		col_pos = {'title': 0, 'firstname': 1, 'lastname': 2, 'company': 3, 'expected': 4, 'result': 5}
		out_pre = 'tests/custgreet_test_output'
		def joinfun(d) : return d 
	else:
		# Livemode
		print 'Running in live mode'
		print
		in_pat  = 'custdata/report*.txt'
		col_pos = {'title': 9, 'firstname': 10, 'lastname': 11, 'company': 12, 'expected': None, 'result': 3}
		out_pre = 'custdata/processed'
		def joinfun(d) : return d[0:8] + d[13:33] 
	total = process_data(in_pat, col_pos, out_pre, joinfun, testmode)
	print
	print total, 'lines processed'
	print 'DONE'
	print
	if testmode:
		# Check the results of the test
		check_test_results(col_pos, out_pre)
