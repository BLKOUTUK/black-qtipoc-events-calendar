import axios from 'axios';
import crypto from 'crypto';

/**
 * Twitter posting service for BLKOUT Events
 * Posts approved events to Twitter/X with community platform introduction
 */
class TwitterService {
  private enabled: boolean;
  private bearerToken?: string;
  private apiKey?: string;
  private apiSecret?: string;
  private accessToken?: string;
  private accessSecret?: string;
  private communityUrl: string;

  constructor() {
    this.enabled = process.env.TWITTER_ENABLED === 'true';

    // Bearer Token (v2 API - simpler)
    this.bearerToken = process.env.TWITTER_BEARER_TOKEN;

    // OAuth 1.0a keys (v2 API - what BLKOUT has)
    this.apiKey = process.env.TWITTER_API_KEY;
    this.apiSecret = process.env.TWITTER_API_SECRET;
    this.accessToken = process.env.TWITTER_ACCESS_TOKEN;
    this.accessSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;

    // Community platform URL
    this.communityUrl = process.env.COMMUNITY_URL || 'https://blkoutuk.com';
  }

  async postEvent(event: any) {
    if (!this.enabled) {
      console.log('Twitter posting disabled');
      return { success: false, reason: 'disabled' };
    }

    // Check which authentication method is available
    const hasOAuth = this.apiKey && this.apiSecret && this.accessToken && this.accessSecret;
    const hasBearerToken = !!this.bearerToken;

    if (!hasOAuth && !hasBearerToken) {
      console.error('Twitter API credentials not configured');
      return { success: false, reason: 'not_configured' };
    }

    try {
      const tweetText = this.generateTweet(event);

      console.log('📱 Posting event to Twitter/X:', event.title);

      let response;

      if (hasOAuth) {
        console.log('Using OAuth 1.0a authentication');
        response = await this.postWithOAuth(tweetText);
      } else {
        console.log('Using Bearer Token authentication');
        response = await this.postWithBearerToken(tweetText);
      }

      const tweetId = response.data.data.id;
      const tweetUrl = `https://twitter.com/BLKOUTUK/status/${tweetId}`;

      console.log('✅ Posted event to Twitter:', tweetUrl);

      return {
        success: true,
        tweetId,
        url: tweetUrl
      };

    } catch (error: any) {
      console.error('❌ Twitter posting failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }

  private async postWithBearerToken(tweetText: string) {
    return await axios.post(
      'https://api.twitter.com/2/tweets',
      { text: tweetText },
      {
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
  }

  private async postWithOAuth(tweetText: string) {
    const url = 'https://api.twitter.com/2/tweets';
    const method = 'POST';

    // Generate OAuth 1.0a signature
    const oauthHeaders = this.generateOAuthHeaders(method, url);

    return await axios.post(url, { text: tweetText }, {
      headers: {
        ...oauthHeaders,
        'Content-Type': 'application/json'
      }
    });
  }

  private generateOAuthHeaders(method: string, url: string) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomBytes(32).toString('base64').replace(/\W/g, '');

    const parameters: Record<string, string> = {
      oauth_consumer_key: this.apiKey!,
      oauth_token: this.accessToken!,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: timestamp,
      oauth_nonce: nonce,
      oauth_version: '1.0'
    };

    // Create signature base string
    const parameterString = Object.keys(parameters)
      .sort()
      .map(key => `${this.percentEncode(key)}=${this.percentEncode(parameters[key])}`)
      .join('&');

    const signatureBaseString = `${method}&${this.percentEncode(url)}&${this.percentEncode(parameterString)}`;

    // Create signing key
    const signingKey = `${this.percentEncode(this.apiSecret!)}&${this.percentEncode(this.accessSecret!)}`;

    // Generate signature
    const signature = crypto
      .createHmac('sha1', signingKey)
      .update(signatureBaseString)
      .digest('base64');

    parameters.oauth_signature = signature;

    // Build Authorization header
    const authHeader = 'OAuth ' + Object.keys(parameters)
      .sort()
      .map(key => `${this.percentEncode(key)}="${this.percentEncode(parameters[key])}"`)
      .join(', ');

    return {
      'Authorization': authHeader
    };
  }

  private percentEncode(str: string): string {
    return encodeURIComponent(str)
      .replace(/!/g, '%21')
      .replace(/'/g, '%27')
      .replace(/\(/g, '%28')
      .replace(/\)/g, '%29')
      .replace(/\*/g, '%2A');
  }

  private generateTweet(event: any): string {
    // Format date nicely
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    // Add time if available
    let dateTimeStr = `📅 ${formattedDate}`;
    if (event.start_time) {
      dateTimeStr += ` at ${event.start_time}`;
    }

    // Build event URL
    const eventsUrl = `${this.communityUrl}/events`;

    // Community intro line
    const intro = "BLKOUTUK.COM The digital home for the UK's Black Queer Men, by Black Queer Men. Where Realness Lives";

    // Location line
    const locationStr = event.location ? `📍 ${event.location}` : '';

    // Hashtags
    const hashtags = this.selectHashtags(event);
    const hashtagString = hashtags.join(' ');

    // Twitter counts URLs as 23 chars
    const urlLength = 23;

    // Calculate available space for title
    // Format: intro\n\ntitle\ndateTime\nlocation\n\nurl\n\nhashtags
    const fixedParts = intro.length + dateTimeStr.length + locationStr.length +
                       hashtagString.length + urlLength + 10; // newlines and spaces
    const availableForTitle = 280 - fixedParts;

    let title = event.title;
    if (title.length > availableForTitle) {
      title = title.substring(0, availableForTitle - 3) + '...';
    }

    // Build the tweet
    const parts = [
      intro,
      '',  // blank line
      title,
      dateTimeStr
    ];

    if (locationStr) {
      parts.push(locationStr);
    }

    parts.push('');  // blank line
    parts.push(eventsUrl);
    parts.push('');  // blank line
    parts.push(hashtagString);

    return parts.join('\n').trim();
  }

  private selectHashtags(event: any): string[] {
    const coreHashtags = ['#BLKOUT', '#BlackQueer'];

    // Add tag-specific hashtags if available
    const tags = event.tags || [];
    const tagHashtags: Record<string, string> = {
      'community': '#Community',
      'arts': '#BlackArt',
      'culture': '#BlackCulture',
      'social': '#CommunityEvent',
      'meetup': '#Meetup',
      'workshop': '#Workshop',
      'party': '#PartyWithUs',
      'pride': '#BlackPride',
      'health': '#Wellness',
      'mental-health': '#MentalHealth'
    };

    // Add first matching tag hashtag
    for (const tag of tags) {
      const hashtag = tagHashtags[tag.toLowerCase()];
      if (hashtag) {
        return [...coreHashtags, hashtag];
      }
    }

    // Default: add Community
    return [...coreHashtags, '#Community'];
  }

  isConfigured(): boolean {
    const hasOAuth = !!(this.apiKey && this.apiSecret && this.accessToken && this.accessSecret);
    const hasBearerToken = !!this.bearerToken;
    return this.enabled && (hasOAuth || hasBearerToken);
  }
}

export default new TwitterService();
