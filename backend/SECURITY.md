# Security Configuration

## Overview

The StellarStream backend implements production-grade security measures to protect the API from common vulnerabilities and unauthorized access.

## Implemented Security Features

### 1. CORS (Cross-Origin Resource Sharing)

Restricts which domains can access the API to prevent unauthorized cross-origin requests.

**Configuration:**
- Controlled via `FRONTEND_URL` environment variable
- Supports multiple origins (comma-separated)
- Default: `http://localhost:5173` (development)
- Credentials enabled for authenticated requests
- Allowed methods: GET, POST, PUT, DELETE, OPTIONS
- Allowed headers: Content-Type, Authorization

**Example:**
```env
# Single origin
FRONTEND_URL=https://app.stellarstream.io

# Multiple origins
FRONTEND_URL=https://app.stellarstream.io,https://staging.stellarstream.io
```

### 2. Helmet.js Security Headers

Implements secure HTTP headers to protect against common web vulnerabilities.

**Protections Enabled:**

- **Content Security Policy (CSP)**: Prevents XSS attacks by controlling resource loading
- **HTTP Strict Transport Security (HSTS)**: Forces HTTPS connections
  - Max age: 1 year
  - Includes subdomains
  - Preload enabled
- **X-Content-Type-Options**: Prevents MIME-type sniffing
- **X-Frame-Options**: Prevents clickjacking attacks
- **X-XSS-Protection**: Enables browser XSS filtering
- **Referrer-Policy**: Controls referrer information
- **Permissions-Policy**: Restricts browser features

## Production Deployment

### Environment Variables

Ensure these variables are set in production:

```env
NODE_ENV=production
FRONTEND_URL=https://your-production-domain.com
PORT=3000
```

### Security Checklist

- [ ] Set `FRONTEND_URL` to your production domain(s)
- [ ] Enable HTTPS/TLS on your server
- [ ] Set `NODE_ENV=production`
- [ ] Use environment variables for sensitive data
- [ ] Implement rate limiting (recommended)
- [ ] Enable API authentication/authorization
- [ ] Set up monitoring and logging
- [ ] Regular security audits

## Testing CORS

Test CORS configuration:

```bash
# Should succeed (allowed origin)
curl -H "Origin: https://your-frontend-domain.com" \
  -H "Access-Control-Request-Method: GET" \
  -X OPTIONS http://localhost:3000/health

# Should fail (blocked origin)
curl -H "Origin: https://malicious-site.com" \
  -H "Access-Control-Request-Method: GET" \
  -X OPTIONS http://localhost:3000/health
```

## Security Headers Verification

Check security headers in production:

```bash
curl -I https://api.stellarstream.io/health
```

Expected headers:
- `Strict-Transport-Security`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Content-Security-Policy`

## Additional Recommendations

1. **Rate Limiting**: Consider adding `express-rate-limit` to prevent abuse
2. **API Authentication**: Implement JWT or API key authentication
3. **Input Validation**: Validate all user inputs
4. **SQL Injection Protection**: Use Prisma's parameterized queries (already implemented)
5. **Logging**: Implement security event logging
6. **Monitoring**: Set up alerts for suspicious activity

## References

- [Helmet.js Documentation](https://helmetjs.github.io/)
- [CORS Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [OWASP Security Guidelines](https://owasp.org/www-project-top-ten/)
