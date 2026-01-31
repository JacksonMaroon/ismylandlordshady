export const BOROUGH_NAMES: Record<string, string> = {
  manhattan: 'Manhattan',
  brooklyn: 'Brooklyn',
  queens: 'Queens',
  bronx: 'Bronx',
  'staten-island': 'Staten Island',
};

export const NEIGHBORHOODS_BY_BOROUGH: Record<string, string[]> = {
  manhattan: [
    'Upper East Side',
    'Upper West Side',
    'Harlem',
    'East Village',
    'West Village',
    'Chelsea',
    'Midtown',
    'Financial District',
    'SoHo',
    'Tribeca',
  ],
  brooklyn: [
    'Williamsburg',
    'Park Slope',
    'Bushwick',
    'Bedford-Stuyvesant',
    'Crown Heights',
    'Flatbush',
    'DUMBO',
    'Greenpoint',
    'Bay Ridge',
    'Sunset Park',
  ],
  queens: [
    'Astoria',
    'Long Island City',
    'Flushing',
    'Jackson Heights',
    'Jamaica',
    'Forest Hills',
    'Ridgewood',
    'Sunnyside',
    'Corona',
    'Elmhurst',
  ],
  bronx: [
    'South Bronx',
    'Fordham',
    'Riverdale',
    'Kingsbridge',
    'Mott Haven',
    'Hunts Point',
    'Tremont',
    'Pelham Bay',
    'Parkchester',
    'Soundview',
  ],
  'staten-island': [
    'St. George',
    'Stapleton',
    'New Dorp',
    'Tottenville',
    'Great Kills',
    'Port Richmond',
    'West Brighton',
  ],
};

export function slugifyNeighborhood(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}
