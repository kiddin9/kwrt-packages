#r "nuget: Octokit, 13.0.1"
#r "nuget: Downloader, 3.2.0"
open Downloader
open System.IO
let client = new Octokit.GitHubClient(new Octokit.ProductHeaderValue("nbtca"))
let download (url: string) (saveTo: string) onProgress =
    let downloadOpt =
        new DownloadConfiguration(
            ChunkCount = 1, // file parts to download, the default value is 1
            ParallelDownload = true // download parts of the file as parallel or not. The default value is false
        )
    let service = new DownloadService(downloadOpt)
    service.DownloadProgressChanged.AddHandler(fun _ e -> onProgress e)
    service.DownloadFileTaskAsync(url, saveTo, Unchecked.defaultof<System.Threading.CancellationToken>)
let formatByteSize (size: int64) =
    let rec formatSize size suffixes =
        match size, suffixes with
        | size, [] -> size, ""
        | size, suffix :: suffixes ->
            if size < 1024.0 then
                size, suffix
            else
                formatSize (size / 1024.0) suffixes
    let size, suffix =
        formatSize (float size) [ "B"; "KB"; "MB"; "GB"; "TB"; "PB"; "EB"; "ZB"; "YB" ]
    sprintf "%0.2f %s" size suffix
// let downloadItem()=
let fetchReleaseFiles owner repo = task {
    printfn "Fetching latest release for %s/%s" owner repo
    let! info = client.Repository.Release.GetLatest(owner, repo)
    let assets = info.Assets
    let rootDownload =
        Path.Combine(__SOURCE_DIRECTORY__ |> Path.GetDirectoryName, "downloads")
    printfn "Downloading %s" info.TagName
    let downloadDir = Path.Combine(rootDownload, info.TagName)
    Directory.CreateDirectory(downloadDir) |> ignore
    let files =
        [ for asset in assets do
              let downloadUrl = asset.BrowserDownloadUrl
              let fileName = asset.Name
              let saveTo = Path.Combine(downloadDir, fileName)
              (fileName, downloadUrl, saveTo) ]
    let lockx = obj ()
    let mutable progress =
        [| for fileName, _, _ in files -> sprintf "Fetching %s ..." fileName |]
    let cts = new System.Threading.CancellationTokenSource()
    let baseI = System.Console.CursorTop
    let progressTask = task {
        while not cts.Token.IsCancellationRequested do
            lock lockx (fun _ ->
                let ci = System.Console.CursorTop
                System.Console.CursorTop <- baseI
                System.Console.CursorLeft <- 0
                for i in 0 .. progress.Length - 1 do
                    printfn "%s" progress.[i]
                System.Console.CursorTop <- ci)
            do! System.Threading.Tasks.Task.Delay(1000)
    }
    let! _ =
        files
        |> List.mapi (fun i (fileName, downloadUrl, saveTo) ->
            (async {
                if saveTo |> File.Exists then
                    progress[i] <- sprintf "Skipping %s" fileName
                else
                    progress[i] <- sprintf "Downloading %s" fileName
                    do!
                        download downloadUrl saveTo (fun e ->
                            progress[i] <-
                                sprintf
                                    "Downloading %s: %s/%s"
                                    fileName
                                    (formatByteSize e.ReceivedBytesSize)
                                    (formatByteSize e.TotalBytesToReceive))
                        |> Async.AwaitTask
                    printfn "Downloaded %s" fileName
            }))
        |> Async.Parallel
    cts.Cancel()
    do! progressTask
    return files
}
