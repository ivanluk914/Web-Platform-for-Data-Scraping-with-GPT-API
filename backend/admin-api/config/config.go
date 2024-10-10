package config

import (
	"github.com/spf13/viper"
)

const (
	EnvLocal = "local"
	EnvProd  = "prod"
)

type Config struct {
	Server   ServerConfig
	Postgres PostgresConfig
	Scylla   ScyllaConfig
	Redis    RedisConfig
	Auth0    Auth0Config
	Otel     OtelConfig
}

type ServerConfig struct {
	Address string
	Env     string
}

type PostgresConfig struct {
	URL string
}

type ScyllaConfig struct {
	Hosts    []string
	Keyspace string
}

type RedisConfig struct {
	Address string
}

type Auth0Config struct {
	Domain       string
	Audience     string
	ClientID     string
	ClientSecret string
}

type OtelConfig struct {
	Endpoint string
}

func Load() (*Config, error) {
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(".")
	viper.AutomaticEnv()

	if err := viper.ReadInConfig(); err != nil {
		return nil, err
	}

	var cfg Config
	if err := viper.Unmarshal(&cfg); err != nil {
		return nil, err
	}

	if env := viper.GetString("ENV"); env != "" {
		cfg.Server.Env = env
	}
	if clientID, ok := viper.Get("Auth0ClientID").(string); ok {
		cfg.Auth0.ClientID = clientID
	}
	if clientSecret, ok := viper.Get("Auth0ClientSecret").(string); ok {
		cfg.Auth0.ClientSecret = clientSecret
	}

	return &cfg, nil
}

func (c *ServerConfig) IsProd() bool {
	return c.Env == EnvProd
}
