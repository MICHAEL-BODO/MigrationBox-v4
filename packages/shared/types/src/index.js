"use strict";
/**
 * MigrationBox V5.0 - Shared Types Package
 *
 * Centralized TypeScript type definitions used across all packages and services.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrationBoxError = void 0;
// ============================================================================
// Error Types
// ============================================================================
class MigrationBoxError extends Error {
    code;
    statusCode;
    details;
    constructor(code, message, statusCode = 500, details) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.name = 'MigrationBoxError';
    }
}
exports.MigrationBoxError = MigrationBoxError;
//# sourceMappingURL=index.js.map