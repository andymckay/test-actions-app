require("dotenv").config();
const fs = require("fs");
const { promisify } = require("util");
const readFile = promisify(fs.readFile);
const { App } = require("@octokit/app");
const Octokit = require("@octokit/rest");


async function authenticate(server) {
    let app = new App({
        id: process.env.APP_ID,
        privateKey: await readFile(process.env.PRIVATE_KEY_PATH),
        baseUrl: server
    });

    let installationAccessToken = await app.getInstallationAccessToken({
        installationId: process.env.INSTALLATION_ID
    });

    let octokit = new Octokit({
        auth: `token ${installationAccessToken}`,
        baseUrl: process.env.SERVER
    });
    return octokit;
}

async function main() {
    let owner = process.env.OWNER;
    let repo = process.env.REPO;
    console.log(`Creating check suite and run in: ${owner}/${repo}`);
    console.log(`Using server: ${process.env.SERVER}`)
    let octokit = await authenticate(process.env.SERVER);
    console.log('Create or update file');
    let message = `Update from ${new Date()}`;
    let sha = '';
    try {
        let file = await octokit.repos.getContents({
            owner,
            repo,
            path: "actions-app-tester.md"
        })
        sha = file.data.sha;
    } catch (err) {
        if (err.name !== 'HttpError') {
            throw(err)
        }
    }
    let create = await octokit.repos.createOrUpdateFile({
        owner,
        repo,
        path: "actions-app-tester.md",
        message: "From actions-app-tester",
        content: Buffer.from(message).toString('base64'),
        sha: sha
    })
    let newSha = create.data.commit.sha;
    console.log('Creating check suite');
    let suite = await octokit.checks.createSuite({
        owner,
        repo,
        head_sha: newSha
    })
    console.log('Creating check run');
    let run = await octokit.checks.create({
        owner,
        repo,
        name: "test-from-actions-app-tester",
        head_sha: newSha
    })
    console.log(`Created check run: ${run.data.html_url}`)
    let suites = await octokit.checks.listSuitesForRef({
        owner,
        repo,
        ref: newSha
    })
    for (let suite of suites.data.check_suites) {
        if (suite.app.slug === 'test-actions-events') {
            console.log(`Check suite created for ${suite.app.slug}.`)
            console.log(`Re-requesting check suite ${suite.id}`);
            let rerequest = await octokit.checks.rerequestSuite({
                owner,
                repo,
                check_suite_id: suite.id
            })
        } else {
            console.log(`Ignoring check suite for ${suite.app.slug}.`)
        }
    }

}

main();