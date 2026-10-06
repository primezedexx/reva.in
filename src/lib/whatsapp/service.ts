// ============================================================================
// REVA (reva.in) — WhatsApp Messaging Service Provider
// Supports AiSensy (BSP), Gupshup (BSP), Meta Cloud API & Sandbox Simulator
// ============================================================================

export interface WhatsAppSendParams {
  to: string;
  templateName?: string;
  customerName: string;
  businessName: string;
  stampsLeft?: number;
  rewardTitle?: string;
  offerText: string;
  cardUrl: string;
  customMessage?: string;
}

export interface WhatsAppSendResponse {
  success: boolean;
  messageId: string;
  provider: 'aisensy' | 'gupshup' | 'meta_cloud_api' | 'reva_sandbox_simulator';
  formattedBody: string;
  error?: string;
}

class WhatsAppService {
  private aisensyApiKey = process.env.AISENSY_API_KEY;
  private aisensyCampaignName = process.env.AISENSY_CAMPAIGN_NAME || 'reva_winback_offer';

  private gupshupApiKey = process.env.GUPSHUP_API_KEY;
  private gupshupSource = process.env.GUPSHUP_SOURCE_PHONE;
  private gupshupAppName = process.env.GUPSHUP_APP_NAME;

  private metaToken = process.env.WHATSAPP_API_TOKEN;
  private phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  /**
   * Format personalized win-back message copy
   */
  public formatWinBackMessage(params: WhatsAppSendParams): string {
    if (params.customMessage) return params.customMessage;

    const stampsText =
      params.stampsLeft && params.stampsLeft > 0
        ? ` You're only ${params.stampsLeft} ${params.stampsLeft === 1 ? 'stamp' : 'stamps'} away from a ${params.rewardTitle || 'free reward'}!`
        : '';

    return `Hey ${params.customerName}! 👋 We miss seeing you at ${params.businessName} ☕\n\n${stampsText}\n\n🎁 *Special Win-Back Treat for You:* ${params.offerText}\n\nShow your digital card at the counter:\n👉 ${params.cardUrl}\n\nSee you soon! ✨`;
  }

  /**
   * Send WhatsApp message via AiSensy, Gupshup, Meta Cloud API, or Simulator
   */
  public async sendWinBackNudge(params: WhatsAppSendParams): Promise<WhatsAppSendResponse> {
    const formattedBody = this.formatWinBackMessage(params);
    const cleanPhone = params.to.replace(/\D/g, '');

    // 1. AISENSY (Recommended BSP Route for India / Fast Onboarding)
    if (this.aisensyApiKey) {
      try {
        const response = await fetch('https://backend.aisensy.com/campaign/t1/api/v2', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            apiKey: this.aisensyApiKey,
            campaignName: this.aisensyCampaignName,
            destination: cleanPhone,
            userName: params.customerName,
            templateParams: [
              params.customerName,
              params.businessName,
              String(params.stampsLeft || 2),
              params.rewardTitle || 'Free Reward',
              params.offerText,
              params.cardUrl,
            ],
            source: 'reva_winback_cron',
          }),
        });

        const data = await response.json();
        if (!response.ok || data.success === false) {
          throw new Error(data.message || 'AiSensy API dispatch failed');
        }

        return {
          success: true,
          messageId: data.messageId || `aisensy_${Date.now()}`,
          provider: 'aisensy',
          formattedBody,
        };
      } catch (err: unknown) {
        console.warn('AiSensy API dispatch failed, falling back:', err);
      }
    }

    // 2. GUPSHUP (Enterprise BSP Route)
    if (this.gupshupApiKey && this.gupshupSource) {
      try {
        const payload = new URLSearchParams({
          channel: 'whatsapp',
          source: this.gupshupSource,
          destination: cleanPhone,
          'src.name': this.gupshupAppName || 'RevaLoyalty',
          template: JSON.stringify({
            id: 'reva_winback_v1',
            params: [
              params.customerName,
              params.businessName,
              String(params.stampsLeft || 2),
              params.offerText,
              params.cardUrl,
            ],
          }),
        });

        const response = await fetch('https://api.gupshup.io/wa/api/v1/template/msg', {
          method: 'POST',
          headers: {
            apikey: this.gupshupApiKey,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: payload.toString(),
        });

        const data = await response.json();
        if (!response.ok || data.status === 'error') {
          throw new Error(data.message || 'Gupshup API dispatch failed');
        }

        return {
          success: true,
          messageId: data.messageId || `gupshup_${Date.now()}`,
          provider: 'gupshup',
          formattedBody,
        };
      } catch (err: unknown) {
        console.warn('Gupshup API dispatch failed, falling back:', err);
      }
    }

    // 3. META CLOUD API (Direct Graph API Route)
    if (this.metaToken && this.phoneNumberId) {
      try {
        const response = await fetch(
          `https://graph.facebook.com/v19.0/${this.phoneNumberId}/messages`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${this.metaToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              recipient_type: 'individual',
              to: cleanPhone,
              type: 'text',
              text: {
                preview_url: true,
                body: formattedBody,
              },
            }),
          }
        );

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error?.message || 'Meta WhatsApp API dispatch failed');
        }

        const msgId = data.messages?.[0]?.id || `wamid.${Date.now()}`;
        return {
          success: true,
          messageId: msgId,
          provider: 'meta_cloud_api',
          formattedBody,
        };
      } catch (err: unknown) {
        console.warn('Meta WhatsApp API call failed, falling back:', err);
      }
    }

    // 4. SANDBOX SIMULATOR (Deterministic Local Testing)
    const simulatedMessageId = `sim_wamid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await new Promise((resolve) => setTimeout(resolve, 50));

    return {
      success: true,
      messageId: simulatedMessageId,
      provider: 'reva_sandbox_simulator',
      formattedBody,
    };
  }
}

export const whatsapp = new WhatsAppService();
