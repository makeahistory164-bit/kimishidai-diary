import React from 'react';
import { View, StyleSheet } from 'react-native';

/**
 * 公式キャラクター（ドット絵）。
 *
 * 【実装方針】ドット絵＝矩形の集合なので、react-native-svg を足さずに View だけで描く。
 * 依存を増やさない方針（PROJECT_STATE.md 2章「コスト0円」）と、Expo Goでそのまま動く利点を優先した。
 *
 * 【骨格は固定】頭10×8マス・首2マス・肩12マスは全表情で共通。
 * 変えるのは「目・口・体色」だけ（デザイン案 8a の表情シートの定義）。
 * 骨格を触ると別のキャラに見えてしまうので、表情を追加するときも EXPRESSIONS の
 * eyes / mouth / body だけを足すこと。
 *
 * ★色は「その日のスコア」を表さない ★変更前に必ず読むこと
 * デザイン案 8b は「答えると色が決まる」＝回答値で色が変わる案だったが、採用していない。
 *   1. 回答中に色が変われば、それは回答UIの色ヒントそのもので、設計判断3-3
 *      （正直な自己申告より「良い色」を選びたくなるバイアスを避ける）に反する
 *   2. 低スコアでキャラが沈む表現は、要件書8.4「責めない・寄り添う語り口」に反する
 * そのため色・表情は「アプリの状態」（尋ねている／終わった／休んでいる）にのみ対応させる。
 * 体色もスコア配色（colors.ts の暖色→緑）とは意図的に別系統の色を使い、
 * ユーザーが「キャラの色＝点数」と誤読しないようにしている。
 */

/** 1マス＝size/16。デザイン案の座標（236pxを16分割＝14.75px刻み）をマス単位に換算したもの */
const GRID = 16;

/** [x, y, w, h] をマス単位で表す */
type Cell = readonly [number, number, number, number];

interface ExpressionSpec {
  /** 体色。スコア配色とは別系統であること（上のコメント参照） */
  body: string;
  /** 肩の幅（マス）。励ます表情だけ腕を上げるぶん広い */
  shoulder: Cell;
  /** 体色で描き足すパーツ（上げた腕など） */
  extra?: readonly Cell[];
  /** 背景色で抜くパーツ（目・口・ほほ） */
  cuts: readonly Cell[];
  /** さらに別色で乗せる装飾（ほほの赤み・思考の泡・寝息） */
  accents?: { color: string; cells: readonly Cell[] };
}

export type MascotExpression = 'joy' | 'cheer' | 'think' | 'rest';

const HEAD: Cell = [3, 2, 10, 8];
const NECK: Cell = [7, 10, 2, 1];
const SHOULDER: Cell = [2, 11, 12, 5];

const LIGHT_GREEN = '#93a94e';
const DEEP_GREEN = '#2f6f4f';

const EXPRESSIONS: Record<MascotExpression, ExpressionSpec> = {
  /** うれしい: 目を大きく開き、口は広い。ほほに濃い緑 */
  joy: {
    body: LIGHT_GREEN,
    shoulder: SHOULDER,
    cuts: [
      [5, 5, 2, 2],
      [9, 5, 2, 2],
      [5, 7, 1, 1],
      [10, 7, 1, 1],
      [6, 8, 4, 1],
    ],
    accents: {
      color: DEEP_GREEN,
      cells: [
        [4, 7, 1, 1],
        [11, 7, 1, 1],
      ],
    },
  },
  /** 励ます: 深い緑。右腕を上げている（肩が1マス広い） */
  cheer: {
    body: DEEP_GREEN,
    shoulder: [2, 11, 13, 5],
    extra: [[14, 8, 1, 3]],
    cuts: [
      [5, 5, 2, 2],
      [9, 5, 2, 2],
      [6, 8, 4, 1],
    ],
  },
  /** 考え中（問いかけ時）: 青緑。片目を細め、口は小さい。思考の泡つき */
  think: {
    body: '#4a7f86',
    shoulder: SHOULDER,
    cuts: [
      [5, 5, 2, 2],
      [9, 5, 1, 1],
      [7, 8, 1, 1],
    ],
    accents: {
      color: LIGHT_GREEN,
      cells: [
        [13, 2, 1, 1],
        [14, 0, 1, 1],
      ],
    },
  },
  /** おやすみ: 藍。目は閉じた横線。寝息が斜めに昇る */
  rest: {
    body: '#5b6470',
    shoulder: SHOULDER,
    cuts: [
      [5, 6, 2, 1],
      [9, 6, 2, 1],
      [7, 8, 1, 1],
    ],
    accents: {
      color: LIGHT_GREEN,
      cells: [
        [12, 3, 1, 1],
        [13, 2, 1, 1],
        [14, 1, 1, 1],
      ],
    },
  },
};

interface Props {
  expression: MascotExpression;
  /** 一辺のピクセル数（正方形） */
  size: number;
  /**
   * 目や口を「抜く」色。キャラを置く面の背景色を渡すこと。
   * 実際に背景を透過させているわけではないため、ここがズレると顔が浮いて見える。
   */
  cutColor: string;
}

export function Mascot({ expression, size, cutColor }: Props) {
  const spec = EXPRESSIONS[expression];
  const unit = size / GRID;

  const rect = (cell: Cell, color: string, key: string) => (
    <View
      key={key}
      style={[
        styles.cell,
        {
          left: cell[0] * unit,
          top: cell[1] * unit,
          width: cell[2] * unit,
          height: cell[3] * unit,
          backgroundColor: color,
        },
      ]}
    />
  );

  return (
    <View
      style={{ width: size, height: size }}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      {[HEAD, NECK, spec.shoulder, ...(spec.extra ?? [])].map((c, i) =>
        rect(c, spec.body, `body-${i}`)
      )}
      {spec.cuts.map((c, i) => rect(c, cutColor, `cut-${i}`))}
      {spec.accents?.cells.map((c, i) => rect(c, spec.accents!.color, `accent-${i}`))}
    </View>
  );
}

const styles = StyleSheet.create({
  cell: { position: 'absolute' },
});
