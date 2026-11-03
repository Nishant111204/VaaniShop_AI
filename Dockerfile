# One image serves the web app and the API on port 8080.

# 1) Build the React app
FROM node:22-alpine AS web
WORKDIR /web
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# 2) Build the Spring Boot jar with the app bundled as static files
FROM maven:3.9-eclipse-temurin-21 AS api
WORKDIR /app
COPY backend/pom.xml ./
RUN mvn -B -q dependency:go-offline
COPY backend/src ./src
COPY --from=web /web/dist ./src/main/resources/static
# Tests run in CI; this stage only packages.
RUN mvn -B -q -DskipTests package

# 3) Runtime
FROM eclipse-temurin:21-jre
# Fonts are needed to draw the link-preview cards.
RUN apt-get update \
 && apt-get install -y --no-install-recommends fontconfig fonts-dejavu-core \
 && rm -rf /var/lib/apt/lists/* \
 && useradd --system --uid 10001 vaanishop
WORKDIR /app
COPY --from=api /app/target/vaanishopai-backend-*.jar app.jar
USER vaanishop
EXPOSE 8080
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -Djava.awt.headless=true"
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
