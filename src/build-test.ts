import fetch from 'cross-fetch';
const configuration = 'RiaTeam_CiDeploymentsSpectraFX_SpectraFXDxTrade5PullRequestDesignReview';
const branch = 'feature/DXTF-29480-spectrafx-oe-tenor-date-input';

const run = async () => {
    const crftToken = await fetch('https://dxcity.in.devexperts.com/authenticationTest.html?csrf', {
        method: 'GET',
        headers: {
            Authorization: 'Bearer eyJ0eXAiOiAiVENWMiJ9.QWRjWkEydUlXRjNlSlhjY0VXTDh4SlRyWC1R.NjBhOGYzZDItODg2Yy00YzhhLWIwYmYtZTQyODY4MmZiYWI0',
            'Content-Type': 'application/json',
        },
    }).then(_ => _.text());

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
                "text": "Build for testing REST API"
            },
            properties: {
                property: [{
                    //"name": "teamcity.build.branch",
                    "name": "custom.build.branch",
                    "value": branch
                }
                ]
            }
        })
    }).then(_ => _.json());

    console.log('result', result.id, result.state, result.webUrl)
}

run();