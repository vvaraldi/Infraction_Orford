/**
 * trails-data.js
 * Complete trails and lifts data for Mont Orford
 * Organized by sector for dropdown selection
 */

const TRAILS_DATA = {
  'mont-orford': {
    name: 'Mont-Orford',
    trails: [
      'Trois Ruisseaux',
      'Grande Coulée',
      'Inter',
      'Maxi',
      '4 KM',
      'Escapade',
      'Boisée',
      'Balade',
      'Connection',
      'Passe-Partout',
      'Belette',
      'L\'Initiation',
      'Mini-Passe',
      'Super Bas',
      'Contour',
      'L\'Intrépide',
      'Passe de l\'Ours',
      'Chevreuil',
      'Porc-Épic',
      'Passe à Liguori',
      'Petit Canyon',
      'L\'Orignal',
      'L\'Écureuil',
      'Arcade',
      'L\'Entre-Deux',
      'Diversion',
      'Rochers Jumeaux',
      'Express',
      'Passe',
      'Parc familial'
    ]
  },
  'giroux-nord': {
    name: 'Mont Giroux Nord',
    trails: [
      'Magog',
      'Familiale',
      'Jean-d\'Avignon',
      'Pente Douce',
      'Magnum',
      'Parc principal',
      'Parc Découverte',
      'La 45',
      'Mitaine',
      'La Passe 45',
      'Forêt magique',
      'Accès',
      'L\'Alternative',
      'Petite Coulée',
      'Gagnon',
      'Bowen',
      'Lièvre',
      'Adams'
    ]
  },
  'giroux-est': {
    name: 'Mont Giroux Est',
    trails: [
      'Sherbrooke',
      'Slalom',
      'Passe Montagne',
      'Labrecque',
      'Lacroix',
      'Dubreuil',
      'Boogie',
      'Sasquatch',
      'Nicolas Fontaine',
      'Lloyd Langlois'
    ]
  },
  'alfred-desrochers': {
    name: 'Mont Alfred-DesRochers',
    trails: [
      'Petite Ours',
      'Descente',
      'Le Lien',
      'Ookpic',
      'Grande-Allée',
      'Cascade',
      'Toussiski'
    ]
  },
  'remontees': {
    name: 'Remontées mécaniques',
    trails: [
      'Rapido',
      'Télécabine hybride',
      'Alfred-Desrochers',
      'Quad Giroux Nord',
      'Tapis Giroux Nord 1',
      'Tapis Giroux Nord 2',
      'Quad Giroux Est'
    ]
  },
  'randonnee-alpine': {
    name: 'Randonnée alpine',
    trails: [
      'Le Chevreuil',
      'La Tourterelle',
      'Le Grand-Duc',
      'La Crête',
      'Le Lynx',
      'Le Campagnol',
      'L\'Hermine',
      'L\'Alouette',
      'L\'Urubu',
      'La Carcajou',
      'La Mille-Pattes'
    ]
  }
};

/**
 * Get trails for a specific sector
 * @param {string} sectorId - The sector ID
 * @returns {string[]} Array of trail names
 */
function getTrailsForSector(sectorId) {
  const sector = TRAILS_DATA[sectorId];
  return sector ? sector.trails : [];
}

/**
 * Get sector name by ID
 * @param {string} sectorId - The sector ID
 * @returns {string} Sector display name
 */
function getSectorName(sectorId) {
  const sector = TRAILS_DATA[sectorId];
  return sector ? sector.name : '';
}

/**
 * Get all sectors as options
 * @returns {Array} Array of {id, name} objects
 */
function getAllSectors() {
  return Object.keys(TRAILS_DATA).map(id => ({
    id: id,
    name: TRAILS_DATA[id].name
  }));
}

/**
 * Format location for display
 * @param {string} sectorId - The sector ID
 * @param {string} trailName - The trail name
 * @param {boolean} offPiste - Whether it's off-piste
 * @returns {string} Formatted location string
 */
function formatLocation(sectorId, trailName, offPiste = false) {
  const sectorName = getSectorName(sectorId);
  let location = `${sectorName} - ${trailName}`;
  if (offPiste) {
    location += ' (Hors-piste)';
  }
  return location;
}