#!/usr/bin/env node
import { program } from 'commander'
import validateNpmPkgName from 'validate-npm-package-name'
import sh from 'shelljs'
import fs from 'fs-extra'
import chalk from 'chalk'
import ora from 'ora'
import figlet from 'figlet'
import path from 'path'
import { exec } from 'child_process'

const spinner = ora()
const pkg = fs.readJSONSync(new URL('../package.json', import.meta.url))

program.name('mk')
program.usage(`${chalk.greenBright('<command>')} ${chalk.yellowBright('[options]')}`)
program.version(`v${pkg.version}`, '-v,--version')

let type
let projectName
let projectPath

program
  .command('web')
  .description('Create a web app by vite-template-lite')
  .argument('<app name>', 'project name')
  .action((appName, options) => {
    type = 'web'
    const config = {}
    createProject(appName, config, options)
  })

// TODO
program
  .command('app')
  .description('Create a desktop application by tauri template')
  .argument('<app name>', 'project name')
  .action((appName, options) => {
    type = 'app'
    const config = {}
    createProject(appName, config, options)
  })

program.parse(process.argv)

function createProject(appName, config, options) {
  checkAppName(appName)
  if (!projectPath) return
  createRootDir()
  downloadTemplate(
    type === 'web'
      ? async () => await createWeb(config, options)
      : async () => await createApp(config, options)
  )
}

function checkAppName(appName) {
  const { validForNewPackages: isNpmPkgNameOk, errors } = validateNpmPkgName(appName)
  if (!isNpmPkgNameOk) {
    console.log(`Error: ${chalk.redBright(errors[0])}`)
    return false
  }
  const pathname = path.join(process.cwd(), appName)
  const targetPathOk = fs.pathExistsSync(pathname)
  if (targetPathOk) {
    console.log(`Error: The directory ${chalk.redBright(pathname)} already exists`)
    return false
  } else {
    projectName = appName
    projectPath = pathname
  }
}

async function createWeb(confg, options) {
  const pkg = fs.readJSONSync('./package.json')
  pkg.name = projectName
  pkg.description = ''
  pkg.author = ''
  pkg.version = ''
  pkg.keywords = []
  delete pkg.license
  await fs.outputFile(path.join(process.cwd(), 'package.json'), JSON.stringify(pkg, null, 4))
}

// TODO
async function createApp(config, options) {}

function createRootDir() {
  sh.mkdir(projectPath) && sh.cd(projectPath)
}
function downloadTemplate(callback) {
  if (!sh.which('git')) {
    sh.echo('Sorry, please install git first')
    sh.exit(1)
  }
  const webTemplate = 'https://github.com/yokiizx/vite-react-lite.git'
  const appTemplate = '' // TODO
  const template = type === 'web' ? webTemplate : appTemplate

  const downloadScript = `git clone --single-branch --branch main ${template} .`

  spinner.start('Project is initializing...')
  exec(downloadScript, async (error, stdout) => {
    if (error) {
      console.log(`\n\n${chalk.redBright('download template failed:')} \n`)
      spinner.stop()
      console.log(error)
      shRemoveProject()
    } else {
      exec('rm -rf .git && git init')
      spinner.succeed('The template was downloaded successfully')
      await callback()
      sayHi()
    }
  })
}

function sayHi() {
  console.log(`\n--------------------------------------\n`)
  spinner.succeed('The project is initialized successfully')
  console.log(figlet.textSync("let's do it"))
  console.log(`cd ${chalk.greenBright(projectName)}`)
  console.log(`pnpm i`)
  console.log(`pnpm run dev\n`)
}

function fsRemoveProject() {
  fs.rm(projectPath, { recursive: true, force: true })
}
function shRemoveProject() {
  sh.rm('-rf', [projectPath])
}

process.on('uncaughtException', function (err) {
  spinner.stop()
  fsRemoveProject()
  console.log('Caught exception: ', err)
})

process.on('SIGINT', function () {
  spinner.stop()
  console.log('Received SIGINT signal. Exiting...')
  shRemoveProject()
  process.exit(0)
})
