#!/bin/bash

CSRF=$(curl https://dxcity.in.devexperts.com/authenticationTest.html?csrf --header "Authorization: Bearer eyJ0eXAiOiAiVENWMiJ9.QWRjWkEydUlXRjNlSlhjY0VXTDh4SlRyWC1R.NjBhOGYzZDItODg2Yy00YzhhLWIwYmYtZTQyODY4MmZiYWI0")

echo "$CSRF"

RES=$(curl -X POST https://dxcity.in.devexperts.com/app/rest/buildQueue --header "Authorization: Bearer eyJ0eXAiOiAiVENWMiJ9.QWRjWkEydUlXRjNlSlhjY0VXTDh4SlRyWC1R.NjBhOGYzZDItODg2Yy00YzhhLWIwYmYtZTQyODY4MmZiYWI0" --header "X-TC-CSRF-Token: $CSRF" --header "Content-Type: application/json" -d '{"buildType":{"id":"SpiderRock_ChangeSetValidation"},"properties":{"property":[{"name":"teamcity.build.branch","value":"bugfix/SRA-2237-work-queue-bubble-opened-wq-bubble-persists-if-the-user-navigates-to-the-proposals"}]}}')

echo "$RES" > result.txt