import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import RacialTraitModal from './RacialTraitModal';

describe('RacialTraitModal', () => {
  it('should display correct description for Mask of the Wild', () => {
    render(
      <RacialTraitModal
        isOpen={true}
        onClose={() => {}}
        traitName="Mask of the Wild"
        raceName="Wood Elf"
      />
    );

    expect(screen.getByText(/You can attempt to hide even when you are only lightly obscured/)).toBeInTheDocument();
  });

  it('should display correct description for Fleet of Foot', () => {
    render(
      <RacialTraitModal
        isOpen={true}
        onClose={() => {}}
        traitName="Fleet of Foot"
        raceName="Wood Elf"
      />
    );

    expect(screen.getByText(/Your base walking speed increases to 35 feet/)).toBeInTheDocument();
  });

  it('should display fallback message for unknown traits', () => {
    render(
      <RacialTraitModal
        isOpen={true}
        onClose={() => {}}
        traitName="Unknown Trait"
        raceName="Test Race"
      />
    );

    expect(screen.getByText(/This racial trait provides special abilities or bonuses to Test Race characters/)).toBeInTheDocument();
  });
});