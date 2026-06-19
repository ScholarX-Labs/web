## 2024-06-19 - [Fix Timing Attack on Internal API Key]
**Vulnerability:** Comparing sensitive strings like API keys (`process.env.INTERNAL_API_KEY`) using standard string equality (`===`) exposes the application to timing attacks, as attackers can deduce the key character by character based on response times.
**Learning:** This existed because standard string equality terminates early upon finding a mismatched character, creating a measurable time difference.
**Prevention:** Always use `crypto.timingSafeEqual` for sensitive secret comparisons. First convert inputs to `Buffer`s, verify their byte lengths are identical (`buf1.length === buf2.length`), and handle missing environment variables securely without falling back to empty strings (`""`) which could lead to bypasses.
