import { ListRow } from "./ListRow";

if (!customElements.get("brew-list-row")) {
  customElements.define("brew-list-row", ListRow);
}
