# --------------------------------------------------------------------------------
# Join multiple CSV files
# --------------------------------------------------------------------------------


# Maximum open file size
MAX_SHARD_SIZE_BYTES = 100 * 1024 * 1024.0 # 100 MB * 1024 (KB/MB) * 1024(B/KB)


# Maximum lines per split file
MAX_LINES_PER_FILE = 7500


import glob, os, sys, shutil
import math, random
import tempfile
from itertools import groupby, count


def combine(input_path, suffix, output_file):
	print
	print 'COMBINING %s FILES AT %s' % (suffix, input_path)
	print
	filewriter = open(output_file, 'wb')
	file_counter = 0
	for input_file in glob.glob(os.path.join(input_path, '*.' + suffix)):
		print 'Reading file ' + input_file
		with open(input_file, 'rU') as csv_file:
			if file_counter < 1:
				for row in csv_file:
					filewriter.write(row)
			else:
				header = next(csv_file, None)
				for row in csv_file:
					filewriter.write(row)
			file_counter += 1
	print
	print 'Files combined into one: ' + output_file
	print
		
		
def sharded_shuffle(in_name, out_name):
	'''
	Randomly shuffles the lines of very large text files with minimal memory usage

	__author__	= "Charles R. Schmidtc <schmidtc@gmail.com> "
	
	MODIFIED by RAK to preserve CSV header lines
	'''
	print
	print 'SHUFFLING LINES IN %s' % in_name
	print
	global shards
	infile = open(in_name, 'r')
	infile.seek(0, 2) # Go to the end of the file (2 means the end)
	length = infile.tell()
	infile.seek(0) # Go to the start of the file
	n_shards = int(math.ceil(length/MAX_SHARD_SIZE_BYTES))
	shards = [tempfile.TemporaryFile('w+') for i in range(n_shards)]

	print 'Sharding with %d shards' % n_shards
	for i, line in enumerate(infile):
		if i == 0:
			header = line
		else:
			shard = i % n_shards
			shards[shard].write(line)
	infile.close()

	info = {}
	for i, shard in enumerate(shards):
		print 'Shuffling shard', i
		shard.flush()
		shard.seek(0)
		lines = shard.readlines()
		info[i] = len(lines)
		random.shuffle(lines)

		shard.seek(0)
		shard.truncate(0)
		shard.writelines(lines)
		shard.seek(0)

	o = open(out_name, 'w')
	o.write(header)
	print 'Writing'
	while shards:
		shard = random.randrange(0,n_shards)
		line = shards[shard].readline()
		if line:
			o.write(line)
		else:
			print 'Closing shard'
			shards[shard].close()
			shards.pop(shard)
			n_shards = len(shards)
	o.close()
	print
	print 'Combined data shuffled: ' + out_name
	print
		
		
def deal(shuffled, outdir, pieces):
	pieces = int(pieces)
	print
	print 'DEALING INTO %d' % pieces
	print
	splits = [open(outdir + chr(65 + i) + '-split.tsv', 'w+') for i in range(pieces)]
	shuffled_file = open(shuffled, 'r')
	for i, line in enumerate(shuffled_file):
		if i == 0:
			header = line
			for sp in splits:
				print 'Starting file %s' % sp.name
				sp.write(header)
		else:
			m = i % pieces
			splits[m].write(line)
	shuffled_file.close()
	for sp in splits:
		sp.close()
	

def split(sourcefile, temp_dir, max_lines = MAX_LINES_PER_FILE):
	print
	print 'SPLITTING %s INTO MULTIPLE FILES (Max %d lines each, excluding header)' % (sourcefile, max_lines)
	print
	ext_free_name = os.path.basename(sourcefile)
	suffix 		  = os.path.splitext(sourcefile)[1]
	with open(sourcefile, 'r') as datafile:
		header = datafile.next()
		groups = groupby(datafile, key=lambda k, line=count(): next(line) // max_lines)
		for k, group in groups:
			output_name = os.path.normpath(os.path.join(temp_dir + os.sep, '%s-%s%s' % (ext_free_name, k, suffix)))
			print 'Writing %s' % output_name
			with open(output_name, 'a') as outfile:
				outfile.write(header)	
				outfile.write(''.join(group))	


def print_usage():
	print 'Usage: python shuffle_split.py /path/to/input filesuffix number-of-pieces'
	print 'Eg.  : python shuffle_split.py input/         tsv        4'


if __name__ == '__main__':
	print
	print '--------------------------'
	print 'COMBINE, SHUFFLE AND SPLIT'
	print '--------------------------'
	if len(sys.argv) == 4:
		inpdir = sys.argv[1] # Path to input directory
		suffix = sys.argv[2] # File suffix (e.g. 'tsv')
		pieces = sys.argv[3] # Number of pieces to split the shuffled data into
		if not os.path.exists(inpdir):
			print_usage()
		else:
			if os.path.isdir('temp'):
				shutil.rmtree('temp')
			if os.path.isdir('output'):
				shutil.rmtree('output')
			os.mkdir('temp')
			os.mkdir('output')
			combine(inpdir, suffix, 'temp/_combined.tsv')
			sharded_shuffle('temp/_combined.'+suffix, 'temp/_shuffled.'+suffix)
			deal('temp/_shuffled.'+suffix, 'temp/', pieces)
			for dealt_file in glob.glob(os.path.join('temp/', '*-split.' + suffix)):
				split(dealt_file, 'output', MAX_LINES_PER_FILE)
			print
			print 'DONE'
			print
	else:
		print_usage()
