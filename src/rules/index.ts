import { env } from "process";
import { post, del } from "../api";
import { APP_NAME } from "../const";
import { Activity, PR, Rule } from "../contract";
import { db } from "../db";
import { comment_pr_url } from "../urls";
import { jiraTicketForFailureRule } from "./jiraToFix";
import { commitsCount } from "./manyCommits";
import { noUnapprovedChangesRule } from "./noUnapprovedChanges";
import { runDesignReviewBuild } from "./runBuild";

export const openPullRequestCheckRules: Array<Rule> = [
    noUnapprovedChangesRule,
    commitsCount,
    jiraTicketForFailureRule,
    runDesignReviewBuild
]

export const applyRule = async (pr: PR, activities: Array<Activity>, rule: Rule): Promise<any | undefined> => {

    const ruleHeader = `[${APP_NAME}#${rule.name}]`;

    const ruleComments = activities
    .filter(item => item.action === 'COMMENTED')
    .filter(item => item.commentAction === 'ADDED')
    .filter(item => item.comment.text.startsWith(ruleHeader));

    if (rule.applience === 'once' && Boolean(ruleComments.length)) {
        return Promise.resolve(db.get(pr.id)?.[rule.name]);
    }

    const payload = db.get(pr.id)?.[rule.name];
    
    const result = await rule.check(pr, payload);
    
    if (rule.applience === 'replace') {

        if (`${ruleHeader} rule is applied: ${result?.text}` === ruleComments?.[0]?.comment.text && ruleComments.length === 1) {
            return Promise.resolve(result?.payload);
        }

        await Promise.all(ruleComments.map(com => del(comment_pr_url(pr.id) + `/${com.comment.id}?version=${com.comment.version}`,)));
    }
    
    if (result !== undefined && Boolean(result?.text)) {
        console.log(`Applyed rule ${ruleHeader} for PR ${pr.id}`);
        await post(comment_pr_url(pr.id), {
            "text": `${ruleHeader} rule is applied: ${result.text}`,
            "severity": result.force ? "BLOCKER" : 'NORMAL',

        }).catch(e => console.error(`Try to comment PR ${pr.id} is failed`, e));
    }

    return Promise.resolve(result?.payload??payload)
}