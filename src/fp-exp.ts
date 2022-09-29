import { array, boolean, either, readonlyArray } from "fp-ts";
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
const t_01 = async () => {
    console.log('XXX');
    return 123;
}

const tsk = TE.tryCatch(t_01 , () => 'error');
const tsk2 = TE.tryCatch(async () => {
    console.log('YYY');
    return 123;
}, () => 'error');

const doStuff = (str: string) => TE.of('X_'+str);

pipe(
    [tsk, tsk, tsk2] as const,
    TE.sequenceSeqArray, 
    TE.map(([t1, t2]) => t1 + t2),
    // array.map(doStuff), 
    //     TE.sequenceSeqArray, 
    //     TE.chain(flow(mapConstructor, TE.fromEither))
)().then(_ => console.log('XRES:', + _))