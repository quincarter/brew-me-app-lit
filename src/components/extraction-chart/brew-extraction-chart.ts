import { ExtractionChart } from "./ExtractionChart";

if (!customElements.get("brew-extraction-chart")) {
  customElements.define("brew-extraction-chart", ExtractionChart);
}
