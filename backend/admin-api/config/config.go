package config

import (
	"github.com/spf13/viper"
)

type Config struct {
	Server   ServerConfig
	Postgres PostgresConfig
	Scylla   ScyllaConfig
	Redis    RedisConfig
	Auth0    Auth0Config
}

type ServerConfig struct {
	Address string
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
	Domain   string
	Audience string
}

func Load() (*Config, error) {
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(".")

	if err := viper.ReadInConfig(); err != nil {
		return nil, err
	}

	var cfg Config
	if err := viper.Unmarshal(&cfg); err != nil {
		return nil, err
	}

	return &cfg, nil
}
