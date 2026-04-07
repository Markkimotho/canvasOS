export interface GenerateOptions {
  prompt: string;
  negativePrompt?: string | undefined;
  width?: number | undefined;
  height?: number | undefined;
  n?: number | undefined; // 1–8 variants
  seed?: number | undefined;
  styleReference?: Blob | undefined; // drag-drop reference image
  model?: string | undefined;
}

export interface InpaintOptions {
  prompt: string;
  negativePrompt?: string | undefined;
  image: Blob;
  mask: Blob; // white = paint region
  feathering?: number | undefined;
  width?: number | undefined;
  height?: number | undefined;
  seed?: number | undefined;
}

export interface GenerateResult {
  images: Blob[];
  seeds: number[];
  model: string;
  provider: string;
}

export interface AIProvider {
  id: string;
  name: string;
  generate(options: GenerateOptions): Promise<GenerateResult>;
  inpaint?(options: InpaintOptions): Promise<GenerateResult>;
  isAvailable(): Promise<boolean>;
}
