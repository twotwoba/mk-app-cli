import sh from 'shelljs'
import fs from 'fs-extra'
import path from 'path'

export function execAsync(cmd, opts = {}) {
  return new Promise(function (resolve, reject) {
    sh.exec(cmd, opts, function (code, stdout, stderr) {
      if (code !== 0) {
        reject(new Error(stderr))
      } else {
        resolve(stdout)
      }
    })
  })
}

export function removeTrailingNewline(str) {
  return str.replace(/\n$/, '')
}

// fs-extra remove file
export function fsRemoveProject(projectPath) {
  fs.rm(projectPath, { recursive: true, force: true })
}

// shell remove file
export function shRemoveProject(projectPath) {
  sh.rm('-rf', [projectPath])
}

// get local file path. In workspace.
export function getLocalFilePath(path) {
  return new URL(path, import.meta.url).toString().slice(7)
}
// get current file path. In shell.
export function getShellFilePath(...paths) {
  return path.join(process.cwd(), ...paths)
}

// append data
export async function appendFile(path, data) {
  try {
    await fs.outputFile(path, data, { flag: 'a' })
  } catch (err) {
    console.error(err)
  }
}
// write data
export async function writeFile(path, data) {
  try {
    await fs.outputFile(path, data, { flag: 'w' })
  } catch (err) {
    console.error(err)
  }
}
// delete file or directory
export async function removeFile(path) {
  try {
    await fs.remove(path)
  } catch (err) {
    console.error(err)
  }
}
// read data
export async function readFile(path) {
  try {
    const data = await fs.readFile(path)
    return data
  } catch (error) {
    console.error(error)
  }
}
// copy file
export async function copyFile(source, target) {
  try {
    await fs.copy(source, target)
  } catch (err) {
    console.error(err)
  }
}
