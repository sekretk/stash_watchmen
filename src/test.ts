import { array, boolean, either } from "fp-ts";
import { constant, flow, FunctionN, pipe } from "fp-ts/lib/function";
import { Activity, Environment, KeyValue, PR, Project, Version } from "./contract";
import { loadEnvironment } from "./env-loader";
import * as TE from 'fp-ts/lib/TaskEither'
import * as RTE from 'fp-ts/lib/ReaderTaskEither'
import * as E from 'fp-ts/lib/Either'
import * as T from 'fp-ts/lib/Task'
import axios, { AxiosResponse } from "axios";
import * as t from 'io-ts'
import { failure } from 'io-ts/lib/PathReporter'
import { CASCADES, DB, JIRA_URL } from "./const";
import { token } from "./api";
import fetch from 'cross-fetch';
import { map } from "fp-ts/lib/Functor";
import { sequenceT } from "fp-ts/lib/Apply";
import * as RR from 'fp-ts/ReadonlyRecord'
import * as R from 'fp-ts/Reader'
import * as O from 'fp-ts/Option'
import { log } from 'fp-ts/lib/Console'
import { mapConstructor, pick } from "./utils";
import { writeFileSync } from "fs";


const getAxios = (props: { token: string }) =>
    axios.create({
        timeout: 1000,
        headers: {
            "Authorization": 'Basic ' + props.token,
            'Content-Type': 'application/json',
        }
    });

export const getToken = <T extends Pick<Environment, 'user' | 'password'>>(env: T): TE.TaskEither<Error, string> => TE.of(Buffer.from(`${env.user}:${env.password}`).toString('base64'));

const getTargetVersions = <T extends Pick<Environment, 'versions'>>(env: T): TE.TaskEither<Error, Array<string>> => TE.of(env.versions?.split(';') ?? []);

//Convert our api call to a TaskEither
const httpGet = (url: string, token: string) => TE.tryCatch<Error, AxiosResponse>(
    () => axios.get(url, {
        headers: {
            'Authorization': 'Basic ' + token,
            'Content-Type': 'application/json',
        }
    }),
    reason => new Error(String(reason))
)



//function to decode an unknown into an A
const decodeWith = <A>(decoder: t.Decoder<unknown, A>) =>
    flow(
        decoder.decode,
        E.mapLeft(errors => new Error(failure(errors).join('\n'))),
        TE.fromEither
    )

//takes a url and a decoder and gives you back an Either<Error, A>
const getFromUrl = <A>(token: string, url: string, codec: t.Decoder<unknown, A>): TE.TaskEither<Error, A> => pipe(
    httpGet(url, token),
    TE.map(x => x.data),
    TE.chain(decodeWith(codec))
);

const jira_project_url = (proj: string) => `${JIRA_URL}/project/${proj}`;

const versionDecoder = t.type({
    name: t.string, archived: t.boolean, released: t.boolean
});

const projectDecoder = t.type({
    versions: t.array(t.type({ name: t.string, archived: t.boolean, released: t.boolean }))
});

export const taskEitherEffect = <A>(f: (a: A) => TE.TaskEither<Error, void>) => (b: TE.TaskEither<Error, A>) => {
    return pipe(
        b,
        TE.fold(TE.left, (value) =>
            TE.tryCatch(() => Promise.resolve(f(value)), (e) => new Error(`Got en error in side effect`, e)))
    )
}

const checkJira = async () => {
    TARGET_VERSIONS.forEach(async version => {
        const currentVersions: Array<Version> = project.versions.filter(isTargetVersion(version));

        if (currentVersions.length === 0) {
            console.info(`Destination version for ${version} not found, will be created`)
            currentVersions.push(await createNextVersion(version));
        }

        destinationToVersions.set(version, currentVersions);
    });

    CASCADES.forEach((val, key) => {
        if (destinationToVersions.has(key) && destinationToVersions.has(val)) {
            console.info(`From cascade settings ${key}-to-${val}, following versions will be added: ${JSON.stringify(destinationToVersions.get(val)?.map(_ => _.name))}`);
            destinationToVersions.set(key, [...destinationToVersions.get(key) ?? [], ...destinationToVersions.get(val) ?? []]);
        }
    });
}

type TargetVersion = Map<string, Version[]>;

type PullRequestWatchItem = {
    lastCommit: string,
    build?: string,
    jira: string
}

type DB = Map<number, PullRequestWatchItem>;

const getDB = <T extends Environment>(_: T): TE.TaskEither<Error, DB> => { }

const mapVersions = (env: { targetVersions: Array<string>, cascade: Map<string, string> }): TargetVersion = { }

const createVersion = (version: string): TE.TaskEither<Error, Version> = { }

const createIfNeeded = (env: { targetVersions: Array<string>, cascade: Map<string, string>, versions: Array<Version> }): TE.TaskEither<Error, void> = { }

const getTargetVersion = <T extends { token: string, jiraproject: string, targetVersions: Array<string>}>(env: T): TE.TaskEither<Error, TargetVersion> =>
    pipe(
        getFromUrl<Project>(env.token, jira_project_url(env.jiraproject), projectDecoder),
        TE.map(project => ({ ...env, versions: project.versions })),
        taskEitherEffect(_ => createIfNeeded(_)),
        TE.map(_ => _.versions)
    );

const getPullRequests = <T extends {}>(env: T): TE.TaskEither<Error, Array<PR>> => { }

const rrr = (_: string): TE.TaskEither<Error, void> => TE.of(undefined);

const sss = (_: Array<string>) => pipe(_, array.map(rrr), TE.sequenceSeqArray);

type PullRequestRulesResult = {

}

const getPRActivities = (prid: number): TE.TaskEither<Error, Array<Activity>> = { }

type PullRequestCheckResult = {
    message: string,
    lastCommit?: string,
    designReviewBuild?: {
        id: number,
        status: 'not-started' | 'failed' | 'in-progress' | 'successed'
    }
}

type RuleContext = Environment & {pr: PR, activities: Array<Activity>};

type PullRequestValidationRule = {
    name: string,
    check: (env: RuleContext) => TE.TaskEither<RuleExecutionError, PullRequestCheckResult>
}

type RuleExecutionError = Error & { conditionallyStopped: boolean };

const OnlyMeAsReviewer = (ctx: RuleContext): TE.TaskEither<Error, void> => pipe(
    ctx,
    TE.of,
    TE.chain(_ => _.pr.id === 1 ? TE.of(undefined) : TE.of(undefined))
    //TE.mapLeft(e => ({...e, conditionallyStopped: false})),
    //TE.chain(_ => _.pr.id === 1 ? TE.left() : TE.of(undefined)),
    // TE.map(_ => )
)

const ruleImplentation: PullRequestValidationRule = {
    name: 'RULE',
    check: (env) => pipe(
        env,
        TE.of,
        TE.chain(_ => _.)
    )
}

const prRules = (pr: PR): Array<PullRequestValidationRule> => {}

const runRule = (rule: PullRequestValidationRule): TE.TaskEither<Error, void> => 

const runPRCheck = pipe(
    TE.of({pr: {} as PR}),
    TE.bind('activities', flow(pick('pr'), pick('id'), getPRActivities)),
    TE.chain(_ => pipe(_.pr, prRules, array.map(runRule),  TE.sequenceSeqArray))
)

const rules: Array<PullRequestValidationRule> = [];

const applyRule = (pr: PR, activities: Array<Activity>): TE.TaskEither<Error, Array<PullRequestCheckResult>> = {}

const checkPR = (pr: PR): TE.TaskEither<Error, KeyValue<number, Array<PullRequestCheckResult>>> => pipe(
    pr.id,//TODO: check if any rules are presented
    getPRActivities,
    TE.chain(_ => )
)

const checkPullRequests = <T extends { prs: Array<PR> }>(env: T): TE.TaskEither<Error, Map<number, ReadonlyArray<PullRequestCheckResult>>> =>
    pipe(
        env, 
        pick('prs'), 
        array.map(checkPR), 
        TE.sequenceSeqArray, 
        TE.chain(flow(mapConstructor, TE.fromEither))
    );

const updateDB = <T extends {results: Map<number, readonly PullRequestCheckResult[]>}>(env: T): TE.TaskEither<Error, void> => TE.tryCatch(() => {

    writeFileSync(DB, JSON.stringify(prs, null, 2), { encoding: 'utf8' });//TODO: db name to env

    writeDB(rpsToReview.map(_ => ([_.id, _.fromRef.latestCommit])));
    return Promise.resolve();
}, e => new Error(`Error happend on update DB, ${e}`))

const handleError = (error: Error): T.Task<string> =>
    () => Promise.resolve(`Error happends: ${error.message}`);

const handleResults = <T extends { prs: Array<PR> }>(env: T): T.Task<string> =>
    () => Promise.resolve(`SUCCESS PRs: ${env.prs.map(pick('id')).join('; ')} handled`);

const run = pipe(
    loadEnvironment(), //TODO: move configuration of rules/projects to JSON with a type schema
    TE.fromEither,
    TE.bind('token', getToken),
    TE.bind('db', getDB),
    TE.bind('targetVersions', getTargetVersions),//TODO think pf passing this only context to rule
    TE.bind('targets', getTargetVersion),
    TE.bind('prs', getPullRequests),
    //TODO: move here fallen-off TASKS handle for tasks
    TE.bind('results', checkPullRequests),
    TE.chainFirst(updateDB),//TODO: move saving in the end of check opened PRs pipeline
    TE.fold(handleError, handleResults),
)

axios.interceptors.request.use(request => {
    console.log('Starting Request', JSON.stringify(request, null, 2))
    return request
})


run().then(console.log);