<template>
  <div class="chart" :class="{ dense: points.length > 6 }">
    <div class="plot" :style="{ height: `${hauteur}px` }" @mouseleave="actif = -1">
      <div class="grid" aria-hidden="true">
        <div v-for="g in graduations" :key="g" class="grid-line" :style="{ bottom: `${(g / echelle) * 100}%` }">
          <span>{{ formatCourt(g) }}</span>
        </div>
      </div>

      <div class="bars">
        <button
          v-for="(p, i) in points"
          :key="p.label"
          type="button"
          class="col"
          :aria-label="`${p.libelleLong} : ${formatValeur(p.valeur)}`"
          @mouseenter="actif = i"
          @focus="actif = i"
          @click="actif = i"
        >
          <span
            class="bar"
            :class="{ dim: actif !== -1 && actif !== i, zero: p.valeur === 0 }"
            :style="{ height: `${Math.max((p.valeur / echelle) * 100, p.valeur > 0 ? 1.5 : 0)}%` }"
          />
          <span v-if="actif === i" class="tooltip" :class="{ gauche: i > points.length / 2 }">
            <strong>{{ formatValeur(p.valeur) }}</strong>
            <span>{{ p.libelleLong }}</span>
            <span v-if="p.detail">{{ p.detail }}</span>
          </span>
          <span v-else-if="i === indexMax && p.valeur > 0" class="direct">{{ formatCourt(p.valeur) }}</span>
        </button>
      </div>
    </div>

    <div class="axis-x" aria-hidden="true">
      <span v-for="p in points" :key="p.label" class="x-label">{{ p.label }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

export interface PointBarre {
  label: string
  libelleLong: string
  valeur: number
  detail?: string
}

const props = withDefaults(
  defineProps<{
    points: PointBarre[]
    formatValeur?: (v: number) => string
    hauteur?: number
  }>(),
  { formatValeur: (v: number) => String(v), hauteur: 200 },
)

const actif = ref(-1)

const max = computed(() => Math.max(0, ...props.points.map((p) => p.valeur)))
const indexMax = computed(() => props.points.findIndex((p) => p.valeur === max.value))

const echelle = computed(() => {
  if (max.value <= 0) return 1
  const puissance = 10 ** Math.floor(Math.log10(max.value))
  const pas = [1, 2, 2.5, 5, 10].find((m) => m * puissance * 4 >= max.value) ?? 10
  return pas * puissance * 4
})

const graduations = computed(() => [0, 1, 2, 3, 4].map((i) => (echelle.value / 4) * i))

function formatCourt(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} M`
  if (v >= 1000) return `${(v / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} k`
  return String(Math.round(v))
}
</script>

<style scoped>
.chart {
  --bar: #2f5bd3;
  --axis-w: 36px;
  width: 100%;
}

.plot {
  position: relative;
  margin-left: var(--axis-w);
}

.grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.grid-line {
  position: absolute;
  right: 0;
  left: 0;
  border-top: 1px solid #eef1f5;
}

.grid-line:first-child {
  border-top-color: #cbd5e1;
}

.grid-line span {
  position: absolute;
  top: -8px;
  left: calc(var(--axis-w) * -1);
  width: calc(var(--axis-w) - 6px);
  font-size: 11px;
  color: var(--text-soft);
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.bars {
  position: absolute;
  inset: 0;
  display: flex;
  gap: 2px;
}

.col {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  min-width: 0;
  height: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.col:focus-visible {
  outline: 2px solid var(--ion-color-primary);
  outline-offset: 2px;
  border-radius: 4px;
}

.bar {
  flex-shrink: 0;
  width: min(70%, 36px);
  border-radius: 4px 4px 0 0;
  background: var(--bar);
  transition: opacity 0.15s ease;
}

.bar.dim {
  opacity: 0.35;
}

.direct {
  order: -1;
  margin-bottom: 4px;
  font-size: 11px;
  white-space: nowrap;
  font-weight: 600;
  color: var(--text-strong);
  pointer-events: none;
}

.tooltip {
  position: absolute;
  top: 0;
  left: 50%;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 8px 10px;
  border-radius: 8px;
  background: #0f172a;
  color: #fff;
  font-size: 12px;
  text-align: left;
  white-space: nowrap;
  transform: translateX(-50%);
  pointer-events: none;
}

.tooltip.gauche {
  right: 50%;
  left: auto;
  transform: translateX(30%);
}

.tooltip strong {
  font-size: 14px;
  font-variant-numeric: tabular-nums;
}

.tooltip span {
  color: #cbd5e1;
}

.axis-x {
  display: flex;
  gap: 2px;
  margin: 6px 0 0 var(--axis-w);
}

.x-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: 11px;
  color: var(--text-muted);
  text-align: center;
  text-overflow: clip;
  white-space: nowrap;
}

@media (max-width: 420px) {
  .dense .x-label:nth-child(even) {
    visibility: hidden;
  }
}
</style>
