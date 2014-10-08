#
# Add PrimaryDMIDs to the records in the Viewers and Clickers tables
#

LOAD DATA LOCAL INFILE '/Users/richardknight/Documents/WORKAREA/DML/dmNews-Oct14/reports/primary_dmid_link.tsv'
		INTO TABLE dmnews_reports.PDMIDLink
		FIELDS TERMINATED BY '\t' OPTIONALLY ENCLOSED BY '"'
		ESCAPED BY '\\'
		LINES TERMINATED BY '\r'
		IGNORE 1 LINES
		(Email, PrimaryDMID);

UPDATE Clickers JOIN PDMIDLink ON Clickers.Email = PDMIDLink.Email SET Clickers.PrimaryDMID = PDMIDLink.PrimaryDMID;
UPDATE Viewers JOIN PDMIDLink ON Viewers.Email = PDMIDLink.Email SET Viewers.PrimaryDMID = PDMIDLink.PrimaryDMID;