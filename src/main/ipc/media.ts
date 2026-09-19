import { ipcMain } from 'electron';
import { runPowerShell } from '../utils/powershell';

export function registerMediaHandlers() {
  let cachedMediaInfo: any = null;
  let lastMediaFetch = 0;
  let inFlightFetch: Promise<any> | null = null;

  ipcMain.handle('media:getInfo', async () => {
    const now = Date.now();
    const ttl = cachedMediaInfo?.isPlaying ? 2000 : 7500;
    if (now - lastMediaFetch < ttl) {
      return cachedMediaInfo;
    }
    if (inFlightFetch !== null) {
      if (cachedMediaInfo !== null) {
        return cachedMediaInfo;
      }
      return inFlightFetch;
    }
    lastMediaFetch = now;

    const script = `
try {
  Add-Type -AssemblyName System.Runtime.WindowsRuntime
  $asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -like 'IAsyncOperation*' })[0]
  [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager,Windows.Media.Control,ContentType=WindowsRuntime] | Out-Null
  $op = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()
  $asTask = $asTaskGeneric.MakeGenericMethod([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])
  $task = $asTask.Invoke($null, @($op))
  $task.Wait()
  $manager = $task.Result
  if ($manager) {
    $sessions = $manager.GetSessions()
    $session = $null
    foreach ($s in $sessions) {
      if ($s.SourceAppUserModelId -match "Spotify|AppleMusic|Music") {
        $session = $s
        break
      }
    }
    if (-not $session) {
      $session = $manager.GetCurrentSession()
    }
    if (-not $session -and $sessions.Count -gt 0) {
      $session = $sessions[0]
    }
    if ($session) {
      $propsOp = $session.TryGetMediaPropertiesAsync()
      $asTaskProps = $asTaskGeneric.MakeGenericMethod([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties])
      $taskProps = $asTaskProps.Invoke($null, @($propsOp))
      $taskProps.Wait()
      $props = $taskProps.Result
      $source = $session.SourceAppUserModelId
      $playback = $session.GetPlaybackInfo()

      $thumbBase64 = $null
      try {
        if ($props.Thumbnail) {
          $streamOp = $props.Thumbnail.OpenReadAsync()
          $asTaskStream = $asTaskGeneric.MakeGenericMethod([Windows.Storage.Streams.IRandomAccessStreamWithContentType])
          $taskStream = $asTaskStream.Invoke($null, @($streamOp))
          $taskStream.Wait()
          $stream = $taskStream.Result
          if ($stream) {
            $asStreamMethod = ([System.IO.WindowsRuntimeStreamExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsStream' -and $_.GetParameters().Count -eq 1 })[0]
            $netStream = $asStreamMethod.Invoke($null, @($stream))
            if ($netStream -and $netStream.Length -gt 0) {
              $bytes = New-Object byte[] $netStream.Length
              $netStream.Read($bytes, 0, $netStream.Length) | Out-Null
              $thumbBase64 = "data:image/jpeg;base64," + [Convert]::ToBase64String($bytes)
            }
          }
        }
      } catch {}

      $app = "media"
      if ($source -match "Spotify") { $app = "spotify" }
      elseif ($source -match "Apple" -or $source -match "iTunes") { $app = "applemusic" }
      elseif ($source -match "Chrome" -or $source -match "Brave" -or $source -match "Edge") { $app = "browser" }

      $timeline = $session.GetTimelineProperties()
      $pos = 0
      $dur = 0
      if ($timeline) {
        $pos = [Math]::Floor($timeline.Position.TotalSeconds)
        $dur = [Math]::Floor($timeline.EndTime.TotalSeconds)
      }

      @{
        title = $props.Title
        artist = $props.Artist
        albumTitle = $props.AlbumTitle
        isPlaying = ($playback.PlaybackStatus -eq 4)
        appName = $app
        albumArt = $thumbBase64
        position = $pos
        duration = $dur
      } | ConvertTo-Json
      exit 0
    }
  }
} catch {}

try {
  $proc = Get-Process -Name spotify -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -ne '' } | Select-Object -First 1
  if ($proc) {
    $title = $proc.MainWindowTitle
    if ($title -ne 'Spotify' -and $title -ne 'Spotify Free' -and $title -ne 'Spotify Premium') {
      $parts = $title -split ' - ', 2
      if ($parts.Count -eq 2) {
        @{
          title = $parts[1]
          artist = $parts[0]
          isPlaying = $true
          appName = 'spotify'
          position = 0
          duration = 0
        } | ConvertTo-Json
        exit 0
      }
    }
  }
} catch {}
`;

    inFlightFetch = (async () => {
      try {
        const output = await runPowerShell(script, 3000);
        lastMediaFetch = Date.now();
        if (!output) {
          cachedMediaInfo = null;
          return null;
        }
        cachedMediaInfo = JSON.parse(output);
        return cachedMediaInfo;
      } catch {
        lastMediaFetch = Date.now();
        cachedMediaInfo = null;
        return null;
      } finally {
        inFlightFetch = null;
      }
    })();

    return inFlightFetch;
  });

  ipcMain.handle('media:control', async (_, action: string) => {
    cachedMediaInfo = null;
    lastMediaFetch = 0;
    let vk = 0;
    if (action === 'play-pause') vk = 179;
    else if (action === 'next') vk = 176;
    else if (action === 'previous') vk = 177;
    if (vk) {
      const script = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class NativeMedia {
  [DllImport("user32.dll")]
  public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);
}
"@
[NativeMedia]::keybd_event(${vk}, 0, 0, [UIntPtr]::Zero)
[NativeMedia]::keybd_event(${vk}, 0, 2, [UIntPtr]::Zero)
`;
      await runPowerShell(script, 3000);
    }
  });

  ipcMain.handle('media:seek', async (_, seconds: number) => {
    cachedMediaInfo = null;
    lastMediaFetch = 0;
    const targetSec = Math.max(0, Math.floor(seconds));
    const script = `
try {
  Add-Type -AssemblyName System.Runtime.WindowsRuntime
  $asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -like 'IAsyncOperation*' })[0]
  [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager,Windows.Media.Control,ContentType=WindowsRuntime] | Out-Null
  $op = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()
  $asTask = $asTaskGeneric.MakeGenericMethod([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])
  $task = $asTask.Invoke($null, @($op))
  $task.Wait()
  $manager = $task.Result
  if ($manager) {
    $sessions = $manager.GetSessions()
    $session = $null
    foreach ($s in $sessions) {
      if ($s.SourceAppUserModelId -match "Spotify|AppleMusic|Music") {
        $session = $s
        break
      }
    }
    if (-not $session) {
      $session = $manager.GetCurrentSession()
    }
    if ($session) {
      $ticks = [long](${targetSec} * 10000000)
      $seekOp = $session.TryChangePlaybackPositionAsync($ticks)
      $asTaskBool = $asTaskGeneric.MakeGenericMethod([System.Boolean])
      $taskSeek = $asTaskBool.Invoke($null, @($seekOp))
      $taskSeek.Wait()
    }
  }
} catch {}
`;
    await runPowerShell(script, 3000);
  });
}
