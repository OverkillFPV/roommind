import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { HomeAssistant, RoomLiveData } from "../types";
import { localize } from "../utils/localize";
import { openEntityInfo } from "../utils/events";
import { inputStyles } from "../styles/input-styles";

type PowerKind = "aux_heat" | "climate_power";

@customElement("rs-power-section")
export class RsPowerSection extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ attribute: false }) public auxHeatSensors: Set<string> = new Set();
  @property({ attribute: false }) public climatePowerSensors: Set<string> = new Set();
  @property({ attribute: false }) public live: RoomLiveData | null = null;
  @property({ type: Number }) public climateIdlePowerW = 5;
  @property({ type: Boolean }) public editing = false;
  @property() public language = "en";

  @state() private _picker: PowerKind | null = null;

  static styles = [
    inputStyles,
    css`
      :host {
        display: block;
      }

      .block {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 12px 14px;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.08));
        border-radius: 12px;
      }

      .block + .block {
        margin-top: 12px;
      }

      .block-header {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .block-header ha-icon {
        --mdc-icon-size: 18px;
        color: var(--secondary-text-color);
      }

      .block-title {
        font-size: 13px;
        font-weight: 500;
        color: var(--primary-text-color);
        letter-spacing: 0.2px;
        flex: 1;
      }

      .block-hint {
        font-size: 11px;
        color: var(--secondary-text-color);
        line-height: 1.35;
        margin-top: -2px;
      }

      .row-list {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .row {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.03);
      }

      .row-info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
      }

      .row-name {
        font-size: 13px;
        color: var(--primary-text-color);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        cursor: pointer;
      }

      .row-name:hover {
        text-decoration: underline;
      }

      .row-eid {
        font-size: 11px;
        color: var(--secondary-text-color);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .value-chip {
        font-size: 12px;
        font-weight: 500;
        padding: 2px 8px;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.06);
        flex-shrink: 0;
      }

      .remove-btn {
        --mdc-icon-button-size: 32px;
        --mdc-icon-size: 18px;
        color: var(--secondary-text-color);
      }

      .empty-row {
        font-size: 12px;
        color: var(--secondary-text-color);
        font-style: italic;
        padding: 6px 4px;
      }

      .add-button {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        border: 1px dashed var(--divider-color, rgba(255, 255, 255, 0.18));
        border-radius: 8px;
        background: transparent;
        color: var(--primary-text-color);
        font-size: 12px;
        cursor: pointer;
      }

      .add-button:hover {
        border-color: var(--primary-color);
        color: var(--primary-color);
      }

      .add-button ha-icon {
        --mdc-icon-size: 16px;
      }

      .picker-row {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .picker-row ha-entity-picker {
        flex: 1;
      }

      .section-subtitle {
        font-size: 12px;
        font-weight: 500;
        color: var(--secondary-text-color);
        margin: 12px 0 4px 0;
        text-transform: uppercase;
        letter-spacing: 0.4px;
      }

      .section-subtitle:first-child {
        margin-top: 0;
      }

      .threshold-row {
        margin-top: 10px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .threshold-row ha-textfield {
        max-width: 200px;
      }

      .stats-line {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin: 2px 0 6px 0;
      }
      .stat-chip {
        font-size: 11px;
        font-weight: 500;
        padding: 2px 8px;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.05);
        color: var(--primary-text-color);
      }
      .stat-label {
        color: var(--secondary-text-color);
        margin-right: 4px;
        text-transform: uppercase;
        letter-spacing: 0.4px;
      }
    `,
  ];

  render() {
    if (!this.editing) {
      return this._renderView();
    }
    return this._renderEdit();
  }

  private _renderView() {
    const hasAux = this.auxHeatSensors.size > 0;
    const hasClimate = this.climatePowerSensors.size > 0;
    if (!hasAux && !hasClimate) return nothing;
    const lang = this.hass.language;
    return html`
      ${hasAux
        ? html`
            <div class="section-subtitle">${localize("power.aux_heat_sensors", lang)}</div>
            ${this._renderStatsLine("aux")}
            ${[...this.auxHeatSensors].map((id) => this._renderViewRow(id))}
          `
        : nothing}
      ${hasClimate
        ? html`
            <div class="section-subtitle">${localize("power.climate_power_sensors", lang)}</div>
            ${this._renderStatsLine("climate")}
            ${[...this.climatePowerSensors].map((id) => this._renderViewRow(id))}
          `
        : nothing}
    `;
  }

  private _renderStatsLine(kind: "aux" | "climate") {
    if (!this.live) return nothing;
    const lang = this.hass.language;
    const live =
      kind === "aux" ? (this.live.aux_power_w ?? 0) : (this.live.climate_power_w ?? 0);
    const avg =
      kind === "aux" ? (this.live.aux_power_avg_w ?? 0) : (this.live.climate_power_avg_w ?? 0);
    const max =
      kind === "aux" ? (this.live.aux_power_max_w ?? 0) : (this.live.climate_power_max_w ?? 0);
    return html`
      <div class="stats-line">
        <span class="stat-chip"
          ><span class="stat-label">${localize("power.live", lang)}</span>${live.toFixed(0)} W</span
        >
        <span class="stat-chip"
          ><span class="stat-label">${localize("power.avg", lang)}</span>${avg.toFixed(0)} W</span
        >
        <span class="stat-chip"
          ><span class="stat-label">${localize("power.max", lang)}</span>${max.toFixed(0)} W</span
        >
      </div>
    `;
  }

  private _renderViewRow(entityId: string) {
    const st = this.hass.states[entityId];
    const friendly = (st?.attributes?.friendly_name as string) || entityId;
    const watts = this._formatWatts(st?.state, st?.attributes?.unit_of_measurement as string);
    return html`
      <div class="row">
        <div class="row-info">
          <span class="row-name" @click=${() => openEntityInfo(this, entityId)}>${friendly}</span>
          <span class="row-eid">${entityId}</span>
        </div>
        ${watts ? html`<span class="value-chip">${watts}</span>` : nothing}
      </div>
    `;
  }

  private _renderEdit() {
    const lang = this.hass.language;
    return html`
      <div class="block">
        <div class="block-header">
          <ha-icon icon="mdi:radiator"></ha-icon>
          <div class="block-title">${localize("power.aux_heat_sensors", lang)}</div>
        </div>
        <div class="block-hint">${localize("power.aux_heat_hint", lang)}</div>
        ${this._renderList("aux_heat", this.auxHeatSensors)}
      </div>
      <div class="block">
        <div class="block-header">
          <ha-icon icon="mdi:hvac"></ha-icon>
          <div class="block-title">${localize("power.climate_power_sensors", lang)}</div>
        </div>
        <div class="block-hint">${localize("power.climate_power_hint", lang)}</div>
        ${this._renderList("climate_power", this.climatePowerSensors)}
        ${this.climatePowerSensors.size > 0
          ? html`
              <div class="threshold-row">
                <ha-textfield
                  type="number"
                  min="0"
                  step="1"
                  suffix="W"
                  .label=${localize("power.idle_threshold", lang)}
                  .value=${String(this.climateIdlePowerW)}
                  @change=${this._onThresholdChange}
                ></ha-textfield>
                <div class="block-hint">${localize("power.idle_threshold_hint", lang)}</div>
              </div>
            `
          : nothing}
      </div>
    `;
  }

  private _renderList(kind: PowerKind, set: Set<string>) {
    const lang = this.hass.language;
    return html`
      <div class="row-list">
        ${set.size === 0
          ? html`<div class="empty-row">${localize("power.empty", lang)}</div>`
          : [...set].map((id) => this._renderEditRow(kind, id))}
      </div>
      ${this._picker === kind
        ? html`
            <div class="picker-row">
              <ha-entity-picker
                .hass=${this.hass}
                .includeDomains=${["sensor"]}
                .entityFilter=${this._powerEntityFilter(kind)}
                .value=${""}
                .autofocus=${true}
                label=${localize("devices.add_entity", lang)}
                @value-changed=${(e: CustomEvent) => this._onPickerChanged(kind, e)}
              ></ha-entity-picker>
              <ha-icon-button
                class="remove-btn"
                .path=${"M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"}
                @click=${() => (this._picker = null)}
              ></ha-icon-button>
            </div>
          `
        : html`
            <button type="button" class="add-button" @click=${() => (this._picker = kind)}>
              <ha-icon icon="mdi:plus"></ha-icon>
              ${localize("devices.add_entity", lang)}
            </button>
          `}
    `;
  }

  private _renderEditRow(kind: PowerKind, entityId: string) {
    const st = this.hass.states[entityId];
    const friendly = (st?.attributes?.friendly_name as string) || entityId;
    const watts = this._formatWatts(st?.state, st?.attributes?.unit_of_measurement as string);
    return html`
      <div class="row">
        <div class="row-info">
          <span class="row-name" @click=${() => openEntityInfo(this, entityId)}>${friendly}</span>
          <span class="row-eid">${entityId}</span>
        </div>
        ${watts ? html`<span class="value-chip">${watts}</span>` : nothing}
        <ha-icon-button
          class="remove-btn"
          .path=${"M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"}
          @click=${() => this._remove(kind, entityId)}
        ></ha-icon-button>
      </div>
    `;
  }

  private _formatWatts(state: string | undefined, unit: string | undefined): string {
    if (!state || state === "unknown" || state === "unavailable") return "";
    const n = Number(state);
    if (!Number.isFinite(n)) return "";
    const u = (unit || "W").toLowerCase();
    if (u === "kw") return `${(n * 1000).toFixed(0)} W`;
    return `${n.toFixed(0)} W`;
  }

  private _powerEntityFilter = (kind: PowerKind) => (entity: { entity_id: string }): boolean => {
    const id = entity.entity_id;
    if (!id.startsWith("sensor.")) return false;
    const st = this.hass.states[id];
    if (!st) return false;
    if (this.auxHeatSensors.has(id) || this.climatePowerSensors.has(id)) return false;
    const dc = st.attributes?.device_class;
    const unit = (st.attributes?.unit_of_measurement as string | undefined)?.toLowerCase();
    const isPower = dc === "power" || unit === "w" || unit === "kw";
    if (!isPower) return false;
    void kind;
    return true;
  };

  private _onPickerChanged(kind: PowerKind, e: CustomEvent) {
    const id = (e.detail?.value as string) || "";
    if (!id) return;
    const next = new Set(kind === "aux_heat" ? this.auxHeatSensors : this.climatePowerSensors);
    next.add(id);
    this._fire(kind, [...next]);
    this._picker = null;
  }

  private _remove(kind: PowerKind, entityId: string) {
    const next = new Set(kind === "aux_heat" ? this.auxHeatSensors : this.climatePowerSensors);
    next.delete(entityId);
    this._fire(kind, [...next]);
  }

  private _onThresholdChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const raw = parseFloat(target.value);
    const value = Number.isFinite(raw) && raw >= 0 ? raw : 0;
    this.dispatchEvent(
      new CustomEvent("power-changed", {
        detail: { key: "climate_idle_power_w", value },
        bubbles: true,
        composed: true,
      }),
    );
  };

  private _fire(kind: PowerKind, value: string[]) {
    const key = kind === "aux_heat" ? "aux_heat_sensors" : "climate_power_sensors";
    this.dispatchEvent(
      new CustomEvent("power-changed", {
        detail: { key, value },
        bubbles: true,
        composed: true,
      }),
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "rs-power-section": RsPowerSection;
  }
}
