import { analyzePackages } from "./analyzePackages"
import { PackageInfos } from "../renderer/src/lib/types"

describe("analyzePackages", () => {
  it("should group packages by devRunner", async () => {
    const infos: PackageInfos = [
      {
        fullPath: "/xx/package.json",
        name: "root",
        scripts: {
          dev: "run dev",
          test: "run test",
        },
        devRunner: {
          expandNestedScripts: true,
          groups: {
            dev: {
              paths: ["/apps/**/*", "/packages/**/*"],
              script: ["dev", "test"],
            },
          },
        },
      },
      {
        fullPath: "/xx/apps/package.json",
        name: "app1",
        scripts: {
          dev: "run dev",
          test: "run test",
        },
      },
      {
        fullPath: "/xx/packages/package.json",
        name: "package1",
        scripts: {
          dev: "run dev",
          test: "run test",
        },
      },
    ]
    const rootFolderPath = "/xx"
    const { packages, groups } = await analyzePackages(infos, rootFolderPath)

    expect(packages).toEqual(infos)
    expect(groups).toMatchSnapshot()
  })
})
