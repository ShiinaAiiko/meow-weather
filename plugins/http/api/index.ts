import { NRequest } from '@nyanyajs/utils'
import store from '../../../store'
import { R } from '../../../store/config'
import { requestConfig } from '@nyanyajs/utils/dist/nrequest'
import { Geo } from './geo'
import { Weather } from './weather'

export const getUrl = (baseUrl: string, apiName: string) => {
  const { apiUrl } = store.getState().api

  return apiUrl + baseUrl + apiName
}
export const RequestProtobuf = async <T = any>(
  config: requestConfig,
  proto: any
) => {
  config.config = {
    // ...store.state.config.requestConfig,
    dataType: 'protobuf',
    // 后面也是需要加密的
    resquestEncryption: false,
    responseEncryption: false,
  }
  return NRequest.protobuf.ResponseDecode<T>(await R.request(config), proto)
}

export const v1 = {
  Geo: Geo(),
  Weather: Weather(),
}
export const httpApi = {
  v1,
}
export default v1
