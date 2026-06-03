"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservationType = exports.ReservationStatus = void 0;
var ReservationStatus;
(function (ReservationStatus) {
    ReservationStatus["PENDING"] = "PENDING";
    ReservationStatus["CONFIRMED"] = "CONFIRMED";
    ReservationStatus["CANCELLED"] = "CANCELLED";
    ReservationStatus["COMPLETED"] = "COMPLETED";
    ReservationStatus["NO_SHOW"] = "NO_SHOW";
})(ReservationStatus || (exports.ReservationStatus = ReservationStatus = {}));
var ReservationType;
(function (ReservationType) {
    ReservationType["RESTAURANT"] = "RESTAURANT";
    ReservationType["HOTEL"] = "HOTEL";
})(ReservationType || (exports.ReservationType = ReservationType = {}));
//# sourceMappingURL=reservation.types.js.map