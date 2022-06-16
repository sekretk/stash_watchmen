import fetch from 'cross-fetch';
import dotenv from 'dotenv';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { DB, JIRA_URL, STASH_URL } from './const';
import { Commit, PR, Project, Ticket, Version } from './contract';

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

const extract_jira = (prName: string): string => '';

const db: Array<WatchedPR> = existsSync(DB) ? JSON.parse(readFileSync(DB, { encoding: 'utf8' })) : [];

const writeDB = (prs: Array<WatchedPR>) => {
    writeFileSync(DB, JSON.stringify(prs, null, 2), { encoding: 'utf8' });
}

const createNextVersion = async (lastReleased: string): Promise<Version> => {
    const vers = Number(lastReleased.split('.')[1]);
    const nextV = lastReleased.split('.')[0] + '.' + (vers + 1).toString();
    const newVersion: Version =  await fetch(jira_version_url(), {
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

    const ticket: Ticket = await fetch(jira_ticket_url(jira), {
        method: 'GET',
        headers: {
            Authorization: 'Basic ' + token,
            'Content-Type': 'application/json',
        },
    }).then(_ => _.json());

    if (ticket.fields.fixVersions.every(_ => _.name !== nextVersion.name)) {
        await fetch(jira_ticket_url(jira), {
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
        }).then(_ => _.json());
    }
}

dotenv.config();

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


    const falledOutPRs = db.filter(_ => prs.values.every(pr => pr.id !== _.id));

    falledOutPRs.map(_ => _.jira).filter(Boolean).forEach(handleFallout);

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


    // const commits: Array<Commit> = []

    // prs.values.forEach(async ({ id }) => {
    //     const commit = await fetch(
    //         `https://stash.in.devexperts.com/rest/api/1.0/projects/RIA/repos/dxtf/pull-requests/${id}/commits?limit=100`,
    //         {
    //             method: 'GET',
    //             headers: {
    //                 Authorization: 'Basic ' + token,
    //                 'Content-Type': 'application/json',
    //             },
    //         })
    //         .then(_ => _.json());

    //     commits.push(commit);
    // })

    // console.log(commits);
}

run();