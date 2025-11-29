# Respuesta sobre Bypass de Restricciones Geográficas de Hyperliquid

**Pregunta:** Can we bypass one more challenge? HL doesn't allow operation from a few places like Dubai, so we use VPN. Is there a way you can bypass it with our system? Or would it have to work exactly the same as HL?

## Respuesta:

**Current Situation:**
Right now, API calls are made directly from the user's browser, so Hyperliquid sees the user's IP address. If a user is in Dubai, they need a VPN to change their IP to a permitted location.

**Can we bypass it?**

**Short answer:** Yes, we can implement a solution that bypasses the geographic restrictions, but it requires some architectural changes.

**Two Options:**

### Option 1: Backend Proxy (Recommended)
We can implement a backend proxy/API gateway that:
- Runs on a server in a permitted location (e.g., US, Europe)
- Makes all Hyperliquid API calls from that server
- Users connect through our frontend → our backend → Hyperliquid
- Hyperliquid only sees the server's IP, not the user's IP

**Benefits:**
- ✅ Automatic bypass - users don't need VPN
- ✅ Works for all users regardless of location
- ✅ Better performance and caching possible
- ✅ More secure (can add rate limiting, validation, etc.)

**Trade-offs:**
- Requires backend infrastructure (API server)
- Slightly more complex architecture
- Trading orders still need to be signed by user's wallet (client-side)

### Option 2: Keep VPN Solution (Current)
- Users continue using VPN manually
- No code changes needed
- Works as-is

**Recommendation:**
For trading operations, users will still need their wallet connected (client-side), but we can route all data-fetching API calls (orderbook, prices, candles, etc.) through a backend proxy. This way:
- ✅ Data fetching is automatically bypassed
- ✅ Users in restricted regions can access the platform without VPN
- ✅ Trading orders are signed client-side (as required by Web3)

**Technical Details:**
The system would work like this:
1. User opens frontend (can be in Dubai)
2. Frontend calls our backend API (instead of Hyperliquid directly)
3. Backend (in permitted location) calls Hyperliquid API
4. Backend returns data to frontend
5. For trading: User signs orders with wallet → sent directly to Hyperliquid (this part still requires VPN or the backend proxy can also handle this)

Would you like us to implement Option 1 (Backend Proxy) to automatically bypass the geographic restrictions?






