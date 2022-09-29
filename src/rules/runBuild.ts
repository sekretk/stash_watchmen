import { PR, Rule } from "../contract";
import fetch from 'cross-fetch';

const configuration = 'RiaTeam_CiDeploymentsSpectraFX_SpectraFXDxTrade5PullRequestDesignReview';

const withOnlyMy = (cBack: Rule['check']) => (pr: PR, payload: any) => {
    if (!Boolean(pr.reviewers.find(_ => _.user.name === process.env.user))) {
        return Promise.resolve(undefined);
    }

    return (cBack(pr, payload));
}

// const withPersistance = <T>(cBack:    Rule['check']<T>) => (pr: PR, payload: any) => {
//     const parsedPayload: T = payload as T;
// }

// const withConfig

// const withComment        

// const withOneActivityTrace

// const withOnceRun

export const runDesignReviewBuild: Rule = {
    name: 'DESIGN_REVIEW_BUILD',
    applience: 'replace',
    check: async (pr: PR, payload) => {

        if (!Boolean(pr.reviewers.find(_ => _.user.name === process.env.user))) {
            return Promise.resolve(undefined);
        }

        const prevState = (typeof payload?.commit === 'string' && typeof payload?.build === 'number') ? { commit: payload.commit, build: payload.build } : undefined;

        const crftToken = await fetch('https://dxcity.in.devexperts.com/authenticationTest.html?csrf', {
            method: 'GET',
            headers: {
                Authorization: 'Bearer eyJ0eXAiOiAiVENWMiJ9.QWRjWkEydUlXRjNlSlhjY0VXTDh4SlRyWC1R.NjBhOGYzZDItODg2Yy00YzhhLWIwYmYtZTQyODY4MmZiYWI0',
                'Content-Type': 'application/json',
            },
        }).then(_ => _.text());

        const needANewBuild = !Boolean(prevState) || prevState?.commit !== pr.fromRef.latestCommit;

        console.log(needANewBuild, pr.id, pr.fromRef.latestCommit, payload);

        if (needANewBuild) {

            const result = await fetch('https://dxcity.in.devexperts.com/app/rest/buildQueue', {
                method: 'POST',
                headers: {
                    Authorization: 'Bearer eyJ0eXAiOiAiVENWMiJ9.QWRjWkEydUlXRjNlSlhjY0VXTDh4SlRyWC1R.NjBhOGYzZDItODg2Yy00YzhhLWIwYmYtZTQyODY4MmZiYWI0',
                    'Content-Type': 'application/json',
                    "X-TC-CSRF-Token": crftToken,
                    "Accept": "application/json"

                },
                body: JSON.stringify({
                    buildType: { id: configuration },
                    comment: {
                        "text": "Running build for new changes in PR for build design review"
                    },
                    properties: {
                        property: [{
                            //"name": "teamcity.build.branch",
                            "name": "custom.build.branch",
                            "value": pr.fromRef.displayId
                        }
                        ]
                    }
                })
            }).then(_ => _.json());

            return Promise.resolve({
                text: `Build link: [here](${result.webUrl}), Status: ${result.state}, State: ${result.state}`,
                force: false,
                payload: {
                    commit: pr.fromRef.latestCommit,
                    build: result.id
                }
            });
        }

        if (prevState && prevState.commit === pr.fromRef.latestCommit) {

            const result = await fetch('https://dxcity.in.devexperts.com/app/rest/buildQueue/' + prevState.build, {
                method: 'GET',
                headers: {
                    Authorization: 'Bearer eyJ0eXAiOiAiVENWMiJ9.QWRjWkEydUlXRjNlSlhjY0VXTDh4SlRyWC1R.NjBhOGYzZDItODg2Yy00YzhhLWIwYmYtZTQyODY4MmZiYWI0',
                    'Content-Type': 'application/json',
                    "X-TC-CSRF-Token": crftToken,
                    "Accept": "application/json"

                }
            }).then(_ => _.json());

            const text = (result.status === 'SUCCESS' && result.state === 'finished') 
            ? `[Build link](https://dxcity.in.devexperts.com/repository/download/${result.buildTypeId}/${result.id}:id/dist.zip!/storybook/index.html)`
            : `Build link: [here](${result.webUrl}), Status: ${result.status}, State: ${result.state}`;

            return Promise.resolve({
                text,
                force: false,
                payload: {
                    commit: pr.fromRef.latestCommit,
                    build: result.id
                }
            });
        }
    }
}