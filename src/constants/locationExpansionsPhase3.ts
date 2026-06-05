/**
 * Phase 3 location expansion — satellite towns, student zones, commercial districts.
 * Merged into nigeriaLocations alongside locationExpansions.ts.
 */
export const locationExpansionsPhase3: Record<
  string,
  Record<string, string[]>
> = {
  FCT: {
    Abuja: [
      "Nyanya",
      "Karu",
      "Mararaba",
      "Dutse",
      "Zuba",
      "Dei Dei",
      "Bwari",
      "Gwagwalada",
      "Apo Resettlement",
      "Lugbe FHA",
      "Trademore",
      "Pyakasa",
      "Airport Road",
      "Katampe Extension",
      "Area 10",
      "Wuse Market",
      "Garki Market",
    ],
  },
  Nasarawa: {
    Karu: ["Nyanya", "Mararaba", "One Man Village", "Masaka"],
    Keffi: ["Nyanya Gateway"],
  },
  Lagos: {
    Ikoyi: ["Dolphin Estate", "Parkview", "Banana Island"],
    Lekki: [
      "Victoria Garden City",
      "Jakande Lekki",
      "Awoyaya",
      "Bogije",
      "Eleko",
      "Oniru",
      "Osapa London",
    ],
    "Victoria Island": ["Oniru", "Osborne"],
    Yaba: ["Fadeyi", "Ojuelegba", "YABATECH Area", "Akoka"],
    Surulere: ["Lawanson", "Aguda", "Ojuelegba"],
    Ikeja: [
      "Allen Avenue",
      "Admiralty Way",
      "Opebi",
      "Alausa",
      "Computer Village",
      "Ladipo",
      "Ilupeju",
    ],
    Alimosho: [
      "Abule Egba",
      "Meiran",
      "Dopemu",
      "Command",
      "Ipaja",
      "Ayobo",
      "Aboru",
      "Ikotun",
      "Iyana Ipaja",
      "Egbeda",
      "Okokomaiko",
      "Ijanikin",
    ],
    Ketu: ["Mile 12", "Kosefe"],
    Ojota: ["Ketu", "Berger"],
    Ifako: ["Gbagada", "Oworo"],
    Ikorodu: ["LASU", "Meiran"],
    Marina: ["CMS", "Broad Street", "Idumota"],
    "Lagos Island": ["Marina", "CMS", "Balogun"],
    Orile: ["Trade Fair", "Alaba International"],
    Mushin: ["Ladipo"],
    Epe: ["Lakowe", "Eleko", "Ibeju Lekki"],
    "Ibeju Lekki": ["Awoyaya", "Bogije", "Lakowe", "Eleko"],
  },
  Enugu: {
    Enugu: ["ESUT Area", "Abakpa"],
    Nsukka: ["UNN Nsukka", "University Gate"],
  },
  Imo: {
    Owerri: ["FUTO Area", "Nekede"],
  },
  Oyo: {
    Ibadan: ["UI Area", "Polytechnic Ibadan Area", "UI", "Moniya", "Mokola"],
  },
  Ondo: {
    Akure: ["FUTA Area"],
  },
  Kwara: {
    Ilorin: ["UNILORIN Area"],
  },
  Edo: {
    "Benin City": ["UNIBEN Area", "Ugbowo", "GRA Benin"],
  },
  Rivers: {
    "Port Harcourt": ["UNIPORT Area", "Choba", "Eneka", "New GRA", "Old GRA"],
  },
  "Akwa Ibom": {
    Uyo: ["UniUyo Area"],
  },
  Ogun: {
    Abeokuta: ["FUNAAB Area"],
    Ota: ["Arepo", "Mowe", "Ofada"],
  },
  Abia: {
    Aba: [
      "Ariaria Market",
      "Cemetery Market",
      "Ngwa Road Market",
      "Osisioma",
      "World Bank",
    ],
  },
  Anambra: {
    Onitsha: ["Main Market", "Bridgehead", "Upper Iweka", "Fegge"],
    Nnewi: ["Nnewichi"],
  },
  Kano: {
    Kano: ["Singer Market", "Sabon Gari"],
  },
};
