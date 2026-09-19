/** India international airports (IATA) for Flyers From */
export const INDIA_AIRPORTS = [
  { code: 'DEL', city: 'Delhi', name: 'Indira Gandhi Intl' },
  { code: 'BOM', city: 'Mumbai', name: 'Chhatrapati Shivaji Maharaj Intl' },
  { code: 'BLR', city: 'Bengaluru', name: 'Kempegowda Intl' },
  { code: 'HYD', city: 'Hyderabad', name: 'Rajiv Gandhi Intl' },
  { code: 'MAA', city: 'Chennai', name: 'Chennai Intl' },
  { code: 'CCU', city: 'Kolkata', name: 'Netaji Subhas Chandra Bose Intl' },
  { code: 'COK', city: 'Kochi', name: 'Cochin Intl' },
  { code: 'AMD', city: 'Ahmedabad', name: 'Sardar Vallabhbhai Patel Intl' },
  { code: 'GOI', city: 'Goa', name: 'Dabolim' },
  { code: 'GOX', city: 'Goa (Mopa)', name: 'Manohar Intl' },
  { code: 'PNQ', city: 'Pune', name: 'Pune Intl' },
  { code: 'TRV', city: 'Thiruvananthapuram', name: 'Trivandrum Intl' },
  { code: 'ATQ', city: 'Amritsar', name: 'Sri Guru Ram Dass Jee Intl' },
  { code: 'LKO', city: 'Lucknow', name: 'Chaudhary Charan Singh Intl' },
  { code: 'JAI', city: 'Jaipur', name: 'Jaipur Intl' },
  { code: 'IXC', city: 'Chandigarh', name: 'Chandigarh Intl' },
  { code: 'GAU', city: 'Guwahati', name: 'Lokpriya Gopinath Bordoloi Intl' },
  { code: 'BBI', city: 'Bhubaneswar', name: 'Biju Patnaik Intl' },
  { code: 'IDR', city: 'Indore', name: 'Devi Ahilya Bai Holkar' },
  { code: 'NAG', city: 'Nagpur', name: 'Dr. Babasaheb Ambedkar Intl' },
  { code: 'IXE', city: 'Mangaluru', name: 'Mangalore Intl' },
  { code: 'VTZ', city: 'Visakhapatnam', name: 'Visakhapatnam Intl' },
  { code: 'PAT', city: 'Patna', name: 'Jay Prakash Narayan Intl' },
  { code: 'SXR', city: 'Srinagar', name: 'Sheikh ul-Alam Intl' },
  { code: 'IXZ', city: 'Port Blair', name: 'Veer Savarkar Intl' },
  { code: 'STV', city: 'Surat', name: 'Surat Intl' },
  { code: 'IXB', city: 'Bagdogra', name: 'Bagdogra' },
  { code: 'RPR', city: 'Raipur', name: 'Swami Vivekananda' },
  { code: 'IXR', city: 'Ranchi', name: 'Birsa Munda' },
  { code: 'IXM', city: 'Madurai', name: 'Madurai' },
];

/** Germany airports (IATA) for Flyers To */
export const GERMANY_AIRPORTS = [
  { code: 'FRA', city: 'Frankfurt', name: 'Frankfurt Airport' },
  { code: 'MUC', city: 'Munich', name: 'Franz Josef Strauss' },
  { code: 'BER', city: 'Berlin', name: 'Brandenburg' },
  { code: 'DUS', city: 'Düsseldorf', name: 'Düsseldorf Airport' },
  { code: 'HAM', city: 'Hamburg', name: 'Hamburg Airport' },
  { code: 'CGN', city: 'Cologne', name: 'Cologne Bonn' },
  { code: 'STR', city: 'Stuttgart', name: 'Stuttgart Airport' },
  { code: 'HAJ', city: 'Hanover', name: 'Hannover Airport' },
  { code: 'NUE', city: 'Nuremberg', name: 'Nuremberg Airport' },
  { code: 'LEJ', city: 'Leipzig', name: 'Leipzig/Halle' },
  { code: 'BRE', city: 'Bremen', name: 'Bremen Airport' },
  { code: 'DRS', city: 'Dresden', name: 'Dresden Airport' },
  { code: 'DTM', city: 'Dortmund', name: 'Dortmund Airport' },
  { code: 'FMO', city: 'Münster', name: 'Münster/Osnabrück' },
  { code: 'HHN', city: 'Frankfurt-Hahn', name: 'Frankfurt-Hahn' },
  { code: 'NRN', city: 'Weeze', name: 'Weeze Airport' },
  { code: 'FKB', city: 'Karlsruhe', name: 'Baden-Airpark' },
  { code: 'PAD', city: 'Paderborn', name: 'Paderborn/Lippstadt' },
  { code: 'FDH', city: 'Friedrichshafen', name: 'Friedrichshafen' },
  { code: 'SCN', city: 'Saarbrücken', name: 'Saarbrücken Airport' },
];

export function formatAirportLabel(airport) {
  if (!airport) return '';
  return `${airport.code} - ${airport.city}`;
}

export function airportLabelWithName(airport) {
  if (!airport) return '';
  return `${airport.code} - ${airport.city}`;
}
