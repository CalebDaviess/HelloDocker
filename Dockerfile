# syntax=docker/dockerfile:1

FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /workspace

COPY pom.xml .
COPY src ./src
RUN mvn -B package -DskipTests

FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /work

COPY --from=build /workspace/target/quarkus-app/ ./

EXPOSE 8080
ENV QUARKUS_HTTP_HOST=0.0.0.0

CMD ["java", "-jar", "quarkus-run.jar"]
