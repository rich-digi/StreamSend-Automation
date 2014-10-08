#!/bin/bash

# Add CSV header lines
#

sed -i '' '1i\
"Email","PrimaryDMID","URL","Time","IPAddress","UserAgent"
' reports/N*-clicks.csv
echo Added header to clicks.csv

sed -i '' '1i\
"Email","PrimaryDMID","Time","IPAddress","UserAgent"
' reports/N*-views.csv
echo Added header to views.csv

echo DONE
echo


