$out = @()
foreach ($n in 1..3) {
  $html = [System.IO.File]::ReadAllText("C:\Users\cwnow\Downloads\Website\tg_doc$n.html")
  # Find the NEXT_DATA JSON block
  $m = [regex]::Match($html, '"pets":\[(\{.+?\})\]')
  if (-not $m.Success) {
    # Try broader pattern
    $m = [regex]::Match($html, '\{"configName":"[^}]+"thumbnail":\{"assetId":\d+[^}]+\}[^}]*"rap":\d+[^}]+\}')
  }
  # Extract all pet objects: look for configName, thumbnail assetId, category, rap
  $pets = [regex]::Matches($html, '\{"configName":"([^"]+)","thumbnail":\{"assetId":(\d+)[^}]+\}[^}]*"category":"([^"]+)"[^}]*"rap":(\d+)')
  if ($pets.Count -eq 0) {
    # alternate field order
    $pets = [regex]::Matches($html, '"configName":"([^"]+)".{0,300}?"category":"([^"]+)".{0,300}?"assetId":(\d+).{0,300}?"rap":(\d+)')
  }
  $cnt = $pets.Count; $out += "=== DOC ${n}: $cnt pets ==="
  foreach ($p in $pets) { $out += "$($p.Groups[1].Value)|$($p.Groups[2].Value)|$($p.Groups[3].Value)|$($p.Groups[4].Value)" }
}
$out | Out-File -FilePath "C:\Users\cwnow\Downloads\Website\pets_extracted.txt" -Encoding utf8
Write-Host "Done: $($out.Count) lines"
