"use strict";
exports.__esModule = true;
exports.Client = void 0;
var applicationinsights_1 = require("applicationinsights");
var pino_multi_stream_1 = require("pino-multi-stream");
var Client = /** @class */ (function () {
    function Client() {
        this.insights = applicationinsights_1.defaultClient;
    }
    Client.prototype.getLogException = function (item) {
        var level = item.level, type = item.type, msg = item.msg, stack = item.stack;
        if (level !== 50 || type !== 'Error')
            return;
        var err = new Error(msg);
        err.stack = stack || '';
        return err;
    };
    Client.prototype.getLogSeverity = function (level) {
        var _a = applicationinsights_1.Contracts.SeverityLevel, Verbose = _a.Verbose, Warning = _a.Warning, Critical = _a.Critical, Information = _a.Information;
        switch (level) {
            case 10 || 20:
                return Verbose;
            case 40:
                return Warning;
            case 50:
                return applicationinsights_1.Contracts.SeverityLevel.Error;
            case 60:
                return Critical;
            default:
                return Information; // 30
        }
    };
    Client.prototype.getLogMessage = function (item) {
        if (item.msg) {
            return item.msg;
        }
        var severity = this.getLogSeverity(item.level);
        return this.getLogSeverityName(severity);
    };
    Client.prototype.getLogProperties = function (item) {
        var props = Object.assign({}, item);
        delete props.msg;
        return props;
    };
    Client.prototype.getLogSeverityName = function (severity) {
        var _a = applicationinsights_1.Contracts.SeverityLevel, Verbose = _a.Verbose, Warning = _a.Warning, Critical = _a.Critical;
        switch (severity) {
            case Verbose:
                return 'Verbose';
            case Warning:
                return 'Warning';
            case applicationinsights_1.Contracts.SeverityLevel.Error:
                return 'Error';
            case Critical:
                return 'Critical';
            default:
                return 'Information';
        }
    };
    Client.prototype.insertTrace = function (item) {
        var telemetry = {
            message: this.getLogMessage(item),
            severity: this.getLogSeverity(item.level),
            properties: this.getLogProperties(item)
        };
        this.insights.trackTrace(telemetry);
    };
    //TODO: Can be improved bye using async await
    Client.prototype.insertStream = function () {
        var writeStream = new pino_multi_stream_1.Writable({ objectMode: true, highWaterMark: 1 });
        writeStream._write = function (chunk, encoding, callback) {
            this.insert(chunk).then(function () { callback(null); })["catch"](callback);
        };
        return writeStream;
    };
    return Client;
}());
exports.Client = Client;
