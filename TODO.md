# TODO

- [x] Add an explicit combined startup for the app, PostgreSQL, Jenkins, and SonarQube.
- [ ] Configure `HelloDocker-PRs` to discover regular branches while excluding `main` and branches already built as pull requests.
- [x] Add main-branch Docker Hub publishing for build-number and commit-SHA tags.
- [x] Rebuild Jenkins with GitHub and security-fixed credentials-binding plugins.
- [ ] Set `DOCKERHUB_REPOSITORY`, add Jenkins credential `dockerhub-credentials`, and run a main build to verify Docker Hub publishing.
- [x] Route ngrok to the public catalog UI and verify the existing GitHub webhook still delivers through the gateway.
- [x] Build a separate catalog UI served by the existing API container and route ngrok to the UI while preserving the GitHub webhook path.
- [ ] Add authentication before using the public catalog with non-demo data.
- [ ] After a successful Jenkins build/publish, rename the Docker Compose project from `devops` to `devopsassignment`.
- [ ] Next week: plan broader Product Catalog capabilities beyond the current CRUD API and catalog UI.
- [ ] Next week: plan an Azure Database for PostgreSQL deployment for the Product Catalog, including secure connection configuration, database migrations, and startup/deployment behavior.
