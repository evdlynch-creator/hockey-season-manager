[[deployment.headers]]
path = "/*"

[deployment.headers.response]
"Content-Security-Policy" = "default-src 'self'; script-src 'self' 'unsafe-inline' https://blink.new https://cdn.blink.new blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; connect-src 'self' https://*.blink.new https://*.blinkpowered.com https://*.firebasestorage.app https://cdn.blink.new; font-src 'self' data: https:; frame-src 'self' https://*.blink.new; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;"
"X-Frame-Options" = "DENY"
"X-Content-Type-Options" = "nosniff"
"Strict-Transport-Security" = "max-age=31536000; includeSubDomains; preload"
"Server" = "Hidden"
