import { t } from 'i18next'
import store from '../store'

import Leaflet from 'leaflet'

export const createMyPositionMarker = (
  map: Leaflet.Map,
  [lat, lon]: number[],
  showAvatarAtCurrentPosition: boolean
) => {
  const { user, config } = store.getState()
  const L: typeof Leaflet = (window as any).L

  return (
    L.marker([lat, lon], {
      icon: L.divIcon({
        html: `<div class='map_current_position_icon-wrap'>
      <div class='icon'></div>
      ${
        user.userInfo?.uid && showAvatarAtCurrentPosition
          ? `<div class='saki-avatar'><saki-avatar
        width='${22}px'
        height='${22}px'
        border-radius='50%'
        border='2px solid #fff'
        border-hover='2px solid #fff'
        border-active='2px solid #fff'
        default-icon={'UserLine'}
        nickname='${user.userInfo?.nickname}'
        src='${user.userInfo?.avatar}'
        alt=''
        lazyload="false"
      ></saki-avatar></div>`
          : ''
      }

      </div>`,
        className:
          'map_current_position_icon ' +
          (user?.userInfo?.uid && showAvatarAtCurrentPosition
            ? ' avatar'
            : ' noAvatar'),
        // iconUrl: user?.userInfo?.avatar || '',
        // iconUrl: '/current_position_50px.png',
        // iconUrl: user?.userInfo?.avatar || '/current_position_50px.png',
        iconSize: [26, 26], // size of the icon
        // shadowSize: [36, 36], // size of the shadow
        // iconAnchor: [22, 94], // point of the icon which will correspond to marker's location
        // shadowAnchor: [4, 62], // the same for the shadow
        // popupAnchor: [-3, -76], // point from which the popup should open relative to the iconAnchor
      }),
    })
      .addTo(map)
      // .bindPopup(
      // 	`${ipInfoObj.ipv4}`
      // 	// `${ipInfoObj.country}, ${ipInfoObj.regionName}, ${ipInfoObj.city}`
      // )
      .openPopup()
  )
}

export const createTargetCityWeatherContent = ({
  lat,
  lng,
  temp,
  weather,
  city,
  loadingText,
}: {
  lat: number
  lng: number
  temp: number
  weather: string
  city: string
  loadingText?: string
}) => {
  return `
    <div class="map-target-city-weather-popup-wrap ">
      <div class="tcw-header">
        <div class="tcw-h-left">
          <span>${lat.toFixed(3)}°N, ${lng.toFixed(3)}°E</span>
        </div>
        <div class="tcw-h-right">
        </div>
      </div>

     ${
       !loadingText
         ? ` <div class="tcw-temp">
        <span>${temp}</span>
        <span>°C</span>
        <span>${weather}</span>
      </div>
      <div class="tcw-city">
        ${city}
      </div>
      
      `
         : `<div class="tcw-loading">
        ${loadingText}
      </div>
      <div class="tcw-city">
        ${loadingText}
      </div>
      
      
      `
     }

  
    </div>
  `
}

export const createTargetCityWeatherMarkerIcon = (
  map: Leaflet.Map,
  [lat, lng]: number[]
) => {
  const L: typeof Leaflet = (window as any).L

  // 可以选择用一个非常小的/透明的 icon（或不设 icon，用默认的也可以）
  const tinyIcon = L.divIcon({
    className: 'leaflet-invisible-marker', // 自定义类隐藏默认图标
    iconSize: [1, 1], // 极小尺寸
    iconAnchor: [0, 0],
  })

  // 创建 marker（作为 popup 的定位锚点）
  const marker = L.marker([lat, lng], {
    icon: tinyIcon, // 几乎看不见的图标
    interactive: true, // 确保可交互
    riseOnHover: true,
    // zIndexOffset: 1000,    // 可选：抬高层级，避免被其他 marker 盖住
  }).addTo(map)

  // 你的自定义天气内容 HTML（和原来一样）
  const popupContent = createTargetCityWeatherContent({
    lat,
    lng,
    temp: -273.15,
    weather: '',
    city: t('loading', {
      ns: 'prompt',
    }),
  })

  // 绑定 popup，并设置一些常用选项
  marker.bindPopup(popupContent, {
    closeButton: true, // 如果你自己用 saki-icon 做关闭按钮
    autoClose: false, // 点击地图其他地方自动关闭（可改 false）
    closeOnClick: false, // 点击地图关闭
    className: 'map-target-city-weather-popup', // 给 popup 加类，便于自定义样式
    maxWidth: 280, // 控制宽度，防止太宽

    offset: [0, -90],
  })

  // 立即打开（相当于你原来的 .openPopup()）
  marker.openPopup()

  // 可选：监听关闭事件，做清理或其他逻辑
  // marker.on('popupclose', () => {
  //   map.removeLayer(marker);  // 如果不需要保留 marker，可以移除
  // });

  return marker // 返回 marker，万一后面需要操作它
}
