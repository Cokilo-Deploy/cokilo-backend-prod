"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatMessageStatus = exports.ChatMessageType = exports.ChatConversationStatus = void 0;
var ChatConversationStatus;
(function (ChatConversationStatus) {
    ChatConversationStatus["ACTIVE"] = "active";
    ChatConversationStatus["ARCHIVED"] = "archived";
    ChatConversationStatus["BLOCKED"] = "blocked";
})(ChatConversationStatus || (exports.ChatConversationStatus = ChatConversationStatus = {}));
var ChatMessageType;
(function (ChatMessageType) {
    ChatMessageType["TEXT"] = "text";
    ChatMessageType["IMAGE"] = "image";
    ChatMessageType["FILE"] = "file";
    ChatMessageType["SYSTEM"] = "system";
})(ChatMessageType || (exports.ChatMessageType = ChatMessageType = {}));
var ChatMessageStatus;
(function (ChatMessageStatus) {
    ChatMessageStatus["SENT"] = "sent";
    ChatMessageStatus["DELIVERED"] = "delivered";
    ChatMessageStatus["FAILED"] = "failed";
})(ChatMessageStatus || (exports.ChatMessageStatus = ChatMessageStatus = {}));
