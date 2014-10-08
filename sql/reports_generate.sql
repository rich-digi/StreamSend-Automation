#
# Generate Clicks Report - saving as clicks.csv
# LinkID 4 is unsubscribe (excluded)
#

SELECT Email, PrimaryDMID, URL, Time, IPAddress, UserAgent
	INTO OUTFILE '/Users/richardknight/Documents/WORKAREA/DML/dmNewsTemplate_v5-inc-Gruntfile/reports/clicks.csv'
		FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"'
		ESCAPED BY '\\'
		LINES TERMINATED BY '\n'
	FROM Clickers JOIN Links ON Clickers.LinkID = Links.LinkID
	WHERE Clickers.LinkID<>4
	ORDER BY PrimaryDMID
	
#
# Generate Views Report CSV - saving as clicks.csv
#

SELECT Email, PrimaryDMID, Time, IPAddress, UserAgent
	INTO OUTFILE '/Users/richardknight/Documents/WORKAREA/DML/dmNewsTemplate_v5-inc-Gruntfile/reports/views.csv'
		FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"'
		ESCAPED BY '\\'
		LINES TERMINATED BY '\n'
	FROM Viewers
	ORDER BY PrimaryDMID

#
# Count clicks by link
#

UPDATE Links JOIN 
	(
		SELECT Links.LinkID, URL, COUNT(DISTINCT(Email)) AS Clicks
			FROM Links JOIN Clickers ON Links.LinkID = Clickers.LinkID
			GROUP BY LinkID ORDER BY LinkID
	) AS DT
ON Links.LinkID = DT.LinkID SET Links.Clicks = DT.Clicks