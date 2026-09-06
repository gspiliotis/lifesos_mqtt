import { Enum, FlagEnum, IntEnum } from '../src/Enums';

const TestFlags = Object.freeze({
  Foo: 0x01,
  Bar: 0x02,
  Baz: 0x04,
  Qux: 0x08,
} as const) satisfies Enum;

const TestEnum = Object.freeze({
  Foo: 0x01,
  Bar: 0x02,
  Baz: 0x03,
  Qux: 0x04,
} as const) satisfies Enum;

describe('IntEnum', () => {
  test('getKey', () => {
    const subject = new IntEnum(TestEnum, 0x3);
    expect(subject.value).toBe(0x3);
    expect(subject.string).toBe('Baz');
  });
});

describe('FlagEnum', () => {
  test('getKeys 0xF', () => {
    const subject = new FlagEnum(TestFlags, 0x3);
    expect(subject.value).toBe(0x3);
    expect(subject.string).toBe('Foo|Bar');
  });

  test('has', () => {
    const subject = new FlagEnum(TestFlags, 0x3);
    expect(subject.has(TestFlags.Bar)).toBe(true);
    expect(subject.has(TestFlags.Qux)).toBe(false);
  });
});
