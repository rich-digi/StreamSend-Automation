#
# Add PrimaryDMIDs to the records in the Viewers and Clickers tables
#

UPDATE Clickers JOIN PDMIDLink ON Clickers.Email = PDMIDLink.Email SET Clickers.PrimaryDMID = PDMIDLink.PrimaryDMID;
UPDATE Viewers JOIN PDMIDLink ON Viewers.Email = PDMIDLink.Email SET Viewers.PrimaryDMID = PDMIDLink.PrimaryDMID;