"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOYALTY_THRESHOLDS = exports.LOYALTY_POINTS = exports.LoyaltyActionType = void 0;
const user_types_1 = require("./user.types");
var LoyaltyActionType;
(function (LoyaltyActionType) {
    LoyaltyActionType["RESERVATION"] = "RESERVATION";
    LoyaltyActionType["REVIEW"] = "REVIEW";
    LoyaltyActionType["PHOTO_POST"] = "PHOTO_POST";
    LoyaltyActionType["VIDEO_POST"] = "VIDEO_POST";
    LoyaltyActionType["SHARE"] = "SHARE";
    LoyaltyActionType["INVITE"] = "INVITE";
    LoyaltyActionType["DAILY_LOGIN"] = "DAILY_LOGIN";
    LoyaltyActionType["PROFILE_COMPLETE"] = "PROFILE_COMPLETE";
})(LoyaltyActionType || (exports.LoyaltyActionType = LoyaltyActionType = {}));
exports.LOYALTY_POINTS = {
    [LoyaltyActionType.RESERVATION]: 50,
    [LoyaltyActionType.REVIEW]: 30,
    [LoyaltyActionType.PHOTO_POST]: 10,
    [LoyaltyActionType.VIDEO_POST]: 20,
    [LoyaltyActionType.SHARE]: 5,
    [LoyaltyActionType.INVITE]: 100,
    [LoyaltyActionType.DAILY_LOGIN]: 2,
    [LoyaltyActionType.PROFILE_COMPLETE]: 50,
};
exports.LOYALTY_THRESHOLDS = {
    [user_types_1.LoyaltyGrade.BRONZE]: 0,
    [user_types_1.LoyaltyGrade.SILVER]: 500,
    [user_types_1.LoyaltyGrade.GOLD]: 2000,
    [user_types_1.LoyaltyGrade.PLATINUM]: 10000,
    [user_types_1.LoyaltyGrade.DIAMOND]: 50000,
};
//# sourceMappingURL=loyalty.types.js.map