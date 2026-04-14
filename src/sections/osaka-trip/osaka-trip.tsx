'use client'

import React, { useEffect, useState } from 'react'
import { MapPin } from 'lucide-react'

import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Box from '@mui/material/Box'

import { getCategoryData, itinerary } from './osaka-trip.constant'

const OsakaTrip = () => {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setSelectedDayIndex(newValue)
  }

  const isCurrentActivity = (index: number) => {
    const dayDate = itinerary[selectedDayIndex].dateISO
    const currentPlan = itinerary[selectedDayIndex].plans[index]
    const currentStart = new Date(`${dayDate}T${currentPlan.time}:00`)
    const nextPlan = itinerary[selectedDayIndex].plans[index + 1]
    const nextStart = nextPlan ? new Date(`${dayDate}T${nextPlan.time}:00`) : null
    if (nextStart) {
      return currentTime >= currentStart && currentTime < nextStart
    }
    return currentTime >= currentStart && currentTime < new Date(currentStart.getTime() + 60 * 60 * 1000)
  }

  useEffect(() => {
    const now = new Date()
    setCurrentTime(now)
    const todayISO = now.toISOString().split('T')[0]
    const idx = itinerary.findIndex((day) => day.dateISO === todayISO)
    if (idx !== -1) setSelectedDayIndex(idx)
  }, [])

  const openGoogleMaps = (location?: string) => {
    if (location) window.open(location, '_blank')
  }

  return (
    <div className="relative max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Osaka Trip Plan 🦌🏯</h1>
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
            <MapPin size={13} />
            <span>Osaka, Japan</span>
          </div>
        </div>
      </div>

      <p className="font-semibold text-[#0470b9] text-sm mb-6">
        May 2, 2026 &ndash; May 9, 2026
      </p>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={selectedDayIndex}
          onChange={handleChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          {itinerary.map((day, idx) => (
            <Tab
              key={idx}
              label={
                <div className="text-center">
                  <div className="text-xs text-gray-500">Day {idx + 1}</div>
                  <div className="font-semibold">{day.date}</div>
                </div>
              }
              sx={{
                textTransform: 'none',
                transition: 'all 0.3s ease',
                '&.Mui-selected': { color: '#4f46e5', fontWeight: 'bold' },
              }}
            />
          ))}
        </Tabs>
      </Box>

      {itinerary[selectedDayIndex] && (
        <div className="mb-6 rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-b from-[#edf3f7] to-70% px-6 py-4">
            <h2 className="text-lg font-semibold text-[#0163a4]">
              Day {selectedDayIndex + 1}: {itinerary[selectedDayIndex].title}
            </h2>
            <p className="text-[#0470b9] font-semibold inline-block px-4 py-1.5 rounded-md w-fit text-base shadow-sm mt-1 bg-[#0470b91a]">
              {itinerary[selectedDayIndex].date}
            </p>
          </div>

          <ul className="divide-y divide-gray-200">
            {itinerary[selectedDayIndex].plans.map((plan, idx) => {
              const highlight = isCurrentActivity(idx)
              const emoji = plan.category ? getCategoryData(plan.category) : plan.emoji ?? '📍'

              return (
                <li
                  key={idx}
                  className={`flex items-center justify-between px-6 py-3 cursor-pointer hover:bg-indigo-50 transition ${
                    highlight ? 'bg-yellow-100 font-medium text-indigo-800' : 'bg-white'
                  }`}
                  onClick={() => openGoogleMaps(plan.map)}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-xl">{emoji}</span>
                    <span>{`${plan.time}: ${plan.description}`}</span>
                  </span>
                  {plan.map && <MapPin size={14} className="text-gray-400 flex-shrink-0" />}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

export default OsakaTrip
