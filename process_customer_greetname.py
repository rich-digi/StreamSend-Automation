# --------------------------------------------------------------------------------
# Process Customer Greeting
# --------------------------------------------------------------------------------

import glob, csv, string, re
fallback = 'Dear dmClub Customer'
extract_cols = range(30)
total = 0
for file in glob.glob('custdata/report*.txt'):
	fileno = re.match(r'custdata/report(\d+).txt', file)
	output = open('custdata/report_processed' + fileno.group(1) + '.tsv', 'wb')
	writer = csv.writer(output, delimiter='\t', quotechar='"', quoting=csv.QUOTE_ALL)
	tsv = open(file, 'rU')
	reader = csv.reader(tsv, delimiter='\t')
	rownum = 0
	for row in reader:
		if rownum > 0:
			total  += 1
			content = list(row[i] for i in extract_cols)
			ori = content[3] # CustomerGreetName is column 4
			cgn = content[3]
			if '@' in cgn:
				cgn = fallback
			
			else:
				cgn = cgn.lower().title()
				cgn = re.sub('[%s]' % re.escape(string.punctuation), '', cgn)
				
				words = cgn.split()
				if len(words):
					
					if words[0] in ['Mr', 'Mrs', 'Miss', 'Ms', 'Dr'] and len(words) > 1:
						title = words[0]
						firstname = words[1]
					else:
						title = False
						firstname = words[0]
					
					if len(firstname) > 2:
						cgn = 'Dear %s' % firstname
					elif len(words) > 2 and title:
						cgn = 'Dear %s %s' % (title, words[-1])
					else:
						cgn = fallback
						
			print '{:40s}      {:40s}'.format(ori, cgn)
			content[3] = cgn
			writer.writerow(content)
		rownum += 1
	tsv.close()
	output.close()
print
print total, 'lines processed'
print 'DONE'
print