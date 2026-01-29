# Cursor Skills Manager 发布脚本 (Windows PowerShell)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Cursor Skills Manager 发布工具" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查版本号
$packageJson = Get-Content package.json | ConvertFrom-Json
$version = $packageJson.version
Write-Host "当前版本: $version" -ForegroundColor Yellow
Write-Host ""

# 检查必要文件
Write-Host "检查必要文件..." -ForegroundColor Green
$requiredFiles = @("package.json", "README.md", "LICENSE", "CHANGELOG.md")
$missingFiles = @()

foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        $missingFiles += $file
        Write-Host "  ❌ 缺少文件: $file" -ForegroundColor Red
    } else {
        Write-Host "  ✅ $file" -ForegroundColor Green
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host ""
    Write-Host "请先创建缺少的文件后再发布！" -ForegroundColor Red
    exit 1
}

# 检查 vsce 是否安装
Write-Host ""
Write-Host "检查 vsce 工具..." -ForegroundColor Green
try {
    $vsceVersion = vsce --version
    Write-Host "  ✅ vsce 已安装: $vsceVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ vsce 未安装" -ForegroundColor Red
    Write-Host "  请运行: npm install -g vsce" -ForegroundColor Yellow
    exit 1
}

# 编译
Write-Host ""
Write-Host "编译 TypeScript..." -ForegroundColor Green
npm run compile
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ❌ 编译失败！" -ForegroundColor Red
    exit 1
}
Write-Host "  ✅ 编译成功" -ForegroundColor Green

# 打包
Write-Host ""
Write-Host "打包扩展..." -ForegroundColor Green
$vsixFile = "cursor-skills-manager-$version.vsix"
vsce package
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ❌ 打包失败！" -ForegroundColor Red
    exit 1
}
Write-Host "  ✅ 打包成功: $vsixFile" -ForegroundColor Green

# 询问是否发布
Write-Host ""
$publish = Read-Host "是否发布到 VS Code Marketplace? (y/n)"
if ($publish -eq 'y' -or $publish -eq 'Y') {
    Write-Host ""
    Write-Host "发布到 Marketplace..." -ForegroundColor Green
    vsce publish
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ 发布成功！" -ForegroundColor Green
    } else {
        Write-Host "  ❌ 发布失败！" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host ""
    Write-Host "跳过发布，仅打包完成" -ForegroundColor Yellow
    Write-Host "本地安装: Extensions: Install from VSIX..." -ForegroundColor Cyan
}

Write-Host ""
Write-Host "完成！" -ForegroundColor Green
