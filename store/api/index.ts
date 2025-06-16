import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { server } from '../../config'

export const apiMethods = {}

export const apiSlice = createSlice({
  name: 'api',
  initialState: {
    apiUrl: server.url,
    apiUrls: {
      v1: {
        baseUrl: '/api/v1',
        urlToIp: '/url/toIp',
        ipDetails: '/ip/details',

        // Weather
        getUploadTokenOfWeather: '/weather/uploadToken/get',
        getWeatherFileUrls: '/weather/fileUrls/get',
      },
    },
    nsocketio: {
      namespace: {
        Base: '/',
        FileTransfer: '/fileTransfer',
      },
      routerEventName: {
        JoinedFTRoom: 'JoinedFTRoom',
        ExitedFTRoom: 'ExitedFTRoom',
        Error: 'Error',
      },
      requestEventName: {
        JoinFTRoom: 'JoinFTRoom',
        LeaveFTRoom: 'LeaveFTRoom',
        IncreaseFTRoomTimeLimit: 'IncreaseFTRoomTimeLimit',
        Data: 'Data',
      },
    },
  },
  reducers: {},
  extraReducers: (builder) => {},
})
