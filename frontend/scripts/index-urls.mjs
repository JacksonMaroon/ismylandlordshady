#!/usr/bin/env node
/**
 * Google Instant Indexing API Script
 *
 * Notifies Google to crawl and index updated URLs for NYCLandlordCheck.
 *
 * SETUP INSTRUCTIONS:
 * 1. Go to Google Cloud Console (https://console.cloud.google.com)
 * 2. Create a new project or select an existing one
 * 3. Enable "Web Search Indexing API" (Indexing API)
 * 4. Create a Service Account and download the JSON key
 * 5. In Google Search Console for your domain, add the service account email as Owner
 * 6. Set environment variable:
 *    - GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
 *    - OR GOOGLE_SERVICE_ACCOUNT_KEY with the JSON contents (for CI/Vercel)
 *
 * Usage:
 *   node scripts/index-urls.mjs                    # Index all default URLs
 *   node scripts/index-urls.mjs --url https://...  # Index specific URL
 *   node scripts/index-urls.mjs --type URL_DELETED # Notify of URL removal
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DEFAULT_SITE_URL = 'https://www.nyclandlordcheck.com';
const SITE_URL = (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL).trim();
const INDEXING_API_ENDPOINT = 'https://indexing.googleapis.com/v3/urlNotifications:publish';

const URL_PATHS = [
  '/',
  '/about',
  '/api',
  '/data-sources',
  '/leaderboard/buildings',
  '/leaderboard/landlords',
  '/map',
  '/methodology',
  '/neighborhoods',
  '/privacy',
  '/violations/recent',
];

const URLS_TO_INDEX = URL_PATHS.map((urlPath) => new URL(urlPath, SITE_URL).toString());

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const req = https.request(
      {
        hostname: urlObj.hostname,
        path: `${urlObj.pathname}${urlObj.search}`,
        method: 'GET',
        headers: {
          'User-Agent': 'NYCLandlordCheck-Indexer/1.0',
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        });
      },
    );

    req.on('error', reject);
    req.end();
  });
}

function parseSitemapLocs(xml) {
  const locs = [];
  const regex = /<loc>([^<]+)<\/loc>/g;
  let match = regex.exec(xml);
  while (match) {
    locs.push(match[1].trim());
    match = regex.exec(xml);
  }
  return locs;
}

async function getSitemapUrls() {
  const sitemapUrl = new URL('/sitemap.xml', SITE_URL).toString();

  try {
    const xml = await fetchUrl(sitemapUrl);
    const locs = parseSitemapLocs(xml);
    if (!locs.length) {
      return null;
    }

    const nestedSitemaps = locs.filter((loc) => loc.endsWith('.xml'));
    if (!nestedSitemaps.length) {
      return locs;
    }

    const nestedUrls = [];
    for (const nested of nestedSitemaps) {
      try {
        const nestedXml = await fetchUrl(nested);
        nestedUrls.push(...parseSitemapLocs(nestedXml));
      } catch (error) {
        console.warn(`Failed to fetch nested sitemap ${nested}: ${error.message}`);
      }
    }

    return nestedUrls.length ? nestedUrls : locs;
  } catch (error) {
    console.warn(`Failed to fetch sitemap: ${error.message}`);
    return null;
  }
}

function base64urlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function createJWT(credentials) {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/indexing',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const base64Header = base64urlEncode(JSON.stringify(header));
  const base64Payload = base64urlEncode(JSON.stringify(payload));
  const signatureInput = `${base64Header}.${base64Payload}`;

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signatureInput);
  const signature = sign
    .sign(credentials.private_key, 'base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `${signatureInput}.${signature}`;
}

async function getAccessToken(credentials) {
  const jwt = createJWT(credentials);

  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }).toString();

    const options = {
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.access_token) {
            resolve(response.access_token);
          } else {
            reject(new Error(`Token error: ${JSON.stringify(response)}`));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function indexUrl(accessToken, url, type = 'URL_UPDATED') {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      url,
      type,
    });

    const urlObj = new URL(INDEXING_API_ENDPOINT);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({ url, status: res.statusCode, response });
        } catch (error) {
          resolve({ url, status: res.statusCode, response: data });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function loadCredentials() {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try {
      return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    } catch (error) {
      console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY:', error.message);
    }
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      const content = fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to load credentials file:', error.message);
    }
  }

  const localPath = path.join(__dirname, '..', 'google-credentials.json');
  if (fs.existsSync(localPath)) {
    try {
      const content = fs.readFileSync(localPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to load local credentials:', error.message);
    }
  }

  return null;
}

async function runIndexing() {
  console.log('Google Instant Indexing API\n');

  const args = process.argv.slice(2);
  let specificUrl = null;
  let indexType = 'URL_UPDATED';

  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--url' && args[i + 1]) {
      specificUrl = args[i + 1];
      i += 1;
    } else if (args[i] === '--type' && args[i + 1]) {
      indexType = args[i + 1];
      i += 1;
    }
  }

  let urlsToIndex = specificUrl ? [specificUrl] : URLS_TO_INDEX;
  if (!specificUrl) {
    const sitemapUrls = await getSitemapUrls();
    if (sitemapUrls && sitemapUrls.length) {
      urlsToIndex = Array.from(new Set(sitemapUrls)).filter(
        (url) => url.startsWith('http') && !url.endsWith('.xml'),
      );
      console.log(`Loaded ${urlsToIndex.length} URL(s) from sitemap.`);
    } else {
      console.log('Using default URL list (sitemap unavailable).');
    }
  }
  const credentials = loadCredentials();

  if (!credentials) {
    const domain = new URL(SITE_URL).hostname;
    console.log('No credentials found. Running in dry-run mode.\n');
    console.log('To enable indexing, set up credentials as described in this script.\n');
    console.log('URLs that would be indexed:');
    urlsToIndex.forEach((url) => console.log(`  - ${url}`));
    console.log(`\nType: ${indexType}`);
    console.log('\n--- Setup Instructions ---');
    console.log('1. Go to Google Cloud Console (https://console.cloud.google.com)');
    console.log('2. Create a project and enable "Web Search Indexing API"');
    console.log('3. Create a Service Account (IAM & Admin > Service Accounts)');
    console.log('4. Download the JSON key file');
    console.log(`5. Go to Google Search Console for ${domain}`);
    console.log('6. Add the service account email as Owner (Settings > Users)');
    console.log('7. Set one of these environment variables:');
    console.log('   - GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json');
    console.log('   - GOOGLE_SERVICE_ACCOUNT_KEY=\'{"type":"service_account",...}\'');
    return;
  }

  console.log(`Service account: ${credentials.client_email}`);
  console.log(`Indexing ${urlsToIndex.length} URL(s)...\n`);

  try {
    const accessToken = await getAccessToken(credentials);
    console.log('Access token obtained\n');

    const results = [];
    for (const url of urlsToIndex) {
      try {
        const result = await indexUrl(accessToken, url, indexType);
        results.push(result);

        if (result.status === 200) {
          console.log(`[OK] ${url}`);
        } else {
          console.log(`[${result.status}] ${url}: ${JSON.stringify(result.response)}`);
        }
      } catch (error) {
        console.log(`[ERROR] ${url}: ${error.message}`);
        results.push({ url, status: 'error', error: error.message });
      }
    }

    console.log('\n--- Summary ---');
    const successful = results.filter((result) => result.status === 200).length;
    console.log(`Indexed: ${successful}/${urlsToIndex.length}`);

    if (successful < urlsToIndex.length) {
      console.log('\nNote: Failed requests may be due to quota limits or verification issues.');
      console.log('Check that the service account is added as Owner in Search Console.');
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

runIndexing().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
