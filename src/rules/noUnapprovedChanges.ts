import { del } from "../api";
import { PR, Rule } from "../contract";
import { pr_commit, unapprove_pr_url } from "../urls";

export const noUnapprovedChangesRule: Rule = {
    name: 'NO_UNAPPROVED_CHANGES',
    applience: 'constantly',
    check: async (pr: PR, payload) => {

        if (pr.author.user.name === process.env.user) {
            return Promise.resolve(undefined);
        }

        if (!Boolean(pr.reviewers.find(_ => _.user.name === process.env.user))) {
            return Promise.resolve(undefined);
        }

        if (pr.reviewers.find(_ => _.user.name === process.env.user)?.status === 'UNAPPROVED') {
            return Promise.resolve(undefined);
        }

        const preCommit = typeof payload === 'string' ? payload : undefined;

        if (pr.fromRef.latestCommit === preCommit) {
            return Promise.resolve(undefined);
        }

        if (pr.reviewers.find(_ => _.user.name === process.env.user)?.status !== 'APPROVED') {
            return Promise.resolve(undefined);
        }

        if (payload === undefined) {
            //no need to unapprove previously not tracked
            return Promise.resolve({payload: pr.fromRef.latestCommit});
        }

        console.log(`PR ${pr.id} to UNAPPROVE`);

        await (del(unapprove_pr_url(pr.id))).catch(e => console.error(`Try to unapprove PR ${pr.id} is failed`, e));

        console.log('XXX pr.fromRef.latestCommit', pr.fromRef.latestCommit)

        return Promise.resolve({ 
            text: `Unapproved cause PR has new changes since [last approve](${pr_commit(pr.id, preCommit ?? '')})`, 
            force: false,
            payload: pr.fromRef.latestCommit
        });
    }
}