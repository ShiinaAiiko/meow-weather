package main

import (
	"context"
	"os"

	conf "github.com/ShiinaAiiko/nyanya-toolbox/server/config"
	mongodb "github.com/ShiinaAiiko/nyanya-toolbox/server/db/mongo"
	redisdb "github.com/ShiinaAiiko/nyanya-toolbox/server/db/redis"
	"github.com/ShiinaAiiko/nyanya-toolbox/server/services/gin_service"
	"github.com/ShiinaAiiko/nyanya-toolbox/server/services/i18n"

	"github.com/cherrai/nyanyago-utils/nlog"
	"github.com/cherrai/nyanyago-utils/nredis"
	"github.com/cherrai/nyanyago-utils/ntimer"
	"github.com/cherrai/nyanyago-utils/saass"
	sso "github.com/cherrai/saki-sso-go"

	// sfu "github.com/pion/ion-sfu/pkg/sfu"

	"github.com/go-redis/redis/v8"
)

var (
	log = nlog.New()
)

// 文件到期后根据时间进行删除 未做
func main() {
	nlog.SetPrefixTemplate("[{{Timer}}] [{{Type}}] [{{Date}}] [{{File}}]@{{Name}}")
	nlog.SetName("SAaSS")

	conf.G.Go(func() error {
		configPath := ""
		for k, v := range os.Args {
			switch v {
			case "--config":
				if os.Args[k+1] != "" {
					configPath = os.Args[k+1]
				}

			}
		}
		if configPath == "" {
			log.Error("Config file does not exist.")
			return nil
		}
		conf.GetConfig(configPath)

		// Connect to redis.
		redisdb.ConnectRedis(&redis.Options{
			Addr:     conf.Config.Redis.Addr,
			Password: conf.Config.Redis.Password, // no password set
			DB:       conf.Config.Redis.DB,       // use default DB
		})

		conf.Redisdb = nredis.New(context.Background(), &redis.Options{
			Addr:     conf.Config.Redis.Addr,
			Password: conf.Config.Redis.Password, // no password set
			DB:       conf.Config.Redis.DB,       // use default DB
		}, conf.BaseKey, log)
		conf.Redisdb.CreateKeys(conf.RedisCacheKeys)

		conf.SSO = sso.New(&sso.SakiSsoOptions{
			AppId:  conf.Config.SSO.AppId,
			AppKey: conf.Config.SSO.AppKey,
			Host:   conf.Config.SSO.Host,
			Rdb:    conf.Redisdb,
		})

		// token, err := conf.SSO.DeJwtToken("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ.eyJwYXlsb2FkIjp7ImFwcElkIjoiZWZhZTlMzktODA1OS01YWZlLWIwNmItNzcyMDNkY20NWIxIiwidXNlckluZm8iOnsidWlkIjoiRWuYUprbjF0IiwicGFzc3dvcmQiOiIiLCJ1c2ybmFtZSI6IlNoaWluYUFpaWtvIiwiZW1haWiOiJzaGlpbmFAYWlpa28uY2x1YiIsInBob2lIjoiIiwibmlja25hbWUiOiJTaGlpbmFBaWrby5OTy4wMDAwNCIsImF2YXRhciI6Imh0dH6Ly8xOTIuMTY4LjIwNC4xMzk6MTYxMDAvcyLSjNqempnUEw3P3gtc2Fhc3MtcHJvY2VzczpbWFnZS9yZXNpemUsMTYwLDcwIiwiYmlvIjic2hpaW5hQGFpaWtvLmNsdWIiLCJjaXR5IjbXSwiZ2VuZGVyIjoxLCJiaXJ0aGRheSI6Ij5OTUtMTAtMjkiLCJzdGF0dXMiOjEsImNyZW0aW9uVGltZSI6MTY5MTY2MjkzMSwibGFzdFwZGF0ZVRpbWUiOjE3NTMyODAwNDMsImxhc3TZWVuVGltZSI6MTc1MzY3NzU0OCwib3BlbkjY291bnQiOlt7InR5cGUiOiJHb29nbGUiLC1c2VySW5mbyI6eyJhdmF0YXIiOiJodHRwczvL2xoMy5nb29nbGV1c2VyY29udGVudC5jb2vYS9BQ2c4b2NLaVRsSlgxYnpiXy1RTUV1cm4b2Z1cE9JWHNVaGRkSHBWQW9WX1hkczMybkRRTNnPXM5Ni1jIiwibmlja25hbWUiOiJBaWqKioqaW5hIn19XX0sImxvZ2luSW5mbyI6eykZXZpY2VJZCI6IjkyZDZiMjNjLTZjODItNTzYy05OWQ3LTQzMjE1ZDY0ZDI1NiIsInVzZXBZ2VudCI6eyJicm93c2VyIjp7Im5hbWUiOiDaHJvbWUiLCJtYWpvciI6IjEzOCIsInZlcnpb24iOiIxMzguMC4wLjAifSwib3MiOnsibmtZSI6IldpbmRvd3MiLCJ2ZXJzaW9uIjoiMTifSwiZGV2aWNlIjp7Im1vZGVsIjoiIiwidHwZSI6ImJyb3dzZXIiLCJ2ZW5kb3IiOiIifSiZGV2aWNlTmFtZSI6IkNocm9tZSJ9LCJsb2pblRpbWUiOjE3NTM2Nzc1NzN9fSwiaWF0IjxNzUzNjc3NTczLCJleHAiOjE3NTQ5NzM1NzsImlzcyI6IlNha2lTU09EZXYifQ.g-I19I-wi8mnFthcpRnIqj1oWm-HWFL3KWc4VoPRRckModwlAFNJJYJkpJ0oJFRVFEpo19Al5wVdQN9.37")

		// log.Info(token, err)

		// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXlsb2FkIjp7ImFwcElkIjoiZWZhZTNlMzktODA1OS01YWZlLWIwNmItNzcyMDNkY2Q0NWIxIiwidXNlckluZm8iOnsidWlkIjoiRWduYUprbjF0IiwicGFzc3dvcmQiOiIiLCJ1c2VybmFtZSI6IlNoaWluYUFpaWtvIiwiZW1haWwiOiJzaGlpbmFAYWlpa28uY2x1YiIsInBob25lIjoiIiwibmlja25hbWUiOiJTaGlpbmFBaWlrby5OTy4wMDAwNCIsImF2YXRhciI6Imh0dHA6Ly8xOTIuMTY4LjIwNC4xMzk6MTYxMDAvcy9LSjNqempnUEw3P3gtc2Fhc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsMTYwLDcwIiwiYmlvIjoic2hpaW5hQGFpaWtvLmNsdWIiLCJjaXR5IjpbXSwiZ2VuZGVyIjoxLCJiaXJ0aGRheSI6IjE5OTUtMTAtMjkiLCJzdGF0dXMiOjEsImNyZWF0aW9uVGltZSI6MTY5MTY2MjkzMSwibGFzdFVwZGF0ZVRpbWUiOjE3NTMyODAwNDMsImxhc3RTZWVuVGltZSI6MTc1MzY3NzU0OCwib3BlbkFjY291bnQiOlt7InR5cGUiOiJHb29nbGUiLCJ1c2VySW5mbyI6eyJhdmF0YXIiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NLaVRsSlgxYnpiXy1RTUV1cmJ4b2Z1cE9JWHNVaGRkSHBWQW9WX1hkczMybkpRRTNnPXM5Ni1jIiwibmlja25hbWUiOiJBaWkqKioqaW5hIn19XX0sImxvZ2luSW5mbyI6eyJkZXZpY2VJZCI6IjkyZDZiMjNjLTZjODItNTYzYy05OWQ3LTQzMjE1ZDY0ZDI1NiIsInVzZXJBZ2VudCI6eyJicm93c2VyIjp7Im5hbWUiOiJDaHJvbWUiLCJtYWpvciI6IjEzOCIsInZlcnNpb24iOiIxMzguMC4wLjAifSwib3MiOnsibmFtZSI6IldpbmRvd3MiLCJ2ZXJzaW9uIjoiMTAifSwiZGV2aWNlIjp7Im1vZGVsIjoiIiwidHlwZSI6ImJyb3dzZXIiLCJ2ZW5kb3IiOiIifSwiZGV2aWNlTmFtZSI6IkNocm9tZSJ9LCJsb2dpblRpbWUiOjE3NTM2Nzc1NzN9fSwiaWF0IjoxNzUzNjc3NTczLCJleHAiOjE3NTQ5NzM1NzMsImlzcyI6IlNha2lTU09EZXYifQ.g-I19I-kwi8mnFthcpRnIqj1oWm-HWFL3KWc4VoPRRc

		conf.SAaSS = saass.New(&saass.Options{
			AppId:      conf.Config.Saass.AppId,
			AppKey:     conf.Config.Saass.AppKey,
			BaseUrl:    conf.Config.Saass.BaseUrl,
			ApiVersion: conf.Config.Saass.ApiVersion,
		})

		mongodb.ConnectMongoDB(conf.Config.Mongodb.Currentdb.Uri, conf.Config.Mongodb.Currentdb.Name)

		i18n.InitI18n()

		// log.Info("conf.Config.Mongodb.Currentdb", conf.Config.Mongodb.Currentdb)

		ntimer.SetTimeout(func() {

			// methods.GetCityBoundaries(conf.Config.CityVersion)

			log.Info("Done.")
		}, 1500)

		gin_service.Init()
		return nil
	})

	conf.G.Error(func(err error) {
		log.FullCallChain(err.Error(), "Error")
	})
	conf.G.Wait()
}
