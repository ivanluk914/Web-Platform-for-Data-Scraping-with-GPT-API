#!/bin/bash

# Wait for Scylla to be ready
until cqlsh scylla -e "DESCRIBE KEYSPACES" > /dev/null 2>&1; do
  echo "Scylla is unavailable - sleeping"
  sleep 5
done

echo "Scylla is up - executing keyspace creation"

# Execute the CQL script
cqlsh scylla -f /scylla_init/keyspaces.cql

echo "Initialization complete"