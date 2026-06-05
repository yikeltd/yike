/**
 * Additional neighborhoods merged into nigeriaLocations at build time.
 * State → City → new areas to append.
 */
export const locationExpansions: Record<string, Record<string, string[]>> = {
  Abia: {
    Aba: [
      "Aba North",
      "Aba South",
      "Ohanku",
      "Asa Nnentu",
      "Cemetery Road",
      "Azikiwe Road",
      "Ngwa Road",
      "MCC",
      "Aba GRA",
    ],
  },
  Adamawa: {
    Yola: [
      "Yola North",
      "Yola South",
      "Jimeta Modern Market Area",
      "Vinikilang",
      "Karewa",
      "Dougirei",
    ],
  },
  "Akwa Ibom": {
    Uyo: [
      "Ikot Oku Ikono",
      "Nwaniba",
      "Four Lanes",
      "Aka Etinan",
      "Udo Udoma",
      "Urua Ekpa",
    ],
  },
  Anambra: {
    Onitsha: ["Inland Town", "Upper Iweka", "Okpoko"],
    Nnewi: ["Nnewichi", "Odida Nnewi"],
  },
  Bauchi: {
    Bauchi: ["Federal Low Cost", "Gwallaga"],
  },
  Bayelsa: {
    Yenagoa: ["Swali", "Opolo", "Biogbolo"],
  },
  Benue: {
    Makurdi: ["Wadata", "Kanshio", "Modern Market Area"],
  },
  Borno: {
    Maiduguri: ["Gomari", "Bolori"],
  },
  "Cross River": {
    Calabar: ["Calabar South", "Lemna", "Diamond Hill"],
  },
  Delta: {
    Asaba: ["Cable Point", "Infant Jesus Area"],
    Warri: ["Ugborikoko", "Jakpa Road", "PTI Road"],
  },
  Ebonyi: {
    Abakaliki: ["Presco Junction", "Kpirikpiri", "Mile 50", "Rice Mill Area"],
  },
  Edo: {
    "Benin City": [
      "GRA Benin",
      "Airport Road",
      "Textile Mill Road",
      "Sakponba",
    ],
  },
  Ekiti: {
    "Ado Ekiti": ["Basiri", "Adebayo", "Ajilosun", "Oke Ila"],
  },
  Enugu: {
    Enugu: [
      "Thinkers Corner",
      "Nike",
      "Holy Ghost",
      "Timber Shed",
      "Independence Layout Extension",
    ],
  },
  Gombe: {
    Gombe: ["Pantami", "Federal Low Cost"],
  },
  Imo: {
    Owerri: ["Control Post", "IMSU Area", "Egbu Road", "Tetlow Road"],
  },
  Jigawa: {
    Dutse: ["Kiyawa", "Mallam Madori", "Birniwa"],
  },
  Kaduna: {
    Kaduna: ["Malali", "Kawo", "Gonin Gora", "Tudun Wada Kaduna"],
  },
  Kano: {
    Kano: ["Fagge", "Kurna", "Sharada", "Zoo Road"],
  },
  Katsina: {
    Katsina: ["Kofar Kaura", "Dutsin Safe", "Kofar Marusa"],
  },
  Kebbi: {
    "Birnin Kebbi": ["Badariya", "Bayan Kara", "Gesse"],
  },
  Kogi: {
    Lokoja: ["Phase 1 Lokoja", "Crusher Area", "Zango"],
  },
  Kwara: {
    Ilorin: ["Pipeline", "Basin"],
  },
  Lagos: {
    Lekki: [
      "VGC",
      "Ikota",
      "Abraham Adesanya",
      "Lekki Conservation Area",
      "Ibeju Lekki",
      "Lakowe",
    ],
    Ikeja: ["Ilupeju", "Admiralty Way"],
    Yaba: ["UNILAG Area", "LASU Area"],
    "Victoria Island": ["Osborne", "Marina", "CMS"],
    Surulere: [],
    Festac: ["Mile 2"],
    Alimosho: ["Berger", "Ojodu"],
    Maryland: [],
    Mushin: ["Shomolu", "Bariga"],
    Epe: [],
    "Ibeju Lekki": ["Lakowe", "Epe Road"],
    Marina: ["CMS", "Ebute Metta"],
  },
  Nasarawa: {
    Karu: ["Masaka", "Nyanya"],
  },
  Niger: {
    Minna: ["Chanchaga", "Tunga", "Maitumbi"],
  },
  Ogun: {
    Ota: ["Mowe", "Ofada", "Arepo", "OPIC", "Ijoko", "Sango Ota"],
  },
  Ondo: {
    Akure: ["FUTA Area", "Oda Road", "Fanibi"],
  },
  Osun: {
    Osogbo: ["Dada Estate", "Alekuwodo"],
  },
  Oyo: {
    Ibadan: [
      "Moniya",
      "Dugbe",
      "Jericho",
      "Apata",
      "Eleyele",
      "Akala Express",
      "Bashorun",
    ],
  },
  Plateau: {
    Jos: ["Anglo Jos", "Dadin Kowa", "Old Airport", "Gold and Base"],
  },
  Rivers: {
    "Port Harcourt": [
      "Borokiri",
      "Eneka",
      "Garrison",
      "Eagle Island",
      "Mile 1",
      "Mile 3",
    ],
  },
  Sokoto: {
    Sokoto: ["Arkilla", "Gidan Dare", "Mabera"],
  },
  Taraba: {
    Jalingo: ["Roadblock", "Mayo Goi", "ATC Area"],
  },
  Yobe: {
    Damaturu: ["Pompomari", "Nayinawa"],
  },
  Zamfara: {
    Gusau: ["Tudun Wada Gusau", "Samaru"],
  },
  FCT: {
    Abuja: [
      "Galadimawa",
      "Guzape",
      "Wuye",
      "Mabushi",
      "Dakibiyu",
      "Mpape",
      "Karsana",
      "Area 1",
      "Area 11",
      "Games Village",
      "Sunnyvale",
      "Prince and Princess Estate",
    ],
  },
};
