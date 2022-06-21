"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fGet = exports.fPost = void 0;
const cross_fetch_1 = __importDefault(require("cross-fetch"));
async function fPost(route, body, headers) {
    const res = await (0, cross_fetch_1.default)(route, {
        method: "POST",
        body: JSON.stringify(body),
        headers
    });
    return await res.json();
}
exports.fPost = fPost;
async function fGet(route, headers) {
    const res = await (0, cross_fetch_1.default)(route, {
        headers
    });
    return await res.json();
}
exports.fGet = fGet;
//# sourceMappingURL=fetch.js.map