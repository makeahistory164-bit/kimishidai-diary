#!/bin/bash
# promo.html から App Store 用の紹介画像を書き出す
# 使い方: bash store-assets/promo/build.sh
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
SLIDES=6

# headless Chrome はまれに書き出し後も終了しないので、30秒で打ち切って最大3回やり直す
shoot() { # $1=出力PNG $2=URL $3=幅,高さ
  for attempt in 1 2 3; do
    rm -f "$1"
    "$CHROME" --headless=new --disable-gpu --hide-scrollbars \
      --force-device-scale-factor=1 --window-size="$3" \
      --default-background-color=00000000 --virtual-time-budget=3000 \
      --screenshot="$1" "$2" 2>/dev/null &
    local pid=$! waited=0
    while kill -0 "$pid" 2>/dev/null && [ $waited -lt 30 ]; do sleep 1; waited=$((waited + 1)); done
    if kill -0 "$pid" 2>/dev/null; then kill "$pid" 2>/dev/null; wait "$pid" 2>/dev/null || true; fi
    [ -s "$1" ] && return 0
  done
  echo "書き出し失敗: $1" >&2
  return 1
}

render() { # $1=出力フォルダ名 $2=幅 $3=高さ
  local out="$DIR/out/$1"
  mkdir -p "$out"
  for i in $(seq 1 $SLIDES); do
    shoot "$out/$(printf '%02d' "$i").png" "file://$DIR/promo.html?slide=$i&w=$2&h=$3" "$2,$3"
    # App Store はアルファチャンネル付きPNGを受け付けないため除去する
    sips -s format jpeg "$out/$(printf '%02d' "$i").png" --out "$out/tmp.jpg" >/dev/null
    sips -s format png "$out/tmp.jpg" --out "$out/$(printf '%02d' "$i").png" >/dev/null
    rm "$out/tmp.jpg"
  done
  echo "書き出し完了: $out"
}

render 6.9 1320 2868
render 6.5 1284 2778
