"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransportMode = exports.TripType = exports.TripStatus = void 0;
var TripStatus;
(function (TripStatus) {
    TripStatus["DRAFT"] = "draft";
    TripStatus["PUBLISHED"] = "published";
    TripStatus["FULL"] = "full";
    TripStatus["IN_PROGRESS"] = "in_progress";
    TripStatus["COMPLETED"] = "completed";
    TripStatus["CANCELLED"] = "cancelled";
})(TripStatus || (exports.TripStatus = TripStatus = {}));
var TripType;
(function (TripType) {
    TripType["DOMESTIC"] = "domestic";
    TripType["INTERNATIONAL"] = "international";
})(TripType || (exports.TripType = TripType = {}));
var TransportMode;
(function (TransportMode) {
    TransportMode["CAR"] = "car";
    TransportMode["TRAIN"] = "train";
    TransportMode["PLANE"] = "plane";
    TransportMode["BUS"] = "bus";
})(TransportMode || (exports.TransportMode = TransportMode = {}));
