import fs from "fs"
import fsPromise from "fs/promises"
import path from "path"
import { nonNullable } from "../renderer/src/lib/nonNullable"
import { zPackageJson } from "../renderer/src/lib/types"
import type { PackageInfo, PackageInfos } from "../renderer/src/lib/types"

export async function findPackages(rootDir: string): Promise<PackageInfos> {
  const packageJsonsPaths = [] as string[]
  function findPackageJsonFiles(dir: string) {
    const contents = fs.readdirSync(dir, { withFileTypes: true })

    contents.forEach((item) => {
      const fullPath = path.join(dir, item.name)

      if (item.isDirectory()) {
        if (item.name === "node_modules") {
          return
        }

        // If item is a directory, recursively search inside it
        findPackageJsonFiles(fullPath)
      } else if (item.name === "package.json") {
        // If item is a file named package.json, log its full path
        packageJsonsPaths.push(fullPath)
      }
    })
  }

  // Start the search from the current directory
  findPackageJsonFiles(rootDir)

  const promises = packageJsonsPaths.map(async (packageJsonPath): Promise<PackageInfo | null> => {
    try {
      const packageJson = JSON.parse(await fsPromise.readFile(packageJsonPath, "utf8"))
      if (packageJson.name && packageJson.scripts) {
        return {
          ...zPackageJson.parse(packageJson),
          fullPath: packageJsonPath,
        }
      }
    } catch (e) {
      console.error("Error parsing package.json", packageJsonPath, e)
    }
    return null
  })

  return (await Promise.all(promises)).filter(nonNullable)
}
