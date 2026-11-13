# Product Catalog

A Quarkus product catalog with a responsive browser UI and REST API, backed by PostgreSQL with Hibernate ORM and Panache.

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

The product catalog UI is served at `/`. Swagger UI is available at
`/q/swagger-ui/` and the OpenAPI document at `/q/openapi`.

The UI lists products from the REST API and supports searching, sorting,
creating, editing, and deleting catalog entries. It is compiled as static
Quarkus resources inside the existing `web-1` image, so the UI and API share
the same origin and the existing Jenkins pipeline builds them together.

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

The Dockerfile builds the Quarkus fast-jar package, including the static catalog UI, with Java 21 and copies only the runnable application into a Java 21 runtime image. The UI and API share port `8080` and the same origin.

For local development with PostgreSQL, copy `.env.example` to `.env` and start both services. The Compose file passes `DB_JDBC_URL` to the app so the runtime connects with a standard JDBC Postgres URL.

```powershell
Copy-Item .env.example .env
docker compose up --watch
```

The catalog is at <http://localhost:8080>, with Swagger UI at <http://localhost:8080/q/swagger-ui/>. Compose waits for PostgreSQL's readiness check before starting the app. PostgreSQL stores its data in the named `product-catalog-data` volume, so it survives container recreation. The example database credentials are for local development only.

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

Tests use the Quarkus test profile's in-memory H2 database and do not require
the Compose PostgreSQL service. When the API is already running on port `8081`,
use a different test HTTP port:

```powershell
mvn --batch-mode --no-transfer-progress clean verify '-Dquarkus.http.test-port=18081'
```

Without the API running, the usual `mvn test` command is sufficient.

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
The Jenkins/SonarQube Compose project name remains `devops` while the Jenkins
build and publish setup is being verified. The requested `devopsassignment`
rename is deferred to avoid disrupting the currently linked containers.
Existing explicit container, network, and external volume names are unchanged.
The application Compose file also defaults to host port `8080`; do not run
both stacks on that port at the same time. Use the combined startup script
below to run both stacks together; it assigns the application host port `8081`.

The `HelloDocker` Pipeline job is configured for this repository's `main`
branch and root `Jenkinsfile`. Its Maven build packages the UI resources into
the application image, so API and UI changes use the same push/build flow. It
publishes Maven Surefire JUnit XML results
in Jenkins and archives the raw XML files, including when tests fail. The
`quarkus-jacoco` test extension generates coverage for the existing
`@QuarkusTest` tests at `target/jacoco-report/jacoco.xml`; SonarQube imports
that report. JUnit test results and JaCoCo coverage are separate reports:
Surefire supplies test execution results, while JaCoCo supplies line and
branch coverage. Existing test dependencies include `quarkus-junit5`,
`quarkus-jacoco`, and `rest-assured` (test scope). A separate
`HelloDocker-PRs` Multibranch Pipeline
currently discovers pull requests from the origin repository and uses the same
root `Jenkinsfile`. To have it build regular branches too, configure its GitHub
Branch Source to retain pull-request discovery and add branch discovery with
the strategy **Exclude branches that are also filed as pull requests**. Add a
**Filter by name (with wildcards)** behavior with `*` included and `main`
excluded; this avoids duplicate builds because `HelloDocker` remains
responsible for `main`. Save the job and run **Scan Multibranch Pipeline Now**.
Fork PRs are intentionally excluded because the build agent has access to the
local Docker daemon.
The GitHub repository webhook targets
`https://matcher-actress-undivided.ngrok-free.dev/github-webhook/` and needs
both `push` and `pull_request` events. The local public gateway routes the
homepage and API to the catalog app and forwards only `/github-webhook/` to
Jenkins; the Jenkins UI remains local at <http://localhost:8080>.

The catalog UI and its CRUD API are intentionally public through ngrok. Anyone
with the link can add, edit, or delete products. Use demo data only until
authentication is added.

After starting the complete stack, point ngrok at the local public gateway:

```powershell
ngrok http --url=https://matcher-actress-undivided.ngrok-free.dev 8082
```

The existing GitHub webhook URL remains unchanged and continues to reach
Jenkins through the gateway. A GitHub ping delivery can verify this route
without starting a build.

Jenkins' global SonarQube installation is named `Local SonarQube` and uses
`http://sonarqube:9000` on the shared Docker network. Its authentication
credential is stored in Jenkins, not in this repository. The SonarQube
webhook points to `http://jenkins:8080/sonarqube-webhook/` for quality-gate
results.

### Start the complete local stack

From the repository root, start the Product Catalog API, PostgreSQL, Jenkins,
and SonarQube together:

```powershell
.\start-dev-stack.ps1
```

The script starts Jenkins first, then builds and starts the app stack with
PostgreSQL and the public gateway. The catalog is at <http://localhost:8081>;
the gateway for ngrok is at <http://localhost:8082>; Jenkins is at
<http://localhost:8080> and SonarQube at <http://localhost:9000>. The gateway
also requires the existing `devops-ci` Jenkins network, so start Jenkins
before enabling the `public` Compose profile. If starting services manually
from Docker Desktop, enable the profile by running this once from the repo
root after Jenkins is up:

```powershell
docker compose -f compose.yaml --profile public up -d
```

To stop the stacks without deleting their data:

```powershell
docker compose -f compose.yaml down
docker compose -p devops -f compose.jenkins.yaml down
```

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
build and its source commit. Main-branch builds then push both tags to Docker
Hub; pull-request builds do not publish images. To enable publishing, configure
the Jenkins global environment variable `DOCKERHUB_REPOSITORY` with the
namespace and repository (for example, `myaccount/product-catalog`). Add a
Jenkins **Username with password** credential with ID
`dockerhub-credentials`, using your Docker Hub username and a Docker Hub access
token as the password. The pipeline logs in with `--password-stdin` and does
not store credentials in the repository. The Jenkins controller image includes
credentials-binding `725.ve52b_2328a_fde`, which fixes the currently published
path-traversal advisories. The existing
`DevOpsPractice` job remains separate and unchanged.

To stop Jenkins and SonarQube without removing their persistent data:

```powershell
docker compose -f compose.jenkins.yaml down
```
