/**
 * The trip — every place visited, in the order visited, by what means.
 * Single source of truth for the map arcs, the journey scrubber, and the
 * derived Place list.
 */

import type { Continent } from "./places-types";

export type TransportMode = "flight" | "train" | "car" | "ship";

export type City = {
  slug: string;
  name: string;
  country: string;
  /** ISO-2 country code, used for highlight lookups against the world atlas. */
  countryCode: string;
  continent: Continent;
  coordinates: [number, number]; // [lon, lat]
  tagline: string;
  journal: string;
  photoSeeds?: string[];
};

export type Leg = {
  /** 1-based index in the journey order. */
  index: number;
  from: string;
  to: string;
  mode: TransportMode;
};

export const MODE_STYLE: Record<
  TransportMode,
  { label: string; color: string; dash: string; width: number }
> = {
  flight: { label: "Flight", color: "#ff8a4a", dash: "2 4", width: 0.8 },
  train: { label: "Train", color: "#7ad1a1", dash: "0", width: 1.1 },
  car: { label: "Drive", color: "#e8c46a", dash: "1 3", width: 1 },
  ship: { label: "Ship", color: "#74c0e6", dash: "4 2 1 2", width: 1.1 },
};

const PARIS_JOURNAL = `I had a list. I tossed the list. Paris is better when you are slightly late for everything you didn't plan.

Mornings at a café in the 11th, watching old men argue about something I couldn't follow. Afternoons in the Marais, getting lost on purpose. Evenings on a bridge.

The home base of every trip — I kept ending up back here, and that started feeling like a feature.`;

const NEW_YORK_JOURNAL = `New York doesn't owe you anything and it's better that way. The trip began here and the trip ended here.

A jazz trio in Washington Square. The 6 train delayed for reasons no one explained. A bookstore that smelled like every bookstore I've ever loved.

Going up to a rooftop at golden hour, the city looked tired and gorgeous and somehow younger than it has any right to be.`;

const MARRAKESH_JOURNAL = `The medina is a maze and a mood. Spice piles taller than my forearm, mopeds threading through gaps that shouldn't exist, and tea poured from above your head into a glass the size of a thimble.

I got lost three times in one afternoon. Each time it ended in a courtyard with a tiled fountain and someone offering me mint tea.

Night in Jemaa el-Fnaa: drum circles, snake charmers, fresh orange juice for one dirham. I stayed until the call to prayer.`;

export const CITIES: Record<string, City> = {
  "new-york": {
    slug: "new-york",
    name: "New York City",
    country: "United States",
    countryCode: "US",
    continent: "North America",
    coordinates: [-74.006, 40.7128],
    tagline: "Loud, fast, and somehow exactly right.",
    journal: NEW_YORK_JOURNAL,
    photoSeeds: ["nyc-skyline", "nyc-subway", "nyc-bodega"],
  },
  paris: {
    slug: "paris",
    name: "Paris",
    country: "France",
    countryCode: "FR",
    continent: "Europe",
    coordinates: [2.3522, 48.8566],
    tagline: "Croissant for breakfast, cigarette smoke for atmosphere.",
    journal: PARIS_JOURNAL,
    photoSeeds: ["paris-cafe", "paris-bridge", "paris-roof"],
  },
  brussels: {
    slug: "brussels",
    name: "Brussels",
    country: "Belgium",
    countryCode: "BE",
    continent: "Europe",
    coordinates: [4.3517, 50.8503],
    tagline: "Chocolate, comic strips, a parliament that won't choose sides.",
    journal:
      "Belgian fries with twelve sauces I'd never heard of. The Grand Place at dusk doesn't feel real. Trams that politely insist you make space.",
  },
  amsterdam: {
    slug: "amsterdam",
    name: "Amsterdam",
    country: "Netherlands",
    countryCode: "NL",
    continent: "Europe",
    coordinates: [4.9041, 52.3676],
    tagline: "Bicycles outnumber people. Canals don't keep score.",
    journal:
      "Brown cafés with newspapers attached to wooden poles. Boats moving slower than walkers. Light at 10 p.m. that I forgot the country had.",
  },
  rotterdam: {
    slug: "rotterdam",
    name: "Rotterdam",
    country: "Netherlands",
    countryCode: "NL",
    continent: "Europe",
    coordinates: [4.4777, 51.9244],
    tagline: "Holland's other Holland — all glass and ambition.",
    journal:
      "Bombed flat in 1940, rebuilt as something defiantly modern. The market hall is a horseshoe of color. The Cube Houses look like a kid drew them.",
  },
  barcelona: {
    slug: "barcelona",
    name: "Barcelona",
    country: "Spain",
    countryCode: "ES",
    continent: "Europe",
    coordinates: [2.1734, 41.3851],
    tagline: "Gaudí's curves and pan con tomate at midnight.",
    journal:
      "Sagrada Família still under construction after 140 years and somehow the better for it. The Gothic Quarter at 1 a.m. with no one around — like walking through a stage set.",
  },
  madrid: {
    slug: "madrid",
    name: "Madrid",
    country: "Spain",
    countryCode: "ES",
    continent: "Europe",
    coordinates: [-3.7038, 40.4168],
    tagline: "Dinner doesn't start until 10 — neither does the conversation.",
    journal:
      "Tapas standing up at a tile counter. The Prado, the Reina Sofía, then back to the bar. Three days; six naps.",
  },
  berlin: {
    slug: "berlin",
    name: "Berlin",
    country: "Germany",
    countryCode: "DE",
    continent: "Europe",
    coordinates: [13.405, 52.52],
    tagline: "History stitched into the sidewalks, kept honest by the graffiti.",
    journal:
      "Wall fragments in unexpected places. Currywurst at 2 a.m. A club that opened at midnight Friday and closed Monday morning, allegedly.",
  },
  munich: {
    slug: "munich",
    name: "Munich",
    country: "Germany",
    countryCode: "DE",
    continent: "Europe",
    coordinates: [11.582, 48.1351],
    tagline: "Beer halls older than most countries.",
    journal:
      "Lederhosen as workwear, not costume. A liter of beer arrives like a small piece of architecture. The English Garden has river surfers, somehow.",
  },
  geneva: {
    slug: "geneva",
    name: "Geneva",
    country: "Switzerland",
    countryCode: "CH",
    continent: "Europe",
    coordinates: [6.1432, 46.2044],
    tagline: "Swiss precision, French accent, lake clean enough to drink.",
    journal:
      "The Jet d'Eau is taller than it looks in photos. Watch shops next to UN missions. Three different countries within an hour by train.",
  },
  bern: {
    slug: "bern",
    name: "Bern",
    country: "Switzerland",
    countryCode: "CH",
    continent: "Europe",
    coordinates: [7.4474, 46.9479],
    tagline: "A capital that forgot to be loud about it.",
    journal:
      "Sandstone arcades, a clock tower that still works, bears with their own park. Einstein lived in apartment 49 and there's a small plaque, no fanfare.",
  },
  zurich: {
    slug: "zurich",
    name: "Zürich",
    country: "Switzerland",
    countryCode: "CH",
    continent: "Europe",
    coordinates: [8.5417, 47.3769],
    tagline: "Bahnhofstrasse on Saturday — quietly the richest mile in Europe.",
    journal:
      "Trams every six minutes, on time. Lake water you can drink. The old town climbs up steep cobbled lanes that all eventually lead to a fondue.",
  },
  interlaken: {
    slug: "interlaken",
    name: "Interlaken",
    country: "Switzerland",
    countryCode: "CH",
    continent: "Europe",
    coordinates: [7.8616, 46.6863],
    tagline: "Two lakes, one valley, a paragliding instructor named Hans.",
    journal:
      "Above the trees, in a harness, with the Jungfrau staring back. Below, fondue and a beer that tasted earned.",
  },
  prague: {
    slug: "prague",
    name: "Prague",
    country: "Czech Republic",
    countryCode: "CZ",
    continent: "Europe",
    coordinates: [14.4378, 50.0755],
    tagline: "Cobblestones, bell towers, beer cheaper than water.",
    journal:
      "The astronomical clock at the top of every hour, with a crowd that doesn't quite know what they're waiting for. Old Town at 6 a.m., empty, fog, magic.",
  },
  "paris-disney": {
    slug: "paris-disney",
    name: "Disneyland Paris",
    country: "France",
    countryCode: "FR",
    continent: "Europe",
    coordinates: [2.7783, 48.8722],
    tagline: "A mouse, a chateau, a French accent on Mickey.",
    journal:
      "Pommes frites at the gates of Sleeping Beauty's castle. Fireworks set to Édith Piaf. Cynicism doesn't survive the parade.",
  },
  budapest: {
    slug: "budapest",
    name: "Budapest",
    country: "Hungary",
    countryCode: "HU",
    continent: "Europe",
    coordinates: [19.0402, 47.4979],
    tagline: "Two cities pretending to be one, bridged by thermal baths.",
    journal:
      "Buda's hill, Pest's grid, the Danube splitting them politely. Széchenyi at sunset — old men playing chess in the steam.",
  },
  vienna: {
    slug: "vienna",
    name: "Vienna",
    country: "Austria",
    countryCode: "AT",
    continent: "Europe",
    coordinates: [16.3738, 48.2082],
    tagline: "Opera, schnitzel, a coffee culture older than the United States.",
    journal:
      "Café Central, four hours, one melange, no one rushed me. The Naschmarkt is a museum of pickled things. The Albertina has a Klimt at the end of every corridor.",
  },
  milan: {
    slug: "milan",
    name: "Milan",
    country: "Italy",
    countryCode: "IT",
    continent: "Europe",
    coordinates: [9.19, 45.4642],
    tagline: "Fashion from 9 to 6, aperitivo from 6 to 9.",
    journal:
      "The Duomo's facade has more spires than I could count and I tried twice. Aperitivo means a Negroni and a buffet you didn't pay for.",
  },
  florence: {
    slug: "florence",
    name: "Florence",
    country: "Italy",
    countryCode: "IT",
    continent: "Europe",
    coordinates: [11.2558, 43.7696],
    tagline: "The Renaissance, packaged.",
    journal:
      "The David is the size you expect and somehow the impact you don't. The Duomo's dome from the campanile — I had to sit down for a minute.",
  },
  rome: {
    slug: "rome",
    name: "Rome",
    country: "Italy",
    countryCode: "IT",
    continent: "Europe",
    coordinates: [12.4964, 41.9028],
    tagline: "Every street a museum, every museum half-closed for renovation.",
    journal:
      "The Pantheon, free entry, a hole in the ceiling that's been there for 1,900 years. Pasta carbonara that ruined every other carbonara.",
  },
  cairo: {
    slug: "cairo",
    name: "Cairo",
    country: "Egypt",
    countryCode: "EG",
    continent: "Africa",
    coordinates: [31.2357, 30.0444],
    tagline: "The pyramids are bigger and the traffic is worse than imagined.",
    journal:
      "Giza is suddenly there, the city right up against it. Khan el-Khalili at night, mint tea in a backroom, a man teaching me to say five things in Arabic in five minutes.",
  },
  copenhagen: {
    slug: "copenhagen",
    name: "Copenhagen",
    country: "Denmark",
    countryCode: "DK",
    continent: "Europe",
    coordinates: [12.5683, 55.6761],
    tagline: "Hygge, pickled herring, bicycles with kid-trailers attached.",
    journal:
      "Nyhavn at golden hour, with everyone politely trying to take the same photo. A smørrebrød lunch is twelve open-faced sandwiches and ninety minutes of your life.",
  },
  malmo: {
    slug: "malmo",
    name: "Malmö",
    country: "Sweden",
    countryCode: "SE",
    continent: "Europe",
    coordinates: [13.0038, 55.6049],
    tagline: "Twenty minutes from Copenhagen and a different country entirely.",
    journal:
      "The Øresund bridge from inside the bridge. Falafel everywhere — one of Europe's best, by accident. Turning Torso turning, slowly.",
  },
  koge: {
    slug: "koge",
    name: "Køge",
    country: "Denmark",
    countryCode: "DK",
    continent: "Europe",
    coordinates: [12.1833, 55.4565],
    tagline: "The Denmark you don't see in the postcards.",
    journal:
      "Painted half-timbered houses leaning into each other. A harbor with ferries to nowhere very dramatic. A bakery that put the others to shame.",
  },
  sofia: {
    slug: "sofia",
    name: "Sofia",
    country: "Bulgaria",
    countryCode: "BG",
    continent: "Europe",
    coordinates: [23.3219, 42.6977],
    tagline: "Roman ruins under a tram stop. Eastern Orthodox sun.",
    journal:
      "Excavations open in the middle of the metro station. Vitosha mountain right there at the end of the boulevard. Banitsa for breakfast, every day.",
  },
  bucharest: {
    slug: "bucharest",
    name: "Bucharest",
    country: "Romania",
    countryCode: "RO",
    continent: "Europe",
    coordinates: [26.1025, 44.4268],
    tagline: "The Paris of the East, before the East became the East.",
    journal:
      "Belle Époque mansions next to brutalist apartment blocks, both cracked, both somehow elegant. The Palace of Parliament is the second-largest building in the world; you can see it from everywhere.",
  },
  tromso: {
    slug: "tromso",
    name: "Tromsø",
    country: "Norway",
    countryCode: "NO",
    continent: "Europe",
    coordinates: [18.9553, 69.6492],
    tagline: "Aurora season. Sun never sets in summer; never rises in winter.",
    journal:
      "Above the Arctic Circle, polar nights, snow squeaking underfoot. The aurora was green, then purple, then green again — I just stood there.",
  },
  bergen: {
    slug: "bergen",
    name: "Bergen",
    country: "Norway",
    countryCode: "NO",
    continent: "Europe",
    coordinates: [5.3221, 60.3913],
    tagline: "Wooden warehouses on a fjord. Rain like clockwork.",
    journal:
      "Bryggen at dusk, the wooden gables tilted from centuries of damp. A funicular up Mount Fløyen and the city laid out like a map below.",
  },
  oslo: {
    slug: "oslo",
    name: "Oslo",
    country: "Norway",
    countryCode: "NO",
    continent: "Europe",
    coordinates: [10.7522, 59.9139],
    tagline: "Reserved, expensive, deeply kind.",
    journal:
      "The Munch Museum has The Scream behind glass and a guard who's seen people cry. The opera house's roof is also the front steps; you walk up it.",
  },
  stockholm: {
    slug: "stockholm",
    name: "Stockholm",
    country: "Sweden",
    countryCode: "SE",
    continent: "Europe",
    coordinates: [18.0686, 59.3293],
    tagline: "Fourteen islands, one bridge engineer's lifelong project.",
    journal:
      "Gamla Stan looks like a fairytale and smells like cinnamon. The metro stations are unfinished caverns lined with sculpture.",
  },
  tallinn: {
    slug: "tallinn",
    name: "Tallinn",
    country: "Estonia",
    countryCode: "EE",
    continent: "Europe",
    coordinates: [24.7536, 59.437],
    tagline: "Medieval old town with a tech bro's code on top.",
    journal:
      "Cobblestoned streets walled in by towers, e-residency offices around the corner. Estonia votes online; I was on the wrong side of the cobblestones.",
  },
  helsinki: {
    slug: "helsinki",
    name: "Helsinki",
    country: "Finland",
    countryCode: "FI",
    continent: "Europe",
    coordinates: [24.9384, 60.1699],
    tagline: "Saunas more common than gyms. Both serve a similar purpose.",
    journal:
      "Public sauna, then ice swim, then sauna. Repeat until you don't feel cold anymore. Cinnamon buns the size of your face.",
  },
  riga: {
    slug: "riga",
    name: "Riga",
    country: "Latvia",
    countryCode: "LV",
    continent: "Europe",
    coordinates: [24.1052, 56.9496],
    tagline: "Art Nouveau, amber, the most dramatic farmers market in Europe.",
    journal:
      "Five repurposed Zeppelin hangars filled with food. Façades on Alberta Street that should be in textbooks. Riga Black Balsam — a herbal liqueur that knows what it did.",
  },
  vilnius: {
    slug: "vilnius",
    name: "Vilnius",
    country: "Lithuania",
    countryCode: "LT",
    continent: "Europe",
    coordinates: [25.2797, 54.6872],
    tagline: "Hidden squares, basketball passion, both Baltic and Slavic.",
    journal:
      "The Republic of Užupis declared independence in 1997, has its own constitution, art galleries on every block. The cathedral square has a hidden tile that grants wishes; I made one.",
  },
  valletta: {
    slug: "valletta",
    name: "Valletta",
    country: "Malta",
    countryCode: "MT",
    continent: "Europe",
    coordinates: [14.5146, 35.8989],
    tagline: "Limestone the color of honey. Knights of old. Maltese cats.",
    journal:
      "A capital you can walk across in twenty minutes. Wooden balconies in every color. The Saluting Battery still fires at noon, just because.",
  },
  belgrade: {
    slug: "belgrade",
    name: "Belgrade",
    country: "Serbia",
    countryCode: "RS",
    continent: "Europe",
    coordinates: [20.4489, 44.7866],
    tagline: "A city knocked down 44 times that keeps coming back.",
    journal:
      "The Sava meets the Danube here, two rivers and an attitude. Floating river bars (splavovi) until 4 a.m., everyone smoking, no one rushed.",
  },
  larnaca: {
    slug: "larnaca",
    name: "Larnaca",
    country: "Cyprus",
    countryCode: "CY",
    continent: "Asia",
    coordinates: [33.6175, 34.9229],
    tagline: "Beach, salt lake, flamingos in winter.",
    journal:
      "The salt lake turns pink when the flamingos arrive. Lazarus was buried here, then resurrected; the church is named after him.",
  },
  paphos: {
    slug: "paphos",
    name: "Paphos",
    country: "Cyprus",
    countryCode: "CY",
    continent: "Asia",
    coordinates: [32.4296, 34.7768],
    tagline: "Aphrodite was born here, allegedly. The water makes a case.",
    journal:
      "Roman mosaics open to the sky, a half-functioning archaeological park, and a beach where Aphrodite supposedly stepped out of the sea.",
  },
  amman: {
    slug: "amman",
    name: "Amman",
    country: "Jordan",
    countryCode: "JO",
    continent: "Asia",
    coordinates: [35.9106, 31.9539],
    tagline: "Seven hills and a citadel older than writing.",
    journal:
      "A Roman amphitheater in the middle of downtown, kids playing soccer in it. Mansaf for dinner, eaten with the right hand, communally, hot.",
  },
  athens: {
    slug: "athens",
    name: "Athens",
    country: "Greece",
    countryCode: "GR",
    continent: "Europe",
    coordinates: [23.7275, 37.9838],
    tagline: "Marble temples and graffiti, both essential.",
    journal:
      "The Acropolis is right there, visible from breakfast. Plaka after dark — bouzouki music, octopus on the grill, a stray cat for company.",
  },
  istanbul: {
    slug: "istanbul",
    name: "Istanbul",
    country: "Türkiye",
    countryCode: "TR",
    continent: "Europe",
    coordinates: [28.9784, 41.0082],
    tagline: "Two continents, one bridge, infinite tea.",
    journal:
      "Hagia Sophia switching between empires for fifteen centuries and counting. The call to prayer rolls across the Bosphorus, then the seagulls take their turn.",
  },
  porto: {
    slug: "porto",
    name: "Porto",
    country: "Portugal",
    countryCode: "PT",
    continent: "Europe",
    coordinates: [-8.6291, 41.1579],
    tagline: "Port wine, blue tiles, the Douro.",
    journal:
      "Azulejo facades on every other building. A boat down the Douro, six bridges, light shifting every few minutes. Francesinha — a sandwich that thinks it's a meal.",
  },
  lisbon: {
    slug: "lisbon",
    name: "Lisbon",
    country: "Portugal",
    countryCode: "PT",
    continent: "Europe",
    coordinates: [-9.1393, 38.7223],
    tagline: "Fado in the alleys. Tram 28 doesn't care about your schedule.",
    journal:
      "Seven hills, all of them harder to climb than they look. Pastéis de Belém, still warm, dusted with cinnamon. Sunset over the Tagus from the Alfama miradouro.",
  },
  frankfurt: {
    slug: "frankfurt",
    name: "Frankfurt",
    country: "Germany",
    countryCode: "DE",
    continent: "Europe",
    coordinates: [8.6821, 50.1109],
    tagline: "Bankers and apple wine. Surprisingly, both work.",
    journal:
      "The skyline (Mainhattan) feels American, then you turn a corner and it's medieval again. Apfelwein with grüne Soße, a meal that makes no sense and works.",
  },
  tirana: {
    slug: "tirana",
    name: "Tirana",
    country: "Albania",
    countryCode: "AL",
    continent: "Europe",
    coordinates: [19.8187, 41.3275],
    tagline: "Communist gray painted into a riot of color, on purpose.",
    journal:
      "The mayor decided in 2000 to paint every drab apartment block in vivid patterns. It worked. Bunk'Art in an old bunker tells the rest of the story.",
  },
  skopje: {
    slug: "skopje",
    name: "Skopje",
    country: "North Macedonia",
    countryCode: "MK",
    continent: "Europe",
    coordinates: [21.4254, 41.9981],
    tagline: "Statues. So many statues. Statues of statues.",
    journal:
      "The 2014 plan added 137 new statues to the city center, allegedly. The result is unhinged and oddly endearing. The old bazaar across the river, calmer.",
  },
  pristina: {
    slug: "pristina",
    name: "Pristina",
    country: "Kosovo",
    countryCode: "XK",
    continent: "Europe",
    coordinates: [21.1655, 42.6629],
    tagline: "Europe's youngest capital, still figuring itself out.",
    journal:
      "A NEWBORN sculpture repainted every year. Café culture so strong it crowds out everything else. A hopeful, complicated place.",
  },
  podgorica: {
    slug: "podgorica",
    name: "Podgorica",
    country: "Montenegro",
    countryCode: "ME",
    continent: "Europe",
    coordinates: [19.2594, 42.4304],
    tagline: "Pleasantly unremarkable, beautifully placed.",
    journal:
      "Two rivers, mountains in every direction, a clock tower, a million coffees. Most travelers blow through; that felt like a mistake.",
  },
  seville: {
    slug: "seville",
    name: "Seville",
    country: "Spain",
    countryCode: "ES",
    continent: "Europe",
    coordinates: [-5.9845, 37.3891],
    tagline: "Flamenco, oranges, heat that physically presses you down.",
    journal:
      "The Alcázar's geometric tilework, an hour just staring. Plaza de España at sunset, all that ceramic glowing. Tapas standing up, again.",
  },
  granada: {
    slug: "granada",
    name: "Granada",
    country: "Spain",
    countryCode: "ES",
    continent: "Europe",
    coordinates: [-3.5986, 37.1773],
    tagline: "Tapas free with every drink. The Alhambra above.",
    journal:
      "The Alhambra at dawn — they only let in a few people, and every one of them goes quiet. From Mirador San Nicolás at sunset, the whole palace blushes.",
  },
  marrakesh: {
    slug: "marrakesh",
    name: "Marrakesh",
    country: "Morocco",
    countryCode: "MA",
    continent: "Africa",
    coordinates: [-7.9811, 31.6295],
    tagline: "All the colors at once.",
    journal: MARRAKESH_JOURNAL,
  },
  fes: {
    slug: "fes",
    name: "Fès",
    country: "Morocco",
    countryCode: "MA",
    continent: "Africa",
    coordinates: [-5.0078, 34.0181],
    tagline: "The world's oldest still-functioning university and a tannery you smell first.",
    journal:
      "Donkeys are still the only delivery vehicle that fits down some alleys. The Chouara Tannery from a leather shop's roof — vats of color, the smell strong enough to taste.",
  },
  casablanca: {
    slug: "casablanca",
    name: "Casablanca",
    country: "Morocco",
    countryCode: "MA",
    continent: "Africa",
    coordinates: [-7.5898, 33.5731],
    tagline: "Less Bogart, more port city. Surprisingly modern.",
    journal:
      "Hassan II Mosque, partly over the ocean, the largest in Africa, sun shining straight through retractable roof. The Atlantic doing its slow grey thing outside.",
  },
  krakow: {
    slug: "krakow",
    name: "Kraków",
    country: "Poland",
    countryCode: "PL",
    continent: "Europe",
    coordinates: [19.945, 50.0647],
    tagline: "A market square that has been the market square since 1257.",
    journal:
      "Kazimierz, the old Jewish quarter, half restored and half left as it was. Pierogi places that have been making pierogi since the 70s. Wawel Castle, on its hill.",
  },
  warsaw: {
    slug: "warsaw",
    name: "Warsaw",
    country: "Poland",
    countryCode: "PL",
    continent: "Europe",
    coordinates: [21.0122, 52.2297],
    tagline: "Rebuilt brick by brick. You can't tell — that's the point.",
    journal:
      "The old town is a meticulous postwar replica. The Palace of Culture is a Stalin gift no one asked for. Pączki with rose-petal jam, on a Tuesday.",
  },
  kutaisi: {
    slug: "kutaisi",
    name: "Kutaisi",
    country: "Georgia",
    countryCode: "GE",
    continent: "Asia",
    coordinates: [42.705, 42.2679],
    tagline: "Ancient Georgian capital. Not the Tbilisi people fly to.",
    journal:
      "Bagrati Cathedral up on its hill, half-restored, half-abandoned. Khachapuri at a lokali on the river, cheese and butter, no shame.",
  },
  tbilisi: {
    slug: "tbilisi",
    name: "Tbilisi",
    country: "Georgia",
    countryCode: "GE",
    continent: "Asia",
    coordinates: [44.8271, 41.7151],
    tagline: "Sulfur baths, wine older than civilization, a city with a coat.",
    journal:
      "Wooden balconies leaning over each other in Old Tbilisi. A sulfur bath at midnight — the man who scrubbed me did not believe in subtle. Wine in a clay vessel called a qvevri, 8,000 years of practice.",
  },
  yerevan: {
    slug: "yerevan",
    name: "Yerevan",
    country: "Armenia",
    countryCode: "AM",
    continent: "Asia",
    coordinates: [44.5152, 40.1872],
    tagline: "Pink stone city under Mount Ararat, technically across the border.",
    journal:
      "The Cascade staircase from top to bottom, a whole museum on the way down. Ararat looms over everything; Armenia can see it but can't visit it.",
  },
  london: {
    slug: "london",
    name: "London",
    country: "United Kingdom",
    countryCode: "GB",
    continent: "Europe",
    coordinates: [-0.1276, 51.5074],
    tagline: "Drizzle, dignity, a different accent every kilometer.",
    journal:
      "Borough Market on a Saturday — every cuisine, all at once. The British Museum's Reading Room, free, world-class, a quiet miracle.",
  },
};

export const LEGS: Leg[] = [
  { index: 1, from: "new-york", to: "paris", mode: "flight" },
  { index: 2, from: "paris", to: "brussels", mode: "train" },
  { index: 3, from: "brussels", to: "amsterdam", mode: "train" },
  { index: 4, from: "amsterdam", to: "rotterdam", mode: "train" },
  { index: 5, from: "rotterdam", to: "paris", mode: "train" },
  { index: 6, from: "paris", to: "barcelona", mode: "flight" },
  { index: 7, from: "barcelona", to: "madrid", mode: "flight" },
  { index: 8, from: "madrid", to: "berlin", mode: "flight" },
  { index: 9, from: "berlin", to: "munich", mode: "flight" },
  { index: 10, from: "munich", to: "geneva", mode: "flight" },
  { index: 11, from: "geneva", to: "bern", mode: "train" },
  { index: 12, from: "bern", to: "zurich", mode: "train" },
  { index: 13, from: "zurich", to: "interlaken", mode: "train" },
  { index: 14, from: "interlaken", to: "geneva", mode: "train" },
  { index: 15, from: "geneva", to: "prague", mode: "flight" },
  { index: 16, from: "prague", to: "paris-disney", mode: "flight" },
  { index: 17, from: "paris-disney", to: "budapest", mode: "flight" },
  { index: 18, from: "budapest", to: "vienna", mode: "flight" },
  { index: 19, from: "vienna", to: "milan", mode: "flight" },
  { index: 20, from: "milan", to: "florence", mode: "train" },
  { index: 21, from: "florence", to: "rome", mode: "train" },
  { index: 22, from: "rome", to: "paris", mode: "flight" },
  { index: 23, from: "paris", to: "cairo", mode: "flight" },
  { index: 24, from: "cairo", to: "paris", mode: "flight" },
  { index: 25, from: "paris", to: "copenhagen", mode: "flight" },
  { index: 26, from: "copenhagen", to: "malmo", mode: "car" },
  { index: 27, from: "malmo", to: "koge", mode: "car" },
  { index: 28, from: "koge", to: "copenhagen", mode: "car" },
  { index: 29, from: "copenhagen", to: "paris", mode: "flight" },
  { index: 30, from: "paris", to: "sofia", mode: "flight" },
  { index: 31, from: "sofia", to: "bucharest", mode: "flight" },
  { index: 32, from: "bucharest", to: "paris", mode: "flight" },
  { index: 33, from: "paris", to: "tromso", mode: "flight" },
  { index: 34, from: "tromso", to: "bergen", mode: "flight" },
  { index: 35, from: "bergen", to: "oslo", mode: "train" },
  { index: 36, from: "oslo", to: "stockholm", mode: "flight" },
  { index: 37, from: "stockholm", to: "tallinn", mode: "flight" },
  { index: 38, from: "tallinn", to: "helsinki", mode: "ship" },
  { index: 39, from: "helsinki", to: "riga", mode: "flight" },
  { index: 40, from: "riga", to: "vilnius", mode: "flight" },
  { index: 41, from: "vilnius", to: "valletta", mode: "flight" },
  { index: 42, from: "valletta", to: "paris", mode: "flight" },
  { index: 43, from: "paris", to: "belgrade", mode: "flight" },
  { index: 44, from: "belgrade", to: "larnaca", mode: "flight" },
  { index: 45, from: "larnaca", to: "paphos", mode: "car" },
  { index: 46, from: "paphos", to: "amman", mode: "flight" },
  { index: 47, from: "amman", to: "paris", mode: "flight" },
  { index: 48, from: "paris", to: "athens", mode: "flight" },
  { index: 49, from: "athens", to: "istanbul", mode: "flight" },
  { index: 50, from: "istanbul", to: "paris", mode: "flight" },
  { index: 51, from: "paris", to: "porto", mode: "flight" },
  { index: 52, from: "porto", to: "lisbon", mode: "car" },
  { index: 53, from: "lisbon", to: "frankfurt", mode: "flight" },
  { index: 54, from: "frankfurt", to: "paris", mode: "flight" },
  { index: 55, from: "paris", to: "berlin", mode: "flight" },
  { index: 56, from: "berlin", to: "tirana", mode: "flight" },
  { index: 57, from: "tirana", to: "skopje", mode: "car" },
  { index: 58, from: "skopje", to: "pristina", mode: "car" },
  { index: 59, from: "pristina", to: "podgorica", mode: "car" },
  { index: 60, from: "podgorica", to: "tirana", mode: "car" },
  { index: 61, from: "tirana", to: "paris", mode: "flight" },
  { index: 62, from: "paris", to: "seville", mode: "flight" },
  { index: 63, from: "seville", to: "granada", mode: "car" },
  { index: 64, from: "granada", to: "seville", mode: "car" },
  { index: 65, from: "seville", to: "marrakesh", mode: "flight" },
  { index: 66, from: "marrakesh", to: "fes", mode: "car" },
  { index: 67, from: "fes", to: "casablanca", mode: "car" },
  { index: 68, from: "casablanca", to: "marrakesh", mode: "car" },
  { index: 69, from: "marrakesh", to: "paris", mode: "flight" },
  { index: 70, from: "paris", to: "krakow", mode: "flight" },
  { index: 71, from: "krakow", to: "warsaw", mode: "train" },
  { index: 72, from: "warsaw", to: "kutaisi", mode: "flight" },
  { index: 73, from: "kutaisi", to: "tbilisi", mode: "train" },
  { index: 74, from: "tbilisi", to: "yerevan", mode: "flight" },
  { index: 75, from: "yerevan", to: "paris", mode: "flight" },
  { index: 76, from: "paris", to: "london", mode: "flight" },
  { index: 77, from: "london", to: "new-york", mode: "flight" },
];

/** All stops in order, including the starting city (index 0). */
export function getStopSequence(): string[] {
  return [LEGS[0].from, ...LEGS.map((l) => l.to)];
}

/** Stop indices (0-based) at which a given city is visited. */
export function getStopsForCity(slug: string): number[] {
  const seq = getStopSequence();
  const out: number[] = [];
  seq.forEach((s, i) => {
    if (s === slug) out.push(i);
  });
  return out;
}

export function getCity(slug: string): City | undefined {
  return CITIES[slug];
}
