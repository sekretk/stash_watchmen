import fetch from 'cross-fetch';
import dotenv from 'dotenv';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { DB, JIRA_URL, STASH_URL } from './const';
import { Commit, PR, Project, Ticket, Version } from './contract';

dotenv.config();

type WatchedPR = {
    id: number,
    jira: string,
    lastCommit?: string
}

const opened_prs_url = () => `${STASH_URL}/projects/${process.env.project}/repos/${process.env.repo}/pull-requests?state=OPEN&at=${encodeURIComponent(process.env.target ?? '')}&limit=1000`;

const pr_commits_url = (pr: number) => `${STASH_URL}/projects/${process.env.project}/repos/${process.env.repo}/pull-requests/${pr}/commits?limit=1000`;

const jira_project_url = () => `${JIRA_URL}/project/${process.env.jiraproject}`;
const jira_version_url = () => `${JIRA_URL}/version/`;

const jira_ticket_url = (ticket: string) => `${JIRA_URL}/issue/${ticket}`;

const extract_jira = (prName: string): string => prName.match(new RegExp(`${process.env.prefix}-\\d*`, 'g'))?.[0] ?? '';

const db: Array<WatchedPR> = existsSync(DB) ? JSON.parse(readFileSync(DB, { encoding: 'utf8' })) : [];

const writeDB = (prs: Array<WatchedPR>) => {
    writeFileSync(DB, JSON.stringify(prs, null, 2), { encoding: 'utf8' });
}

const createNextVersion = async (lastReleased: string): Promise<Version> => {
    const vers = Number(lastReleased.split('.')[1]);
    const nextV = lastReleased.split('.')[0] + '.' + (vers + 1).toString();
    const newVersion: Version = await fetch(jira_version_url(), {
        method: 'POST',
        body: JSON.stringify({
            "description": "An auto incremented verrsion",
            "name": nextV,
            "archived": false,
            "released": false,
            "projectId": process.env.jiraproject
        }),
        headers: {
            Authorization: 'Basic ' + token,
            'Content-Type': 'application/json',
        },
    }).then(_ => _.json());

    console.log('createNextVersion', newVersion);

    return newVersion;
}

const handleFallout = async (jira: string): Promise<void> => {

    const project: Project = await fetch(jira_project_url(), {
        method: 'GET',
        headers: {
            Authorization: 'Basic ' + token,
            'Content-Type': 'application/json',
        },
    }).then(_ => _.json());

    const versions = project.versions
        .filter(_ => _.name.startsWith(process.env.version ?? ''))
        .filter(_ => !_.archived);

    let nextVersion: Version;

    if (versions.filter(_ => !_.released).length > 0) {
        nextVersion = versions[versions.length - 1];
    } else {
        nextVersion = await createNextVersion(versions[versions.length - 1].name);
    }

    console.log('handleFallout#nextVersion', nextVersion);

    const ticket: Ticket = await fetch(jira_ticket_url(jira), {
        method: 'GET',
        headers: {
            Authorization: 'Basic ' + token,
            'Content-Type': 'application/json',
        },
    }).then(_ => _.json());

    console.log('handleFallout#ticket', ticket.fields.fixVersions);

    if (ticket.fields.fixVersions.every(_ => _.name !== nextVersion.name)) {
        const updateResult = await fetch(jira_ticket_url(jira), {
            method: 'PUT',
            body: JSON.stringify({
                fields: {
                    fixVersions: [
                        nextVersion
                    ]
                }
            }),
            headers: {
                Authorization: 'Basic ' + token,
                'Content-Type': 'application/json',
            },
        });

        updateResult.ok && console.log(`Ticket ${ticket.key} is updated with version by merged PR to ${nextVersion.name}`)
    }
}


const token = Buffer.from(`${process.env.user}:${process.env.password}`).toString('base64');

const run = async () => {
    const prs: { values: Array<PR> } = await fetch(
        opened_prs_url(),
        {
            method: 'GET',
            headers: {
                Authorization: 'Basic ' + token,
                'Content-Type': 'application/json',
            },
        })
        .then(_ => _.json());

    console.log('PRs', prs.values.map(_ => _.id).join('; '));

    const falledOutPRs = db.filter(_ => prs.values.every(pr => pr.id !== _.id));

    await Promise.all(falledOutPRs.map(_ => _.jira).filter(Boolean).map(handleFallout));

    const prCommits: Array<WatchedPR> = await Promise.all(prs.values.map(_ => fetch(pr_commits_url(_.id), {
        method: 'GET',
        headers: {
            Authorization: 'Basic ' + token,
            'Content-Type': 'application/json',
        },
    })
        .then(res => res.json())
        .then(commits => ({ id: _.id, lastCommit: commits.values[0].id, jira: extract_jira(_.title) }))
    )
    );

    writeDB(prCommits);
}

run();