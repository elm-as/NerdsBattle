Add-Type -AssemblyName System.Drawing

function Generate-Icon {
    param([int]$Size, [string]$Path)
    
    $bmp = New-Object System.Drawing.Bitmap($Size, $Size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    # Fond émeraude brand (#10B981) avec dégradé subtil
    $rect = New-Object System.Drawing.Rectangle(0, 0, $Size, $Size)
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $rect,
        [System.Drawing.ColorTranslator]::FromHtml("#10B981"),
        [System.Drawing.ColorTranslator]::FromHtml("#059669"),
        [System.Drawing.Drawing2D.LinearGradientMode]::ForwardDiagonal
    )
    $g.FillRectangle($brush, $rect)

    # Cercle intérieur sombre/contraste (#0A0F0D avec transparence)
    $innerPad = [int]($Size * 0.12)
    $innerSize = $Size - ($innerPad * 2)
    $innerBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(40, 0, 0, 0))
    $g.FillEllipse($innerBrush, $innerPad, $innerPad, $innerSize, $innerSize)

    # Lettrage 'NB' élégant et puissant
    $fontSize = [float]($Size * 0.42)
    $font = New-Object System.Drawing.Font("Arial", $fontSize, [System.Drawing.FontStyle]::Bold)
    $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center

    $textRect = New-Object System.Drawing.RectangleF(0, [float]($Size * 0.02), $Size, $Size)
    $g.DrawString("NB", $font, $textBrush, $textRect, $sf)

    # Étoile / éclair décoratif en haut à droite
    $dotBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#84CC16"))
    $dotSize = [int]($Size * 0.1)
    $g.FillEllipse($dotBrush, [int]($Size * 0.72), [int]($Size * 0.18), $dotSize, $dotSize)

    $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Output "Created: $Path ($Size x $Size)"
}

Generate-Icon -Size 192 -Path "public/icon-192.png"
Generate-Icon -Size 512 -Path "public/icon-512.png"
