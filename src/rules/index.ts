import { env } from "process";
import { post } from "../api";
import { APP_NAME } from "../const";
import { Activity, PR, Rule } from "../contract";
import { comment_pr_url } from "../urls";
import { jiraTicketForFailureRule } from "./jiraToFix";
import { commitsCount } from "./manyCommits";
import { noUnapprovedChangesRule } from "./noUnapprovedChanges";

export const openPullRequestCheckRules: Array<Rule> = [
    noUnapprovedChangesRule,
    commitsCount,
    jiraTicketForFailureRule
]

export const applyRule = (rule: Rule) => async (pr: PR, activities: Array<Activity>) => {

    const ruleHeader = `[${APP_NAME}#${rule.name}]`;

    if (!rule.multipleApply) {
        const haveCommented = activities
            .filter(item => item.action === 'COMMENTED')
            .filter(item => item.commentAction === 'ADDED')
            .filter(item => item.comment.author.name === process.env.user)
            .filter(item => item.comment.text.startsWith(ruleHeader))
            .some(Boolean);

        if (haveCommented) {
            console.log(`[applyRule] ${rule.name} - `)
            return Promise.resolve();
        }
    }

    const result = await rule.check(pr);
    if (result !== undefined && result.text.length > 0) {
        console.log(`Applyed rule ${ruleHeader} for PR ${pr.id}`);
        await post(comment_pr_url(pr.id), {
            "text": `${ruleHeader} rule is broken: ${result.text})`,
            "severity": result.force ? "BLOCKER" : 'NORMAL',

        }).catch(e => console.error(`Try to comment PR ${pr.id} is failed`, e));
    }
}