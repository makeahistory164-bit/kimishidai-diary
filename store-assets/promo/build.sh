#!/bin/bash
# promo.html から App Store 用の紹介画像を書き出す
# 使い方: bash store-assets/promo/build.sh
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
SLIDES=6

render() { # $1=出力フォルダ名 $2=幅 $3=高さ
  local out="$DIR/out/$1"
  mkdir -p "$out"
  for i in $(seq 1 $SLIDES); do
    "$CHROME" --headless=new --disable-gpu --hide-scrollbars \
      --force-device-scale-factor=1 --window-size="$2,$3" \
      --default-background-color=00000000 --virtual-time-budget=3000 \
      --screenshot="$out/$(printf '%02d' "$i").png" \
      "file://$DIR/promo.html?slide=$i&w=$2&h=$3" 2>/dev/null
    # App Store はアルファチャンネル付きPNGを受け付けないため除去する
    sips -s format jpeg "$out/$(printf '%02d' "$i").png" --out "$out/tmp.jpg" >/dev/null
    sips -s format png "$out/tmp.jpg" --out "$out/$(printf '%02d' "$i").png" >/dev/null
    rm "$out/tmp.jpg"
  done
  echo "書き出し完了: $out"
}

render 6.9 1320 2868
render 6.5 1284 2778
