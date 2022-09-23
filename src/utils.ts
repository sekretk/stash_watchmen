import * as E from 'fp-ts/lib/Either'
import { KeyValue } from './contract';

export const toFullBranchId = (version: string) => `refs/heads/release/${version}`;

export const pick = <T, K extends keyof T>(key: K) => (item: T) => item[key];

export const mapConstructor = <K, T>(values: ReadonlyArray<KeyValue<K,T>>): E.Either<Error, Map<K, T>> => {
    if (new Set(values.map(([key]) => key)).size !== values.length) {
        return E.left(new Error(`Map construction argument have non-unique key`));
    }

    return E.right<Error, Map<K, T>>(new Map(values));
}