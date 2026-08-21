/// <reference types="vite/client" />
declare module "*.vue" { import type { DefineComponent } from "vue"; const c: DefineComponent; export default c }

// Video.js v10 custom elements
declare namespace JSX {
  interface IntrinsicElements {
    "live-video-player": unknown
    "live-video-skin": unknown
    "hls-video": unknown
  }
}
