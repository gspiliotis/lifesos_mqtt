class Subscription {
  /**
   * Topic to subscribe to.
   */
  readonly topic: string;

  /**
   * Called when a message is received.
   */
  readonly onMessage: (subscription: Subscription, message: string) => void;

  /**
   * Quality of service.
   */
  readonly qos: 0 | 1 | 2;

  /**
   * Arguments that may be relevant when processing message.
   */
  readonly args: any; // eslint-disable-line @typescript-eslint/no-explicit-any

  constructor(
    topic: string,
    onMessage: (subscription: Subscription, message: string) => void,
    args: any = undefined, // eslint-disable-line @typescript-eslint/no-explicit-any
    qos: 0 | 1 | 2 = 1,
  ) {
    this.topic = topic;
    this.onMessage = onMessage;
    this.qos = qos;
    this.args = args;
  }
}

export default Subscription;
