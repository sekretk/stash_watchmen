import { string } from "fp-ts";
import * as t from 'io-ts'

export type User = {
    name: string
}

export type Reviewer = {
    user: User;
    lastReviewedCommit: string,
    approved: boolean,
    status: 'APPROVED' | 'UNAPPROVED'
}

export type PR = {
    id: number,
    title: string,
    createdDate: number,
    author: {
        user: {
            displayName: string,
            name: string
        }
    },
    fromRef: {
        id: string,
        displayId: string,
        latestCommit: string,
    },
    toRef: {
        id: string,
        displayId: string
    },
    reviewers: Array<Reviewer>
}

export type Commit = {
    id: string,
    authorTimestamp: number,
    version: number
}

export type StashListResult<T> = {
    values: Array<T>,
    size: number,
    isLastPage: boolean,
    start: number,
    limit: number,
}

export type Version = { name: string, archived: boolean, released: boolean };

export type Project = {
    versions: Array<Version>
}

export type Ticket = {
    key: string,
    errorMessages?: string,
    fields: {
        fixVersions: Array<{ name: string }>,
        labels: Array<string>
    }
}

export type CreatedTicketSuccess = {
    "id": string,
    "key": string,
    "self": string
};

export type CreatedTicketResponse = {
    "errorMessages": Array<any>,
    "errors": Record<string, string>
} | CreatedTicketSuccess;

export const createdTicketSuccessGuard = (response: CreatedTicketResponse): response is CreatedTicketSuccess => !('errors' in response);

type Comment = {
    id: number,
    "createdDate": number,
    "action": "COMMENTED",
    "commentAction": "ADDED" | string,
    "comment": {
        "id": number,
        "text": string,
        "author": {
            "name": string,
        },
        "createdDate": number,
        "updatedDate": number,
        "severity": "NORMAL",
        "state": "OPEN",
    }
}

export type Activity = {
    action: 'APPROVED' | 'COMMENTED' | 'UNAPPROVED' | 'RESCOPED' | 'OPENED',
    "commentAction": "ADDED" | string,
    "comment": {
        "id": number,
        "text": string,
        "author": {
            "name": string,
        },
        "createdDate": number,
        "updatedDate": number,
        "severity": string,
        "state": string,
    }
}

export type Rule = {
    name: string,
    multipleApply: boolean,
    check: (pr: PR) => Promise<{ text: string, force: boolean } | undefined>
}

export const EnvironmentDecoder = t.type({
    user: t.string,
    password: t.string,
    project: t.string,
    repo: t.string,
    jiraproject: t.string,
    versions: t.string,
    prefix: t.string,
});

export type Environment = t.OutputOf<typeof EnvironmentDecoder>;

export type KeyValue<T,R> = [T, R];