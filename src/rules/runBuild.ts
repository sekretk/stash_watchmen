import { get } from "../api";
import { Commit, PR, Rule, StashListResult } from "../contract";
import { pr_commits_url } from "../urls";

const MAX_COMMITS = 5;

export const runDesignReviewBuild: Rule = {
    name: 'RUN_DESIGN_REVIEW_BUILD',
    multipleApply: false,
    check: async (pr: PR) => {

        // if (pr.reviewers.every(_ => _.user.name !== process.env.user)) {
        //     return Promise.resolve(undefined);
        // }

        // const commits = await get<StashListResult<Commit>>(pr_commits_url(pr.id))

        // if (commits.size > MAX_COMMITS) {
        //     return Promise.resolve({ 
        //         text: `Have too many commits (${commits.isLastPage ? commits.size : `>${commits.size}`}). Please consider to squash them.`,
        //         force: true
        //     });
        // }

        return Promise.resolve(undefined);

    }
}