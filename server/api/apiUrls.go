package api

var ApiVersion = "v1"

var ApiUrls = map[string](map[string]string){
	"v1": {
		// Weather
		"getUploadTokenOfWeather": "/weather/uploadToken/get",
		"getWeatherFileUrls":      "/weather/fileUrls/get",
	},
}
