import { ACTIVITIES_LIMIT, COMMITS_LIMIT, PRS_LIMIT, STASH_URL, STASH_WEB } from "./const";

export const opened_prs_url = `${STASH_URL}/projects/${process.env.project}/repos/${process.env.repo}/pull-requests?state=OPEN`;

export const merged_prs_url = `${STASH_URL}/projects/${process.env.project}/repos/${process.env.repo}/pull-requests?state=MERGED&limit=${PRS_LIMIT}`;

export const pr_commits_url = (pr: number) => `${STASH_URL}/projects/${process.env.project}/repos/${process.env.repo}/pull-requests/${pr}/commits?limit=${COMMITS_LIMIT}`;

export const unapprove_pr_url = (pr: number) => `${STASH_URL}/projects/${process.env.project}/repos/${process.env.repo}/pull-requests/${pr}/approve`;

export const comment_pr_url = (pr: number) => `${STASH_URL}/projects/${process.env.project}/repos/${process.env.repo}/pull-requests/${pr}/comments`;

export const pr_commit = (pr: number, commit: string) => `${STASH_WEB}/projects/${process.env.project}/repos/${process.env.repo}/pull-requests/${pr}/commits/${commit}`;

export const pr_activities = (pr: number) => `${STASH_URL}/projects/${process.env.project}/repos/${process.env.repo}/pull-requests/${pr}/activities?limit=${ACTIVITIES_LIMIT}`;