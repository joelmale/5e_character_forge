declare module '@3d-dice/dice-box' {
  export interface DiceBoxConfig {
    id?: string;
    container?: string;
    assetPath?: string;
    theme?: string;
    offscreen?: boolean;
    scale?: number;
    gravity?: number;
    mass?: number;
    friction?: number;
    restitution?: number;
    linearDamping?: number;
    angularDamping?: number;
    spinForce?: number;
    throwForce?: number;
    startingHeight?: number;
    settleTimeout?: number;
    delay?: number;
    enableShadows?: boolean;
    lightIntensity?: number;
  }

  export interface DiceRollResult {
    qty: number;
    sides: number;
    value: number;
    groupId: number;
    rollId: string;
    theme: string;
  }

  export interface RollOptions {
    values?: number[];
    theme?: string;
    newStartPoint?: boolean;
  }

  export default class DiceBox {
    constructor(config: DiceBoxConfig);

    init(): Promise<void>;

    roll(
      notation: string | string[],
      options?: RollOptions
    ): Promise<DiceRollResult[]>;

    clear(): void;

    updateConfig(config: Partial<DiceBoxConfig>): void;

    onRollComplete?: (results: DiceRollResult[]) => void;

    hide(): void;

    show(): void;
  }
}
