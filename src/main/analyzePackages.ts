import {
  zDevRunnerConfig,
  type PackageInfos,
  DevRunnerGroups,
  PackageInfo,
  DevRunnerGroupLine,
} from "../renderer/src/lib/types"
import { minimatch } from "minimatch"

export async function analyzePackages(
  infos: PackageInfos,
  rootFolderPath: string,
): Promise<{
  packages: PackageInfos
  groups: DevRunnerGroups
}> {
  const groups = {} as DevRunnerGroups

  // find devRunner in all packages
  infos.forEach((info) => {
    const devRunner = info.devRunner
    if (devRunner) {
      const options = zDevRunnerConfig.parse(devRunner)

      const defaultNestedScriptsDelimiter = {
        delimiter: ":",
        includeRoots: false,
      }
      const expandNestedScripts =
        options.expandNestedScripts == undefined || options.expandNestedScripts === false
          ? null
          : options.expandNestedScripts === true
          ? defaultNestedScriptsDelimiter
          : {
              ...defaultNestedScriptsDelimiter,
              ...options.expandNestedScripts,
            }

      Object.entries(options.groups).forEach(([groupKey, groupOptions]) => {
        const matchedPackageJsons: PackageInfo[] = []
        const fileGlobs = Array.isArray(groupOptions.paths)
          ? groupOptions.paths
          : [groupOptions.paths]
        fileGlobs.forEach((glob) => {
          infos.forEach((infoToMatch) => {
            const pathInProject = infoToMatch.fullPath.replace(rootFolderPath, "")

            if (minimatch(pathInProject, glob)) {
              matchedPackageJsons.push(infoToMatch)
            }
          })
        })

        const foundScripts: DevRunnerGroupLine[] = []
        const scriptGlobs = Array.isArray(groupOptions.script)
          ? groupOptions.script
          : [groupOptions.script]
        Object.entries(matchedPackageJsons).forEach(([_, foundPackage]) => {
          let matchedScripts: { [name: string]: string } = {}
          const scriptsThatAreNested: { [name: string]: string } = {}
          Object.entries(foundPackage.scripts).forEach(([scriptName, script]) => {
            let nameToMatch = scriptName
            if (expandNestedScripts && scriptName.includes(expandNestedScripts.delimiter)) {
              nameToMatch = scriptName.split(expandNestedScripts.delimiter)[0]
              scriptsThatAreNested[nameToMatch] = script
            }
            scriptGlobs.forEach((glob) => {
              if (minimatch(nameToMatch, glob)) {
                matchedScripts[scriptName] = script
              }
            })
          })

          if (expandNestedScripts && expandNestedScripts.includeRoots) {
            matchedScripts = Object.fromEntries(
              Object.entries(matchedScripts).filter(([name]) => {
                return !scriptsThatAreNested[name]
              }),
            )
          }
          const matchedScriptsKeys = Object.keys(matchedScripts)
          if (matchedScriptsKeys.length > 0) {
            foundScripts.push({
              packageName: foundPackage.name,
              scripts: matchedScripts,
              fullPath: foundPackage.fullPath,
            })
          }
        })

        if (foundScripts.length > 0) {
          if (groups[groupKey]) {
            groups[groupKey].push(...foundScripts)
          } else {
            groups[groupKey] = foundScripts
          }
        }
      })
    }
  })

  return {
    packages: infos,
    groups,
  }
}
