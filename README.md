# Infractions_Orford


Photo de la carte

Priorité 1

In the report of this Infraction_Orford project I want to convert the type 



Priorité 2
QR Code




Autre site...
Ouverture de piste. Un site pour enregistrer les timestamp des avertissements




Preliminary mandate :
Create a database of infractions, with two type of access :
1 - an easy HTML page to file in an infraction accessed by login. Could stay logged in for ever. Should be very easily accessible on cellphone. Should have a menu with :
	- login if not logged in other wise logout
	- survey page with a drop list at the top startin from new survey and the rest of the list are the surveys completed by the logged person. Text start with date dash the trail. At the bottom of the page if this is a new survey a button is there to save the survey. If an existing one is selected we should have a button at the top saying duplicate which create a new one from the field of the existing one but reinnit the time stamps. If an existing one is selected and the person don't click on duplicate but changes some fields... button at the bottom of the page should says "save modifications".
	
2 - an HTML page to admin all infractions.
	- List off the surveys (a toggle filters to show or not archived surveys... by default remove archive ones). Once you click on one, a modal view of the survey appears and you can add sanction and a check box to archive.
	- One page with the list of users to manage it (Create, delete, modify in a modal view)

Infractions should have the following fields:
- PatrolName (automatically filled in the survey mode due to login used and can't be modified)
- PatrolID (for data base only... not displayd on the survey page)
- TimeStampOffence (automatically filled in the survey mode with two field : date and hours but can be modified)
- OffenderName of the person intercepted
- OffenderImage (Patrol can take picture with the phone to add automatically in the survey)
- OffenceType (text to be typed in)
- Trail (should be part of a list pre loaded)... drop down menu in the survey
- OffPist (by default unchecked (so false) when survey )
- Practise (drop down of a list of practise)
- TimeStampCreation (time stamp at the creation... not modifiable)
- TimeStampModification (Time stamp = creation date at creation and then modified to the latest modification by the inspector)
- Archived (true or false managed by admin)
- CommentsAndSanctionAdmin (text managed by admin)
- TimeStampModificationAdmin (Date at which the admin has modified the surveys in the sanction field only)
- TimeStampArchivedAdmin (Date at which the admin has archived it)


Two list for drop down :
1 - Trails (list of possible ski trails + ski lifts from Mont Orford ) 
	- ...
2 - Practises
	- Ski alpin
	- Planche
	- Randonnée alpine
	- Randonnée pédestre
	- Autres...

One list for the users
	- User name
	- Type (Admin or Patrol)
	- TimeStampCreation
	- TimeStampModification (= creation to start)
