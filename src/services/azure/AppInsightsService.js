"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackTrace = exports.trackDependency = exports.trackException = exports.trackMetric = exports.trackEvent = exports.initializeAppInsights = void 0;
const appInsights = __importStar(require("applicationinsights"));
const jet_logger_1 = __importDefault(require("jet-logger"));
let isInitialized = false;
/**
 * Initialize Application Insights
 */
const initializeAppInsights = () => {
    const connectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;
    if (!connectionString) {
        jet_logger_1.default.warn('Application Insights connection string not provided. Monitoring disabled.');
        return;
    }
    try {
        appInsights.setup(connectionString)
            .setAutoDependencyCorrelation(true)
            .setAutoCollectRequests(true)
            .setAutoCollectPerformance(true, true)
            .setAutoCollectExceptions(true)
            .setAutoCollectDependencies(true)
            .setAutoCollectConsole(true, true)
            .setUseDiskRetryCaching(true)
            .start();
        isInitialized = true;
        jet_logger_1.default.info('Application Insights initialized');
    }
    catch (error) {
        jet_logger_1.default.err(error);
        jet_logger_1.default.warn('Failed to initialize Application Insights');
    }
};
exports.initializeAppInsights = initializeAppInsights;
/**
 * Track a custom event
 */
const trackEvent = (name, properties) => {
    if (!isInitialized)
        return;
    try {
        appInsights.defaultClient?.trackEvent({
            name,
            properties,
        });
    }
    catch (error) {
        jet_logger_1.default.err(error);
    }
};
exports.trackEvent = trackEvent;
/**
 * Track a custom metric
 */
const trackMetric = (name, value) => {
    if (!isInitialized)
        return;
    try {
        appInsights.defaultClient?.trackMetric({
            name,
            value,
        });
    }
    catch (error) {
        jet_logger_1.default.err(error);
    }
};
exports.trackMetric = trackMetric;
/**
 * Track an exception
 */
const trackException = (error, properties) => {
    if (!isInitialized)
        return;
    try {
        appInsights.defaultClient?.trackException({
            exception: error,
            properties,
        });
    }
    catch (err) {
        jet_logger_1.default.err(err);
    }
};
exports.trackException = trackException;
/**
 * Track a dependency (external service call)
 */
const trackDependency = (name, commandName, duration, success, dependencyTypeName) => {
    if (!isInitialized)
        return;
    try {
        appInsights.defaultClient?.trackDependency({
            name,
            data: commandName,
            duration,
            success,
            dependencyTypeName: dependencyTypeName || 'HTTP',
        });
    }
    catch (error) {
        jet_logger_1.default.err(error);
    }
};
exports.trackDependency = trackDependency;
/**
 * Track a trace
 */
const trackTrace = (message, severityLevel) => {
    if (!isInitialized)
        return;
    try {
        // Severity levels: 0=Verbose, 1=Information, 2=Warning, 3=Error, 4=Critical
        // Application Insights expects severity as a number, but the type might expect string
        appInsights.defaultClient?.trackTrace({
            message,
            severity: severityLevel ?? 1,
        });
    }
    catch (error) {
        jet_logger_1.default.err(error);
    }
};
exports.trackTrace = trackTrace;
exports.default = {
    initializeAppInsights: exports.initializeAppInsights,
    trackEvent: exports.trackEvent,
    trackMetric: exports.trackMetric,
    trackException: exports.trackException,
    trackDependency: exports.trackDependency,
    trackTrace: exports.trackTrace,
};
