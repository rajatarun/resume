/**
 * The settings page's trip editor (components/admin/trips/tripForm.ts): what
 * Save sends, what stops a save, and what a dropped file opens as.
 */
import {
  emptyFood,
  emptyPlace,
  emptyStay,
  emptyTrip,
  emptyVisit,
  normalizeTrip,
  suggestId,
  toPayload,
  tripCounts,
  tripFromFile,
  validateTrip,
  type Trip,
} from '../components/admin/trips/tripForm';

const lakeTrip = (): Trip => ({
  ...emptyTrip(),
  id: '2016-05-lake-weekend',
  title: '  Lake Weekend ',
  startDate: '2016-05-20',
  endDate: '2016-05-22',
  highlights: ['Wildflowers', '', '  Trout  '],
  places: [
    {
      ...emptyPlace(),
      city: 'Lakeview',
      region: 'Oregon',
      countryCode: 'us',
      lat: 42.19,
      lng: -120.35,
      visited: [{ name: 'Old Mill Trail', note: '' }, emptyVisit()],
      food: [
        { ...emptyFood(), name: 'Dockside Grill', rating: 5, review: ' Trout. ' },
        emptyFood(),
      ],
      stays: [
        { ...emptyStay(), name: 'Pine Cabin', checkIn: '2016-05-20', nights: 2 },
        emptyStay(),
      ],
    },
  ],
});

describe('the trip editor', () => {
  it('saves trimmed text and drops the rows left blank', () => {
    const body = toPayload(lakeTrip());
    expect(body.title).toBe('Lake Weekend');
    expect(body.highlights).toEqual(['Wildflowers', 'Trout']);
    const [lake] = body.places;
    expect(lake.countryCode).toBe('US');
    expect(lake.visited).toEqual([{ name: 'Old Mill Trail', note: null }]);
    expect(lake.food.map((f) => [f.name, f.review])).toEqual([['Dockside Grill', 'Trout.']]);
    expect(lake.stays.map((s) => s.name)).toEqual(['Pine Cabin']);
  });

  it('says what stops a save, and where', () => {
    expect(validateTrip(lakeTrip())).toEqual([]);
    const bad = lakeTrip();
    bad.id = 'has space';
    bad.endDate = '2016-05-01';
    bad.places[0].countryCode = 'USA';
    bad.places[0].lng = null;
    bad.places[0].stays[0].nights = 0;
    expect(validateTrip(bad)).toEqual([
      expect.stringMatching(/^Trip id/),
      'End date is before the start date.',
      'Town 1 (Lakeview): country code is two letters, like US.',
      'Town 1 (Lakeview): give both latitude and longitude, or neither.',
      'Town 1 (Lakeview), stay 1: nights is 1 to 365.',
    ]);
  });

  it('suggests an id in the journal pattern', () => {
    expect(suggestId('Alaska Fall Lights', '2024-09-13')).toBe('2024-09-alaska-fall-lights');
    expect(suggestId(null, null)).toBe('trip');
  });

  it('opens one trip from a file, and refuses a whole journal', () => {
    const trip = tripFromFile({ id: 'x1', title: 'X', places: [{ city: 'A' }] });
    expect(trip.places[0].food).toEqual([]); // lists filled in for the form
    expect(tripFromFile({ trips: [{ id: 'x2' }] }).id).toBe('x2');
    expect(() => tripFromFile({ years: [] })).toThrow(/not one trip/);
    expect(() => tripFromFile({ trips: [{ id: 'a' }, { id: 'b' }] })).toThrow(/not one trip/);
  });

  it('counts what a trip tells, for the list', () => {
    expect(tripCounts(normalizeTrip(lakeTrip()))).toEqual({
      towns: 1,
      visited: 2,
      food: 2,
      stays: 2,
    });
  });
});
