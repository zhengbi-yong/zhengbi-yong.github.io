# Grafana Datasources Module - Multi-Layer Architecture Documentation

## Layer 1: Application Layer

### Purpose & Scope
**Data source configuration** for Grafana dashboards. Defines connections to metrics backends (Prometheus) and other data providers.

**Core Responsibilities:**
- Prometheus connection configuration
- Data source authentication
- Query timeout settings
- Health check configuration

**Success Criteria:**
- Reliable data source connections
- <1s query response time
- Automatic failover support
- Secure credential management

**Integration Points:**
- Prometheus metrics server
- Grafana provisioning system
- Alert management system

---

## Layer 2: Feature Layer

### Data Source Types

**1. Prometheus** (`prometheus.yml`)
- Time-series metrics
- Alert rule evaluation
- Query execution

---

## Layer 3: Module Layer

### Module Structure

```
datasources/
└── prometheus.yml    # Prometheus configuration
```

### Configuration Structure

```yaml
# prometheus.yml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
    jsonData:
      timeInterval: 15s
      queryTimeout: 60s
      httpMethod: POST
```

---

## Layer 4: Integration Layer

### Prometheus Query Interface

**Query Examples:**
```promql
# Instant query
http_requests_total

# Range query
rate(http_requests_total[5m])

# Aggregation
sum by (endpoint) (rate(http_requests_total[5m]))
```

### Dashboard Usage

**Panel Configuration:**
```json
{
  "targets": [
    {
      "datasource": {
        "type": "prometheus",
        "uid": "prometheus"
      },
      "expr": "rate(http_requests_total[5m])"
    }
  ]
}
```

---

## Layer 5: Foundation Layer

### Dependencies

**External Services:**
- Prometheus - Metrics backend
- Grafana - Visualization frontend

**Configuration Format:**
- YAML - Provisioning files

---

## Development Guidelines

### Adding New Data Sources

**1. Create YAML Config:**
```yaml
apiVersion: 1

datasources:
  - name: NewDataSource
    type: <type>
    access: proxy
    url: http://datasource:port
```

### Best Practices

- Use environment variables for sensitive data
- Configure health checks
- Set appropriate timeouts
- Enable SSL for production

---

## Future Improvements

**Data Sources:**
1. Add Loki for log aggregation
2. Add Tempo for distributed tracing
3. Add PostgreSQL for direct database queries
4. Add Elasticsearch for log search
