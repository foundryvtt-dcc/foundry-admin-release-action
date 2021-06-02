// noinspection JSUnresolvedVariable,JSIgnoredPromiseFromCall

const core = require('@actions/core')
const fs = require('fs')
const github = require('@actions/github')
const puppeteer = require('puppeteer')

const actionToken = core.getInput('actionToken')
const foundryAdminUsername = core.getInput('foundryAdminUsername')
const foundryAdminPassword = core.getInput('foundryAdminPassword')
const foundryAdminPackageURL = core.getInput('foundryAdminPackageURL')
const manifestFileName = core.getInput('manifestFileName')
const octokit = github.getOctokit(actionToken)
const owner = github.context.payload.repository.owner.login
const repo = github.context.payload.repository.name

async function getReleaseInfo () {
  return await octokit.rest.repos.getLatestRelease({
    owner: owner,
    repo: repo,
  })
}

async function downloadManifest(latestRelease) {
  // Get the Asset ID of the manifest from the release info
  let assetID = 0
  for (const item of latestRelease.data.assets) {
    if (item.name === manifestFileName) {
      assetID = item.id
    }
  }
  if (assetID === 0) {
    console.log(latestRelease)
    core.setFailed('No AssetID for manifest')
  }

  const manifestURL = `https://api.github.com/repos/${owner}/${repo}/releases/assets/${assetID}`
  console.log(manifestURL)
  await shell.exec(`curl --header 'Authorization: token ${actionToken}' --header 'Accept: application/octet-stream' --output ${manifestFileName} --location ${manifestURL}`)
  console.log('Past Download')
}

async function updateFoundryAdmin (manifestURL, notesURL, compatVersion, minVersion, packageVersion) {
  // Initiate the Puppeteer browser
  const browser = await puppeteer.launch({headless: true, args: ['--no-sandbox']})
  const page = await browser.newPage()

  // Go to the Foundry Admin Django Page and wait for it to Load
  await page.goto(foundryAdminPackageURL, { waitUntil: 'networkidle0' })

  // Enter username / password and submit
  await page.type('#id_username', foundryAdminUsername)
  await page.type('#id_password', foundryAdminPassword)
  await page.click('#login-form > div.submit-row > input[type=submit]')

  // Wait for Foundry Page to Load
  await page.waitForNavigation()

  // Log new URL to troubleshoot that we made it through auth
  console.log('Package Page URL:', page.url())

  // Add new package version and save
  await page.type('table tr:nth-last-child(3) .field-version > input', packageVersion)
  await page.type('table tr:nth-last-child(3) .field-manifest > input', manifestURL)
  await page.type('table tr:nth-last-child(3) .field-notes > input', notesURL)
  await page.type('table tr:nth-last-child(3) .field-required_core_version > input', minVersion)
  await page.type('table tr:nth-last-child(3) .field-compatible_core_version > input', compatVersion)
  await page.click('#package_form > div > div.submit-row > input.default')

  // Close Puppeteer browser
  await browser.close()
}

async function run () {
  // Get values for release
  const latestRelease = await getReleaseInfo()
  const notesURL = latestRelease.data.html_url
  console.log(notesURL)
  downloadManifest = await downloadManifest(latestRelease)
  const manifestContent = fs.readFileSync(`./${manifestFileName}`)
  const manifest = JSON.parse(manifestContent.toString())
  const minVersion = manifest.minimumCoreVersion
  const compatVersion = manifest.compatibleCoreVersion
  const packageVersion = manifest.version ? manifest.version[0] !== "0" : manifest.version.substring(1)

  await updateFoundryAdmin(manifestURL, notesURL, compatVersion, minVersion, packageVersion)
}

run()