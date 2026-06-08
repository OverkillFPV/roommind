import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { inputStyles } from "../../styles/input-styles";
import "./rs-info-icon";

@customElement("rs-threshold-field")
export class RsThresholdField extends LitElement {
  @property({ type: String }) public label = "";
  @property({ type: String }) public suffix = "";
  @property({ type: Number }) public value: number | undefined;
  @property({ type: Number }) public min: number | undefined;
  @property({ type: Number }) public max: number | undefined;
  @property({ type: Number }) public step: number | undefined;
  @property({ type: String }) public hint = "";

  // Resolved once on first render: true = use ha-input (HA 2026.5+),
  // false = use ha-textfield (older HA).
  @state() private _useHaInput = !customElements.get("ha-textfield");

  static styles = [
    inputStyles,
    css`
      :host {
        display: block;
      }

      .row {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      ha-textfield,
      ha-input {
        display: block;
        flex: 1;
        min-width: 0;
        width: 100%;
      }

      rs-info-icon {
        flex-shrink: 0;
      }
    `,
  ];

  render() {
    const inputEl = this._useHaInput
      ? html`<ha-input
          .type=${"number"}
          .value=${this.value != null ? String(this.value) : ""}
          .label=${this.label}
          .min=${this.min != null ? this.min : undefined}
          .max=${this.max != null ? this.max : undefined}
          .step=${this.step != null ? this.step : undefined}
          .withoutSpinButtons=${true}
          @input=${this._onInput}
        >
          ${this.suffix
            ? html`<span slot="end" style="color:var(--secondary-text-color)"
                >${this.suffix}</span
              >`
            : nothing}
        </ha-input>`
      : html`<ha-textfield
          .label=${this.label}
          .suffix=${this.suffix}
          .value=${this.value != null ? String(this.value) : ""}
          .min=${this.min != null ? String(this.min) : ""}
          .max=${this.max != null ? String(this.max) : ""}
          .step=${this.step != null ? String(this.step) : ""}
          type="number"
          @input=${this._onInput}
        ></ha-textfield>`;

    return html`
      <div class="row">
        ${inputEl}
        ${this.hint ? html`<rs-info-icon .text=${this.hint}></rs-info-icon>` : nothing}
      </div>
    `;
  }

  private _onInput(e: Event) {
    const val = parseFloat((e.target as HTMLInputElement).value);
    if (!isNaN(val)) {
      this.dispatchEvent(
        new CustomEvent("value-changed", {
          detail: val,
          bubbles: true,
          composed: true,
        }),
      );
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "rs-threshold-field": RsThresholdField;
  }
}
