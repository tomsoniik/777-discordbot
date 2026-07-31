import { Command } from '../types';
import { trackCommand } from './unturned/track';
import { untrackCommand } from './unturned/untrack';
import { trackedListCommand } from './unturned/tracked_list';
import { trackconfigCommand } from './unturned/trackconfig';
import { checkServersCommand } from './unturned/check_servers';
import { playCommand } from './music/play';
import { skipCommand } from './music/skip';
import { stopCommand } from './music/stop';
import { queueCommand } from './music/queue';

export const commands: Command[] = [
    trackCommand,
    untrackCommand,
    trackedListCommand,
    trackconfigCommand,
    checkServersCommand,
    playCommand,
    skipCommand,
    stopCommand,
    queueCommand,
];
