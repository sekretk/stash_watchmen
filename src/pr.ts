import dotenv from 'dotenv';
dotenv.config();
import { get, put, token } from './api';
import { CASCADES, JIRA_URL } from './const';
import { Activity, PR, Project, Ticket, Version } from './contract';
import { writeDB } from './db';
import { applyRule, prCheckRules } from './rules';
import { merged_prs_url, opened_prs_url, pr_activities } from './urls';

const toFullBranchId = (version: string) => `refs/heads/release/${version}`;

let project: Project;

const destinationToVersions = new Map<string, Array<Version>>();

const isTargetVersion = (version: string) => (candidate: Version): boolean => {
    return /(\.\d)+/g.test(candidate.name) && candidate.name.startsWith(version) && !candidate.archived && !candidate.released && candidate.name.split('.').length <= version.split('.').length + 1;
}

const TARGET_VERSIONS: Array<string> = process.env.versions?.split(';') ?? [];

const jira_project_url = () => `${JIRA_URL}/project/${process.env.jiraproject}`;
const jira_version_url = () => `${JIRA_URL}/version/`;

const jira_ticket_url = (ticket: string) => `${JIRA_URL}/issue/${ticket}`;

const extract_jira = (prName: string): string => prName.match(new RegExp(`${process.env.prefix}-\\d*`, 'g'))?.[0] ?? '';

const createNextVersion = async (version: string): Promise<Version> => {
    const nextVerNum = project.versions
        .filter(_ => _.released)
        .map(_ => _.name)
        .filter(candidate => candidate.split('.').length === version.split('.').length + 1)
        .map(_ => _.split('.').pop())
        .map(Number)
        .filter(Boolean)
        .map(_ => _ + 1)?.[0] ?? 1;

    const nextV = `${version}.${nextVerNum}`;
    const newVersion: Version = await fetch(jira_version_url(), {
        method: 'POST',
        body: JSON.stringify({
            "description": "An auto incremented version",
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

    console.log('Created new version', newVersion);

    return newVersion;
}

const updateJIRA = async (jira: string, versions: Array<Version>): Promise<void> => {

    const ticket = await get<Ticket>(jira_ticket_url(jira));

    if (Boolean(ticket.errorMessages)) {
        console.error(`Error for ticket ${jira}: ${ticket.errorMessages}`)
        return
    }

    if (versions.every(versionToSet => ticket.fields.fixVersions.every(ver => ver.name !== versionToSet.name))) {


        const jiraResponse = await get<Ticket>(jira_ticket_url(jira));

        if (jiraResponse.fields.fixVersions.length > 0) {
            console.log(`Ticket ${ticket.key} is already has versions ${jiraResponse.fields.fixVersions.map(_ => _.name).join(';')}`);
            return;
        }

        const updateResult = await put(jira_ticket_url(jira), {
            fields: {
                fixVersions: versions
            }
        });

        updateResult.ok && console.log(`Ticket ${ticket.key} is updated with version by merged PR to ${versions.map(_ => _.name).join(';')}`)
    }
}

const populateProject = async () => {
    project = await get<Project>(jira_project_url());
}

const checkJira = async () => {
    TARGET_VERSIONS.forEach(async version => {
        const currentVersions: Array<Version> = project.versions.filter(isTargetVersion(version));

        if (currentVersions.length === 0) {
            console.info(`Destination version for ${version} not found, will be created`)
            currentVersions.push(await createNextVersion(version));
        }

        destinationToVersions.set(version, currentVersions);
    });

    CASCADES.forEach((val, key) => {
        if (destinationToVersions.has(key) && destinationToVersions.has(val)) {
            console.info(`From cascade settings ${key}-to-${val}, following versions will be added: ${JSON.stringify(destinationToVersions.get(val)?.map(_ => _.name))}`);
            destinationToVersions.set(key, [...destinationToVersions.get(key) ?? [], ...destinationToVersions.get(val) ?? []]);
        }
    });

}

const checkMergedPRs = async () => {

    const targetBranches = TARGET_VERSIONS.map(toFullBranchId);

    const prsRequest = await get<{ values: Array<PR> }>(merged_prs_url);

    const prs = prsRequest.values.filter(_ => targetBranches.includes(_.toRef?.id));

    prs.forEach(pr => {
        const prdestinationVersion = TARGET_VERSIONS.find(_ => toFullBranchId(_) === pr.toRef?.id);

        const jira = extract_jira(pr.title);

        if (!Boolean(jira)) {
            console.warn(`No JIRA for PR: ${pr.id}-${pr.title}`);
            return;
        }

        if (Boolean(prdestinationVersion)) {
            //console.log('UPDATE', extract_jira(pr.title), 'with',  destinationToVersions.get(prdestinationVersion ?? '') ?? []);
            updateJIRA(extract_jira(pr.title), destinationToVersions.get(prdestinationVersion ?? '') ?? []);
        }
    })
}

const checkOpenedPRs = async () => {
    const prsRequest = await get<{ values: Array<PR> }>(opened_prs_url);

    //filter out PRs creaed by user or user in reviwers
    const rpsToReview = prsRequest.values.filter(pr => pr.reviewers.some(rev => rev.user.name === process.env.user) || pr.author.user.name === process.env.user);

    await rpsToReview.forEach(async pr => {
        const activities = await get<{ values: Array<Activity> }>(pr_activities(pr.id));

        await Promise.all(prCheckRules.map(applyRule).map(async check => await check(pr, activities.values)));
    });   

    writeDB(rpsToReview.map(_ => ([_.id, _.fromRef.latestCommit])));

    console.log('Opened PR with review: ', rpsToReview.map(_ => _.id).join(' - '));
}



const main = async () => {
    console.log('PR versions sync is started')
    await populateProject();
    await checkJira();
    await checkMergedPRs();
    await checkOpenedPRs();
};


main();

