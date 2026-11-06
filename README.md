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

## Jenkins

The root `Jenkinsfile` runs Maven verification, reports compiler warnings, and
performs SonarQube analysis and quality-gate checks on the
`maven-docker-agent`. It includes a GitHub push trigger. The local Jenkins
controller and SonarQube service are defined in `compose.jenkins.yaml`.

Start or restart the local CI services from the repository root:

```powershell
docker compose -f compose.jenkins.yaml up -d --build
```

Open Jenkins at <http://localhost:8080> and SonarQube at
<http://localhost:9000>. Both ports are bound to localhost. Jenkins data and
the existing SonarQube data, extensions, and logs use persistent Docker
volumes; the Compose project name and volume names preserve the running setup.
The controller mounts the Docker socket, granting Jenkins control over the
local Docker daemon, so use it only on a trusted development machine.
The application Compose file also defaults to host port `8080`; do not run
both stacks on that port at the same time. To run the application alongside
Jenkins, set `$env:APP_PORT = "8081"` before starting the application stack.

The `HelloDocker` Pipeline job is configured for this repository's `main`
branch and root `Jenkinsfile`. The GitHub repository's push webhook targets
`https://matcher-actress-undivided.ngrok-free.dev/github-webhook/`; it works
while the local ngrok process and Jenkins are running. The tunnel exposes
Jenkins' sign-in page publicly, so keep Jenkins authentication enabled. Extra
ngrok authentication is optional and must allow GitHub's webhook requests.

Jenkins' global SonarQube installation is named `Local SonarQube` and uses
`http://sonarqube:9000` on the shared Docker network. Its authentication
credential is stored in Jenkins, not in this repository. The SonarQube
webhook points to `http://jenkins:8080/sonarqube-webhook/` for quality-gate
results.

Build the Java 21/Maven agent image from the repository root:

```powershell
docker build -f Dockerfile.maven-agent -t devops-maven-agent:3.9.9-java21 .
```

The Docker Cloud agent template uses label `maven-docker-agent`, image
`devops-maven-agent:3.9.9-java21`, remote filesystem root
`/home/jenkins/agent`, instance capacity `1`, pull strategy **Never pull**, and
network `devops-ci`, with **Attach Docker container** as its connection method.
Its **Container settings > Mounts** must include
`type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock` and **Extra
Groups** must include `0` so the agent can access the root-owned Docker socket
without running as root. This gives the build agent control of the local Docker
daemon; only run trusted pipeline code.

After tests and the SonarQube quality gate pass, the `HelloDocker` pipeline
builds the root `Dockerfile` locally as `product-catalog:build-<BUILD_NUMBER>`
and `product-catalog:sha-<12-character-commit>`. These tags identify each
build and its source commit. The image stays in the local Docker image store;
it is not pushed to a registry or deployed publicly. The existing
`DevOpsPractice` job remains separate and unchanged.

To stop Jenkins and SonarQube without removing their persistent data:

```powershell
docker compose -f compose.jenkins.yaml down
```
