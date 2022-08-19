import { existsSync, readFileSync, writeFileSync } from 'fs';
import { DB } from '../const';

export const db: Map<number, string> = new Map<number, string>(existsSync(DB) ? JSON.parse(readFileSync(DB, { encoding: 'utf8' })) : []);

export const writeDB = (prs: Array<[number, string]>) => {
    writeFileSync(DB, JSON.stringify(prs, null, 2), { encoding: 'utf8' });
}