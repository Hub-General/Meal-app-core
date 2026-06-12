"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = errorHandler;
function errorHandler(err) {
    console.error(err);
    return {
        error: err.message || "An unexpected error occurred"
    };
}
//# sourceMappingURL=errorHandler.js.map