declare module "pdfkit/js/pdfkit.standalone.js" {
  import { EventEmitter } from "events";

  export default class PDFDocument extends EventEmitter {
    constructor(options?: Record<string, unknown>);
    addPage(options?: Record<string, unknown>): this;
    end(): void;
    rect(x: number, y: number, width: number, height: number): this;
    roundedRect(x: number, y: number, width: number, height: number, radius: number): this;
    fill(color?: string): this;
    stroke(): this;
    fillAndStroke(fillColor?: string, strokeColor?: string): this;
    fillColor(color: string): this;
    strokeColor(color: string): this;
    font(name: string): this;
    fontSize(size: number): this;
    text(text: string, x?: number, y?: number, options?: Record<string, unknown>): this;
    moveTo(x: number, y: number): this;
    lineTo(x: number, y: number): this;
  }
}
