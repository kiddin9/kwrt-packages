#r "nuget: SSH.NET, 2024.1.0"

open Renci.SshNet
open System.Text.Json
open System.IO
open System.Runtime.CompilerServices

type ConnectionInfo =
    { Host: string
      Port: int
      Password: string }

let configFile = Path.Combine(__SOURCE_DIRECTORY__, "connection.json")

let readConnectionInfo () =
    let json = System.IO.File.ReadAllText configFile
    JsonSerializer.Deserialize<ConnectionInfo>(json)

let saveConnectionInfo (info: ConnectionInfo) =
    let json =
        JsonSerializer.Serialize(info, JsonSerializerOptions(WriteIndented = true))

    File.WriteAllText(configFile, json)


let connectionInfo =
    match File.Exists configFile with
    | true -> readConnectionInfo ()
    | false ->
        { Host = "localhost"
          Port = 22
          Password = "password" }

saveConnectionInfo connectionInfo

let client =
    new SshClient(connectionInfo.Host, connectionInfo.Port, "root", connectionInfo.Password)

let sftp =
    new SftpClient(connectionInfo.Host, connectionInfo.Port, "root", connectionInfo.Password)

let upload (localPath: string) (remotePath: string) =
    use fs = File.Open(localPath, FileMode.Open)
    sftp.UploadFile(fs, remotePath)
    sftp.SetLastWriteTime(remotePath, File.GetLastWriteTime(localPath))
    fs.Close()


let download (remotePath: string) (localPath: string) =
    use fs = File.OpenWrite(localPath)
    sftp.DownloadFile(remotePath, fs)
    File.SetLastWriteTime(localPath, sftp.GetLastWriteTime(remotePath))
    fs.Close()

let exists (path: string) = sftp.Exists(path)

let sh cmd = client.RunCommand(cmd).Result

printfn "Connecting to %s" connectionInfo.Host
client.Connect()
sftp.Connect()
printfn "Connected to %s" connectionInfo.Host

let root = Path.Combine(__SOURCE_DIRECTORY__ |> Path.GetDirectoryName, "files")
printfn "Root: %s" root

[<MethodImpl(MethodImplOptions.Synchronized)>]
let doSync withDownload =
    let files = Directory.GetFiles(root, "*", SearchOption.AllDirectories)

    for file in files do
        let remotePath =
            Path.GetRelativePath(root, file) |> (fun x -> "/" + x.Replace("\\", "/"))

        if not (exists remotePath) then
            printfn "Uploading %s" remotePath
            upload file remotePath
        else
            let remoteTime = sftp.GetLastWriteTime(remotePath)
            let localTime = File.GetLastWriteTime(file)
            let diff = (remoteTime - localTime).Seconds
            // printfn "File %s: %A" remotePath diff
            if diff = 0 then
                () // printfn "Skipping %s" remotePath
            elif diff < 0 then
                printfn "Updating %s" remotePath
                upload file remotePath
            else if withDownload then
                if remotePath <> "/etc/config/nbtverify" then
                    printfn "Downloading %s" remotePath
                    download remotePath file

let args = System.Environment.GetCommandLineArgs()

if args.Length > 2 then
    let cmd = args.[2]
    printfn "Executing command: %s" cmd

    match cmd with
    | "watch" ->
        doSync false
        let watcher = new FileSystemWatcher(root)
        watcher.EnableRaisingEvents <- true
        watcher.IncludeSubdirectories <- true

        let rec update () =

            System.Threading.Tasks.Task
                .Delay(200)
                .ContinueWith(fun _ -> task {
                    try
                        doSync false
                    with ex ->
                        printfn "Error: %s" ex.Message
                        update ()
                })
            |> ignore


        watcher.Changed.Add(fun _ -> update ())
        watcher.Created.Add(fun _ -> update ())
        watcher.Deleted.Add(fun _ -> update ())
        watcher.Renamed.Add(fun _ -> update ())

        System.Threading.Thread.Sleep(System.Threading.Timeout.Infinite)
    | "task" ->
        while true do
            System.Threading.Thread.Sleep(1000)
            doSync true
    | _ -> printfn "Unknown command: %s" cmd


doSync true
