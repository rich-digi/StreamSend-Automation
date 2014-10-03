# --------------------------------------------------------------------------------
# Process Customer Greeting
# --------------------------------------------------------------------------------

import glob, csv, string, re
fallback = 'dmClub Member'
extract_cols = range(34)

# --------------------------------------------------------------------------------
# make_greeting function

def make_greeting(title, firstname, lastname, company):
	#
	# Try to generate a name-based greeting e.g. Dear Sam or Dear Mr Smith
	#
	if re.search('[^\w\s.\'-]', firstname + lastname):
		#
		# Firstname or lastname contain illegal characters: non alpha-numeric (_.'- and space allowed)
		#
		return fallback
	
	title 		= title.lower().title()
	firstname 	= firstname.lower().title()
	lastname 	= lastname.lower().title()
	company 	= company.lower().title()
	
	title 		= re.sub('\.', '', title)
	firstname 	= re.sub('[^\w\s\'-]', '', firstname)
	lastname 	= re.sub('[^\w\s\'-]', '', lastname)
	
	if title not in ['', 'Mr', 'Mrs', 'Miss', 'Ms', 'Dr']:
		return fallback
	
	firstnames = firstname.split()
	if len(firstnames) and len(firstnames[0]) > 2:
		cgn = firstnames[0]

	elif len(lastname) > 2 and title:
		if lastname[0:2] == 'Mc':
			lastname = 'Mc' + lastname[2:].title()
		elif lastname[0:3] == 'Mac':
			lastname = 'Mac' + lastname[3:].title()
		elif lastname[0:2] == 'O\'':
			lastname = 'O\'' + lastname[2:].title()
		elif lastname[0:4] == 'Von ':
			lastname = 'von ' + lastname[4:].title()
		cgn = '%s %s' % (title, lastname)

	elif len(lastname) > 2:
		cgn = 'Mr/Mrs/Ms %s' % lastname

	elif len(company) > 3:
		cgn = company

	else:
		cgn = fallback
			
	return cgn

# --------------------------------------------------------------------------------
# RUN

total = 0
for file in glob.glob('custdata/report*.txt'):
	fileno = re.match(r'custdata/report(\d+).txt', file)
	output = open('custdata/processed' + fileno.group(1) + '.tsv', 'wb')
	writer = csv.writer(output, delimiter='\t', quotechar='"', quoting=csv.QUOTE_ALL)
	tsv = open(file, 'rU')
	reader = csv.reader(tsv, delimiter='\t')
	rownum = 0
	for row in reader:
		content = list(row[i] for i in extract_cols)
		if rownum == 0:
			# Write header row
			writer.writerow(content[0:8] + content[13:33])
			# writer.writerow(content)
		else:
			total  += 1
			ori = content[3] # CustomerGreetName is column 4
			
			# Extract data from row
			title 		= content[9]
			firstname 	= content[10]
			lastname 	= content[11]
			company 	= content[12]

			cgn = make_greeting(title, firstname, lastname, company)
						
			print '{:40s}      {:40s}'.format(ori, cgn)
			content[3] = cgn
			writer.writerow(content[0:8] + content[13:33])
			# writer.writerow(content)
		rownum += 1
	tsv.close()
	output.close()
print
print total, 'lines processed'
print 'DONE'
print

