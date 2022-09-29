import { post, postWithResult } from "../api";
import { CASCADES, FAILURE_PR_TITLE, JIRA_URL_BROWESE } from "../const";
import { CreatedTicketResponse, createdTicketSuccessGuard, PR, Rule } from "../contract";
import { jira_ticket_transitions, jira_ticket_url, pr_browse } from "../urls";
import { toFullBranchId } from "../utils";

export const jiraTicketForFailureRule: Rule = {
    name: 'FAILURE_PR_TO_HANDLE',
    applience: 'once',
    check: async (pr: PR) => {

        if (pr.title !== FAILURE_PR_TITLE) {
            return Promise.resolve(undefined);
        }

        const cascades = [...CASCADES.entries()].map(([key, value]) => ({ from: toFullBranchId(key), to: toFullBranchId(value) }));

        if (!cascades.some(({ from, to }) => pr.fromRef.id === from && pr.toRef.id === to)) {
            return Promise.resolve(undefined);
        }

        console.log(`PR ${pr.id} to create JIRA`);

        const payload = {
            fields: {
                project: {
                    id: process.env.jiraproject
                },
                assignee: { name: "spectra-dev" },
                priority: { id: "1" },
                summary: "Cascade merge conflict resolve",
                description: `Need to resolve conflicts for auto cascade merge ${pr_browse(pr.id)}`,
                issuetype: {
                    name: "Task"
                },
                customfield_15471: "DXREQ-14269"
            }
        }

        const response = await postWithResult<CreatedTicketResponse>(jira_ticket_url(''), payload);

        if (createdTicketSuccessGuard(response)) {

            const transitionPayload = {
                transition: {
                    id: "11"//confirm
                },
                fields: {
                    customfield_10811: 1//storypoints
                }
            }

            await post(jira_ticket_transitions(response.key), transitionPayload);

            return Promise.resolve({
                text: `Cascade merge failed - need to handle in TICKET: ${JIRA_URL_BROWESE}/${response.key}`,
                force: false
            });
        }

        console.error(`rule FAILURE_PR_TO_HANDLE failed with error: ${JSON.stringify(response)} for payload: ${JSON.stringify(payload)}, to URL: ${jira_ticket_url('')}`);
        
        return Promise.resolve(undefined);
    }
}