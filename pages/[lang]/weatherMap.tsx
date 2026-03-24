import Head from 'next/head'
import ToolboxLayout, { getLayout } from '../../layouts/Toolbox'
import Link from 'next/link'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { Router, useRouter } from 'next/router'
import path, { format } from 'path'
import store, {
  RootState,
  AppDispatch,
  layoutSlice,
  useAppDispatch,
  methods,
  apiSlice,
  positionSlice,
} from '../../store'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { bindEvent, snackbar, progressBar, alert } from '@saki-ui/core'
import {
  AsyncQueue,
  Debounce,
  deepCopy,
  NRequest,
  QueueLoop,
  WebWorker,
} from '@nyanyajs/utils'
import {
  getRegExp,
  copyText,
  getRandomPassword,
  formatTime,
  formatDuration,
  formatDurationI18n,
  getDistance,
  formatDistance,
  showSnackbar,
  getLatLng,
  getLatLngGcj02ToWgs84,
} from '../../plugins/methods'
import {
  getCelestialTimesRange,
  getSunTimes,
  getMoonTimes,
  CelestialTimes,
} from '../../plugins/celestialTimes'
import {
  getDetailedPressureLevel,
  getVisibilityAlert,
  defaultWeatherInfo,
  formatAirQuality,
  getAqiDescription,
  getWindDirectionText,
  getUVInfo,
  createSunMoonChart,
  getWindForceLevel,
  formatWeatherDate,
  createWeatherChart,
  WeatherData,
  WeatherAQIData,
  createAQIChart,
  calculateTwilightTimes,
  createValDataChart,
  PressureLevel,
  WeatherSyncData,
  createWindChart,
  createPrecipitationDataChart,
  createDewPointChart,
  weatherSlice,
  // getMaxMinTempWeatherCodes,
  getThemeColors,
  getWeatherVideoUrl,
  getWeatherIcon,
  ntextWcode,
  getWarningColor,
  getDailyWeatherSummary,
  initDailyWeatherSummary,
  generateWeatherChangeText,
  generateWeatherChangeTextQw5m,
} from '../../store/weather'
import Leaflet from 'leaflet'

import {
  convertTemperature,
  convertPrecipitation,
  convertWindSpeed,
  convertPressure,
  convertVisibility,
} from '@nyanyajs/utils/dist/units/weather'
import { covertTimeFormat } from '@nyanyajs/utils/dist/units/time'
import {
  changeLanguage,
  languages,
  defaultLanguage,
  detectionLanguage,
  t,
} from '../../plugins/i18n/i18n'
import moment, { unix } from 'moment'
import { configSlice, eventListener, R } from '../../store/config'
import { server, toolsServer } from '../../config'
// import { openWeatherWMOToEmoji } from '@akaguny/open-meteo-wmo-to-emoji'
// import { WeatherCodes } from '@openmeteo/sdk';
import {
  SakiAnimationLoading,
  SakiAsideModal,
  SakiButton,
  SakiCol,
  SakiContextMenu,
  SakiContextMenuItem,
  SakiDropdown,
  SakiIcon,
  SakiInput,
  SakiMenu,
  SakiMenuItem,
  SakiModalHeader,
  SakiRow,
  SakiTitle,
} from '../../components/saki-ui-react/components'
import * as Astronomy from 'astronomy-engine'
import { storage } from '../../store/storage'
import NoSSR from '../../components/NoSSR'
import dynamic from 'next/dynamic'
import { CityInfo } from '../../plugins/http/api/geo'
import { httpApi } from '../../plugins/http/api'
import {
  networkConnectionStatusDetection,
  networkConnectionStatusDetectionEnum,
} from '@nyanyajs/utils/dist/common/common'
import WeatherDetailModal, {
  WarningIcon,
} from '../../components/WeatherDetailModal'
import {
  createTargetCityWeatherMarkerIcon,
  createMyPositionMarker,
  createTargetCityWeatherContent,
} from '../../plugins/map'

// const NoSSR = ({ children }: PropsType) => {
//   return <React.Fragment>{children}</React.Fragment>
// }

export async function getStaticPaths() {
  return {
    paths:
      process.env.OUTPUT === 'export'
        ? languages.map((v) => {
            return {
              params: {
                lang: v,
              },
            }
          })
        : [],
    fallback: true,
    // fallback: process.env.OUTPUT === 'export',
  }
}

export async function getStaticProps({
  params,
  locale,
}: {
  params: {
    lang: string
  }
  locale: string
}) {
  process.env.OUTPUT === 'export' && changeLanguage(params.lang as any)

  return {
    props: {
      // difficulty: params.difficulty,
      lang: params.lang || defaultLanguage,
    },
  }
}

export const RenderWeatherMapPage = ({
  openModal,
}: {
  openModal?: boolean
}) => {
  const { t, i18n } = useTranslation('weatherMapPage')
  const layout = useSelector((state: RootState) => state.layout)
  const config = useSelector((state: RootState) => state.config)
  const user = useSelector((state: RootState) => state.user)
  const router = useRouter()

  let basePathname = router.pathname.replace('/[lang]', '')

  const { position, language, weatherData } = useSelector(
    (state: RootState) => {
      return {
        position: state.position,
        language: state.config.language,
        weatherData: state.weather.weatherData,
      }
    }
  )

  const dispatch = useDispatch<AppDispatch>()

  const loadedMap = useRef(false)
  const map = useRef<Leaflet.Map>()
  const layer = useRef<any>()
  const targetMarker = useRef<Leaflet.Marker<any>>()
  const marker = useRef<Leaflet.Marker<any>>()
  const polyline = useRef<Leaflet.Polyline<any>>()
  const localTimezone = useRef(Intl.DateTimeFormat().resolvedOptions().timeZone)

  const { mapUrl } = {
    mapUrl:
      'https://webrd02.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scale=1&style=8',
  }

  const [myPosition, setMyPosition] = useState<{
    latitude: number
    longitude: number
    altitude: number
    altitudeAccuracy: number
    accuracy: number
    heading: number
    speed: number
    timestamp: number
  }>()

  useEffect(() => {
    if (position?.position?.timestamp) {
      setMyPosition({
        latitude: position.position?.coords?.latitude || 0,
        longitude: position.position?.coords?.longitude || 0,
        altitude: position.position?.coords?.altitude || 0,
        altitudeAccuracy: position.position?.coords?.altitudeAccuracy || 0,
        accuracy: position.position?.coords?.accuracy || 0,
        heading: position.position?.coords?.heading || 0,
        speed: position.position?.coords?.speed || 0,
        timestamp: position.position?.timestamp || -1,
      })
    }
  }, [position])

  useEffect(() => {
    if (myPosition?.latitude) {
      initMap()
      return
    }
    clearMap()
  }, [myPosition])

  useEffect(() => {
    if (mapUrl) {
      loadedMap.current = false
      initMap()
    }
  }, [mapUrl])

  const clearMap = () => {
    console.log('clearMap')
    loadedMap.current = false
    map.current?.remove()
    map.current = undefined
    marker.current?.remove()
    marker.current = undefined
    targetMarker.current?.remove()
    targetMarker.current = undefined
  }

  const initMap = () => {
    const L: typeof Leaflet = (window as any).L

    const myPositionGPS = getLatLng(
      mapUrl,
      myPosition?.latitude || 0,
      myPosition?.longitude || 0
    )

    const zoom = 5

    const [lat, lng] = [myPositionGPS[0], myPositionGPS[1]]
    console.log('initMap myPositionGPS', L, myPosition, lat, lng, zoom)

    if (
      L &&
      !loadedMap.current &&
      myPosition?.timestamp &&
      myPosition?.timestamp >= 0
    ) {
      console.log('initMap 开始渲染')
      if (map.current) {
        clearMap()
      }
      if (!map.current) {
        map.current = L.map('wm-map', {
          renderer: L.canvas(),
          preferCanvas: true,
          zoomControl: false,
          minZoom: 3,
          maxZoom: 18,
          trackResize: false,
          zoomDelta: 0.5,
          zoomSnap: 0.5,

          attributionControl: false,
        })

        // 检测地址如果在中国就用高德地图
        map.current.setView([lat, lng], zoom)

        map.current?.on('click', async (e) => {
          let popLocation = e.latlng
          const { config } = store.getState()

          let latlng = getLatLngGcj02ToWgs84(
            mapUrl,
            popLocation.lat,
            popLocation.lng
          )

          // latlng = [popLocation.lat, popLocation.lng]

          console.log('latlng', latlng, e.latlng)

          let sellectCity = ''

          if (!marker.current && map.current) {
            // marker.current?.closePopup()
            // if (!map.current) return
            marker.current = createTargetCityWeatherMarkerIcon(map.current, [
              latlng[0],
              latlng[1],
            ])

            console.log(marker.current?.getPopup())
            const popupElement = marker.current?.getPopup()?.getElement() // 或 document.querySelector('.map-target-city-weather-popup')
            if (!popupElement) return

            // 示例1：给整个 popup 加点击（测试用）
            popupElement.addEventListener('click', (e) => {
              console.log(
                'popup 被点击了（任意位置）',
                e.target,
                marker.current?.getLatLng(),
                router
              )

              const latlng = marker.current?.getLatLng()

              if (basePathname === '') {
                eventListener.dispatch('CallbackModal:WeatherMapModal', {
                  lat: latlng?.lat,
                  lng: latlng?.lng,
                  city: sellectCity,
                })
                eventListener.dispatch('CloseModal:WeatherMapModal', true)
              } else {
                window.open(
                  (router.query.lang ? '/' + router.query.lang : '/') +
                    '?lat=' +
                    latlng?.lat +
                    '&lng=' +
                    latlng?.lng +
                    '&weatherMap=true',
                  '_blank'
                )
              }

              // e.stopPropagation(); // 如果需要阻止继续冒泡
            })

            const closeIcon = popupElement.querySelector(
              '.leaflet-popup-close-button'
            )
            if (closeIcon) {
              closeIcon.addEventListener('click', (e) => {
                e.stopPropagation()
                marker.current?.closePopup()
                marker.current = undefined
              })
            }
            marker.current.on('popupclose', () => {
              marker.current = undefined
            })
          }

          marker.current?.setPopupContent(
            createTargetCityWeatherContent({
              lat: latlng[0],
              lng: latlng[1],
              temp: -273.15,
              weather: '',
              city: '',
              loadingText: t('loading', {
                ns: 'prompt',
              }),
            })
          )
          marker.current?.setLatLng([latlng[0], latlng[1]])

          const res = await httpApi.v1.Geo.regeo({
            lat: latlng[0],
            lng: latlng[1],
            lang: config.lang,
          })

          console.log('getCityInfo regeo res', res)
          if (res?.address) {
            sellectCity =
              [res.state, res.region, res.city, res.town]
                .filter((v) => v)
                .at(-1) || ''

            let url = `https://api.open-meteo.com/v1/forecast?latitude=${latlng[0]}&longitude=${latlng[1]}&current=${[
              'temperature_2m',
              'weather_code',
              'relative_humidity_2m',
              'wind_speed_10m',
              'apparent_temperature',
              'dew_point_2m',
              'wind_speed_10m',
              'wind_direction_10m',
              'visibility',
              'pressure_msl',
              'surface_pressure',
              'precipitation',
              'precipitation_probability',
              'wind_gusts_10m',
            ].join(
              ','
            )}&forecast_minutely_15=12&past_minutely_15=0&forecast_days=15&past_days=1&timezone=${
              localTimezone.current
            }`

            const connectionStatusOpenMeteo =
              await networkConnectionStatusDetection(
                networkConnectionStatusDetectionEnum.openMeteo
              )

            // console.log(
            //   'networkConnectionStatusDetection connectionStatusOpenMeteo',
            //   connectionStatusOpenMeteo
            // )

            const res2 = await R.request({
              method: 'GET',
              url: connectionStatusOpenMeteo
                ? url
                : `${
                    toolsServer.url
                  }/api/v1/net/httpProxy?method=GET&url=${encodeURIComponent(url)}`,
            })

            let data = res2?.data?.data as any
            console.log('getCityInfo regeo data res2', data)
            if (connectionStatusOpenMeteo) {
              data = res2?.data
            }

            data?.current?.weather_code >= 0 &&
              marker.current?.setPopupContent(
                createTargetCityWeatherContent({
                  lat: latlng[0],
                  lng: latlng[1],
                  temp: data?.current?.temperature_2m || -273.15,
                  weather: t('weather' + (data?.current?.weather_code || 0), {
                    ns: 'sakiuiWeather',
                  }),
                  city: [res.state, res.region, res.city, res.town]
                    .filter((v) => v)
                    .join('·'),
                })
              )
            return
          }

          marker.current?.setPopupContent(
            createTargetCityWeatherContent({
              lat: latlng[0],
              lng: latlng[1],
              temp: -273.15,
              weather: '',
              city: '',
              loadingText: t('loadFaild', {
                ns: 'prompt',
              }),
            })
          )
        })

        layer.current = (L.tileLayer as any)
          .colorScale(mapUrl, {})
          .addTo(map.current)

        setTimeout(() => {
          map.current?.invalidateSize()
        }, 500)
      }

      loadedMap.current = true
    }

    // if (map.current && L) {
    //   marker.current?.setLatLng([myPositionGPS[0], myPositionGPS[1]])
    // }
  }

  return (
    <>
      <div
        style={{
          width: '100%',
          height: openModal ? '100%' : config.deviceWH.h - 90 + 'px',
        }}
        className={'weather-map-page ' + config.deviceType}
      >
        <div className="wm-main">
          <div id={'wm-map'} className={''}></div>
        </div>
      </div>
    </>
  )
}

const WeatherMapPage = () => {
  const { t, i18n } = useTranslation('weatherMapPage')
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    dispatch(
      methods.position.watchPosition({
        watch: false,
      })
    )
    dispatch(configSlice.actions.setSsoAccount(true))
    dispatch(layoutSlice.actions.setLayoutHeader(true))
  }, [])
  return (
    <>
      <Head>
        <title>
          {t('pageTitle') +
            ' - ' +
            t('appTitle', {
              ns: 'common',
            })}
        </title>
        <meta name="description" content={t('subtitle')} />
        <link
          href="https://cdn.jsdelivr.net/npm/qweather-icons@1.7.0/font/qweather-icons.css"
          rel="stylesheet"
        ></link>

        <link rel="stylesheet" href="/css/leaflet.css" crossOrigin="" />
        <script src="/js/leaflet.js" crossOrigin=""></script>
        <script src="/js/leaflet-polycolor.min.js"></script>
        <script src="/js/TileLayer.ColorScale.js" crossOrigin=""></script>

        {/* <script src="https://d3js.org/d3.v7.min.js"></script> */}
      </Head>
      <RenderWeatherMapPage></RenderWeatherMapPage>
    </>
  )
}

WeatherMapPage.getLayout = getLayout

export default WeatherMapPage
