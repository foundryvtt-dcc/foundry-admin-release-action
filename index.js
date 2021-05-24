const core = require('@actions/core')
const download = require('download')
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

async function updateFoundryAdmin (manifestURL, notesURL, compatVersion, minVersion) {
  // Initiate the Puppeteer browser
  const browser = await puppeteer.launch()
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
  await page.type('table tr:nth-last-child(3) .field-version > input', '0.28')
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
  console.log(latestRelease)
  const manifestURL = `https://github.com/${owner}/${repo}/releases/download/${latestRelease.data.tag_name}/${manifestFileName}`
  await download(manifestURL, `./${manifestFileName}`)
  const manifestContent = fs.readFileSync(`./${manifestFileName}`)
  const manifest = JSON.parse(manifestContent.toString())
  console.log(manifest.minimumCoreVersion)
  console.log(manifest.compatibleCoreVersion)
  console.log(manifest.manifest)

  // await updateFoundryAdmin(manifestURL, notesURL, compatVersion, minVersion)
}

run()