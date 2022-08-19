import { token } from "./utility";
import fetch from 'cross-fetch';

export const get = <T>(url: string) => fetch(url, {
    method: 'GET',
    headers: {
        Authorization: 'Basic ' + token,
        'Content-Type': 'application/json',
    },
}).then(_ => _.json() as unknown as T);

export const put = (url: string, payload: any) => fetch(url, {
    method: 'PUT',
    body: JSON.stringify(payload),
    headers: {
        Authorization: 'Basic ' + token,
        'Content-Type': 'application/json',
    },
});

export const del = (url: string) => fetch(url, {
    method: 'DELETE',
    headers: {
        Authorization: 'Basic ' + token,
        'Content-Type': 'application/json',
    },
});

export const post = (url: string, payload: any) => fetch(url, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
        Authorization: 'Basic ' + token,
        'Content-Type': 'application/json',
    },
})