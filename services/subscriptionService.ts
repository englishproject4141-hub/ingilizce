import Purchases, { ENTITLEMENT_MODE } from 'react-native-purchases';
import { Platform } from 'react-native';

const REVENUECAT_API_KEY_IOS = 'goog_placeholder_ios';
const REVENUECAT_API_KEY_ANDROID = 'goog_placeholder_android';

export const subscriptionService = {
  /**
   * RevenueCat SDK'sını ilklendirir
   */
  async initialize(userId: string) {
    try {
      if (Platform.OS === 'ios') {
        Purchases.configure({ apiKey: REVENUECAT_API_KEY_IOS, appUserID: userId });
      } else if (Platform.OS === 'android') {
        Purchases.configure({ apiKey: REVENUECAT_API_KEY_ANDROID, appUserID: userId });
      }
      console.log('[Subscription] RevenueCat initialized for user:', userId);
    } catch (e) {
      console.error('[Subscription] Initialization error:', e);
    }
  },

  /**
   * Kullanıcının premium durumunu kontrol eder
   */
  async checkPremiumStatus(): Promise<boolean> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      // 'premium' entitlement ismini RevenueCat panelinde tanımlamanız gerekir
      return !!customerInfo.entitlements.active['premium'];
    } catch (e) {
      console.error('[Subscription] Check status error:', e);
      return false;
    }
  },

  /**
   * Satın alma ekranını açar (veya mevcut paketleri getirir)
   */
  async getOfferings() {
    try {
      const offerings = await Purchases.getOfferings();
      return offerings.current;
    } catch (e) {
      console.error('[Subscription] Get offerings error:', e);
      return null;
    }
  }
};
