import { config } from 'dotenv';
config();
import * as crypto from 'crypto';

async function main() {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const accountNameMatch = connectionString!.match(/AccountName=([^;]+)/);
  const accountKeyMatch = connectionString!.match(/AccountKey=([^;]+)/);
  const endpointSuffixMatch = connectionString!.match(/EndpointSuffix=([^;]+)/);

  const accountName = accountNameMatch ? accountNameMatch[1] : '';
  const accountKey = accountKeyMatch ? accountKeyMatch[1] : '';
  const endpointSuffix = endpointSuffixMatch ? endpointSuffixMatch[1] : 'core.windows.net';

  const container = 'certificates';
  const key = 'certificates/SX-14PN-3HR1-A608-K7FT-9XHX-8W2R-HK/scholarx-v2/certificate.pdf';

  const baseUrl = 'https://' + accountName + '.blob.' + endpointSuffix + '/' + container + '/' + key;
  const expiresOn = new Date(Date.now() + 300 * 1000);

  const signedPermissions = 'r';
  const signedStart = '';
  const signedExpiry = expiresOn.toISOString().substring(0, 19) + 'Z';
  const canonicalizedResource = '/blob/' + accountName + '/' + container + '/' + key;
  const signedIdentifier = '';
  const signedIP = '';
  const signedProtocol = 'https';
  const signedVersion = '2025-01-05';
  const rscc = '';
  const rscd = 'attachment; filename=\"certificate.pdf\"';
  const rsce = '';
  const rscl = '';
  const rsct = 'application/pdf';

  const stringToSign = [
    signedPermissions,
    signedStart,
    signedExpiry,
    canonicalizedResource,
    signedIdentifier,
    signedIP,
    signedProtocol,
    signedVersion,
    rscc,
    rscd,
    rsce,
    rscl,
    rsct
  ].join('\n');

  const keyBuffer = Buffer.from(accountKey, 'base64');
  const signature = crypto.createHmac('sha256', keyBuffer).update(stringToSign, 'utf8').digest('base64');

  const queryParams = new URLSearchParams({
    sv: signedVersion,
    se: signedExpiry,
    sr: 'b',
    sp: signedPermissions,
    spr: signedProtocol,
    sig: signature,
    rscd: rscd,
    rsct: rsct,
  });

  const signedUrl = baseUrl + '?' + queryParams.toString();
  console.log('Blob:', container + '/' + key, 'expires:', expiresOn.toISOString());

  const res = await fetch(signedUrl, { cache: 'no-store' });
  console.log('Status:', res.status, res.statusText);
  if (!res.ok) {
    console.log('Error Body:', await res.text());
    process.exitCode = 1;
  } else {
    console.log('Success, length:', (await res.arrayBuffer()).byteLength);
  }
}
main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

