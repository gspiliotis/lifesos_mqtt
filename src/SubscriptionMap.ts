import Subscription from './Subscription';

class SubscriptionMap extends Map<string, Subscription> {
  add(subscription: Subscription): this {
    return super.set(subscription.topic, subscription);
  }
}

export default SubscriptionMap;
