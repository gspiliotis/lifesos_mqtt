import PropertyChangedInfo from '../src/PropertyChangedInfo';

describe('PropertyChangedInfo', () => {
  test('constructor', () => {
    const change = new PropertyChangedInfo('foo', true, false);
    expect(change.name).toBe('foo');
    expect(change.oldValue).toBe(true);
    expect(change.newValue).toBe(false);
  });
});
