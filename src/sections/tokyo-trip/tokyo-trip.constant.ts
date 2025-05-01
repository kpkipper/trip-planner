import { ChipProps } from '@mui/material'

export const itinerary = [
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
      { time: '11:00', description: 'Walk around Ueno Park', category: 'Park' },
      { time: '12:00', description: 'Lunch at Ameyoko Market', category: 'Food' },
      { time: '15:00', description: 'Hotel check-in / Rest', category: 'Rest' },
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
      { time: '08:00', description: 'Full day at Tokyo Disneyland 👸🏻🎡', category: 'Disney' },
      { time: '20:00', description: 'Return to hotel at Ueno', category: 'Hotel' },
    ],
  },
  {
    date: '6 May (Mon)',
    dateISO: '2025-05-06',
    title: 'Odaiba & Modern Tokyo',
    plans: [
      { time: '09:00', description: 'JR Yamanote Shimbashi Yurikamome Line → Odaiba', category: 'Train' },
      {
        time: '10:00',
        description: 'teamLab Planets Tokyo',
        category: 'Activity',
      },
      { time: '12:00', description: 'Lunch at DiverCity Tokyo Plaza + Gundam', category: 'Food' },
      { time: '13:30', description: 'Aqua City Odaiba / Ferris wheel', category: 'Aqua' },
      { time: '18:00', description: 'Dinner in Ueno area', category: 'Food' },
      { time: '20:00', description: 'Return to hotel at Ueno', category: 'Hotel' },
    ],
  },
  {
    date: '7 May (Tue)',
    dateISO: '2025-05-07',
    title: 'Mt. Fuji Day Trip 🗻',
    plans: [
      {
        time: '07:30',
        description: 'Meet at Shinjuku (as per Klook instructions)',
        category: 'Train',
      },
      {
        time: '08:00',
        description: 'Day Trip: Kawaguchiko, Oshino Hakkai, traditional village, etc.',
        category: 'Nature',
      },
      { time: '18:30', description: 'Return to Tokyo', category: 'Rest' },
      { time: '20:00', description: 'Arrive at hotel Ueno', category: 'Hotel' },
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
      { time: '11:00', description: 'Visit Sensoji Temple, Asakusa', category: 'Temple' },
      { time: '12:00', description: 'Nakamise Street', category: 'Food' },
      { time: '13:00', description: 'Tokyo Skytree', category: 'View' },
      { time: '16:00', description: 'Check-in Toho Building', category: 'Hotel' },
      { time: '18:00', description: 'Shinjuku Omoide Yokocho / Kabukicho', category: 'Food' },
    ],
  },
  {
    date: '9 May (Thu)',
    dateISO: '2025-05-09',
    title: 'Kasukabe - Shinchan’s hometown 🧒🏻',
    plans: [
      {
        time: '08:00',
        description: 'Tobu Skytree Line: Shinjuku → Kasukabe (via JR + Tobu Urban Park Line)',
        category: 'Train',
      },
      { time: '10:00', description: 'Crayon Shinchan Game Center', category: 'Game' },
      { time: '12:00', description: 'Lunch in Kasukabe', category: 'Food' },
      {
        time: '15:00',
        description: 'Stop by Ikebukuro: Sunshine City / Pokémon Center',
        category: 'Shopping',
      },
    ],
  },
  {
    date: '10 May (Fri)',
    dateISO: '2025-05-10',
    title: 'Shibuya & Harajuku',
    plans: [
      { time: '10:00', description: 'Takeshita Street', category: 'Shopping' },
      { time: '10:00', description: 'Meiji Jingu Shrine', category: 'Temple' },
      { time: '13:00', description: 'Shibuya Sky + Hachiko Statue', category: 'View' },
      { time: '17:00', description: 'Shopping: Donki / Loft / Dinner', category: 'Shopping' },
      { time: '20:00', description: 'Return to hotel at Ueno', category: 'Hotel' },
    ],
  },
  {
    date: '11 May (Sat)',
    dateISO: '2025-05-11',
    title: 'Return to Thailand ✈️',
    plans: [
      {
        time: '08:00',
        description: 'Check-out, travel to Narita Airport: Shinjuku → Nippori → Keisei Skyliner',
        category: 'Train',
      },
      { time: '11:00', description: 'Arrive at Narita Airport', category: 'Arrival' },
      { time: '17:00', description: 'Flight back to Thailand', category: 'Arrival' },
      { time: '21:40', description: 'Arrive at Thailand', category: 'Departure' },
      { time: '23:00', description: 'Back to home', category: 'Home' },
    ],
  },
]

export const getCategoryData = (category: string) => {
  const mapping: Record<string, { emoji: string; color: ChipProps['color'] }> = {
    Arrival: { emoji: '🛬', color: 'primary' },
    Departure: { emoji: '🛫', color: 'primary' },
    Travel: { emoji: '🛫', color: 'primary' },
    Hotel: { emoji: '🛌', color: 'default' },
    Park: { emoji: '🌳', color: 'success' },
    Rest: { emoji: '😴', color: 'warning' },
    Shopping: { emoji: '🛍️', color: 'secondary' },
    Temple: { emoji: '⛩️', color: 'default' },
    View: { emoji: '🗼', color: 'info' },
    Game: { emoji: '🕹️', color: 'success' },
    Aqua: { emoji: '🐠', color: 'success' },
    Food: { emoji: '🍜', color: 'success' },
    Activity: { emoji: '📍', color: 'default' },
    Disney: { emoji: '🏰', color: 'default' },
    Train: { emoji: '🚝', color: 'default' },
    Home: { emoji: '🏠', color: 'default' },
  }

  return mapping[category] || { emoji: '📍', color: 'default' }
}
