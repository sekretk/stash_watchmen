import { ACTIVITIES_LIMIT, COMMITS_LIMIT, JIRA_URL, PRS_LIMIT, STASH_URL, STASH_WEB } from "./const";

export const opened_prs_url = `${STASH_URL}/projects/${process.env.project}/repos/${process.env.repo}/pull-requests?state=OPEN`;

export const merged_prs_url = `${STASH_URL}/projects/${process.env.project}/repos/${process.env.repo}/pull-requests?state=MERGED&limit=${PRS_LIMIT}`;

export const pr_commits_url = (pr: number) => `${STASH_URL}/projects/${process.env.project}/repos/${process.env.repo}/pull-requests/${pr}/commits?limit=${COMMITS_LIMIT}`;

export const unapprove_pr_url = (pr: number) => `${STASH_URL}/projects/${process.env.project}/repos/${process.env.repo}/pull-requests/${pr}/approve`;

export const comment_pr_url = (pr: number) => `${STASH_URL}/projects/${process.env.project}/repos/${process.env.repo}/pull-requests/${pr}/comments`;

export const pr_commit = (pr: number, commit: string) => `${STASH_WEB}/projects/${process.env.project}/repos/${process.env.repo}/pull-requests/${pr}/commits/${commit}`;

export const pr_browse = (pr: number) => `${STASH_WEB}/projects/${process.env.project}/repos/${process.env.repo}/pull-requests/${pr}`;

export const pr_activities = (pr: number) => `${STASH_URL}/projects/${process.env.project}/repos/${process.env.repo}/pull-requests/${pr}/activities?limit=${ACTIVITIES_LIMIT}`;

export const jira_project_url = () => `${JIRA_URL}/project/${process.env.jiraproject}`;
export const jira_version_url = () => `${JIRA_URL}/version/`;

export const jira_ticket_url = (ticket: string) => `${JIRA_URL}/issue/${ticket}`;

export const jira_ticket_transitions = (ticket: string) => `${JIRA_URL}/issue/${ticket}/transitions`;

export const extract_jira = (prName: string): string => prName.match(new RegExp(`${process.env.prefix}-\\d*`, 'g'))?.[0] ?? '';