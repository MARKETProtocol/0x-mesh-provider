import WebSocket from 'ws';
import { ethers } from 'ethers';

const listenersFor = (provider, eventType) => {
  const { listeners } = provider;

  if (!listeners[eventType]) {
    listeners[eventType] = [];
  }

  return listeners[eventType];
};

export class 0xMeshProvider {
  constructor(providerUrl) {
    this.providerUrl = providerUrl;
    this.listeners = {};

    this.connect();
  }

  /**
   * The most recent block number (block height) this provider has seen and has triggered events
   * for. If no block has been seen, this is null.
   */
  get blockNumber() {
    return null; // TODO Pending https://github.com/0xProject/0x-mesh/issues/201
  }

  /**
   * The id of the current chain / network.
   *
   * NOTE: This is pending https://github.com/0xProject/0x-mesh/issues/201 and currently returns
   * `1` in all situations.
   */
  get chainId() {
    return 1;
  }

  /**
   * Returns a boolean indicating if the websocket connection is currently active.
   */
  get connected() {
    if (!this.webSocket) {
      return false;
    }

    return this.webSocket.readyState === WebSocket.OPEN;
  }

  /**
   * The name of the current chain / network.
   *
   * NOTE: This is pending https://github.com/0xProject/0x-mesh/issues/201 and currently returns
   * `mainnet` in all situations.
   */
  get name() {
    return 'mainnet';
  }

  /**
   * Alias for `connected`.
   */
  get polling() {
    return this.connected;
  }

  get pollingInterval() {
    return 0;
  }

  /**
   * Provided for compatibiity with ethers.js Provider spec. If set to `false` when `true`, the
   * websocket will be disconnected. If set to `true` when `false` the websocket will be connected.
   */
  set polling(bool) {
    if (this.connectionStatus === 'disconnected') {
      this.connect();
    } else if (this.connectionStatus === 'connected') {
      this.disconnect();
    }
  }

  /**
   * Attempts to connect the websocket to the provided 0x Mesh endpoint.
   */
  async connect() {
    if (this.webSocket) {
      if (this.connected) {
        await this.disconnect;
      }

      if (this.webSocket.readyState === WebSocket.CONNECTING) {
        await this.onConnect();
        return;
      }

      delete this.webSocket;
    }

    this.webSocket = new WebSocket(this.providerUrl);
    this.websocket.on('open', () => {
      this.trigger('open');
    });

    this.websocket.on('message', (data) => {
      this.handleMessage(data);
    });

    this.websocket.on('error', (data) => {
      console.error('ERROR', data);
      this.trigger('error', data);
    });

    await this.onConnect();
  }

  /**
   * Attempts to disconnect the websocket.
   */
  async disconnect() {
    if (!this.webSocket) {
      return;
    }

    this.webSocket.terminate();
  }


  async getBlockNumber() {
    return this.blockNumber;
  }

  async getNetwork() {
    return ethers.utils.getNetwork(this.chainId);
  }

  handleMessage(data) {
    try {
      const message = JSON.decode(data);
      this.trigger('subscription', data);
    } catch (e) {
      console.error('ERROR decoding message', e);
      this.trigger('error', e);
    }
  }

  listenerCount(eventType = undefined) {
    if (eventName) {
      const listeners = listenersFor(this, eventType);
      return listeners.length;
    } else {
      return this.listeners.values().flat().length;
    }
  }

  on(eventType, callback) {
    const listeners = listenersFor(this, eventType);
    const frequency = 'repeat';
    listeners.push({ callback, frequency });
    return this;
  }

  once(eventType, callback) {
    const listeners = listenersFor(this, eventType);
    const frequency = 'once';
    listeners.push({ callback, frequency });
    return this;
  }

  onConnect() {
    return new Promise((resolve) => {
      this.on('connect', () => { resolve(); });
    });
  }

  removeListener(eventType, callbackToRemove) {
    const listeners = listenersFor(this, eventType);

    const index = listeners.findIndex(({ callback }) => {
      return callback === callbackToRemove;
    });

    if (index > -1) {
      listeners.splice(index, 1);
      return true;
    } else {
      return false;
    }
  }

  removeAllListeners(eventType) {
    delete this.listeners[eventType];
  }

  trigger(eventType, ...args) {
    const listeners = listenersFor(this, eventType);
    listeners.forEach(({ callback, frequency }) => {
      if (frequency === 'once') {
        this.removeListener(eventType, callback);
      }

      callback(...args);
    });
  }
}
