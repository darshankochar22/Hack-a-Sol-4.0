// OpenF1 API Service
// API Documentation: https://www.openf1.org/

export interface Driver {
  driver_number: number
  name_acronym: string
  session_key: number
  team_name: string
  full_name: string
}

export interface Lap {
  date_start: string
  driver_number: number
  duration_sector_1: number | null
  duration_sector_2: number | null
  duration_sector_3: number | null
  i1_speed: number | null
  i2_speed: number | null
  is_pit_out_lap: boolean
  lap_duration: number | null
  lap_number: number
  meeting_key: number
  segments_sector_1: number[] | null
  segments_sector_2: number[] | null
  segments_sector_3: number[] | null
  session_key: number
}

export interface Telemetry {
  brake: number
  date: string
  driver_number: number
  drs: number
  n_gear: number
  rpm: number
  speed: number
  throttle: number
  session_key: number
}

export interface Session {
  session_key: number
  meeting_key: number
  date_start: string
  date_end: string
  session_name: string
  session_type: string
}

// Team mappings for 2024 F1 season
const TEAM_DRIVERS: Record<string, string[]> = {
  "Mercedes-AMG F1 W15": ["HAM", "RUS"], // Lewis Hamilton, George Russell
  "Oracle Red Bull Racing RB20": ["VER", "PER"], // Max Verstappen, Sergio Perez
  "Scuderia Ferrari SF-24": ["LEC", "SAI"], // Charles Leclerc, Carlos Sainz
  "McLaren F1 Team MCL38": ["NOR", "PIA"], // Lando Norris, Oscar Piastri
}

// Get current/latest session
export async function getLatestSession(): Promise<Session | null> {
  try {
    // Try to get any recent session (Race, Qualifying, Practice) from 2024-2025
    const currentYear = new Date().getFullYear()
    const response = await fetch(
      `https://api.openf1.org/v1/sessions?date_start>=2024-01-01&date_start<=${currentYear}-12-31&order=desc&limit=10`
    )
    
    if (!response.ok) {
      console.warn("API response not OK:", response.status)
      return null
    }
    
    const sessions: Session[] = await response.json()
    
    // Prefer Race sessions, but fallback to any session type
    const raceSession = sessions.find(s => s.session_type === "Race")
    if (raceSession) return raceSession
    
    // Return most recent session if no race found
    return sessions.length > 0 ? sessions[0] : null
  } catch (error) {
    console.error("Error fetching latest session:", error)
    return null
  }
}

// Get drivers for a session
export async function getDrivers(sessionKey: number): Promise<Driver[]> {
  try {
    const response = await fetch(`https://api.openf1.org/v1/drivers?session_key=${sessionKey}`)
    return await response.json()
  } catch (error) {
    console.error("Error fetching drivers:", error)
    return []
  }
}

// Get driver by team name
export async function getDriverByTeam(teamName: string, sessionKey: number): Promise<Driver | null> {
  const drivers = await getDrivers(sessionKey)
  const driverAcronyms = TEAM_DRIVERS[teamName] || []
  
  for (const acronym of driverAcronyms) {
    const driver = drivers.find(d => d.name_acronym === acronym)
    if (driver) return driver
  }
  
  return drivers.find(d => d.team_name.toLowerCase().includes(teamName.toLowerCase().split(" ")[0])) || null
}

// Get latest telemetry for a driver
export async function getLatestTelemetry(driverNumber: number, sessionKey: number): Promise<Telemetry | null> {
  try {
    const response = await fetch(
      `https://api.openf1.org/v1/telemetry?driver_number=${driverNumber}&session_key=${sessionKey}&order=desc&limit=1`
    )
    const telemetry: Telemetry[] = await response.json()
    return telemetry.length > 0 ? telemetry[0] : null
  } catch (error) {
    console.error("Error fetching telemetry:", error)
    return null
  }
}

// Get telemetry history for a driver (for graphs)
export async function getTelemetryHistory(
  driverNumber: number,
  sessionKey: number,
  limit: number = 100
): Promise<Telemetry[]> {
  try {
    const response = await fetch(
      `https://api.openf1.org/v1/telemetry?driver_number=${driverNumber}&session_key=${sessionKey}&order=desc&limit=${limit}`
    )
    const telemetry: Telemetry[] = await response.json()
    return telemetry.reverse() // Reverse to get chronological order
  } catch (error) {
    console.error("Error fetching telemetry history:", error)
    return []
  }
}

// Get latest lap for a driver
export async function getLatestLap(driverNumber: number, sessionKey: number): Promise<Lap | null> {
  try {
    const response = await fetch(
      `https://api.openf1.org/v1/laps?driver_number=${driverNumber}&session_key=${sessionKey}&order=desc&limit=1`
    )
    const laps: Lap[] = await response.json()
    return laps.length > 0 ? laps[0] : null
  } catch (error) {
    console.error("Error fetching latest lap:", error)
    return null
  }
}

// Get lap history for a driver
export async function getLapHistory(
  driverNumber: number,
  sessionKey: number,
  limit: number = 20
): Promise<Lap[]> {
  try {
    const response = await fetch(
      `https://api.openf1.org/v1/laps?driver_number=${driverNumber}&session_key=${sessionKey}&order=desc&limit=${limit}`
    )
    const laps: Lap[] = await response.json()
    return laps.reverse() // Reverse to get chronological order
  } catch (error) {
    console.error("Error fetching lap history:", error)
    return []
  }
}

// Get multiple drivers' telemetry for comparison
export async function getMultiDriverTelemetry(
  driverNumbers: number[],
  sessionKey: number
): Promise<Record<number, Telemetry[]>> {
  const result: Record<number, Telemetry[]> = {}
  
  await Promise.all(
    driverNumbers.map(async (driverNumber) => {
      result[driverNumber] = await getTelemetryHistory(driverNumber, sessionKey, 50)
    })
  )
  
  return result
}

// Get latest telemetry for all drivers in a session
export async function getAllDriversLatestTelemetry(sessionKey: number): Promise<Record<number, Telemetry | null>> {
  try {
    const drivers = await getDrivers(sessionKey)
    const result: Record<number, Telemetry | null> = {}
    
    await Promise.all(
      drivers.map(async (driver) => {
        result[driver.driver_number] = await getLatestTelemetry(driver.driver_number, sessionKey)
      })
    )
    
    return result
  } catch (error) {
    console.error("Error fetching all drivers telemetry:", error)
    return {}
  }
}

// Get best lap times for all drivers
export async function getAllDriversBestLaps(sessionKey: number): Promise<Record<number, Lap | null>> {
  try {
    const drivers = await getDrivers(sessionKey)
    const result: Record<number, Lap | null> = {}
    
    await Promise.all(
      drivers.map(async (driver) => {
        // Get laps and find the fastest
        const laps = await getLapHistory(driver.driver_number, sessionKey, 50)
        const validLaps = laps.filter(l => l.lap_duration && !l.is_pit_out_lap && l.lap_duration > 0)
        if (validLaps.length > 0) {
          const fastestLap = validLaps.reduce((fastest, current) => {
            if (!fastest.lap_duration) return current
            if (!current.lap_duration) return fastest
            return current.lap_duration < fastest.lap_duration ? current : fastest
          })
          result[driver.driver_number] = fastestLap
        } else {
          result[driver.driver_number] = null
        }
      })
    )
    
    return result
  } catch (error) {
    console.error("Error fetching best laps:", error)
    return {}
  }
}

// Get positions/stints data for all drivers
export interface Position {
  date: string
  driver_number: number
  meeting_key: number
  position: number
  session_key: number
}

export async function getAllDriversPositions(sessionKey: number): Promise<Record<number, Position | null>> {
  try {
    const response = await fetch(
      `https://api.openf1.org/v1/position?session_key=${sessionKey}&order=desc&limit=100`
    )
    const positions: Position[] = await response.json()
    
    // Get latest position for each driver
    const latestPositions: Record<number, Position | null> = {}
    const drivers = await getDrivers(sessionKey)
    
    drivers.forEach(driver => {
      const driverPositions = positions.filter(p => p.driver_number === driver.driver_number)
      latestPositions[driver.driver_number] = driverPositions.length > 0 ? driverPositions[0] : null
    })
    
    return latestPositions
  } catch (error) {
    console.error("Error fetching positions:", error)
    return {}
  }
}

// Get lap history for all drivers (for comparison charts)
export async function getAllDriversLapHistory(
  sessionKey: number,
  limit: number = 20
): Promise<Record<number, Lap[]>> {
  try {
    const drivers = await getDrivers(sessionKey)
    const result: Record<number, Lap[]> = {}
    
    await Promise.all(
      drivers.map(async (driver) => {
        result[driver.driver_number] = await getLapHistory(driver.driver_number, sessionKey, limit)
      })
    )
    
    return result
  } catch (error) {
    console.error("Error fetching all drivers lap history:", error)
    return {}
  }
}

