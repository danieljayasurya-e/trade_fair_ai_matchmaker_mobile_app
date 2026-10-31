import { fireEvent, render, screen } from '@testing-library/react-native';
import type { Recommendation } from '../../../api/schemas';
import { ResultCard } from '../ResultCard';

const item: Recommendation = {
  rank: 3,
  score: 87,
  matchedOn: [],
  reason: 'Offers cutters.',
  insights: [{ label: 'General match', why: 'General overlap.' }],
  factors: { semantic: 0.5, interest: 0.5, intent: 0.5, buyerFit: 1, g2e: 0.5, e2g: 1 },
  exhibitor: {
    id: 'ex-1',
    name: 'An Exhibitor With A Very Long Name That Should Be Truncated Cleanly On Small Phones',
    description: '',
    products: ['A', 'B'],
    tags: [],
    industries: [],
    hall: 'LB',
    booth: 'LB 12',
    otherBooths: [],
    city: '',
    country: '',
  },
};

describe('ResultCard', () => {
  it('renders rank, score, booth and the fallback chip', async () => {
    await render(<ResultCard item={item} saved={false} onPress={jest.fn()} onToggleSave={jest.fn()} />);
    expect(screen.getByText(/^#3 · Hall 1 · LB 12$/)).toBeTruthy();
    expect(screen.getByLabelText('87 percent match')).toBeTruthy();
    expect(screen.getByText('General match')).toBeTruthy();
  });

  it('shows two matched-on chips and an overflow chip', async () => {
    await render(<ResultCard item={{ ...item, matchedOn: ['A', 'B', 'C', 'D'] }} saved={false} onPress={jest.fn()} onToggleSave={jest.fn()} />);
    expect(screen.getByText('A')).toBeTruthy();
    expect(screen.getByText('B')).toBeTruthy();
    expect(screen.queryByText('C')).toBeNull();
    expect(screen.getByText('+2')).toBeTruthy();
  });

  it('calls onToggleSave from the bookmark button', async () => {
    const onToggleSave = jest.fn();
    await render(<ResultCard item={item} saved={false} onPress={jest.fn()} onToggleSave={onToggleSave} />);
    await fireEvent.press(screen.getByLabelText(`Save ${item.exhibitor.name} to visit list`));
    expect(onToggleSave).toHaveBeenCalledWith(item);
  });
});
