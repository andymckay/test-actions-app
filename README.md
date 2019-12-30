This is an example app that:
* updates a file in a repo
* explicitly creates a check suite for that file
* creates a check run for that suite
* re-requests that check run

To see what events get fired, to run it you will need to configure `.env`, have a valid `key.pem` and insure you've got an installed GitHub app in a repo so that the installation id is correct. That's a bit of a pain.

```
➜  actions-app-tester node index.js
Creating check suite and run in: andymckay/test-check-suite
Using server: https://api.github.com
Create or update file
Creating check suite
Creating check run
Created check run: https://github.com/andymckay/test-check-suite/runs/368191799
Check suite created for test-actions-events.
Re-requesting check suite 378939561
Ignoring check suite for travis-ci.
```
