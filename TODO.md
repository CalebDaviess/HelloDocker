# TODO

- [x] Add an explicit combined startup for the app, PostgreSQL, Jenkins, and SonarQube.
- [ ] Configure `HelloDocker-PRs` to discover regular branches while excluding `main` and branches already built as pull requests.
- [x] Add main-branch Docker Hub publishing for build-number and commit-SHA tags.
- [x] Rebuild Jenkins with GitHub and security-fixed credentials-binding plugins.
- [ ] Set `DOCKERHUB_REPOSITORY`, add Jenkins credential `dockerhub-credentials`, and run a main build to verify Docker Hub publishing.
- [x] Start the existing ngrok tunnel after local checks; confirm the public Jenkins route and GitHub webhook ping delivery.
- [ ] After the Product Catalog UI is built, decide whether the public ngrok link should open the catalog UI by default while keeping Jenkins available at a separate path or host; make the UI target easy to swap.
- [ ] After a successful Jenkins build/publish, rename the Docker Compose project from `devops` to `devopsassignment`.
- [ ] Next week: plan a more complete Product Catalog project by expanding the existing API functionality and evaluating a user interface for browsing and managing products.
- [ ] Next week: plan an Azure Database for PostgreSQL deployment for the Product Catalog, including secure connection configuration, database migrations, and startup/deployment behavior.
