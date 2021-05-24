const core = require('@actions/core')
const github = require('@actions/github')
const puppeteer = require('puppeteer')

const foundryAdminUsername = core.getInput('foundryAdminUsername')
const foundryAdminPassword = core.getInput('foundryAdminPassword')
const foundryAdminPackageURL = core.getInput('foundryAdminPackageURL')

async function run () {
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
  await page.type('table tr:nth-last-child(3) .field-manifest > input', 'https://github.com/foundryvtt-dcc/dcc/releases/download/v0.28.0/system.json')
  await page.type('table tr:nth-last-child(3) .field-notes > input', 'https://github.com/foundryvtt-dcc/dcc/releases/tag/v0.28.0')
  await page.type('table tr:nth-last-child(3) .field-required_core_version > input', '0.7.9')
  await page.type('table tr:nth-last-child(3) .field-compatible_core_version > input', '0.7.9')
  await page.click('#package_form > div > div.submit-row > input.default')

  // Close Puppeteer browser
  await browser.close()
}