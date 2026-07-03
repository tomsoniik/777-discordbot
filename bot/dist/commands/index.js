"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commands = void 0;
const play_1 = require("./music/play");
const skip_1 = require("./music/skip");
const stop_1 = require("./music/stop");
const queue_1 = require("./music/queue");
const track_1 = require("./unturned/track");
const untrack_1 = require("./unturned/untrack");
const tracked_list_1 = require("./unturned/tracked_list");
const trackconfig_1 = require("./unturned/trackconfig");
exports.commands = [
    play_1.playCommand,
    skip_1.skipCommand,
    stop_1.stopCommand,
    queue_1.queueCommand,
    track_1.trackCommand,
    untrack_1.untrackCommand,
    tracked_list_1.trackedListCommand,
    trackconfig_1.trackconfigCommand
];
