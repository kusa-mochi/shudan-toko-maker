@REM docker compose -f docker-compose.init.yml down -v
@REM docker compose -f docker-compose.dev.yml down -v
@REM docker compose down -v

docker compose -f docker-compose.init.yml down
docker compose -f docker-compose.dev.yml down
docker compose down
