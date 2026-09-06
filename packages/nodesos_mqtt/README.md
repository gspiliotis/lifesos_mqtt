# NodeSOS MQTT (For Home Assistant)

[![Version][version-shield]][npm-link]
[![License][license-shield]](LICENSE.md)
[![Type definitions][type-definitions-shield]][npm-link]

This application provides an MQTT client that interfaces with
[LifeSOS](http://lifesos.com.tw) alarm system.
It will publish the state of all devices to an MQTT broker, which can
then be consumed by [Home Assistant](https://www.home-assistant.io). It will also subscribe to topics on the
broker that allow the control of the alarm system (e.g. arm, disarm) and
turn on/off device features (e.g. bypass, home guard etc.).

It was written for & tested with the LS-20/LS-30 model, though it should also
work on the LS-10 model.

---

This project is heavily inspired by the [LifeSOSpy_MQTT](https://github.com/rorr73/LifeSOSpy_MQTT)
project by rorr73.

[license-shield]: https://img.shields.io/npm/l/nodesos_mqtt
[npm-link]: https://img.shields.io/npm/v/nodesos_mqtt
[type-definitions-shield]: https://img.shields.io/npm/types/nodesos_mqtt
[version-shield]: https://img.shields.io/npm/v/nodesos_mqtt
