# Stage 1: Build stage
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /workspace

# Copy gradle wrapper and config
COPY gradlew gradlew.bat ./
COPY gradle gradle
COPY build.gradle settings.gradle ./

# Cache gradle dependencies
RUN ./gradlew dependencies --no-daemon || true

# Copy source code and compile
COPY src src
RUN ./gradlew bootJar --no-daemon -x test

# Stage 2: Minimal runtime image
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S structshield && adduser -S structshield -G structshield
USER structshield

COPY --from=builder /workspace/build/libs/structshield-backend-*.jar app.jar

EXPOSE 8080
ENV SPRING_PROFILES_ACTIVE=dev

ENTRYPOINT ["java", "-XX:+UseG1GC", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
