#!/bin/bash

# Add CSV header lines
#

echo

sed -i '' '1i\
"Email","PrimaryDMID","URL","Time","IPAddress","UserAgent"
' reports/clicks.csv
echo Added header to clicks.csv

sed -i '' '1i\
"Email","PrimaryDMID","Time","IPAddress","UserAgent"
' reports/views.csv
echo Added header to views.csv

echo DONE
echo


