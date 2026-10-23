# Product Catalog API

A Quarkus REST API for managing products, backed by PostgreSQL with Hibernate Reactive and Panache.

## Requirements

- Java 21+
- Maven 3.9+
- PostgreSQL with a `product_catalog` database

The local default database username and password are both `product_catalog`. Override the connection settings with `DB_JDBC_URL`, `DB_USERNAME`, and `DB_PASSWORD`.

## Run in development

```powershell
$env:DB_JDBC_URL = "jdbc:postgresql://localhost:5432/product_catalog"
$env:DB_USERNAME = "product_catalog"
$env:DB_PASSWORD = "product_catalog"
mvn quarkus:dev
```

Swagger UI is available at <http://localhost:8080/q/swagger-ui/> and the OpenAPI document at <http://localhost:8080/q/openapi>.

## Product endpoints

| Method | Path | Behavior |
| --- | --- | --- |
| `GET` | `/api/products` | List products |
| `GET` | `/api/products/{id}` | Get a product |
| `POST` | `/api/products` | Create a product |
| `PUT` | `/api/products/{id}` | Replace a product |
| `DELETE` | `/api/products/{id}` | Delete a product |

Create and update requests use JSON like:

```json
{
  "name": "Desk lamp",
  "description": "Adjustable LED desk lamp",
  "price": 29.99,
  "stockQuantity": 12
}
```

Names are required (up to 120 characters), prices must be at least `0.01`, and stock quantities cannot be negative. Missing product IDs return `404`; successful creation returns `201`, and successful deletion returns `204`.

The current schema strategy updates the database schema automatically for this starter project. Before production use, replace that with managed database migrations.

## Container image

The Dockerfile builds the Quarkus fast-jar package with Java 21 and copies only the runnable application into a Java 21 runtime image. The API listens on port `8080`.

For local development with PostgreSQL, copy `.env.example` to `.env` and start both services. The Compose file passes `DB_JDBC_URL` to the app so the runtime connects with a standard JDBC Postgres URL.

```powershell
Copy-Item .env.example .env
docker compose up --watch
```

The API is at <http://localhost:8080>, with Swagger UI at <http://localhost:8080/q/swagger-ui/>. Opening the root address redirects to Swagger UI. Compose waits for PostgreSQL's readiness check before starting the API. PostgreSQL stores its data in the named `product-catalog-data` volume, so it survives container recreation. The example database credentials are for local development only.

Compose Watch rebuilds the API image when Java source/resources under `src/main` or `pom.xml` change. Rebuilding is necessary here because the runtime image contains compiled Java classes, not a live source interpreter. Use `docker compose up --build` if you want to start without Watch.

To remove the containers while keeping database data, run `docker compose down`. To also permanently delete the database volume and its data, run `docker compose down -v`.

The Compose setup is split across `compose.yaml` and `infra.yaml`: the main file includes the infrastructure file, which defines PostgreSQL and its data volume.

### Inspect and debug the stack

Check the merged Compose configuration before starting:

```powershell
docker compose config
```

Start the services in the background with Watch enabled, then check their status:

```powershell
docker compose up --watch -d
docker compose ps
```

Follow logs for all services or just the API:

```powershell
docker compose logs -f
docker compose logs -f web
```

Check database readiness and the API's configured database URL:

```powershell
docker compose exec postgres pg_isready -U product_catalog -d product_catalog
docker compose exec web sh -c 'printf "%s\n" "$DB_JDBC_URL"'
```

After the API has started and created its schema, inspect products directly in PostgreSQL:

```powershell
docker compose exec postgres psql -U product_catalog -d product_catalog -c "SELECT * FROM products;"
```

Stop the services while keeping the database volume with `docker compose down`. Use `docker compose down -v` only when you intentionally want to delete the stored database data.

To build just the API image, run `docker build -t product-catalog .` from the project directory.

## Tests

Run `mvn test` when the Compose PostgreSQL service is running at `localhost:5432` or with Docker Desktop configured as the active context. The test profile disables Quarkus Dev Services and connects directly to the local Compose database instead of attempting its own Docker-managed PostgreSQL instance.
