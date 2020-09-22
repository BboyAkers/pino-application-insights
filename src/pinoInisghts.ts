import { start, Contracts, defaultClient } from 'applicationinsights';
import { Writable } from 'pino-multi-stream';

interface Item {
  level: number;
  msg: string;
}

interface Telemetry {
  message: string;
  severity: number;
  properties: Item;
}

export class Client {
  insights: any;

  constructor(options: object = {}) {
    this.insights = defaultClient
  }

  getLogSeverity (level: number) {
    switch(level) {
      case 10 || 20:
        return Contracts.SeverityLevel.Verbose;
      case 40:
        return Contracts.SeverityLevel.Warning;
      case 50:
        return Contracts.SeverityLevel.Error;
      case 60:
        return Contracts.SeverityLevel.Critical;
      default:
        return Contracts.SeverityLevel.Information; // 30
    }
  }

  getLogSeverityName (severity: number) {
    switch(severity) {
      case Contracts.SeverityLevel.Verbose:
        return 'Verbose';
      case Contracts.SeverityLevel.Warning:
        return 'Warning';
      case Contracts.SeverityLevel.Error:
        return 'Error';
      case Contracts.SeverityLevel.Critical:
        return 'Critical';
      default:
        return 'Information'
    }
  }
  
  getLogMessage (item: Item) {
    if (item.msg) { return item.msg }
    const severity = this.getLogSeverity(item.level)
    return this.getLogSeverityName(severity)
  }

  getLogProperties (item: Item) {
    const props = Object.assign({}, item)
    delete props.msg
    return props
  }

  insertTrace (item: Item) {
    const telemetry: Telemetry = {
      message: this.getLogMessage(item),
      severity: this.getLogSeverity(item.level),
      properties: this.getLogProperties(item)
    }
    this.insights.trackTrace(telemetry)
  }

  insertStream () {
    const writeStream = new Writable({ objectMode: true, highWaterMark: 1 })
    writeStream._write = function (chunk, encoding, callback) {
      this.insert(chunk).then(() => { callback(null) }).catch(callback)
    }
    return writeStream
  }
}