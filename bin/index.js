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
import { confirm, input, select } from '@inquirer/prompts'
import {
  execAsync,
  removeTrailingNewline,
  fsRemoveProject,
  shRemoveProject,
  copyFile,
  removeFile,
  appendFile,
  getLocalFilePath,
  getShellFilePath,
  readFile,
  writeFile
} from '../src/util.js'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

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
  .action(async (appName, options) => {
    if (!checkAppName(appName)) return
    type = 'web'
    const basicPkgInfo = await getBasicPkgInfo()
    // const needAxios = await confirm({ message: 'use axios?', default: true })
    const useMicroFrontEnd = await confirm({ message: 'use micro front-end?', default: true })
    let microAppType
    let port
    if (useMicroFrontEnd) {
      microAppType = await select({
        message: 'Choose whether to create a main app or a sub app',
        choices: [
          {
            name: 'Main Application',
            value: 'main'
          },
          {
            name: 'Sub Application',
            value: 'sub'
          }
        ]
      })
      if (microAppType === 'sub') {
        port = await input({
          message: 'customize sub application devServe port',
          default: '7789'
        })
      }
    }
    // const config = { needAxios, microAppType, port, ...basicPkgInfo }
    const config = { microAppType, port, ...basicPkgInfo }
    createProject(config, options)
  })

// TODO
program
  .command('app')
  .description('Create a desktop application by tauri template')
  .argument('<app name>', 'project name')
  .action((appName, options) => {
    if (!checkAppName(appName)) return
    type = 'app'
    const config = {}

    createProject(config, options)
  })

program.parse(process.argv)

function createProject(config, options) {
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
  if (fs.existsSync(pathname)) {
    console.log(`Error: The directory ${chalk.redBright(pathname)} already exists`)
    return false
  } else {
    projectName = appName
    projectPath = pathname
    return true
  }
}

async function createWeb(config, options) {
  const pkg = fs.readJSONSync('./package.json')
  pkg.name = projectName
  pkg.description = config.description || 'A react app.'
  pkg.author = config.author || ''
  pkg.version = config.version || '0.0.1'
  pkg.keywords = []
  delete pkg.license
  if (config.needAxios) await useAxios(pkg)
  if (config.microAppType) await useMicroFrontEnd(config.microAppType, config.port, pkg)
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
      shRemoveProject(projectPath)
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

process.on('uncaughtException', function (err) {
  spinner.stop()
  fsRemoveProject(projectPath)
  console.log('Caught exception: ', err)
})

process.on('SIGINT', function () {
  spinner.stop()
  console.log('Received SIGINT signal. Exiting...')
  shRemoveProject(projectPath)
  process.exit(0)
})

async function getBasicPkgInfo() {
  const author = await input({ message: "what's your package author", default: '' })
  const version = await input({ message: "what's your package version", default: '0.0.1' })
  // const description = await input({ message: "what's your package description", default: '' })
  // ...
  return { author, version }
}

async function useMicroFrontEnd(appType, port, pkg) {
  if (appType === 'main') {
    const version = await execAsync('npm view @micro-zoe/micro-app version')
    pkg.dependencies['@micro-zoe/micro-app'] = removeTrailingNewline(`^${version}`)

    await removeFile(getShellFilePath('src', 'main.tsx'))
    await copyFile(
      path.join(__dirname, '../src/template/main/main.tsx'),
      getShellFilePath('src', 'main.tsx')
    )
    await removeFile(getShellFilePath('src', 'App.tsx'))
    await copyFile(
      path.join(__dirname, '../src/template/main/App.tsx'),
      getShellFilePath('src', 'App.tsx')
    )
    const microAppStyle = `
micro-app {
    height: 100%;
}
`
    await appendFile(getShellFilePath('src', 'style', 'preset.css'), microAppStyle)
  } else {
    const microAppDTS = `
interface Window {
    __MICRO_APP_BASE_ROUTE__: string
    unmount: () => void
    microApp: { dispatch: (data: { [key: string]: any }) => void }
}
`
    await removeFile(getShellFilePath('src', 'main.tsx'))
    await copyFile(
      getLocalFilePath('../src/template/sub/main.tsx'),
      getShellFilePath('src', 'main.tsx')
    )
    await removeFile(getShellFilePath('vite.config.ts'))
    await copyFile(
      getLocalFilePath('../src/template/sub/vite.config.ts'),
      getShellFilePath('vite.config.ts')
    )
    if (port) await changeSubAppPort(port)
    await appendFile(getShellFilePath('src', 'types', 'global.d.ts'), microAppDTS)
  }
}
async function useAxios(pkg) {
  const version = await execAsync('npm view axios version')
  pkg.dependencies.axios = removeTrailingNewline(`^${version}`)
}

async function changeSubAppPort(port) {
  const fileData = await readFile(getShellFilePath('vite.config.ts'))
  const newFileData = fileData.toString().replace('7789', port)
  writeFile(getShellFilePath('vite.config.ts'), newFileData)
}
