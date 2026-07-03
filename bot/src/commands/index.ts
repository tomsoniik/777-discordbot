import { Command } from '../types';
import { playCommand } from './music/play';
import { skipCommand } from './music/skip';
import { stopCommand } from './music/stop';
import { queueCommand } from './music/queue';
import { trackCommand } from './unturned/track';
import { untrackCommand } from './unturned/untrack';
import { trackedListCommand } from './unturned/tracked_list';
import { trackconfigCommand } from './unturned/trackconfig';

export const commands: Command[] = [
    playCommand,
    skipCommand,
    stopCommand,
    queueCommand,
    trackCommand,
    untrackCommand,
    trackedListCommand,
    trackconfigCommand
];
