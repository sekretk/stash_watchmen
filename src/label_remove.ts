import fetch from 'cross-fetch';
import dotenv from 'dotenv';
import { JIRA_URL } from './const';
import { Ticket } from './contract';

dotenv.config();

const jira_ticket_url = (ticket: string) => `${JIRA_URL}/issue/${ticket}`;

const jira_by_label_url = (label: string) => `${JIRA_URL}/search?jql=labels%20%3D%20${encodeURIComponent(label)}`;

const token = Buffer.from(`${process.env.user}:${process.env.password}`).toString('base64');

const run = async (label: string) => {

    if (!Boolean(label)) {
        console.log('Error: lable should be specified');
        return;
    }

    const tickets: { issues: Array<Ticket> } = await fetch(
        jira_by_label_url(label),
        {
            method: 'GET',
            headers: {
                Authorization: 'Basic ' + token,
                'Content-Type': 'application/json',
            },
        })
        .then(_ => _.json());

    console.log('tickets to update', tickets.issues.map(_ => _.key).join('; '));

    for (const ticket of tickets.issues) {
        const result = await fetch(jira_ticket_url(ticket.key), {
            method: 'PUT',
            body: JSON.stringify({ "update": { "labels": [{ "remove": label }] } }),
            headers: {
                Authorization: 'Basic ' + token,
                'Content-Type': 'application/json',
            },
        })
        console.log(`Removing lable ${label} from ${ticket.key} result is ${result.ok.toString().toUpperCase()}`)
    }
}

run(process.argv[2]);