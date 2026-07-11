// City name -> [lat, lng] for German cities (subset from web frontend)
export const CITY_COORDINATES = {
  Berlin: [52.52, 13.405],
  Munich: [48.1351, 11.582],
  München: [48.1351, 11.582],
  Hamburg: [53.5511, 9.9937],
  Cologne: [50.9375, 6.9603],
  Frankfurt: [50.1109, 8.6821],
  Stuttgart: [48.7758, 9.1829],
  Düsseldorf: [51.2277, 6.7735],
  Dortmund: [51.5136, 7.4653],
  Essen: [51.4556, 7.0116],
  Leipzig: [51.3397, 12.3731],
  Bremen: [53.0793, 8.8017],
  Dresden: [51.0504, 13.7373],
  Hannover: [52.3759, 9.732],
  Nuremberg: [49.4521, 11.0767],
  Bonn: [50.7374, 7.0982],
  Karlsruhe: [49.0069, 8.4037],
  Mannheim: [49.4875, 8.4662],
  Augsburg: [48.3715, 10.8985],
  Heidelberg: [49.3988, 8.6724],
  Freiburg: [47.999, 7.8421],
  Mainz: [49.9929, 8.2473],
  Aachen: [50.7753, 6.0839],
  Kiel: [54.3233, 10.1228],
  Potsdam: [52.3906, 13.0645],
};

export function getCityCoordinates(cityName) {
  if (!cityName) return null;
  const trimmed = cityName.trim();
  if (CITY_COORDINATES[trimmed]) return CITY_COORDINATES[trimmed];
  const match = Object.keys(CITY_COORDINATES).find(
    (key) => key.toLowerCase() === trimmed.toLowerCase()
  );
  return match ? CITY_COORDINATES[match] : null;
}

export function groupMembersByCity(members) {
  const groups = {};
  members.forEach((member) => {
    const city = member.germany_city?.trim();
    if (!city) return;
    if (!groups[city]) groups[city] = [];
    groups[city].push(member);
  });
  return groups;
}
