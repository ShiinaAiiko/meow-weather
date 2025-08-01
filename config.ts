import { baselog } from 'nyanyajs-log'
baselog.Info('Env:', process.env.CLIENT_ENV)
let server = {
  url: '',
}
let saass = {
  url: '',
}
let sakiui = {
  jsurl: '',
  esmjsurl: '',
}
let sakisso = {
  appId: '',
  clientUrl: '',
  serverUrl: '',
}
let meowApps = {
  jsurl: '',
  esmjsurl: '',
}
let webrtc = {
  url: '',
}
let appListUrl = ''
let version = ''

interface Config {
  server: typeof server
  saass: typeof saass
  sakiui: typeof sakiui
  sakisso: typeof sakisso
  appListUrl: typeof appListUrl
  meowApps: typeof meowApps
  webrtc: typeof webrtc
  version: typeof version
}

try {
  let configJson: Config = require('./config.temp.json')
  // let configJson: Config = require('./config.test.json')
  if (configJson) {
    server = configJson.server
    saass = configJson.saass
    sakiui = configJson.sakiui
    sakisso = configJson.sakisso
    meowApps = configJson.meowApps
    appListUrl = configJson.appListUrl
    webrtc = configJson.webrtc
    version = configJson.version
    console.log('new version', version)
  }
} catch (error) {
  console.error(error)
}
export { saass, sakiui, appListUrl, meowApps, server, webrtc, sakisso, version }
export default {
  saass,
  sakiui,
  appListUrl,
  meowApps,
  server,
  webrtc,
  sakisso,
  version,
}
