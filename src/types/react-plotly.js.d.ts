declare module "react-plotly.js" {
  import { Component } from "react";
  import Plotly from "plotly.js";

  export interface PlotProps {
    data: any[];
    layout?: any;
    config?: any;
    style?: React.CSSProperties;
    onInitialized?: (figure: any) => void;
    onUpdate?: (figure: any) => void;
  }

  export default class Plot extends Component<PlotProps> {}
}
