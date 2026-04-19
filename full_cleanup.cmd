docker compose -f docker-compose.init.yml down -v
docker compose -f docker-compose.dev.yml down -v
docker compose down -v

git clean -fdx
