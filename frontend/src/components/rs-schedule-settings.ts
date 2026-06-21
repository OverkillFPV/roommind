import { html, css, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { ScheduleEntry, ClimateMode } from "../types";
import { localize } from "../utils/localize";
import {
  formatTemp,
  tempUnit,
  toDisplay,
  toCelsius,
  tempStep,
  tempRange,
} from "../utils/temperature";
import { RsScheduleBase } from "./shared/rs-schedule-base";
import { inputStyles } from "../styles/input-styles";

@customElement("rs-schedule-settings")
export class RsScheduleSettings extends RsScheduleBase {
  @property({ attribute: false }) public schedules: ScheduleEntry[] = [];
  /** Alias: parent passes .scheduleSelectorEntity, base uses selectorEntity. */
  @property({ type: String }) public set scheduleSelectorEntity(v: string) {
    this.selectorEntity = v;
  }
  public get scheduleSelectorEntity(): string {
    return this.selectorEntity;
  }
  /** Alias: parent passes .activeScheduleIndex, base uses activeIndex. */
  @property({ type: Number }) public set activeScheduleIndex(v: number) {
    this.activeIndex = v;
  }
  public get activeScheduleIndex(): number {
    return this.activeIndex;
  }
  @property({ type: Number }) public comfortHeat = 21.0;
  @property({ type: Number }) public comfortCool = 24.0;
  @property({ type: Number }) public ecoHeat = 17.0;
  @property({ type: Number }) public ecoCool = 27.0;
  @property({ type: String }) public climateMode: ClimateMode = "auto";

  static styles = [
    RsScheduleBase.sharedStyles,
    inputStyles,
    css`
      .fallback-hint {
        font-size: 11px;
        color: var(--secondary-text-color);
        margin-top: 4px;
        font-style: italic;
      }

      .temp-inputs {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-top: 16px;
      }

      .temp-input-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .temp-field {
        display: flex;
        flex-direction: column;
        background: var(--secondary-background-color, rgba(255, 255, 255, 0.06));
        border-radius: 8px;
        padding: 6px 12px 8px;
        min-height: 48px;
        box-sizing: border-box;
        justify-content: center;
        border: 1px solid var(--outline-color, var(--divider-color, rgba(255, 255, 255, 0.12)));
      }

      .temp-field-label {
        font-size: 11px;
        color: var(--secondary-text-color);
        margin-bottom: 2px;
        user-select: none;
      }

      .temp-field-row {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .temp-field-input {
        flex: 1;
        background: none;
        border: none;
        outline: none;
        color: var(--primary-text-color);
        font-size: 14px;
        font-family: inherit;
        min-width: 0;
        -moz-appearance: textfield;
        padding: 0;
      }

      .temp-field-input::-webkit-outer-spin-button,
      .temp-field-input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }

      .temp-field-suffix {
        color: var(--secondary-text-color);
        font-size: 13px;
        flex-shrink: 0;
      }

      .view-temps {
        display: flex;
        gap: 16px;
        font-size: 13px;
        color: var(--secondary-text-color);
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid var(--divider-color, #eee);
      }

      .view-temps span {
        font-weight: 500;
        color: var(--primary-text-color);
      }

      .view-selector-info {
        font-size: 12px;
        color: var(--secondary-text-color);
        margin-top: 8px;
      }

      .temp-grid-auto {
        display: grid;
        grid-template-columns: auto 1fr 1fr;
        gap: 8px 12px;
        align-items: center;
        margin-top: 16px;
      }
      .temp-grid-header {
        font-size: 12px;
        font-weight: 600;
        color: var(--secondary-text-color);
        text-transform: uppercase;
        letter-spacing: 0.3px;
        text-align: center;
      }
      .temp-grid-row-label {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 13px;
        font-weight: 500;
        color: var(--secondary-text-color);
        white-space: nowrap;
      }

      @media (max-width: 600px) {
        .temp-grid-auto {
          grid-template-columns: 1fr 1fr;
        }
        .temp-grid-row-label {
          grid-column: 1 / -1;
          margin-top: 8px;
        }
        .temp-grid-header {
          display: none;
        }
      }
    `,
  ];

  render() {
    if (!this.editing) {
      return this._renderViewMode();
    }
    return this._renderEditMode();
  }

  // ─── View mode ─────────────────────────────────────────────────

  private _renderViewMode() {
    const l = this.hass.language;
    const hasMultiple = this.schedules.length >= 2;

    return html`
      ${this.schedules.length > 0
        ? html`
            <div class="schedule-list">
              ${this.schedules.map((schedule, index) => {
                const state = this._getScheduleState(index, this.schedules.length);
                return html`
                  <div class="schedule-row ${state}">
                    ${hasMultiple
                      ? html`<span class="schedule-number">${index + 1}</span>`
                      : nothing}
                    <span class="schedule-status-dot"></span>
                    <span
                      class="schedule-name schedule-link"
                      @click=${() => this._openEntityInfo(schedule.entity_id)}
                      >${this._getFriendlyName(schedule.entity_id)}</span
                    >
                    <span class="schedule-status">${this._getStatusText(index, state)}</span>
                  </div>
                `;
              })}
            </div>
          `
        : html`<div class="no-schedules">${localize("schedule.no_schedules", l)}</div>`}
      ${this.climateMode === "auto"
        ? html`
            <div class="view-temps">
              ${localize("schedule.view_heat", l, {
                comfort: formatTemp(this.comfortHeat, this.hass),
                eco: formatTemp(this.ecoHeat, this.hass),
                unit: tempUnit(this.hass),
              })}
               · 
              ${localize("schedule.view_cool", l, {
                comfort: formatTemp(this.comfortCool, this.hass),
                eco: formatTemp(this.ecoCool, this.hass),
                unit: tempUnit(this.hass),
              })}
            </div>
          `
        : html`
            <div class="view-temps">
              ${localize("schedule.view_comfort", l, {
                temp: formatTemp(
                  this.climateMode === "cool_only" ? this.comfortCool : this.comfortHeat,
                  this.hass,
                ),
                unit: tempUnit(this.hass),
              })}
               · 
              ${localize("schedule.view_eco", l, {
                temp: formatTemp(
                  this.climateMode === "cool_only" ? this.ecoCool : this.ecoHeat,
                  this.hass,
                ),
                unit: tempUnit(this.hass),
              })}
            </div>
          `}
      ${this.scheduleSelectorEntity
        ? html`<div class="view-selector-info">
            ${localize("schedule.view_selector_prefix", l)}
            <span
              class="schedule-link"
              @click=${() => this._openEntityInfo(this.scheduleSelectorEntity!)}
              >${this._getFriendlyName(this.scheduleSelectorEntity)}</span
            >
          </div>`
        : nothing}
    `;
  }

  // ─── Edit mode ─────────────────────────────────────────────────

  private _renderEditMode() {
    const l = this.hass.language;
    const count = this.schedules.length;
    const usedIds = new Set(this.schedules.map((s) => s.entity_id));

    return html`
      ${this._renderScheduleList()}
      ${this._renderAddRow(
        localize("schedule.select_schedule", l),
        this._getAvailableEntities(usedIds),
        (eid) => this._addSchedule(eid),
        localize("schedule.create_helper_hint", l),
      )}
      ${this._renderSelectorSection(
        count,
        localize("schedule.selector_label", l),
        this.scheduleSelectorEntity ? this._getSelectorValueText(l) : "",
        localize("schedule.selector_warning", l),
        (value) => this._onSelectorEntityChange(value),
      )}
      ${this._renderTemperatureInputs(l)}
    `;
  }

  // ─── Temperature input helper ─────────────────────────────

  private _renderTempInput(
    valueCelsius: number,
    handler: (e: Event) => void,
    label = "",
  ) {
    const displayVal = String(toDisplay(valueCelsius, this.hass));
    const suffix = tempUnit(this.hass);
    const step = tempStep(this.hass);
    const { min, max } = tempRange(5, 35, this.hass);
    return html`<div class="temp-field">
      ${label ? html`<span class="temp-field-label">${label}</span>` : nothing}
      <div class="temp-field-row">
        <input
          class="temp-field-input"
          type="number"
          .value=${displayVal}
          min=${min}
          max=${max}
          step=${step}
          @change=${handler}
        />
        <span class="temp-field-suffix">${suffix}</span>
      </div>
    </div>`;
  }

  // ─── Schedule list ─────────────────────────────────────────────

  private _renderScheduleList() {
    const l = this.hass.language;
    const count = this.schedules.length;

    if (count === 0) {
      return html`<div class="no-schedules">${localize("schedule.no_schedules", l)}</div>`;
    }

    return html`
      <div class="schedule-list">
        ${this.schedules.map((schedule, index) => {
          const state = this._getScheduleState(index, count);
          return html`
            <div class="schedule-row ${state}">
              ${count >= 2 ? html`<span class="schedule-number">${index + 1}</span>` : nothing}
              <span class="schedule-status-dot"></span>
              <span class="schedule-name">${this._getFriendlyName(schedule.entity_id)}</span>
              <span class="schedule-status">${this._getStatusText(index, state)}</span>
              ${this._renderScheduleControls(
                index,
                count,
                (i, dir) => this._moveSchedule(i, dir),
                (i) => this._removeSchedule(i),
              )}
            </div>
          `;
        })}
      </div>
    `;
  }

  // ─── Temperature inputs ────────────────────────────────────────

  private _renderTemperatureInputs(l: string) {
    if (this.climateMode === "auto") {
      return html`
        <div class="temp-grid-auto">
          <div class="temp-grid-header"></div>
          <div class="temp-grid-header">${localize("schedule.column_comfort", l)}</div>
          <div class="temp-grid-header">${localize("schedule.column_eco", l)}</div>
          <div class="temp-grid-row-label">
            <ha-icon icon="mdi:fire" style="--mdc-icon-size:16px"></ha-icon>
            ${localize("schedule.row_heat", l)}
          </div>
          ${this._renderTempInput(this.comfortHeat, this._onComfortHeatChange)}
          ${this._renderTempInput(this.ecoHeat, this._onEcoHeatChange)}
          <div class="temp-grid-row-label">
            <ha-icon icon="mdi:snowflake" style="--mdc-icon-size:16px"></ha-icon>
            ${localize("schedule.row_cool", l)}
          </div>
          ${this._renderTempInput(this.comfortCool, this._onComfortCoolChange)}
          ${this._renderTempInput(this.ecoCool, this._onEcoCoolChange)}
        </div>
      `;
    }

    return html`
      <div class="temp-inputs">
        <div class="temp-input-group">
          ${this._renderTempInput(
            this.climateMode === "cool_only" ? this.comfortCool : this.comfortHeat,
            this.climateMode === "cool_only" ? this._onComfortCoolChange : this._onComfortHeatChange,
            localize("schedule.comfort_label", l),
          )}
        </div>
        <div class="temp-input-group">
          ${this._renderTempInput(
            this.climateMode === "cool_only" ? this.ecoCool : this.ecoHeat,
            this.climateMode === "cool_only" ? this._onEcoCoolChange : this._onEcoHeatChange,
            localize("schedule.eco_label", l),
          )}
        </div>
      </div>
      <div class="fallback-hint">${localize("schedule.comfort_hint", l)}</div>
    `;
  }

  // ─── Selector value text ───────────────────────────────────────

  private _getSelectorValueText(l: string): string {
    const selectorState = this.hass?.states?.[this.scheduleSelectorEntity];
    if (!selectorState) return "";
    if (this.scheduleSelectorEntity.startsWith("input_boolean.")) {
      return localize("schedule.selector_value_boolean", l, {
        value: selectorState.state === "on" ? "On" : "Off",
      });
    }
    return localize("schedule.selector_value_number", l, {
      value: selectorState.state,
    });
  }

  // ─── Status text (temperature-specific) ────────────────────────

  private _getStatusText(index: number, state: "active" | "inactive" | "unreachable"): string {
    const l = this.hass.language;

    if (state === "unreachable") return localize("schedule.state_unreachable", l);
    if (state === "inactive") return localize("schedule.state_inactive", l);

    const schedule = this.schedules[index];
    const entityState = this.hass?.states?.[schedule.entity_id];
    if (!entityState) return localize("schedule.state_active", l);

    const isOn = entityState.state === "on";
    if (isOn) {
      const attrs = entityState.attributes ?? {};
      const blockTemp = attrs.temperature as number | undefined;
      if (blockTemp != null) {
        return localize("schedule.from_schedule", l, {
          temp: String(blockTemp),
          unit: tempUnit(this.hass),
        });
      }
      const heatTemp = attrs.heat_temperature as number | undefined;
      const coolTemp = attrs.cool_temperature as number | undefined;
      if (heatTemp != null || coolTemp != null) {
        return localize("schedule.from_schedule_split", l, {
          heat: String(heatTemp ?? this.comfortHeat),
          cool: String(coolTemp ?? this.comfortCool),
          unit: tempUnit(this.hass),
        });
      }
      return localize("schedule.fallback", l, {
        temp: formatTemp(
          this.climateMode === "cool_only" ? this.comfortCool : this.comfortHeat,
          this.hass,
        ),
        unit: tempUnit(this.hass),
      });
    }

    return localize("schedule.eco_detail", l, {
      temp: formatTemp(this.climateMode === "cool_only" ? this.ecoCool : this.ecoHeat, this.hass),
      unit: tempUnit(this.hass),
    });
  }

  // ─── Schedule management ───────────────────────────────────────

  private _addSchedule(entityId: string) {
    this._emitSchedules([...this.schedules, { entity_id: entityId }]);
  }

  private _removeSchedule(index: number) {
    this._emitSchedules(this.schedules.filter((_, i) => i !== index));
  }

  private _moveSchedule(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= this.schedules.length) return;
    const next = [...this.schedules];
    [next[index], next[target]] = [next[target], next[index]];
    this._emitSchedules(next);
  }

  private _emitSchedules(value: ScheduleEntry[]) {
    this.dispatchEvent(
      new CustomEvent("schedules-changed", {
        detail: { value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _onSelectorEntityChange(value: string) {
    this.dispatchEvent(
      new CustomEvent("schedule-selector-changed", {
        detail: { value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  // ─── Temperature change handlers ──────────────────────────────

  private _onComfortHeatChange(e: Event) {
    const target = e.target as HTMLElement & { value: string };
    const val = toCelsius(parseFloat(target.value) || toDisplay(21.0, this.hass), this.hass);
    this.dispatchEvent(
      new CustomEvent("comfort-heat-changed", {
        detail: { value: val },
        bubbles: true,
        composed: true,
      }),
    );
    if (this.comfortCool < val) {
      this.dispatchEvent(
        new CustomEvent("comfort-cool-changed", {
          detail: { value: val },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  private _onComfortCoolChange(e: Event) {
    const target = e.target as HTMLElement & { value: string };
    const val = toCelsius(parseFloat(target.value) || toDisplay(24.0, this.hass), this.hass);
    this.dispatchEvent(
      new CustomEvent("comfort-cool-changed", {
        detail: { value: val },
        bubbles: true,
        composed: true,
      }),
    );
    if (this.comfortHeat > val) {
      this.dispatchEvent(
        new CustomEvent("comfort-heat-changed", {
          detail: { value: val },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  private _onEcoHeatChange(e: Event) {
    const target = e.target as HTMLElement & { value: string };
    const val = toCelsius(parseFloat(target.value) || toDisplay(17.0, this.hass), this.hass);
    this.dispatchEvent(
      new CustomEvent("eco-heat-changed", {
        detail: { value: val },
        bubbles: true,
        composed: true,
      }),
    );
    if (this.ecoCool < val) {
      this.dispatchEvent(
        new CustomEvent("eco-cool-changed", {
          detail: { value: val },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  private _onEcoCoolChange(e: Event) {
    const target = e.target as HTMLElement & { value: string };
    const val = toCelsius(parseFloat(target.value) || toDisplay(27.0, this.hass), this.hass);
    this.dispatchEvent(
      new CustomEvent("eco-cool-changed", {
        detail: { value: val },
        bubbles: true,
        composed: true,
      }),
    );
    if (this.ecoHeat > val) {
      this.dispatchEvent(
        new CustomEvent("eco-heat-changed", {
          detail: { value: val },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "rs-schedule-settings": RsScheduleSettings;
  }
}
