export type PR = {
    id: number,
    title: string,
    createdDate: number,
    author: {
        user: {
            displayName: string
        }
    }
}

export type Commit = {
    id: string,
    authorTimestamp: number,
}

export type Version = {name: string, archived: boolean, released: boolean };

export type Project = {
    versions: Array<Version>
}

export type Ticket = {
    key: string,
    fields: {
        fixVersions: Array<{name: string}>,
        labels: Array<string>
    }
}