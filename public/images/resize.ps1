Param (
  [Parameter(Mandatory=$true, Position=0)]
  [string]$directory
)

# Loop through all .png files in directory
Get-ChildItem $directory -Filter *.png | ForEach-Object {
    $filename = $_.FullName
    # Check if corresponding -sm.jpg file exists
    $smFilePath = $_.FullName.Replace(".png", "-sm.jpg")
    if (!(Test-Path $smFilePath)) {
        $command = "magick `"$filename`" -resize 416x416 -quality 50 `"$smFilePath`""
        Invoke-Expression $command
    }
}
