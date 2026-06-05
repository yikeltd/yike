const IMG = (id: string) =>
  `https://images.unsplash.com/${id}?w=1400&q=80&auto=format&fit=crop`;

export const PAGE_IMAGERY = {
  explore: IMG("photo-1600585154340-be6161a56a0c"),
  rent: IMG("photo-1522708323590-d24dbb6b0267"),
  buy: IMG("photo-1600607687939-ce8a6c25118c"),
  shortlet: IMG("photo-1502672260266-1c1ef2d93688"),
  land: IMG("photo-1564013799919-ab600027ffc6"),
  swipe: IMG("photo-1600566753190-17f0baa5a365"),
  list: IMG("photo-1600047509807-ba8f8d28b018"),
  about: "/images/heroes/about-hero.webp",
  contact: "/images/heroes/contact-hero.webp",
  safety: "/images/heroes/safety-hero.webp",
  verify: IMG("photo-1600047509354-9f597a6d0b8e"),
  budget500k: IMG("photo-1484154218962-a197022b5858"),
  student: IMG("photo-1583608205774-aeff4f05ce63"),
  premium: IMG("photo-1600607687644-c7171b42498f"),
  weekend: IMG("photo-1605276374101-de9d87824847"),
} as const;
