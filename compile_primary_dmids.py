# --------------------------------------------------------------------------------
# Compile a TSV linking Emails with Primary DMIDs from report1...reportN.txt
# --------------------------------------------------------------------------------

import glob, csv
output = open('reports/primary_dmid_link.tsv', 'wb')
writer = csv.writer(output, delimiter='\t', quotechar='"', quoting=csv.QUOTE_ALL)
writer.writerow(['Email', 'PrimaryDMID'])
extract_cols = [0, 1]
total = 0
for file in glob.glob('custdata/report*.txt'):
	tsv = open(file, 'rU')
	reader = csv.reader(tsv, delimiter='\t')
	rownum = 0
	for row in reader:
		if rownum > 0:
			content = list(row[i] for i in extract_cols)
			print total, content
			writer.writerow(content)
		rownum += 1
		total  += 1
	tsv.close()
output.close()
print
print total, 'emails and Primary DMIDs Extracted'
print 'DONE'
print