import { existsSync, readFileSync, writeFileSync } from 'fs';
import { DB } from '../const';

export type PullRequestPersistedItem = Record<string, any>;

export const db: Map<number, PullRequestPersistedItem> = new Map<number, PullRequestPersistedItem>(existsSync(DB) ? JSON.parse(readFileSync(DB, { encoding: 'utf8' })) : []);

export const writeDB = (prs: Array<readonly [number, PullRequestPersistedItem]>) => {
    writeFileSync(DB, JSON.stringify(prs, null, 2), { encoding: 'utf8' });
}