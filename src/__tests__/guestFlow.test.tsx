import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { generatePDF } from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import App from '../App';
import { getClient } from '../api';
import { ApiError } from '../api/client';
import { META } from '../api/mock/fixtures';
import { useFilters } from '../store/filtersStore';
import { useRankChanges } from '../store/rankChangesStore';
import { resetSession } from '../store/sessionStore';
import { clearAllStorage } from '../storage/storage';

jest.setTimeout(30_000);

const mock = getClient('mock');
const WAIT = { timeout: 5_000 };

beforeEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
  clearAllStorage();
  resetSession();
  useFilters.setState({ minScore: 0, industries: [], halls: [], categories: [], savedOnly: false, sortBy: 'score', search: '' });
  useRankChanges.setState({ previous: null });
});

async function openForm() {
  await render(<App />);
  await fireEvent.press(await screen.findByTestId('find-my-stalls', {}, WAIT));
  await screen.findByText('Try a sample profile', {}, WAIT);
}

async function startWithSample(id = 'sample-fabrication-owner') {
  await openForm();
  await fireEvent.press(screen.getByTestId(`sample-${id}`));
  await fireEvent.press(screen.getByTestId('submit-profile'));
  await fireEvent.press(await screen.findByTestId('view-results', {}, WAIT));
  await waitFor(() => expect(screen.getByTestId('latency-badge')).toHaveTextContent(/^\d+\.\d\d s · Demo data$/), WAIT);
}

describe('guest flow (demo data)', () => {
  it('goes from landing to sample profile to ranked results with a latency badge', async () => {
    await startWithSample();
    expect(screen.getByText('Demo data')).toBeTruthy();
    expect(screen.getByTestId('result-count')).toHaveTextContent(/^Showing (\d+) of \1$/);
    expect(screen.getByText(/^#1 · Hall 1 · L[A-F] \d+$/)).toBeTruthy();
    expect(screen.getByText(/^Your top \d+$/)).toBeTruthy();
  });

  it('shows the matching screen with the timer before the results', async () => {
    await openForm();
    await fireEvent.press(screen.getByTestId('sample-sample-fabrication-owner'));
    expect(screen.getByText(/^Filled in Rajesh Kumar's details\./)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('submit-profile'));
    expect(await screen.findByText("Matching Rajesh's profile", {}, WAIT)).toBeTruthy();
    await screen.findByTestId('view-results', {}, WAIT);
    expect(screen.getByTestId('match-timer')).toHaveTextContent(/^\d+\.\d\d s$/);
    expect(screen.getByText(/using demo data\.$/)).toBeTruthy();
  });

  it('shows the sample profiles from meta, three first and the rest on demand', async () => {
    await openForm();
    expect(screen.getAllByText('Use this sample')).toHaveLength(3);
    await fireEvent.press(screen.getByTestId('show-all-samples'));
    expect(screen.getAllByText('Use this sample')).toHaveLength(META.sampleProfiles.length);
  });

  it('blocks submit and shows inline errors when required fields are missing', async () => {
    const create = jest.spyOn(mock, 'createGuest');
    await openForm();
    await fireEvent.press(screen.getByTestId('submit-profile'));
    expect(await screen.findByText('Please enter your name')).toBeTruthy();
    expect(screen.getByText('Pick at least one interest')).toBeTruthy();
    expect(create).not.toHaveBeenCalled();
  });

  it('filters by booth row, shows the chip, and clears', async () => {
    await startWithSample();
    const total = screen.getByTestId('result-count').props.children.at(-1);

    await fireEvent.press(screen.getByTestId('open-filters'));
    const rowOption = screen.getAllByLabelText(/^Row L[A-F]$/)[0];
    const row = (rowOption.props.accessibilityLabel as string).replace('Row ', '');
    await fireEvent.press(rowOption);
    await fireEvent.press(screen.getByTestId('apply-filters'));

    const metas = screen.getAllByText(/^#\d+ · Hall 1 · /);
    expect(metas.length).toBeGreaterThan(0);
    for (const m of metas) expect(m).toHaveTextContent(new RegExp(` ${row} \\d+$`));
    expect(screen.getByLabelText(`Remove filter Row ${row}`)).toBeTruthy();

    await fireEvent.press(screen.getByText('Clear all'));
    expect(screen.getByTestId('result-count')).toHaveTextContent(`Showing ${total} of ${total}`);
  });

  it('shows an empty state with "Clear filters" when search matches nothing', async () => {
    await startWithSample();
    await fireEvent.changeText(screen.getByTestId('search'), 'zzzz-nothing');
    expect(screen.getByText('No stalls match these filters')).toBeTruthy();
    await fireEvent.press(screen.getByText('Clear filters'));
    expect(screen.queryByText('No stalls match these filters')).toBeNull();
  });

  it('opens the stall detail sheet with the score breakdown', async () => {
    await startWithSample();
    await fireEvent.press(screen.getAllByLabelText(/^Rank 1\./)[0]);
    expect(await screen.findByText(/^Why this is a \d+% match$/)).toBeTruthy();
    expect(screen.getByLabelText(/^Semantic similarity: \d+ percent/)).toBeTruthy();
    expect(screen.getByLabelText(/^You to stall \d+ percent\. Stall to you \d+ percent\.$/)).toBeTruthy();
    expect(screen.getByTestId('detail-map')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Next exhibitor'));
    expect(screen.getByText(/· Rank #2 of \d+ exhibitors$/)).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Previous exhibitor'));
    expect(screen.getByText(/· Rank #1 of \d+ exhibitors$/)).toBeTruthy();
  });

  it('shows saved stalls as numbered stops on the map and opens one', async () => {
    await startWithSample();
    await fireEvent.press(screen.getAllByLabelText(/^Save .* to visit list$/)[0]);
    await fireEvent.press(screen.getByText('Map'));
    expect(await screen.findByText('Hall 1 map', {}, WAIT)).toBeTruthy();
    const stop = await screen.findByLabelText(/^Stop 1, .*, booth L[A-F] \d+$/, {}, WAIT);
    expect(screen.getByText('Your route · 1 stop')).toBeTruthy();
    await fireEvent.press(stop);
    expect(await screen.findByText(/^Why this is a \d+% match$/)).toBeTruthy();
  });

  it('sends one request for a rapid double tap on bookmark, then plans a route and exports a PDF', async () => {
    const add = jest.spyOn(mock, 'addBookmark');
    await startWithSample();

    const saveButtons = screen.getAllByLabelText(/^Save .* to visit list$/);
    const first = saveButtons[0];
    const name = first.props.accessibilityLabel.replace(/^Save (.*) to visit list$/, '$1');
    await fireEvent.press(first);
    await fireEvent.press(first);
    await fireEvent.press(saveButtons[1]);
    await waitFor(() => expect(add).toHaveBeenCalledTimes(2), WAIT);

    await fireEvent.press(screen.getByText('Visit list'));
    expect(await screen.findByText(name, {}, WAIT)).toBeTruthy();
    expect(screen.getByText('2 stalls · swipe left to remove')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('plan-route'));
    expect(screen.getAllByText(/^Hall 1, Row L[A-F] · \d (stop|stops)$/).length).toBeGreaterThan(0);

    await fireEvent.press(screen.getByTestId('download-pdf'));
    await waitFor(() => expect(Share.open).toHaveBeenCalledTimes(1), WAIT);
    const html = (generatePDF as jest.Mock).mock.calls[0][0].html as string;
    expect(html).toContain('Rajesh Kumar');
    expect(html).toContain('2 stalls');
  });

  it('disables route and PDF with a hint when nothing is saved', async () => {
    await startWithSample();
    await fireEvent.press(screen.getByText('Visit list'));
    expect(await screen.findByText('Your visit list is empty')).toBeTruthy();
    expect(screen.getByText('Save at least one stall to plan a route or download a PDF.')).toBeTruthy();
    expect(screen.getByTestId('plan-route')).toBeDisabled();
    expect(screen.getByTestId('download-pdf')).toBeDisabled();
  });

  it('re-ranks after editing the profile and shows rank-change badges', async () => {
    await startWithSample();
    await fireEvent.press(screen.getByText('Profile'));
    await fireEvent.press(await screen.findByText('Edit my details'));
    await fireEvent.press(await screen.findByLabelText('Procurement interests: Quantum Technologies', {}, WAIT));
    await fireEvent.press(screen.getByLabelText('Procurement interests: Laser Safety'));
    await fireEvent.press(screen.getByTestId('submit-profile'));

    await waitFor(
      () => expect(screen.getAllByLabelText(/^(Up \d+ places|Down \d+ places|New in your list)$/).length).toBeGreaterThan(0),
      WAIT,
    );
  });

  it('shows an error state with Retry when the engine fails', async () => {
    jest.spyOn(mock, 'getRecommendations').mockRejectedValue(new ApiError('SERVER', 'Engine exploded', 500));
    await openForm();
    await fireEvent.press(screen.getByTestId('sample-sample-research-lab'));
    await fireEvent.press(screen.getByTestId('submit-profile'));
    await screen.findByText("Couldn't load your matches", {}, { timeout: 8_000 });
    expect(screen.getByText('Retry')).toBeTruthy();
    expect(screen.getByText('Engine exploded')).toBeTruthy();
  });
});
