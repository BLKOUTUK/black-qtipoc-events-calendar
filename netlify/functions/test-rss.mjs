
import { handler } from './aggregate-rss-feeds.ts';

const testEvent = {
  httpMethod: 'POST',
  queryStringParameters: {},
  headers: {},
  body: null
};

const testContext = {};

console.log('🧪 Testing RSS feed aggregation...');
handler(testEvent, testContext)
  .then(result => {
    console.log('✅ Function completed');
    console.log('Status:', result.statusCode);
    console.log('Result:', JSON.parse(result.body));
  })
  .catch(error => {
    console.error('❌ Function failed:', error);
  });
