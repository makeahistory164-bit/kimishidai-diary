#!/bin/bash
#
# キミシダイ日記 開発用: iOS Simulator 内のローカルDBを覗くヘルパー。
#
#   ./db.sh                      … テーブル一覧と行数のサマリを表示
#   ./db.sh "SELECT * FROM answer;"  … SQLを実行
#   ./db.sh -i                   … sqlite3 の対話モードに入る（.quit で抜ける）
#   ./db.sh -p                   … DBファイルのパスだけ表示
#
# なぜ毎回パスを探すのか:
#   Expo Go はアプリを入れ直すたびにコンテナのUUIDが変わるため、
#   パスを固定で書くとすぐ動かなくなる。だから実行のたびに探す。

set -euo pipefail

DEVICES="$HOME/Library/Developer/CoreSimulator/Devices"

# kimishidai.db を全シミュレータから探し、最後に更新されたものを選ぶ。
# （シミュレータが複数ある場合、いま使っているものが一番新しいはず）
DB=$(find "$DEVICES" -name "kimishidai.db" -type f 2>/dev/null \
     | while read -r f; do echo "$(stat -f '%m' "$f")|$f"; done \
     | sort -rn | head -1 | cut -d'|' -f2-)

if [ -z "$DB" ]; then
  echo "DBが見つかりません。" >&2
  echo "アプリをシミュレータで一度起動すると作成されます:" >&2
  echo "  npx expo start --port 8087" >&2
  exit 1
fi

case "${1:-}" in
  -p)
    echo "$DB"
    ;;
  -i)
    echo "接続先: $DB"
    echo "（.tables で一覧 / .schema answer で定義 / .quit で終了）"
    sqlite3 -box "$DB"
    ;;
  "")
    echo "接続先: $DB"
    echo
    echo "=== テーブルと行数 ==="
    for t in daily_entry question answer todo user_preference screen_time_log; do
      printf "  %-18s %s 行\n" "$t" "$(sqlite3 "$DB" "SELECT COUNT(*) FROM $t;")"
    done
    echo
    echo "=== マイグレーション ==="
    printf "  user_version = %s （src/db/schema.ts の DATABASE_VERSION と一致すべき）\n" \
      "$(sqlite3 "$DB" 'PRAGMA user_version;')"
    echo
    echo "=== 直近の記録 ==="
    sqlite3 -box "$DB" "
      SELECT d.date AS 日付, d.status AS 状態, d.axis_score AS 軸スコア,
             COUNT(q.id) AS 質問数, COUNT(a.id) AS 回答数
      FROM daily_entry d
      LEFT JOIN question q ON q.daily_entry_id = d.id
      LEFT JOIN answer   a ON a.question_id = q.id
      GROUP BY d.id ORDER BY d.date DESC LIMIT 7;"
    ;;
  *)
    sqlite3 -box "$DB" "$1"
    ;;
esac
