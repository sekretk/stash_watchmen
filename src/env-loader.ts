import dotenv from 'dotenv';
import * as TE from 'fp-ts/lib/TaskEither'
import * as E from 'fp-ts/lib/Either'
import { flow, FunctionN } from 'fp-ts/lib/function';
import { TaskEither } from 'fp-ts/lib/TaskEither';

import { ValidationError } from 'io-ts';
import { Environment, EnvironmentDecoder } from './contract';
import { pick } from './utils';

export const loadEnvironment: FunctionN<[], E.Either<Error, Environment>> =
flow(
    dotenv.config,
    pick('parsed'),
    E.fromNullable(new Array<ValidationError>()),
    E.chain(EnvironmentDecoder.decode),
    E.mapLeft(_ => new Error('Unable to parse environmental variables')),
)