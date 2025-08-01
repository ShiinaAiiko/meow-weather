import {
  createSlice,
  createAsyncThunk,
  combineReducers,
  configureStore,
} from '@reduxjs/toolkit'
import exp from 'constants'
// import thunk from 'redux-thunk'
import { useDispatch } from 'react-redux'

import { apiSlice, apiMethods } from './api'
import { userSlice, userMethods } from './user'
import { layoutSlice, layoutMethods } from './layout'
import { configSlice, configMethods } from './config'
import { positionSlice, positionMethods } from './position'
import { weatherSlice, weatherMethods } from './weather'

export interface ActionParams<T = any> {
  type: string
  payload: T
}

const rootReducer = combineReducers({
  api: apiSlice.reducer,
  user: userSlice.reducer,
  layout: layoutSlice.reducer,
  config: configSlice.reducer,
  position: positionSlice.reducer,
  weather: weatherSlice.reducer,
})

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})

export {
  apiSlice,
  userSlice,
  configSlice,
  layoutSlice,
  positionSlice,
  weatherSlice,
}
export const methods = {
  api: apiMethods,
  user: userMethods,
  layout: layoutMethods,
  config: configMethods,
  position: positionMethods,
  weather: weatherMethods,
}

// console.log(store.getState())
export type RootState = ReturnType<typeof rootReducer>
export type AppDispatch = typeof store.dispatch
export const useAppDispatch = () => useDispatch<AppDispatch>()

export default store
