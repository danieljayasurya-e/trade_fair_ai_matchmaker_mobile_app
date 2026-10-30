import { fireEvent, render, screen } from '@testing-library/react-native';
import type { Recommendation } from '../../../api/schemas';
import { ResultCard } from '../ResultCard';

const item: Recommendation = {
  rank: 3,
  score: 87,
  matchedOn: [],
  reason: 'Offers PLCs.',
  factors: { semantic: 0.5, interest: 0.5, intent: 0.5, buyerFit: 1, g2e: 0.5, e2g: 1 },
  exhibitor: {
    id: 'ex-1',
    name: 'An Exhibitor With A Very Long Name That Should Be Truncated Cleanly On Small Phones',
    description: '',
    products: ['A', 'B', 'C', 'D', 'E'],
    industries: [],
    hall: 'B',
    booth: 'B-12',
  },
};

describe('ResultCard', () => {
  it('renders rank, score, booth and chips', async () => {
    await render(<ResultCard item={item} saved={false} onPress={jest.fn()} onToggleSave={jest.fn()} />);
    expect(screen.getByText('#3')).toBeTruthy();
    expect(screen.getByText('87%')).toBeTruthy();
    expect(screen.getByText('Hall B · Booth B-12')).toBeTruthy();
    // Three product chips plus an overflow chip.
    expect(screen.getByText('+2')).toBeTruthy();
    expect(screen.getByText('General match')).toBeTruthy();
  });

  it('calls onToggleSave from the bookmark button', async () => {
    const onToggleSave = jest.fn();
    await render(<ResultCard item={item} saved={false} onPress={jest.fn()} onToggleSave={onToggleSave} />);
    await fireEvent.press(screen.getByLabelText(`Save ${item.exhibitor.name} to visit list`));
    expect(onToggleSave).toHaveBeenCalledWith(item);
  });
});
