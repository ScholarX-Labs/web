import { BunnyCdnTokenSigner } from "../src/lib/bunny/token-signer";

const signer = new BunnyCdnTokenSigner({ securityKey: process.env.BUNNY_CDN_TOKEN_AUTH_KEY! });
const url = new URL("https://vz-dac0e6fd-146.b-cdn.net/6dfb40d1-8ed8-4433-b588-2f00b552a4ee/playlist.m3u8");
const expiresAt = 1786257253; // From the user's report
const signed = signer.signUrl(url.href, expiresAt);
console.log("SIGNED URL:", signed.signedUrl);
