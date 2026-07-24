// Comprehensive list of German cities, towns, villages, neighborhoods, and districts
// Top cities prioritized for Indian students and major universities
export const TOP_CITIES = [
  // Tier 1: Most popular cities with top universities for Indian students
  'Munich',           // TU Munich, LMU Munich - Very popular
  'Berlin',           // TU Berlin, HU Berlin, FU Berlin - Very popular
  'Aachen',           // RWTH Aachen - Very popular for engineering
  'Stuttgart',        // University of Stuttgart - Popular
  'Karlsruhe',        // KIT (Karlsruhe Institute of Technology) - Very popular for engineering
  'Darmstadt',        // TU Darmstadt - Popular for engineering
  'Heidelberg',       // Heidelberg University - Popular
  'Frankfurt',        // Goethe University Frankfurt - Popular
  'Cologne',          // University of Cologne - Popular
  'Hamburg',          // University of Hamburg - Popular
  'Bonn',             // University of Bonn - Popular
  'Mannheim',         // University of Mannheim - Popular for business
  'Freiburg',         // University of Freiburg - Popular
  'Tübingen',         // University of Tübingen - Popular
  'Göttingen',        // University of Göttingen - Popular
  'Erlangen',         // FAU Erlangen-Nuremberg - Popular
  'Ulm',              // University of Ulm - Popular
  'Braunschweig',     // TU Braunschweig - Popular for engineering
  'Düsseldorf',       // Heinrich Heine University - Popular
  'Dortmund',         // TU Dortmund - Popular
  'Bremen',           // University of Bremen - Popular
  'Leipzig',          // University of Leipzig - Popular
  'Dresden',          // TU Dresden - Popular
  'Hannover',         // Leibniz University Hannover - Popular
  'Nuremberg',        // FAU Erlangen-Nuremberg - Popular
  'Münster',          // University of Münster - Popular
  'Regensburg',       // University of Regensburg - Popular
  'Würzburg',         // University of Würzburg - Popular
  'Mainz',            // Johannes Gutenberg University Mainz - Popular
  'Kiel',             // University of Kiel - Popular
  'Rostock',          // University of Rostock - Popular
  'Jena',             // Friedrich Schiller University Jena - Popular
  'Marburg',          // Philipps University Marburg - Popular
  'Gießen',           // Justus Liebig University Giessen - Popular
  'Kaiserslautern',   // Technical University of Kaiserslautern - Popular
  'Siegen',           // University of Siegen - Popular
  'Paderborn',        // University of Paderborn - Popular
  'Bielefeld',        // Bielefeld University - Popular
  'Essen',            // University of Duisburg-Essen - Popular
  'Duisburg'          // University of Duisburg-Essen - Popular
]

// Comprehensive list of German places - Focused on university cities and major locations
// Reduced from 1000+ to ~250-300 most relevant places
export const ALL_GERMANY_PLACES = [
  // Major Cities with Universities (from TOP_CITIES)
  'Berlin', 'Munich', 'Hamburg', 'Cologne', 'Frankfurt', 'Stuttgart',
  'Düsseldorf', 'Dortmund', 'Essen', 'Leipzig', 'Bremen', 'Dresden',
  'Hannover', 'Nuremberg', 'Duisburg', 'Bochum', 'Wuppertal', 'Bielefeld',
  'Bonn', 'Münster', 'Karlsruhe', 'Mannheim', 'Augsburg', 'Wiesbaden',
  'Gelsenkirchen', 'Mönchengladbach', 'Braunschweig', 'Chemnitz', 'Kiel',
  'Aachen', 'Halle', 'Magdeburg', 'Freiburg', 'Krefeld', 'Lübeck',
  'Oberhausen', 'Erfurt', 'Mainz', 'Rostock', 'Kassel', 'Hagen',
  'Hamm', 'Saarbrücken', 'Mülheim', 'Potsdam', 'Ludwigshafen', 'Oldenburg',
  'Leverkusen', 'Osnabrück', 'Solingen', 'Heidelberg', 'Herne', 'Neuss',
  'Darmstadt', 'Paderborn', 'Regensburg', 'Ingolstadt', 'Würzburg', 'Fürth',
  'Wolfsburg', 'Offenbach', 'Ulm', 'Heilbronn', 'Pforzheim', 'Göttingen',
  'Bottrop', 'Trier', 'Recklinghausen', 'Reutlingen', 'Bremerhaven', 'Koblenz',
  'Bergisch Gladbach', 'Jena', 'Remscheid', 'Erlangen', 'Moers', 'Siegen',
  'Hildesheim', 'Salzgitter', 'Cottbus', 'Fulda', 'Gießen', 'Marburg',
  'Tübingen', 'Konstanz', 'Passau', 'Bamberg', 'Bayreuth', 'Aschaffenburg',
  'Landshut', 'Rosenheim', 'Straubing', 'Schweinfurt', 'Kempten', 'Weiden',
  'Hof', 'Coburg', 'Memmingen', 'Schwäbisch Hall', 'Baden-Baden',
  
  // Important University Cities (including Frankfurt an der Oder)
  'Frankfurt an der Oder',  // Europa-Universität Viadrina
  'Greifswald',             // University of Greifswald
  'Flensburg',              // University of Flensburg
  'Vechta',                 // University of Vechta
  'Eichstätt',              // Catholic University of Eichstätt-Ingolstadt
  'Weimar',                 // Bauhaus University Weimar
  'Clausthal',              // Clausthal University of Technology
  'Ilmenau',                // Ilmenau University of Technology
  'Zittau',                 // Zittau/Görlitz University
  'Wildau',                 // Technical University of Wildau
  'Brandenburg an der Havel', // Brandenburg University of Technology
  'Eberswalde',            // Eberswalde University for Sustainable Development
  'Neubrandenburg',        // Neubrandenburg University of Applied Sciences
  'Stralsund',             // Stralsund University of Applied Sciences
  'Wismar',                // Wismar University
  'Schwerin',              // Capital city with universities nearby
  'Lüneburg',              // Leuphana University Lüneburg
  'Wolfenbüttel',          // Ostfalia University
  'Esslingen',             // Esslingen University
  'Offenburg',             // Offenburg University
  'Bruchsal',              // Near Karlsruhe
  'Hanau',                 // Near Frankfurt
  'Freising',              // Near Munich (TU Munich campus)
  'Weihenstephan',         // Near Munich (TU Munich campus)
  
  // Berlin Districts (Major ones)
  'Berlin Mitte', 'Berlin Prenzlauer Berg', 'Berlin Kreuzberg', 'Berlin Friedrichshain',
  'Berlin Charlottenburg', 'Berlin Wilmersdorf', 'Berlin Schöneberg', 'Berlin Neukölln',
  'Berlin Tempelhof', 'Berlin Steglitz', 'Berlin Zehlendorf', 'Berlin Spandau',
  'Berlin Pankow', 'Berlin Reinickendorf', 'Berlin Lichtenberg', 'Berlin Marzahn',
  'Berlin Hellersdorf', 'Berlin Treptow-Köpenick',
  
  // Munich Districts (Major ones)
  'Munich Altstadt', 'Munich Schwabing', 'Munich Maxvorstadt', 'Munich Neuhausen',
  'Munich Nymphenburg', 'Munich Bogenhausen', 'Munich Haidhausen', 'Munich Sendling',
  'Munich Pasing', 'Munich Freimann', 'Munich Trudering',
  
  // Hamburg Districts (Major ones)
  'Hamburg Altstadt', 'Hamburg St. Pauli', 'Hamburg Altona', 'Hamburg Eimsbüttel',
  'Hamburg Barmbek', 'Hamburg Winterhude', 'Hamburg Eppendorf', 'Hamburg Wandsbek',
  'Hamburg Rahlstedt', 'Hamburg Blankenese',
  
  // Cologne Districts (Major ones)
  'Cologne Altstadt', 'Cologne Neustadt', 'Cologne Deutz', 'Cologne Lindenthal',
  'Cologne Sülz', 'Cologne Ehrenfeld', 'Cologne Nippes', 'Cologne Chorweiler',
  
  // Frankfurt Districts (Major ones)
  'Frankfurt Altstadt', 'Frankfurt Innenstadt', 'Frankfurt Westend', 'Frankfurt Nordend',
  'Frankfurt Ostend', 'Frankfurt Bornheim', 'Frankfurt Sachsenhausen',
  
  // Stuttgart Districts (Major ones)
  'Stuttgart Mitte', 'Stuttgart Nord', 'Stuttgart Ost', 'Stuttgart Süd',
  'Stuttgart West', 'Stuttgart Bad Cannstatt', 'Stuttgart Vaihingen',
  
  // Düsseldorf Districts (Major ones)
  'Düsseldorf Altstadt', 'Düsseldorf Stadtmitte', 'Düsseldorf Bilk',
  'Düsseldorf Oberkassel', 'Düsseldorf Gerresheim',
  
  // Additional important cities
  'Ludwigsburg', 'Göppingen', 'Crailsheim', 'Aalen', 'Biberach',
  'Ravensburg', 'Friedrichshafen', 'Singen', 'Villingen-Schwenningen',
  'Lörrach', 'Worms', 'Dessau', 'Gera', 'Zwickau', 'Plauen',
  'Bautzen', 'Görlitz', 'Amberg', 'Deggendorf', 'Traunstein',
  'Berchtesgaden', 'Garmisch-Partenkirchen', 'Landsberg', 'Starnberg',
  'Weilheim', 'Murnau', 'Bad Kissingen'
]
