import { del } from "../api";
import { PR, Rule } from "../contract";
import { db } from "../db";
import { pr_commit, unapprove_pr_url } from "../urls";

export const noUnapprovedChangesRule: Rule = {
    name: 'NO_UNAPPROVED_CHANGES',
    multipleApply: true,
    check: async (pr: PR) => {
        if (pr.author.user.name === process.env.user) {
            return Promise.resolve(undefined);
        }

        if (pr.reviewers.find(_ => _.user.name === process.env.user)?.status === 'UNAPPROVED') {
            return Promise.resolve(undefined);
        }

        if (db.has(pr.id) && pr.fromRef.latestCommit === db.get(pr.id)) {
            return Promise.resolve(undefined);
        }

        if (pr.reviewers.find(_ => _.user.name === process.env.user)?.status !== 'APPROVED') {
            return Promise.resolve(undefined);
        }

        if (!db.has(pr.id)) {
            return Promise.resolve(undefined);
        }

        console.log(`PR ${pr.id} to UNAPPROVE`);

        await (del(unapprove_pr_url(pr.id))).catch(e => console.error(`Try to unapprove PR ${pr.id} is failed`, e));

        return Promise.resolve({ 
            text: `Unapproved cause PR has new changes since [last approve](${pr_commit(pr.id, db.get(pr.id) ?? '')}`, 
            force: false 
        });
    }
}