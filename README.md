# Infractions_Orford



Priorité 1
But: Ajoute une gestion de reporting de signalisation appelé "signalisation".

Les pages sont dans l'ordre suivant :
- infractions
- signalisations (nouvelle pour enregistrer des signalisation)
- admin Infractions
- admin signalisations (nouvelle)

La page de signalisation doit avoir les champs suivants
	1 - Une photo ou un status (l'un ou l'autre obligatoire) Le status est issue d'une drop list comme pour la localiation avec au choix "fermée" ou "attention requise" ou "ouverte"
	2 - une localidation obligatoire (mpeme système que pour les infractions (secteur puis piste)
	4 - optionnel un commentaire
	5 - Inspecteur (entrée automatique comme pour le reporting d'infraction)
	5 - Time stamp Date et heure (entrée automatique comme pour le reporting d'infraction)
	6 - Sauvegarde (ou modif si une signaisation passée est sélectionnée comme pour les infractions)

Comme pour le reporting... un utilisateur peut voir et modifier les anciens rapports de signalisation. Le même système de timestamp (création et modif est requis).

La page admin actuel pour les infraction est renommé "admin Infractions"

Une autre page admin pour signalisation est créer "admin signalisation"

Dans cette dernière l'admin à accès à la liste complète et peu basculé un status (même droplist qu'à la cération) et sauver avec un timestamp. Un filtre affichant les signalisations ouvertes est désélectionnée par défaut pour limiter la lisate au signalisation avec un autre status ou pas de status (comme pour les infractions archivées dans la page admin).



Priorité 2
Photo de la carte, gestion de code QR...

