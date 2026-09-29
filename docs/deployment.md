# StructShield — Cloud & Local Deployment Strategy

## 1. Local Deployment (Docker Compose)
StructShield provides a single command local environment containing all backing services and application components.

```bash
docker compose up -d
```

### Services
1. **`postgres`**: PostgreSQL 16 on port `5432` with healthcheck.
2. **`redis`**: Redis 7.2 on port `6379` with healthcheck.
3. **`kafka`**: Apache Kafka in KRaft mode on port `9092`.
4. **`backend`**: Spring Boot 3 multi-stage container running on port `8080`.
5. **`frontend`**: React + Vite production build served through Nginx on port `80` (mapped to `5173` or `3000`).

---

## 2. Cloud Architecture (AWS Target)

```
                       [ Internet ]
                            │
                            ▼
                    [ AWS Route 53 ]
                            │
                            ▼
             [ AWS Application Load Balancer ]
             (TLS Termination via ACM cert)
                 │                      │
                 ▼                      ▼
        [ ECS Fargate: Frontend ]   [ ECS Fargate: Backend API ]
        (Nginx container)          (Java 21 Spring Boot)
                                        │
           ┌────────────────────────────┼────────────────────────────┐
           ▼                            ▼                            ▼
  [ Amazon RDS Postgres ]   [ Amazon ElastiCache Redis ]   [ Amazon MSK Kafka ]
     (Multi-AZ db.m6g)            (Cluster Mode)              (Serverless / 3-Broker)
```

### AWS Service Mapping
- **Compute**: AWS ECS Fargate (serverless containers, no EC2 management). Kubernetes (EKS) was consciously ruled out for v1 to reduce unnecessary operational complexity and cost overhead.
- **Database**: AWS RDS for PostgreSQL 16 (Multi-AZ, automated backups, encrypted at rest via KMS).
- **In-Memory Cache**: Amazon ElastiCache for Redis (Redis 7 engine, primary-replica replication).
- **Event Streaming**: Amazon Managed Streaming for Apache Kafka (Amazon MSK).
- **Secrets Management**: AWS Secrets Manager, referenced directly in ECS task definitions as environment variables.
- **Container Registry**: Amazon ECR (Elastic Container Registry) with image vulnerability scanning.
- **Monitoring**: Amazon CloudWatch Logs and Container Insights integrated with Spring Boot Actuator & Micrometer.
