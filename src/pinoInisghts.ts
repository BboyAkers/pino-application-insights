import { start, Contracts, defaultClient } from 'applicationinsights';
import { Writable } from 'pino-multi-stream';

interface Item {
  level: number;
  msg: string;
  stack: string;
  type: string;
}

interface Telemetry {
  message: string;
  severity: number;
  properties: Item;
}

export class Client {
  insights: any;

  constructor() {
    this.insights = defaultClient
  }

  getLogException (item: Item) {
    const {level, type, msg, stack } = item;
    
    if (level !== 50 || type !== 'Error')
      return;

    const err = new Error(msg)
    err.stack = stack || ''
    return err
  }

  getLogSeverity (level: number) {
    const { Verbose, Warning, Critical, Information } = Contracts.SeverityLevel;

    switch(level) {
      case 10 || 20:
        return Verbose;
      case 40:
        return Warning;
      case 50:
        return Contracts.SeverityLevel.Error;
      case 60:
        return Critical;
      default:
        return Information; // 30
    }
  }

  getLogMessage (item: Item) {
    if (item.msg) { return item.msg }
    const severity = this.getLogSeverity(item.level)
    return this.getLogSeverityName(severity)
  }

  getLogProperties (item: Item) {
    const props = (<any>Object).assign({}, item)
    delete props.msg
    return props
  }

  getLogSeverityName (severity: number) {
    const { Verbose, Warning, Critical } = Contracts.SeverityLevel;

    switch(severity) {
      case Verbose:
        return 'Verbose';
      case Warning:
        return 'Warning';
      case Contracts.SeverityLevel.Error:
        return 'Error';
      case Critical:
        return 'Critical';
      default:
        return 'Information'
    }
  }

  insertTrace (item: Item) {
    const telemetry: Telemetry = {
      message: this.getLogMessage(item),
      severity: this.getLogSeverity(item.level),
      properties: this.getLogProperties(item)
    }
    this.insights.trackTrace(telemetry)
  }

  //TODO: Can be improved bye using async await
  insertStream () {
    const writeStream = new Writable({ objectMode: true, highWaterMark: 1 })
    writeStream._write = function (chunk, encoding, callback) {
      this.insert(chunk).then(() => { callback(null) }).catch(callback)
    }
    return writeStream
  }
}