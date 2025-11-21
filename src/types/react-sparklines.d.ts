declare module 'react-sparklines' {
  import { Component } from 'react';

  export interface SparklinesProps {
    data: number[];
    width?: number;
    height?: number;
    margin?: number;
    min?: number;
    max?: number;
    style?: React.CSSProperties;
    preserveAspectRatio?: string;
    viewBox?: string;
    children?: React.ReactNode;
  }

  export interface SparklinesLineProps {
    color?: string;
    style?: React.CSSProperties;
  }

  export class Sparklines extends Component<SparklinesProps> {}
  export class SparklinesLine extends Component<SparklinesLineProps> {}
}

