import { Injectable, Logger } from '@nestjs/common';

interface MetricData {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp?: Date;
}

interface CounterData {
  name: string;
  tags?: Record<string, string>;
  increment?: number;
}

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private readonly metrics = new Map<string, number>();
  private readonly counters = new Map<string, number>();

  // Registrar una métrica de gauge (valor instantáneo)
  gauge(data: MetricData): void {
    const key = this.generateKey(data.name, data.tags);
    this.metrics.set(key, data.value);

    this.logger.debug(`Gauge metric: ${key} = ${data.value}`, {
      metric: data.name,
      value: data.value,
      tags: data.tags,
      timestamp: data.timestamp || new Date(),
    });
  }

  // Incrementar un contador
  increment(data: CounterData): void {
    const key = this.generateKey(data.name, data.tags);
    const current = this.counters.get(key) || 0;
    const newValue = current + (data.increment || 1);
    this.counters.set(key, newValue);

    this.logger.debug(`Counter metric: ${key} = ${newValue}`, {
      metric: data.name,
      value: newValue,
      increment: data.increment || 1,
      tags: data.tags,
    });
  }

  // Medir tiempo de ejecución
  timer<T>(name: string, fn: () => Promise<T>, tags?: Record<string, string>): Promise<T> {
    const start = Date.now();

    return fn()
      .then(result => {
        const duration = Date.now() - start;
        this.gauge({
          name: `${name}_duration_ms`,
          value: duration,
          tags: { ...tags, status: 'success' },
        });
        return result;
      })
      .catch(error => {
        const duration = Date.now() - start;
        this.gauge({
          name: `${name}_duration_ms`,
          value: duration,
          tags: { ...tags, status: 'error' },
        });
        throw error;
      });
  }

  // Obtener todas las métricas actuales
  getAllMetrics(): Record<string, number> {
    const all: Record<string, number> = {};

    this.metrics.forEach((value, key) => {
      all[key] = value;
    });

    this.counters.forEach((value, key) => {
      all[key] = value;
    });

    return all;
  }

  // Resetear todas las métricas
  reset(): void {
    this.metrics.clear();
    this.counters.clear();
    this.logger.log('All metrics reset');
  }

  private generateKey(name: string, tags?: Record<string, string>): string {
    if (!tags || Object.keys(tags).length === 0) {
      return name;
    }

    const tagString = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join(',');

    return `${name}{${tagString}}`;
  }

  // Métricas específicas del negocio
  recordUserAction(action: string, userId?: string): void {
    this.increment({
      name: 'user_actions_total',
      tags: { action, userId: userId || 'anonymous' },
    });
  }

  recordDatabaseQuery(table: string, operation: string, duration: number): void {
    this.gauge({
      name: 'database_query_duration_ms',
      value: duration,
      tags: { table, operation },
    });

    this.increment({
      name: 'database_queries_total',
      tags: { table, operation },
    });
  }

  recordApiResponse(endpoint: string, method: string, statusCode: number, duration: number): void {
    this.gauge({
      name: 'api_response_duration_ms',
      value: duration,
      tags: { endpoint, method, status_code: statusCode.toString() },
    });

    this.increment({
      name: 'api_requests_total',
      tags: { endpoint, method, status_code: statusCode.toString() },
    });
  }
}
