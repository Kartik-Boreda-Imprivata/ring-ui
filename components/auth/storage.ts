import Storage, {StorageClass, StorageInterface} from '../storage/storage';

import {AuthUser} from './auth__core';
import {AuthResponse} from './response-parser';

/**
 * @typedef {Object} StoredToken
 * @property {string} accessToken
 * @property {string[]} scopes
 * @property {number} expires
 */

/**
 * @typedef {Object} StoredState
 * @property {Date} created
 * @property {string} restoreLocation
 * @property {string[]} scopes
 */

const DEFAULT_STATE_QUOTA = 102400; // 100 kb ~~ 200 tabs with a large list of scopes
// eslint-disable-next-line no-magic-numbers
const DEFAULT_STATE_TTL = 1000 * 60 * 60 * 24; // nobody will need auth state after a day
const UPDATE_USER_TIMEOUT = 1000;

export interface StoredToken {
  accessToken: string
  scopes: string[]
  expires: number
  lifeTime: number
}

export interface AuthState extends AuthResponse {
  restoreLocation: string
  scopes: string[]
  nonRedirect?: boolean | null | undefined
}

export interface StoredAuthState extends AuthState {
  created: number
}

export interface AuthStorageConfig {
  stateKeyPrefix?: string | null | undefined
  tokenKey?: string | null | undefined
  messagePrefix?: string | null | undefined
  userKey?: string | null | undefined
  stateTTL?: number | null | undefined
  storage?: StorageClass | null | undefined
  stateQuota?: number | null | undefined
}

interface StateRemovalResult {
  key: string
  created: number
  size: number
}

export interface AuthMessage {
  userID: string | undefined,
  serviceID: string
}

export default class AuthStorage {
  messagePrefix: string;
  stateKeyPrefix: string;
  tokenKey: string;
  userKey: string;
  stateTTL: number;
  stateQuota: number;
  private _lastMessage: unknown;
  private _stateStorage: StorageInterface<StoredAuthState>;
  private _tokenStorage: StorageInterface<StoredToken>;
  _messagesStorage: StorageInterface<AuthMessage>;
  private _currentUserStorage: StorageInterface<AuthUser>;
  /**
   * Custom storage for Auth
   * @param {{stateKeyPrefix: string, tokenKey: string, onTokenRemove: Function}} config
   */
  constructor(config: AuthStorageConfig) {
    this.messagePrefix = config.messagePrefix || '';
    this.stateKeyPrefix = config.stateKeyPrefix || '';
    this.tokenKey = config.tokenKey || '';
    this.userKey = config.userKey || 'user-key';
    this.stateTTL = config.stateTTL || DEFAULT_STATE_TTL;
    this._lastMessage = null;

    const StorageConstructor = config.storage || Storage;
    this.stateQuota = Math.min(
      config.stateQuota ||
      DEFAULT_STATE_QUOTA,
      StorageConstructor.QUOTA || Infinity
    );

    this._stateStorage = new StorageConstructor({
      cookieName: 'ring-state'
    });
    this._tokenStorage = new StorageConstructor({
      cookieName: 'ring-token'
    });
    this._messagesStorage = new StorageConstructor({
      cookieName: 'ring-message'
    });
    this._currentUserStorage = new StorageConstructor({
      cookieName: 'ring-user'
    });
  }

  /**
   * Add token change listener
   * @param {function(string)} fn Token change listener
   * @return {function()} remove listener function
   */
  onTokenChange(fn: (token: StoredToken | null) => void) {
    return this._tokenStorage.on(this.tokenKey, fn);
  }

  /**
   * Add state change listener
   * @param {string} stateKey State key
   * @param {function(string)} fn State change listener
   * @return {function()} remove listener function
   */
  onStateChange(stateKey: string, fn: (state: AuthState | null) => void) {
    return this._stateStorage.on(this.stateKeyPrefix + stateKey, fn);
  }

  /**
   * Add state change listener
   * @param {string} key State key
   * @param {function(string)} fn State change listener
   * @return {function()} remove listener function
   */
  onMessage(key: string, fn: (message: AuthMessage | null) => void) {
    return this._messagesStorage.on(this.messagePrefix + key, message => fn(message));
  }

  sendMessage(key: string, message: AuthMessage | null = null) {
    this._lastMessage = message;
    this._messagesStorage.set(this.messagePrefix + key, message);
  }

  /**
   * Save authentication request state.
   *
   * @param {string} id Unique state identifier
   * @param {StoredState} state State to store
   * @param {boolean=} dontCleanAndRetryOnFail If falsy then remove all stored states and try again to save state
   */
  async saveState(id: string, state: AuthState, dontCleanAndRetryOnFail?: boolean): Promise<void> {
    const storedState = {...state, created: Date.now()};

    try {
      await this._stateStorage.set(this.stateKeyPrefix + id, storedState);
    } catch (e) {
      if (!dontCleanAndRetryOnFail) {
        await this.cleanStates();
        return this.saveState(id, storedState, true);
      } else {
        throw e;
      }
    }
    return undefined;
  }

  /**
   * Remove all stored states
   *
   * @return {Promise} promise that is resolved when OLD states [and some selected] are removed
   */
  async cleanStates(removeStateId?: string) {
    const now = Date.now();

    const removalResult = await this._stateStorage.each<StateRemovalResult | void>(
      (key, state) => {
        if (state == null) {
          return undefined;
        }

        // Remove requested state
        if (key === this.stateKeyPrefix + removeStateId) {
          return this._stateStorage.remove(key);
        }

        if (key.indexOf(this.stateKeyPrefix) === 0) {
        // Clean old states
          if (state.created + this.stateTTL < now) {
            return this._stateStorage.remove(key);
          }

          // Data to clean up due quota
          return {
            key,
            created: state.created,
            size: JSON.stringify(state).length
          };
        }

        return undefined;
      });
    const currentStates =
      removalResult.filter((state): state is StateRemovalResult => state != null);

    let stateStorageSize = currentStates.
      reduce((overallSize, state) => state.size + overallSize, 0);

    if (stateStorageSize > this.stateQuota) {
      currentStates.sort((a, b) => a.created - b.created);

      const removalPromises = currentStates.filter(state => {
        if (stateStorageSize > this.stateQuota) {
          stateStorageSize -= state.size;
          return true;
        }

        return false;
      }).map(state => this._stateStorage.remove(state.key));

      return removalPromises.length && Promise.all(removalPromises);
    }

    return undefined;
  }

  /**
   * Get state by id and remove stored states from the storage.
   *
   * @param {string} id unique state identifier
   * @return {Promise.<StoredState>}
   */
  async getState(id: string): Promise<StoredAuthState | null> {
    try {
      const result = await this._stateStorage.get(this.stateKeyPrefix + id);
      await this.cleanStates(id);
      return result;
    } catch (e) {
      await this.cleanStates(id);
      throw e;
    }
  }

  /**
   * @param {StoredToken} token
   * @return {Promise} promise that is resolved when the token is saved
   */
  saveToken(token: StoredToken) {
    return this._tokenStorage.set(this.tokenKey, token);
  }

  /**
   * @return {Promise.<StoredToken>} promise that is resolved to the stored token
   */
  getToken(): Promise<StoredToken | null> {
    return this._tokenStorage.get(this.tokenKey);
  }

  /**
   * Remove stored token if any.
   * @return {Promise} promise that is resolved when the token is wiped.
   */
  wipeToken() {
    return this._tokenStorage.remove(this.tokenKey);
  }

  /**
   * @param {function} loadUser user loader
   * @return {Promise.<object>>} promise that is resolved to stored current user
   */
  async getCachedUser(loadUser: () => Promise<AuthUser | null>): Promise<AuthUser | null> {
    const user = await this._currentUserStorage.get(this.userKey);
    const loadAndCache = () => loadUser().then(response => {
      this._currentUserStorage.set(this.userKey, response);
      return response;
    });

    if (user && user.id) {
      setTimeout(loadAndCache, UPDATE_USER_TIMEOUT);
      return user;
    } else {
      return loadAndCache();
    }
  }

  /**
   * Remove cached user if any
   */
  wipeCachedCurrentUser() {
    return this._currentUserStorage.remove(this.userKey);
  }

  /**
   * Wipes cache if user has changed
   */
  onUserChanged() {
    this.wipeCachedCurrentUser();
  }
}