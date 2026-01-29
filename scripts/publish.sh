#!/bin/bash

# Cursor Skills Manager 发布脚本 (macOS/Linux)

echo "========================================"
echo "  Cursor Skills Manager 发布工具"
echo "========================================"
echo ""

# 检查版本号
VERSION=$(node -p "require('./package.json').version")
echo "当前版本: $VERSION"
echo ""

# 检查必要文件
echo "检查必要文件..."
REQUIRED_FILES=("package.json" "README.md" "LICENSE" "CHANGELOG.md")
MISSING_FILES=()

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        MISSING_FILES+=("$file")
        echo "  ❌ 缺少文件: $file"
    else
        echo "  ✅ $file"
    fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo ""
    echo "请先创建缺少的文件后再发布！"
    exit 1
fi

# 检查 vsce 是否安装
echo ""
echo "检查 vsce 工具..."
if command -v vsce &> /dev/null; then
    VSCE_VERSION=$(vsce --version)
    echo "  ✅ vsce 已安装: $VSCE_VERSION"
else
    echo "  ❌ vsce 未安装"
    echo "  请运行: npm install -g vsce"
    exit 1
fi

# 编译
echo ""
echo "编译 TypeScript..."
npm run compile
if [ $? -ne 0 ]; then
    echo "  ❌ 编译失败！"
    exit 1
fi
echo "  ✅ 编译成功"

# 打包
echo ""
echo "打包扩展..."
VSIX_FILE="cursor-skills-manager-$VERSION.vsix"
vsce package
if [ $? -ne 0 ]; then
    echo "  ❌ 打包失败！"
    exit 1
fi
echo "  ✅ 打包成功: $VSIX_FILE"

# 询问是否发布
echo ""
read -p "是否发布到 VS Code Marketplace? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "发布到 Marketplace..."
    vsce publish
    if [ $? -eq 0 ]; then
        echo "  ✅ 发布成功！"
    else
        echo "  ❌ 发布失败！"
        exit 1
    fi
else
    echo ""
    echo "跳过发布，仅打包完成"
    echo "本地安装: Extensions: Install from VSIX..."
fi

echo ""
echo "完成！"
