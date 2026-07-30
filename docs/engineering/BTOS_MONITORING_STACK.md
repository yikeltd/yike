# Yike BTOS — Enterprise Monitoring & Observability Stack (Milestone 5)

## 1. Stack Components
The observability stack runs as a unified Docker Compose cluster (`config/monitoring/docker-compose.yml`):
- **Grafana** (Port `3001`): Web UI portal with pre-loaded dashboards.
- **Prometheus** (Port `9090`): Scrapes `/api/metrics` every 15s.
- **Grafana Tempo** (Ports `4317`/`4318`): Receives OpenTelemetry `traceparent` spans via OTLP.
- **Grafana Loki** (Port `3100`): Structured JSON log aggregator.

---

## 2. Quickstart Deployment

```bash
# Navigate to monitoring directory
cd config/monitoring

# Start Grafana, Prometheus, Loki & Tempo
docker compose up -d
```

Access Grafana at `http://localhost:3001` (Credentials: `admin` / `admin`).

---

## 3. Pre-Configured Dashboards
- **Executive Dashboard** (`btos-executive-dash`): Revenue, active workspaces, completed settlements.
- **Operations Dashboard** (`btos-operations-dash`): Subsystem health states & provider latency metrics.
- **Engineering Dashboard** (`btos-engineering-dash`): Saga step failure rates & settlement latency histograms.
- **Business Dashboard** (`btos-business-dash`): Transaction volume & active deal rooms.

---

## 4. Alert Routing (Slack / PagerDuty)
To route alerts to PagerDuty or Slack, update `config/prometheus/alerts.yml` or configure Grafana Alerting Contact Points:
- **PagerDuty Integration**: Set Integration Key in Grafana Alerting.
- **Slack Webhook**: Set Incoming Webhook URL in Grafana Alerting.
