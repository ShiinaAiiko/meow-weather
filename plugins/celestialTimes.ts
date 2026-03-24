import * as Astronomy from 'astronomy-engine'
import moment from 'moment'

const { Body, Horizon, Equator, SearchHourAngle, SearchRiseSet } = Astronomy
type Observer = Astronomy.Observer
const { Moon, Sun } = Body

// 定义结果结构
export interface CelestialTimes {
  date: string
  sunrise: string | null
  sunset: string | null
  moonrise: string | null
  moonset: string | null
  solarNoon: string | null
}

// 获取过去和未来的天文时间
export function getCelestialTimesRange(
  latitude: number,
  longitude: number,
  altitude: number = 0,
  pastDays: number = 15,
  futureDays: number = 7
): CelestialTimes[] {
  if (
    !isFinite(latitude) ||
    !isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  ) {
    throw new Error('Invalid latitude or longitude')
  }
  if (pastDays < 0 || futureDays < 0) {
    throw new Error('Days cannot be negative')
  }

  futureDays += 3

  const results: CelestialTimes[] = []
  const observer = new Astronomy.Observer(latitude, longitude, altitude)
  const today = new Date(
    moment().subtract(3, 'days').format('YYYY-MM-DD 01:01:01')
    // moment('2025-12-17 1:00:00').format('YYYY-MM-DD 01:01:01')
  )

  // console.log('177', today)

  for (let i = -pastDays; i < futureDays; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]

    const times: CelestialTimes = {
      // date: moment(dateStr).format('MM-DD'),
      date: moment(dateStr).add(1, 'days').format('YYYY-MM-DD'),
      sunrise: null,
      sunset: null,
      moonrise: null,
      moonset: null,
      solarNoon: null,
    }

    const startOfDay = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0)
    )
    // 扩展搜索窗口到 25 小时
    let sunrise = SearchRiseSet(Body.Sun, observer, +1, startOfDay, -1) // 25 hours
    const sunset = SearchRiseSet(Body.Sun, observer, -1, startOfDay, 1.042)
    let moonrise = SearchRiseSet(Body.Moon, observer, +1, startOfDay, 1.042)
    const moonset = SearchRiseSet(Body.Moon, observer, -1, startOfDay, 1.042)

    if (moment(sunrise?.date).unix() < moment(times.date).unix()) {
      sunrise = SearchRiseSet(Body.Sun, observer, +1, startOfDay, 3)
    }

    if (moment(moonrise?.date).unix() > moment(moonset?.date).unix()) {
      const prevDate = new Date(startOfDay)
      prevDate.setDate(date.getDate() - 1)

      moonrise = SearchRiseSet(Body.Moon, observer, +1, prevDate, 1.042)
    }

    if (sunrise) times.sunrise = formatLocalTime(sunrise.date)
    if (sunset) times.sunset = formatLocalTime(sunset.date)
    if (moonrise) {
      times.moonrise = formatLocalTime(moonrise.date)
    } else {
      console.log(`No moonrise found for ${dateStr}`)
    }
    if (moonset) {
      times.moonset = formatLocalTime(moonset.date)
    } else {
      console.log(`No moonset found for ${dateStr}`)
    }

    const solarNoon = calculateSolarNoon(observer, startOfDay)
    if (solarNoon) times.solarNoon = formatLocalTime(solarNoon)

    results.push(times)
  }

  return results.slice(3)
}

// 格式化时间为本地时间
function formatLocalTime(date: Date): string {
  return moment(date).format('YYYY-MM-DD HH:mm:ss')
}

// 计算正午（太阳上中天）
function calculateSolarNoon(observer: Observer, startOfDay: Date): Date | null {
  const solarNoon = Astronomy.SearchHourAngle(
    Astronomy.Body.Sun, // 太阳
    observer, // 观测者
    0, // 时角 = 0（正午）
    startOfDay, // 起始搜索时间
    1 // 搜索天数（默认 1 天）
  )
  return solarNoon.time.date
}

export const getSunTimes = (date: Date, celestialTimes: CelestialTimes[]) => {
  let sunrise = ''
  let sunset = ''
  let solarNoon = ''
  let dateUnix = moment(date).unix()
  celestialTimes.some((v, i) => {
    // console.log('getSunTimes', date, v)
    if (dateUnix < moment(v.sunrise).unix()) {
      if (
        dateUnix <
        moment(moment(v.sunrise).format('YYYY-MM-DD 00:00:00')).unix()
      ) {
        return true
      }
    }
    sunrise = v.sunrise || ''
    sunset = v.sunset || ''
    solarNoon = v.solarNoon || ''
  })

  return {
    sunrise,
    sunset,
    solarNoon,
  }
}
export const getMoonTimes = (date: Date, celestialTimes: CelestialTimes[]) => {
  let moonrise = ''
  let moonset = ''
  let dateUnix = moment(date).unix()
  celestialTimes.some((v, i) => {
    const nextV = celestialTimes[i + 1]

    moonrise = v.moonrise || ''
    moonset = v.moonset || ''
    // console.log(177, date, v, nextV)

    if (
      moment(moment(v.moonset).format('YYYY-MM-DD 00:00:00')).unix() !==
      moment(moment(nextV.moonrise).format('YYYY-MM-DD 00:00:00')).unix()
    ) {
      if (
        dateUnix <
        moment(moment(nextV.moonrise).format('YYYY-MM-DD 00:00:00')).unix()
      ) {
        return true
      }
    }

    if (dateUnix < moment(v.moonset).unix()) {
      return true
    }
  })

  return {
    moonrise,
    moonset,
  }
}
