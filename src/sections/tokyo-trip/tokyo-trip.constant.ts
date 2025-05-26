import { ItineraryDay } from './tokyo-trip.type'

export const itinerary: ItineraryDay[] = [
  {
    date: '4 May (Sat)',
    dateISO: '2025-05-04',
    title: 'Arrival & Ueno',
    plans: [
      { time: '07:30', description: 'Arrive at Narita Airport (NRT)', category: 'Arrival' },
      {
        time: '09:00',
        description: 'Keisei Skyliner to Ueno (~45 mins)',
        category: 'Train',
      },
      {
        time: '10:30',
        description: 'Drop luggage / Check-in at Hotel Livemax Ueno-ekimae',
        category: 'Hotel',
      },
      { time: '11:00', description: 'Walk around Ueno Park', emoji: '🌳' },
      { time: '12:00', description: 'Lunch at Ameyoko Market', category: 'Food' },
      { time: '15:00', description: 'Hotel check-in / Rest', emoji: '😴' },
      { time: '17:00', description: 'Walk around Yanaka Ginza', category: 'Shopping' },
      { time: '20:00', description: 'Return to hotel at Ueno', category: 'Hotel' },
    ],
  },
  {
    date: '5 May (Sun)',
    dateISO: '2025-05-05',
    title: 'Tokyo Disneyland 🎢',
    plans: [
      {
        time: '07:00',
        description: 'JR Keiyo Line → Maihama Station (~50 mins)',
        category: 'Train',
      },
      { time: '08:00', description: 'Full day at Tokyo Disneyland 👸🏻🎡', emoji: '🏰' },
      { time: '20:00', description: 'Return to hotel at Ueno', category: 'Hotel' },
    ],
  },
  {
    date: '6 May (Mon)',
    dateISO: '2025-05-06',
    title: 'Odaiba & Modern Tokyo',
    plans: [
      {
        time: '06:30',
        description: '[Yamanote Line] Ueno Station → Yūrakuchō Station',
        category: 'Train',
        map: 'https://maps.app.goo.gl/6q53YYQ31TsDnEPU8?g_st=ic',
      },
      {
        time: '07:00',
        description: 'Ginza Inz 2',
        category: 'Travel',
        map: 'https://maps.app.goo.gl/WyL4ddTW6nV6f8dH8',
      },
      {
        time: '09:30',
        description: 'Nikko',
        emoji: '🌳',
        map: 'https://maps.app.goo.gl/ssPzyjCwq8mctHYU8?g_st=ic',
      },
      {
        time: '10:30',
        description: 'Nikkō Tōshogū · Shinto shrine',
        category: 'Temple',
        map: 'https://maps.app.goo.gl/87PQ7jZVdR5oT8Gb8?g_st=ic',
      },
      {
        time: '13:00',
        description: 'Kegon Waterfalls · Nikko, Tochigi',
        emoji: '💦',
        map: 'https://maps.app.goo.gl/URvUGdCRZJ5EcBTU9?g_st=ic',
      },
      {
        time: '14:00',
        description: 'Lake Chūzenji',
        emoji: '🏞️',
        map: 'https://maps.app.goo.gl/dYgNUnVNP9xJrHdn9?g_st=ic',
      },
      {
        time: '15:00',
        description: 'Return to Ginza Inz 2',
        category: 'Travel',
        map: 'https://maps.app.goo.gl/WyL4ddTW6nV6f8dH8',
      },
      { time: '18:00', description: 'Arrive and relax', emoji: '🚏' },
    ],
  },
  {
    date: '7 May (Tue)',
    dateISO: '2025-05-07',
    title: 'Mt. Fuji Day Trip 🗻',
    plans: [
      {
        time: '07:30',
        description: '[Yamanote Line] Ueno Station → Tokyo Station',
        category: 'Train',
        map: 'https://maps.app.goo.gl/17KSozd18VoGUcj18?g_st=ic',
      },
      {
        time: '08:00',
        description: 'Departure Shin-Marunouchi Building',
        category: 'Travel',
        map: 'https://maps.app.goo.gl/U8DsSLGmFpkfTmNn9',
      },
      {
        time: '10:30',
        description: 'Hakone Shrine',
        category: 'Temple',
        map: 'https://maps.app.goo.gl/38nMP2L43Na6Tv5A6',
      },
      {
        time: '11:30',
        description: 'Torii of Peace',
        category: 'Nature',
        map: 'https://maps.app.goo.gl/LGKa5A4FbZvMaFtx7',
      },
      {
        time: '12:10',
        description: 'Hakone Pirate Ship Tōgendai Port',
        category: 'Nature',
        map: 'https://maps.app.goo.gl/NuZuBaqMsFCW9Z7F7',
      },
      {
        time: '12:40',
        description: 'Hakone Ropeway',
        category: 'Nature',
        map: 'https://maps.app.goo.gl/nhGLo55dYctn2p6d9',
      },
      {
        time: '13:10',
        description: 'Owakudani',
        category: 'Nature',
        map: 'https://maps.app.goo.gl/R8g9EvtsphQ324b2A',
      },
      {
        time: '15:00',
        description: 'Yamanakako',
        category: 'Nature',
        map: 'https://maps.app.goo.gl/42Qjryti6VQukGzw5',
      },
      {
        time: '15:40',
        description: 'Oshino Hakkai (the Eight Seas of Oshino)',
        category: 'Nature',
        map: 'https://maps.app.goo.gl/g236AbzZS28KJzg7A',
      },
      {
        time: '18:20',
        description: 'Return to SMBC Bank Shinjuku Nishiguchi',
        emoji: '🚏',
        map: 'https://maps.app.goo.gl/4YnKm4KnR9MYAT7P8',
      },
      {
        time: '20:00',
        description: '[Yamanote Line] Shinjuku Station → Ueno Station',
        category: 'Hotel',
        map: 'https://maps.app.goo.gl/R46qutjxAivkhMt4A',
      },
    ],
  },
  {
    date: '8 May (Wed)',
    dateISO: '2025-05-08',
    title: 'Asakusa & Shinjuku',
    plans: [
      {
        time: '10:00',
        description: 'Check-out from Ueno, drop bags at Toho Building',
        category: 'Hotel',
      },
      {
        time: '11:00',
        description: 'Visit Sensoji Temple, Asakusa',
        category: 'Temple',
        map: 'https://maps.app.goo.gl/hMSPGaC6PBY3YJ2KA',
      },
      {
        time: '12:00',
        description: 'Nakamise Shopping Street',
        category: 'Food',
        map: 'https://maps.app.goo.gl/13u6Q4s3PPx3J1eW6',
      },
      {
        time: '13:00',
        description: 'Tokyo Skytree',
        category: 'View',
        map: 'https://maps.app.goo.gl/ey32vrjeADkvbPqT8',
      },
      {
        time: '16:00',
        description: 'Check-in Toho Building',
        category: 'Hotel',
        map: 'https://maps.app.goo.gl/urHacinr3vfkF8EM9',
      },
      {
        time: '18:00',
        description: 'Shinjuku Omoide Yokocho / Kabukicho',
        category: 'Food',
        map: 'https://maps.app.goo.gl/EmYqAhyGznBVcewT6',
      },
    ],
  },
  {
    date: '9 May (Thu)',
    dateISO: '2025-05-09',
    title: 'Kasukabe - Shinchan’s hometown 🧒🏻',
    plans: [
      {
        time: '08:00',
        description: '[Tobu Skytree Line]: Shinjuku → Kasukabe (via JR + Tobu Urban Park Line)',
        category: 'Train',
        map: 'https://maps.app.goo.gl/JWP77JKrFM5598bo8',
      },
      {
        time: '10:00',
        description: 'Crayon Shinchan Game Center',
        category: 'Game',
        map: 'https://maps.app.goo.gl/wZhRg66AJ1cmGUNw7',
      },
      { time: '12:00', description: 'Lunch in Kasukabe', category: 'Food' },
      {
        time: '15:00',
        description: 'Stop by Ikebukuro: Sunshine City / Pokémon Center',
        category: 'Shopping',
      },
      {
        time: '17:00',
        description: 'Return to Shinjuku',
        category: 'Travel',
        map: 'https://maps.app.goo.gl/oBditavkduSoXC666',
      },
      { time: '19:00', description: 'Dinner at Shinjuku', category: 'Food' },
      {
        time: '21:00',
        description: 'Return to Toho building',
        category: 'Hotel',
        map: 'https://maps.app.goo.gl/urHacinr3vfkF8EM9',
      },
    ],
  },
  {
    date: '10 May (Fri)',
    dateISO: '2025-05-10',
    title: 'Shibuya & Harajuku',
    plans: [
      {
        time: '10:00',
        description: 'Takeshita Street',
        category: 'Shopping',
        map: 'https://maps.app.goo.gl/RPoRPCiNpWJdiyzr9',
      },
      {
        time: '10:00',
        description: 'Meiji Jingu Shrine',
        category: 'Temple',
        map: 'https://maps.app.goo.gl/kfu3R3bvSZv15nBm6',
      },
      {
        time: '13:00',
        description: 'Shibuya Sky + Hachiko Statue',
        emoji: '📍',
        map: 'https://maps.app.goo.gl/maMAXTHKdK36NJFd6',
      },
      { time: '17:00', description: 'Shopping: Donki / Loft / Dinner', category: 'Shopping' },
      {
        time: '20:00',
        description: 'Return to hotel at Toho building',
        category: 'Hotel',
        map: 'https://maps.app.goo.gl/urHacinr3vfkF8EM9',
      },
    ],
  },
  {
    date: '11 May (Sat)',
    dateISO: '2025-05-11',
    title: 'Return to Thailand ✈️',
    plans: [
      {
        time: '08:00',
        description: 'Check-out, Shinjuku Station → Asakusabashi Station → Keisei Skyliner → Narita Airport Terminal 1 Station',
        category: 'Train',
        map: 'https://maps.app.goo.gl/n8BhPcL1o3CHbEPS6'
      },
      { time: '11:00', description: 'Narita Airport Terminal 1 Station', emoji: '✈️', map: 'https://maps.app.goo.gl/n8BhPcL1o3CHbEPS6' },
      { time: '17:00', description: 'Flight back to Thailand', category: 'Departure' },
      { time: '21:40', description: 'Arrive at Thailand', category: 'Arrival', map: 'https://maps.app.goo.gl/46xiAWRhR32R5cmP9' },
      { time: '23:00', description: 'Back to home', emoji: '🏠', map: 'https://maps.app.goo.gl/yydgcvWbM9X49TPN7' },
    ],
  },
]

export const getCategoryData = (category: string) => {
  const mapping: Record<string, string> = {
    Arrival: '🛬',
    Departure: '🛫',
    Travel: '🚗',
    Hotel: '🛌',
    Shopping: '🛍️',
    Temple: '⛩️',
    Food: '🍜',
    Train: '🚝',
  }

  return mapping[category]
}
