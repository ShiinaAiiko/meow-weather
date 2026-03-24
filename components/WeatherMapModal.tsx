import React, { useEffect, useMemo, useRef, useState } from 'react'
import store, { RootState, AppDispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { bindEvent, snackbar, progressBar, alert } from '@saki-ui/core'
import { deepCopy } from '@nyanyajs/utils'
import { weatherMethods, weatherSlice } from '../store/weather'
import { configSlice, eventListener, R } from '../store/config'
import {
  SakiAsideModal,
  SakiButton,
  SakiCol,
  SakiDropdown,
  SakiIcon,
  SakiMenu,
  SakiMenuItem,
  SakiModalHeader,
  SakiRow,
} from '../components/saki-ui-react/components'
import NoSSR from '../components/NoSSR'
import { RenderWeatherMapPage } from '../pages/[lang]/weatherMap'
import { useRouter } from 'next/router'

const WeatherMapModal = ({ visible }: { visible: boolean }) => {
  const { t, i18n } = useTranslation('weatherPage')
  const { config, weather } = useSelector((state: RootState) => {
    const { config, weather } = state
    return {
      config,
      weather,
    }
  })

  const router = useRouter()

  const dispatch = useDispatch<AppDispatch>()

  const [openTypeDP, setOpenTypeDP] = useState('')

  return (
    <NoSSR>
      <SakiAsideModal
        ref={
          bindEvent({
            close: () => {
              eventListener.dispatch('CloseModal:WeatherMapModal', true)
            },
          }) as any
        }
        onLoaded={() => {
          eventListener.dispatch('LoadModal:WeatherMapModal', true)
        }}
        width="100%"
        height="100%"
        max-width={
          config.deviceType === 'Mobile'
            ? '100%'
            : Math.min(900, config.deviceWH.w) + 'px'
        }
        max-height={
          config.deviceType === 'Mobile'
            ? '80%'
            : Math.min(700, config.deviceWH.h) + 'px'
        }
        vertical={config.deviceType === 'Mobile' ? 'Bottom' : 'Center'}
        horizontal={'Center'}
        offset-x={'0px'}
        offset-y={'0px'}
        mask
        mask-closable={config.deviceType === 'Mobile'}
        maskBackgroundColor={'rgba(0,0,0,0.3)'}
        border-radius={config.deviceType === 'Mobile' ? '10px 10px 0 0' : ''}
        border={config.deviceType === 'Mobile' ? 'none' : ''}
        background-color="#fff"
        visible={visible}
        overflow="hidden"
        zIndex={200}
      >
        <div className={'weather-map-modal ' + config.deviceType}>
          <div className="wmm-header">
            <SakiModalHeader
              border={false}
              back-icon={false}
              close-icon={true}
              right-width={'120px'}
              ref={
                bindEvent({
                  close() {
                    eventListener.dispatch('CloseModal:WeatherMapModal', true)
                  },
                }) as any
              }
              title={t('pageTitle', {
                ns: 'weatherMapPage',
              })}
            >
              <div slot="right">
                <SakiButton
                  onTap={() => {
                    window.open(
                      (router.query.lang ? '/' + router.query.lang : '/') +
                        '/weatherMap',
                      '_blank'
                    )
                  }}
                  type="Normal"
                  margin={'0 10px 0 0'}
                >
                  <span className="text-elipsis">
                    {t('openNewWindow', {
                      ns: 'prompt',
                    })}
                  </span>
                </SakiButton>
              </div>
            </SakiModalHeader>
          </div>
          <div className="wmm-main scrollBarHover">
            <RenderWeatherMapPage openModal></RenderWeatherMapPage>
          </div>
        </div>
      </SakiAsideModal>
    </NoSSR>
  )
}

export default WeatherMapModal
