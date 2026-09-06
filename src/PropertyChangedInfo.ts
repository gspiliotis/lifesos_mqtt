/**
 * Provides details for a property change.
 */
class PropertyChangedInfo {
  /**
   * Name of the property that was changed.
   */
  name: string;

  /**
   * The new property value.
   */
  oldValue: unknown;

  /**
   * The old property value.
   */
  newValue: unknown;

  constructor(name: string, oldValue: unknown, newValue: unknown) {
    this.name = name;
    this.oldValue = oldValue;
    this.newValue = newValue;
  }
}

export default PropertyChangedInfo;
