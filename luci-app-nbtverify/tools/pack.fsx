#r "nuget: SharpCompress, 0.38.0"
#r "nuget: Octokit, 13.0.1"
#r "nuget: CommandLineParser.FSharp, 2.9.1"
#load "./github_release.fsx"
open System.IO
open SharpCompress.Writers.Tar
open SharpCompress.Readers.Tar
open SharpCompress.Common
open System
open CommandLine
open System.Collections.Generic
let mutable version = "1.0"
[<CLIMutable>]
type options =
    { [<Option('v', "version", Required = false, HelpText = "Version")>]
      version: string }
let argv =
    Environment.GetCommandLineArgs()
    |> Array.skip 1
    |> Array.skipWhile (fun x -> x.EndsWith(".fsx"))
printfn "Args: %A" argv
let result = CommandLine.Parser.Default.ParseArguments<options>(argv)
let run (o: options) =
    printfn "Parser success"
    if o.version |> System.String.IsNullOrWhiteSpace then
        printfn "Version not provided"
    else
        version <- o.version.TrimStart('v')
    printfn "version = %s" version
let fail (e: IEnumerable<Error>) = failwithf "Parser failed with %A" e
match result with
| :? Parsed<options> as parsed -> run parsed.Value
| :? NotParsed<options> as notParsed -> fail notParsed.Errors
| _ -> ()

let toUnixRelativePath root file =
    "./"
    + Path.GetRelativePath(root, file).Replace(Path.DirectorySeparatorChar, '/')
let createTarGz output root files (replacements: Collections.Generic.IDictionary<string, byte[]>) =
    use writer = new TarWriter(output, TarWriterOptions(CompressionType.GZip, true))
    let fixPath = toUnixRelativePath root
    List.sum
        [ for file in files do
              let relativePath = fixPath file
              let find, data = replacements.TryGetValue(relativePath)
              if find then
                //   printfn "Replacing %s" relativePath
                  use newStream = new MemoryStream(data)
                  writer.Write(relativePath, newStream, DateTime.Now)
                  data.LongLength
              else
                //   printfn "Packing %s" relativePath
                  let fileInfo = FileInfo(file)
                  use fileStream = fileInfo.OpenRead()
                  writer.Write(relativePath, fileStream, fileInfo.LastWriteTime)
                  fileInfo.Length ]
let git = Path.GetDirectoryName(__SOURCE_DIRECTORY__)

let tarFiles stream root replacements =
    createTarGz
        stream
        (Path.GetFullPath(root))
        (Directory.EnumerateFiles(root, "*", SearchOption.AllDirectories))
        replacements
let toBytes (s: string) =
    s
    |> _.Trim()
    |> _.Replace("\r", "")
    |> fun x -> x + "\n" |> Text.Encoding.UTF8.GetBytes
let pack bin arch outputFile =
    use data = new MemoryStream()
    let installSize =
        dict [ "./usr/bin/nbtverify", bin ]
        |> tarFiles data (Path.Combine(git, "files"))
    use control = new MemoryStream()
    [ "./control",
      $"""
Package: luci-app-nbtverify
Version: {version}
Depends: luci-compat
Source: https://github.com/nbtca/luci-app-nbtverify
SourceName: luci-app-nbtverify
License: GPL-2.0
Section: luci
SourceDateEpoch: {DateTimeOffset.Now.ToUnixTimeSeconds()}
Maintainer: nbtca <https://github.com/nbtca>
Architecture: {arch}
Description:  LuCI Support for nbtverify
Installed-Size: {installSize}
    """
      |> toBytes ]
    |> dict
    |> tarFiles control (Path.Combine(git, "control"))
    |> ignore
    use output = File.Create(outputFile)
    use writer = new TarWriter(output, TarWriterOptions(CompressionType.GZip, true))
    use info = new MemoryStream(Text.Encoding.UTF8.GetBytes("2.0\n"))
    writer.Write("./debian-binary", info, DateTime.Now)
    data.Position <- 0L
    writer.Write("./data.tar.gz", data, DateTime.Now)
    control.Position <- 0L
    writer.Write("./control.tar.gz", control, DateTime.Now)
    printfn "Package created at %s" outputFile
// pack ("x86_64")
let fetchReleaseFiles () = task {
    let! files = Github_release.fetchReleaseFiles "nbtca" "nbtverify"
    return
        files
        |> List.filter (fun (fileName, _, _) -> fileName.EndsWith ".tar.gz")
        |> List.map (fun (_, _, filePath) ->
            let info =
                filePath
                |> Path.GetFileNameWithoutExtension
                |> _.Split([| "_"; "." |], StringSplitOptions.RemoveEmptyEntries)
            let system = info[1]
            let arch = info[2]
            (filePath, system, arch))
        |> List.filter (fun (_, system, _) -> system = "linux")
        |> List.map (fun (filePath, _, arch) -> (filePath, arch))
}
let files = fetchReleaseFiles () |> Async.AwaitTask |> Async.RunSynchronously
//ref https://openwrt.org/docs/techref/targets/start
let openwrtArchMap =
    dict
        [ "386", [ "i386_pentium4" ]
          "amd64", [ "x86_64" ]
          "arm",
          [ "arm_cortex-a9"
            "arm_arm1176jzf-s_vfp"
            "arm_arm926ej-s"
            "arm_cortex-a15_neon-vfpv4"
            "arm_cortex-a5_vfpv4"
            "arm_cortex-a7"
            "arm_cortex-a7_neon-vfpv4"
            "arm_cortex-a7_vfpv4"
            "arm_cortex-a8_vfpv3"
            "arm_cortex-a9"
            "arm_cortex-a9_neon"
            "arm_cortex-a9_vfpv3-d16"
            "arm_fa526"
            "arm_mpcore"
            "arm_xscale" ]
          "arm64",
          [ "aarch64_generic"
            "aarch64_cortex-a53"
            "aarch64_cortex-a72"
            "aarch64_cortex-a76" ]
          "mips64", [ "mips64_mips64" ]
          "mips64le", [ "mips64el_mips64" ]
          "mipsle", [ "mipsel_mips32"; "mipsel_24kc"; "mipsel_74kc" ]
          "mips", [ "mips_mips32"; "mips_24kc"; "mips_4kec" ]
          //  "riscv64",""
          ]
let unpack tarFile =
    use stream = File.OpenRead(tarFile)
    use reader = TarReader.Open(stream)
    //extract only nbtverify__darwin_arm64\nbtverify
    use memoryStream = new MemoryStream()
    while reader.MoveToNextEntry() do
        let entry = reader.Entry
        if entry.IsDirectory |> not then
            let path = entry.Key
            let filename = path |> Path.GetFileName
            if filename = "nbtverify" then
                // printfn "Extracting %s" filename
                reader.WriteEntryTo(memoryStream)
    memoryStream.ToArray()
let dist = Path.Combine(git, "dist")
Directory.CreateDirectory(dist) |> ignore
for filePath, arch in files do
    let exists, targets = openwrtArchMap.TryGetValue(arch)
    if exists then
        for target in targets do
            let outputFile = Path.Combine(dist, $"luci-app-nbtverify_{arch}_{target}.ipk")
            pack (filePath |> unpack) target outputFile
            printfn "Packing %A" target
    else
        printfn "Arch %A not supported" arch
